'use client';

import { useState, useEffect } from 'react';
import { BlockingRequest, AgendaOpeningRequest } from '@/lib/db';
import { X, Calendar, Clock, Loader2, AlertTriangle, TrendingUp } from 'lucide-react';

interface PersonnelAuditModalProps {
    professionalName: string;
    onClose: () => void;
}

export default function PersonnelAuditModal({ professionalName, onClose }: PersonnelAuditModalProps) {
    const [blockings, setBlockings] = useState<BlockingRequest[]>([]);
    const [openings, setOpenings] = useState<AgendaOpeningRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const [reqRes, openRes] = await Promise.all([
                    fetch('/api/requests'),
                    fetch('/api/agenda-openings')
                ]);

                if (reqRes.ok && openRes.ok) {
                    const allBlocks: BlockingRequest[] = await reqRes.json();
                    const allOpens: AgendaOpeningRequest[] = await openRes.json();

                    setBlockings(allBlocks.filter(b => b.professionalName?.toLowerCase() === professionalName.toLowerCase()));
                    setOpenings(allOpens.filter(o => o.professionalName?.toLowerCase() === professionalName.toLowerCase()));
                }
            } catch (error) {
                console.error("Error fetching audit data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [professionalName]);

    // Calcular estadísticas
    const currentYear = new Date().getFullYear();
    const totalBlockedDays = blockings.reduce((sum, b) => {
        // Solo contar los del año actual
        const isCurrentYear = b.startDate && b.startDate.startsWith(currentYear.toString());
        return isCurrentYear ? sum + (b.selectedDays?.length || 0) : sum;
    }, 0);

    const blocksVacaciones = blockings.filter(b => b.blockType === 'Feriado Legal Anual').reduce((s, b) => s + (b.selectedDays?.length || 0), 0);
    const blocksAdministrativos = blockings.filter(b => b.blockType === 'Permiso Administrativo').reduce((s, b) => s + (b.selectedDays?.length || 0), 0);
    const blocksKine = blockings.filter(b => b.blockType === 'Capacitacion').reduce((s, b) => s + (b.selectedDays?.length || 0), 0);

    const translateStatus = (status: string) => {
        switch(status) {
            case 'Pending': return <span className="text-orange-600">Pendiente</span>;
            case 'Authorized': return <span className="text-emerald-600">Autorizado</span>;
            case 'Rejected': return <span className="text-red-600">Rechazado</span>;
            case 'Realizado': return <span className="text-blue-600">Realizado</span>;
            default: return <span>{status}</span>;
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return dateStr.substring(0, 10);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            Historial Clínico: {professionalName}
                        </h3>
                        <p className="text-sm text-indigo-200 mt-1">Auditoría consolidada del año {currentYear}</p>
                    </div>
                    <button onClick={onClose} aria-label="Cerrar modal" className="hover:bg-white/20 p-2 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
                        <p>Recopilando el registro histórico...</p>
                    </div>
                ) : (
                    <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                        
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <p className="text-[11px] font-bold text-red-600 uppercase mb-1">Total Días Ausente</p>
                                <p className="text-3xl font-black text-red-900">{totalBlockedDays}</p>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                <p className="text-xs font-bold text-amber-600 uppercase mb-1">Feriado Legal</p>
                                <p className="text-3xl font-black text-amber-900">{blocksVacaciones}</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <p className="text-xs font-bold text-orange-600 uppercase mb-1">Permiso Admin.</p>
                                <p className="text-3xl font-black text-orange-900">{blocksAdministrativos}</p>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Aperturas/Recuperación</p>
                                <p className="text-3xl font-black text-emerald-900">{openings.length}</p>
                            </div>
                        </div>

                        {/* Recent History Lists */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <div className="space-y-4">
                                <h4 className="font-bold flex items-center gap-2 text-gray-800 border-b pb-2">
                                    <Calendar size={18} className="text-red-500" /> Últimos Bloqueos
                                </h4>
                                {blockings.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No hay historial de bloqueos.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {blockings.slice(0, 10).map((b) => (
                                            <div key={b.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-1 hover:shadow-sm transition-all">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-sm text-gray-900">{b.blockType}</span>
                                                    <span className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded border">{formatDate(b.startDate)} al {formatDate(b.endDate)}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 flex gap-2">
                                                    <span className="bg-red-100 text-red-700 px-1.5 rounded font-semibold">{b.selectedDays?.length || 0} Días</span>
                                                    <span className="font-semibold">{translateStatus(b.status)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold flex items-center gap-2 text-gray-800 border-b pb-2">
                                    <TrendingUp size={18} className="text-emerald-500" /> Últimas Aperturas
                                </h4>
                                {openings.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No hay historial de aperturas.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {openings.slice(0, 10).map((o) => (
                                            <div key={o.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-1 hover:shadow-sm transition-all">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-sm text-gray-900">{o.requestType || 'Apertura'}</span>
                                                    <span className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded border">{o.selectedDays?.length ? formatDate(o.selectedDays[0]) : ''}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 flex gap-2">
                                                    <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded font-semibold">{o.startTime} - {o.endTime}</span>
                                                    <span className="font-semibold">{translateStatus(o.status)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
