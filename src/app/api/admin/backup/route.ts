import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserByEmail } from '@/lib/auth-db';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.email) {
            return new NextResponse('No autorizado', { status: 401 });
        }

        const user = await getUserByEmail(session.email);
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'Admin' || session.email === 'kkoandres@gmail.com';

        if (!isAdmin) {
            return new NextResponse('No autorizado', { status: 403 });
        }

        // Fetch all tables from DB
        const users = await prisma.user.findMany();
        const personnel = await prisma.personnel.findMany();
        const agendaBlockRequests = await prisma.agendaBlockRequest.findMany();
        const agendaOpenings = await prisma.agendaOpening.findMany();
        const solicitudesAdministrativas = await prisma.solicitudAdministrativa.findMany();
        const balances = await prisma.balance.findMany();
        const rooms = await prisma.room.findMany();
        const assets = await prisma.asset.findMany();
        const reservations = await prisma.reservation.findMany();
        const reservationAssets = await prisma.reservationAsset.findMany();
        const roomSchedules = await prisma.roomSchedule.findMany();
        const postas = await prisma.posta.findMany();
        const vehiculos = await prisma.vehiculo.findMany();
        const personalLogistica = await prisma.personalLogistica.findMany();
        const rondas = await prisma.ronda.findMany();
        const solicitudesSalidas = await prisma.solicitudSalida.findMany();
        const pacientesLogistica = await prisma.pacienteLogistica.findMany();
        const agendaBlocks = await prisma.agendaBlock.findMany();
        const blockedPatients = await prisma.blockedPatient.findMany();
        const demandRequests = await prisma.demandRequest.findMany();
        const demandAuditLogs = await prisma.demandAuditLog.findMany();

        const backupData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                exportedBy: session.email,
                version: "1.0",
            },
            data: {
                users,
                personnel,
                agendaBlockRequests,
                agendaOpenings,
                solicitudesAdministrativas,
                balances,
                rooms,
                assets,
                reservations,
                reservationAssets,
                roomSchedules,
                postas,
                vehiculos,
                personalLogistica,
                rondas,
                solicitudesSalidas,
                pacientesLogistica,
                agendaBlocks,
                blockedPatients,
                demandRequests,
                demandAuditLogs
            }
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        
        return new NextResponse(jsonString, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="respaldo-cesfam-${new Date().toISOString().split('T')[0]}.json"`,
            },
        });
    } catch (error: any) {
        console.error('Error creating database backup:', error);
        return new NextResponse(`Error interno del servidor: ${error.message}`, { status: 500 });
    }
}
