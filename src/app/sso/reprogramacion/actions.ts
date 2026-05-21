"use server";

import { prisma } from "@/lib/prisma";
import { getSSOUser } from "@/lib/sso-session";
import { revalidatePath } from "next/cache";
import * as pdfParseModule from "pdf-parse";
const pdfParse = (pdfParseModule as any).default || pdfParseModule;

function formatDate(dtStr: string): string | null {
  if (!dtStr) return null;
  const match = dtStr.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:.*?(\d{2}):(\d{2}))?/);
  if (match) {
    const [, day, month, year, h, m] = match;
    return `${year}-${month}-${day} ${h || "00"}:${m || "00"}:00`;
  }
  return dtStr;
}

export async function uploadRASPdf(formData: FormData) {
  try {
    const user = await getSSOUser();
    if (!user) return { success: false, error: "Sin sesión activa" };
    if (user.role !== "admin") return { success: false, error: "Solo administradores pueden subir reportes RAS" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "No se subió ningún archivo" };

    const buffer = Buffer.from(await file.arrayBuffer());
    let textFull = "";
    try {
      const data = await pdfParse(buffer);
      textFull = data.text;
    } catch (e: any) {
      return { success: false, error: "Error al leer el PDF: " + e.message };
    }

    const profMatch = textFull.match(/Nombre Profesional:\s*(.*?)\n/);
    const professionalName = profMatch ? profMatch[1].trim() : "Desconocido";
    const rutMatch = textFull.match(/Rut:\s*([\d\.\-Kk]+)/);
    const profRut = rutMatch ? rutMatch[1].trim() : "";
    const reasonMatch = textFull.match(/Motivo Bloqueo:\s*(.*?)\n/);
    const reason = reasonMatch ? reasonMatch[1].trim() : "Motivo No Especificado";
    const startMatch = textFull.match(/Fecha Inicio:\s*([\d\/\s:]+)/);
    const startDate = startMatch ? startMatch[1].trim() : "";
    const startDateDb = formatDate(startDate) || startDate;

    const blocks = textFull.split(/Tipo Atenci[oó]n\s/i);
    const patients = [];

    for (let i = 1; i < blocks.length; i++) {
      const block = "Tipo Atención " + blocks[i];
      const rutPacMatch = block.match(/Rut:\s*([\d\.\-Kk]+)/i);
      const nombrePacMatch = block.match(/Nombre Paciente:\s*(.*?)(?:\n|Fono)/i);
      const tipoAtenMatch = block.match(/Tipo Atenci[oó]n\s*(.*?)\s*Fecha/i);
      const fechaAtenMatch = block.match(/Fecha Atenci[oó]n\s*(.*?)(?:\n|Hrs|Comuna)/i);
      const fonoMovMatch = block.match(/Fono M[oó]vil.*?([\d+]+)/i);
      const fonoCasaMatch = block.match(/Fono Casa.*?([\d+]+)/i);
      const fonoContMatch = block.match(/Fono Contacto.*?([\d+]+)/i);

      if (!rutPacMatch) continue;

      const phones = [fonoMovMatch?.[1], fonoCasaMatch?.[1], fonoContMatch?.[1]]
        .filter(Boolean)
        .join(" / ") || "Sin Teléfono";

      patients.push({
        rut: rutPacMatch[1].trim(),
        fullName: nombrePacMatch ? nombrePacMatch[1].trim() : "Desconocido",
        attentionType: tipoAtenMatch ? tipoAtenMatch[1].trim() : "OTRA",
        attentionDate: fechaAtenMatch ? formatDate(fechaAtenMatch[1].trim()) || "" : "",
        contactPhones: phones,
      });
    }

    // Upsert agenda block
    let agendaBlock = await prisma.agendaBlock.findFirst({
      where: { professionalName, startDate: startDateDb },
    });

    if (!agendaBlock) {
      agendaBlock = await prisma.agendaBlock.create({
        data: { professionalName, professionalRut: profRut, startDate: startDateDb, reason, uploadedBy: user.name },
      });
    }

    let addedCount = 0;
    let ignoredCount = 0;

    for (const p of patients) {
      const existing = await prisma.blockedPatient.findFirst({
        where: { blockId: agendaBlock.id, rut: p.rut, attentionDate: p.attentionDate },
      });
      if (existing) { ignoredCount++; continue; }

      await prisma.blockedPatient.create({
        data: { blockId: agendaBlock.id, rut: p.rut, fullName: p.fullName, attentionType: p.attentionType, attentionDate: p.attentionDate, contactPhones: p.contactPhones },
      });
      addedCount++;
    }

    revalidatePath("/sso/reprogramacion");
    return { success: true, professionalName, patientCount: patients.length, addedCount, ignoredCount };
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
