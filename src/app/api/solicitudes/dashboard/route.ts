import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getSession();
    if (!session || !session.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const email = session.email;
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            balances: {
                orderBy: { type: 'asc' }
            },
            requests: {
                orderBy: { createdAt: 'desc' },
                take: 10
            }
        },
    });

    if (!user) {
        return new NextResponse("User not found", { status: 404 });
    }

    let adminData = null;

    if (user.role === 'ADMIN') {
        const url = new URL(req.url);
        const monthParam = url.searchParams.get('month');
        const yearParam = url.searchParams.get('year');

        const now = new Date();
        const currentYear = yearParam ? parseInt(yearParam) : now.getFullYear();
        // monthParam is 0-indexed if provided, so no need to subtract 1
        const currentMonth = monthParam ? parseInt(monthParam) : now.getMonth();

        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        const allPendingRequests = await prisma.solicitudAdministrativa.findMany({
            where: { status: 'PENDING' },
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });

        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const todayAbsencesCount = await prisma.solicitudAdministrativa.count({
            where: {
                status: 'APPROVED',
                startDate: { lte: endOfDay },
                endDate: { gte: startOfDay }
            }
        });

        const approvedRequests = await prisma.solicitudAdministrativa.findMany({
            where: {
                status: 'APPROVED',
                OR: [
                    { startDate: { gte: startOfMonth, lte: endOfMonth } },
                    { endDate: { gte: startOfMonth, lte: endOfMonth } },
                    { startDate: { lte: startOfMonth }, endDate: { gte: endOfMonth } }
                ]
            },
            include: { user: true }
        });

        const monthAbsences: Record<number, string[]> = {};
        approvedRequests.forEach(req => {
            const start = req.startDate < startOfMonth ? 1 : req.startDate.getDate();
            const end = req.endDate > endOfMonth ? endOfMonth.getDate() : req.endDate.getDate();

            for (let d = start; d <= end; d++) {
                if (!monthAbsences[d]) monthAbsences[d] = [];
                const name = req.user.name || req.user.email || 'Desconocido';
                if (!monthAbsences[d].includes(name)) {
                    monthAbsences[d].push(name);
                }
            }
        });

        adminData = {
            allPendingRequests,
            todayAbsencesCount,
            monthAbsences
        };
    }

    return NextResponse.json({
        user,
        adminData
    });
}
