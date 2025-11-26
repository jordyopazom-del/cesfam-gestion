import { NextResponse, NextRequest } from 'next/server';
import { getRequests, saveRequest, BlockingRequest } from '@/lib/db';

// Polyfill for uuid since I didn't install it, or I can just use crypto.randomUUID
function generateId() {
    return crypto.randomUUID();
}

export async function GET() {
    const requests = await getRequests();
    return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const newRequest: BlockingRequest = {
            id: generateId(),
            ...body,
            status: 'Pending',
            createdAt: new Date().toISOString(),
        };
        await saveRequest(newRequest);
        return NextResponse.json(newRequest);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }
}
