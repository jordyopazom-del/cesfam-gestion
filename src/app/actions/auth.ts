'use server';

import { verifyCredentials, updateUserPassword } from '@/lib/auth-db';
import { createSession, deleteSession, getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function login(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Por favor ingrese correo y contraseña.' };
    }

    const user = await verifyCredentials(email, password);

    if (!user) {
        // Verificamos si el usuario existe pero está pendiente de aprobación
        const { getUserByEmail } = await import('@/lib/auth-db');
        const existingUser = await getUserByEmail(email);
        if (existingUser && existingUser.status === 'pending') {
            return { error: 'Su cuenta está pendiente de aprobación por un administrador.' };
        }
        if (existingUser && existingUser.status === 'rejected') {
            return { error: 'Su solicitud de acceso ha sido rechazada.' };
        }
        return { error: 'Credenciales inválidas.' };
    }

    await createSession(user.email!, user.mustChangePassword);

    if (user.mustChangePassword) {
        redirect('/change-password');
    } else {
        redirect('/');
    }
}

export async function logout() {
    await deleteSession();
    redirect('/login');
}

export async function changePassword(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session || !session.email) {
        return { error: 'No autorizado.' };
    }

    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!newPassword || !confirmPassword) {
        return { error: 'Por favor ingrese todos los campos.' };
    }

    if (newPassword !== confirmPassword) {
        return { error: 'Las contraseñas no coinciden.' };
    }

    if (newPassword.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    const success = await updateUserPassword(session.email, newPassword);

    if (!success) {
        return { error: 'Error al actualizar la contraseña.' };
    }

    // Update session to remove mustChangePassword flag
    await createSession(session.email, false);

    redirect('/');
}

export async function requestPasswordReset(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;

    if (!email) {
        return { error: 'Por favor ingrese su correo electrónico.' };
    }

    // We don't want to reveal if the email exists or not for security, 
    // but for this internal app it's fine to be more explicit or just say "If the email exists..."
    // For now, let's just try to set the flag.

    // Import dynamically to avoid circular deps if any (though here it's fine)
    const { setPasswordResetRequest } = await import('@/lib/auth-db');

    const success = await setPasswordResetRequest(email, true);

    // Always return success message to avoid user enumeration, or be explicit if preferred.
    // Given the requirements, let's be helpful.
    if (success) {
        return { success: 'Solicitud enviada. Contacte al administrador para aprobar el restablecimiento.' };
    } else {
        return { error: 'Correo no encontrado en el sistema.' };
    }
}

export async function adminResetPassword(email: string) {
    const { adminResetUserPassword } = await import('@/lib/auth-db');
    const success = await adminResetUserPassword(email);
    return success;
}

export async function fetchUsers() {
    const { getUsers } = await import('@/lib/auth-db');
    const users = await getUsers();
    // Sanitize users (remove password)
    return users.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status,
        resetRequested: u.resetRequested,
        accessLogistica: u.accessLogistica,
        accessSolicitudes: u.accessSolicitudes,
        accessReservas: u.accessReservas,
        accessAgendas: u.accessAgendas,
        accessDemanda: u.accessDemanda
    }));
}

export async function register(prevState: any, formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!name || !email || !password || !confirmPassword) {
        return { error: 'Por favor complete todos los campos.' };
    }

    if (password !== confirmPassword) {
        return { error: 'Las contraseñas no coinciden.' };
    }

    if (password.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    const { registerUser, getUserByEmail } = await import('@/lib/auth-db');
    
    // Verificar si ya existe
    const existing = await getUserByEmail(email);
    if (existing) {
        return { error: 'Este correo electrónico ya está registrado.' };
    }

    const success = await registerUser(email, name, password);

    if (success) {
        return { success: 'Registro exitoso. Su cuenta ha sido enviada para aprobación del administrador.' };
    } else {
        return { error: 'Error al procesar el registro.' };
    }
}

export async function adminUpdateUser(
    email: string,
    status: string,
    role: string,
    permissions?: {
        accessLogistica: boolean;
        accessSolicitudes: boolean;
        accessReservas: boolean;
        accessAgendas: boolean;
        accessDemanda: boolean;
    }
) {
    const { updateUserStatusAndRole } = await import('@/lib/auth-db');
    const success = await updateUserStatusAndRole(email, status, role, permissions);
    return success;
}

export async function adminDeleteUser(email: string) {
    const { deleteUser } = await import('@/lib/auth-db');
    const success = await deleteUser(email);
    return success;
}

