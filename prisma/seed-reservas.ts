import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Reservas...')

  // 1. Create Assets
  const dataAsset = await prisma.asset.upsert({
    where: { name: 'Data' },
    update: {},
    create: { name: 'Data', description: 'Proyector de datos' },
  })

  const telonAsset = await prisma.asset.upsert({
    where: { name: 'Telón' },
    update: {},
    create: { name: 'Telón', description: 'Telón para proyector' },
  })

  console.log('Assets created or validated')

  // 2. Create Rooms & Schedules
  // Room 1: Sala de Capacitación
  let salaCap = await prisma.room.findFirst({
    where: { name: 'Sala de Capacitación' }
  })

  if (!salaCap) {
    salaCap = await prisma.room.create({
      data: {
        name: 'Sala de Capacitación',
        description: 'Incluye data y telón. L-V 8:00 a 20:00, Sáb 9:00 a 13:00',
      }
    })

    // L-V 8-20
    for (let i = 1; i <= 5; i++) {
      await prisma.roomSchedule.create({
        data: { roomId: salaCap.id, dayOfWeek: i, startTime: "08:00", endTime: "20:00" }
      })
    }
    // Sab 9-13
    await prisma.roomSchedule.create({
      data: { roomId: salaCap.id, dayOfWeek: 6, startTime: "09:00", endTime: "13:00" }
    })
    console.log('Room: Sala de Capacitación and schedules created')
  }

  // Room 2: Comedor
  let comedor = await prisma.room.findFirst({
    where: { name: 'Comedor' }
  })

  if (!comedor) {
    comedor = await prisma.room.create({
      data: {
        name: 'Comedor',
        description: 'No incluye data ni telón. L-V 11:00 a 13:00 y 15:00 a 20:00, Sáb 9:00 a 13:00',
      }
    })

    // L-V 11-13 y 15-20
    for (let i = 1; i <= 5; i++) {
      await prisma.roomSchedule.create({
        data: { roomId: comedor.id, dayOfWeek: i, startTime: "11:00", endTime: "13:00" }
      })
      await prisma.roomSchedule.create({
        data: { roomId: comedor.id, dayOfWeek: i, startTime: "15:00", endTime: "20:00" }
      })
    }
    // Sab 9-13
    await prisma.roomSchedule.create({
      data: { roomId: comedor.id, dayOfWeek: 6, startTime: "09:00", endTime: "13:00" }
    })
    console.log('Room: Comedor and schedules created')
  }

  console.log('Reservas seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
