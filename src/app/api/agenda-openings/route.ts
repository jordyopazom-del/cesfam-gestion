import { NextResponse } from 'next/server';
import { saveAgendaOpening, getAgendaOpenings, AgendaOpeningRequest } from '@/lib/db';

function generateId() {
    return crypto.randomUUID();
}

export async function GET() {
    const requests = getAgendaOpenings();
    return NextResponse.json(requests);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newRequest: AgendaOpeningRequest = {
            id: generateId(),
            ...body,
            status: 'Pending',
            createdAt: new Date().toISOString(),
        };
        saveAgendaOpening(newRequest);
        return NextResponse.json(newRequest);
    } catch (error) {
        console.error('Error creating agenda opening:', error);
        return NextResponse.json({ error: 'Failed to create agenda opening' }, { status: 500 });
    }
}
