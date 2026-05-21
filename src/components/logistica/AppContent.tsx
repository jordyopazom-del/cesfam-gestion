'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/logistica/AuthContext';
import UserMenu from './UserMenu';
import Dashboard from './Dashboard';
import RondasManagement from './RondasManagement';
import PostasManagement from './PostasManagement';
import VehiculosManagement from './VehiculosManagement';
import PersonalManagement from './PersonalManagement';
import AuthGuard from './AuthGuard';
import SolicitudesManagement from './SolicitudesManagement';
import SolicitudesReport from './SolicitudesReport';
import PacienteManagement from './PacienteManagement';
import type { Ronda, SolicitudSalida } from '@/data/logistica/types';
import {
  LayoutDashboard, TrendingUp, FileText, ClipboardList,
  MapPin, Truck, Users, UserSquare, ChevronDown, ArrowLeft, LogOut
} from 'lucide-react';

type TabId =
  | 'dashboard'
  | 'reporte-solicitudes'
  | 'rondas'
  | 'salidas-programadas'
  | 'postas'
  | 'vehiculos'
  | 'personal'
  | 'solicitudes'
  | 'pacientes';

function clsx(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AppContent() {
  const { isAuthenticated, isLoading, usuario, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [activosOpen, setActivosOpen] = useState(false);
  const [gestionOpen, setGestionOpen] = useState(true);
  const [salidasOpen, setSalidasOpen] = useState(true);
  const [prefillRonda, setPrefillRonda] = useState<Partial<Ronda> | null>(null);

  useEffect(() => {
    if (usuario?.dbRole === 'USER') {
      setActiveTab('salidas-programadas');
    }
  }, [usuario]);

  // Loading mientras la sesión central se verifica
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Cargando Sistema de Logística...</p>
        </div>
      </div>
    );
  }

  const handleApproveSolicitud = (s: SolicitudSalida) => {
    setPrefillRonda({
      fecha: s.fechaViaje,
      indicaciones: s.descripcion,
      tipoSalida: s.tipoSalida,
      postaId: s.destinoId,
      paradasIntermediasIds: s.paradasIntermediasIds || [],
      pasajerosIds: s.funcionariosIds || [],
      // @ts-expect-error solicitanteName is a custom property for prefill logic
      solicitanteName: s.solicitante,
      solicitudesIds: [s.id]
    });
    setActiveTab('rondas');
  };

  const renderContent = () => {
    if (usuario?.dbRole === 'USER') {
      return <RondasManagement viewMode="table" />;
    }
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'reporte-solicitudes': return <SolicitudesReport />;
      case 'salidas-programadas': return <RondasManagement viewMode="table" onSwitchTab={usuario?.rol === 'admin' ? () => setActiveTab('rondas') : undefined} />;
      case 'rondas': return usuario?.rol === 'admin' ? <RondasManagement viewMode="form" prefillData={prefillRonda || undefined} onClearPrefill={() => setPrefillRonda(null)} onSaveSuccess={() => setActiveTab('solicitudes')} /> : <Dashboard />;
      case 'postas': return usuario?.rol === 'admin' ? <PostasManagement /> : <Dashboard />;
      case 'vehiculos': return usuario?.rol === 'admin' ? <VehiculosManagement /> : <Dashboard />;
      case 'personal': return usuario?.rol === 'admin' ? <PersonalManagement /> : <Dashboard />;
      case 'solicitudes': return <SolicitudesManagement onApprove={handleApproveSolicitud} />;
      case 'pacientes': return usuario?.rol === 'admin' ? <PacienteManagement /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  const tabTitle: Record<TabId, string> = {
    'dashboard': 'Dashboard',
    'reporte-solicitudes': 'Reporte de Solicitudes',
    'rondas': 'Programar Nueva Salida',
    'salidas-programadas': 'Salidas Programadas',
    'postas': 'Administración de Destinos',
    'vehiculos': 'Control de Flota',
    'personal': 'Personal',
    'solicitudes': usuario?.rol === 'admin' ? 'Gestión de Solicitudes' : 'Solicitudes de Salida',
    'pacientes': 'Gestión de Pacientes',
  };

  const NavItem = ({
    tab,
    icon: Icon,
    label,
  }: {
    tab: TabId;
    icon: React.ElementType;
    label: string;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={clsx(
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left',
        activeTab === tab
          ? 'bg-blue-50 text-blue-700 font-semibold'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <Icon size={15} className="shrink-0" />
      {label}
    </button>
  );

  const SectionHeader = ({
    label,
    open,
    onToggle,
    icon: Icon,
    accent = false,
  }: {
    label: string;
    open: boolean;
    onToggle: () => void;
    icon: React.ElementType;
    accent?: boolean;
  }) => (
    <button
      onClick={onToggle}
      className={clsx(
        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold transition-all',
        accent
          ? 'text-blue-700'
          : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      <span className="flex items-center gap-2">
        <Icon size={16} />
        {label}
      </span>
      <ChevronDown
        size={14}
        className={clsx('transition-transform duration-200', open && 'rotate-180')}
      />
    </button>
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 font-sans flex flex-col">

        {/* ── TOP HEADER ── */}
        <header className="bg-white border-b border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Botón volver al menú principal */}
            <a
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              Menú Principal
            </a>
            <div className="w-px h-5 bg-gray-200" />
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">
                CESFAM <span className="text-blue-600">Logística</span>
              </h1>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Sistema de Gestión de Salidas Vehiculares</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:block text-sm text-gray-400">
              {usuario?.email}
            </span>
            <div className="w-px h-5 bg-gray-200 hidden md:block" />
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
            >
              <LogOut size={15} />
              Salir
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* ── SIDEBAR ── */}
          <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-y-auto">
            {/* User info */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm uppercase shrink-0">
                  {(usuario?.nombre || 'U').charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{usuario?.nombre}</p>
                  <p className="text-xs text-gray-400 capitalize">{usuario?.rol === 'admin' ? 'Administrador' : 'Personal'}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
              {/* Salidas */}
              <SectionHeader
                label="Salidas de Vehículos"
                open={salidasOpen}
                onToggle={() => setSalidasOpen(o => !o)}
                icon={Truck}
                accent
              />

              {salidasOpen && (
                <div className="pl-3 space-y-0.5 border-l-2 border-blue-100 ml-3">
                  {usuario?.dbRole !== 'USER' && (
                    <>
                      <NavItem tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
                      <NavItem tab="reporte-solicitudes" icon={TrendingUp} label="Reporte de Solicitudes" />
                    </>
                  )}
                  <NavItem tab="salidas-programadas" icon={FileText} label="Salidas Programadas" />
                  {usuario?.dbRole !== 'USER' && (
                    <NavItem tab="solicitudes" icon={ClipboardList} label="Solicitudes de Salida" />
                  )}
                </div>
              )}

              {/* Admin section */}
              {usuario?.rol === 'admin' && (
                <>
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1">Administración</p>
                  </div>

                  <SectionHeader
                    label="Gestión"
                    open={gestionOpen}
                    onToggle={() => setGestionOpen(o => !o)}
                    icon={ClipboardList}
                  />
                  {gestionOpen && (
                    <div className="pl-3 space-y-0.5 border-l-2 border-gray-100 ml-3">
                      <NavItem tab="solicitudes" icon={ClipboardList} label="Gestionar Solicitudes" />
                      <NavItem tab="rondas" icon={FileText} label="Programar Nueva Salida" />
                    </div>
                  )}

                  <SectionHeader
                    label="Activos"
                    open={activosOpen}
                    onToggle={() => setActivosOpen(o => !o)}
                    icon={MapPin}
                  />
                  {activosOpen && (
                    <div className="pl-3 space-y-0.5 border-l-2 border-gray-100 ml-3">
                      <NavItem tab="postas" icon={MapPin} label="Destinos / Postas" />
                      <NavItem tab="vehiculos" icon={Truck} label="Vehículos" />
                      <NavItem tab="pacientes" icon={UserSquare} label="Pacientes" />
                    </div>
                  )}
                </>
              )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">CESFAM Futrono</p>
              <p className="text-[10px] text-gray-300 mt-0.5">Región de Los Ríos</p>
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Breadcrumb header */}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="font-medium text-gray-700">{tabTitle[activeTab]}</span>
              </div>

              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 logistica-scope">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
