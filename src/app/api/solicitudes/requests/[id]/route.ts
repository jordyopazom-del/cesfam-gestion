import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || !session.email) return new NextResponse("Unauthorized", { status: 401 });

    // Check if user is ADMIN
    const user = await prisma.user.findUnique({
        where: { email: session.email },
    });

    if (user?.role !== 'ADMIN') {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const { status } = await req.json();
    const { id: requestId } = await params;

    const request = await prisma.solicitudAdministrativa.findUnique({
        where: { id: requestId },
        include: { user: { include: { balances: true } } }
    });

    if (!request) return new NextResponse("Request not found", { status: 404 });

    // Prevent re-processing already approved or rejected requests
    if (request.status !== 'PENDING') {
        return NextResponse.json({ message: "Esta solicitud ya ha sido procesada." }, { status: 400 });
    }

    if (status === 'APPROVED') {
        const needsBalance = ['ADMINISTRATIVO', 'FERIADO LEGAL', 'CAPACITACION', 'SIN_GOCE', 'MATRIMONIO', 'NACIMIENTO', 'FALLECIMIENTO_CONYUGE', 'FALLECIMIENTO_PARIENTE', 'FALLECIMIENTO_HIJO'].includes(request.type.toUpperCase());

        if (needsBalance) {
            const balance = request.user.balances.find(b => b.type === request.type);
            if (!balance || balance.remaining < request.days) {
                return new NextResponse("Insufficient balance", { status: 400 });
            }

            // Atomic update: Approve and deduct balance
            await prisma.$transaction([
                prisma.solicitudAdministrativa.update({
                    where: { id: requestId },
                    data: { status: 'APPROVED' }
                }),
                prisma.balance.update({
                    where: { id: balance.id },
                    data: {
                        used: { increment: request.days },
                        remaining: { decrement: request.days }
                    }
                })
            ]);
            console.log(`[SIMULACIÓN CORREO] Enviado a: ${request.user.email}`);
            console.log(`Su solicitud de ${request.type} ha sido APROBADA.`);
            console.log(`Días utilizados: ${request.days}. Días restantes: ${balance.remaining - request.days}`);
        } else {
            // No balance deduction needed (e.g., Licencia o Permiso Especial)
            await prisma.solicitudAdministrativa.update({
                where: { id: requestId },
                data: { status: 'APPROVED' }
            });
            console.log(`[SIMULACIÓN CORREO] Enviado a: ${request.user.email}`);
            console.log(`Su solicitud de ${request.type} ha sido APROBADA.`);
        }

    } else if (status === 'REJECTED') {
        await prisma.solicitudAdministrativa.update({
            where: { id: requestId },
            data: { status: 'REJECTED' }
        });

        console.log(`[SIMULACIÓN CORREO] Enviado a: ${request.user.email}`);
        console.log(`Su solicitud de ${request.type} ha sido RECHAZADA.`);
    }

    return NextResponse.json({ success: true });
}
