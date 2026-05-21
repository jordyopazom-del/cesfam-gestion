import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminClient } from "./AdminClient";
import { getUserByEmail } from "@/lib/auth-db";

import { ArrowLeft } from "lucide-react";

export default async function AdminPage() {
  const session = await getSession();

  if (!session || !session.email) {
    redirect("/login");
  }

  const user = await getUserByEmail(session.email);
  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.role === "ADMIN" || user.role === "Admin" || session.email === "kkoandres@gmail.com";
  if (!isAdmin) {
    redirect("/reservas");
  }

  // Fetch PENDING reservations
  const pendingReservations = await prisma.reservation.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { name: true, email: true } },
      room: { select: { name: true } },
      assets: { include: { asset: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const serialized = pendingReservations.map(r => ({
    id: r.id,
    roomName: r.room.name,
    userName: r.user.name || r.user.email || "Usuario",
    userEmail: r.user.email || "Sin correo",
    startTime: r.startTime.toISOString(),
    endTime: r.endTime.toISOString(),
    reason: r.reason || "Sin motivo",
    assets: r.assets.map(a => a.asset.name).join(", ")
  }));

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <a
              href="/reservas"
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              Calendario
            </a>
            <div className="hidden md:block w-px h-6 bg-gray-200" />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-none">
                Gestión de <span className="text-blue-600">Reservas</span>
              </h1>
              <p className="text-xs text-gray-400 font-semibold mt-1">Aprobación y rechazo de reservas de salas pendientes.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/reservas/admin/rooms" 
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-blue-100"
            >
              Administrar Salas
            </a>
          </div>
        </header>

        <AdminClient initialReservations={serialized} />
      </div>
    </div>
  );
}
