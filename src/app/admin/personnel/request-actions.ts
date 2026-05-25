'use server';

import { updateRequestStatus, updateAgendaOpeningStatus } from '@/lib/db';
import { sendEmail, generateRequestEmailHtml } from '@/lib/email-service';
import { getPersonnel } from './actions';
import { revalidatePath } from 'next/cache';

export async function processUpdateAction(
    id: string,
    type: 'Bloqueo' | 'Apertura',
    payload: {
        status: any;
        pdfUrl: string[];
        assignedAdmin: string;
    }
) {
    try {
        let updatedRequest;
        if (type === 'Bloqueo') {
            updatedRequest = await updateRequestStatus(
                id,
                payload.status,
                {
                    assignedAdmin: payload.assignedAdmin,
                    pdfUrl: payload.pdfUrl,
                    agendaBlockedStatus: 'Realizado'
                }
            );
        } else {
            updatedRequest = await updateAgendaOpeningStatus(
                id,
                payload.status
            );
        }

        if (!updatedRequest) {
            throw new Error('Request not found');
        }

        // Email Notification Logic
        if (payload.status === 'Realizado') {
            try {
                const personnel = await getPersonnel();
                const recipients = ['gestiondemandafutrono@munifutrono.cl'];

                if (updatedRequest.submitterEmail) {
                    recipients.push(updatedRequest.submitterEmail);
                } else if ((updatedRequest as any).coordinator) {
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
                    const mappedEmail = fallbackMap[(updatedRequest as any).coordinator];
                    if (mappedEmail) recipients.push(mappedEmail);
                }

                const profName = (updatedRequest as any).professionalName;
                const professional = personnel.find(p => p.name.toLowerCase() === profName?.toLowerCase());
                if (professional?.email) recipients.push(professional.email);

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
                    const html = generateRequestEmailHtml(updatedRequest as any, type);
                    await sendEmail({
                        to: Array.from(new Set(recipients)),
                        subject: `Gestión Finalizada: ${type} - ${profName}`,
                        html,
                        fromName: adminName,
                        replyTo: adminEmail
                    });
                }
            } catch (emailError) {
                console.error('Error al enviar notificación:', emailError);
            }
        }

        revalidatePath('/admin/personnel');
        return updatedRequest;
    } catch (error) {
        console.error('Error in processUpdateAction:', error);
        throw error;
    }
}

export async function uploadFileAction(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error('No file provided');

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        return { url: dataUrl };
    } catch (error) {
        console.error('Error in uploadFileAction:', error);
        throw error;
    }
}
