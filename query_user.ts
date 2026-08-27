import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.personnel.findMany({
    where: {
      name: {
        contains: 'CONSTANZA GALLARDO'
      }
    }
  });
  console.log('Personnel:', users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
