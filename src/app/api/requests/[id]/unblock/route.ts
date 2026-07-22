import { NextResponse } from 'next/server';
import { updateUnblockStatus } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { unblockStatus, unblockReason } = body;

        if (!unblockStatus || !['Requested', 'Approved', 'Rejected', 'None'].includes(unblockStatus)) {
            return NextResponse.json({ error: 'Invalid unblock status' }, { status: 400 });
        }

        const updatedRequest = await updateUnblockStatus(id, unblockStatus, unblockReason);

        if (!updatedRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error('Error updating unblock request:', error);
        return NextResponse.json({ error: 'Failed to update unblock request' }, { status: 500 });
    }
}
