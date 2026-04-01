import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSession } from '@/lib/session';
import { getUserByEmail } from '@/lib/auth-db';

export async function GET() {
    try {
        // 1. Obtener la sesión del usuario logueado
        const session = await getSession();
        
        if (!session || !session.email) {
            return new NextResponse('No autorizado', { status: 401 });
        }

        const user = await getUserByEmail(session.email);
        const isAdmin = user?.role === 'Admin' || session.email === 'kkoandres@gmail.com';

        // 2. Armamos la carga (payload)
        const payload = {
            email: session.email,
            role: isAdmin ? "admin" : "gestor"
        };
        
        // 3. Clave secreta (debe estar en .env.local como SSO_SECRET_KEY)
        const SECRET = process.env.SSO_SECRET_KEY || "someagenda";
        
        // 4. Firmar el token (vida de 5 minutos por seguridad)
        const token = jwt.sign(payload, SECRET, { expiresIn: '5m' });
        
        // 5. Redirigir al sistema de Gestión de Demanda mandando el token en la URL
        const destinationUrl = `https://cesfam-gestion-demanda-production.up.railway.app/?sso_token=${token}`;
        
        // Hacemos el redirect HTTP
        return NextResponse.redirect(destinationUrl);
    } catch (error) {
        console.error('Error in SSO redirect:', error);
        return new NextResponse('Error interno del servidor', { status: 500 });
    }
}
