import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';

export interface BlockingRequest {
    id: string;
    coordinator: string;
    location: string;
    profession: string;
    professionalName: string;
    blockType: string;
    startDate: string;
    endDate: string;
    selectedDays: string[]; // ISO date strings
    startTime: string;
    endTime: string;
    status: 'Pending' | 'Authorized' | 'Rejected';
    agendaBlockedStatus?: 'Realizado' | 'Sin Agenda' | 'No Corresponde' | 'Desbloqueado';
    pdfUrl?: string;
    assignedAdmin?: string;
    processedAt?: string;
    submitterEmail?: string;
    unblockStatus?: 'None' | 'Requested' | 'Approved' | 'Rejected';
    unblockReason?: string;
    createdAt: string;
}

export interface AgendaOpeningRequest {
    id: string;
    coordinator: string;
    location: string;
    profession: string;
    professionalName: string;
    performance: number; // 15, 20, 30, 45, 60
    startTime: string;
    endTime: string;
    selectedDays: string[]; // ISO date strings
    status: 'Pending' | 'Realizado' | 'No Corresponde';
    pdfUrl?: string;
    assignedAdmin?: string;
    processedAt?: string;
    submitterEmail?: string;
    createdAt: string;
    requestType?: string;
    categoryType?: string;
}

// ─────────────────────────────────────────────────────────────
// VALIDACIONES DE TRASLAPE DE HORARIO
// ─────────────────────────────────────────────────────────────

/**
 * Verifica si existe una solicitud de bloqueo que se traslape con la nueva.
 * Dos rangos horarios se traslapan cuando: inicio_nuevo < fin_existente Y fin_nuevo > inicio_existente.
 * Solo considera solicitudes del mismo profesional que no hayan sido Rechazadas.
 * Devuelve el primer conflicto encontrado o null si no hay traslapes.
 */
export async function checkBlockingOverlap(
    professionalName: string,
    selectedDays: string[], // ISO date strings de los días nuevos
    startTime: string,      // 'HH:mm'
    endTime: string         // 'HH:mm'
): Promise<{ day: string; existingStartTime: string; existingEndTime: string } | null> {
    noStore();
    try {
        // Traer todos los bloqueos activos del mismo profesional (no Rechazados)
        const { rows } = await sql`
            SELECT selected_days, start_time, end_time
            FROM requests
            WHERE professional_name = ${professionalName}
              AND status != 'Rejected'
        `;

        for (const row of rows) {
            const existingDays: string[] = JSON.parse(row.selected_days);
            const existingStart = row.start_time as string;
            const existingEnd = row.end_time as string;

            // Encontrar si algún día nuevo coincide con algún día existente
            for (const newDay of selectedDays) {
                const newDayDate = new Date(newDay).toDateString();
                const dayMatch = existingDays.some(
                    (ed) => new Date(ed).toDateString() === newDayDate
                );

                if (dayMatch) {
                    // Verificar traslape de horario: A_inicio < B_fin AND A_fin > B_inicio
                    const overlap =
                        startTime < existingEnd && endTime > existingStart;

                    if (overlap) {
                        return {
                            day: newDay,
                            existingStartTime: existingStart,
                            existingEndTime: existingEnd,
                        };
                    }
                }
            }
        }

        return null; // Sin traslapes
    } catch (error) {
        console.error('Error al verificar traslape de bloqueos:', error);
        throw error;
    }
}

/**
 * Verifica si existe una solicitud de apertura de agenda que se traslape con la nueva.
 * Misma lógica de traslape horario que para bloqueos.
 * Solo considera solicitudes del mismo profesional que no sean 'No Corresponde'.
 * Devuelve el primer conflicto encontrado o null si no hay traslapes.
 */
export async function checkAgendaOpeningOverlap(
    professionalName: string,
    selectedDays: string[], // ISO date strings de los días nuevos
    startTime: string,      // 'HH:mm'
    endTime: string         // 'HH:mm'
): Promise<{ day: string; existingStartTime: string; existingEndTime: string } | null> {
    noStore();
    try {
        // Traer todas las aperturas activas del mismo profesional (no 'No Corresponde')
        const { rows } = await sql`
            SELECT selected_days, start_time, end_time
            FROM agenda_openings
            WHERE professional_name = ${professionalName}
              AND status != 'No Corresponde'
        `;

        for (const row of rows) {
            const existingDays: string[] = JSON.parse(row.selected_days);
            const existingStart = row.start_time as string;
            const existingEnd = row.end_time as string;

            for (const newDay of selectedDays) {
                const newDayDate = new Date(newDay).toDateString();
                const dayMatch = existingDays.some(
                    (ed) => new Date(ed).toDateString() === newDayDate
                );

                if (dayMatch) {
                    // Verificar traslape: A_inicio < B_fin AND A_fin > B_inicio
                    const overlap =
                        startTime < existingEnd && endTime > existingStart;

                    if (overlap) {
                        return {
                            day: newDay,
                            existingStartTime: existingStart,
                            existingEndTime: existingEnd,
                        };
                    }
                }
            }
        }

        return null; // Sin traslapes
    } catch (error) {
        console.error('Error al verificar traslape de aperturas de agenda:', error);
        throw error;
    }
}

export async function getRequests(): Promise<BlockingRequest[]> {
    noStore();
    try {
        const { rows } = await sql`SELECT * FROM requests ORDER BY created_at DESC`;
        return rows.map(row => ({
            id: row.id,
            coordinator: row.coordinator,
            location: row.location,
            profession: row.profession,
            professionalName: row.professional_name,
            blockType: row.block_type,
            startDate: row.start_date,
            endDate: row.end_date,
            selectedDays: JSON.parse(row.selected_days),
            startTime: row.start_time,
            endTime: row.end_time,
            status: row.status as 'Pending' | 'Authorized' | 'Rejected',
            agendaBlockedStatus: row.agenda_blocked_status as 'Realizado' | 'Sin Agenda' | 'No Corresponde' | undefined,
            pdfUrl: row.pdf_url,
            assignedAdmin: row.assigned_admin,
            processedAt: row.processed_at ? row.processed_at.toISOString() : undefined,
            submitterEmail: row.submitter_email,
            unblockStatus: row.unblock_status as any || 'None',
            unblockReason: row.unblock_reason,
            createdAt: row.created_at.toISOString()
        }));
    } catch (error) {
        console.error('Error fetching requests:', error);
        return [];
    }
}

export async function saveRequest(request: BlockingRequest): Promise<BlockingRequest> {
    noStore();
    try {
        await sql`
            INSERT INTO requests (
                id, coordinator, location, profession, professional_name, block_type,
                start_date, end_date, selected_days, start_time, end_time, status, agenda_blocked_status, 
                pdf_url, assigned_admin, processed_at, submitter_email, unblock_status, unblock_reason, created_at
            ) VALUES (
                ${request.id}, ${request.coordinator}, ${request.location}, ${request.profession}, ${request.professionalName}, ${request.blockType},
                ${request.startDate}, ${request.endDate}, ${JSON.stringify(request.selectedDays)}, ${request.startTime}, ${request.endTime}, ${request.status}, ${request.agendaBlockedStatus || null}, 
                ${request.pdfUrl || null}, ${request.assignedAdmin || null}, ${request.processedAt || null}, ${request.submitterEmail || null}, 
                ${request.unblockStatus || 'None'}, ${request.unblockReason || null},
                ${request.createdAt}
            )
        `;
        return request;
    } catch (error) {
        console.error('Error saving request:', error);
        throw error;
    }
}

export async function updateRequestStatus(
    id: string, 
    status?: BlockingRequest['status'], 
    agendaBlockedStatus?: BlockingRequest['agendaBlockedStatus'],
    pdfUrl?: string,
    assignedAdmin?: string,
    unblockStatus?: BlockingRequest['unblockStatus'],
    unblockReason?: string
): Promise<BlockingRequest | null> {
    noStore();
    try {
        if (status) {
            await sql`UPDATE requests SET status = ${status} WHERE id = ${id}`;
        }
        if (agendaBlockedStatus) {
            await sql`UPDATE requests SET agenda_blocked_status = ${agendaBlockedStatus} WHERE id = ${id}`;
        }
        if (pdfUrl) {
            await sql`UPDATE requests SET pdf_url = ${pdfUrl} WHERE id = ${id}`;
        }
        if (assignedAdmin) {
            await sql`UPDATE requests SET assigned_admin = ${assignedAdmin}, processed_at = NOW() WHERE id = ${id}`;
        }
        if (unblockStatus) {
            await sql`UPDATE requests SET unblock_status = ${unblockStatus} WHERE id = ${id}`;
        }
        if (unblockReason) {
            await sql`UPDATE requests SET unblock_reason = ${unblockReason} WHERE id = ${id}`;
        }

        const { rows } = await sql`SELECT * FROM requests WHERE id = ${id}`;
        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            id: row.id,
            coordinator: row.coordinator,
            location: row.location,
            profession: row.profession,
            professionalName: row.professional_name,
            blockType: row.block_type,
            startDate: row.start_date,
            endDate: row.end_date,
            selectedDays: JSON.parse(row.selected_days),
            startTime: row.start_time,
            endTime: row.end_time,
            status: row.status as 'Pending' | 'Authorized' | 'Rejected',
            agendaBlockedStatus: row.agenda_blocked_status as any,
            pdfUrl: row.pdf_url,
            assignedAdmin: row.assigned_admin,
            processedAt: row.processed_at ? row.processed_at.toISOString() : undefined,
            submitterEmail: row.submitter_email,
            unblockStatus: row.unblock_status as any || 'None',
            unblockReason: row.unblock_reason,
            createdAt: row.created_at.toISOString()
        };
    } catch (error) {
        console.error('Error updating request status:', error);
        return null;
    }
}

export async function updateUnblockStatus(
    id: string,
    unblockStatus: BlockingRequest['unblockStatus'],
    unblockReason?: string
): Promise<BlockingRequest | null> {
    noStore();
    try {
        if (unblockReason) {
            await sql`UPDATE requests SET unblock_status = ${unblockStatus}, unblock_reason = ${unblockReason} WHERE id = ${id}`;
        } else {
            await sql`UPDATE requests SET unblock_status = ${unblockStatus} WHERE id = ${id}`;
        }

        const { rows } = await sql`SELECT * FROM requests WHERE id = ${id}`;
        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            id: row.id,
            coordinator: row.coordinator,
            location: row.location,
            profession: row.profession,
            professionalName: row.professional_name,
            blockType: row.block_type,
            startDate: row.start_date,
            endDate: row.end_date,
            selectedDays: JSON.parse(row.selected_days),
            startTime: row.start_time,
            endTime: row.end_time,
            status: row.status as 'Pending' | 'Authorized' | 'Rejected',
            agendaBlockedStatus: row.agenda_blocked_status as any,
            pdfUrl: row.pdf_url,
            assignedAdmin: row.assigned_admin,
            processedAt: row.processed_at ? row.processed_at.toISOString() : undefined,
            submitterEmail: row.submitter_email,
            unblockStatus: row.unblock_status as any || 'None',
            unblockReason: row.unblock_reason,
            createdAt: row.created_at.toISOString()
        };
    } catch (error) {
        console.error('Error updating unblock status:', error);
        return null;
    }
}

export async function getAgendaOpenings(): Promise<AgendaOpeningRequest[]> {
    noStore();
    try {
        const { rows } = await sql`SELECT * FROM agenda_openings ORDER BY created_at DESC`;
        return rows.map(row => ({
            id: row.id,
            coordinator: row.coordinator,
            location: row.location,
            profession: row.profession,
            professionalName: row.professional_name,
            performance: row.performance,
            startTime: row.start_time,
            endTime: row.end_time,
            selectedDays: JSON.parse(row.selected_days),
            status: row.status as 'Pending' | 'Realizado' | 'No Corresponde',
            pdfUrl: row.pdf_url,
            assignedAdmin: row.assigned_admin,
            processedAt: row.processed_at ? row.processed_at.toISOString() : undefined,
            submitterEmail: row.submitter_email,
            createdAt: row.created_at.toISOString(),
            requestType: row.request_type,
            categoryType: row.category_type
        }));
    } catch (error) {
        console.error('Error fetching agenda openings:', error);
        return [];
    }
}

export async function saveAgendaOpening(request: AgendaOpeningRequest): Promise<AgendaOpeningRequest> {
    noStore();
    try {
        await sql`
            INSERT INTO agenda_openings (
                id, coordinator, location, profession, professional_name, performance,
                start_time, end_time, selected_days, status, pdf_url, assigned_admin, processed_at, submitter_email, created_at,
                request_type, category_type
            ) VALUES (
                ${request.id}, ${request.coordinator}, ${request.location}, ${request.profession}, ${request.professionalName}, ${request.performance},
                ${request.startTime}, ${request.endTime}, ${JSON.stringify(request.selectedDays)}, ${request.status}, 
                ${request.pdfUrl || null}, ${request.assignedAdmin || null}, ${request.processedAt || null}, ${request.submitterEmail || null}, ${request.createdAt},
                ${request.requestType || 'Apertura'}, ${request.categoryType || null}
            )
        `;
        return request;
    } catch (error) {
        console.error('Error saving agenda opening:', error);
        throw error;
    }
}

export async function updateAgendaOpeningStatus(
    id: string, 
    status?: AgendaOpeningRequest['status'],
    pdfUrl?: string,
    assignedAdmin?: string
): Promise<AgendaOpeningRequest | null> {
    noStore();
    try {
        if (status) {
            await sql`UPDATE agenda_openings SET status = ${status} WHERE id = ${id}`;
        }
        if (pdfUrl) {
            await sql`UPDATE agenda_openings SET pdf_url = ${pdfUrl} WHERE id = ${id}`;
        }
        if (assignedAdmin) {
            await sql`UPDATE agenda_openings SET assigned_admin = ${assignedAdmin}, processed_at = NOW() WHERE id = ${id}`;
        }

        const { rows } = await sql`SELECT * FROM agenda_openings WHERE id = ${id}`;
        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            id: row.id,
            coordinator: row.coordinator,
            location: row.location,
            profession: row.profession,
            professionalName: row.professional_name,
            performance: row.performance,
            startTime: row.start_time,
            endTime: row.end_time,
            selectedDays: JSON.parse(row.selected_days),
            status: row.status as 'Pending' | 'Realizado' | 'No Corresponde',
            pdfUrl: row.pdf_url,
            assignedAdmin: row.assigned_admin,
            processedAt: row.processed_at ? row.processed_at.toISOString() : undefined,
            submitterEmail: row.submitter_email,
            createdAt: row.created_at.toISOString(),
            requestType: row.request_type,
            categoryType: row.category_type
        };
    } catch (error) {
        console.error('Error updating agenda opening status:', error);
        return null;
    }
}

export async function getPdfById(id: string): Promise<string | null> {
    noStore();
    try {
        // Try requests table first
        const { rows: reqRows } = await sql`SELECT pdf_url FROM requests WHERE id = ${id}`;
        if (reqRows.length > 0 && reqRows[0].pdf_url) {
            return reqRows[0].pdf_url;
        }

        // Try agenda_openings table
        const { rows: openRows } = await sql`SELECT pdf_url FROM agenda_openings WHERE id = ${id}`;
        if (openRows.length > 0 && openRows[0].pdf_url) {
            return openRows[0].pdf_url;
        }

        return null;
    } catch (error) {
        console.error('Error fetching PDF by ID:', error);
        return null;
    }
}

