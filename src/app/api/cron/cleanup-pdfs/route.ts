import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        
        // Secure endpoint: only allow Vercel Cron or local development
        if (process.env.NODE_ENV === 'production' && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return new NextResponse('No autorizado', { status: 401 });
        }

        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        // Find records older than 10 days that have pdf_urls
        const requestsToClean = await prisma.agendaBlockRequest.findMany({
            where: {
                created_at: {
                    lt: tenDaysAgo
                },
                pdf_urls: {
                    not: null
                }
            },
            select: {
                id: true,
                pdf_urls: true
            }
        });

        let cleanedCount = 0;

        for (const req of requestsToClean) {
            if (!req.pdf_urls) continue;
            
            let urls: string[] = [];
            try {
                const parsed = JSON.parse(req.pdf_urls);
                urls = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                urls = [req.pdf_urls];
            }

            // Check if any URL contains a data URL (Base64 file) or if it has been marked as internal base64
            const hasBase64 = urls.some(url => url.startsWith('data:'));

            if (hasBase64) {
                // Replace base64 urls with 'INTERNAL_PDF_CLEANED'
                const cleanedUrls = urls.map(url => url.startsWith('data:') ? 'INTERNAL_PDF_CLEANED' : url);
                
                await prisma.agendaBlockRequest.update({
                    where: { id: req.id },
                    data: {
                        pdf_urls: JSON.stringify(cleanedUrls)
                    }
                });
                cleanedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Limpieza completada. Se eliminaron PDFs base64 en ${cleanedCount} registros antiguos.`,
            cleanedCount
        });
    } catch (error: any) {
        console.error('Error during cron cleanup-pdfs:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
