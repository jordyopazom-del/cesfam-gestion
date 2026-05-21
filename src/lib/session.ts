import { cookies } from 'next/headers';
import { encrypt, decrypt } from './session-crypto';

export { encrypt, decrypt };

export async function createSession(email: string, mustChangePassword: boolean) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await encrypt({ email, mustChangePassword, expires });

    (await cookies()).set('cesfam_session', session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
}

export async function getSession() {
    const session = (await cookies()).get('cesfam_session')?.value;
    if (!session) return null;
    return await decrypt(session);
}

export async function deleteSession() {
    (await cookies()).delete('cesfam_session');
}
