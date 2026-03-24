import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    console.log("Upload directory:", uploadDir);
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      console.error("Error creating directory:", e);
    }

    const filename = `${uuidv4()}-${file.name.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadDir, filename);
    console.log("Saving file to:", filePath);
    
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("CRITICAL error uploading file:", error);
    return NextResponse.json({ 
      error: "Failed to upload file", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
