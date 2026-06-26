import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Starting production database migration for DemandRequest columns...");
    
    // 1. Add establishment
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DemandRequest" ADD COLUMN IF NOT EXISTS "establishment" TEXT;
    `);
    
    // 2. Add attentionType
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DemandRequest" ADD COLUMN IF NOT EXISTS "attentionType" TEXT;
    `);

    // 3. Add observation
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DemandRequest" ADD COLUMN IF NOT EXISTS "observation" TEXT;
    `);

    // 4. Add plazo
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DemandRequest" ADD COLUMN IF NOT EXISTS "plazo" TEXT;
    `);

    // 5. Add notes
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DemandRequest" ADD COLUMN IF NOT EXISTS "notes" TEXT;
    `);

    console.log("Production migration successful for DemandRequest!");
    return NextResponse.json({ success: true, message: "Migration successful!" });
  } catch (error: any) {
    console.error("Migration error in Vercel:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
