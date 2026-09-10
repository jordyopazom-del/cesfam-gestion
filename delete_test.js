const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.personnel.delete({
    where: { name: 'CONSTANZA GALLARDO GOME' }
  });
  console.log("Deleted!");
}
main().finally(() => prisma.$disconnect());
