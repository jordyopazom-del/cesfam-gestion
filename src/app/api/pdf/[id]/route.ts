import { NextResponse } from 'next/server';
import { getPdfById } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const indexStr = searchParams.get('index');
        const token = searchParams.get('token');
        const index = indexStr ? parseInt(indexStr) : 0;

        const pdfArray = await getPdfById(id);

        if (!pdfArray || pdfArray.length === 0 || !pdfArray[index]) {
            return new NextResponse('PDF not found', { status: 404 });
        }

        const pdfData = pdfArray[index];

        if (pdfData === 'INTERNAL_PDF_CLEANED') {
            return new NextResponse(
                `<!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Documento Optimizado / Eliminado</title>
                    <style>
                        body {
                            font-family: system-ui, -apple-system, sans-serif;
                            background-color: #f8fafc;
                            color: #1e293b;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                        }
                        .card {
                            background: white;
                            padding: 40px;
                            border-radius: 24px;
                            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                            max-width: 500px;
                            text-align: center;
                            border: 1px solid #e2e8f0;
                        }
                        .icon {
                            font-size: 48px;
                            margin-bottom: 20px;
                        }
                        h1 {
                            font-size: 20px;
                            font-weight: 800;
                            margin-bottom: 12px;
                            color: #0f172a;
                        }
                        p {
                            font-size: 14px;
                            line-height: 1.6;
                            color: #64748b;
                            margin-bottom: 24px;
                        }
                        .badge {
                            display: inline-block;
                            padding: 6px 12px;
                            background-color: #f1f5f9;
                            color: #475569;
                            border-radius: 8px;
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="icon">🗑️</div>
                        <h1>Respaldo Eliminado por Antigüedad</h1>
                        <p>
                            Este archivo PDF de respaldo ha sido eliminado automáticamente tras transcurrir <strong>7 días</strong> desde su creación, con el fin de optimizar el almacenamiento del servidor.
                        </p>
                        <p>
                            El registro administrativo de la solicitud y toda su trazabilidad siguen estando completamente disponibles en el sistema de agendas.
                        </p>
                        <span class="badge">Almacenamiento Optimizado</span>
                    </div>
                </body>
                </html>`,
                {
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                    },
                }
            );
        }

        // If it's a data URL, we need to extract the base64 part and the content type
        if (pdfData.startsWith('data:')) {
            const matches = pdfData.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) {
                return new NextResponse('Invalid PDF format', { status: 500 });
            }

            const contentType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `inline; filename="documento-${index + 1}.pdf"`,
                },
            });
        }

        // Fallback or old legacy URLs
        return NextResponse.redirect(new URL(pdfData, request.url));
    } catch (error) {
        console.error('Error serving PDF:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
