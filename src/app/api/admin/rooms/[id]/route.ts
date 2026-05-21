import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getUserByEmail } from "@/lib/auth-db";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const resolvedParams = await params;
    const id = resolvedParams.id;

    await prisma.room.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Sala eliminada" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
