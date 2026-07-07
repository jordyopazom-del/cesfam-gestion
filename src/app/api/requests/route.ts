import { NextResponse, NextRequest } from 'next/server';
import { getRequests, saveRequest, checkBlockingOverlap, BlockingRequest } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

function generateId() {
    return crypto.randomUUID();
}

export async function GET() {
    const session = await getSession();
    if (!session || !session.email) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const requests = await getRequests();
    return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { professionalName, selectedDays, startTime, endTime } = body;

        // ── Validación: verificar traslape de horario ──────────────────────────
        if (professionalName && selectedDays?.length && startTime && endTime) {
            const conflict = await checkBlockingOverlap(
                professionalName,
                selectedDays,
                startTime,
                endTime
            );

            if (conflict) {
                const conflictDate = new Date(conflict.day).toLocaleDateString('es-CL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
                return NextResponse.json(
                    {
                        error: 'HORARIO_DUPLICADO',
                        message: `El profesional "${professionalName}" ya tiene un bloqueo el ${conflictDate} entre las ${conflict.existingStartTime} y las ${conflict.existingEndTime}. Los horarios no pueden traslaparse.`,
                    },
                    { status: 409 }
                );
            }
        }
        // ──────────────────────────────────────────────────────────────────────

        const session = await getSession();
        if (!session || !session.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        const submitterEmail = session.email;

        const newRequest: BlockingRequest = {
            id: generateId(),
            ...body,
            status: 'Pending',
            submitterEmail,
            createdAt: new Date().toISOString(),
        };
        await saveRequest(newRequest);
        return NextResponse.json(newRequest);
    } catch (error) {
        console.error('Error al crear solicitud de bloqueo:', error);
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }
}
