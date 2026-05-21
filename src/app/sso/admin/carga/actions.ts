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
    for (const d of demands) {
      // Skip if same rut+requestDate+origin already exists
      const existing = await prisma.demandRequest.findFirst({
        where: { rut: d.rut || "", requestDate: d.request_date || d.requestDate || "", origin: d.origin || "" },
      });
      if (existing) continue;

      await prisma.demandRequest.create({
        data: {
          rut: d.rut || "",
          fullName: d.full_name || d.fullName || "",
          age: d.age ?? null,
          requestDate: d.request_date || d.requestDate || null,
          origin: d.origin || "",
          policlinic: d.policlinic || "",
          priority: d.priority || "Baja",
          status: d.status || "📋 Pendiente",
          pregnancy: d.pregnancy || "NONE",
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
