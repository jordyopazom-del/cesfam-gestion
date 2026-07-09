import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Iniciando script de limpieza de PDFs...');
    
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        console.log(`📅 Buscando registros creados antes de: ${sevenDaysAgo.toISOString()}`);

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
                pdf_urls: true,
                created_at: true,
                professional_name: true
            }
        });

        console.log(`📋 Se encontraron ${requestsToClean.length} registros antiguos con PDFs.`);

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

            const hasBase64 = urls.some(url => url.startsWith('data:'));

            if (hasBase64) {
                console.log(`🧹 Limpiando base64 de solicitud ID: ${req.id} (${req.professional_name}) del ${new Date(req.created_at).toLocaleDateString()}`);
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

        console.log(`✅ Limpieza completada. Se eliminaron PDFs base64 en ${cleanedCount} registros.`);
    } catch (error: any) {
        console.error('❌ Error durante la limpieza de PDFs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
