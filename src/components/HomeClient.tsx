'use client';

import { useState } from 'react';
import RequestForm from '@/components/RequestForm';
import AgendaOpeningForm from '@/components/AgendaOpeningForm';
import ManagementTable from '@/components/ManagementTable';
import AgendaOpeningTable from '@/components/AgendaOpeningTable';

import { LayoutDashboard, PlusCircle, FileText, CalendarPlus, Users } from 'lucide-react';
import clsx from 'clsx';
import { logout } from '@/app/actions/auth';
import ReportsView from './ReportsView';
import UserManagement from './UserManagement';
import { Official } from '@/app/admin/personnel/actions';

interface HomeClientProps {
    isAdmin: boolean;
    personnel: Official[];
}

export default function HomeClient({ isAdmin, personnel }: HomeClientProps) {
    const [activeTab, setActiveTab] = useState<'form' | 'agenda' | 'table' | 'reports' | 'users'>('form');
    const [managementView, setManagementView] = useState<'blockings' | 'openings'>('blockings');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

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
                        <button
                            onClick={() => setActiveTab('form')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                activeTab === 'form' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                            )}
                        >
                            <PlusCircle size={18} />
                            Solicitud de Bloqueo
                        </button>
                        <button
                            onClick={() => setActiveTab('agenda')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                activeTab === 'agenda' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                            )}
                        >
                            <CalendarPlus size={18} />
                            Apertura Agenda
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('table')}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    activeTab === 'table' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                                )}
                            >
                                <LayoutDashboard size={18} />
                                Gestión
                            </button>
                        )}

                        <button
                            onClick={() => setActiveTab('reports')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                activeTab === 'reports' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                            )}
                        >
                            <FileText size={18} />
                            Reportes
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('users')}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    activeTab === 'users' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                                )}
                            >
                                <Users size={18} />
                                Usuarios
                            </button>
                        )}
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        <form action={logout}>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
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

                    {activeTab === 'reports' && <ReportsView personnel={personnel} />}
                    {activeTab === 'users' && isAdmin && <UserManagement />}
                </div>
            </div>
        </main >
    );
}
