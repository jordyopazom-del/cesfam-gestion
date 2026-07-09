import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserByEmail } from '@/lib/auth-db';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
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

        // Fetch all requests that have any value in pdf_urls
        const requests = await prisma.agendaBlockRequest.findMany({
            where: {
                pdf_urls: {
                    not: null
                }
            },
            select: {
                id: true,
                created_at: true,
                professional_name: true,
                pdf_urls: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        const debugInfo = requests.map(req => {
            let urls: string[] = [];
            try {
                const parsed = JSON.parse(req.pdf_urls || '[]');
                urls = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                if (req.pdf_urls) urls = [req.pdf_urls];
            }

            const hasBase64 = urls.some(url => url.startsWith('data:'));
            const preview = req.pdf_urls ? req.pdf_urls.substring(0, 150) : '';

            return {
                id: req.id,
                professionalName: req.professional_name,
                createdAtInDB: req.created_at,
                rawPdfUrlsLength: req.pdf_urls ? req.pdf_urls.length : 0,
                urlsCount: urls.length,
                hasBase64,
                parsedUrlsPreview: urls.map(u => u.substring(0, 60)),
                rawPreview: preview
            };
        });

        return NextResponse.json({
            count: debugInfo.length,
            records: debugInfo
        });
    } catch (error: any) {
        console.error('Error in debug-db endpoint:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
