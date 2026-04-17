'use client';

import { useState, useEffect, useRef } from 'react';
import RequestForm from '@/components/RequestForm';
import AgendaOpeningForm from '@/components/AgendaOpeningForm';
import ManagementTable from '@/components/ManagementTable';
import AgendaOpeningTable from '@/components/AgendaOpeningTable';
import UnblockManagementTable from '@/components/UnblockManagementTable';

import { 
    LayoutDashboard, PlusCircle, FileText, CalendarPlus, 
    ChevronDown, User, RefreshCw, Globe, LifeBuoy, 
    ExternalLink, Calendar, Briefcase, Shield, Users, Truck, TrendingUp 
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
    personnel: Official[];
    userEmail?: string;
    userName?: string;
}

export default function HomeClient({ isAdmin, personnel, userEmail, userName }: HomeClientProps) {
    const [activeTab, setActiveTab] = useState<'form' | 'agenda' | 'table' | 'reports' | 'users' | 'activos' | 'unblock' | 'stats' | 'calendar'>('form');
    const [activeSubTab, setActiveSubTab] = useState<'CLINICO' | 'ADMINISTRATIVO' | 'COORDINADOR'>('CLINICO');
    const [managementView, setManagementView] = useState<'blockings' | 'openings'>('blockings');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isAgendasDropdownOpen, setIsAgendasDropdownOpen] = useState(false);
    const [isApoyoDropdownOpen, setIsApoyoDropdownOpen] = useState(false);
    const agendasDropdownRef = useRef<HTMLDivElement>(null);
    const apoyoDropdownRef = useRef<HTMLDivElement>(null);

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
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
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            CESFAM <span className="text-blue-600">Gestión</span>
                        </h1>
                        <p className="text-gray-500 mt-1">Sistema de Control de Agenda y Bloqueos</p>
                    </div>

                    <nav className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                        {/* Menú Agendas */}
                        <div className="relative" ref={agendasDropdownRef}>
                            <button
                                onClick={() => setIsAgendasDropdownOpen(!isAgendasDropdownOpen)}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all outline-none",
                                    (isAgendasDropdownOpen || ['form', 'agenda', 'table', 'reports', 'activos'].includes(activeTab)) ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                                )}
                            >
                                <Calendar size={18} />
                                Agendas
                                <ChevronDown size={14} className={clsx("transition-transform", isAgendasDropdownOpen && "rotate-180")} />
                            </button>

                            {isAgendasDropdownOpen && (
                                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
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
                                    <button
                                        onClick={() => {
                                            setActiveTab('activos');
                                            setActiveSubTab('CLINICO');
                                            setIsAgendasDropdownOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                                            activeTab === 'activos' ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        <Users size={16} />
                                        Funcionarios
                                    </button>
                                    
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

                                    <div className="border-t border-gray-100 mt-2 pt-2">
                                        <button 
                                            onClick={() => {
                                                window.open('/api/sso', '_blank');
                                                setIsAgendasDropdownOpen(false);
                                            }}
                                            className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                                        >
                                            <RefreshCw size={16} />
                                            Reprogramación (SSO)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <a 
                            href="https://sites.google.com/view/cesfambelarminaparedes?pli=1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-all font-sans"
                        >
                            <Globe size={18} />
                            Intranet
                        </a>

                        <div className="relative" ref={apoyoDropdownRef}>
                            <button
                                onClick={() => setIsApoyoDropdownOpen(!isApoyoDropdownOpen)}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                                )}
                            >
                                <LifeBuoy size={18} />
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

                        <button 
                            onClick={async () => {
                                try {
                                    const link = await getSSOLink();
                                    window.open(link, '_blank');
                                } catch (err) {
                                    window.open('https://logistica-hazel.vercel.app/', '_blank');
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-all font-sans"
                        >
                            <Truck size={18} />
                            Logística
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        <form action={logout}>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all font-sans"
                            >
                                Salir
                            </button>
                        </form>
                    </nav>
                </header>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'form' && <RequestForm onSuccess={handleSuccess} personnel={personnel} />}
                    {activeTab === 'agenda' && <AgendaOpeningForm onSuccess={handleSuccess} personnel={personnel} />}
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
