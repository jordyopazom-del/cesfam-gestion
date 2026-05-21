import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import fs from "fs";

export async function GET() {
    const session = await getSession();
    if (!session || !session.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is ADMIN
    const currentUser = await prisma.user.findUnique({
        where: { email: session.email },
    });

    if (currentUser?.role !== 'ADMIN') {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const officials = await prisma.user.findMany({
        include: {
            balances: true,
            _count: {
                select: { requests: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    return NextResponse.json(officials);
}

export async function POST(req: Request) {
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
        const body = await req.json();
        const { name, email, password, role } = body;
        const contractedHours = Number(body.contractedHours || 44);

        if (!email || !password) {
            return NextResponse.json({ message: "Email y contraseña son obligatorios" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ message: "El usuario ya existe" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Calculate balances based on contracted hours
        let feriadoTotal = 15;
        let adminTotal = 6;
        let capTotal = 5;

        if (contractedHours === 33) {
            feriadoTotal = 11;
            adminTotal = 4.5;
            capTotal = 0;
        } else if (contractedHours === 22) {
            feriadoTotal = 7.5;
            adminTotal = 3;
            capTotal = 0;
        } else if (contractedHours === 11) {
            feriadoTotal = 0;
            adminTotal = 0;
            capTotal = 0;
        }

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'OFFICIAL',
                contractedHours: contractedHours,
                balances: {
                    create: [
                        { type: 'FERIADO LEGAL', total: feriadoTotal, used: 0, remaining: feriadoTotal, year: 2026 },
                        { type: 'ADMINISTRATIVO', total: adminTotal, used: 0, remaining: adminTotal, year: 2026 },
                        { type: 'CAPACITACION', total: capTotal, used: 0, remaining: capTotal, year: 2026 },
                        { type: 'SIN_GOCE', total: 90, used: 0, remaining: 90, year: 2026 },
                        { type: 'MATRIMONIO', total: 5, used: 0, remaining: 5, year: 2026 },
                        { type: 'NACIMIENTO', total: 5, used: 0, remaining: 5, year: 2026 },
                        { type: 'FALLECIMIENTO_CONYUGE', total: 7, used: 0, remaining: 7, year: 2026 },
                        { type: 'FALLECIMIENTO_PARIENTE', total: 4, used: 0, remaining: 4, year: 2026 },
                        { type: 'FALLECIMIENTO_HIJO', total: 10, used: 0, remaining: 10, year: 2026 }
                    ]
                }
            } as any,
            include: { balances: true }
        });

        console.log("New user created successfully:", newUser.id);

        return NextResponse.json(newUser);
    } catch (error: unknown) {
        console.error("Error creating official:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : "No stack";

        // Write to a log file for easier debugging
        try {
            fs.appendFileSync('api-error.log', `[${new Date().toISOString()}] ${errorMessage}\n${errorStack}\n\n`);
        } catch (e) { }

        return NextResponse.json({ message: "Error interno: " + errorMessage }, { status: 500 });
    }
}
