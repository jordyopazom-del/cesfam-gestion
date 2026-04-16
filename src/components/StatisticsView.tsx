'use client';

import React, { useState, useEffect } from 'react';
import { BlockingRequest, AgendaOpeningRequest } from '@/lib/db';
import { 
    Clock, 
    Calendar, 
    Users, 
    AlertCircle, 
    TrendingUp, 
    Clock8,
    FileBarChart,
    ChevronDown,
    ChevronRight,
    ArrowUpRight,
    Filter,
    User,
    CalendarPlus,
    LayoutDashboard
} from 'lucide-react';
import clsx from 'clsx';

interface ProfessionalStats {
    name: string;
    count: number;
    hours: number;
    equivalentDays: number;
}

interface StatsData {
    estamento: string;
    totalRequests: number;
    totalHours: number;
    equivalentDays: number;
    percentage: number;
    professionals: ProfessionalStats[];
}

export default function StatisticsView() {
    const [requests, setRequests] = useState<BlockingRequest[]>([]);
    const [openings, setOpenings] = useState<AgendaOpeningRequest[]>([]);
    const [stats, setStats] = useState<StatsData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showAccumulated, setShowAccumulated] = useState(false);
    const [expandedEstamento, setExpandedEstamento] = useState<string | null>(null);
    const [viewType, setViewType] = useState<'blockings' | 'openings'>('blockings');

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear, showAccumulated, viewType]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resRequests, resOpenings] = await Promise.all([
                fetch('/api/requests'),
                fetch('/api/agenda-openings')
            ]);
            
            const dataRequests = await resRequests.json();
            const dataOpenings = await resOpenings.json();
            
            setRequests(dataRequests);
            setOpenings(dataOpenings);

            // Filter current dataset by month/year (Individual vs Accumulated)
            const currentData = viewType === 'blockings' ? dataRequests : dataOpenings;
            
            const filtered = currentData.filter((req: any) => {
                const date = new Date(req.createdAt);
                if (date.getFullYear() !== selectedYear) return false;
                
                if (showAccumulated) {
                    return date.getMonth() <= selectedMonth;
                } else {
                    return date.getMonth() === selectedMonth;
                }
            });

            calculateStats(filtered);
        } catch (error) {
            console.error('Failed to fetch data in stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: any[]) => {
        const estamentoMap: Record<string, { count: number, hours: number, pros: Record<string, { count: number, hours: number }> }> = {};
        
        data.forEach(req => {
            const start = req.startTime.split(':').map(Number);
            const end = req.endTime.split(':').map(Number);
            
            const startMinutes = start[0] * 60 + start[1];
            const endMinutes = end[0] * 60 + end[1];
            // Fix case where end time is less than start time (unlikely but safe)
            const durationInHours = Math.max(0, (endMinutes - startMinutes) / 60);
            const totalReqHours = durationInHours * (req.selectedDays?.length || 0);

            if (!estamentoMap[req.profession]) {
                estamentoMap[req.profession] = { count: 0, hours: 0, pros: {} };
            }

            estamentoMap[req.profession].count += 1;
            estamentoMap[req.profession].hours += totalReqHours;

            // Individual professional stats
            if (!estamentoMap[req.profession].pros[req.professionalName]) {
                estamentoMap[req.profession].pros[req.professionalName] = { count: 0, hours: 0 };
            }
            estamentoMap[req.profession].pros[req.professionalName].count += 1;
            estamentoMap[req.profession].pros[req.professionalName].hours += totalReqHours;
        });

        const totalValue = data.length;
        const calculatedStats: StatsData[] = Object.entries(estamentoMap).map(([estamento, values]) => ({
            estamento,
            totalRequests: values.count,
            totalHours: values.hours,
            equivalentDays: values.hours / 8,
            percentage: totalValue > 0 ? (values.count / totalValue) * 100 : 0,
            professionals: Object.entries(values.pros).map(([name, p]) => ({
                name,
                count: p.count,
                hours: p.hours,
                equivalentDays: p.hours / 8
            })).sort((a, b) => b.hours - a.hours)
        })).sort((a, b) => b.totalHours - a.totalHours);

        setStats(calculatedStats);
    };

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4 font-sans">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Analizando impacto de horas...</p>
            </div>
        );
    }

    const totalHoursGlobal = stats.reduce((acc, curr) => acc + curr.totalHours, 0);
    const totalDaysGlobal = totalHoursGlobal / 8;
    const totalRequestsGlobal = stats.reduce((acc, curr) => acc + curr.totalRequests, 0);

    const isOpening = viewType === 'openings';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
            {/* Toggle Principal */}
            <div className="flex justify-center mb-4">
                <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex gap-1">
                    <button
                        onClick={() => setViewType('blockings')}
                        className={clsx(
                            "px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                            viewType === 'blockings' ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        )}
                    >
                        <AlertCircle size={18} />
                        Gestión de Bloqueos
                    </button>
                    <button
                        onClick={() => setViewType('openings')}
                        className={clsx(
                            "px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                            viewType === 'openings' ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        )}
                    >
                        <CalendarPlus size={18} />
                        Gestión de Aperturas
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Filter size={18} />
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Filtros Temporal:</span>
                    </div>
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-2xl focus:ring-blue-500 focus:border-blue-500 p-2.5 outline-none transition-all cursor-pointer"
                    >
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-2xl focus:ring-blue-500 focus:border-blue-500 p-2.5 outline-none transition-all cursor-pointer"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                    <span className={clsx(
                        "text-xs font-black uppercase tracking-tighter px-3 transition-colors",
                        !showAccumulated ? (isOpening ? "text-emerald-600" : "text-blue-600") : "text-gray-400"
                    )}>Mes Seleccionado</span>
                    <button 
                        onClick={() => setShowAccumulated(!showAccumulated)}
                        className={clsx(
                            "relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none",
                            showAccumulated ? (isOpening ? "bg-emerald-600" : "bg-blue-600") : "bg-gray-300"
                        )}
                    >
                        <span className={clsx(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            showAccumulated ? "translate-x-7" : "translate-x-1"
                        )} />
                    </button>
                    <span className={clsx(
                        "text-xs font-black uppercase tracking-tighter px-3 transition-colors",
                        showAccumulated ? (isOpening ? "text-emerald-600" : "text-blue-600") : "text-gray-400"
                    )}>Ver Acumulado Anual</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
                    <div>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total {isOpening ? 'Aperturas' : 'Solicitudes'}</p>
                        <h3 className="text-4xl font-black text-gray-900 tracking-tight">{totalRequestsGlobal}</h3>
                        <p className={clsx(
                            "text-[10px] font-black mt-2 flex items-center gap-1 uppercase tracking-tighter",
                            isOpening ? "text-emerald-500" : "text-blue-500"
                        )}>
                            <TrendingUp size={12} />
                            {showAccumulated ? `Acumulado hasta ${months[selectedMonth]}` : `Solo en ${months[selectedMonth]}`}
                        </p>
                    </div>
                    <div className={clsx(
                        "p-4 rounded-2xl group-hover:scale-110 transition-transform",
                        isOpening ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    )}>
                        {isOpening ? <LayoutDashboard size={32} /> : <Users size={32} />}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
                    <div>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{isOpening ? 'Horas Recuperadas' : 'Horas Bloqueadas'}</p>
                        <h3 className="text-4xl font-black text-gray-900 tracking-tight">{totalHoursGlobal.toFixed(1)} <span className="text-xl font-light">hrs</span></h3>
                        <p className="text-amber-500 text-[10px] font-black mt-2 flex items-center gap-1 uppercase tracking-tighter">
                            <Clock size={12} />
                            {isOpening ? 'Disponibilidad Clínica' : 'Impacto Clínico Estimado'}
                        </p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
                        <Clock size={32} />
                    </div>
                </div>

                <div className={clsx(
                    "bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between border-b-4 hover:shadow-lg transition-all group",
                    isOpening ? "border-emerald-600" : "border-blue-600"
                )}>
                    <div>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Jornadas {isOpening ? 'Ganadas' : 'Perdidas'}</p>
                        <h3 className={clsx(
                            "text-4xl font-black tracking-tighter",
                            isOpening ? "text-emerald-600" : "text-blue-600"
                        )}>{totalDaysGlobal.toFixed(1)} <span className="text-xl font-light text-gray-400">ds</span></h3>
                        <p className="text-gray-400 text-[10px] font-bold mt-2 flex items-center gap-1 uppercase tracking-tighter">
                            <Clock8 size={12} />
                            Cálculo base 8 horas
                        </p>
                    </div>
                    <div className={clsx(
                        "p-4 rounded-2xl text-white shadow-lg group-hover:rotate-12 transition-transform",
                        isOpening ? "bg-emerald-600 shadow-emerald-100" : "bg-blue-600 shadow-blue-100"
                    )}>
                        <Clock8 size={32} />
                    </div>
                </div>
            </div>

            {/* Main Data Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "p-2.5 text-white rounded-2xl shadow-lg",
                            isOpening ? "bg-emerald-600" : "bg-gray-900"
                        )}>
                            <FileBarChart size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Análisis {isOpening ? 'de Aperturas' : 'de Bloqueos'} por Profesional</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">Haz clic en una fila para ver el detalle por funcionario</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className={clsx(
                             "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border shadow-sm",
                             showAccumulated ? (isOpening ? "bg-emerald-600 text-white border-emerald-700" : "bg-blue-600 text-white border-blue-700") : "bg-white text-gray-400 border-gray-100"
                         )}>
                            {showAccumulated ? `ACUMULADO: ENERO A ${months[selectedMonth].toUpperCase()}` : `MENSUAL: ${months[selectedMonth].toUpperCase()}`}
                        </span>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <th className="px-8 py-6 w-[35%]">Profesión / Estamento</th>
                                <th className="px-4 py-6 text-center w-[15%]">Cant. {isOpening ? 'Aperturas' : 'Bloqueos'}</th>
                                <th className="px-4 py-6 text-center w-[15%]">% Peso</th>
                                <th className="px-4 py-6 text-right w-[15%]">Total Horas</th>
                                <th className={clsx(
                                    "px-8 py-6 text-right w-[20%] font-black uppercase tracking-tighter",
                                    isOpening ? "bg-emerald-50/30 text-emerald-600" : "bg-blue-50/30 text-blue-600"
                                )}>Jornadas Laborales</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats.length > 0 ? stats.map((item, index) => (
                                <React.Fragment key={item.estamento}>
                                    <tr 
                                        onClick={() => setExpandedEstamento(expandedEstamento === item.estamento ? null : item.estamento)}
                                        className={clsx(
                                            "hover:bg-gray-50/80 transition-all cursor-pointer group",
                                            expandedEstamento === item.estamento && (isOpening ? "bg-emerald-50/30" : "bg-blue-50/30")
                                        )}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={clsx(
                                                    "transition-transform duration-300",
                                                    expandedEstamento === item.estamento ? (isOpening ? "rotate-90 text-emerald-600" : "rotate-90 text-blue-600") : "text-gray-300"
                                                )}>
                                                    <ChevronRight size={18} />
                                                </div>
                                                <div className={clsx(
                                                    "w-1.5 h-6 rounded-full flex-shrink-0",
                                                    index === 0 ? (isOpening ? "bg-emerald-600" : "bg-blue-600") : 
                                                    index === 1 ? (isOpening ? "bg-emerald-400" : "bg-blue-400") : "bg-gray-200"
                                                )}></div>
                                                <span className="font-black text-gray-800 text-sm tracking-tight truncate">{item.estamento}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            <span className="inline-flex items-center justify-center bg-gray-100 px-3 py-1 rounded-full text-gray-900 font-bold text-xs">
                                                {item.totalRequests}
                                            </span>
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="text-[11px] font-black text-gray-900">{item.percentage.toFixed(1)}%</span>
                                                <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={clsx(
                                                            "h-full rounded-full transition-all duration-700",
                                                            isOpening ? "bg-emerald-600" : "bg-blue-600"
                                                        )}
                                                        style={{ width: `${item.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 text-right font-bold text-gray-600 tabular-nums text-sm">
                                            {item.totalHours.toFixed(1)} <span className="text-[9px] font-medium text-gray-400 uppercase">hrs</span>
                                        </td>
                                        <td className={clsx(
                                            "px-8 py-6 text-right group-hover:bg-opacity-40 transition-colors",
                                            isOpening ? "bg-emerald-50/20" : "bg-blue-50/10"
                                        )}>
                                            <div className="flex flex-col items-end">
                                                <span className={clsx(
                                                    "text-lg font-black tabular-nums whitespace-nowrap",
                                                    isOpening ? "text-emerald-700" : "text-blue-700"
                                                )}>
                                                    {item.equivalentDays.toFixed(1)}
                                                </span>
                                                <span className={clsx(
                                                    "text-[8px] font-black uppercase tracking-tighter whitespace-nowrap",
                                                    isOpening ? "text-emerald-400" : "text-blue-400"
                                                )}>Jornadas 8h</span>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Sub-tabla Desglose Funcionarios */}
                                    {expandedEstamento === item.estamento && (
                                        <tr className="bg-gray-50/50">
                                            <td colSpan={5} className="p-0 border-none">
                                                <div className="px-16 py-4 animate-in slide-in-from-top-2 duration-300">
                                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                                        <table className="w-full text-left text-xs table-fixed">
                                                            <thead>
                                                                <tr className="bg-gray-100/50 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                                                    <th className="px-6 py-3 w-[40%]">Funcionario(a)</th>
                                                                    <th className="px-4 py-3 text-center w-[20%]">N° {isOpening ? 'Aperturas' : 'Bloqueos'}</th>
                                                                    <th className="px-4 py-3 text-right w-[20%]">Horas</th>
                                                                    <th className="px-6 py-3 text-right w-[20%]">Jornadas Laborales</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {item.professionals.map((pro) => (
                                                                    <tr key={pro.name} className={clsx(
                                                                        "transition-colors",
                                                                        isOpening ? "hover:bg-emerald-50/20" : "hover:bg-blue-50/20"
                                                                    )}>
                                                                        <td className="px-6 py-3 font-bold text-gray-700 flex items-center gap-2 w-[40%]">
                                                                            <User size={12} className="text-gray-400" />
                                                                            <span className="truncate">{pro.name}</span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center text-gray-600 font-medium w-[20%]">
                                                                            {pro.count}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right text-gray-600 font-medium font-mono w-[20%]">
                                                                            {pro.hours.toFixed(1)} <span className="text-[9px] text-gray-400">h</span>
                                                                        </td>
                                                                        <td className={clsx(
                                                                            "px-6 py-3 text-right font-black w-[20%]",
                                                                            isOpening ? "text-emerald-600" : "text-blue-600"
                                                                        )}>
                                                                            {pro.equivalentDays.toFixed(1)} <span className={clsx(
                                                                                "text-[9px] font-bold uppercase",
                                                                                isOpening ? "text-emerald-300" : "text-blue-300"
                                                                            )}>ds</span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-300">
                                            <AlertCircle size={48} />
                                            <div className="space-y-1">
                                                <p className="text-lg font-black text-gray-400">Sin datos registrados</p>
                                                <p className="text-xs font-bold uppercase tracking-widest">Ajusta los filtros para ver otras fechas</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Metodología */}
            <div className="bg-gray-900 p-6 rounded-3xl shadow-xl shadow-gray-200 flex items-start gap-4 border border-gray-800">
                <div className={clsx(
                    "p-2.5 text-white rounded-xl shadow-lg",
                    isOpening ? "bg-emerald-600 shadow-emerald-900/50" : "bg-blue-600 shadow-blue-900/50"
                )}>
                    <FileBarChart size={20} />
                </div>
                <div className="space-y-1">
                    <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        Metodología de Gestión Clínica
                        <span className={clsx(
                            "text-[9px] px-2 py-0.5 rounded-full border",
                            isOpening ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        )}>Standard 8h</span>
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                        La métrica de <span className="text-white font-black italic">"Jornadas Laborales"</span> permite dimensionar la capacidad asistencial. 
                        {isOpening 
                            ? " En el caso de Aperturas, representa la capacidad administrativa GANADA o recuperada." 
                            : " En el caso de Bloqueos, representa la capacidad clínica PERDIDA o redirigida."
                        } El cálculo se realiza en base a la sumatoria neta de horas (End - Start) sobre el total de días seleccionados, normalizado por un turno laboral completo de 8.0 horas.
                    </p>
                </div>
            </div>
        </div>
    );
}
