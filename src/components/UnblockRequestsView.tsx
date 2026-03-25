'use client';

import { useState, useEffect } from 'react';
import { BlockingRequest } from '@/lib/db';
import { format } from 'date-fns';
import { Calendar, Search, AlertCircle, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface UnblockRequestsViewProps {
    userEmail: string;
}

export default function UnblockRequestsView({ userEmail }: UnblockRequestsViewProps) {
    const [requests, setRequests] = useState<BlockingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [reason, setReason] = useState<Record<string, string>>({});

    const fetchMyRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/requests');
            const data = await res.json();
            if (Array.isArray(data)) {
                // Only show my authorized requests or those with unblock already requested
                const myRequests = data.filter((req: BlockingRequest) => 
                    req.submitterEmail === userEmail && (req.status === 'Authorized' || req.unblockStatus !== 'None')
                );
                setRequests(myRequests);
            }
        } catch (error) {
            console.error('Error fetching unblockable requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyRequests();
    }, [userEmail]);

    const handleRequestUnblock = async (id: string) => {
        if (!reason[id]) {
            alert('Por favor ingrese el motivo del desbloqueo.');
            return;
        }

        setSubmittingId(id);
        try {
            const res = await fetch(`/api/requests/${id}/unblock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    unblockStatus: 'Requested',
                    unblockReason: reason[id]
                }),
            });

            if (res.ok) {
                await fetchMyRequests();
            } else {
                alert('Error al enviar la solicitud.');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setSubmittingId(null);
        }
    };

    const filtered = requests.filter(req => 
        req.professionalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.blockType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-gray-500 font-medium font-sans">Cargando tus solicitudes de bloqueo...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <RefreshCw className="text-blue-600" size={28} />
                        Solicitudes de Desbloqueo
                    </h2>
                    <p className="text-gray-500 mt-1 font-sans">Gestiona el desbloqueo de agendas subidas por ti que ya no requieren bloqueo.</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por profesional o tipo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filtered.length === 0 ? (
                    <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-gray-100 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No se encontraron solicitudes</h3>
                        <p className="text-gray-500 mt-1">Solo puedes solicitar el desbloqueo de agendas que tú mismo hayas subido y estén autorizadas.</p>
                    </div>
                ) : (
                    filtered.map((req) => (
                        <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-blue-50 rounded-xl">
                                            <Calendar className="text-blue-600" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{req.professionalName}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">{req.profession}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-sm text-gray-500 font-medium">{req.blockType}</span>
                                            </div>
                                            <div className="text-sm text-gray-600 mt-2 font-bold font-sans">
                                                {req.selectedDays && req.selectedDays.length > 0 
                                                    ? req.selectedDays.map(d => format(new Date(d), 'dd/MM')).join(', ')
                                                    : format(new Date(req.startDate), 'dd/MM/yyyy')}
                                                {' '} • {req.startTime} - {req.endTime}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 min-w-[300px]">
                                        {req.unblockStatus === 'None' || !req.unblockStatus ? (
                                            <div className="flex flex-col gap-2">
                                                <textarea
                                                    placeholder="Motivo del desbloqueo (Ej: Capacitación suspendida)..."
                                                    value={reason[req.id] || ''}
                                                    onChange={(e) => setReason(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm font-sans focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                                                />
                                                <button
                                                    onClick={() => handleRequestUnblock(req.id)}
                                                    disabled={submittingId === req.id}
                                                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {submittingId === req.id ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                                    Solicitar Desbloqueo
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={clsx(
                                                "p-4 rounded-xl border flex items-start gap-3",
                                                req.unblockStatus === 'Requested' ? "bg-amber-50 border-amber-100 text-amber-800" :
                                                req.unblockStatus === 'Approved' ? "bg-green-50 border-green-100 text-green-800" :
                                                "bg-red-50 border-red-100 text-red-800"
                                            )}>
                                                {req.unblockStatus === 'Requested' ? <AlertCircle className="shrink-0 mt-0.5" size={20} /> :
                                                 req.unblockStatus === 'Approved' ? <CheckCircle2 className="shrink-0 mt-0.5" size={20} /> :
                                                 <XCircle className="shrink-0 mt-0.5" size={20} />}
                                                <div>
                                                    <div className="font-bold text-sm uppercase tracking-wider">
                                                        Desbloqueo {req.unblockStatus === 'Requested' ? 'Pendiente' : 
                                                                    req.unblockStatus === 'Approved' ? 'Aprobado' : 'Rechazado'}
                                                    </div>
                                                    <p className="text-sm mt-1 opacity-90 font-medium">Motivo: {req.unblockReason}</p>
                                                    {req.unblockStatus === 'Requested' && (
                                                        <p className="text-xs mt-2 italic">A la espera de autorización administrativa.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
