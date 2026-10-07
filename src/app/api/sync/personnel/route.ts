import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeProfession, getAreaType } from '@/lib/estamentos';
import bcrypt from 'bcryptjs';

const SSO_SECRET_KEY = process.env.SSO_SECRET_KEY || 'someagendas';

async function syncPersonnelToUser(name: string, email: string) {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    
    const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail }
    });
    
    if (!existingUser) {
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
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization') || '';
        const syncHeader = req.headers.get('x-sync-secret') || '';
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();

        if (token !== SSO_SECRET_KEY && syncHeader !== SSO_SECRET_KEY) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { action, funcionario, funcionarios } = body;

        // 1. Inactivar o Dar de Baja
        if (action === 'inactivate' || action === 'delete') {
            const rawName = funcionario?.nombre && funcionario?.apellido 
                ? `${funcionario.nombre} ${funcionario.apellido}`.trim().replace(/\s+/g, ' ').toUpperCase()
                : (funcionario?.name || '').trim().toUpperCase();

            if (!rawName) {
                return NextResponse.json({ error: 'Nombre no provisto' }, { status: 400 });
            }

            // Opcional: Eliminar de PersonalLogistica si se da de baja
            await prisma.personalLogistica.deleteMany({
                where: { nombre: rawName }
            }).catch(() => {});

            return NextResponse.json({ success: true, message: `Funcionario ${rawName} gestionado para baja` });
        }

        // 2. Procesar lote de funcionarios (Full Sync o Bulk)
        if (action === 'bulk_upsert' && Array.isArray(funcionarios)) {
            let count = 0;
            for (const f of funcionarios) {
                if (f.estado_rrhh && f.estado_rrhh !== 'ACTIVO') continue;
                const fullName = `${f.nombre} ${f.apellido}`.trim().replace(/\s+/g, ' ').toUpperCase();
                if (!fullName) continue;

                const profession = normalizeProfession(f.profesion);
                const type = getAreaType(profession);
                const email = (f.correo || '').trim().toLowerCase() || null;

                // Upsert Personnel
                await prisma.personnel.upsert({
                    where: { name: fullName },
                    update: { profession, type, email },
                    create: { name: fullName, profession, type, email }
                });

                // Upsert PersonalLogistica
                const existingLog = await prisma.personalLogistica.findFirst({
                    where: { nombre: fullName }
                });
                if (existingLog) {
                    await prisma.personalLogistica.update({
                        where: { id: existingLog.id },
                        data: { especialidad: profession, correo: email }
                    });
                } else {
                    await prisma.personalLogistica.create({
                        data: {
                            nombre: fullName,
                            especialidad: profession,
                            correo: email,
                            disponibilidad: true
                        }
                    });
                }

                if (email) {
                    await syncPersonnelToUser(fullName, email);
                }
                count++;
            }
            return NextResponse.json({ success: true, processed: count });
        }

        // 3. Upsert individual (Tiempo Real)
        if (!funcionario) {
            return NextResponse.json({ error: 'Faltan datos del funcionario' }, { status: 400 });
        }

        const fullName = `${funcionario.nombre} ${funcionario.apellido}`.trim().replace(/\s+/g, ' ').toUpperCase();
        if (!fullName) {
            return NextResponse.json({ error: 'Nombre o apellido inválido' }, { status: 400 });
        }

        const profession = normalizeProfession(funcionario.profesion);
        const type = getAreaType(profession);
        const email = (funcionario.correo || '').trim().toLowerCase() || null;

        // Upsert Personnel
        const updatedPersonnel = await prisma.personnel.upsert({
            where: { name: fullName },
            update: { profession, type, email },
            create: { name: fullName, profession, type, email }
        });

        // Upsert PersonalLogistica
        const existingLog = await prisma.personalLogistica.findFirst({
            where: { nombre: fullName }
        });
        if (existingLog) {
            await prisma.personalLogistica.update({
                where: { id: existingLog.id },
                data: { especialidad: profession, correo: email }
            });
        } else {
            await prisma.personalLogistica.create({
                data: {
                    nombre: fullName,
                    especialidad: profession,
                    correo: email,
                    disponibilidad: true
                }
            });
        }

        // Sync to User
        if (email) {
            await syncPersonnelToUser(fullName, email);
        }

        return NextResponse.json({ 
            success: true, 
            personnel: updatedPersonnel 
        });

    } catch (error: any) {
        console.error('Error en API de sincronización de personal:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
