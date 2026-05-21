import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReservasClient } from "./ReservasClient";
import { getUserByEmail } from "@/lib/auth-db";

import { ArrowLeft } from "lucide-react";

export default async function ReservasPage() {
  const session = await getSession();

  if (!session || !session.email) {
    redirect("/login");
  }

  const user = await getUserByEmail(session.email);
  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.role === "ADMIN" || user.role === "Admin" || session.email === "kkoandres@gmail.com";

  // Fetch initial data
  const rooms = await prisma.room.findMany({ include: { schedules: true }});
  const assets = await prisma.asset.findMany();
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const reservations = await prisma.reservation.findMany({
    where: {
      startTime: {
        gte: today
      }
    },
    include: {
      user: { select: { name: true, email: true } },
      room: { select: { name: true } },
      assets: { include: { asset: true } }
    }
  });

  // Serialize dates for Client Component
  const serializedReservations = reservations.map(r => ({
    id: r.id,
    roomId: r.roomId,
    roomName: r.room.name,
    userName: r.user.name || r.user.email || "Usuario",
    date: r.startTime.toISOString(),
    startTime: r.startTime.toISOString(),
    endTime: r.endTime.toISOString(),
    status: r.status,
    reason: r.reason || "Sin motivo",
    assets: r.assets.map(a => a.asset.name),
    assetIds: r.assets.map(a => a.assetId)
  }));

  const canReserve = isAdmin || user.role === "SOLICITANTE";

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <a
              href="/"
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              Menú Principal
            </a>
            <div className="hidden md:block w-px h-6 bg-gray-200" />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-none">
                CESFAM <span className="text-blue-600">Reservas</span>
              </h1>
              <p className="text-xs text-gray-400 font-semibold mt-1">Panel de Control de Agenda y Bloqueos de Salas</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <>
                <a 
                  href="/reservas/admin/rooms" 
                  className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-sm rounded-xl border border-gray-200 transition-all shadow-sm"
                >
                  Administrar Salas
                </a>
                <a 
                  href="/reservas/admin" 
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-blue-100"
                >
                  Gestión Admin
                </a>
              </>
            )}
          </div>
        </header>

        <ReservasClient 
          rooms={rooms} 
          assets={assets} 
          initialReservations={serializedReservations} 
          userId={user.id}
          canReserve={canReserve}
        />
      </div>
    </div>
  );
}
