import { NextResponse } from 'next/server';
import { getAgendaOpenings, updateAgendaOpeningStatus } from '@/lib/db';

export async function GET() {
    const requests = await getAgendaOpenings();
    return NextResponse.json(requests);
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (status && !['Pending', 'Realizado', 'No Corresponde'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const updatedRequest = await updateAgendaOpeningStatus(id, status);

        if (!updatedRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error('Error updating agenda opening:', error);
        return NextResponse.json({ error: 'Failed to update agenda opening' }, { status: 500 });
    }
}
