import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando volcado desde Neon (Producción Real)...');
  const dump: Record<string, any> = {};

  try {
    console.log('Descargando Users...');
    dump.users = await prisma.user.findMany();
    
    console.log('Descargando Personnel...');
    dump.personnel = await prisma.personnel.findMany();
    
    console.log('Descargando AgendaBlockRequest...');
    dump.agendaBlockRequests = await prisma.agendaBlockRequest.findMany();
    
    console.log('Descargando AgendaOpening...');
    dump.agendaOpenings = await prisma.agendaOpening.findMany();
    
    console.log('Descargando Solicitudes Administrativas...');
    dump.solicitudesAdmin = await prisma.solicitudAdministrativa.findMany();
    
    console.log('Descargando DemandRequest...');
    dump.demandRequests = await prisma.demandRequest.findMany();
    
    console.log('Descargando DemandAuditLog...');
    dump.demandAuditLogs = await prisma.demandAuditLog.findMany();

    const dumpPath = path.join(process.cwd(), 'full_dump.json');
    fs.writeFileSync(dumpPath, JSON.stringify(dump, null, 2), 'utf-8');
    console.log(`✅ Volcado completo guardado en ${dumpPath}`);
    
  } catch (error) {
    console.error('Error durante el volcado:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
