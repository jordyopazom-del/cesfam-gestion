import { NextResponse, NextRequest } from 'next/server';
import { saveAgendaOpening, getAgendaOpenings, AgendaOpeningRequest } from '@/lib/db';

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
