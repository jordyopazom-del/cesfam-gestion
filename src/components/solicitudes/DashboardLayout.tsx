'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
    LayoutDashboard,
    FileText,
    Calendar,
    Settings,
    LogOut,
    User,
    PlusCircle,
    BarChart3,
    ArrowLeft
} from 'lucide-react';
import styles from './dashboard.module.css';
import RequestModal from './RequestModal';

interface DashboardLayoutProps {
    children: React.ReactNode;
    balances?: { type: string; remaining: number }[];
    activeView?: string;
    onViewChange?: (view: string) => void;
}

export default function DashboardLayout({ children, balances = [], activeView = 'inicio', onViewChange }: DashboardLayoutProps) {
    const { usuario, isLoading, logout } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isAdmin = usuario?.rol === 'admin';

    useEffect(() => {
        const handleOpenModal = () => setIsModalOpen(true);
        window.addEventListener('open-request-modal', handleOpenModal);
        return () => window.removeEventListener('open-request-modal', handleOpenModal);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.layout}>
            <aside className={`glass-panel ${styles.sidebar}`}>
                <div className="flex flex-col gap-2 mb-4">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors py-1 px-2 rounded-lg hover:bg-blue-50/50 w-fit"
                    >
                        <ArrowLeft size={14} />
                        <span>Menú Principal</span>
                    </Link>
                    <div className={styles.logo}>
                        <FileText />
                        <span>APS Solicitudes</span>
                    </div>
                </div>

                <nav className={styles.nav}>
                    <div
                        className={`${activeView === 'inicio' ? styles.navItemActive : ''} ${styles.navItem}`}
                        onClick={() => onViewChange?.('inicio')}
                    >
                        <LayoutDashboard size={20} />
                        <span>Inicio</span>
                    </div>

                    {!isAdmin && (
                        <div className={styles.navItem} onClick={() => setIsModalOpen(true)}>
                            <PlusCircle size={20} />
                            <span>Nueva Solicitud</span>
                        </div>
                    )}

                    {isAdmin && (
                        <>
                            <div
                                className={`${activeView === 'funcionarios' ? styles.navItemActive : ''} ${styles.navItem}`}
                                onClick={() => onViewChange?.('funcionarios')}
                            >
                                <User size={20} />
                                <span>Funcionarios</span>
                            </div>

                            <div
                                className={`${activeView === 'reportes' ? styles.navItemActive : ''} ${styles.navItem}`}
                                onClick={() => onViewChange?.('reportes')}
                            >
                                <BarChart3 size={20} />
                                <span>Reportes</span>
                            </div>

                            <div
                                className={`${activeView === 'agenda' ? styles.navItemActive : ''} ${styles.navItem}`}
                                onClick={() => onViewChange?.('agenda')}
                            >
                                <Calendar size={20} />
                                <span>Agenda</span>
                            </div>

                            <div className={styles.navItem}>
                                <Settings size={20} />
                                <span>Ajustes</span>
                            </div>
                        </>
                    )}

                </nav>

                <div className={styles.sidebarBottom}>
                    <button
                        onClick={logout}
                        className={`${styles.navItem} ${styles.logout}`}
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>

                    <div className={styles.userInfo}>
                        <p className={styles.textTinyMuted}>Usuario:</p>
                        <p className={styles.userName}>{usuario?.nombre}</p>
                        <p className={styles.userRoleBadge}>{isAdmin ? 'Administrador' : 'Funcionario'}</p>
                    </div>
                </div>
            </aside>

            <main className={styles.main}>
                {children}
            </main>
            <RequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} balances={balances} />
        </div>
    );
}
