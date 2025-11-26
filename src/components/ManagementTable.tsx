'use client';

import { useEffect, useState } from 'react';
import { Request } from '@/lib/db';
import { Search, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function ManagementTable({ refreshTrigger, isAdmin }: { refreshTrigger: number, isAdmin: boolean }) {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/requests');
            const data = await res.json();
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch requests', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [refreshTrigger]);


    const handleAgendaStatusChange = async (id: string, newStatus: Request['agendaBlockedStatus']) => {
        // Optimistic update
        setRequests(prev => prev.map(r => r.id === id ? { ...r, agendaBlockedStatus: newStatus } : r));

        try {
            const res = await fetch(`/api/requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agendaBlockedStatus: newStatus }),
            });

            if (!res.ok) {
                // Revert if failed
                fetchRequests();
                alert('Error al actualizar estado de agenda');
            }
        } catch (error) {
            fetchRequests();
            alert('Error al actualizar estado de agenda');
        }
    };

    const filteredRequests = requests.filter(r =>
        r.professionalName.toLowerCase().includes(filter.toLowerCase()) ||
        r.profession.toLowerCase().includes(filter.toLowerCase()) ||
        r.coordinator.toLowerCase().includes(filter.toLowerCase())
    );

    // Sort by created date desc
    const sortedRequests = [...filteredRequests].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (loading && requests.length === 0) {
        return <div className="text-center p-10 text-gray-500">Cargando solicitudes...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800">Gestión de Solicitudes</h2>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Fecha Solicitud</th>
                            <th className="p-4">Solicitante</th>
                            <th className="p-4">Lugar</th>
                            <th className="p-4">Profesional</th>
                            <th className="p-4">Tipo Bloqueo</th>
                            <th className="p-4">Fechas</th>
                            <th className="p-4">Horas</th>
                            <th className="p-4 text-center">Agenda Bloqueada</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedRequests.map((req) => (
                            <tr key={req.id} className={clsx(
                                "transition",
                                req.agendaBlockedStatus === 'Realizado' ? "bg-green-50 hover:bg-green-100" :
                                    req.agendaBlockedStatus === 'Sin Agenda' ? "bg-yellow-50 hover:bg-yellow-100" :
                                        req.agendaBlockedStatus === 'No Corresponde' ? "bg-red-50 hover:bg-red-100" :
                                            "hover:bg-gray-50"
                            )}>
                                <td className="p-4 whitespace-nowrap">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4">{req.coordinator}</td>
                                <td className="p-4">{req.location || '-'}</td>
                                <td className="p-4">
                                    <div className="font-medium text-gray-900">{req.professionalName}</div>
                                    <div className="text-xs text-gray-500">{req.profession}</div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                                        {req.blockType}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="max-w-[300px] text-xs leading-relaxed">
                                        {req.selectedDays
                                            ? req.selectedDays
                                                .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                                                .map(d => format(new Date(d), 'dd/MM'))
                                                .join(', ')
                                            : (() => {
                                                const [y1, m1, d1] = req.startDate.split('-').map(Number);
                                                const [y2, m2, d2] = req.endDate.split('-').map(Number);
                                                return `${d1}/${m1}/${y1} - ${d2}/${m2}/${y2}`;
                                            })() // Fallback for old data
                                        }
                                    </div>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                    {req.startTime} - {req.endTime}
                                </td>
                                <td className="p-4 text-center">
                                    {isAdmin ? (
                                        <select
                                            value={req.agendaBlockedStatus || ''}
                                            onChange={(e) => handleAgendaStatusChange(req.id, e.target.value as any)}
                                            className="block w-full pl-3 pr-10 py-2 text-xs border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white/50"
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="Realizado">Realizado</option>
                                            <option value="Sin Agenda">Sin Agenda</option>
                                            <option value="No Corresponde">No Corresponde</option>
                                        </select>
                                    ) : (
                                        <span className={clsx(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                            req.agendaBlockedStatus === 'Realizado' ? "bg-green-100 text-green-800" :
                                                req.agendaBlockedStatus === 'Sin Agenda' ? "bg-yellow-100 text-yellow-800" :
                                                    req.agendaBlockedStatus === 'No Corresponde' ? "bg-red-100 text-red-800" :
                                                        "text-gray-500"
                                        )}>
                                            {req.agendaBlockedStatus || '-'}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {sortedRequests.length === 0 && (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-400">
                                    No se encontraron solicitudes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
