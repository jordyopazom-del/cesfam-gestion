import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getUserByEmail } from "@/lib/auth-db";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const user = await getUserByEmail(session.email);
    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 401 });
    }

    const userId = user.id;
    const body = await req.json();
    const { roomId, startTime, endTime, assetIds, reason } = body;

    if (!roomId || !startTime || !endTime || !reason) {
      return NextResponse.json({ message: "Faltan datos requeridos, incluyendo el motivo" }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json({ message: "La hora de inicio debe ser anterior a la hora de fin" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({ 
      where: { id: roomId },
      include: { schedules: true }
    });
    if (!room) {
      return NextResponse.json({ message: "Sala no encontrada" }, { status: 404 });
    }

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const day = start.getDay(); // 0 = Dom, 1 = Lun, ..., 6 = Sab

    const daySchedules = room.schedules.filter(s => s.dayOfWeek === day);

    if (daySchedules.length === 0) {
      return NextResponse.json({ message: "La sala no está disponible en el día seleccionado" }, { status: 400 });
    }

    // Check if the requested time falls entirely within AT LEAST ONE of the available blocks
    const isWithinBlock = daySchedules.some(schedule => {
      const [sH, sM] = schedule.startTime.split(':').map(Number);
      const [eH, eM] = schedule.endTime.split(':').map(Number);
      const scheduleStartHour = sH + sM / 60;
      const scheduleEndHour = eH + eM / 60;
      
      return startHour >= scheduleStartHour && endHour <= scheduleEndHour;
    });

    if (!isWithinBlock) {
      const availableHoursStr = daySchedules.map(s => `${s.startTime}-${s.endTime}`).join(" y ");
      return NextResponse.json({ message: `Horario no disponible para este día. Los horarios permitidos son: ${availableHoursStr}` }, { status: 400 });
    }

    // Validación de solapamiento (Solo con reservas PENDIENTES o APROBADAS)
    const overlapping = await prisma.reservation.findFirst({
      where: {
        roomId,
        status: { not: "REJECTED" },
        OR: [
          {
            startTime: { lt: end },
            endTime: { gt: start }
          }
        ]
      }
    });

    if (overlapping) {
      return NextResponse.json({ message: "El horario se traslapa con otra reserva (Pendiente o Aprobada)" }, { status: 400 });
    }

    // Validación de solapamiento de ACTIVOS (Data, Telón, etc.) en CUALQUIER sala
    if (assetIds && assetIds.length > 0) {
      const overlappingAssetReservation = await prisma.reservation.findFirst({
        where: {
          status: { not: "REJECTED" },
          OR: [
            {
              startTime: { lt: end },
              endTime: { gt: start }
            }
          ],
          assets: {
            some: {
              assetId: { in: assetIds }
            }
          }
        },
        include: {
          assets: { include: { asset: true } }
        }
      });

      if (overlappingAssetReservation) {
        const overlappingAsset = overlappingAssetReservation.assets.find((a: any) => assetIds.includes(a.assetId));
        return NextResponse.json({ 
          message: `El activo extra '${overlappingAsset?.asset?.name || "solicitado"}' ya está reservado en este horario por otra sala.` 
        }, { status: 400 });
      }
    }

    // Crear la reserva
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        roomId,
        startTime: start,
        endTime: end,
        reason,
        status: "PENDING",
        assets: {
          create: (assetIds || []).map((id: string) => ({
            asset: { connect: { id } }
          }))
        }
      }
    });

    return NextResponse.json({ message: "Reserva solicitada", reservation }, { status: 201 });
  } catch (error) {
    console.error("Error creating reservation", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
