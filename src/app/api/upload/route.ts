import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo excede el tamaño máximo permitido de 5MB" }, { status: 400 });
    }

    // Convert to base64 Data URL instead of saving to local filesystem (which is read-only on Vercel)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verify PDF Magic Numbers (%PDF-)
    if (buffer.length < 4 || buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
      return NextResponse.json({ error: "Solo se permiten archivos en formato PDF válido" }, { status: 400 });
    }

    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ url: dataUrl });
  } catch (error) {
    console.error("CRITICAL error uploading file:", error);
    return NextResponse.json({ 
      error: "Failed to upload file", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
