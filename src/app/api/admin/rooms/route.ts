import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getUserByEmail } from "@/lib/auth-db";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const user = await getUserByEmail(session.email);
    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 401 });
    }

    const isAdmin = user.role === "ADMIN" || user.role === "Admin" || session.email === "kkoandres@gmail.com";
    if (!isAdmin) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const rooms = await prisma.room.findMany({
      include: { schedules: true }
    });

    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

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

    const isAdmin = user.role === "ADMIN" || user.role === "Admin" || session.email === "kkoandres@gmail.com";
    if (!isAdmin) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, schedules } = body;

    if (!name || !schedules || !Array.isArray(schedules)) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    const room = await prisma.room.create({
      data: {
        name,
        description,
        schedules: {
          create: schedules.map((s: any) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime
          }))
        }
      }
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
