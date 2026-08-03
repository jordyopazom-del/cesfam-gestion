const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Borrando ReportUploads...');
  const res = await prisma.reportUpload.deleteMany();
  console.log(`Borrados: ${res.count} registros.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
