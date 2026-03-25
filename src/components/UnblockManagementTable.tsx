'use client';

import { useEffect, useState } from 'react';
import { BlockingRequest } from '@/lib/db';
import { Search, FileText, UserCheck, RefreshCw, XCircle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function UnblockManagementTable({ refreshTrigger, isAdmin }: { refreshTrigger: number, isAdmin: boolean }) {
    const [requests, setRequests] = useState<BlockingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

    const handleUnblockAction = async (id: string, action: 'Approved' | 'Rejected') => {
        try {
            const body: any = { unblockStatus: action };
            if (action === 'Approved') {
                body.agendaBlockedStatus = 'Desbloqueado';
            }

            const res = await fetch(`/api/requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                fetchRequests();
            } else {
                alert('Error al procesar la solicitud');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const filteredRequests = requests.filter(r => {
        const isUnblockRequested = r.unblockStatus === 'Requested';
        const matchesFilter = r.professionalName.toLowerCase().includes(filter.toLowerCase()) ||
            r.profession.toLowerCase().includes(filter.toLowerCase()) ||
            r.coordinator.toLowerCase().includes(filter.toLowerCase());

        return isUnblockRequested && matchesFilter;
    });

    const sortedRequests = [...filteredRequests].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedRequests.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);

    if (loading && requests.length === 0) {
        return <div className="text-center p-10 text-gray-500 font-sans">Cargando solicitudes de desbloqueo...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800">Gestión de Desbloqueos</h2>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] md:text-xs text-gray-600">
                    <thead className="bg-amber-50/50 text-amber-900 font-bold uppercase tracking-wider border-b border-amber-100">
                        <tr>
                            <th className="px-3 py-3 whitespace-nowrap">Fecha Solicitud</th>
                            <th className="px-3 py-3 whitespace-nowrap">Solicitante</th>
                            <th className="px-3 py-3">Profesional</th>
                            <th className="px-3 py-3">Motivo Desbloqueo</th>
                            <th className="px-3 py-3">Bloqueo Original</th>
                            <th className="px-3 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                        {currentItems.map((req) => (
                            <tr key={req.id} className="hover:bg-amber-50/30 transition-colors">
                                <td className="px-3 py-3 align-top font-bold text-gray-900">
                                    {format(new Date(req.createdAt), 'dd/MM/yyyy')}
                                    <div className="text-[9px] text-gray-400 font-medium">{format(new Date(req.createdAt), 'HH:mm')} hrs</div>
                                </td>
                                <td className="px-3 py-3 align-top leading-tight max-w-[100px] font-medium">{req.coordinator}</td>
                                <td className="px-3 py-3 align-top">
                                    <div className="font-bold text-gray-900">{req.professionalName}</div>
                                    <div className="text-[9px] text-gray-500 uppercase">{req.profession}</div>
                                </td>
                                <td className="px-3 py-3 align-top">
                                    <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 text-amber-800 text-[10px] italic font-medium">
                                        &quot;{req.unblockReason || 'Sin motivo especificado'}&quot;
                                    </div>
                                </td>
                                <td className="px-3 py-3 align-top">
                                    <div className="text-[10px] leading-tight">
                                        <div className="font-bold text-blue-600">{req.blockType}</div>
                                        <div className="text-gray-500">
                                            {req.selectedDays?.map(d => format(new Date(d), 'dd/MM')).join(', ')}
                                        </div>
                                        <div className="text-gray-400 font-medium">{req.startTime} - {req.endTime}</div>
                                    </div>
                                </td>
                                <td className="px-3 py-3 text-center align-top">
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleUnblockAction(req.id, 'Approved')}
                                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold text-[10px] hover:bg-green-700 transition flex items-center justify-center gap-1 shadow-sm"
                                        >
                                            <CheckCircle2 size={12} /> APROBAR
                                        </button>
                                        <button
                                            onClick={() => handleUnblockAction(req.id, 'Rejected')}
                                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-[10px] hover:bg-red-700 transition flex items-center justify-center gap-1 shadow-sm"
                                        >
                                            <XCircle size={12} /> RECHAZAR
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {currentItems.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-12 text-center">
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <RefreshCw size={32} className="opacity-20" />
                                        <p className="font-bold">No hay solicitudes de desbloqueo pendientes.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="text-sm text-gray-500 font-sans">
                        Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, sortedRequests.length)}</span> de <span className="font-medium">{sortedRequests.length}</span> solicitudes
                    </div>
                    <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={clsx(
                                    "w-8 h-8 rounded-md text-xs font-bold transition-all shadow-sm",
                                    currentPage === page ? "bg-amber-600 text-white shadow-amber-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
