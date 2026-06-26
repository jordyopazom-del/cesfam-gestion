"use server";

import { prisma } from "@/lib/prisma";
import { getSSOUser } from "@/lib/sso-session";
import { revalidatePath } from "next/cache";

export async function getDemandsByOrigin(origin: "Rechazo" | "Derivación Interna" | null = null) {
  try {
    const where = origin ? { origin } : {};
    const demands = await prisma.demandRequest.findMany({
      where,
      orderBy: [{ requestDate: "asc" }],
      include: { auditLogs: { select: { timestamp: true, newValue: true, demandRequestId: true } } },
    });
    return { success: true, data: demands };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAllDemands() {
  try {
    const demands = await prisma.demandRequest.findMany({
      include: { auditLogs: { select: { timestamp: true, newValue: true, demandRequestId: true } } },
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
    await prisma.demandRequest.update({
      where: { id },
      data: { status },
    });
    await prisma.demandAuditLog.create({
      data: { demandRequestId: id, newValue: status, changedBy: user?.name || "Sistema" },
    });
    revalidatePath("/sso/rechazos");
    revalidatePath("/sso/derivaciones");
    revalidatePath("/sso/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateDemandNotes(id: number, notes: string) {
  try {
    await prisma.demandRequest.update({
      where: { id },
      data: { notes },
    });
    revalidatePath("/sso/rechazos");
    revalidatePath("/sso/derivaciones");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
