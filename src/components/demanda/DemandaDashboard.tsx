"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, FileSpreadsheet, Search, RefreshCw, CalendarDays, Filter, UserCheck, Stethoscope, EyeOff, Activity, Percent, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DemandaDashboard() {
  const [isUploading, setIsUploading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters state
  const [searchName, setSearchName] = useState("");
  const [selectedPoli, setSelectedPoli] = useState("TODOS");
  const [hideZeroSlots, setHideZeroSlots] = useState(true);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedPeriodId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = selectedPeriodId ? `/api/demanda/data?uploadId=${selectedPeriodId}` : '/api/demanda/data';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error("Error al cargar los datos");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeriod = async () => {
    if (!data?.uploadMeta?.id) return;
    if (!confirm('¿Estás seguro de que deseas eliminar este reporte?')) return;
    
    setIsDeleting(true);
    const toastId = toast.loading("Eliminando reporte...");
    try {
      const res = await fetch(`/api/demanda/upload/${data.uploadMeta.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Reporte eliminado", { id: toastId });
        setSelectedPeriodId(null); 
        fetchData();
      } else {
        toast.error("Error al eliminar", { id: toastId });
      }
    } catch (error) {
      toast.error("Error de conexión", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
      toast.error("Formato inválido. Sube un archivo Excel (.xls o .xlsx)");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Procesando archivo...");
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/demanda/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Archivo procesado: ${result.count} registros guardados.`, { id: toastId });
        fetchData();
      } else {
        toast.error(result.error || "Error al procesar el archivo", { id: toastId });
      }
    } catch (error) {
      toast.error("Error de conexión al subir el archivo", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredData = useMemo(() => {
    if (!data?.hasData || !data?.distribuciones) return [];

    return data.distribuciones.filter((d: any) => {
      // 1. Filter by Name
      if (searchName && !d.profesional.toLowerCase().includes(searchName.toLowerCase())) return false;
      
      // 2. Filter by Policlínico
      if (selectedPoli !== "TODOS" && d.policlinico !== selectedPoli) return false;
      
      // 3. Filter out zero slots if toggle is active
      const desglose = d.desglose as Record<string, number>;
      const libres = desglose["LIBRE"] || 0;
      if (hideZeroSlots && libres === 0) return false;

      return true;
    }).sort((a: any, b: any) => {
      // Sort by available free slots descending
      const valA = (a.desglose as Record<string, number>)["LIBRE"] || 0;
      const valB = (b.desglose as Record<string, number>)["LIBRE"] || 0;
      return valB - valA;
    });
  }, [data, searchName, selectedPoli, hideZeroSlots]);

  // Compute KPIs
  const totalCuposLibres = useMemo(() => {
    return filteredData.reduce((sum: number, d: any) => sum + ((d.desglose as Record<string, number>)["LIBRE"] || 0), 0);
  }, [filteredData]);

  const totalCuposGlobales = useMemo(() => {
    return filteredData.reduce((sum: number, d: any) => sum + (d.total || 0), 0);
  }, [filteredData]);

  const porcentajeOcupacion = totalCuposGlobales > 0 
    ? Math.round(((totalCuposGlobales - totalCuposLibres) / totalCuposGlobales) * 100) 
    : 0;

  const topProfesional = filteredData.length > 0 && ((filteredData[0].desglose as Record<string, number>)["LIBRE"] || 0) > 0 
    ? filteredData[0] 
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="text-blue-600 h-6 w-6" />
            Radar de Disponibilidad
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Encuentra rápidamente cupos libres y mide la congestión del CESFAM.
          </p>
        </div>
        
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xls,.xlsx" 
            className="hidden" 
            id="excel-upload"
          />
          <label 
            htmlFor="excel-upload" 
            className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
              isUploading 
                ? 'bg-slate-100 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'
            }`}
          >
            {isUploading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? 'Procesando...' : 'Actualizar Excel de Horas'}
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100 h-[300px]">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Cargando reporte de horas...</p>
        </div>
      ) : !data?.hasData ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <FileSpreadsheet className="h-10 w-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No hay datos de agendas</h3>
          <p className="text-slate-500 text-center max-w-md">
            Sube el archivo Excel <span className="font-semibold">"planilla_estado_horas.xls"</span> para empezar a buscar cupos libres.
          </p>
        </div>
      ) : (
        <>
          {/* INFO BADGE & SELECTOR */}
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <span>Seleccionar periodo del reporte:</span>
              
              <select 
                value={data.uploadMeta.id}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                disabled={loading}
                className="ml-2 bg-white border border-blue-200 text-blue-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5 font-bold cursor-pointer hover:bg-blue-50 transition-colors shadow-sm outline-none"
              >
                {data.availablePeriods?.map((period: any) => {
                  const start = new Date(period.startDate).toLocaleDateString('es-CL', { timeZone: 'UTC' });
                  const end = new Date(period.endDate).toLocaleDateString('es-CL', { timeZone: 'UTC' });
                  const label = start === end ? start : `${start} al ${end}`;
                  return (
                    <option key={period.id} value={period.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <button
              onClick={handleDeletePeriod}
              disabled={isDeleting || loading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 hover:border-rose-300 px-3 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 outline-none"
              title="Eliminar este reporte de la base de datos"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? 'Borrando...' : 'Borrar Reporte'}
            </button>
          </div>

          {/* KPIs ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI 1: Total Libres */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white flex flex-col justify-center shadow-lg shadow-blue-500/20">
              <span className="text-blue-100 text-sm font-semibold mb-1 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 opacity-70" /> Cupos Libres Totales
              </span>
              <span className="text-4xl font-black">{totalCuposLibres}</span>
            </div>

            {/* KPI 2: Ocupación Global */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
              <span className="text-slate-500 text-sm font-semibold mb-1 flex items-center gap-2">
                <Percent className="h-4 w-4 text-rose-500" /> Ocupación Global
              </span>
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-black ${porcentajeOcupacion > 80 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {porcentajeOcupacion}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                <div 
                  className={`h-1.5 rounded-full ${porcentajeOcupacion > 80 ? 'bg-rose-500' : porcentajeOcupacion > 50 ? 'bg-amber-400' : 'bg-emerald-500'}`} 
                  style={{ width: `${Math.min(100, Math.max(0, porcentajeOcupacion))}%` }}
                ></div>
              </div>
            </div>
            
            {/* KPI 3: Mayor Disponibilidad */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
              <span className="text-slate-500 text-sm font-semibold mb-2 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" /> Mayor Disponibilidad
              </span>
              {topProfesional ? (
                <>
                  <span className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight">
                    {topProfesional.profesional}
                  </span>
                  <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Stethoscope className="h-3 w-3" /> {topProfesional.policlinico}
                  </span>
                </>
              ) : (
                <span className="text-sm text-slate-500 font-medium italic">Nadie con cupos libres</span>
              )}
            </div>
          </div>

          {/* FILTERS CARD */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Filter className="h-5 w-5 text-slate-500" /> Filtros Rápidos
              </h3>
              
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 transition-colors">
                <input 
                  type="checkbox" 
                  checked={hideZeroSlots}
                  onChange={(e) => setHideZeroSlots(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
                />
                <EyeOff className="h-4 w-4 text-slate-400" /> Ocultar agendas llenas (0 cupos)
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Profesional</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Policlínico */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Policlínico / Sector</label>
                <select 
                  value={selectedPoli}
                  onChange={(e) => setSelectedPoli(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TODOS">Todas las Especialidades</option>
                  {data.filtros.policlinicos.map((p: string) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50/80 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold w-1/4">Profesional</th>
                    <th className="px-6 py-4 font-bold w-1/5">Especialidad</th>
                    <th className="px-6 py-4 font-bold w-1/4">Disponibilidad (Cupos Libres)</th>
                    <th className="px-6 py-4 font-bold text-right">Otras Actividades (Detalle)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                        {hideZeroSlots 
                          ? "No hay profesionales con cupos libres que coincidan con la búsqueda." 
                          : "No se encontraron profesionales con estos criterios de búsqueda."}
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((d: any, i: number) => {
                      const desglose = d.desglose as Record<string, number>;
                      const libres = desglose["LIBRE"] || 0;
                      const porcentajeLibre = d.total > 0 ? Math.round((libres / d.total) * 100) : 0;
                      
                      // Top actividades (excluyendo LIBRE)
                      const otrasActividades = Object.entries(desglose)
                        .filter(([k, v]) => v > 0 && k !== "LIBRE")
                        .sort((a, b) => b[1] - a[1]);

                      const topActividades = otrasActividades.slice(0, 3);
                      const hiddenActividades = otrasActividades.slice(3);
                      const hiddenText = hiddenActividades.map(([act, count]) => `${act}: ${count}`).join(', ');

                      return (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {d.profesional}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {d.policlinico}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5 max-w-[200px]">
                              <span className={`font-black text-2xl ${libres > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                                {libres}
                              </span>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-1.5 rounded-full ${porcentajeLibre > 50 ? 'bg-emerald-500' : porcentajeLibre > 20 ? 'bg-blue-500' : 'bg-slate-300'}`} 
                                  style={{ width: `${Math.min(100, Math.max(0, porcentajeLibre))}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {libres} de {d.total} cupos totales ({porcentajeLibre}% disponible)
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-wrap justify-end gap-1.5">
                              {topActividades.length > 0 ? (
                                topActividades.map(([act, count]) => (
                                  <span key={act} className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200" title={`${count} cupos en ${act}`}>
                                    {act}: <strong className="ml-1 text-slate-700">{count}</strong>
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400 italic">Agenda totalmente libre</span>
                              )}
                              {hiddenActividades.length > 0 && (
                                <span 
                                  className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 cursor-help"
                                  title={`Otras actividades:\n${hiddenText}`}
                                >
                                  +{hiddenActividades.length}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
