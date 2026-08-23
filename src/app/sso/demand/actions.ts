"use server";

import { prisma } from "@/lib/prisma";
import { getSSOUser } from "@/lib/sso-session";
import { revalidatePath } from "next/cache";

export async function getDemandsByOrigin(origin: "Rechazo" | "Derivación Interna" | null = null) {
  try {
    const user = await getSSOUser();
    if (!user) return { success: false, error: "No autenticado. Por favor inicie sesión." };

    const where = origin ? { origin } : {};
    const demands = await prisma.demandRequest.findMany({
      where,
      orderBy: [{ requestDate: "asc" }],
      include: { auditLogs: { select: { timestamp: true, newValue: true, changedBy: true, demandRequestId: true } } },
    });
    return { success: true, data: demands };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAllDemands() {
  try {
    const user = await getSSOUser();
    if (!user) return { success: false, error: "No autenticado. Por favor inicie sesión." };

    const demands = await prisma.demandRequest.findMany({
      include: { auditLogs: { select: { timestamp: true, newValue: true, changedBy: true, demandRequestId: true } } },
      orderBy: { requestDate: "asc" },
    });
    return { success: true, data: demands };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateDemandStatus(id: number, status: string) {
  try {
    const user = await getSSOUser();
    if (!user) {
      return { success: false, error: "Su sesión ha expirado. No se guardaron los cambios. Inicie sesión nuevamente." };
    }

    await prisma.demandRequest.update({
      where: { id },
      data: { status },
    });

    try {
      await prisma.demandAuditLog.create({
        data: { demandRequestId: id, newValue: status, changedBy: user.name },
      });
    } catch {
      // Si falla el log, no rompemos la transacción pero se conserva la auditoría
    }

    revalidatePath("/sso/rechazos");
    revalidatePath("/sso/derivaciones");
    revalidatePath("/sso/telesalud");
    revalidatePath("/sso/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getTelesaludDemands() {
  try {
    const user = await getSSOUser();
    if (!user) return { success: false, error: "No autenticado. Por favor inicie sesión." };

    const demands = await prisma.demandRequest.findMany({
      where: { status: "💻 Telesalud" },
      orderBy: [{ requestDate: "asc" }],
      include: { auditLogs: { select: { timestamp: true, newValue: true, changedBy: true, demandRequestId: true } } },
    });
    return { success: true, data: demands };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateDemandNotes(id: number, notes: string) {
  try {
    const user = await getSSOUser();
    if (!user) {
      return { success: false, error: "Su sesión ha expirado. No se guardaron las notas. Inicie sesión nuevamente." };
    }

    await prisma.demandRequest.update({
      where: { id },
      data: { notes },
    });

    try {
      await prisma.demandAuditLog.create({
        data: { demandRequestId: id, newValue: `📝 Nota: ${notes}`, changedBy: user.name },
      });
    } catch { /* audit log opcional */ }

    revalidatePath("/sso/rechazos");
    revalidatePath("/sso/derivaciones");
    revalidatePath("/sso/telesalud");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateDemandObservation(id: number, observation: string) {
  try {
    const user = await getSSOUser();
    if (!user) {
      return { success: false, error: "Su sesión ha expirado. No se guardó el teléfono. Inicie sesión nuevamente." };
    }

    await prisma.demandRequest.update({
      where: { id },
      data: { observation },
    });

    try {
      await prisma.demandAuditLog.create({
        data: { demandRequestId: id, newValue: `📞 Teléfono: ${observation}`, changedBy: user.name },
      });
    } catch { /* audit log opcional */ }

    revalidatePath("/sso/rechazos");
    revalidatePath("/sso/derivaciones");
    revalidatePath("/sso/telesalud");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
