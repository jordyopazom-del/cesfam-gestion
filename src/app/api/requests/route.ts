import { NextResponse } from 'next/server';
import { getRequests, saveRequest, Request } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Polyfill for uuid since I didn't install it, or I can just use crypto.randomUUID
function generateId() {
    return crypto.randomUUID();
}

export async function GET() {
    const requests = getRequests();
    return NextResponse.json(requests);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newRequest: Request = {
            id: generateId(),
            ...body,
            status: 'Pending',
            createdAt: new Date().toISOString(),
        };
        saveRequest(newRequest);
        return NextResponse.json(newRequest);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }
}
