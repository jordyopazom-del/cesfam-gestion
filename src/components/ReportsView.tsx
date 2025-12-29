'use client';

import { useState, useEffect } from 'react';
import { BlockingRequest, AgendaOpeningRequest } from '@/lib/db';
import { Filter, FileText, Download, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Official } from '@/app/admin/personnel/actions';

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const safeFormat = (dateStr: string, formatStr: string) => {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        return format(date, formatStr);
    } catch (e) {
        return 'Fecha inválida';
    }
};

export default function ReportsView({ personnel }: { personnel: Official[] }) {
    const [reportType, setReportType] = useState<'blockings' | 'openings' | 'export'>('blockings');
    const [requests, setRequests] = useState<BlockingRequest[]>([]);
    const [openings, setOpenings] = useState<AgendaOpeningRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters for View
    const [selectedMonth, setSelectedMonth] = useState<number>(-1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedProfession, setSelectedProfession] = useState('');
    const [selectedProfessional, setSelectedProfessional] = useState('');

    // Filters for Export
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');

    const PROFESSIONS = Array.from(new Set(personnel.map(p => p.profession)));

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [reqRes, openRes] = await Promise.all([
                    fetch('/api/requests'),
                    fetch('/api/agenda-openings')
                ]);

                if (!reqRes.ok) throw new Error(`Requests API error: ${reqRes.status}`);
                if (!openRes.ok) throw new Error(`Openings API error: ${openRes.status}`);

                const reqData = await reqRes.json();
                const openData = await openRes.json();

                if (Array.isArray(reqData)) {
                    setRequests(reqData);
                } else {
                    console.error('Requests data is not an array:', reqData);
                    setRequests([]);
                }

                if (Array.isArray(openData)) {
                    setOpenings(openData);
                } else {
                    console.error('Openings data is not an array:', openData);
                    setOpenings([]);
                }
            } catch (error) {
                console.error('Failed to fetch data', error);
                setRequests([]);
                setOpenings([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Reset professional when profession changes
    const handleProfessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProfession(e.target.value);
        setSelectedProfessional('');
    };

    // Filter Logic for View
    const filterData = (data: any[]) => {
        return data.filter(item => {
            // Use startDate for requests, or the first selected day for openings
            let itemDate: Date;
            if (item.startDate) {
                itemDate = new Date(item.startDate);
            } else if (item.selectedDays && item.selectedDays.length > 0) {
                // Sort to find the earliest date
                const sortedDays = [...(item.selectedDays || [])].sort();
                itemDate = new Date(sortedDays[0]);
            } else {
                itemDate = new Date(item.createdAt); // Fallback
            }

            // Month Filter (0-11, -1 for All)
            if (selectedMonth !== -1 && itemDate.getMonth() !== selectedMonth) return false;

            // Year Filter
            if (itemDate.getFullYear() !== selectedYear) return false;

            // Profession Filter
            if (selectedProfession && item.profession !== selectedProfession) return false;

            // Professional Filter
            if (selectedProfessional && item.professionalName !== selectedProfessional) return false;

            return true;
        });
    };

    const filteredRequests = filterData(requests);
    const filteredOpenings = filterData(openings);

    // Sort Logic: Newest to Oldest (by createdAt)
    const sortData = (data: any[]) => {
        return [...data].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    };

    const sortedRequests = sortData(filteredRequests);
    const sortedOpenings = sortData(filteredOpenings);

    const filteredProfessionals = personnel.filter(p => p.profession === selectedProfession);

    // Export Logic
    const handleExport = () => {
        if (!exportStartDate || !exportEndDate) {
            alert('Por favor seleccione un rango de fechas');
            return;
        }

        const start = new Date(exportStartDate);
        const end = new Date(exportEndDate);
        end.setHours(23, 59, 59, 999); // Include the end date fully

        const filterByDateRange = (data: any[]) => {
            return data.filter(item => {
                let itemDate: Date;
                if (item.startDate) {
                    itemDate = new Date(item.startDate);
                } else if (item.selectedDays && item.selectedDays.length > 0) {
                    const sortedDays = [...(item.selectedDays || [])].sort();
                    itemDate = new Date(sortedDays[0]);
                } else {
                    itemDate = new Date(item.createdAt);
                }
                return itemDate >= start && itemDate <= end;
            });
        };

        const exportRequests = filterByDateRange(requests).map(req => ({
            'Fecha Solicitud': new Date(req.createdAt).toLocaleDateString(),
            'Solicitante': req.coordinator,
            'Lugar': req.location || '-',
            'Profesión': req.profession,
            'Profesional': req.professionalName,
            'Tipo Bloqueo': req.blockType,
            'Fechas Bloqueo': req.selectedDays ? req.selectedDays.map((d: string) => safeFormat(d, 'dd/MM/yyyy')).join(', ') : `${req.startDate} - ${req.endDate}`,
            'Hora Inicio': req.startTime,
            'Hora Término': req.endTime,
            'Estado Agenda': req.agendaBlockedStatus || 'Pendiente'
        }));

        const exportOpenings = filterByDateRange(openings).map(req => ({
            'Fecha Solicitud': new Date(req.createdAt).toLocaleDateString(),
            'Solicitante': req.coordinator,
            'Lugar': req.location || '-',
            'Profesión': req.profession,
            'Profesional': req.professionalName,
            'Rendimiento': req.performance,
            'Fechas Apertura': req.selectedDays.map((d: string) => safeFormat(d, 'dd/MM/yyyy')).join(', '),
            'Hora Inicio': req.startTime,
            'Hora Término': req.endTime,
            'Estado': req.status === 'Pending' ? 'Pendiente' : req.status
        }));

        const wb = XLSX.utils.book_new();

        if (exportRequests.length > 0) {
            const wsRequests = XLSX.utils.json_to_sheet(exportRequests);
            XLSX.utils.book_append_sheet(wb, wsRequests, "Bloqueos");
        }

        if (exportOpenings.length > 0) {
            const wsOpenings = XLSX.utils.json_to_sheet(exportOpenings);
            XLSX.utils.book_append_sheet(wb, wsOpenings, "Aperturas");
        }

        if (exportRequests.length === 0 && exportOpenings.length === 0) {
            alert('No hay datos para exportar en el rango seleccionado');
            return;
        }

        XLSX.writeFile(wb, `Reporte_Gestion_Agenda_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
    };

    if (loading) {
        return <div className="text-center p-10 text-gray-500">Cargando reportes...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Toggle Report Type */}
            <div className="flex justify-center">
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setReportType('blockings')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                            reportType === 'blockings' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        Reporte Bloqueos
                    </button>
                    <button
                        onClick={() => setReportType('openings')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                            reportType === 'openings' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        Reporte Aperturas
                    </button>
                    <button
                        onClick={() => setReportType('export')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                            reportType === 'export' ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <Download size={16} />
                        Exportar Registros
                    </button>
                </div>
            </div>

            {reportType === 'export' ? (
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Exportar Reportes</h2>
                        <p className="text-gray-500 mt-2">Seleccione un rango de fechas para descargar el reporte en Excel.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Calendar size={16} /> Fecha Inicio
                                </label>
                                <input
                                    type="date"
                                    value={exportStartDate}
                                    onChange={(e) => setExportStartDate(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Calendar size={16} /> Fecha Término
                                </label>
                                <input
                                    type="date"
                                    value={exportEndDate}
                                    onChange={(e) => setExportEndDate(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleExport}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <Download size={20} />
                            Descargar Archivo Excel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Filters Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold">
                            <Filter size={20} className="text-blue-600" />
                            <h2>Filtros de Reporte</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Month Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Mes</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={-1}>Seleccionar mes</option>
                                    {MONTHS.map((month, index) => (
                                        <option key={month} value={index}>{month}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Year Filter (Simple range: Current - 1 to Current + 1) */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Año</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={2024}>2024</option>
                                    <option value={2025}>2025</option>
                                    <option value={2026}>2026</option>
                                </select>
                            </div>

                            {/* Profession Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Estamento</label>
                                <select
                                    value={selectedProfession}
                                    onChange={handleProfessionChange}
                                    className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Todos</option>
                                    {PROFESSIONS.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Professional Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Profesional</label>
                                <select
                                    value={selectedProfessional}
                                    onChange={(e) => setSelectedProfessional(e.target.value)}
                                    disabled={!selectedProfession}
                                    className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                    <option value="">Todos</option>
                                    {filteredProfessionals.map(p => (
                                        <option key={p.name} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FileText size={24} className="text-blue-600" />
                                Resultados ({reportType === 'blockings' ? sortedRequests.length : sortedOpenings.length})
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Fecha Solicitud</th>
                                        <th className="p-4">Solicitante</th>
                                        <th className="p-4">Lugar</th>
                                        <th className="p-4">Profesional</th>
                                        {reportType === 'blockings' ? (
                                            <>
                                                <th className="p-4">Tipo Bloqueo</th>
                                                <th className="p-4">Fechas</th>
                                                <th className="p-4">Horas</th>
                                                <th className="p-4 text-center">Agenda Bloqueada</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="p-4">Rendimiento</th>
                                                <th className="p-4">Horas</th>
                                                <th className="p-4">Días</th>
                                                <th className="p-4 text-center">Estado</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {reportType === 'blockings' ? (
                                        sortedRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-50 transition">
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
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                                        {req.blockType}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="max-w-[300px] text-xs leading-relaxed">
                                                        {req.selectedDays
                                                            ? req.selectedDays
                                                                .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())
                                                                .map((d: string) => safeFormat(d, 'dd/MM'))
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
                                                    <span className={clsx(
                                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                        req.agendaBlockedStatus === 'Realizado' ? "bg-green-100 text-green-800" :
                                                            req.agendaBlockedStatus === 'Sin Agenda' ? "bg-yellow-100 text-yellow-800" :
                                                                req.agendaBlockedStatus === 'No Corresponde' ? "bg-red-100 text-red-800" :
                                                                    "text-gray-500"
                                                    )}>
                                                        {req.agendaBlockedStatus || '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        sortedOpenings.map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-50 transition">
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
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                                        {req.performance} min
                                                    </span>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    {req.startTime} - {req.endTime}
                                                </td>
                                                <td className="p-4">
                                                    <div className="max-w-[300px] text-xs leading-relaxed">
                                                        {req.selectedDays && Array.isArray(req.selectedDays)
                                                            ? [...req.selectedDays]
                                                                .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())
                                                                .map((d: string) => safeFormat(d, 'dd/MM'))
                                                                .join(', ')
                                                            : '-'
                                                        }
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={clsx(
                                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                        req.status === 'Realizado' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                                    )}>
                                                        {req.status === 'Pending' ? 'Pendiente' : req.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}

                                    {((reportType === 'blockings' && sortedRequests.length === 0) ||
                                        (reportType === 'openings' && sortedOpenings.length === 0)) && (
                                            <tr>
                                                <td colSpan={8} className="p-8 text-center text-gray-400">
                                                    No se encontraron solicitudes para los filtros seleccionados.
                                                </td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
