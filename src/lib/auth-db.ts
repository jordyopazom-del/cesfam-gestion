import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export interface User {
    email: string;
    password: string; // In a real app, this should be hashed!
    mustChangePassword: boolean;
    resetRequested?: boolean;
    name: string;
    role: string;
}

const INITIAL_USERS = [
    { email: 'direccioncesfam@munifutrono.cl', name: 'DIRECTORA CESFAM FUTRONO', role: 'Director' },
    { email: 'calvarado@munifutrono.cl', name: 'Claudio Alvarado', role: 'Admin' },
    { email: 'some.cesfam@munifutrono.cl', name: 'SOME CESFAM', role: 'Admin' },
    { email: 'coordinaciontecnica@munifutrono.cl', name: 'Coordinación Técnica', role: 'Coordinator' },
    { email: 'coordinacions2@munifutrono.cl', name: 'Coordinación S2', role: 'Coordinator' },
    { email: 'coordinacions1@munifutrono.cl', name: 'Coordinación S1', role: 'Coordinator' },
    { email: 'coordinacionsaludrural@munifutrono.cl', name: 'Coordinación Salud Rural', role: 'Coordinator' },
    { email: 'coordinacioncecosf@munifutrono.cl', name: 'Coordinación CECOSF', role: 'Coordinator' },
    { email: 'convenioscesfam@munifutrono.cl', name: 'Convenios CESFAM', role: 'Admin' },
    { email: 'gestiondemandafutrono@munifutrono.cl', name: 'Gestión Demanda Futrono', role: 'Admin' },
    { email: 'kkoandres@gmail.com', name: 'Andrés', role: 'Coordinator' },
    { email: 'proyectogoread@munifutrono.cl', name: 'Proyecto GORE AD', role: 'Coordinator' },
];

const DEFAULT_PASSWORD = 'cesfam2026';

function ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

export function initializeUsers() {
    ensureDir();
    if (!fs.existsSync(USERS_FILE)) {
        const users: User[] = INITIAL_USERS.map(u => ({
            ...u,
            password: DEFAULT_PASSWORD,
            mustChangePassword: true,
            resetRequested: false
        }));
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }
}

export function getUsers(): User[] {
    initializeUsers();
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export function getUserByEmail(email: string): User | undefined {
    const users = getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function updateUserPassword(email: string, newPassword: string): boolean {
    const users = getUsers();
    const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (index === -1) return false;

    users[index].password = newPassword;
    users[index].mustChangePassword = false;

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
}

export function setPasswordResetRequest(email: string, requested: boolean): boolean {
    const users = getUsers();
    const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (index === -1) return false;

    users[index].resetRequested = requested;

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
}

export function adminResetUserPassword(email: string): boolean {
    const users = getUsers();
    const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (index === -1) return false;

    users[index].password = DEFAULT_PASSWORD;
    users[index].mustChangePassword = true;
    users[index].resetRequested = false;

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
}

export function verifyCredentials(email: string, password: string): User | null {
    const user = getUserByEmail(email);
    if (user && user.password === password) {
        return user;
    }
    return null;
}
