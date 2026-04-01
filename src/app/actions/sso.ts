'use server';

import jwt from 'jsonwebtoken';

/**
 * Genera la URL firmada para el SSO con el sistema de Gestión de Demanda
 */
export async function getSsoUrl(userEmail: string, isAdmin: boolean) {
    const secret = process.env.SSO_SECRET_KEY;
    
    if (!secret) {
        throw new Error('SSO_SECRET_KEY no está definido en el archivo .env');
    }

    const payload = {
        email: userEmail,
        role: isAdmin ? "admin" : "gestor"
    };
    
    // Genera un token que expira en 5 minutos por seguridad
    const token = jwt.sign(payload, secret, { expiresIn: '5m' });
    
    return `https://cesfam-gestion-demanda-production.up.railway.app?sso_token=${token}`;
}
