import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando inyección definitiva a Railway...');
  
  const dumpPath = path.join(process.cwd(), 'full_dump.json');
  if (!fs.existsSync(dumpPath)) {
    throw new Error('No se encontró full_dump.json');
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));

  // 1. Users
  if (dump.users) {
    console.log(`Inyectando ${dump.users.length} usuarios...`);
    await prisma.user.createMany({ data: dump.users, skipDuplicates: true });
  }

  // 2. Personnel
  if (dump.personnel) {
    console.log(`Inyectando ${dump.personnel.length} profesionales...`);
    await prisma.personnel.createMany({ data: dump.personnel, skipDuplicates: true });
  }

  // 3. DemandRequests
  if (dump.demandRequests) {
    console.log(`Inyectando ${dump.demandRequests.length} DemandRequests...`);
    await prisma.demandRequest.createMany({ data: dump.demandRequests, skipDuplicates: true });
  }

  // 4. DemandAuditLogs
  if (dump.demandAuditLogs) {
    console.log(`Inyectando ${dump.demandAuditLogs.length} DemandAuditLogs...`);
    await prisma.demandAuditLog.createMany({ data: dump.demandAuditLogs, skipDuplicates: true });
  }

  // 5. AgendaBlockRequest (AQUI LIMPIAMOS LOS PDFS)
  if (dump.agendaBlockRequests) {
    console.log(`Inyectando ${dump.agendaBlockRequests.length} AgendaBlockRequests (Limpiando PDFs)...`);
    const cleanBlocks = dump.agendaBlockRequests.map((b: any) => {
      // Limpiamos los campos pesados
      b.pdf_urls = null;
      return b;
    });
    await prisma.agendaBlockRequest.createMany({ data: cleanBlocks, skipDuplicates: true });
  }

  // 6. AgendaOpening
  if (dump.agendaOpenings) {
    console.log(`Inyectando ${dump.agendaOpenings.length} AgendaOpenings...`);
    await prisma.agendaOpening.createMany({ data: dump.agendaOpenings, skipDuplicates: true });
  }

  // 7. Solicitudes Administrativas
  if (dump.solicitudesAdmin) {
    console.log(`Inyectando ${dump.solicitudesAdmin.length} Solicitudes Administrativas...`);
    await prisma.solicitudAdministrativa.createMany({ data: dump.solicitudesAdmin, skipDuplicates: true });
  }

  console.log('✅ Inyección definitiva completada con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
