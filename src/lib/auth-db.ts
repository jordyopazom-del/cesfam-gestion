import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';

export interface User {
    email: string;
    password: string; // In a real app, this should be hashed!
    mustChangePassword: boolean;
    resetRequested?: boolean;
    name: string;
    role: string;
    status: 'pending' | 'active' | 'rejected';
}

const DEFAULT_PASSWORD = 'cesfam2026';

export async function getUsers(): Promise<User[]> {
    noStore();
    try {
        const { rows } = await sql`SELECT * FROM users`;
        return rows.map(row => ({
            email: row.email,
            password: row.password,
            mustChangePassword: row.must_change_password,
            resetRequested: row.reset_requested,
            name: row.name,
            role: row.role,
            status: row.status as 'pending' | 'active' | 'rejected'
        }));
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
    noStore();
    try {
        const { rows } = await sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email})`;
        if (rows.length === 0) return undefined;
        const row = rows[0];
        return {
            email: row.email,
            password: row.password,
            mustChangePassword: row.must_change_password,
            resetRequested: row.reset_requested,
            name: row.name,
            role: row.role,
            status: row.status as 'pending' | 'active' | 'rejected'
        };
    } catch (error) {
        console.error('Error fetching user by email:', error);
        return undefined;
    }
}

export async function updateUserPassword(email: string, newPassword: string): Promise<boolean> {
    noStore();
    try {
        await sql`
            UPDATE users 
            SET password = ${newPassword}, must_change_password = FALSE 
            WHERE email = ${email}
        `;
        return true;
    } catch (error) {
        console.error('Error updating user password:', error);
        return false;
    }
}

export async function setPasswordResetRequest(email: string, requested: boolean): Promise<boolean> {
    noStore();
    try {
        await sql`
            UPDATE users 
            SET reset_requested = ${requested} 
            WHERE email = ${email}
        `;
        return true;
    } catch (error) {
        console.error('Error setting password reset request:', error);
        return false;
    }
}

export async function adminResetUserPassword(email: string): Promise<boolean> {
    noStore();
    try {
        await sql`
            UPDATE users 
            SET password = ${DEFAULT_PASSWORD}, must_change_password = TRUE, reset_requested = FALSE 
            WHERE email = ${email}
        `;
        return true;
    } catch (error) {
        console.error('Error resetting user password:', error);
        return false;
    }
}

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
    const user = await getUserByEmail(email);
    if (user && user.password === password) {
        // Solo permitir login si el usuario está activo
        if (user.status !== 'active') {
            return null;
        }
        return user;
    }
    return null;
}

export async function registerUser(email: string, name: string, password: string): Promise<boolean> {
    noStore();
    try {
        await sql`
            INSERT INTO users (email, name, password, role, status, must_change_password)
            VALUES (${email}, ${name}, ${password}, 'Gestor', 'pending', FALSE)
            ON CONFLICT (email) DO NOTHING
        `;
        return true;
    } catch (error) {
        console.error('Error registering user:', error);
        return false;
    }
}

export async function updateUserStatusAndRole(email: string, status: string, role: string): Promise<boolean> {
    noStore();
    try {
        await sql`
            UPDATE users 
            SET status = ${status}, role = ${role} 
            WHERE email = ${email}
        `;
        return true;
    } catch (error) {
        console.error('Error updating user status and role:', error);
        return false;
    }
}
