import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch ONLY the most recent report to serve as the "current free slots" (cupos libres actuales)
    const latestUpload = await prisma.reportUpload.findFirst({
      where: { reportType: 'DISTRIBUCION_OFERTA' },
      include: {
        distribuciones: true
      },
      orderBy: {
        startDate: 'desc' // Get the most recent date
      }
    });

    if (!latestUpload) {
      return NextResponse.json({
        hasData: false,
        message: 'No hay reportes de demanda subidos.'
      });
    }

    // Extract all unique 'Tipos de Atención' across all distributions
    // to build the dropdown filters in the frontend.
    const uniqueTiposAtencion = new Set<string>();
    const uniquePoliclinicos = new Set<string>();

    latestUpload.distribuciones.forEach(dist => {
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
      uploadMeta: {
        id: latestUpload.id,
        startDate: latestUpload.startDate,
        endDate: latestUpload.endDate,
        uploadedAt: latestUpload.uploadedAt
      },
      filtros: {
        policlinicos: Array.from(uniquePoliclinicos).sort(),
        tiposAtencion: Array.from(uniqueTiposAtencion).sort()
      },
      distribuciones: latestUpload.distribuciones
    });

  } catch (error: any) {
    console.error('Error fetching demanda data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
