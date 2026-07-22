import { SignJWT, jwtVerify } from 'jose';

function getKey() {
    const secretKey = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== 'production' ? 'secret-key-cesfam-2026' : undefined);
    if (!secretKey) {
        throw new Error('SESSION_SECRET or NEXTAUTH_SECRET environment variable is required in production');
    }
    return new TextEncoder().encode(secretKey);
}

export async function encrypt(payload: any) {
    if (!payload) {
        console.error("Warning: encrypt called with falsy payload:", payload);
        return "";
    }
    const key = getKey();
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    try {
        const key = getKey();
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}
