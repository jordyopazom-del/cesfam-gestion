'use client';

import { useState, useEffect } from 'react';
import { BlockingRequest, AgendaOpeningRequest } from '@/lib/db';
import { Filter, FileText, Download, Calendar, Mail, Loader2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Official, formatToTitleCase } from '@/app/admin/personnel/actions';
import ProcessingModal from './ProcessingModal';

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

export default function ReportsView({ personnel, isAdmin }: { personnel: Official[], isAdmin?: boolean }) {
    const [reportType, setReportType] = useState<'blockings' | 'openings' | 'export'>('blockings');
    const [selectedRequestToEdit, setSelectedRequestToEdit] = useState<BlockingRequest | AgendaOpeningRequest | null>(null);
    const [requests, setRequests] = useState<BlockingRequest[]>([]);
    const [openings, setOpenings] = useState<AgendaOpeningRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters for View
    const [selectedMonth, setSelectedMonth] = useState<number>(-1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedProfession, setSelectedProfession] = useState('');
    const [selectedProfessional, setSelectedProfessional] = useState('');

    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [reportType, selectedMonth, selectedYear, selectedProfession, selectedProfessional]);

    const PROFESSIONS = Array.from(new Set(personnel.map(p => p.profession)));

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

    useEffect(() => {
        fetchData();
    }, []);

    const handleSendEmail = (req: any, type: 'blockings' | 'openings') => {
        // Build recipients list
        const recipients = ['gestiondemandafutrono@munifutrono.cl'];
        
        // 1. Submitter (the logged in user who created this request)
        if (req.submitterEmail) {
            recipients.push(req.submitterEmail);
        } else if (req.coordinator) {
            // Fallback for old requests before submitterEmail was tracked
            const fallbackMap: Record<string, string> = {
                "Directora": "direccioncesfam@munifutrono.cl",
                "Coordinadora Técnica": "coordinaciontecnica@munifutrono.cl",
                "Coordinador Rural Cordillera": "coordinacionsaludrural@munifutrono.cl",
                "Coordinador Rural Valle": "coordinacionsaludrural@munifutrono.cl",
                "Coordinador Sector 1": "coordinacions1@munifutrono.cl",
                "Coordinador Sector 2": "coordinacions2@munifutrono.cl",
                "Coordinador Convenios": "convenioscesfam@munifutrono.cl",
                "Coordinador Some": "some.cesfam@munifutrono.cl",
                "Coordinador Gore": "proyectogoread@munifutrono.cl",
                "Encargado Agendas": "kkoandres@gmail.com",
            };
            const mappedEmail = fallbackMap[req.coordinator];
            if (mappedEmail) recipients.push(mappedEmail);
        }

        // 2. Professional (the clinician who is missing/having their agenda opened)
        const professional = personnel.find(p => p.name.toLowerCase() === req.professionalName?.toLowerCase());
        if (professional?.email) recipients.push(professional.email);

        // 3. Assigned Admin
        if (req.assignedAdmin && req.assignedAdmin !== 'N/A') {
            const admin = personnel.find(p => p.name.toLowerCase() === req.assignedAdmin.toLowerCase());
            if (admin?.email) recipients.push(admin.email);
        }
        const isBlock = type === 'blockings';
        const pdfUrls = Array.isArray(req.pdfUrl) ? req.pdfUrl : [];
        const hasDocs = pdfUrls.length > 0 && pdfUrls[0] !== 'SIN PACIENTES';
        
        let docLinksText = '';
        if (hasDocs) {
            docLinksText = pdfUrls.map((url: string, idx: number) => {
                const link = (url === 'INTERNAL_PDF' || url.startsWith('data:'))
                    ? `${window.location.origin}/api/pdf/${req.id}?index=${idx}` 
                    : url;
                return `Documento ${idx + 1}: ${link}`;
            }).join('\n');
        } else {
            docLinksText = 'Sin documento añadido';
        }

        const subject = encodeURIComponent(`Gestión Finalizada: ${isBlock ? 'Bloqueo' : 'Apertura'} - ${req.professionalName}`);
        
        const sortedDays = [...(req.selectedDays || [])].sort((a: any, b: any) => new Date(a).getTime() - new Date(b).getTime());
        let datesString = 'No especificado';
        if (sortedDays.length === 1) {
            datesString = format(new Date(sortedDays[0]), 'dd-MM-yyyy');
        } else if (sortedDays.length > 1) {
            datesString = `desde el ${format(new Date(sortedDays[0]), 'dd-MM-yyyy')} al ${format(new Date(sortedDays[sortedDays.length - 1]), 'dd-MM-yyyy')}`;
        }

        const bodyText = `Estimado/a,

Le informamos que la solicitud de ${isBlock ? 'Bloqueo' : 'Apertura'} ha sido procesada y finalizada con éxito.

📋 Detalles de la Gestión:
- Profesional: ${req.professionalName}
- Solicitante: ${req.coordinator}
- Tipo: ${isBlock ? req.blockType : req.performance + ' MIN'}
- ${isBlock ? 'Fechas Bloqueadas' : 'Fechas de Apertura'}: ${datesString}
- Horario: ${req.startTime} - ${req.endTime}
- Administrativo Asignado: ${req.assignedAdmin || '-'}

📄 Documento Adjunto:
${docLinksText}

Saludos cordiales.`;
        
        // Use authuser to attempt to open the specific account (calvarado@munifutrono.cl) if logged in
        const uniqueRecipients = Array.from(new Set(recipients)).filter(Boolean);
        const mailtoLink = `https://mail.google.com/mail/u/calvarado@munifutrono.cl/?view=cm&fs=1&to=${uniqueRecipients.join(',')}&su=${subject}&body=${encodeURIComponent(bodyText)}`;
        
        // Open the Gmail compose window
        window.open(mailtoLink, '_blank', 'noopener,noreferrer');
    };


    // Reset professional when profession changes
    const handleProfessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProfession(e.target.value);
        setSelectedProfessional('');
    };

    const normalize = (str: string) => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() || '';

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
            if (selectedProfession && normalize(item.profession) !== normalize(selectedProfession)) return false;

            // Professional Filter
            if (selectedProfessional && normalize(item.professionalName) !== normalize(selectedProfessional)) return false;

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

    // Get current page items
    const paginatedRequests = sortedRequests.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const paginatedOpenings = sortedOpenings.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const totalPages = Math.ceil(
        (reportType === 'blockings' ? sortedRequests.length : sortedOpenings.length) / ITEMS_PER_PAGE
    );

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
            'Fecha Solicitud': format(new Date(req.createdAt), 'dd/MM/yyyy HH:mm'),
            'Solicitante': req.coordinator,
            'Lugar': req.location || '-',
            'Profesión': req.profession,
            'Profesional': req.professionalName,
            'Tipo Bloqueo': req.blockType,
            'Fechas Bloqueo': req.selectedDays ? req.selectedDays.map((d: string) => safeFormat(d, 'dd/MM/yyyy')).join(', ') : `${req.startDate} - ${req.endDate}`,
            'Hora Inicio': req.startTime,
            'Hora Término': req.startTime,
            'Estado Agenda': req.agendaBlockedStatus || 'Pendiente',
            'Documento Adjunto': req.pdfUrl && Array.isArray(req.pdfUrl) && req.pdfUrl.length > 0
                ? req.pdfUrl.map((url: string, i: number) => (url === 'INTERNAL_PDF' || url.startsWith('data:')) ? `${window.location.origin}/api/pdf/${req.id}?index=${i}` : url).join('\n')
                : '-',
            'Responsable Contactar': req.assignedAdmin || '-'
        }));

        const exportOpenings = filterByDateRange(openings).map(req => ({
            'Fecha Solicitud': format(new Date(req.createdAt), 'dd/MM/yyyy HH:mm'),
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
            <div className="flex justify-center mb-8">
                <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 inline-flex gap-1">
                    <button
                        onClick={() => setReportType('blockings')}
                        className={clsx(
                            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
                            reportType === 'blockings' ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        )}
                    >
                        Reporte Bloqueos
                    </button>
                    <button
                        onClick={() => setReportType('openings')}
                        className={clsx(
                            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
                            reportType === 'openings' ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        )}
                    >
                        Reporte Aperturas
                    </button>
                    <button
                        onClick={() => setReportType('export')}
                        className={clsx(
                            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                            reportType === 'export' ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        )}
                    >
                        <Download size={16} />
                        Exportar Excel
                    </button>
                </div>
            </div>

            {reportType === 'export' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl mx-auto">
                    <div className="p-8 border-b border-gray-100 bg-white flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl">
                            <FileText size={28} className="text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Exportar Reportes</h2>
                            <p className="text-gray-500 mt-0.5">Seleccione un rango de fechas para descargar el consolidado en Excel.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Calendar size={16} /> Fecha Inicio
                                </label>
                                <input
                                    type="date"
                                    aria-label="Fecha Inicio"
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
                                    aria-label="Fecha Término"
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                        <div className="p-8 border-b border-gray-100 bg-white flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Filter size={28} className="text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Filtros de Reporte</h2>
                                <p className="text-gray-500 mt-0.5">Refine la búsqueda para visualizar datos específicos en tiempo real.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-gray-50/30">
                            {/* Month Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Mes</label>
                                <select
                                    aria-label="Seleccionar mes"
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
                                    aria-label="Seleccionar año"
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
                                    aria-label="Seleccionar estamento"
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
                                    aria-label="Seleccionar profesional"
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <FileText size={28} className="text-gray-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        Resultados de {reportType === 'blockings' ? 'Bloqueos' : 'Aperturas'}
                                    </h2>
                                    <p className="text-gray-500 mt-0.5">Detectados {reportType === 'blockings' ? sortedRequests.length : sortedOpenings.length} registros según filtros.</p>
                                </div>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Anterior"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="text-sm font-bold text-gray-600 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 min-w-[120px] text-center">
                                        Página <span className="text-blue-600">{currentPage}</span> de {totalPages}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Siguiente"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-widest font-bold border-b border-gray-100">
                                        <th className="px-3 py-3 whitespace-nowrap">Fecha Solicitud</th>
                                        <th className="px-3 py-3 whitespace-nowrap">Solicitante</th>
                                        <th className="px-3 py-3">Lugar</th>
                                        <th className="px-3 py-3">Profesional / Estamento</th>
                                        {reportType === 'blockings' ? (
                                            <>
                                                <th className="px-3 py-3">Tipo</th>
                                                <th className="px-3 py-3">Fechas</th>
                                                <th className="px-3 py-3">Horas</th>
                                                <th className="px-3 py-3 text-center">Estado Agenda</th>
                                                <th className="px-3 py-3 text-center">Doc</th>
                                                <th className="px-3 py-3">Responsable</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-3 py-3">Tipo</th>
                                                <th className="px-3 py-3">Categoría</th>
                                                <th className="px-3 py-3 whitespace-nowrap">Rend.</th>
                                                <th className="px-3 py-3">Horas</th>
                                                <th className="px-3 py-3">Días de Apertura</th>
                                                <th className="px-3 py-3 text-center">Estado</th>
                                                <th className="px-3 py-3 text-center">Doc</th>
                                                <th className="px-3 py-3">Responsable</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {reportType === 'blockings' ? (
                                        paginatedRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0 group">
                                                <td className="px-3 py-3">
                                                    <div className="font-bold text-gray-900 text-sm">
                                                        {format(new Date(req.createdAt), 'dd/MM/yyyy')}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-medium">{format(new Date(req.createdAt), 'HH:mm')} hrs</div>
                                                </td>
                                                <td className="px-3 py-3 leading-tight text-xs font-medium text-gray-600">{req.coordinator}</td>
                                                <td className="px-3 py-3 leading-tight text-xs text-gray-500">{req.location || '-'}</td>
                                                <td className="px-3 py-3 min-w-[110px]">
                                                    <div className="font-bold text-gray-900 text-sm leading-tight">{formatToTitleCase(req.professionalName)}</div>
                                                    <div className="text-[10px] text-blue-600 font-bold uppercase tracking-tight mt-0.5">{formatToTitleCase(req.profession)}</div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100 uppercase">
                                                        {req.blockType}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="max-w-[120px] text-[11px] font-bold leading-tight text-gray-700 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                        {req.selectedDays
                                                            ? req.selectedDays
                                                                .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())
                                                                .map((d: string) => safeFormat(d, 'dd/MM'))
                                                                .join(', ')
                                                            : '-'
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-xs font-bold text-gray-900 bg-gray-50/50 rounded-lg">
                                                    {req.startTime} - {req.endTime}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={clsx(
                                                            "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
                                                            req.agendaBlockedStatus === 'Realizado' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                req.agendaBlockedStatus === 'Sin Agenda' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                                    req.agendaBlockedStatus === 'No Corresponde' ? "bg-red-50 text-red-700 border-red-100" :
                                                                        "bg-gray-50 text-gray-400 border-gray-200"
                                                        )}>
                                                            {req.agendaBlockedStatus || 'Pendiente'}
                                                        </span>
                                                        {isAdmin && (req.agendaBlockedStatus === 'Realizado' || req.agendaBlockedStatus === 'Sin Agenda') && (
                                                            <button
                                                                onClick={() => setSelectedRequestToEdit(req)}
                                                                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors"
                                                            >
                                                                <Pencil size={10} /> Editar Doc
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {req.pdfUrl && req.pdfUrl.length > 0 && req.pdfUrl[0] !== 'SIN PACIENTES' ? (
                                                            <div className="flex flex-wrap gap-1 justify-center max-w-[80px]">
                                                                {req.pdfUrl.map((url: string, idx: number) => (
                                                                    <a
                                                                        key={idx}
                                                                        href={(url === 'INTERNAL_PDF' || url.startsWith('data:')) ? `/api/pdf/${req.id}?index=${idx}` : url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center justify-center shadow-sm relative group/doc"
                                                                        title={`Ver Documento ${idx + 1}`}
                                                                    >
                                                                        <FileText size={14} />
                                                                        {req.pdfUrl!.length > 1 && (
                                                                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center font-bold">
                                                                                {idx + 1}
                                                                            </span>
                                                                        )}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 flex items-center justify-center text-gray-200" title="Sin Documento">
                                                                <FileText size={16} />
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => handleSendEmail(req, 'blockings')}
                                                            className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all flex items-center justify-center shadow-sm"
                                                            title="Enviar por Correo"
                                                        >
                                                            <Mail size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-[11px] font-bold text-gray-600 uppercase bg-gray-50/30 whitespace-normal min-w-[110px]">
                                                    {req.assignedAdmin || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        paginatedOpenings.map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="px-3 py-3">
                                                    <div className="font-bold text-gray-900 text-sm">
                                                        {format(new Date(req.createdAt), 'dd/MM/yyyy')}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-medium">{format(new Date(req.createdAt), 'HH:mm')} hrs</div>
                                                </td>
                                                <td className="px-3 py-3 leading-tight text-xs font-medium text-gray-600">{req.coordinator}</td>
                                                <td className="px-3 py-3 leading-tight text-xs text-gray-500">{req.location || '-'}</td>
                                                <td className="px-3 py-3 min-w-[110px]">
                                                    <div className="font-bold text-gray-900 text-sm leading-tight">{formatToTitleCase(req.professionalName)}</div>
                                                    <div className="text-[10px] text-blue-600 font-bold uppercase tracking-tight mt-0.5">{formatToTitleCase(req.profession)}</div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase">
                                                        {req.requestType || 'Apertura'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="text-[10px] font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 uppercase">
                                                        {req.categoryType || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100 whitespace-nowrap">
                                                        {req.performance} MIN
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-xs font-bold text-gray-900 bg-gray-50/50 rounded-lg">
                                                    {req.startTime} - {req.endTime}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="max-w-[160px] text-[11px] font-bold leading-tight text-gray-700 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                        {req.selectedDays && Array.isArray(req.selectedDays)
                                                            ? [...req.selectedDays]
                                                                .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())
                                                                .map((d: string) => safeFormat(d, 'dd/MM'))
                                                                .join(', ')
                                                            : '-'
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={clsx(
                                                            "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
                                                            req.status === 'Realizado' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                req.status === 'No Corresponde' ? "bg-red-50 text-red-700 border-red-100" :
                                                                    req.status === 'Pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                                        "bg-gray-50 text-gray-400 border-gray-200"
                                                        )}>
                                                            {req.status === 'Pending' ? 'Pendiente' : req.status}
                                                        </span>
                                                        {isAdmin && (req.status === 'Realizado') && (
                                                            <button
                                                                onClick={() => setSelectedRequestToEdit(req)}
                                                                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors"
                                                            >
                                                                <Pencil size={10} /> Editar Doc
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {req.pdfUrl && req.pdfUrl.length > 0 && req.pdfUrl[0] !== 'SIN PACIENTES' ? (
                                                            <div className="flex flex-wrap gap-1 justify-center max-w-[80px]">
                                                                {req.pdfUrl.map((url: string, idx: number) => (
                                                                    <a
                                                                        key={idx}
                                                                        href={(url === 'INTERNAL_PDF' || url.startsWith('data:')) ? `/api/pdf/${req.id}?index=${idx}` : url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center justify-center shadow-sm relative group/doc"
                                                                        title={`Ver Documento ${idx + 1}`}
                                                                    >
                                                                        <FileText size={14} />
                                                                        {req.pdfUrl!.length > 1 && (
                                                                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center font-bold">
                                                                                {idx + 1}
                                                                            </span>
                                                                        )}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 flex items-center justify-center text-gray-200" title="Sin Documento">
                                                                <FileText size={16} />
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => handleSendEmail(req, 'openings')}
                                                            className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all flex items-center justify-center shadow-sm"
                                                            title="Enviar por Correo"
                                                        >
                                                            <Mail size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-[11px] font-bold text-gray-600 uppercase bg-gray-50/30 whitespace-normal min-w-[110px]">
                                                    {req.assignedAdmin || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}

                                    {((reportType === 'blockings' && sortedRequests.length === 0) ||
                                        (reportType === 'openings' && sortedOpenings.length === 0)) && (
                                            <tr>
                                                <td colSpan={reportType === 'blockings' ? 10 : 12} className="p-8 text-center text-gray-400">
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
            
            {selectedRequestToEdit && (
                <ProcessingModal
                    request={selectedRequestToEdit}
                    type={reportType === 'blockings' ? 'Bloqueo' : 'Apertura'}
                    personnel={personnel}
                    onClose={() => setSelectedRequestToEdit(null)}
                    onSuccess={() => {
                        setSelectedRequestToEdit(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}
