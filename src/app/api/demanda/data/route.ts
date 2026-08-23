import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    // Fetch all available uploads for the dropdown
    const availableUploads = await prisma.reportUpload.findMany({
      where: { reportType: 'DISTRIBUCION_OFERTA' },
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        uploadedAt: true
      }
    });

    if (availableUploads.length === 0) {
      return NextResponse.json({
        hasData: false,
        message: 'No hay reportes de demanda subidos.'
      });
    }

    // Determine which upload to fetch data for
    const targetUploadId = uploadId || availableUploads[0].id;

    const selectedUpload = await prisma.reportUpload.findUnique({
      where: { id: targetUploadId },
      include: {
        distribuciones: true
      }
    });

    if (!selectedUpload) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }

    // Extract all unique 'Tipos de Atención' across all distributions
    // to build the dropdown filters in the frontend.
    const uniqueTiposAtencion = new Set<string>();
    const uniquePoliclinicos = new Set<string>();

    selectedUpload.distribuciones.forEach(dist => {
      uniquePoliclinicos.add(dist.policlinico);
      const desglose = dist.desglose as Record<string, number>;
      Object.keys(desglose).forEach(key => {
        if (key.trim() !== '' && key.toUpperCase() !== 'TOTAL' && desglose[key] > 0) {
          uniqueTiposAtencion.add(key.trim());
        }
      });
    });

    return NextResponse.json({
      hasData: true,
      availablePeriods: availableUploads,
      uploadMeta: {
        id: selectedUpload.id,
        startDate: selectedUpload.startDate,
        endDate: selectedUpload.endDate,
        uploadedAt: selectedUpload.uploadedAt
      },
      filtros: {
        policlinicos: Array.from(uniquePoliclinicos).sort(),
        tiposAtencion: Array.from(uniqueTiposAtencion).sort()
      },
      distribuciones: selectedUpload.distribuciones
    });

  } catch (error: any) {
    console.error('Error fetching demanda data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
