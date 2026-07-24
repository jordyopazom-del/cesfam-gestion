import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const { professionalName, startDate, reason, patients, uploadedBy } = data;

    if (!professionalName || !patients || !Array.isArray(patients)) {
      return NextResponse.json({ error: 'Faltan datos obligatorios (professionalName, patients)' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const existingBlock = await prisma.agendaBlock.findFirst({
      where: {
        professionalName,
        startDate: startDate || new Date().toISOString()
      }
    });

    let block;
    if (existingBlock) {
      block = existingBlock;
      await prisma.blockedPatient.deleteMany({
        where: { blockId: existingBlock.id }
      });
      await prisma.blockedPatient.createMany({
        data: patients.map((p: any) => ({
          blockId: existingBlock.id,
          rut: p.rut || 'S/N',
          fullName: p.fullName || 'Desconocido',
          attentionType: p.attentionType || 'Consulta',
          attentionDate: p.attentionDate || '',
          contactPhones: p.contactPhones || '',
          status: 'Pendiente'
        }))
      });
    } else {
      block = await prisma.agendaBlock.create({
        data: {
          professionalName,
          startDate: startDate || new Date().toISOString(),
          reason: reason || 'Bloqueo reportado vía extensión RAS',
          uploadedBy: uploadedBy || 'Extensión RAS',
          status: 'Pendiente',
          patients: {
            create: patients.map((p: any) => ({
              rut: p.rut || 'S/N',
              fullName: p.fullName || 'Desconocido',
              attentionType: p.attentionType || 'Consulta',
              attentionDate: p.attentionDate || '',
              contactPhones: p.contactPhones || '',
              status: 'Pendiente'
            }))
          }
        }
      });
    }

    revalidatePath('/reprogramacion');

    return NextResponse.json({ success: true, blockId: block.id }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    console.error('Error sincronizando bloque RAS:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
