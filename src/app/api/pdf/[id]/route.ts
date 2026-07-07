import { NextResponse } from 'next/server';
import { getPdfById } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.email) {
            return new NextResponse('No autorizado', { status: 401 });
        }
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const indexStr = searchParams.get('index');
        const index = indexStr ? parseInt(indexStr) : 0;
        
        const pdfArray = await getPdfById(id);

        if (!pdfArray || pdfArray.length === 0 || !pdfArray[index]) {
            return new NextResponse('PDF not found', { status: 404 });
        }

        const pdfData = pdfArray[index];

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
