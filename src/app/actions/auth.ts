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

    const user = verifyCredentials(email, password);

    if (!user) {
        return { error: 'Credenciales inválidas.' };
    }

    await createSession(user.email, user.mustChangePassword);

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

    const success = updateUserPassword(session.email, newPassword);

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

    const success = setPasswordResetRequest(email, true);

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
    const success = adminResetUserPassword(email);
    return success;
}

export async function fetchUsers() {
    const { getUsers } = await import('@/lib/auth-db');
    const users = getUsers();
    // Sanitize users (remove password)
    return users.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role,
        resetRequested: u.resetRequested
    }));
}
