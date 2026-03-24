import { Resend } from 'resend';

// Resend no se instancia aquí para evitar errores durante el build si la API KEY no está presente

interface EmailParams {
    to: string[];
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY no configurada. El correo no se enviará.');
        return { success: false, error: 'API Key missing' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Cesfam Gestion <onboarding@resend.dev>', // Cambiar por dominio verificado en prod
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Error de Resend:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err: any) {
        console.error('Error al enviar correo:', err);
        return { success: false, error: err.message };
    }
}

export function generateRequestEmailHtml(request: any, type: 'Bloqueo' | 'Apertura') {
    const isNoPatients = request.pdfUrl === 'SIN PACIENTES';
    
    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 20px;">Gestión Finalizada: ${type}</h1>
            </div>
            <div style="padding: 20px; color: #374151; line-height: 1.6;">
                <p>Estimado/a,</p>
                <p>Le informamos que la solicitud de <strong>${type}</strong> ha sido procesada y finalizada con éxito.</p>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Profesional:</strong> ${request.professionalName}</p>
                    <p style="margin: 5px 0;"><strong>Lugar:</strong> ${request.location || '-'}</p>
                    <p style="margin: 5px 0;"><strong>Horario:</strong> ${request.startTime} - ${request.endTime}</p>
                    <p style="margin: 5px 0;"><strong>Administrativo Asignado:</strong> ${request.assignedAdmin || (isNoPatients ? 'N/A (Sin Pacientes)' : '-')}</p>
                </div>

                ${request.pdfUrl && !isNoPatients ? `
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}${request.pdfUrl}" 
                           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                           Ver Documento PDF
                        </a>
                    </div>
                ` : isNoPatients ? `
                    <p style="color: #059669; font-weight: bold; text-align: center;">Nota: Esta gestión se realizó sin pacientes en la agenda.</p>
                ` : ''}

                <p style="font-size: 14px; color: #6b7280; margin-top: 40px; border-top: 1px solid #eee; pt: 20px;">
                    Este es un correo automático del Sistema CESFAM Gestión. Por favor no responder.
                </p>
            </div>
        </div>
    `;
}
