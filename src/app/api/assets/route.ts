import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const assets = await prisma.asset.findMany({
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(assets);
    } catch (error) {
        console.error('Error fetching assets:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name, description } = body;

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const newAsset = await prisma.asset.create({
            data: { name, description }
        });

        return NextResponse.json(newAsset, { status: 201 });
    } catch (error) {
        console.error('Error creating asset:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
