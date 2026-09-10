const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.personnel.findMany({
    where: {
      name: {
        contains: 'CONSTANZA',
        mode: 'insensitive'
      }
    }
  });
  console.log('Resultados Personnel:', users);
  
  const usersLog = await prisma.personalLogistica.findMany({
    where: {
      nombre: {
        contains: 'CONSTANZA',
        mode: 'insensitive'
      }
    }
  });
  console.log('Resultados Logistica:', usersLog);
}
main().finally(() => prisma.$disconnect());
