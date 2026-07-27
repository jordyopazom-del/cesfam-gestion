import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const assets = await prisma.asset.findMany();
  if (assets.length === 0) {
      console.log('No assets found, creating defaults...');
      await prisma.asset.createMany({
          data: [
              { name: 'Data', description: 'Proyector multimedia' },
              { name: 'Telón', description: 'Telón para proyector' },
              { name: 'Computador', description: 'Computador portátil o de escritorio' }
          ],
          skipDuplicates: true
      });
      console.log('Created defaults.');
  } else {
      console.log('Assets found:', assets.length);
  }
}
run();
