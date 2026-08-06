"use server";

import { prisma } from "@/lib/prisma";
import { getSSOUser } from "@/lib/sso-session";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

export async function deleteAllDemands() {
  try {
    const user = await getSSOUser();
    if (user?.role !== "admin") return { success: false, error: "Acceso denegado" };
    await prisma.demandAuditLog.deleteMany({});
    await prisma.demandRequest.deleteMany({});
    // Resetear la secuencia de PostgreSQL para evitar conflictos de ID
    await prisma.$executeRawUnsafe(`SELECT setval('"DemandRequest_id_seq"', 1, false)`);
    revalidatePath("/sso/dashboard");
    revalidatePath("/sso/rechazos");
    revalidatePath("/sso/derivaciones");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function bulkInsertDemands(demands: any[]) {
  if (!demands || demands.length === 0) return { success: true, count: 0 };
  try {
    const user = await getSSOUser();
    if (user?.role !== "admin") return { success: false, error: "Acceso denegado" };

    let inserted = 0;
    const dedupeMap = new Map<string, boolean>();

    for (const d of demands) {
      const rut = d.rut || "";
      const requestDate = d.request_date || d.requestDate || "";
      const origin = d.origin || "";

      if (!rut) continue;

      // Deduplicar dentro del mismo lote
      const key = `${rut}|${requestDate}|${origin}`;
      if (dedupeMap.has(key)) continue;
      dedupeMap.set(key, true);

      // Verificar si ya existe en BD (comparación por string exacta)
      const existing = await prisma.demandRequest.findFirst({
        where: { rut, requestDate, origin },
      });
      if (existing) continue;

      // Crear nuevo registro
      await prisma.demandRequest.create({
        data: {
          rut,
          fullName: d.full_name || d.fullName || "",
          age: d.age ?? null,
          requestDate: requestDate || null,
          origin,
          policlinic: d.policlinic || "",
          priority: d.priority || "Baja",
          status: d.status || "📋 Pendiente",
          pregnancy: d.pregnancy || "NONE",
          establishment: d.establishment || "",
          attentionType: d.attention_type || "",
          observation: d.observation || "",
          plazo: d.plazo || "",
        },
      });
      inserted++;
    }

    revalidatePath("/sso/dashboard");
    revalidatePath("/sso/rechazos");
    revalidatePath("/sso/derivaciones");
    return { success: true, count: inserted };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getBackupDemands() {
  try {
    const user = await getSSOUser();
    if (user?.role !== "admin") return { success: false, error: "Acceso denegado" };
    const demands = await prisma.demandRequest.findMany({ orderBy: { requestDate: "desc" } });
    return { success: true, data: demands };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
