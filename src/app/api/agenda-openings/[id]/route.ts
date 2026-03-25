import { NextResponse } from 'next/server';
import { updateAgendaOpeningStatus } from '@/lib/db';
import { sendEmail, generateRequestEmailHtml } from '@/lib/email-service';
import { getPersonnel } from '@/app/admin/personnel/actions';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, pdfUrl, assignedAdmin } = body;

        if (status && !['Pending', 'Realizado', 'No Corresponde'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const updatedRequest = await updateAgendaOpeningStatus(id, status, pdfUrl, assignedAdmin);

        if (!updatedRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // ─────────────────────────────────────────────────────────────
        // EMAIL NOTIFICATION
        // ─────────────────────────────────────────────────────────────
        if (status === 'Realizado') {
            try {
                const personnel = await getPersonnel();
                const recipients = ['gestiondemandafutrono@munifutrono.cl'];

                // Find Coordinator Email
                const coordinator = personnel.find(p => p.name.toLowerCase() === updatedRequest.coordinator?.toLowerCase());
                if (coordinator?.email) recipients.push(coordinator.email);

                const professional = personnel.find(p => p.name.toLowerCase() === updatedRequest.professionalName?.toLowerCase());
                if (professional?.email) recipients.push(professional.email);

                // Find Admin Email
                let adminName = undefined;
                let adminEmail = undefined;
                if (updatedRequest.assignedAdmin && updatedRequest.assignedAdmin !== 'N/A') {
                    const admin = personnel.find(p => p.name.toLowerCase() === updatedRequest.assignedAdmin!.toLowerCase());
                    if (admin?.email) {
                        recipients.push(admin.email);
                        adminName = admin.name;
                        adminEmail = admin.email;
                    }
                }

                if (recipients.length > 0) {
                    const html = generateRequestEmailHtml(updatedRequest, 'Apertura');
                    await sendEmail({
                        to: Array.from(new Set(recipients)),
                        subject: `Gestión Finalizada: Apertura de Agenda - ${updatedRequest.professionalName}`,
                        html,
                        fromName: adminName,
                        replyTo: adminEmail
                    });
                }
            } catch (emailError) {
                console.error('Error al enviar notificación:', emailError);
            }
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error('Error updating agenda opening:', error);
        return NextResponse.json({ error: 'Failed to update agenda opening' }, { status: 500 });
    }
}
