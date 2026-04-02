import { useEffect, useState } from 'react';
import { AgendaOpeningRequest } from '@/lib/db';
import { Search, UserCheck, FileText } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { Official, getPersonnel } from '@/app/admin/personnel/actions';
import ProcessingModal from './ProcessingModal';

export default function AgendaOpeningTable({ refreshTrigger, isAdmin }: { refreshTrigger: number, isAdmin: boolean }) {
    const [requests, setRequests] = useState<AgendaOpeningRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [personnel, setPersonnel] = useState<Official[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<AgendaOpeningRequest | null>(null);
    const itemsPerPage = 10;

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/agenda-openings');
            const data = await res.json();
            setRequests(data);
        } catch {
            console.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        getPersonnel().then(setPersonnel);
    }, [refreshTrigger]);

    const handleStatusChange = async (id: string, newStatus: AgendaOpeningRequest['status']) => {
        if (newStatus === 'Realizado') {
            const req = requests.find(r => r.id === id);
            if (req) setSelectedRequest(req);
            return;
        }

        // Optimistic update
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));

        try {
            const res = await fetch(`/api/agenda-openings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                fetchRequests();
                alert('Error al actualizar estado');
            }
        } catch {
            fetchRequests();
            alert('Error al actualizar estado');
        }
    };

    const filteredRequests = requests.filter(r => {
        const isProcessed = r.status === 'Realizado' || r.status === 'No Corresponde';
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
                <h2 className="text-xl font-bold text-gray-800">Gestión de Aperturas de Agenda</h2>
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
                    <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Fecha Solicitud</th>
                            <th className="p-4">Solicitante</th>
                            <th className="p-4">Lugar</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Profesional</th>
                            <th className="p-4">Rendimiento</th>
                            <th className="p-4">Horas</th>
                            <th className="p-4">Días</th>
                            <th className="p-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentItems.map((req) => (
                            <tr key={req.id} className={clsx(
                                "transition",
                                req.status === 'Realizado' ? "bg-green-50 hover:bg-green-100" :
                                    req.status === 'No Corresponde' ? "bg-gray-50 hover:bg-gray-100 opacity-60" : "hover:bg-gray-50"
                            )}>
                                <td className="p-4 whitespace-nowrap align-top">
                                    <div className="text-gray-900 font-medium">
                                        {format(new Date(req.createdAt), 'dd/MM/yyyy')}
                                        <span className="text-gray-400 text-[10px] ml-2">{format(new Date(req.createdAt), 'HH:mm')}</span>
                                    </div>
                                </td>
                                <td className="p-4 align-top leading-tight">{req.coordinator}</td>
                                <td className="p-4 align-top">{req.location || '-'}</td>
                                <td className="p-4 align-top">
                                    <div className="flex flex-col gap-1">
                                        <span className={clsx(
                                            "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase w-fit",
                                            req.requestType === 'Desbloqueo' ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                                        )}>
                                            {req.requestType || 'Apertura'}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-medium">{req.categoryType || '-'}</span>
                                    </div>
                                </td>
                                <td className="p-4 align-top">
                                    <div className="font-semibold text-gray-900 leading-tight">{req.professionalName}</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{req.profession}</div>
                                </td>
                                <td className="p-4 align-top">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold">
                                        {req.performance} min
                                    </span>
                                </td>
                                <td className="p-4 whitespace-nowrap font-medium align-top">
                                    {req.startTime} - {req.endTime}
                                </td>
                                <td className="p-4 align-top">
                                    <div className="max-w-[200px] text-[10px] leading-tight text-gray-500 font-medium">
                                        {req.selectedDays
                                            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                                            .map(d => format(new Date(d), 'dd/MM'))
                                            .join(', ')}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        {isAdmin ? (
                                            <select
                                                aria-label="Cambiar estado de solicitud"
                                                value={req.status || 'Pending'}
                                                onChange={(e) => {
                                                    const newStatus = e.target.value as AgendaOpeningRequest['status'];
                                                    if ((req.status === 'Realizado' || req.status === 'No Corresponde') && newStatus === 'Pending') {
                                                        return;
                                                    }
                                                    handleStatusChange(req.id, newStatus);
                                                }}
                                                className="block w-full px-2 py-1 text-[10px] border-gray-300 focus:outline-none focus:ring-blue-500 rounded-md bg-white/50"
                                                disabled={req.status === 'Realizado' || req.status === 'No Corresponde'}
                                            >
                                                <option value="Pending" disabled={req.status === 'Realizado' || req.status === 'No Corresponde'}>...</option>
                                                <option value="Realizado">OK</option>
                                                <option value="No Corresponde">Err</option>
                                            </select>
                                        ) : (
                                            <span className={clsx(
                                                "inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                                                req.status === 'Realizado' ? "bg-green-100 text-green-800" :
                                                    req.status === 'No Corresponde' ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                                            )}>
                                                {req.status === 'Pending' ? 'Pendiente' : req.status === 'Realizado' ? 'OK' : 'Err'}
                                            </span>
                                        )}

                                        {req.assignedAdmin && (
                                            <div className="text-[9px] text-blue-600 flex items-center gap-1 font-bold bg-blue-50 px-1 py-0.5 rounded uppercase whitespace-nowrap">
                                                <UserCheck size={9} /> {req.assignedAdmin}
                                            </div>
                                        )}
                                        {req.pdfUrl && req.pdfUrl.length > 0 && req.pdfUrl[0] !== 'SIN PACIENTES' && (
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                {req.pdfUrl.map((url, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={url === 'INTERNAL_PDF' || url.startsWith('data:') ? `/api/pdf/${req.id}?index=${idx}` : url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[9px] text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors font-bold uppercase"
                                                        title={`Ver Documento ${idx + 1}`}
                                                    >
                                                        <FileText size={9} /> PDF {req.pdfUrl!.length > 1 ? idx + 1 : ''}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {currentItems.length === 0 && (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-400 text-xs">
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
                    type="Apertura"
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
