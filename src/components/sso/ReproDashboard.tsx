"use client";

import React, { useState, useEffect } from "react";
import { getReproStats, getPatientRecurrenceList } from "@/app/reprogramacion/actions";
import { BarChart3, Users, Clock, AlertTriangle, XCircle, Search, Calendar, FileWarning } from "lucide-react";

export default function ReproDashboard({ onJumpToTab }: { onJumpToTab?: (id: number) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [recurrenceList, setRecurrenceList] = useState<any[]>([]);
  const [searchRUT, setSearchRUT] = useState("");
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadStats = async () => {
    setLoading(true);
    const [res, recRes] = await Promise.all([
      getReproStats(startDate || undefined, endDate || undefined),
      getPatientRecurrenceList()
    ]);
    if (res.success && res.data) {
      setStats(res.data);
    }
    if (recRes.success && recRes.data) {
      setRecurrenceList(recRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadStats();
  };

  const getPercent = (part: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  };

  if (loading && !stats) {
    return <div className="animate-pulse bg-white p-6 rounded-2xl h-64 border border-gray-100 flex items-center justify-center text-gray-400 font-bold">Cargando métricas...</div>;
  }

  const { global, officials } = stats || { global: {}, officials: [] };

  return (
    <div className="space-y-6 animate-fade-in mb-8">
      {/* Filtros */}
      <form onSubmit={handleFilter} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">Desde (Subida Bloqueo)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">Hasta</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
        <button 
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-blue-100 h-[42px] flex items-center gap-2"
        >
          <Search size={16} />
          Filtrar
        </button>
      </form>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></div>
            <h3 className="text-sm font-bold text-gray-500">Afectados Totales</h3>
          </div>
          <p className="text-3xl font-black text-slate-800">{global.totalAfectados}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><BarChart3 size={20} /></div>
            <h3 className="text-sm font-bold text-emerald-700">Reprogramados</h3>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-emerald-600">{global.totalReprogramados}</p>
            <span className="text-sm font-bold text-emerald-500 mb-1">({getPercent(global.totalReprogramados, global.totalAfectados)}%)</span>
          </div>
        </div>

        <div 
          onClick={() => onJumpToTab && onJumpToTab(3)}
          className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm shadow-orange-50 cursor-pointer hover:ring-2 hover:ring-orange-400 hover:shadow-md transition-all group"
          title="Ver pacientes en espera de cupo"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors"><AlertTriangle size={20} /></div>
            <h3 className="text-sm font-bold text-orange-700">Avisado - Sin Cupo</h3>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-orange-600">{global.totalSinCupo}</p>
            <span className="text-sm font-bold text-orange-500 mb-1">({getPercent(global.totalSinCupo, global.totalAfectados)}%)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm shadow-red-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><XCircle size={20} /></div>
            <h3 className="text-sm font-bold text-red-700">No Ubicables</h3>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-red-600">{global.totalNoUbicables}</p>
            <span className="text-sm font-bold text-red-500 mb-1">({getPercent(global.totalNoUbicables, global.totalAfectados)}%)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gray-100 text-gray-500 rounded-xl"><Clock size={20} /></div>
            <h3 className="text-sm font-bold text-gray-500">Pendientes</h3>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-slate-700">{global.totalPendientes}</p>
            <span className="text-sm font-bold text-gray-400 mb-1">({getPercent(global.totalPendientes, global.totalAfectados)}%)</span>
          </div>
        </div>
      </div>

      {/* Carga por Funcionario */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Carga y Rendimiento por Funcionario</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
              <tr>
                <th className="px-6 py-4">Funcionario</th>
                <th className="px-6 py-4 text-center">Bloques</th>
                <th className="px-6 py-4 text-center">Afectados</th>
                <th className="px-6 py-4 text-center">Reprogramados</th>
                <th className="px-6 py-4 text-center">Pendientes</th>
                <th className="px-6 py-4 text-center">Avance Gral.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {officials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 font-semibold">No hay datos para el periodo seleccionado</td>
                </tr>
              ) : (
                officials.sort((a: any, b: any) => b.totalPatients - a.totalPatients).map((off: any) => {
                  const resolvedTotal = off.reprogrammed + off.noUbicable + off.sinCupo;
                  const progress = getPercent(resolvedTotal, off.totalPatients);
                  return (
                    <tr key={off.email} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">{off.email}</td>
                      <td className="px-6 py-4 text-center font-semibold">{off.blocks}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-700">{off.totalPatients}</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">{off.reprogrammed}</td>
                      <td className="px-6 py-4 text-center font-bold text-orange-500">{off.pending}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${progress === 100 ? "bg-emerald-500" : progress > 50 ? "bg-blue-500" : "bg-orange-400"}`} 
                              style={{ width: `${progress}%` }} 
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-500 w-8 text-right">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recurrencia por Paciente */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileWarning className="text-orange-500" size={18} />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Historial de Recurrencia de Pacientes (Impacto)</h2>
          </div>
          <div className="relative max-w-sm w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Buscar RUT o nombre..."
              value={searchRUT}
              onChange={(e) => setSearchRUT(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
            />
          </div>
        </div>
        <div className="overflow-y-auto max-h-[400px]">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white sticky top-0 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
              <tr>
                <th className="px-6 py-3">RUT Paciente</th>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Contacto</th>
                <th className="px-6 py-3 text-center">Nº Veces Afectado</th>
                <th className="px-6 py-3 text-center">Nivel de Alerta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recurrenceList
                .filter(p => !searchRUT || p.rut.includes(searchRUT) || p.nombre.toLowerCase().includes(searchRUT.toLowerCase()))
                .map((p, idx) => (
                <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-3 font-mono font-medium text-slate-700">{p.rut}</td>
                  <td className="px-6 py-3 font-semibold text-slate-800">{p.nombre}</td>
                  <td className="px-6 py-3 text-xs text-slate-500">{p.telefonos || "Sin datos"}</td>
                  <td className="px-6 py-3 text-center font-black text-lg text-slate-700">{p.veces}</td>
                  <td className="px-6 py-3 text-center">
                    {p.veces >= 3 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700">
                        <AlertTriangle size={12} /> Alta Recurrencia
                      </span>
                    ) : p.veces === 2 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-700">
                        Media
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium text-xs">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
              {recurrenceList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-semibold">No se registran pacientes con múltiples caídas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
