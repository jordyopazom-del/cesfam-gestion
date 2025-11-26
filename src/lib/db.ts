import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'requests.json');
const DB_FILE_OPENINGS = path.join(DATA_DIR, 'agenda-openings.json');

export interface Request {
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

function ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

export function getRequests(): Request[] {
    ensureDir();
    if (!fs.existsSync(DB_FILE)) {
        return [];
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    try {
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

export function saveRequest(request: Request): Request {
    const requests = getRequests();
    requests.push(request);
    fs.writeFileSync(DB_FILE, JSON.stringify(requests, null, 2));
    return request;
}

export function updateRequestStatus(id: string, status?: Request['status'], agendaBlockedStatus?: Request['agendaBlockedStatus']): Request | null {
    const requests = getRequests();
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) return null;

    if (status) requests[index].status = status;
    if (agendaBlockedStatus) requests[index].agendaBlockedStatus = agendaBlockedStatus;

    fs.writeFileSync(DB_FILE, JSON.stringify(requests, null, 2));
    return requests[index];
}

export function getAgendaOpenings(): AgendaOpeningRequest[] {
    ensureDir();
    if (!fs.existsSync(DB_FILE_OPENINGS)) {
        return [];
    }
    const data = fs.readFileSync(DB_FILE_OPENINGS, 'utf-8');
    try {
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

export function saveAgendaOpening(request: AgendaOpeningRequest): AgendaOpeningRequest {
    const requests = getAgendaOpenings();
    requests.push(request);
    fs.writeFileSync(DB_FILE_OPENINGS, JSON.stringify(requests, null, 2));
    return request;
}

export function updateAgendaOpeningStatus(id: string, status: AgendaOpeningRequest['status']): AgendaOpeningRequest | null {
    const requests = getAgendaOpenings();
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) return null;

    requests[index].status = status;
    fs.writeFileSync(DB_FILE_OPENINGS, JSON.stringify(requests, null, 2));
    return requests[index];
}

