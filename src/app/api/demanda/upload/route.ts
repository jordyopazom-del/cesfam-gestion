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

    const user = await prisma.user.findUnique({ where: { email: session.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse the Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Read raw rows including blank rows
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    let startDateStr = "";
    let endDateStr = "";
    let headerIndex = -1;

    // Find dates and header row
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      if (rows[i] && rows[i][0] && typeof rows[i][0] === 'string') {
        const firstCol = rows[i][0].trim().toUpperCase();
        if (firstCol.includes('DESDE')) startDateStr = rows[i][1];
        if (firstCol.includes('HASTA')) endDateStr = rows[i][1];
        if (firstCol === 'NOMBRE PROFESIONAL') {
          headerIndex = i;
        }
      }
    }

    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ error: 'No se encontraron las fechas DESDE y HASTA en el archivo.' }, { status: 400 });
    }
    
    if (headerIndex === -1) {
      return NextResponse.json({ error: 'No se encontró la fila de encabezados (NOMBRE PROFESIONAL).' }, { status: 400 });
    }

    // Parse DD/MM/YYYY strings to Date objects
    const parseDateStr = (str: string) => {
      const parts = str.trim().split('/');
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
      }
      return new Date();
    };

    const startDate = parseDateStr(startDateStr);
    const endDate = parseDateStr(endDateStr);

    const headers = rows[headerIndex] as string[];
    const dataRows = rows.slice(headerIndex + 1);

    const distribuciones: any[] = [];

    for (const row of dataRows) {
      // Break if we hit an empty row or a total row at the bottom
      if (!row || row.length === 0 || !row[0]) continue;
      const profesional = row[0].toString().trim();
      if (profesional.toUpperCase() === 'TOTAL' || profesional === '') continue;

      const policlinico = row[1] ? row[1].toString().trim() : 'SIN ESPECIFICAR';
      
      const desglose: Record<string, number> = {};
      let total = 0;

      for (let j = 2; j < headers.length; j++) {
        const headerName = headers[j];
        if (!headerName || headerName.trim() === '') continue;
        const val = parseInt(row[j] || 0, 10) || 0;
        
        if (headerName.toUpperCase() === 'TOTAL') {
          total = val;
        } else {
          desglose[headerName.trim()] = val;
        }
      }

      distribuciones.push({
        profesional,
        policlinico,
        desglose,
        total
      });
    }

    // Use a Prisma transaction to handle the upsert logic
    await prisma.$transaction(async (tx) => {
      // Find if an upload already exists for these dates
      const existingUpload = await tx.reportUpload.findFirst({
        where: {
          reportType: 'DISTRIBUCION_OFERTA',
          startDate,
          endDate,
        }
      });

      let uploadId = '';

      if (existingUpload) {
        // Overwrite: delete existing records and reuse the upload record
        await tx.distribucionAtencion.deleteMany({
          where: { reportUploadId: existingUpload.id }
        });
        
        // Update the uploadedBy and uploadedAt
        await tx.reportUpload.update({
          where: { id: existingUpload.id },
          data: {
            uploadedBy: user.id,
            uploadedAt: new Date()
          }
        });
        
        uploadId = existingUpload.id;
      } else {
        // Create new upload record
        const newUpload = await tx.reportUpload.create({
          data: {
            reportType: 'DISTRIBUCION_OFERTA',
            startDate,
            endDate,
            uploadedBy: user.id,
          }
        });
        uploadId = newUpload.id;
      }

      // Insert the new distributions
      if (distribuciones.length > 0) {
        await tx.distribucionAtencion.createMany({
          data: distribuciones.map(d => ({
            reportUploadId: uploadId,
            profesional: d.profesional,
            policlinico: d.policlinico,
            desglose: d.desglose,
            total: d.total
          }))
        });
      }
    });

    return NextResponse.json({ success: true, count: distribuciones.length, startDate, endDate });

  } catch (error: any) {
    console.error('Error procesando Excel:', error);
    return NextResponse.json({ error: error.message || 'Error procesando el archivo' }, { status: 500 });
  }
}
