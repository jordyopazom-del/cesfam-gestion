"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, FileSpreadsheet, Search, RefreshCw, CalendarDays, Filter, UserCheck, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DemandaDashboard() {
  const [isUploading, setIsUploading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters state
  const [searchName, setSearchName] = useState("");
  const [selectedPoli, setSelectedPoli] = useState("TODOS");
  const [selectedActividad, setSelectedActividad] = useState("TODAS");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/demanda/data');
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

  // -------------------------------------------------------------
  // Dynamic Filters & Computed Metrics
  // -------------------------------------------------------------
  const availableTiposAtencion = useMemo(() => {
    if (!data?.hasData || !data?.distribuciones) return [];
    
    const tipos = new Set<string>();
    data.distribuciones.forEach((d: any) => {
      if (selectedPoli !== "TODOS" && d.policlinico !== selectedPoli) return;
      
      const desglose = d.desglose as Record<string, number>;
      Object.keys(desglose).forEach(k => {
        if (k.trim() !== '' && k.toUpperCase() !== 'TOTAL' && desglose[k] > 0) {
          tipos.add(k.trim());
        }
      });
    });
    return Array.from(tipos).sort();
  }, [data, selectedPoli]);

  // Reset Actividad if it's not available in the new Policlínico
  useEffect(() => {
    if (selectedActividad !== "TODAS" && !availableTiposAtencion.includes(selectedActividad)) {
      setSelectedActividad("TODAS");
    }
  }, [selectedPoli, availableTiposAtencion, selectedActividad]);

  const filteredData = useMemo(() => {
    if (!data?.hasData || !data?.distribuciones) return [];

    return data.distribuciones.filter((d: any) => {
      // 1. Filter by Name
      if (searchName && !d.profesional.toLowerCase().includes(searchName.toLowerCase())) return false;
      
      // 2. Filter by Policlínico
      if (selectedPoli !== "TODOS" && d.policlinico !== selectedPoli) return false;
      
      // 3. Filter by Actividad
      if (selectedActividad !== "TODAS") {
        const desglose = d.desglose as Record<string, number>;
        const count = desglose[selectedActividad] || 0;
        if (count === 0) return false; // Only show professionals that HAVE slots for this activity
      }

      return true;
    }).sort((a: any, b: any) => {
      // Sort logic: If an activity is selected, sort by that activity's count descending
      // Otherwise sort by total count descending
      if (selectedActividad !== "TODAS") {
        const valA = (a.desglose as Record<string, number>)[selectedActividad] || 0;
        const valB = (b.desglose as Record<string, number>)[selectedActividad] || 0;
        return valB - valA;
      }
      return b.total - a.total;
    });
  }, [data, searchName, selectedPoli, selectedActividad]);

  // Compute KPIs
  const totalCupos = useMemo(() => {
    return filteredData.reduce((sum: number, d: any) => {
      if (selectedActividad !== "TODAS") {
        return sum + ((d.desglose as Record<string, number>)[selectedActividad] || 0);
      }
      return sum + d.total;
    }, 0);
  }, [filteredData, selectedActividad]);

  const topProfesional = filteredData.length > 0 ? filteredData[0] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="text-blue-600 h-6 w-6" />
            Buscador de Cupos Libres
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Encuentra rápidamente disponibilidad de agendas por profesional y tipo de atención.
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
            Sube el archivo Excel <span className="font-semibold">"planilla_estado_horas.xls"</span> para empezar a buscar cupos.
          </p>
        </div>
      ) : (
        <>
          {/* INFO BADGE */}
          <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-xl border border-blue-100 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            <span>
              Mostrando el reporte correspondiente al periodo: 
              <strong className="ml-1">
                {new Date(data.uploadMeta.startDate).toLocaleDateString('es-CL', { timeZone: 'UTC' })} 
                {data.uploadMeta.startDate !== data.uploadMeta.endDate && ` al ${new Date(data.uploadMeta.endDate).toLocaleDateString('es-CL', { timeZone: 'UTC' })}`}
              </strong>
            </span>
          </div>

          {/* FILTERS & KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* FILTERS CARD */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-slate-500" /> Filtros de Búsqueda
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
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
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Policlínico */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Policlínico / Sector</label>
                  <select 
                    value={selectedPoli}
                    onChange={(e) => setSelectedPoli(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TODOS">Todas las Especialidades</option>
                    {data.filtros.policlinicos.map((p: string) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Atención */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Tipo de Atención</label>
                  <select 
                    value={selectedActividad}
                    onChange={(e) => setSelectedActividad(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TODAS">Cualquier Actividad</option>
                    {availableTiposAtencion.map((t: string) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white flex flex-col justify-center shadow-lg shadow-blue-500/20">
                <span className="text-blue-100 text-sm font-semibold mb-1">Cupos Libres Encontrados</span>
                <span className="text-4xl font-black">{totalCupos}</span>
                {selectedActividad !== "TODAS" && (
                  <span className="text-xs text-blue-200 mt-2 line-clamp-1 break-all">en {selectedActividad}</span>
                )}
              </div>
              
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2 text-emerald-600">
                  <UserCheck className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Mayor Dispo.</span>
                </div>
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
                  <span className="text-sm text-slate-500 font-medium">Nadie encontrado</span>
                )}
              </div>
            </div>

          </div>

          {/* DATA TABLE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50/80 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold">Profesional</th>
                    <th className="px-6 py-4 font-bold">Especialidad</th>
                    {selectedActividad !== "TODAS" ? (
                      <>
                        <th className="px-6 py-4 font-bold text-blue-600 bg-blue-50/50">
                          Cupos: {selectedActividad}
                        </th>
                        <th className="px-6 py-4 font-bold">Total Cupos Globales</th>
                      </>
                    ) : (
                      <th className="px-6 py-4 font-bold text-blue-600">Total Cupos Libres</th>
                    )}
                    <th className="px-6 py-4 font-bold text-right">Detalle (Principales)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                        No se encontraron profesionales con estos criterios de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((d: any, i: number) => {
                      const desglose = d.desglose as Record<string, number>;
                      // Top 3 actividades de este profesional
                      const topActividades = Object.entries(desglose)
                        .filter(([k, v]) => v > 0 && k !== selectedActividad)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3);

                      const limit = selectedActividad !== "TODAS" ? 4 : 3;
                      const hiddenActividades = Object.entries(desglose)
                        .filter(([k, v]) => v > 0 && k !== selectedActividad)
                        .sort((a, b) => b[1] - a[1])
                        .slice(limit);
                      
                      const hiddenText = hiddenActividades.map(([act, count]) => `${act}: ${count}`).join(', ');

                      return (
                        <tr key={i} className="hover:bg-white transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {d.profesional}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              {d.policlinico}
                            </span>
                          </td>
                          
                          {selectedActividad !== "TODAS" ? (
                            <>
                              <td className="px-6 py-4 font-black text-lg text-blue-600 bg-blue-50/30">
                                {desglose[selectedActividad] || 0}
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-500">
                                {d.total}
                              </td>
                            </>
                          ) : (
                            <td className="px-6 py-4 font-black text-lg text-blue-600">
                              {d.total}
                            </td>
                          )}

                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-wrap justify-end gap-1.5">
                              {topActividades.length > 0 ? (
                                topActividades.map(([act, count]) => (
                                  <span key={act} className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200" title={`${count} cupos en ${act}`}>
                                    {act}: {count}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-500">Sin otras act.</span>
                              )}
                              {hiddenActividades.length > 0 && (
                                <span 
                                  className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-100 cursor-help"
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
