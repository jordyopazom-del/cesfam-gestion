import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateRequestStatus } from '@/lib/db';
import { sendEmail, generateRequestEmailHtml } from '@/lib/email-service';
import { getPersonnel } from '@/app/admin/personnel/actions';

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
        const { status, agendaBlockedStatus, pdfUrl, assignedAdmin, unblockStatus, unblockReason } = body;

        if (status && !['Pending', 'Authorized', 'Rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        if (agendaBlockedStatus && !['Realizado', 'Sin Agenda', 'No Corresponde', 'Desbloqueado'].includes(agendaBlockedStatus)) {
            return NextResponse.json({ error: 'Invalid agenda status' }, { status: 400 });
        }

        const updatedRequest = await updateRequestStatus(id, status, { agendaBlockedStatus: agendaBlockedStatus, processedAt: pdfUrl, assignedAdmin: assignedAdmin, professionalName: unblockStatus, coordinator: unblockReason });

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

                // Find Submitter Email
                if (updatedRequest.submitterEmail) {
                    recipients.push(updatedRequest.submitterEmail);
                } else if (updatedRequest.coordinator) {
                    const fallbackMap: Record<string, string> = {
                        "Directora": "direccioncesfam@munifutrono.cl",
                        "Coordinadora Técnica": "coordinaciontecnica@munifutrono.cl",
                        "Coordinador Rural Cordillera": "coordinacionsaludrural@munifutrono.cl",
                        "Coordinador Rural Valle": "coordinacionsaludrural@munifutrono.cl",
                        "Coordinador Sector 1": "coordinacions1@munifutrono.cl",
                        "Coordinador Sector 2": "coordinacions2@munifutrono.cl",
                        "Coordinador Convenios": "convenioscesfam@munifutrono.cl",
                        "Coordinador Some": "some.cesfam@munifutrono.cl",
                        "Coordinador Gore": "proyectogoread@munifutrono.cl",
                        "Encargado Agendas": "kkoandres@gmail.com",
                    };
                    const mappedEmail = fallbackMap[updatedRequest.coordinator];
                    if (mappedEmail) recipients.push(mappedEmail);
                }

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
                    const html = await generateRequestEmailHtml(updatedRequest, 'Bloqueo');
                    await sendEmail({
                        to: Array.from(new Set(recipients)), // removed duplicates if any
                        subject: `Gestión Finalizada: Bloqueo - ${updatedRequest.professionalName}`,
                        html,
                        fromName: adminName,
                        replyTo: adminEmail
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
