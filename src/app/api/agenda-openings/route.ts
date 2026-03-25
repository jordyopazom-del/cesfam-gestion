import { NextResponse, NextRequest } from 'next/server';
import { saveAgendaOpening, getAgendaOpenings, checkAgendaOpeningOverlap, AgendaOpeningRequest } from '@/lib/db';
import { getSession } from '@/lib/session';

function generateId() {
    return crypto.randomUUID();
}

export async function GET() {
    const requests = await getAgendaOpenings();
    return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { professionalName, selectedDays, startTime, endTime } = body;

        // ── Validación: verificar traslape de horario ──────────────────────────
        if (professionalName && selectedDays?.length && startTime && endTime) {
            const conflict = await checkAgendaOpeningOverlap(
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
                        message: `El profesional "${professionalName}" ya tiene una apertura de agenda el ${conflictDate} entre las ${conflict.existingStartTime} y las ${conflict.existingEndTime}. Los horarios no pueden traslaparse.`,
                    },
                    { status: 409 }
                );
            }
        }
        // ──────────────────────────────────────────────────────────────────────

        const session = await getSession();
        const submitterEmail = session?.email || undefined;

        const newRequest: AgendaOpeningRequest = {
            id: generateId(),
            ...body,
            status: 'Pending',
            submitterEmail,
            createdAt: new Date().toISOString(),
        };
        await saveAgendaOpening(newRequest);
        return NextResponse.json(newRequest);
    } catch (error) {
        console.error('Error creating agenda opening:', error);
        return NextResponse.json({ error: 'Failed to create agenda opening' }, { status: 500 });
    }
}
