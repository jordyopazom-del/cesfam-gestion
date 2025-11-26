'use server';

import { promises as fs } from 'fs';
import path from 'path';

const REQUESTS_FILE_PATH = path.join(process.cwd(), 'data', 'requests.json');

export interface BlockRequest {
    id: string;
    coordinator: string;
    profession: string;
    professionalName: string;
    blockType: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    status: string;
    createdAt: string;
}

export async function getRequests(): Promise<BlockRequest[]> {
    try {
        const fileContent = await fs.readFile(REQUESTS_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading requests data:', error);
        return [];
    }
}
