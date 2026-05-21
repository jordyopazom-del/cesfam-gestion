import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getSession();
    if (!session || !session.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
        where: { email: session.email },
    });

    if (currentUser?.role !== 'ADMIN') {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const officials = await prisma.user.findMany({
            where: { role: 'OFFICIAL' },
            include: {
                requests: {
                    where: { status: 'APPROVED' }
                }
            },
            orderBy: { name: 'asc' }
        });

        const reportData = officials.map(official => {
            const summary: Record<string, number> = {};
            official.requests.forEach(req => {
                summary[req.type] = (summary[req.type] || 0) + req.days;
            });

            return {
                id: official.id,
                name: official.name,
                email: official.email,
                summary,
                totalDays: Object.values(summary).reduce((a, b) => a + b, 0)
            };
        });

        return NextResponse.json(reportData);
    } catch (error) {
        console.error("Error fetching report data:", error);
        return NextResponse.json({ message: "Error al generar reportes" }, { status: 500 });
    }
}
