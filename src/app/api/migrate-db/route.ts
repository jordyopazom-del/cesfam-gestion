import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Starting production database migration for columns...");
    
    // 1. Add request_type to AgendaOpening
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AgendaOpening" ADD COLUMN IF NOT EXISTS "request_type" TEXT DEFAULT 'Apertura';
    `);
    
    // 2. Add category_type to AgendaOpening
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AgendaOpening" ADD COLUMN IF NOT EXISTS "category_type" TEXT;
    `);

    console.log("Production migration successful!");
    return NextResponse.json({ success: true, message: "Migration successful!" });
  } catch (error: any) {
    console.error("Migration error in Vercel:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
