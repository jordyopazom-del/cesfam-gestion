import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/session';

// 1. Specify protected and public routes
const protectedRoutes = ['/', '/dashboard', '/calendar'];
const publicRoutes = ['/login'];

export default async function middleware(req: NextRequest) {
    // 2. Check if the current route is protected or public
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.includes(path) || path.startsWith('/dashboard');
    const isPublicRoute = publicRoutes.includes(path);

    // 3. Decrypt the session from the cookie
    const cookie = req.cookies.get('cesfam_session')?.value;
    const session = cookie ? await decrypt(cookie) : null;

    // 4. Redirect to /login if the user is not authenticated
    if (isProtectedRoute && !session?.email) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    // 5. Redirect to /dashboard if the user is authenticated
    if (
        isPublicRoute &&
        session?.email &&
        !req.nextUrl.pathname.startsWith('/dashboard') &&
        req.nextUrl.pathname !== '/' // Allow root if authenticated (will handle root redirect below)
    ) {
        return NextResponse.redirect(new URL('/', req.nextUrl));
    }

    // 6. Check for forced password change
    if (session?.email && session?.mustChangePassword && req.nextUrl.pathname !== '/change-password') {
        return NextResponse.redirect(new URL('/change-password', req.nextUrl));
    }

    // 7. Prevent access to change-password if not needed
    if (session?.email && !session?.mustChangePassword && req.nextUrl.pathname === '/change-password') {
        return NextResponse.redirect(new URL('/', req.nextUrl));
    }

    return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
