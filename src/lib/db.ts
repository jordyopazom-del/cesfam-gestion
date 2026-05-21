import { prisma } from './prisma';

export const db = prisma;

// --- TYPES ---
export interface BlockingRequest {
    id: string;
    coordinator: string;
    location: string;
    profession: string;
    professionalName: string;
    blockType: string;
    startDate: string;
    endDate: string;
    selectedDays: string[];
    startTime: string;
    endTime: string;
    status: string;
    agendaBlockedStatus?: string | null;
    pdfUrl?: string[];
    assignedAdmin?: string | null;
    processedAt?: string | Date | null;
    submitterEmail?: string | null;
    unblockStatus: string;
    unblockReason?: string | null;
    createdAt: string | Date;
}

export interface AgendaOpeningRequest {
    id: string;
    coordinator: string;
    location: string;
    profession: string;
    professionalName: string;
    performance: number;
    startTime: string;
    endTime: string;
    selectedDays: string[];
    status: string;
    createdAt: string | Date;
    // adding missing field that components might expect
    requestType?: string;
    categoryType?: string;
    assignedAdmin?: string | null;
    pdfUrl?: string[];
    submitterEmail?: string | null;
}

// Helpers to map Prisma to UI Types
function mapAgendaBlock(req: any): BlockingRequest {
    let selectedDays: string[] = [];
    try { selectedDays = JSON.parse(req.selected_days || '[]'); } catch(e){}
    let pdfUrl: string[] = [];
    try { pdfUrl = JSON.parse(req.pdf_urls || '[]'); } catch(e){}

    return {
        id: req.id,
        coordinator: req.coordinator,
        location: req.location,
        profession: req.profession,
        professionalName: req.professional_name,
        blockType: req.block_type,
        startDate: req.start_date,
        endDate: req.end_date,
        selectedDays,
        startTime: req.start_time,
        endTime: req.end_time,
        status: req.status,
        agendaBlockedStatus: req.agenda_blocked_status,
        pdfUrl,
        assignedAdmin: req.assigned_admin,
        processedAt: req.processed_at,
        submitterEmail: req.submitter_email,
        unblockStatus: req.unblock_status,
        unblockReason: req.unblock_reason,
        createdAt: req.created_at,
    };
}

function mapAgendaOpening(req: any): AgendaOpeningRequest {
    let selectedDays: string[] = [];
    try { selectedDays = JSON.parse(req.selected_days || '[]'); } catch(e){}

    return {
        id: req.id,
        coordinator: req.coordinator,
        location: req.location,
        profession: req.profession,
        professionalName: req.professional_name,
        performance: req.performance,
        startTime: req.start_time,
        endTime: req.end_time,
        selectedDays,
        status: req.status,
        createdAt: req.created_at,
        requestType: 'agenda_opening',
        categoryType: 'agenda_opening'
    };
}

// --- REQUESTS (AgendaBlockRequest) ---
export async function getRequests(): Promise<BlockingRequest[]> {
    const data = await prisma.agendaBlockRequest.findMany({
        orderBy: { created_at: 'desc' },
    });
    return data.map(mapAgendaBlock);
}

export async function saveRequest(request: any): Promise<BlockingRequest> {
    const newReq = await prisma.agendaBlockRequest.create({
        data: {
            id: request.id,
            coordinator: request.coordinator,
            location: request.location,
            profession: request.profession,
            professional_name: request.professionalName,
            block_type: request.blockType || request.requestType || 'Desconocido',
            start_date: request.startDate,
            end_date: request.endDate,
            selected_days: JSON.stringify(request.selectedDays || []),
            start_time: request.startTime,
            end_time: request.endTime,
            status: request.status,
            submitter_email: request.submitterEmail,
            pdf_urls: request.pdfUrl ? JSON.stringify(request.pdfUrl) : null,
            agenda_blocked_status: request.agendaBlockedStatus || null,
        },
    });
    return mapAgendaBlock(newReq);
}

export async function checkBlockingOverlap(
    professionalName: string,
    selectedDays: string[],
    startTime: string,
    endTime: string
): Promise<{day: string, existingStartTime: string, existingEndTime: string} | null> {
    const existing = await prisma.agendaBlockRequest.findFirst({
        where: {
            professional_name: professionalName,
            status: { notIn: ['Rejected', 'Rechazado'] }
        }
    });
    
    if (existing) {
        return null;
    }
    return null;
}

export async function updateRequestStatus(id: string, status: string, additionalData: any = {}) {
    const dataToUpdate: any = { status };
    if (additionalData.assignedAdmin) dataToUpdate.assigned_admin = additionalData.assignedAdmin;
    if (additionalData.agendaBlockedStatus) dataToUpdate.agenda_blocked_status = additionalData.agendaBlockedStatus;
    if (additionalData.processedAt) {
        dataToUpdate.processed_at = new Date(additionalData.processedAt);
    } else if (status === 'Realizado') {
        dataToUpdate.processed_at = new Date();
    }
    if (additionalData.pdfUrl) {
        dataToUpdate.pdf_urls = JSON.stringify(additionalData.pdfUrl);
    }

    const updated = await prisma.agendaBlockRequest.update({
        where: { id },
        data: dataToUpdate,
    });
    
    return mapAgendaBlock(updated);
}

export async function updateUnblockStatus(id: string, unblockStatus: string, unblockReason?: string) {
    const updated = await prisma.agendaBlockRequest.update({
        where: { id },
        data: {
            unblock_status: unblockStatus,
            unblock_reason: unblockReason,
        },
    });
    return mapAgendaBlock(updated);
}

// --- AGENDA OPENINGS ---
export async function getAgendaOpenings(): Promise<AgendaOpeningRequest[]> {
    const data = await prisma.agendaOpening.findMany({
        orderBy: { created_at: 'desc' },
    });
    return data.map(mapAgendaOpening);
}

export async function saveAgendaOpening(request: any): Promise<AgendaOpeningRequest> {
    const newReq = await prisma.agendaOpening.create({
        data: {
            id: request.id,
            coordinator: request.coordinator,
            location: request.location,
            profession: request.profession,
            professional_name: request.professionalName,
            performance: Number(request.performance) || 0,
            start_time: request.startTime,
            end_time: request.endTime,
            selected_days: JSON.stringify(request.selectedDays || []),
            status: request.status,
        },
    });
    return mapAgendaOpening(newReq);
}

export async function checkAgendaOpeningOverlap(
    professionalName: string,
    selectedDays: string[],
    startTime: string,
    endTime: string
): Promise<{day: string, existingStartTime: string, existingEndTime: string} | null> {
    return null;
}

export async function updateAgendaOpeningStatus(id: string, status: string, additionalData: any = {}) {
    const dataToUpdate: any = { status };

    const updated = await prisma.agendaOpening.update({
        where: { id },
        data: dataToUpdate,
    });

    return mapAgendaOpening(updated);
}

// --- PDF ---
export async function getPdfById(id: string) {
    const req = await prisma.agendaBlockRequest.findUnique({ where: { id } });
    if (req && req.pdf_urls) {
        const urls = JSON.parse(req.pdf_urls);
        return urls[0] || null;
    }
    return null;
}
