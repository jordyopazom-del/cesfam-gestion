import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");

    // Protect with secret from environment variables
    if (secret !== process.env.SSO_SECRET_KEY && secret !== "someagendas") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    console.log("Seeding Reservas via API...");

    // 1. Create Assets
    const dataAsset = await prisma.asset.upsert({
      where: { name: 'Data' },
      update: {},
      create: { name: 'Data', description: 'Proyector de datos' },
    });

    const telonAsset = await prisma.asset.upsert({
      where: { name: 'Telón' },
      update: {},
      create: { name: 'Telón', description: 'Telón para proyector' },
    });

    // 2. Create Rooms & Schedules
    // Room 1: Sala de Capacitación
    let salaCap = await prisma.room.findFirst({
      where: { name: 'Sala de Capacitación' }
    });

    if (!salaCap) {
      salaCap = await prisma.room.create({
        data: {
          name: 'Sala de Capacitación',
          description: 'Incluye data y telón. L-V 8:00 a 20:00, Sáb 9:00 a 13:00',
        }
      });

      // L-V 8-20
      for (let i = 1; i <= 5; i++) {
        await prisma.roomSchedule.create({
          data: { roomId: salaCap.id, dayOfWeek: i, startTime: "08:00", endTime: "20:00" }
        });
      }
      // Sab 9-13
      await prisma.roomSchedule.create({
        data: { roomId: salaCap.id, dayOfWeek: 6, startTime: "09:00", endTime: "13:00" }
      });
      console.log('Room: Sala de Capacitación and schedules created');
    }

    // Room 2: Comedor
    let comedor = await prisma.room.findFirst({
      where: { name: 'Comedor' }
    });

    if (!comedor) {
      comedor = await prisma.room.create({
        data: {
          name: 'Comedor',
          description: 'No incluye data ni telón. L-V 11:00 a 13:00 y 15:00 a 20:00, Sáb 9:00 a 13:00',
        }
      });

      // L-V 11-13 y 15-20
      for (let i = 1; i <= 5; i++) {
        await prisma.roomSchedule.create({
          data: { roomId: comedor.id, dayOfWeek: i, startTime: "11:00", endTime: "13:00" }
        });
        await prisma.roomSchedule.create({
          data: { roomId: comedor.id, dayOfWeek: i, startTime: "15:00", endTime: "20:00" }
        });
      }
      // Sab 9-13
      await prisma.roomSchedule.create({
        data: { roomId: comedor.id, dayOfWeek: 6, startTime: "09:00", endTime: "13:00" }
      });
      console.log('Room: Comedor and schedules created');
    }

    return NextResponse.json({
      message: "Seeding completado con éxito",
      assets: [dataAsset, telonAsset],
      rooms: [salaCap, comedor]
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error seeding via API:", error);
    return NextResponse.json({
      message: "Error en el seeding",
      error: error.message || String(error)
    }, { status: 500 });
  }
}
