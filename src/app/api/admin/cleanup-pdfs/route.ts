import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserByEmail } from '@/lib/auth-db';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const session = await getSession();
        if (!session || !session.email) {
            return new NextResponse('No autorizado', { status: 401 });
        }

        const user = await getUserByEmail(session.email);
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'Admin' || session.email === 'kkoandres@gmail.com';

        if (!isAdmin) {
            return new NextResponse('No autorizado', { status: 403 });
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Find records older than 7 days that have pdf_urls
        const requestsToClean = await prisma.agendaBlockRequest.findMany({
            where: {
                created_at: {
                    lt: sevenDaysAgo
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

            // Check if any URL contains a data URL (Base64 file)
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
            message: `Limpieza completada con éxito. Se eliminaron PDFs base64 en ${cleanedCount} registros con antigüedad superior a 7 días.`,
            cleanedCount
        });
    } catch (error: any) {
        console.error('Error in manual pdf cleanup API:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
