import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RoomsClient } from "./RoomsClient";
import { getUserByEmail } from "@/lib/auth-db";
import Link from "next/link";

import { ArrowLeft } from "lucide-react";

export default async function RoomsAdminPage() {
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

  const rooms = await prisma.room.findMany({
    include: { schedules: true },
    orderBy: { name: "asc" }
  });

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Link
              href="/reservas"
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              Calendario
            </Link>
            <div className="hidden md:block w-px h-6 bg-gray-200" />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-none">
                Gestión de <span className="text-blue-600">Salas</span>
              </h1>
              <p className="text-xs text-gray-400 font-semibold mt-1">Añade nuevas salas de reunión y configura sus horarios disponibles.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/reservas/admin" 
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-blue-100"
            >
              Ver Solicitudes
            </Link>
          </div>
        </header>

        <RoomsClient initialRooms={rooms} />
      </div>
    </div>
  );
}
