require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const testReservations = await prisma.reservation.findMany({
    where: {
      createdAt: {
        gte: todayStart
      }
    }
  });
  
  console.log(`Found ${testReservations.length} test reservations created today.`);
  
  if (testReservations.length > 0) {
    const ids = testReservations.map(r => r.id);
    
    await prisma.reservationAsset.deleteMany({
      where: {
        reservationId: { in: ids }
      }
    });
    
    const deleted = await prisma.reservation.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    console.log(`Deleted ${deleted.count} reservations.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
