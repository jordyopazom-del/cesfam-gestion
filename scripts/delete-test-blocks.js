require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const blocks = await prisma.agendaBlock.findMany({
    where: {
      professionalName: {
        contains: 'JORDY HERALDO OPAZO',
        mode: 'insensitive'
      }
    }
  });
  
  console.log(`Found ${blocks.length} test blocks for Jordy.`);
  
  if (blocks.length > 0) {
    const ids = blocks.map(b => b.id);
    
    // Delete patients first
    const deletedPatients = await prisma.blockedPatient.deleteMany({
      where: {
        blockId: { in: ids }
      }
    });
    console.log(`Deleted ${deletedPatients.count} patients.`);
    
    // Delete blocks
    const deletedBlocks = await prisma.agendaBlock.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    console.log(`Deleted ${deletedBlocks.count} blocks.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
