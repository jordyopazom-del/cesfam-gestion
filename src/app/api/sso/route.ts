import { redirect } from 'next/navigation';
import { createSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import admin from 'firebase-admin';

// Inicializar Firebase Admin (solo una vez)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const adminDb = admin.firestore();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const nonce = searchParams.get('sso_nonce');

    if (!nonce) {
        return redirect('/');
    }

    try {
        // 1. Leer el token de Firestore
        const doc = await adminDb.collection('sso_tokens').doc(nonce).get();
        
        if (!doc.exists) {
            return redirect('/login?error=invalid_token');
        }

        const data = doc.data()!;

        // 2. Verificar expiración (usando createdAt del servidor Firebase)
        const now = new Date();
        const createdAt = data.createdAt.toDate();
        const expirationTime = new Date(createdAt.getTime() + 60000); // 60 segundos después
        
        if (now > expirationTime) {
            await adminDb.collection('sso_tokens').doc(nonce).delete();
            return redirect('/login?error=token_expired');
        }

        // 3. Eliminar nonce (un solo uso)
        await adminDb.collection('sso_tokens').doc(nonce).delete();

        // 4. Buscar usuario local por email
        const email = data.email;
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user || user.status !== 'active') {
            // Rechazamos y devolvemos al login con error
            return redirect('/login?error=user_not_registered');
        }

        // 5. Crear sesión local
        // El mustChangePassword es irrelevante para el SSO ya que entra directo
        await createSession(user.email!, false);

        // 6. Redirigir al dashboard
        return redirect('/');

    } catch (error: any) {
        // ⚠️ CRÍTICO: Relanzar excepciones NEXT_REDIRECT
        if (error?.digest?.startsWith("NEXT_REDIRECT")) {
            throw error;
        }
        
        console.error('[SSO] Error al procesar nonce:', error);
        return redirect('/login?error=sso_failed');
    }
}
