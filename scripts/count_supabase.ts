import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Contando registros en Supabase...');
  
  const counts = {
    users: await prisma.user.count(),
    personnel: await prisma.personnel.count(),
    agendaBlockRequests: await prisma.agendaBlockRequest.count(),
    agendaOpenings: await prisma.agendaOpening.count(),
    solicitudesAdmin: await prisma.solicitudAdministrativa.count(),
    agendaBlocks: await prisma.agendaBlock.count(),
    blockedPatients: await prisma.blockedPatient.count(),
    demandRequests: await prisma.demandRequest.count(),
    demandAuditLogs: await prisma.demandAuditLog.count(),
  };

  console.log(counts);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
