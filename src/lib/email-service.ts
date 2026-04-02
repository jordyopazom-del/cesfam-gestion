import nodemailer from 'nodemailer';

interface EmailParams {
    to: string[];
    subject: string;
    html: string;
    fromName?: string;
    replyTo?: string;
}

export async function sendEmail({ to, subject, html, fromName, replyTo }: EmailParams) {
    const user = process.env.EMAIL_USER || 'calvarado@munifutrono.cl';
    const pass = process.env.EMAIL_PASS || 'Loki4040';

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user,
            pass
        }
    });

    try {
        const mailOptions = {
            from: fromName ? `"${fromName} (CESFAM Gestión)" <${user}>` : `"CESFAM Gestión" <${user}>`,
            replyTo: replyTo || user,
            to: to.join(', '),
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, data: info };
    } catch (error: any) {
        console.error('Error al enviar correo con nodemailer:', error);
        return { success: false, error: error.message };
    }
}

export function generateRequestEmailHtml(request: any, type: 'Bloqueo' | 'Apertura') {
    const isNoPatients = Array.isArray(request.pdfUrl) ? request.pdfUrl[0] === 'SIN PACIENTES' : request.pdfUrl === 'SIN PACIENTES';
    
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

                ${(request.pdfUrl && Array.isArray(request.pdfUrl) && !isNoPatients) ? `
                    <div style="margin: 20px 0; border-top: 1px solid #eee; padding-top: 15px;">
                        <p style="font-weight: bold; margin-bottom: 10px;">Documentos Adjuntos:</p>
                        ${request.pdfUrl.map((url: string, idx: number) => {
                            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                                           (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://cesfam-app.vercel.app');
                            const link = (url === 'INTERNAL_PDF' || url.startsWith('data:'))
                                ? `${baseUrl}/api/pdf/${request.id}?index=${idx}`
                                : url;
                            return `
                                <div style="margin-bottom: 10px;">
                                    <a href="${link}" 
                                       style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                                       Ver Documento ${idx + 1}
                                    </a>
                                </div>
                            `;
                        }).join('')}
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
