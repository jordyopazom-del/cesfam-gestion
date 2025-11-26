'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'personnel.json');

export interface Official {
    name: string;
    profession: string;
}

export async function getPersonnel(): Promise<Official[]> {
    noStore();
    try {
        const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading personnel data:', error);
        return [];
    }
}

export async function addOfficial(official: Official): Promise<void> {
    const personnel = await getPersonnel();
    personnel.push(official);
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(personnel, null, 2));
    revalidatePath('/admin/personnel');
}

export async function updateOfficial(oldName: string, updatedOfficial: Official): Promise<void> {
    let personnel = await getPersonnel();
    const index = personnel.findIndex((p) => p.name === oldName);

    if (index !== -1) {
        personnel[index] = updatedOfficial;
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(personnel, null, 2));
        revalidatePath('/admin/personnel');
    }
}

export async function deleteOfficial(name: string): Promise<void> {
    let personnel = await getPersonnel();
    personnel = personnel.filter((p) => p.name !== name);
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(personnel, null, 2));
    revalidatePath('/admin/personnel');
}
