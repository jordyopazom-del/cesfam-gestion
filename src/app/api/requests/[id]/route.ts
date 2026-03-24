import { NextResponse } from 'next/server';
import { updateRequestStatus } from '@/lib/db';
import { sendEmail, generateRequestEmailHtml } from '@/lib/email-service';
import { getPersonnel } from '@/app/admin/personnel/actions';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, agendaBlockedStatus, pdfUrl, assignedAdmin } = body;

        if (status && !['Pending', 'Authorized', 'Rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        if (agendaBlockedStatus && !['Realizado', 'Sin Agenda', 'No Corresponde'].includes(agendaBlockedStatus)) {
            return NextResponse.json({ error: 'Invalid agenda status' }, { status: 400 });
        }

        const updatedRequest = await updateRequestStatus(id, status, agendaBlockedStatus, pdfUrl, assignedAdmin);

        if (!updatedRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // ─────────────────────────────────────────────────────────────
        // EMAIL NOTIFICATION
        // ─────────────────────────────────────────────────────────────
        if (agendaBlockedStatus === 'Realizado') {
            try {
                const personnel = await getPersonnel();
                const recipients = ['gestiondemandafutrono@munifutrono.cl'];

                // Find Coordinator Email
                const coordinator = personnel.find(p => p.name === updatedRequest.coordinator);
                if (coordinator?.email) recipients.push(coordinator.email);

                // Find Admin Email
                if (updatedRequest.assignedAdmin && updatedRequest.assignedAdmin !== 'N/A') {
                    const admin = personnel.find(p => p.name === updatedRequest.assignedAdmin);
                    if (admin?.email) recipients.push(admin.email);
                }

                if (recipients.length > 0) {
                    const html = generateRequestEmailHtml(updatedRequest, 'Bloqueo');
                    await sendEmail({
                        to: recipients,
                        subject: `Gestión Finalizada: Bloqueo - ${updatedRequest.professionalName}`,
                        html
                    });
                }
            } catch (emailError) {
                console.error('Error al enviar notificación:', emailError);
                // No bloqueamos la respuesta si falla el correo
            }
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error('Error updating request:', error);
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }
}
