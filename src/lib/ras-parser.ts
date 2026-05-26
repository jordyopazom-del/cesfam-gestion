import { prisma } from "@/lib/prisma";

function formatDate(dtStr: string): string | null {
  if (!dtStr) return null;
  const match = dtStr.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:.*?(\d{2}):(\d{2}))?/);
  if (match) {
    const [, day, month, year, h, m] = match;
    return `${year}-${month}-${day} ${h || "00"}:${m || "00"}:00`;
  }
  return dtStr;
}

export async function processRASPdfBuffer(buffer: Buffer, uploadedBy: string) {
  try {
    let textFull = "";
    try {
      const pdf = (await import("pdf-parse")).default;
      const data = await pdf(buffer);
      textFull = data.text;
    } catch (e: any) {
      console.error("Error inside processRASPdfBuffer dynamic pdf-parse import:", e);
      return { success: false, error: "Error al leer el PDF: " + e.message };
    }

    const profMatch = textFull.match(/Nombre Profesional:\s*(.*?)\r?\n/);
    const professionalName = profMatch ? profMatch[1].trim() : "Desconocido";
    const rutMatch = textFull.match(/Rut:\s*([\d\.\-Kk]+)/);
    const profRut = rutMatch ? rutMatch[1].trim() : "";
    const reasonMatch = textFull.match(/Motivo Bloqueo:\s*(.*?)\r?\n/);
    const reason = reasonMatch ? reasonMatch[1].trim() : "Motivo No Especificado";
    const startMatch = textFull.match(/Fecha Inicio:\s*([\d\/\s:]+)/);
    const startDate = startMatch ? startMatch[1].trim() : "";
    const startDateDb = formatDate(startDate) || startDate;

    const blocks = textFull.split(/Tipo Atenci[oó]n\s*/i);
    const patients = [];

    for (let i = 1; i < blocks.length; i++) {
      const block = "Tipo Atención " + blocks[i];
      const rutPacMatch = block.match(/Rut:\s*([\d\.\-Kk]+)/i);
      const nombrePacMatch = block.match(/Nombre Paciente:\s*(.*?)(?:\r?\n|Fono)/i);
      const tipoAtenMatch = block.match(/Tipo Atenci[oó]n\s*(.*?)\s*Fecha/i);
      const fechaAtenMatch = block.match(/Fecha Atenci[oó]n\s*(.*?)(?:\r?\n|Hrs|Comuna)/i);
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
        data: { professionalName, professionalRut: profRut, startDate: startDateDb, reason, uploadedBy },
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

    return { success: true, professionalName, patientCount: patients.length, addedCount, ignoredCount };
  } catch (err: any) {
    console.error("processRASPdfBuffer error:", err);
    return { success: false, error: err.message };
  }
}

