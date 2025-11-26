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
    agendaBlockedStatus?: 'Realizado' | 'Sin Agenda' | 'No Corresponde';
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
    status: 'Pending' | 'Realizado';
    createdAt: string;
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
                start_date, end_date, selected_days, start_time, end_time, status, agenda_blocked_status, created_at
            ) VALUES (
                ${request.id}, ${request.coordinator}, ${request.location}, ${request.profession}, ${request.professionalName}, ${request.blockType},
                ${request.startDate}, ${request.endDate}, ${JSON.stringify(request.selectedDays)}, ${request.startTime}, ${request.endTime}, ${request.status}, ${request.agendaBlockedStatus || null}, ${request.createdAt}
            )
        `;
        return request;
    } catch (error) {
        console.error('Error saving request:', error);
        throw error;
    }
}

export async function updateRequestStatus(id: string, status?: BlockingRequest['status'], agendaBlockedStatus?: BlockingRequest['agendaBlockedStatus']): Promise<BlockingRequest | null> {
    noStore();
    try {
        if (status) {
            await sql`UPDATE requests SET status = ${status} WHERE id = ${id}`;
        }
        if (agendaBlockedStatus) {
            await sql`UPDATE requests SET agenda_blocked_status = ${agendaBlockedStatus} WHERE id = ${id}`;
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
            agendaBlockedStatus: row.agenda_blocked_status as 'Realizado' | 'Sin Agenda' | 'No Corresponde' | undefined,
            createdAt: row.created_at.toISOString()
        };
    } catch (error) {
        console.error('Error updating request status:', error);
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
            status: row.status as 'Pending' | 'Realizado',
            createdAt: row.created_at.toISOString()
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
                start_time, end_time, selected_days, status, created_at
            ) VALUES (
                ${request.id}, ${request.coordinator}, ${request.location}, ${request.profession}, ${request.professionalName}, ${request.performance},
                ${request.startTime}, ${request.endTime}, ${JSON.stringify(request.selectedDays)}, ${request.status}, ${request.createdAt}
            )
        `;
        return request;
    } catch (error) {
        console.error('Error saving agenda opening:', error);
        throw error;
    }
}

export async function updateAgendaOpeningStatus(id: string, status: AgendaOpeningRequest['status']): Promise<AgendaOpeningRequest | null> {
    noStore();
    try {
        await sql`UPDATE agenda_openings SET status = ${status} WHERE id = ${id}`;

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
            status: row.status as 'Pending' | 'Realizado',
            createdAt: row.created_at.toISOString()
        };
    } catch (error) {
        console.error('Error updating agenda opening status:', error);
        return null;
    }
}

