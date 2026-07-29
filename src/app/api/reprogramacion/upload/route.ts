import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const motivo = formData.get('motivo') as string || 'Subido manualmente por nómina (Urgencia)';
    
    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    if (workbook.SheetNames.length === 0) {
      return NextResponse.json({ error: 'El archivo Excel está vacío' }, { status: 400 });
    }

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

    // Buscadores dinámicos para tolerar ligeros cambios de columna
    let specialty = "Desconocida";
    let professionalName = "Desconocido";
    let professionalRut = "";
    let dateStr = new Date().toLocaleDateString('es-CL');

    // 1. Extraer Fecha (buscar "HOJA DIARIA MÓDULO" en las primeras 5 filas)
    for (let i = 0; i < 5; i++) {
      if (!rows[i]) continue;
      for (const cell of rows[i]) {
        if (typeof cell === 'string' && cell.includes('HOJA DIARIA MÓDULO')) {
          const match = cell.match(/\d{2}\/\d{2}\/\d{4}/);
          if (match) dateStr = match[0];
        }
      }
    }

    // 2. Extraer Especialidad y Profesional (buscar "ESPECIALIDAD:" y "PROFESIONAL:")
    for (let i = 0; i < 10; i++) {
      if (!rows[i]) continue;
      const rowStr = rows[i].map(c => String(c || '').trim().toUpperCase());
      
      const espIndex = rowStr.findIndex(c => c.includes('ESPECIALIDAD'));
      if (espIndex !== -1 && rows[i][espIndex + 1]) {
        specialty = rows[i].slice(espIndex + 1).find(c => String(c).trim() !== '') || specialty;
      }
      
      const profIndex = rowStr.findIndex(c => c.includes('PROFESIONAL'));
      if (profIndex !== -1 && rows[i][profIndex + 1]) {
        const profRaw = rows[i].slice(profIndex + 1).find(c => String(c).trim() !== '') || professionalName;
        // profRaw looks like: "AGÜERO HERNÁNDEZ KAREN ANDREA (17863299-K)"
        const match = String(profRaw).match(/(.*?)\((.*?)\)/);
        if (match) {
          professionalName = match[1].trim();
          professionalRut = match[2].trim();
        } else {
          professionalName = String(profRaw).trim();
        }
      }
    }

    // 3. Extraer pacientes (buscar cabecera "RUT")
    let headerRowIndex = -1;
    let rutCol = -1, nameCol = -1, horaCol = -1, phoneCol = -1;

    for (let i = 0; i < 15; i++) {
      if (!rows[i]) continue;
      const rowStr = rows[i].map(c => String(c || '').trim().toUpperCase());
      rutCol = rowStr.indexOf('RUT');
      
      if (rutCol !== -1) {
        headerRowIndex = i;
        nameCol = rowStr.indexOf('APELLIDOS Y NOMBRES');
        horaCol = rowStr.indexOf('HORA');
        phoneCol = rowStr.findIndex(c => c.includes('FONO'));
        break;
      }
    }

    if (headerRowIndex === -1 || rutCol === -1) {
      return NextResponse.json({ error: 'No se encontró la cabecera de pacientes (columna RUT) en el Excel.' }, { status: 400 });
    }

    const patients: any[] = [];
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const rut = String(row[rutCol] || '').trim();
      if (!rut || rut === 'undefined') continue; // Fila vacía o fin de tabla

      patients.push({
        rut: rut,
        fullName: String(row[nameCol] || 'Sin nombre').trim(),
        attentionDate: dateStr + (row[horaCol] ? ` ${row[horaCol]}` : ''),
        attentionType: specialty,
        contactPhones: String(row[phoneCol] || '').trim(),
        status: 'Pendiente'
      });
    }

    if (patients.length === 0) {
      return NextResponse.json({ error: 'No se encontraron pacientes válidos en la tabla.' }, { status: 400 });
    }

    // 4. Guardar en Base de Datos usando transacción
    const newBlock = await prisma.$transaction(async (tx) => {
      const block = await tx.agendaBlock.create({
        data: {
          professionalName,
          professionalRut,
          startDate: dateStr,
          reason: motivo,
          uploadedBy: session.email,
          status: 'Pendiente',
        }
      });

      await tx.blockedPatient.createMany({
        data: patients.map(p => ({
          blockId: block.id,
          ...p
        }))
      });

      return block;
    });

    return NextResponse.json({ success: true, blockId: newBlock.id, count: patients.length });

  } catch (error: any) {
    console.error('Error uploading nomina:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
