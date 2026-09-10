const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: 'conny.gallardo98@gmail.com'
    }
  });
  console.log('User con email conny.gallardo98@gmail.com:', users);
}
main().finally(() => prisma.$disconnect());
