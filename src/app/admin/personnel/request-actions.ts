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

        // Procesar automáticamente reportes RAS para reprogramación SOME (Gestión de Demanda)
        if (type === 'Bloqueo' && payload.status === 'Realizado' && payload.pdfUrl && payload.pdfUrl.length > 0) {
            try {
                const { processRASPdfBuffer } = await import('@/lib/ras-parser');
                for (const url of payload.pdfUrl) {
                    if (url.startsWith('data:application/pdf;base64,')) {
                        const base64Data = url.substring('data:application/pdf;base64,'.length);
                        const buffer = Buffer.from(base64Data, 'base64');
                        const gestor = payload.assignedAdmin || 'Admin Agendas';
                        console.log(`[RAS Auto-Import] Procesando PDF en base64 de bloqueo, gestor: ${gestor}`);
                        const res = await processRASPdfBuffer(buffer, gestor);
                        console.log(`[RAS Auto-Import] Resultado de procesamiento:`, res);
                    }
                }
                revalidatePath('/sso/reprogramacion');
            } catch (rasError) {
                console.error('[RAS Auto-Import] Error parseando PDF automáticamente:', rasError);
            }
        }

        // Server-side email notification removed in favor of client-side mailto popup

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

        if (file.size > 5 * 1024 * 1024) {
            throw new Error('El archivo excede el tamaño máximo permitido de 5MB');
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Verify PDF Magic Numbers (%PDF-)
        if (buffer.length < 4 || buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
            throw new Error('Solo se permiten archivos en formato PDF válido');
        }

        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        return { url: dataUrl };
    } catch (error) {
        console.error('Error in uploadFileAction:', error);
        throw error;
    }
}
