'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { SignJWT } from 'jose';
import { getSession } from '@/lib/session';
import { formatToTitleCase } from '@/lib/utils';

const SSO_SECRET_KEY = process.env.SSO_SECRET_KEY || 'someagendas';
const ssoKey = new TextEncoder().encode(SSO_SECRET_KEY);

async function syncPersonnelToUser(name: string, email: string) {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail }
    });
    
    if (!existingUser) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('cesfam2026', 10);
        
        await prisma.user.create({
            data: {
                email: cleanEmail,
                name: name.trim(),
                password: hashedPassword,
                status: 'active',
                role: 'USUARIO',
                accessLogistica: true,
                accessSolicitudes: true,
                accessReservas: true,
                accessAgendas: true
            }
        });
        console.log(`Synced personnel ${name} as User with email ${cleanEmail}`);
    }
}

export interface Official {
    id?: number;
    name: string;
    profession: string;
    type?: 'CLINICO' | 'ADMINISTRATIVO' | 'COORDINADOR';
    email?: string;
    birthDate?: string;
}

export async function getPersonnel(): Promise<Official[]> {
    noStore();
    try {
        const personnel = await prisma.personnel.findMany({
            orderBy: { name: 'asc' }
        });
        
        // Auto-sync: Ensure all master officials from Personnel exist in PersonalLogistica
        try {
            const logisticaPersonnel = await prisma.personalLogistica.findMany();
            const logisticaNames = new Set(logisticaPersonnel.map(p => p.nombre.toLowerCase().trim()));
            
            for (const p of personnel) {
                const nameKey = p.name.toLowerCase().trim();
                if (!logisticaNames.has(nameKey)) {
                    await prisma.personalLogistica.create({
                        data: {
                            nombre: p.name,
                            especialidad: p.profession,
                            correo: p.email || null,
                            disponibilidad: true
                        }
                    });
                }
            }
        } catch (syncError) {
            console.error('Error auto-syncing Personnel to Logistica:', syncError);
        }
        
        // Auto-sync to User: Ensure all master officials with emails exist as Users
        try {
            for (const p of personnel) {
                if (p.email) {
                    await syncPersonnelToUser(p.name, p.email);
                }
            }
        } catch (syncUserError) {
            console.error('Error auto-syncing Personnel to User:', syncUserError);
        }
        
        return personnel.map(row => ({
            id: row.id,
            name: formatToTitleCase(row.name),
            profession: formatToTitleCase(row.profession),
            type: row.type as any,
            email: row.email || '',
            birthDate: row.birthDate || ''
        }));
    } catch (error) {
        console.error('Error reading personnel data:', error);
        return [];
    }
}

export async function addOfficial(official: Official): Promise<void> {
    try {
        const fullName = official.name.trim();
        const cleanCargo = official.profession.trim();
        const cleanEmail = (official.email || '').trim().toLowerCase();

        // 1. Create in master Personnel
        await prisma.personnel.create({
            data: {
                name: fullName,
                profession: cleanCargo.toUpperCase(),
                type: official.type || 'CLINICO',
                email: cleanEmail,
                birthDate: official.birthDate || ''
            }
        });

        // 2. Sync to PersonalLogistica (Logística)
        const existingLogistica = await prisma.personalLogistica.findFirst({
            where: { nombre: fullName }
        });
        if (!existingLogistica) {
            await prisma.personalLogistica.create({
                data: {
                    nombre: fullName,
                    especialidad: cleanCargo,
                    correo: cleanEmail || null,
                    disponibilidad: true
                }
            });
        }
        
        // 3. Sync to User (Gestión de Usuarios / Solicitantes)
        if (cleanEmail) {
            await syncPersonnelToUser(fullName, cleanEmail);
        }

        revalidatePath('/admin/personnel');
    } catch (error) {
        console.error('Error adding official:', error);
        throw error;
    }
}

export async function updateOfficial(id: number, updatedOfficial: Official): Promise<void> {
    try {
        const fullName = updatedOfficial.name.trim();
        const cleanCargo = updatedOfficial.profession.trim();
        const cleanEmail = (updatedOfficial.email || '').trim().toLowerCase();

        // 1. Get old official record to find them in Logística by their old name
        const oldOfficial = await prisma.personnel.findUnique({
            where: { id }
        });

        // 2. Update master Personnel
        await prisma.personnel.update({
            where: { id },
            data: {
                name: fullName,
                profession: cleanCargo.toUpperCase(),
                type: updatedOfficial.type,
                email: cleanEmail,
                birthDate: updatedOfficial.birthDate || ''
            }
        });

        // 3. Sync to PersonalLogistica using the old name
        if (oldOfficial) {
            const existingLogistica = await prisma.personalLogistica.findFirst({
                where: { nombre: oldOfficial.name }
            });
            if (existingLogistica) {
                await prisma.personalLogistica.update({
                    where: { id: existingLogistica.id },
                    data: {
                        nombre: fullName,
                        especialidad: cleanCargo,
                        correo: cleanEmail || null,
                    }
                });
            } else {
                // If they didn't exist in Logística for some reason, create them now!
                await prisma.personalLogistica.create({
                    data: {
                        nombre: fullName,
                        especialidad: cleanCargo,
                        correo: cleanEmail || null,
                        disponibilidad: true
                    }
                });
            }
        }
        
        // 4. Sync to User (Gestión de Usuarios / Solicitantes)
        if (cleanEmail) {
            await syncPersonnelToUser(fullName, cleanEmail);
        }

        revalidatePath('/admin/personnel');
    } catch (error) {
        console.error('Error updating official:', error);
        throw error;
    }
}

export async function deleteOfficial(id: number): Promise<void> {
    try {
        // 1. Get official record to find them in Logística by name
        const official = await prisma.personnel.findUnique({
            where: { id }
        });

        if (!official) {
            console.log(`Official with ID ${id} already deleted.`);
            revalidatePath('/admin/personnel');
            return;
        }

        // 2. Delete master Personnel
        try {
            await prisma.personnel.delete({
                where: { id }
            });
        } catch (err: any) {
            console.warn(`Personnel record with ID ${id} could not be deleted (might have been deleted already):`, err.message);
        }

        // 3. Delete in PersonalLogistica
        const existingLogistica = await prisma.personalLogistica.findFirst({
            where: { nombre: official.name }
        });
        if (existingLogistica) {
            try {
                await prisma.personalLogistica.delete({
                    where: { id: existingLogistica.id }
                });
            } catch (err: any) {
                console.warn(`PersonalLogistica record could not be deleted:`, err.message);
            }
        }

        // 4. Delete corresponding User account in Solicitantes if registered
        if (official.email) {
            const emailLower = official.email.trim().toLowerCase();
            const existingUser = await prisma.user.findUnique({
                where: { email: emailLower }
            });
            if (existingUser) {
                try {
                    await prisma.user.delete({
                        where: { email: emailLower }
                    });
                } catch (err: any) {
                    console.warn(`User record could not be deleted:`, err.message);
                }
            }
        }

        revalidatePath('/admin/personnel');
    } catch (error) {
        console.error('Error deleting official:', error);
        throw error;
    }
}

export async function getSSOLink(): Promise<string> {
    const session = await getSession();
    if (!session || !session.email) {
        throw new Error('No authenticado');
    }
    
    const token = await new SignJWT({ 
        email: session.email, 
        timestamp: Date.now() 
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1m')
        .sign(ssoKey);
    
    return `https://logistica-hazel.vercel.app/api/auth/sso?token=${token}`;
}

export async function importCsvAction(csvText: string, separator: string = ';'): Promise<{ success: boolean; count: number; error?: string }> {
    try {
        const lines = csvText.split('\n');
        let count = 0;
        
        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;
            
            // Split by separator
            const columns = cleanLine.split(separator).map(c => c.replace(/^["']|["']$/g, '').trim());
            
            // Skip header row if matches common words
            const firstCol = columns[0]?.toUpperCase() || '';
            if (firstCol.includes('PATERNO') || firstCol.includes('P. APELLIDO') || firstCol.includes('APELLIDO') || firstCol.includes('NOMBRE') || firstCol === 'A.') {
                continue;
            }
            
            if (columns.length < 3) continue; // Needs at least A. Paterno, A. Materno, Nombres
            
            const paterno = columns[0] || '';
            const materno = columns[1] || '';
            const nombres = columns[2] || '';
            const rut = columns[3] || '';
            const nacimiento = columns[4] || '';
            const email = columns[5] || '';
            const cargo = columns[6] || '';
            
            const fullName = `${nombres} ${paterno} ${materno}`.trim().replace(/\s+/g, ' ').toUpperCase();
            if (!fullName) continue;
            
            const cleanEmail = email.trim().toLowerCase() || null;
            const cleanCargo = cargo.trim();
            
            // Determine type ('CLINICO' or 'ADMINISTRATIVO')
            const c = cleanCargo.toUpperCase();
            let areaType: 'CLINICO' | 'ADMINISTRATIVO' = 'CLINICO';
            if (
                c.includes('CONDUCTOR') ||
                c.includes('ADMINISTRATIVO') ||
                c.includes('INFORMATICO') ||
                c.includes('SERVICIO') ||
                c.includes('AUXILIAR')
            ) {
                areaType = 'ADMINISTRATIVO';
            }
            
            // 1. Upsert into Personnel (Agendas)
            await prisma.personnel.upsert({
                where: { name: fullName },
                update: {
                    profession: cleanCargo.toUpperCase(),
                    email: cleanEmail,
                    type: areaType,
                    birthDate: nacimiento
                },
                create: {
                    name: fullName,
                    profession: cleanCargo.toUpperCase(),
                    email: cleanEmail,
                    type: areaType,
                    birthDate: nacimiento
                }
            });
            
            // 2. Upsert into PersonalLogistica (Logística)
            const existingLogistica = await prisma.personalLogistica.findFirst({
                where: { nombre: fullName }
            });
            
            if (existingLogistica) {
                await prisma.personalLogistica.update({
                    where: { id: existingLogistica.id },
                    data: {
                        especialidad: cleanCargo,
                        correo: cleanEmail,
                        disponibilidad: true
                    }
                });
            } else {
                await prisma.personalLogistica.create({
                    data: {
                        nombre: fullName,
                        especialidad: cleanCargo,
                        correo: cleanEmail,
                        disponibilidad: true
                    }
                });
            }
            
            // Auto-create User account
            if (cleanEmail) {
                await syncPersonnelToUser(fullName, cleanEmail);
            }
            
            count++;
        }
        
        revalidatePath('/admin/personnel');
        return { success: true, count };
    } catch (error: any) {
        console.error('Error during CSV import:', error);
        return { success: false, count: 0, error: error?.message || 'Error desconocido' };
    }
}
