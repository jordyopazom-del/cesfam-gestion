import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";


export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getSession();
    if (!session || !session.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
        where: { email: session.email },
    });

    if (currentUser?.role !== 'ADMIN') {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const { password } = await req.json();
        const userId = id;

        if (!password) {
            return NextResponse.json({ message: "La nueva contraseña es obligatoria" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ message: "Contraseña actualizada con éxito" });
    } catch (error) {
        console.error("Error updating password:", error);
        return NextResponse.json({ message: "Error al actualizar la contraseña" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getSession();
    if (!session || !session.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
        where: { email: session.email },
    });

    if (currentUser?.role !== 'ADMIN') {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const userId = id;

    if (!userId) {
        return NextResponse.json({ message: "ID de usuario requerido" }, { status: 400 });
    }

    try {
        // Prevent deleting yourself
        if (currentUser.id === userId) {
            return NextResponse.json({ message: "No puedes eliminar tu propia cuenta" }, { status: 400 });
        }

        // Manual cascade delete
        await prisma.balance.deleteMany({ where: { userId } });
        await prisma.solicitudAdministrativa.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ message: "Error al eliminar el usuario" }, { status: 500 });
    }
}
