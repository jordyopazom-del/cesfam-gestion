import { NextResponse } from 'next/server';
import { updateRequestStatus } from '@/lib/db';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, agendaBlockedStatus } = body;

        if (status && !['Pending', 'Authorized', 'Rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        if (agendaBlockedStatus && !['Realizado', 'Sin Agenda', 'No Corresponde'].includes(agendaBlockedStatus)) {
            return NextResponse.json({ error: 'Invalid agenda status' }, { status: 400 });
        }

        const updatedRequest = await updateRequestStatus(id, status, agendaBlockedStatus);

        if (!updatedRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error('Error updating request:', error);
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }
}
