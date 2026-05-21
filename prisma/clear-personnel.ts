import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando tablas de funcionarios en ambas bases de datos...');
  
  const deletedPersonnelCount = await prisma.personnel.deleteMany({});
  console.log(`Deleted ${deletedPersonnelCount.count} records from Personnel`);
  
  const deletedLogisticaCount = await prisma.personalLogistica.deleteMany({});
  console.log(`Deleted ${deletedLogisticaCount.count} records from PersonalLogistica`);
  
  console.log('✨ Tablas limpiadas con éxito.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error al limpiar las tablas:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
