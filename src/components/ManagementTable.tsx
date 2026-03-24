'use client';

import { useEffect, useState } from 'react';
import { BlockingRequest } from '@/lib/db';
import { Search, FileText, UserCheck } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import ProcessingModal from './ProcessingModal';
import { Official, getPersonnel } from '@/app/admin/personnel/actions';

export default function ManagementTable({ refreshTrigger, isAdmin }: { refreshTrigger: number, isAdmin: boolean }) {
    const [requests, setRequests] = useState<BlockingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState<BlockingRequest | null>(null);
    const [personnel, setPersonnel] = useState<Official[]>([]);
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
        getPersonnel().then(setPersonnel);
    }, [refreshTrigger]);


    const handleAgendaStatusChange = async (id: string, newStatus: BlockingRequest['agendaBlockedStatus']) => {
        if (newStatus === 'Realizado') {
            const req = requests.find(r => r.id === id);
            if (req) setSelectedRequest(req);
            return;
        }

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

    const filteredRequests = requests.filter(r => {
        const isProcessed = r.agendaBlockedStatus === 'Realizado' ||
            r.agendaBlockedStatus === 'Sin Agenda' ||
            r.agendaBlockedStatus === 'No Corresponde';

        const matchesFilter = r.professionalName.toLowerCase().includes(filter.toLowerCase()) ||
            r.profession.toLowerCase().includes(filter.toLowerCase()) ||
            r.coordinator.toLowerCase().includes(filter.toLowerCase());

        return !isProcessed && matchesFilter;
    });

    // Sort by created date desc
    const sortedRequests = [...filteredRequests].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedRequests.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

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
                <table className="w-full text-left text-[11px] md:text-xs text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider border-b border-gray-100">
                        <tr>
                            <th className="px-3 py-3 whitespace-nowrap">Fecha Solicitud</th>
                            <th className="px-3 py-3 whitespace-nowrap">Solicitante</th>
                            <th className="px-3 py-3">Lugar</th>
                            <th className="px-3 py-3">Profesional</th>
                            <th className="px-3 py-3">Tipo</th>
                            <th className="px-3 py-3">Fechas</th>
                            <th className="px-3 py-3">Horas</th>
                            <th className="px-3 py-3 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentItems.map((req) => (
                            <tr key={req.id} className={clsx(
                                "transition",
                                req.agendaBlockedStatus === 'Realizado' ? "bg-green-50 hover:bg-green-100" :
                                    req.agendaBlockedStatus === 'Sin Agenda' ? "bg-yellow-50 hover:bg-yellow-100" :
                                        req.agendaBlockedStatus === 'No Corresponde' ? "bg-red-50 hover:bg-red-100" :
                                            "hover:bg-gray-50"
                            )}>
                                <td className="px-3 py-3 align-top font-medium text-gray-900">
                                    {format(new Date(req.createdAt), 'dd/MM/yyyy')}
                                    <span className="text-gray-400 text-[9px] ml-1">{format(new Date(req.createdAt), 'HH:mm')}</span>
                                </td>
                                <td className="px-3 py-3 align-top leading-tight max-w-[100px]">{req.coordinator}</td>
                                <td className="px-3 py-3 align-top leading-tight max-w-[120px]">{req.location || '-'}</td>
                                <td className="px-3 py-3 align-top min-w-[140px]">
                                    <div className="font-semibold text-gray-900 leading-tight">{req.professionalName}</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{req.profession}</div>
                                </td>
                                <td className="px-3 py-3 align-top">
                                    <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold leading-tight">
                                        {req.blockType}
                                    </span>
                                </td>
                                <td className="px-3 py-3">
                                    <div className="max-w-[100px] text-[10px] leading-tight text-gray-500">
                                        {req.selectedDays
                                            ? req.selectedDays
                                                .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                                                .map(d => format(new Date(d), 'dd/MM'))
                                                .join(', ')
                                            : '-'
                                        }
                                    </div>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap font-medium">
                                    {req.startTime} - {req.endTime}
                                </td>
                                <td className="px-3 py-3 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        {isAdmin ? (
                                            <select
                                                aria-label="Estado de la agenda"
                                                value={req.agendaBlockedStatus || ''}
                                                onChange={(e) => handleAgendaStatusChange(req.id, e.target.value as any)}
                                                className="block w-full px-2 py-1 text-[10px] border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white/50"
                                            >
                                                <option value="">...</option>
                                                <option value="Realizado">OK</option>
                                                <option value="Sin Agenda">N/A</option>
                                                <option value="No Corresponde">Err</option>
                                            </select>
                                        ) : (
                                            <span className={clsx(
                                                "inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                                                req.agendaBlockedStatus === 'Realizado' ? "bg-green-100 text-green-800" :
                                                    req.agendaBlockedStatus === 'Sin Agenda' ? "bg-yellow-100 text-yellow-800" :
                                                        req.agendaBlockedStatus === 'No Corresponde' ? "bg-red-100 text-red-800" :
                                                            "text-gray-500"
                                            )}>
                                                {req.agendaBlockedStatus || '-'}
                                            </span>
                                        )}

                                        {req.assignedAdmin && (
                                            <div className="text-[9px] text-blue-600 flex items-center gap-1 font-bold bg-blue-50 px-1 py-0.5 rounded uppercase">
                                                <UserCheck size={9} /> {req.assignedAdmin}
                                            </div>
                                        )}
                                        {req.pdfUrl && (
                                            <a
                                                href={req.pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[9px] text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors font-bold uppercase"
                                            >
                                                <FileText size={9} /> PDF
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {currentItems.length === 0 && (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-400">
                                    No se encontraron solicitudes pendientes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="text-sm text-gray-500">
                        Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, sortedRequests.length)}</span> de <span className="font-medium">{sortedRequests.length}</span> solicitudes
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-200 rounded-md text-sm disabled:opacity-50 hover:bg-white transition shadow-sm"
                        >
                            Anterior
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    className={clsx(
                                        "w-8 h-8 rounded-md text-sm font-medium transition",
                                        currentPage === page ? "bg-blue-600 text-white shadow-md" : "hover:bg-white border border-gray-200"
                                    )}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-200 rounded-md text-sm disabled:opacity-50 hover:bg-white transition shadow-sm"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
            {/* Processing Modal */}
            {selectedRequest && (
                <ProcessingModal
                    request={selectedRequest}
                    personnel={personnel}
                    onClose={() => setSelectedRequest(null)}
                    onSuccess={(updated) => {
                        setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
                        setSelectedRequest(null);
                    }}
                />
            )}
        </div>
    );
}
