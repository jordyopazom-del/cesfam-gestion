"use server";

import { prisma } from "@/lib/prisma";
import { getSSOUser } from "@/lib/sso-session";
import { revalidatePath } from "next/cache";

import { processRASPdfBuffer } from "@/lib/ras-parser";

export async function uploadRASPdf(formData: FormData) {
  try {
    const user = await getSSOUser();
    if (!user) return { success: false, error: "Sin sesión activa" };
    if (user.role !== "admin") return { success: false, error: "Solo administradores pueden subir reportes RAS" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "No se subió ningún archivo" };

    const buffer = Buffer.from(await file.arrayBuffer());
    const res = await processRASPdfBuffer(buffer, user.name || "Admin");
    
    if (res.success) {
      revalidatePath("/sso/reprogramacion");
    }
    return res;
  } catch (err: any) {
    console.error("uploadRASPdf error:", err);
    return { success: false, error: err.message };
  }
}

export async function getActiveBlocks() {
  try {
    const user = await getSSOUser();
    if (!user) return { success: false, error: "Sin sesión activa" };

    const isBoss = user.role === "ADMIN" || user.role === "admin" || user.role === "COORDINADOR";
    const filter = isBoss 
        ? {} 
        : {
            OR: [
              { assignedToEmail: user.email },
              { assignedToEmail: null },
            ]
          };

    const blocks = await prisma.agendaBlock.findMany({
      where: filter,
      include: { patients: { select: { status: true } } },
      orderBy: { startDate: "asc" },
    });

    return {
      success: true,
      data: blocks.map((b) => ({
        id: b.id,
        Profesional: b.professionalName,
        "Fecha Bloqueo": b.startDate || "",
        "Fecha Subida": b.uploadDate.toLocaleDateString("es-CL"),
        Motivo: b.reason || "",
        "Total Afectados": b.patients.length,
        Resueltos: b.patients.filter((p) => ["Reprogramado", "Avisado - Sin Cupo", "No ubicable"].includes(p.status)).length,
        "Subido Por": b.uploadedBy || "",
        AsignadoA: b.assignedToEmail || "Sin asignar",
        Estado: b.status || "Pendiente",
      })),
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getHistoryBlocks() {
  return getActiveBlocks();
}

export async function getPatientsByBlock(blockId: number) {
  try {
    const patients = await prisma.blockedPatient.findMany({
      where: { blockId },
      orderBy: { attentionDate: "asc" },
    });
    return {
      success: true,
      data: patients.map((p) => ({
        id: p.id,
        RUT: p.rut,
        Nombre: p.fullName,
        Tipo: p.attentionType,
        Fecha_Atencion: p.attentionDate || "",
        Telefonos: p.contactPhones || "",
        Solucion: p.solution,
        Estado: p.status,
        Ultimo_Gestor: p.updatedBy,
        Fecha_Actualizacion: p.lastStatusUpdate ? p.lastStatusUpdate.toLocaleString('es-CL', { timeZone: 'America/Santiago' }) : null,
      })),
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getPatientSearch(searchQuery: string) {
  try {
    const patients = await prisma.blockedPatient.findMany({
      where: {
        OR: [
          { rut: { contains: searchQuery } },
          { fullName: { contains: searchQuery } },
        ],
      },
      include: { block: { select: { professionalName: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return {
      success: true,
      data: patients.map((p) => ({
        id: p.id,
        RUT: p.rut,
        Nombre: p.fullName,
        Profesional_Bloqueo: p.block.professionalName,
        Fecha_Citacion: p.attentionDate || "",
        Estado: p.status,
        Solucion: p.solution,
        Ultimo_Gestor: p.updatedBy,
        Fecha_Actualizacion: p.lastStatusUpdate ? p.lastStatusUpdate.toLocaleString('es-CL', { timeZone: 'America/Santiago' }) : null,
      })),
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updatePatientStatus(patientId: number, status: string, solution: string) {
  try {
    const user = await getSSOUser();
    await prisma.blockedPatient.update({
      where: { id: patientId },
      data: { status, solution, updatedBy: user?.name || "Sistema", lastStatusUpdate: new Date() },
    });
    revalidatePath("/reprogramacion");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function assignBlock(blockId: number, assignedToEmail: string) {
  try {
    const user = await getSSOUser();
    if (!user) return { success: false, error: "Sin sesión activa" };
    if (user.role !== "ADMIN" && user.role !== "admin" && user.role !== "COORDINADOR") {
      return { success: false, error: "Solo administradores pueden asignar bloques" };
    }

    await prisma.agendaBlock.update({
      where: { id: blockId },
      data: { assignedToEmail: assignedToEmail === "unassign" ? null : assignedToEmail }
    });

    revalidatePath("/reprogramacion");
    return { success: true };
  } catch (err: any) {
    console.error("assignBlock error:", err);
    return { success: false, error: err.message };
  }
}

export async function getNotificationCount() {
  try {
    const user = await getSSOUser();
    if (!user || user.role === "ADMIN" || user.role === "COORDINADOR") return { count: 0 };

    const count = await prisma.agendaBlock.count({
      where: {
        assignedToEmail: user.email,
        status: "Pendiente"
      }
    });

    return { count };
  } catch (err) {
    return { count: 0 };
  }
}

export async function getReprogramadores() {
  try {
    const [users, personnel] = await Promise.all([
      prisma.user.findMany({
        select: { email: true, name: true }
      }),
      prisma.personnel.findMany({
        where: { type: "ADMINISTRATIVO" },
        select: { email: true, name: true }
      })
    ]);

    const list: { email: string; name: string }[] = [];
    const seen = new Set<string>();

    for (const u of users) {
      if (u.email && !seen.has(u.email)) {
        seen.add(u.email);
        list.push({ email: u.email, name: u.name || u.email });
      }
    }

    for (const p of personnel) {
      const email = p.email || p.name;
      if (email && !seen.has(email)) {
        seen.add(email);
        list.push({ email, name: p.name });
      }
    }

    return { success: true, data: list };
  } catch (err: any) {
    console.error("getReprogramadores error:", err);
    return { success: false, error: err.message };
  }
}
