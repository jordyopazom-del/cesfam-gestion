import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/session-crypto';

// 1. Rutas que requieren sesión activa
const protectedRoutes = ['/', '/dashboard', '/calendar', '/logistica', '/reservas', '/solicitudes', '/sso', '/change-password'];
const publicRoutes = ['/login', '/register', '/forgot-password'];

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    const isProtectedRoute = protectedRoutes.some(r => path === r || path.startsWith(r + '/'));
    const isPublicRoute = publicRoutes.some(r => path === r || path.startsWith(r + '/'));

    // 2. Decrypt the session from the cookie
    const cookie = req.cookies.get('cesfam_session')?.value;
    const session = cookie ? await decrypt(cookie) : null;

    // 3. Si no está autenticado y quiere entrar a una ruta protegida → Login
    if (isProtectedRoute && !session?.email) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    // 4. Si ya está autenticado y quiere ir al login → Redirigir al home
    if (isPublicRoute && session?.email && path !== '/forgot-password') {
        return NextResponse.redirect(new URL('/', req.nextUrl));
    }

    // 5. Forzar cambio de contraseña
    if (session?.email && session?.mustChangePassword && path !== '/change-password') {
        return NextResponse.redirect(new URL('/change-password', req.nextUrl));
    }

    return NextResponse.next();
}

// No aplicar middleware en assets, imágenes ni APIs internas
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$).*)'],
};
