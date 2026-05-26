'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import RequestForm from '@/components/RequestForm';
import AgendaOpeningForm from '@/components/AgendaOpeningForm';
import ManagementTable from '@/components/ManagementTable';
import AgendaOpeningTable from '@/components/AgendaOpeningTable';
import UnblockManagementTable from '@/components/UnblockManagementTable';

import { 
    LayoutDashboard, PlusCircle, FileText, CalendarPlus, 
    ChevronDown, User, RefreshCw, Globe, LifeBuoy, 
    ExternalLink, Calendar, Briefcase, Shield, Users, Truck, TrendingUp, Key,
    XCircle, ArrowRightLeft, Clock, UploadCloud, Settings
} from 'lucide-react';
import clsx from 'clsx';
import { logout } from '@/app/actions/auth';
import ReportsView from './ReportsView';
import UserManagement from './UserManagement';
import { Official, getSSOLink } from '@/app/admin/personnel/actions';
import PersonnelView from './PersonnelView';
import UnblockRequestsView from './UnblockRequestsView';
import StatisticsView from './StatisticsView';
import CalendarView from './CalendarView';

interface HomeClientProps {
    isAdmin: boolean;
    userRole?: string;
    personnel: Official[];
    userEmail?: string;
    userName?: string;
    accessLogistica?: boolean;
    accessSolicitudes?: boolean;
    accessReservas?: boolean;
    accessAgendas?: boolean;
    pendingUsersCount?: number;
}

export default function HomeClient({ 
    isAdmin, 
    userRole = 'USUARIO',
    personnel, 
    userEmail, 
    userName, 
    accessLogistica = false, 
    accessSolicitudes = false, 
    accessReservas = false, 
    accessAgendas = false,
    pendingUsersCount = 0
}: HomeClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'form' | 'agenda' | 'table' | 'reports' | 'users' | 'activos' | 'unblock' | 'stats' | 'calendar'>('dashboard');
    const canRequestAgendas = isAdmin || userRole === 'SOLICITANTE';
    const [activeSubTab, setActiveSubTab] = useState<'CLINICO' | 'ADMINISTRATIVO' | 'COORDINADOR'>('CLINICO');
    const [managementView, setManagementView] = useState<'blockings' | 'openings'>('blockings');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isAgendasDropdownOpen, setIsAgendasDropdownOpen] = useState(false);
    const [isApoyoDropdownOpen, setIsApoyoDropdownOpen] = useState(false);
    const [isSsoDropdownOpen, setIsSsoDropdownOpen] = useState(false);
    const agendasDropdownRef = useRef<HTMLDivElement>(null);
    const apoyoDropdownRef = useRef<HTMLDivElement>(null);
    const ssoDropdownRef = useRef<HTMLDivElement>(null);

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleAgendasClick = () => {
        setIsAgendasDropdownOpen(!isAgendasDropdownOpen);
        const agendasTabs = ['form', 'agenda', 'table', 'reports', 'stats', 'calendar'];
        if (!agendasTabs.includes(activeTab)) {
            if (isAdmin) {
                setActiveTab('table');
            } else if (canRequestAgendas) {
                setActiveTab('form');
            } else {
                setActiveTab('calendar');
            }
        }
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (agendasDropdownRef.current && !agendasDropdownRef.current.contains(event.target as Node)) {
                setIsAgendasDropdownOpen(false);
            }
            if (apoyoDropdownRef.current && !apoyoDropdownRef.current.contains(event.target as Node)) {
                setIsApoyoDropdownOpen(false);
            }
            if (ssoDropdownRef.current && !ssoDropdownRef.current.contains(event.target as Node)) {
                setIsSsoDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    {/* Top Row: Brand & User profile */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                        <div 
                            onClick={() => setActiveTab('dashboard')}
                            className="cursor-pointer group flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"
                        >
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight transition-colors group-hover:text-blue-600">
                                CESFAM <span className="text-blue-600">Gestión</span>
                            </h1>
                            <div className="hidden sm:block w-px h-5 bg-gray-200"></div>
                            <p className="text-gray-400 text-xs font-semibold tracking-wide mt-0.5 sm:mt-0">
                                Sistema Integrado de Administración
                            </p>
                        </div>
                        
                        {/* Sleek User Profile Badge */}
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-2 px-3 shadow-inner">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-800">{userName || "Usuario"}</span>
                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">{userRole}</span>
                            </div>
                            <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shadow-sm">
                                {userName?.slice(0, 2).toUpperCase() || "US"}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Navigation menu */}
                    <nav className="flex flex-wrap items-center gap-0.5 md:gap-1 bg-gray-100 p-1.5 rounded-2xl self-start w-full md:w-auto shrink-0">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={clsx(
                                "flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all outline-none",
                                activeTab === 'dashboard' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                            )}
                        >
                            <LayoutDashboard size={16} />
                            Inicio
                        </button>

                        {/* Menú Agendas */}
                        <div className="relative" ref={agendasDropdownRef}>
                            <button
                                onClick={handleAgendasClick}
                                className={clsx(
                                    "flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all outline-none",
                                    (isAgendasDropdownOpen || ['form', 'agenda', 'table', 'reports', 'stats', 'calendar'].includes(activeTab)) ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                                )}
                            >
                                <Calendar size={16} />
                                Agendas
                                <ChevronDown size={14} className={clsx("transition-transform", isAgendasDropdownOpen && "rotate-180")} />
                            </button>

                            {isAgendasDropdownOpen && (
                                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    {canRequestAgendas && (
                                        <>
                                            <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                                                Solicitudes
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setActiveTab('form');
                                                    setIsAgendasDropdownOpen(false);
                                                }}
                                                className={clsx(
                                                    "w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                                                    activeTab === 'form' ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                <PlusCircle size={16} />
                                                Solicitud de Bloqueo
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveTab('agenda');
                                                    setIsAgendasDropdownOpen(false);
                                                }}
                                                className={clsx(
                                                    "w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                                                    activeTab === 'agenda' ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                <CalendarPlus size={16} />
                                                Apertura Agenda
                                            </button>

                                            <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mt-2 mb-1">
                                                Información y Gestión
                                            </div>
                                        </>
                                    )}
                                    
                                    {isAdmin && (
                                        <button
                                            onClick={() => {
                                                setActiveTab('table');
                                                setIsAgendasDropdownOpen(false);
                                            }}
                                            className={clsx(
                                                "w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                                                activeTab === 'table' ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                                            )}
                                        >
                                            <LayoutDashboard size={16} />
                                            Gestión de Agendas
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            setActiveTab('reports');
                                            setIsAgendasDropdownOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                                            activeTab === 'reports' ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        <FileText size={16} />
                                        Reportes
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab('stats');
                                            setIsAgendasDropdownOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                                            activeTab === 'stats' ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        <TrendingUp size={16} />
                                        Estadísticas
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab('calendar');
                                            setIsAgendasDropdownOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                                            activeTab === 'calendar' ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        <Calendar size={16} />
                                        Calendario
                                    </button>
                                </div>
                            )}
                        </div>

                        {accessReservas && (
                            <button
                                onClick={() => { router.push('/reservas'); }}
                                className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-all font-sans"
                            >
                                <Calendar size={16} />
                                Reservas
                            </button>
                        )}
                        {accessLogistica && (
                            <button
                                onClick={() => { router.push('/logistica'); }}
                                className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-all font-sans"
                            >
                                <Truck size={16} />
                                Logística
                            </button>
                        )}

                        <div className="relative" ref={ssoDropdownRef}>
                            <button
                                onClick={() => setIsSsoDropdownOpen(!isSsoDropdownOpen)}
                                className={clsx(
                                    "flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all outline-none",
                                    isSsoDropdownOpen ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                                )}
                            >
                                <RefreshCw size={16} className="text-blue-600" />
                                Gestión Demanda
                                <ChevronDown size={14} className={clsx("transition-transform", isSsoDropdownOpen && "rotate-180")} />
                            </button>

                            {isSsoDropdownOpen && (
                                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                                        Gestión e Información
                                    </div>
                                    <button
                                        onClick={() => {
                                            router.push('/sso/dashboard');
                                            setIsSsoDropdownOpen(false);
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <LayoutDashboard size={16} className="text-gray-400" />
                                        Panel Analítico
                                    </button>
                                    <button
                                        onClick={() => {
                                            router.push('/sso/rechazos');
                                            setIsSsoDropdownOpen(false);
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <XCircle size={16} className="text-gray-400" />
                                        Gestión de Rechazos
                                    </button>
                                    <button
                                        onClick={() => {
                                            router.push('/sso/derivaciones');
                                            setIsSsoDropdownOpen(false);
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <ArrowRightLeft size={16} className="text-gray-400" />
                                        Gestión de Derivaciones
                                    </button>
                                    <button
                                        onClick={() => {
                                            router.push('/sso/reprogramacion');
                                            setIsSsoDropdownOpen(false);
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <Calendar size={16} className="text-gray-400" />
                                        Reprogramación RAS
                                    </button>
                                    <button
                                        onClick={() => {
                                            router.push('/sso/horas');
                                            setIsSsoDropdownOpen(false);
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <Clock size={16} className="text-gray-400" />
                                        Estado de Horas
                                    </button>

                                    {isAdmin && (
                                        <>
                                            <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mt-2 mb-1">
                                                Administración SSO
                                            </div>
                                            <button
                                                onClick={() => {
                                                    router.push('/sso/admin/carga');
                                                    setIsSsoDropdownOpen(false);
                                                }}
                                                className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                            >
                                                <UploadCloud size={16} className="text-gray-400" />
                                                Carga de Datos
                                            </button>
                                            <button
                                                onClick={() => {
                                                    router.push('/sso/admin/panel');
                                                    setIsSsoDropdownOpen(false);
                                                }}
                                                className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                            >
                                                <Settings size={16} className="text-gray-400" />
                                                Panel de Administración
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <a 
                            href="https://sites.google.com/view/cesfambelarminaparedes?pli=1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-all font-sans"
                        >
                            <Globe size={16} />
                            Intranet
                        </a>

                        <div className="relative" ref={apoyoDropdownRef}>
                            <button
                                onClick={() => setIsApoyoDropdownOpen(!isApoyoDropdownOpen)}
                                className={clsx(
                                    "flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                                )}
                            >
                                <LifeBuoy size={16} />
                                Apoyo
                                <ChevronDown size={14} className={clsx("transition-transform", isApoyoDropdownOpen && "rotate-180")} />
                            </button>

                            {isApoyoDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                                        Enlaces Externos
                                    </div>
                                    <a
                                        href="https://www.hbvaldivia.cl/core/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            CORE
                                        </div>
                                        <ExternalLink size={14} className="text-gray-300" />
                                    </a>
                                    <a
                                        href="http://10.8.102.72/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            Ras Minsal
                                        </div>
                                        <ExternalLink size={14} className="text-gray-300" />
                                    </a>
                                    <a
                                        href="https://contingencia.rasvaldivia.cl/rasvaldivia/index.php"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            Ras Externo
                                        </div>
                                        <ExternalLink size={14} className="text-gray-300" />
                                    </a>
                                    <a
                                        href="https://cesfamfutrono.wiener-lab.com/estudios/login/?next=/estudios/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            Laboratorio Cesfam
                                        </div>
                                        <ExternalLink size={14} className="text-gray-300" />
                                    </a>
                                    <a
                                        href="http://laboratorioloslagos.ddns.net/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            Laboratorio Externo
                                        </div>
                                        <ExternalLink size={14} className="text-gray-300" />
                                    </a>
                                </div>
                            )}
                        </div>

                        {isAdmin && (
                            <button
                                onClick={() => {
                                    setActiveTab('activos');
                                    setActiveSubTab('COORDINADOR');
                                }}
                                className={clsx(
                                    "flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all font-sans relative",
                                    (activeTab === 'activos') ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                                )}
                            >
                                <Users size={16} />
                                Funcionarios
                                {pendingUsersCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                                        {pendingUsersCount}
                                    </span>
                                )}
                            </button>
                        )}

                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        <button
                            onClick={() => router.push('/change-password')}
                            className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all font-sans"
                            title="Cambiar mi contraseña"
                        >
                            <Key size={16} />
                            <span>Clave</span>
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        <form action={logout} className="inline-flex items-center">
                            <button
                                type="submit"
                                className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold text-red-600 hover:bg-red-50 transition-all font-sans animate-fade-in"
                            >
                                Salir
                            </button>
                        </form>
                    </nav>
                </header>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             {/* Greeting & Banner */}
                             <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/5 relative overflow-hidden">
                                  <div className="absolute top-[-100%] right-[-50%] w-[120%] h-[200%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
                                  <div className="absolute bottom-[-100%] left-[-50%] w-[120%] h-[200%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
                                  
                                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                       <div className="space-y-2">
                                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                                                 {(() => {
                                                      const hour = new Date().getHours();
                                                      if (hour < 12) return "¡Buenos días";
                                                      if (hour < 19) return "¡Buenas tardes";
                                                      return "¡Buenas noches";
                                                 })()}, <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">{userName || "Usuario"}</span>!
                                            </h2>
                                            <p className="text-slate-300 font-medium text-sm max-w-xl">
                                                 Bienvenido al portal unificado de gestión interna de CESFAM. Selecciona una herramienta para comenzar a trabajar.
                                            </p>
                                       </div>
                                       {isAdmin && pendingUsersCount > 0 && (
                                            <div 
                                                 onClick={() => {
                                                      setActiveTab('activos');
                                                      setActiveSubTab('COORDINADOR');
                                                 }}
                                                 className="flex items-center gap-3 bg-red-500/15 border border-red-500/30 rounded-2xl p-4 cursor-pointer hover:bg-red-500/25 transition-all duration-300 animate-pulse flex-shrink-0"
                                            >
                                                 <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center font-bold text-white text-lg">
                                                      {pendingUsersCount}
                                                 </div>
                                                 <div>
                                                      <p className="text-xs font-bold text-red-300 uppercase tracking-wider">Aprobaciones Pendientes</p>
                                                      <p className="text-sm font-semibold text-white">Solicitudes esperando tu activación</p>
                                                 </div>
                                            </div>
                                       )}
                                  </div>
                             </div>

                              {/* Grid of Modules */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                   {/* Card 1: Agenda y Bloqueos */}
                                   <div className={clsx(
                                        "bg-white rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 shadow-sm relative overflow-hidden group",
                                        accessAgendas 
                                             ? "border-gray-100 hover:shadow-md hover:border-blue-200" 
                                             : "border-gray-100 bg-gray-50/50 opacity-70"
                                   )}>
                                        <div className="space-y-4">
                                             <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
                                                  <CalendarPlus size={24} />
                                             </div>
                                             <div className="space-y-1">
                                                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                       Bloqueo de Agendas
                                                       {!accessAgendas && <span className="text-[10px] bg-gray-100 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full font-bold">Bloqueado</span>}
                                                  </h3>
                                                  <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                                                       Solicitud y apertura de agendas clínicas de funcionarios, bloqueos programados y visualización de reportes semanales.
                                                  </p>
                                             </div>
                                        </div>
                                        <div className="pt-6">
                                             {accessAgendas ? (
                                                  <div className="flex flex-col gap-2">
                                                       {canRequestAgendas ? (
                                                            <>
                                                                 <button 
                                                                      onClick={() => setActiveTab('form')}
                                                                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                                                                 >
                                                                      Solicitar Bloqueo
                                                                 </button>
                                                                 <button 
                                                                      onClick={() => setActiveTab('agenda')}
                                                                      className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs rounded-xl border border-gray-100 transition-all"
                                                                 >
                                                                      Apertura Agenda
                                                                 </button>
                                                            </>
                                                       ) : (
                                                            <>
                                                                 <button 
                                                                      onClick={() => setActiveTab('calendar')}
                                                                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                                                                 >
                                                                      Ver Calendario
                                                                 </button>
                                                                 <button 
                                                                      onClick={() => setActiveTab('reports')}
                                                                      className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs rounded-xl border border-gray-100 transition-all"
                                                                 >
                                                                      Ver Reportes
                                                                 </button>
                                                            </>
                                                       )}
                                                  </div>
                                             ) : (
                                                  <button 
                                                       disabled
                                                       className="w-full py-2.5 px-4 bg-gray-100 text-gray-400 font-bold text-xs rounded-xl cursor-not-allowed"
                                                  >
                                                       Sin Acceso
                                                  </button>
                                             )}
                                        </div>
                                   </div>

                                   {/* Card 2: Logística */}
                                   <div className={clsx(
                                        "bg-white rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 shadow-sm relative overflow-hidden group",
                                        accessLogistica 
                                             ? "border-gray-100 hover:shadow-md hover:border-emerald-200" 
                                             : "border-gray-100 bg-gray-50/50 opacity-70"
                                   )}>
                                        <div className="space-y-4">
                                             <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
                                                  <Truck size={24} />
                                             </div>
                                             <div className="space-y-1">
                                                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                       Gestión Logística
                                                       {!accessLogistica && <span className="text-[10px] bg-gray-100 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full font-bold">Bloqueado</span>}
                                                  </h3>
                                                  <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                                                       Planificación avanzada de rondas médicas, administración de vehículos, conductores, personal clínico y pacientes georreferenciados.
                                                  </p>
                                             </div>
                                        </div>
                                        <div className="pt-6">
                                             {accessLogistica ? (
                                                  <button 
                                                       onClick={() => { router.push('/logistica'); }}
                                                       className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                                                  >
                                                       Entrar al Módulo
                                                  </button>
                                             ) : (
                                                  <button 
                                                       disabled
                                                       className="w-full py-2.5 px-4 bg-gray-100 text-gray-400 font-bold text-xs rounded-xl cursor-not-allowed"
                                                  >
                                                       Sin Acceso
                                                  </button>
                                             )}
                                        </div>
                                   </div>

                                   {/* Card 3: Reservas de Salas */}
                                   <div className={clsx(
                                        "bg-white rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 shadow-sm relative overflow-hidden group",
                                        accessReservas 
                                             ? "border-gray-100 hover:shadow-md hover:border-purple-200" 
                                             : "border-gray-100 bg-gray-50/50 opacity-70"
                                   )}>
                                        <div className="space-y-4">
                                             <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
                                                  <Calendar size={24} />
                                             </div>
                                             <div className="space-y-1">
                                                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                       Reserva de Salas
                                                       {!accessReservas && <span className="text-[10px] bg-gray-100 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full font-bold">Bloqueado</span>}
                                                  </h3>
                                                  <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                                                       Calendario mensual de solicitudes de reserva para salas comunes de reuniones, proyectores, telones y otros activos clínicos.
                                                  </p>
                                             </div>
                                        </div>
                                        <div className="pt-6">
                                             {accessReservas ? (
                                                  <button 
                                                       onClick={() => { router.push('/reservas'); }}
                                                       className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                                                  >
                                                       Ver Calendario
                                                  </button>
                                             ) : (
                                                  <button 
                                                       disabled
                                                       className="w-full py-2.5 px-4 bg-gray-100 text-gray-400 font-bold text-xs rounded-xl cursor-not-allowed"
                                                  >
                                                       Sin Acceso
                                                  </button>
                                             )}
                                        </div>
                                   </div>

                                   {/* Card 4: Módulo SSO (Reprogramación) */}
                                   <div className="bg-white rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 shadow-sm relative overflow-hidden group border-gray-100 hover:shadow-md hover:border-indigo-200">
                                        <div className="space-y-4">
                                             <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
                                                  <RefreshCw size={24} className="animate-spin-slow group-hover:rotate-180 duration-500 transition-all" />
                                             </div>
                                             <div className="space-y-1">
                                                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                       Gestión Demanda
                                                  </h3>
                                                  <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                                                       Planificación RAS, control y gestión de rechazos/derivaciones de interconsultas, panel de carga de datos y control de horas.
                                                  </p>
                                             </div>
                                        </div>
                                        <div className="pt-6">
                                             <button 
                                                  onClick={() => { router.push('/sso/dashboard'); }}
                                                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                                             >
                                                  Entrar al Módulo
                                             </button>
                                        </div>
                                   </div>
                              </div>

                             {/* Admin Dashboard Area */}
                             {isAdmin && (
                                  <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                            <div>
                                                 <h3 className="text-lg font-black text-gray-800">Panel de Control de Administración</h3>
                                                 <p className="text-xs text-gray-400 font-semibold mt-0.5">Control global de permisos, personal clínico e integrantes del portal.</p>
                                            </div>
                                            <button
                                                 onClick={() => {
                                                      setActiveTab('activos');
                                                      setActiveSubTab('COORDINADOR');
                                                 }}
                                                 className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                                            >
                                                 Administrar Usuarios y Permisos
                                            </button>
                                       </div>
                                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between gap-2">
                                                 <div>
                                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Registrado</p>
                                                      <p className="text-3xl font-black text-slate-800 mt-1">{personnel.length}</p>
                                                 </div>
                                                 <span className="text-[10px] font-semibold text-slate-400">Total de funcionarios activos en planilla</span>
                                            </div>
                                            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-col justify-between gap-2">
                                                 <div>
                                                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Gestión de Agendas</p>
                                                      <p className="text-xs font-semibold text-blue-700 mt-2">Acceso a la programación, aperturas y cierres globales.</p>
                                                 </div>
                                                 <span 
                                                      onClick={() => setActiveTab('table')}
                                                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                                                 >
                                                      Ir a Gestión de Agendas →
                                                 </span>
                                            </div>
                                            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl flex flex-col justify-between gap-2">
                                                 <div>
                                                      <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Reserva de Salas</p>
                                                      <p className="text-xs font-semibold text-purple-700 mt-2">Revisión de solicitudes comunes y activos solicitados.</p>
                                                 </div>
                                                 <span 
                                                      onClick={() => { router.push('/reservas/admin'); }}
                                                      className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer"
                                                 >
                                                      Ver Solicitudes de Salas →
                                                 </span>
                                            </div>
                                       </div>
                                  </div>
                             )}
                        </div>
                    )}

                    {activeTab === 'form' && canRequestAgendas && <RequestForm onSuccess={handleSuccess} personnel={personnel} />}
                    {activeTab === 'agenda' && canRequestAgendas && <AgendaOpeningForm onSuccess={handleSuccess} personnel={personnel} />}
                    {activeTab === 'table' && (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                                    <button
                                        onClick={() => setManagementView('blockings')}
                                        className={clsx(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                            managementView === 'blockings' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                        )}
                                    >
                                        Bloqueos
                                    </button>
                                    <button
                                        onClick={() => setManagementView('openings')}
                                        className={clsx(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                            managementView === 'openings' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                        )}
                                    >
                                        Aperturas
                                    </button>
                                </div>
                            </div>
                            {managementView === 'blockings' ? (
                                <ManagementTable refreshTrigger={refreshTrigger} isAdmin={isAdmin} />
                            ) : (
                                <AgendaOpeningTable refreshTrigger={refreshTrigger} isAdmin={isAdmin} />
                            )}
                        </div>
                    )}

                    {activeTab === 'reports' && <ReportsView personnel={personnel} isAdmin={isAdmin} />}
                    {activeTab === 'stats' && <StatisticsView />}
                    {activeTab === 'unblock' && userEmail && <UnblockRequestsView userEmail={userEmail} userName={userName} />}
                    {activeTab === 'calendar' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <CalendarView personnel={personnel} />
                        </div>
                    )}
                    {activeTab === 'activos' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                                <div className="flex bg-gray-50/50 p-1 rounded-xl inline-flex flex-wrap gap-1">
                                    <button
                                        onClick={() => setActiveSubTab('CLINICO')}
                                        className={clsx(
                                            "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all",
                                            activeSubTab === 'CLINICO' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        <User size={16} />
                                        Personal Clínico
                                    </button>
                                    <button
                                        onClick={() => setActiveSubTab('ADMINISTRATIVO')}
                                        className={clsx(
                                            "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all",
                                            activeSubTab === 'ADMINISTRATIVO' ? "bg-white text-amber-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        <Briefcase size={16} />
                                        Personal Administrativo
                                    </button>
                                    <button
                                        onClick={() => setActiveSubTab('COORDINADOR')}
                                        className={clsx(
                                            "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all",
                                            activeSubTab === 'COORDINADOR' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        <Shield size={16} />
                                        Solicitantes
                                    </button>
                                </div>
                            </div>

                            {activeSubTab !== 'COORDINADOR' ? (
                                <PersonnelView 
                                    subTab={activeSubTab} 
                                    personnel={personnel} 
                                    refreshPersonnel={() => setRefreshTrigger(prev => prev + 1)} 
                                />
                            ) : (
                                <UserManagement />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main >
    );
}
