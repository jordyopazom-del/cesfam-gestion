import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.email) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        console.log("Request Body:", body);

        const { type, start_date, end_date, description, isHalfDay, halfDayPeriod } = body;

        if (!type || !start_date || !end_date) {
            return new NextResponse("Faltan campos obligatorios", { status: 400 });
        }

        const start = new Date(start_date);
        const end = isHalfDay ? new Date(start_date) : new Date(end_date);

        let days = 0;
        if (isHalfDay) {
            days = 0.5;
        } else {
            // Basic business day calculation
            const current = new Date(start);
            while (current <= end) {
                const dayOfWeek = current.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) days++;
                current.setDate(current.getDate() + 1);
            }
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
            include: { balances: true }
        });

        if (!user) return new NextResponse("User not found", { status: 404 });

        const requestData: any = {
            type,
            start_date: start,
            end_date: end,
            description,
            status: 'PENDING',
            days: Number(days),
            userId: user.id
        };

        if (isHalfDay) {
            requestData.halfDayPeriod = halfDayPeriod;
        }

        console.log("Creating request in database with requestData:", requestData);
        // Save the request
        const request = await prisma.solicitudAdministrativa.create({
            data: requestData
        });

        console.log("Request created successfully:", request.id);

        return NextResponse.json(request);
    } catch (error: unknown) {
        console.error("Error creating request:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return new NextResponse(message, { status: 500 });
    }
}
