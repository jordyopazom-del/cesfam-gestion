import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('range'); // 'all', 'last_month', etc.

    // Fetch the most recent report or all reports
    const uploads = await prisma.reportUpload.findMany({
      where: { reportType: 'DISTRIBUCION_OFERTA' },
      include: {
        distribuciones: true
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    // Aggregate data across all fetched uploads
    // We want to return aggregated totals for Recharts
    
    // Aggregation 1: Total by category
    const categoryTotals: Record<string, number> = {};
    
    // Aggregation 2: Total by policlinico
    const policlinicoData: Record<string, any> = {};

    uploads.forEach(upload => {
      upload.distribuciones.forEach(dist => {
        // Categories
        const desglose = dist.desglose as Record<string, number>;
        Object.entries(desglose).forEach(([key, value]) => {
          if (value > 0) {
            categoryTotals[key] = (categoryTotals[key] || 0) + value;
          }
        });

        // Policlinico distribution
        const poli = dist.policlinico;
        if (!policlinicoData[poli]) {
          policlinicoData[poli] = { name: poli, total: 0 };
        }
        
        Object.entries(desglose).forEach(([key, value]) => {
          if (value > 0) {
            policlinicoData[poli][key] = (policlinicoData[poli][key] || 0) + value;
            policlinicoData[poli].total += value;
          }
        });
      });
    });

    const categoryArray = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const policlinicoArray = Object.values(policlinicoData)
      .sort((a: any, b: any) => b.total - a.total);

    return NextResponse.json({
      uploadsMeta: uploads.map(u => ({ id: u.id, startDate: u.startDate, endDate: u.endDate, uploadedAt: u.uploadedAt })),
      categoryData: categoryArray,
      policlinicoData: policlinicoArray
    });

  } catch (error: any) {
    console.error('Error fetching demanda data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
