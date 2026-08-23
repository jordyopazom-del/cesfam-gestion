import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const id = resolvedParams.id;

    // Use a transaction to safely delete child distributions first, then the upload
    await prisma.$transaction(async (tx) => {
      await tx.distribucionAtencion.deleteMany({
        where: { reportUploadId: id }
      });
      
      await tx.reportUpload.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: 'Reporte eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: error.message || 'Error eliminando el reporte' }, { status: 500 });
  }
}
