import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getUserByEmail } from "@/lib/auth-db";
import { sendEmail } from "@/lib/email-service";
import { format } from "date-fns";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const body = await req.json();
    const { status } = body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ message: "Estado inválido" }, { status: 400 });
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        room: true,
        user: true,
        assets: { include: { asset: true } }
      }
    });

    if (status === "APPROVED" && reservation.user.email) {
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 20px;">Reserva de Sala Aprobada</h1>
            </div>
            <div style="padding: 20px; color: #374151; line-height: 1.6;">
                <p>Estimado/a ${reservation.user.name || "Usuario"},</p>
                <p>Nos complace informarle que su solicitud de reserva ha sido <strong>APROBADA</strong>.</p>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Sala:</strong> ${reservation.room.name}</p>
                    <p style="margin: 5px 0;"><strong>Fecha:</strong> ${format(reservation.startTime, "dd/MM/yyyy")}</p>
                    <p style="margin: 5px 0;"><strong>Horario:</strong> ${format(reservation.startTime, "HH:mm")} a ${format(reservation.endTime, "HH:mm")}</p>
                    <p style="margin: 5px 0;"><strong>Motivo:</strong> ${reservation.reason || "-"}</p>
                    <p style="margin: 5px 0;"><strong>Activos Adicionales:</strong> ${reservation.assets.map((a: any) => a.asset.name).join(", ") || "Ninguno"}</p>
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                    Este es un correo automático del Sistema CESFAM Gestión. Por favor no responder.
                </p>
            </div>
        </div>
      `;

      await sendEmail({
        to: [reservation.user.email],
        subject: `Reserva Aprobada: ${reservation.room.name}`,
        html: emailHtml,
        fromName: user.name || undefined,
        replyTo: user.email || undefined
      });
    }

    return NextResponse.json({ message: "Solicitud procesada" }, { status: 200 });
  } catch (error) {
    console.error("Error processing reservation", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
