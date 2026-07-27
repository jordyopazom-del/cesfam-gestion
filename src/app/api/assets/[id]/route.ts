import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const resolvedParams = await params;

    await prisma.asset.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "Error al eliminar el activo" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const resolvedParams = await params;
    const body = await req.json();
    const { name, description } = body;

    const updatedAsset = await prisma.asset.update({
      where: { id: resolvedParams.id },
      data: { name, description }
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    return NextResponse.json({ message: "Error al actualizar el activo" }, { status: 500 });
  }
}
