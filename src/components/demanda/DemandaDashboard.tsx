"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, RefreshCw, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { toast } from 'sonner';

export default function DemandaDashboard() {
  const [isUploading, setIsUploading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'];

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
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/demanda/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Archivo procesado: ${result.count} registros guardados.`);
        fetchData();
      } else {
        toast.error(result.error || "Error al procesar el archivo");
      }
    } catch (error) {
      toast.error("Error de conexión al subir el archivo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-xl border border-slate-100 text-sm">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 font-medium">{entry.name}:</span>
              <span className="text-slate-900 font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get dynamic keys for the stacked bar chart (ignoring 'name' and 'total')
  const getPoliclinicoKeys = () => {
    if (!data?.policlinicoData || data.policlinicoData.length === 0) return [];
    const keys = new Set<string>();
    data.policlinicoData.forEach((item: any) => {
      Object.keys(item).forEach(k => {
        if (k !== 'name' && k !== 'total') keys.add(k);
      });
    });
    return Array.from(keys);
  };

  const poliKeys = getPoliclinicoKeys();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-blue-600 h-6 w-6" />
            Distribución de la Oferta (Tipos de Atención)
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Visualiza cómo se distribuyen las horas asignadas en el CESFAM.
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
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'
            }`}
          >
            {isUploading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? 'Procesando...' : 'Subir Reporte (Excel)'}
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100 h-[500px]">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Cargando datos históricos...</p>
        </div>
      ) : !data || data.categoryData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <FileSpreadsheet className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No hay datos disponibles</h3>
          <p className="text-slate-500 text-center max-w-md">
            Sube el archivo Excel <span className="font-semibold">"planilla_estado_horas.xls"</span> descargado desde Rayen (RAS) para generar los gráficos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* TOTALES POR CATEGORIA (PIE CHART) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[450px]">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
              <PieChart className="h-5 w-5 text-indigo-500" />
              Resumen Total de Horas Asignadas
            </h3>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DISTRIBUCION POR POLICLINICO (STACKED BAR) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col h-[450px]">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              Distribución por Policlínico / Especialidad
            </h3>
            <div className="flex-1 w-full -ml-4 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.policlinicoData}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dx={-10}
                  />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                  />
                  {poliKeys.map((key, index) => (
                    <Bar 
                      key={key} 
                      dataKey={key} 
                      stackId="a" 
                      fill={COLORS[index % COLORS.length]} 
                      radius={index === poliKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
