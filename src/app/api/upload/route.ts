import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert to base64 Data URL instead of saving to local filesystem (which is read-only on Vercel)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
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
