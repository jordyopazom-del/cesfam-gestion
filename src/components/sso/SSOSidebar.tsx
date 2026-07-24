"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, XCircle, ArrowRightLeft, Clock,
  Calendar, UploadCloud, Settings, LogOut, ArrowLeft,
} from "lucide-react";
import { logout } from "@/app/actions/auth";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const navigation = [
  { name: "Panel Analítico", href: "/sso/dashboard", icon: LayoutDashboard },
  { name: "Gestión Rechazos", href: "/sso/rechazos", icon: XCircle },
  { name: "Gestión Derivaciones", href: "/sso/derivaciones", icon: ArrowRightLeft },
  { name: "Estado de Horas", href: "/sso/horas", icon: Clock },
];

const adminNavigation = [
  { name: "Carga de Datos", href: "/sso/admin/carga", icon: UploadCloud },
  { name: "Panel Adm.", href: "/sso/admin/panel", icon: Settings },
];

interface SSOSidebarProps {
  userName: string;
  userRole: string;
}

export default function SSOSidebar({ userName, userRole }: SSOSidebarProps) {
  const pathname = usePathname();
  const isAdmin = userRole === "admin";
  const initials = userName.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white no-print fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center mb-8 px-6 mt-8 gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center">
            SOME <span className="text-blue-600 ml-1">Gestión</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Control de Operaciones
          </span>
        </div>
      </div>

      {/* Volver al sistema principal */}
      <div className="px-4 mb-4">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al sistema principal
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto pt-2 pb-4">
        <nav className="flex-1 space-y-1 px-4">
          <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            Gestión Operativa
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                {item.name}
              </Link>
            );
          })}


        </nav>
      </div>

      {/* Footer: User info + logout */}
      <div className="border-t border-slate-100 p-6 bg-slate-50/50">
        <div className="flex items-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <span className="font-bold text-sm tracking-tighter">{initials}</span>
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-bold text-slate-700 truncate">{userName}</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
              {isAdmin ? "Administrador" : "Gestor"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center rounded-lg px-3 py-2 text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="mr-3 h-4 w-4 text-slate-400 group-hover:text-red-500" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
