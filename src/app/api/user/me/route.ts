import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserByEmail } from '@/lib/auth-db';

export async function GET() {
    const session = await getSession();

    if (!session || !session.email) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await getUserByEmail(session.email);

    if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        accessLogistica: user.accessLogistica,
        accessSolicitudes: user.accessSolicitudes,
        accessReservas: user.accessReservas,
        accessAgendas: user.accessAgendas,
        accessDemanda: user.accessDemanda,
    });
}
