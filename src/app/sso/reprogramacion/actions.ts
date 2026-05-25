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
    const blocks = await prisma.agendaBlock.findMany({
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
      data: { status, solution, updatedBy: user?.name || "Sistema" },
    });
    revalidatePath("/sso/reprogramacion");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
