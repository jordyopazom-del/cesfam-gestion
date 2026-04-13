'use client';

import { useState, useEffect } from 'react';
import { getRequests } from '@/lib/db';
import { BlockingRequest } from '@/lib/db';
import { 
    Clock, 
    Calendar, 
    Users, 
    AlertCircle, 
    TrendingUp, 
    Clock8,
    FileBarChart,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import clsx from 'clsx';

interface StatsData {
    estamento: string;
    totalRequests: number;
    totalHours: number;
    equivalentDays: number;
    percentage: number;
}

export default function StatisticsView() {
    const [requests, setRequests] = useState<BlockingRequest[]>([]);
    const [stats, setStats] = useState<StatsData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        const allRequests = await getRequests();
        
        // Filter by month/year
        const filtered = allRequests.filter(req => {
            const date = new Date(req.createdAt);
            return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        });

        setRequests(filtered);
        calculateStats(filtered);
        setLoading(false);
    };

    const calculateStats = (data: BlockingRequest[]) => {
        const estamentoMap: Record<string, { count: number, hours: number }> = {};
        let totalAllHours = 0;

        data.forEach(req => {
            const start = req.startTime.split(':').map(Number);
            const end = req.endTime.split(':').map(Number);
            
            const startMinutes = start[0] * 60 + start[1];
            const endMinutes = end[0] * 60 + end[1];
            const durationInHours = (endMinutes - startMinutes) / 60;
            const totalReqHours = durationInHours * (req.selectedDays?.length || 0);

            if (!estamentoMap[req.profession]) {
                estamentoMap[req.profession] = { count: 0, hours: 0 };
            }

            estamentoMap[req.profession].count += 1;
            estamentoMap[req.profession].hours += totalReqHours;
            totalAllHours += totalReqHours;
        });

        const totalBloqueos = data.length;
        const calculatedStats: StatsData[] = Object.entries(estamentoMap).map(([estamento, values]) => ({
            estamento,
            totalRequests: values.count,
            totalHours: values.hours,
            equivalentDays: values.hours / 8,
            percentage: totalBloqueos > 0 ? (values.count / totalBloqueos) * 100 : 0
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
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse font-sans">Analizando impacto de horas...</p>
            </div>
        );
    }

    const totalHoursGlobal = stats.reduce((acc, curr) => acc + curr.totalHours, 0);
    const totalDaysGlobal = totalHoursGlobal / 8;
    const totalRequestsGlobal = stats.reduce((acc, curr) => acc + curr.totalRequests, 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
            {/* Filtros */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={18} />
                    <span className="text-sm font-semibold uppercase tracking-wider">Periodo:</span>
                </div>
                <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-2.5 outline-none transition-all cursor-pointer"
                >
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-2.5 outline-none transition-all cursor-pointer"
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Solicitudes</p>
                        <h3 className="text-4xl font-black text-gray-900">{totalRequestsGlobal}</h3>
                        <p className="text-emerald-500 text-[10px] font-black mt-2 flex items-center gap-1 uppercase">
                            <ArrowUpRight size={12} />
                            En el periodo
                        </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                        <Users size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Horas Bloqueadas</p>
                        <h3 className="text-4xl font-black text-gray-900">{totalHoursGlobal.toFixed(1)} <span className="text-xl font-light">hrs</span></h3>
                        <p className="text-amber-500 text-[10px] font-black mt-2 flex items-center gap-1 uppercase">
                            <Clock size={12} />
                            Tiempo Clínico
                        </p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
                        <Clock size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Jornadas Perdidas</p>
                        <h3 className="text-4xl font-black text-blue-600">{totalDaysGlobal.toFixed(1)} <span className="text-xl font-light">ds</span></h3>
                        <p className="text-blue-500 text-[10px] font-black mt-2 flex items-center gap-1 uppercase">
                            <Clock8 size={12} />
                            Base 8 Horas
                        </p>
                    </div>
                    <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                        <Clock8 size={32} />
                    </div>
                </div>
            </div>

            {/* Main Data Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-900 text-white rounded-xl shadow-lg shadow-gray-200">
                            <FileBarChart size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Análisis por Estamento</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Desglose porcentual y valores absolutos</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                        {months[selectedMonth]} {selectedYear}
                    </span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                <th className="px-8 py-6">Estamento / Profesión</th>
                                <th className="px-6 py-6 text-center">N° Bloqueos</th>
                                <th className="px-6 py-6 text-center">% Peso</th>
                                <th className="px-6 py-6 text-right">Total Horas</th>
                                <th className="px-8 py-6 text-right bg-blue-50/30 text-blue-600">Jornadas Perdidas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats.length > 0 ? stats.map((item, index) => (
                                <tr key={item.estamento} className="hover:bg-gray-50/50 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "w-1.5 h-6 rounded-full",
                                                index === 0 ? "bg-blue-600" : index === 1 ? "bg-blue-400" : "bg-gray-200"
                                            )}></div>
                                            <span className="font-bold text-gray-800 text-sm">{item.estamento}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="inline-flex items-center justify-center bg-gray-100 px-3 py-1 rounded-full text-gray-900 font-black text-xs">
                                            {item.totalRequests}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <span className="text-xs font-black text-gray-900">{item.percentage.toFixed(1)}%</span>
                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gray-900 rounded-full transition-all duration-1000" 
                                                    style={{ width: `${item.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <span className="text-md font-bold text-gray-700 tabular-nums">{item.totalHours.toFixed(1)}<span className="text-[10px] text-gray-400 ml-0.5">h</span></span>
                                    </td>
                                    <td className="px-8 py-6 text-right bg-blue-50/10 group-hover:bg-blue-50/30 transition-colors">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xl font-black text-blue-700 tabular-nums tracking-tighter">
                                                {item.equivalentDays.toFixed(1)}
                                            </span>
                                            <span className="text-[9px] font-black text-blue-400 uppercase">Jornadas 8h</span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-300">
                                            <AlertCircle size={48} />
                                            <div className="space-y-1">
                                                <p className="text-lg font-black text-gray-400">Sin datos registrados</p>
                                                <p className="text-xs font-bold uppercase tracking-widest">Selecciona otro periodo para analizar</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Aviso de Cálculo */}
            <div className="bg-gray-900 p-6 rounded-3xl shadow-xl shadow-gray-200 flex items-start gap-4 border border-gray-800">
                <div className="bg-amber-400 p-2 rounded-lg text-gray-900 animate-pulse">
                    <AlertCircle size={20} />
                </div>
                <div className="space-y-1">
                    <h4 className="text-white text-xs font-black uppercase tracking-widest">Metodología de Cálculo</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                        El equivalente en <span className="text-white font-black italic">"Jornadas Perdidas"</span> se obtiene sumando la duración exacta de cada bloqueo (Término - Inicio) multiplicada por el número de días afectados, y dividiendo el resultado por una jornada laboral estándar de <span className="text-blue-400 font-black">8.0 horas</span>. Este indicador refleja la pérdida de oferta clínica bruta del establecimiento.
                    </p>
                </div>
            </div>
        </div>
    );
}
