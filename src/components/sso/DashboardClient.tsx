"use client";

import { useState, useMemo } from "react";
import { 
  Users, AlertCircle, Clock, CheckCircle2, AlertTriangle, UserX,
  TrendingUp, Activity, Filter, RefreshCcw, Download
} from "lucide-react";

// Types
type Demand = {
  id: number;
  rut: string;
  full_name: string;
  age: number | null;
  request_date: string;
  origin: string;
  policlinic: string;
  priority: string;
  status: string;
  pregnancy: string;
  updated_at: string;
};

type AuditLog = {
  demand_request_id: number;
  timestamp: string;
  new_value: string;
};

const ESTADOS_CERRADOS = [
  "📅 Agendado", "🔄 Derivado", "🙅 Rechaza Atención", 
  "❌ Repetido", "💻 Telesalud", "⛔ No Corresponde", "📵 No Ubicable"
];

const ESTADOS_CONTACTO = [
  "📞 1er Llamado", "📞📞 2do Llamado", ...ESTADOS_CERRADOS
];

// Normalizador para títulos de policlínicos
const normalizePoli = (poli: string | null | undefined) => {
  if (!poli) return 'Sin Especificar';
  const map: Record<string, string> = {
    'ODONTOLOGIA': 'Odontología',
    'TERAPIA': 'Terapia',
    'PODOLOGIA': 'Podología',
    'NUTRICION': 'Nutrición',
    'MATRONERIA': 'Matronería',
    'PSICOLOGIA': 'Psicología',
    'MEDICINA': 'Medicina',
    'ENFERMERIA': 'Enfermería',
    'KINESIOLOGIA': 'Kinesiología',
    'FONOAUDIOLOGIA': 'Fonoaudiología',
  };
  const upper = poli.trim().toUpperCase();
  return map[upper] || (upper.charAt(0) + upper.slice(1).toLowerCase());
};

// Función auxiliar para determinar si realmente hay un embarazo registrado
const isPregnant = (pregnancy: string | null | undefined) => {
  if (!pregnancy) return false;
  const p = pregnancy.trim().toUpperCase();
  return p !== 'NONE' && p !== 'NO' && p !== 'FALSE' && p !== '0' && p !== '';
};

export default function DashboardClient({ 
  demands, 
  auditLogs 
}: { 
  demands: Demand[];
  auditLogs: AuditLog[];
}) {
  const [context, setContext] = useState<"Global" | "Rechazos" | "Derivacion">("Global");
  const [activeTab, setActiveTab] = useState<"operativo" | "especialidades" | "estrategico">("operativo");

  // 1. Filtrar datos por contexto
  const filteredDemands = useMemo(() => {
    if (context === "Rechazos") return demands.filter(d => d.origin === "Rechazo");
    if (context === "Derivacion") return demands.filter(d => d.origin === "Derivación Interna");
    return demands; // Global
  }, [demands, context]);

  // Cálculos de KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    
    // Función auxiliar para parsear fechas
    const parseDate = (dString: string | null) => dString ? new Date(dString) : new Date();

    // Casos activos
    const activos = filteredDemands.filter(d => !ESTADOS_CERRADOS.includes(d.status));
    const totalActivos = activos.length;

    // Críticos (Prioridad Alta)
    const criticos = activos.filter(d => d.priority === "Alta").length;

    // Estancados (>7 días sin cambios)
    const estancados = activos.filter(d => {
      const diffTime = Math.abs(now.getTime() - parseDate(d.updated_at).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 7;
    }).length;

    // Contactabilidad
    const contactados = activos.filter(d => d.status !== "📋 Pendiente").length;
    const tasaContacto = totalActivos > 0 ? (contactados / totalActivos) * 100 : 0;

    // Tiempo de resolución y Resueltos Semanales usando audit_logs
    let totalDiasResolucion = 0;
    let countResueltos = 0;
    let resueltosEstaSemana = 0;
    let resueltosSemanaPasada = 0;

    // Obtener inicio de semana (Lunes a las 00:00)
    const currentDay = now.getDay();
    const diffToMonday = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const inicioEstaSemana = new Date(now.setDate(diffToMonday));
    inicioEstaSemana.setHours(0,0,0,0);
    
    const inicioSemanaPasada = new Date(inicioEstaSemana);
    inicioSemanaPasada.setDate(inicioSemanaPasada.getDate() - 7);

    // Mapear logs de resolución por ID de demanda
    const resolucionesPorCaso = new Map<number, Date>();
    
    auditLogs.forEach(log => {
      if (ESTADOS_CERRADOS.includes(log.new_value)) {
        const logDate = new Date(log.timestamp);
        if (!resolucionesPorCaso.has(log.demand_request_id)) {
          resolucionesPorCaso.set(log.demand_request_id, logDate);
        } else {
          // Guardar la primera fecha de resolución
          const currentMin = resolucionesPorCaso.get(log.demand_request_id)!;
          if (logDate < currentMin) {
            resolucionesPorCaso.set(log.demand_request_id, logDate);
          }
        }
      }
    });

    // Procesar cada caso resuelto del contexto actual
    filteredDemands.forEach(d => {
      const fechaResolucion = resolucionesPorCaso.get(d.id);
      if (fechaResolucion) {
        // Calcular tiempo de resolución
        const requestDate = parseDate(d.request_date);
        const diffTime = Math.abs(fechaResolucion.getTime() - requestDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDiasResolucion += diffDays;
        countResueltos++;

        // Calcular resueltos por semana
        if (fechaResolucion >= inicioEstaSemana) {
          resueltosEstaSemana++;
        } else if (fechaResolucion >= inicioSemanaPasada && fechaResolucion < inicioEstaSemana) {
          resueltosSemanaPasada++;
        }
      }
    });

    const tiempoPromedio = countResueltos > 0 ? totalDiasResolucion / countResueltos : 0;
    const deltaSemanal = resueltosEstaSemana - resueltosSemanaPasada;

    return {
      totalActivos,
      criticos,
      tasaCriticos: totalActivos > 0 ? (criticos / totalActivos) * 100 : 0,
      tiempoPromedio,
      tasaContacto,
      resueltosEstaSemana,
      deltaSemanal,
      estancados
    };
  }, [filteredDemands, auditLogs]);

  // Cálculos de Alertas Críticas
  const alerts = useMemo(() => {
    const parseDate = (dString: string | null) => dString ? new Date(dString) : new Date();
    const now = new Date();

    const casos60Dias = filteredDemands.filter(d => {
      if (ESTADOS_CERRADOS.includes(d.status)) return false;
      const diffTime = Math.abs(now.getTime() - parseDate(d.request_date).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 60;
    }).length;

    const embarazadasSinContactar = filteredDemands.filter(d => {
      if (!isPregnant(d.pregnancy) || d.status !== '📋 Pendiente') return false;
      const diffTime = Math.abs(now.getTime() - parseDate(d.request_date).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 15;
    }).length;

    const menores5SinAgendar = filteredDemands.filter(d => {
      if (d.age === null || d.age >= 5 || d.status === '📅 Agendado' || ESTADOS_CERRADOS.includes(d.status)) return false;
      const diffTime = Math.abs(now.getTime() - parseDate(d.request_date).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 7;
    }).length;

    return { casos60Dias, embarazadasSinContactar, menores5SinAgendar };
  }, [filteredDemands]);

  // Cálculos de Atención Inmediata (Top 10 Urgentes)
  const urgentes = useMemo(() => {
    const parseDate = (dString: string | null) => dString ? new Date(dString) : new Date();
    const now = new Date();
    
    // Solo casos activos
    const activos = filteredDemands.filter(d => !ESTADOS_CERRADOS.includes(d.status));
    
    // Calcular días de espera y ordenar
    const conDias = activos.map(d => {
      const diffTime = Math.abs(now.getTime() - parseDate(d.request_date).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...d, diasEspera: diffDays };
    });

    return conDias.sort((a, b) => b.diasEspera - a.diasEspera).slice(0, 10);
  }, [filteredDemands]);

  // Embudo de Gestión
  const funnel = useMemo(() => {
    const total = filteredDemands.length;
    const pendientes = filteredDemands.filter(d => d.status === '📋 Pendiente').length;
    const llamado1 = filteredDemands.filter(d => d.status === '📞 1er Llamado').length;
    const llamado2 = filteredDemands.filter(d => d.status === '📞📞 2do Llamado').length;
    const agendados = filteredDemands.filter(d => d.status === '📅 Agendado').length;
    const cerrados = filteredDemands.filter(d => ESTADOS_CERRADOS.includes(d.status)).length;
    
    return {
      total,
      pendientes,
      llamado1,
      llamado2,
      agendados,
      cerrados,
      tasaLlamado1: total > 0 ? (llamado1/total)*100 : 0,
      tasaLlamado2: total > 0 ? (llamado2/total)*100 : 0,
      tasaAgendados: total > 0 ? (agendados/total)*100 : 0,
      tasaCerrados: total > 0 ? (cerrados/total)*100 : 0,
    };
  }, [filteredDemands]);

  // Distribución y Análisis
  const analysis = useMemo(() => {
    const activos = filteredDemands.filter(d => !ESTADOS_CERRADOS.includes(d.status));
    
    // Prioridad
    const priorityCounts = {
      Alta: activos.filter(d => d.priority === 'Alta').length,
      Media: activos.filter(d => d.priority === 'Media').length,
      Baja: activos.filter(d => d.priority === 'Baja').length,
      Reciente: activos.filter(d => d.priority === 'Reciente').length,
    };

    // Policlínicos (Top 5 activos)
    const poliMap = new Map<string, number>();
    activos.forEach(d => {
      const p = normalizePoli(d.policlinic);
      poliMap.set(p, (poliMap.get(p) || 0) + 1);
    });
    const topPoliclinicos = Array.from(poliMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Poblaciones Vulnerables
    const parseDate = (dString: string | null) => dString ? new Date(dString) : new Date();
    const now = new Date();
    
    const embarazadasTotal = filteredDemands.filter(d => isPregnant(d.pregnancy));
    const embarazadasResueltas = embarazadasTotal.filter(d => ESTADOS_CERRADOS.includes(d.status)).length;
    
    const menores5Total = filteredDemands.filter(d => d.age !== null && d.age < 5);
    const menores5Contactados = menores5Total.filter(d => d.status !== '📋 Pendiente').length;
    
    const mayores65Total = filteredDemands.filter(d => d.age !== null && d.age >= 65);
    const mayores65Agendados = mayores65Total.filter(d => d.status === '📅 Agendado').length;

    return {
      priorityCounts,
      topPoliclinicos,
      vulnerables: {
        embarazadas: { total: embarazadasTotal.length, resueltas: embarazadasResueltas },
        menores5: { total: menores5Total.length, contactados: menores5Contactados },
        mayores65: { total: mayores65Total.length, agendados: mayores65Agendados }
      }
    };
  }, [filteredDemands]);

  // Análisis Detallado por Policlínico
  const clinicAnalysis = useMemo(() => {
    const parseDate = (dString: string | null) => dString ? new Date(dString) : new Date();
    const now = new Date();

    const clinicMap = new Map<string, {
      nombre: string;
      total: number;
      activos: number;
      agendados: number;
      resueltos: number;
      diasAcumuladosActivos: number;
    }>();

    filteredDemands.forEach(d => {
      const p = normalizePoli(d.policlinic);
      if (!clinicMap.has(p)) {
        clinicMap.set(p, { nombre: p, total: 0, activos: 0, agendados: 0, resueltos: 0, diasAcumuladosActivos: 0 });
      }
      
      const stats = clinicMap.get(p)!;
      stats.total++;
      
      if (ESTADOS_CERRADOS.includes(d.status)) {
        stats.resueltos++;
        if (d.status === '📅 Agendado') stats.agendados++;
      } else {
        stats.activos++;
        const diffTime = Math.abs(now.getTime() - parseDate(d.request_date).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        stats.diasAcumuladosActivos += diffDays;
      }
    });

    return Array.from(clinicMap.values())
      .map(c => ({
        ...c,
        tiempoPromedio: c.activos > 0 ? c.diasAcumuladosActivos / c.activos : 0,
        tasaAgendamiento: c.total > 0 ? (c.agendados / c.total) * 100 : 0
      }))
      .sort((a, b) => b.activos - a.activos);
  }, [filteredDemands]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Panel Analítico</h1>
          <p className="text-slate-500 font-medium">Métricas operativas y control de gestión en tiempo real.</p>
        </div>
      </div>

      {/* Context Selector & Sub-Tabs Navigation */}
      <div className="flex flex-col gap-4">
        <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm inline-flex self-start">
          <button 
            onClick={() => setContext("Global")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${context === "Global" ? "bg-slate-800 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
          >
            1️⃣ Visión Global CESFAM
          </button>
          <button 
            onClick={() => setContext("Rechazos")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${context === "Rechazos" ? "bg-slate-800 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
          >
            📥 Gestión Rechazos
          </button>
          <button 
            onClick={() => setContext("Derivacion")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${context === "Derivacion" ? "bg-slate-800 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
          >
            🔄 Telesalud e Interconsultas
          </button>
        </div>

        {/* Secondary Sub-Tabs Nav */}
        <div className="flex border-b border-slate-200 gap-1 pt-2 w-full overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab("operativo")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all duration-200 -mb-[2px] cursor-pointer ${
              activeTab === "operativo"
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/20 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Activity className="h-4 w-4 text-indigo-600" />
            🎯 Gestión Diaria (Operativo)
          </button>
          <button
            onClick={() => setActiveTab("especialidades")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all duration-200 -mb-[2px] cursor-pointer ${
              activeTab === "especialidades"
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/20 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            📊 Especialidades (Táctico)
          </button>
          <button
            onClick={() => setActiveTab("estrategico")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all duration-200 -mb-[2px] cursor-pointer ${
              activeTab === "estrategico"
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/20 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Users className="h-4 w-4 text-indigo-600" />
            👥 Proceso y Población (Estratégico)
          </button>
        </div>
      </div>

      {/* Dynamic KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === "operativo" && (
          <>
            {/* KPI 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">📋 Casos Activos</p>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Activity className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-black text-slate-800">{kpis.totalActivos}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Casos sin gestionar o cerrar</p>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">🔴 Críticos</p>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded">{kpis.tasaCriticos.toFixed(1)}%</span>
              </div>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-black text-rose-600">{kpis.criticos}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Casos activos con Prioridad Alta</p>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">⚠️ Estancados</p>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-black text-amber-600">{kpis.estancados}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">&gt;7 días sin cambios en su estado</p>
            </div>
          </>
        )}

        {activeTab === "especialidades" && (
          <>
            {/* KPI 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">📋 Casos Activos</p>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Activity className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-black text-slate-800">{kpis.totalActivos}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Carga total activa en especialidades</p>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">⏱️ T. Resolución</p>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-black text-slate-800">{kpis.tiempoPromedio.toFixed(0)} <span className="text-lg text-slate-400 font-bold">d</span></p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Promedio en días desde el ingreso del caso</p>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">✅ Resueltos Semana</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${kpis.deltaSemanal >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {kpis.deltaSemanal > 0 ? '+' : ''}{kpis.deltaSemanal} vs anterior
                </span>
              </div>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-black text-emerald-600">{kpis.resueltosEstaSemana}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Casos cerrados en los últimos 7 días</p>
            </div>
          </>
        )}

        {activeTab === "estrategico" && (
          <>
            {/* KPI 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">📋 Casos Activos</p>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Activity className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-black text-slate-800">{kpis.totalActivos}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Total de la cohorte activa en seguimiento</p>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">📞 Contactabilidad</p>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <RefreshCcw className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-black text-blue-600">{kpis.tasaContacto.toFixed(1)}%</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Porcentaje de casos con gestiones de contacto</p>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">✅ Resueltos Semana</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${kpis.deltaSemanal >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {kpis.deltaSemanal > 0 ? '+' : ''}{kpis.deltaSemanal} vs anterior
                </span>
              </div>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-black text-emerald-600">{kpis.resueltosEstaSemana}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Casos cerrados en los últimos 7 días</p>
            </div>
          </>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Dynamic Content Panels based on activeTab */}
      {activeTab === "operativo" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Alertas Críticas */}
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" /> Alertas Críticas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${alerts.casos60Dias > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                {alerts.casos60Dias > 0 ? <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
                <div>
                  <p className={`font-bold ${alerts.casos60Dias > 0 ? 'text-rose-900' : 'text-emerald-900'}`}>
                    {alerts.casos60Dias > 0 ? `${alerts.casos60Dias} casos >60 días` : 'Sin casos >60 días'}
                  </p>
                  <p className={`text-xs mt-1 font-medium ${alerts.casos60Dias > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {alerts.casos60Dias > 0 ? 'Exceden el tiempo máximo de resolución.' : 'Todo al día.'}
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${alerts.embarazadasSinContactar > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                {alerts.embarazadasSinContactar > 0 ? <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
                <div>
                  <p className={`font-bold ${alerts.embarazadasSinContactar > 0 ? 'text-amber-900' : 'text-emerald-900'}`}>
                    {alerts.embarazadasSinContactar > 0 ? `${alerts.embarazadasSinContactar} embarazadas` : 'Embarazadas al día'}
                  </p>
                  <p className={`text-xs mt-1 font-medium ${alerts.embarazadasSinContactar > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {alerts.embarazadasSinContactar > 0 ? 'Sin contactar (>15 días).' : 'Todo al día.'}
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${alerts.menores5SinAgendar > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                {alerts.menores5SinAgendar > 0 ? <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
                <div>
                  <p className={`font-bold ${alerts.menores5SinAgendar > 0 ? 'text-amber-900' : 'text-emerald-900'}`}>
                    {alerts.menores5SinAgendar > 0 ? `${alerts.menores5SinAgendar} menores de 5 años` : 'Menores de 5 al día'}
                  </p>
                  <p className={`text-xs mt-1 font-medium ${alerts.menores5SinAgendar > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {alerts.menores5SinAgendar > 0 ? 'Sin agendar (>7 días).' : 'Todo al día.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Atención Inmediata */}
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" /> Atención Inmediata (Top 10 Esperas)
            </h2>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {urgentes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">RUT</th>
                        <th className="px-4 py-3">Paciente</th>
                        <th className="px-4 py-3">Edad</th>
                        <th className="px-4 py-3">Fecha Ingreso</th>
                        <th className="px-4 py-3">Policlínico</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-right">Días Espera</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {urgentes.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-600">{u.rut}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{u.full_name}</td>
                          <td className="px-4 py-3 text-slate-500">{u.age !== null ? `${u.age} años` : 'N/A'}</td>
                          <td className="px-4 py-3 text-slate-500">{new Date(u.request_date).toLocaleDateString('es-CL')}</td>
                          <td className="px-4 py-3">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{normalizePoli(u.policlinic)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">{u.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-black">{u.diasEspera} días</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 font-medium">
                  No hay casos urgentes pendientes en este contexto.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "especialidades" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Análisis Detallado por Policlínico */}
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" /> Análisis Detallado por Policlínico
            </h2>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Policlínico</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right text-blue-600">Activos</th>
                      <th className="px-4 py-3 text-right">Agendados</th>
                      <th className="px-4 py-3 text-right">Resueltos</th>
                      <th className="px-4 py-3 text-right text-amber-600">T. Prom (Activos)</th>
                      <th className="px-4 py-3 text-right text-emerald-600">Tasa Agenda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clinicAnalysis.map(c => (
                      <tr key={c.nombre} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800">{c.nombre}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-600">{c.total}</td>
                        <td className="px-4 py-3 text-right font-black text-blue-600">{c.activos}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{c.agendados}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{c.resueltos}</td>
                        <td className="px-4 py-3 text-right font-bold text-amber-600">{c.tiempoPromedio.toFixed(0)} d</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">{c.tasaAgendamiento.toFixed(1)}%</td>
                      </tr>
                    ))}
                    {clinicAnalysis.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-medium">No hay datos para mostrar</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Policlínicos con Mayor Demanda */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-2xl">
            <h3 className="text-md font-extrabold text-slate-800 mb-4">Policlínicos con Mayor Demanda</h3>
            <div className="space-y-3">
              {analysis.topPoliclinicos.map(([nombre, cantidad], idx) => (
                <div key={nombre} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <span className="text-slate-400 text-xs">#{idx + 1}</span> {nombre}
                  </span>
                  <span className="font-black text-slate-900">{cantidad}</span>
                </div>
              ))}
              {analysis.topPoliclinicos.length === 0 && (
                <p className="text-slate-500 text-sm">No hay datos activos para mostrar.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "estrategico" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Flujo de Gestión (Embudo) */}
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Flujo de Gestión (Embudo)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">📋 Pendiente</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{funnel.pendientes}</p>
                <p className="text-[10px] text-slate-400 mt-1">Casos sin gestionar</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm text-center relative">
                <div className="hidden md:block absolute -left-3 top-1/2 -translate-y-1/2 text-slate-300">›</div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">📞 1er Llamado</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{funnel.llamado1}</p>
                <p className="text-[10px] text-blue-600 font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded-full inline-block">{funnel.tasaLlamado1.toFixed(1)}%</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm text-center relative">
                <div className="hidden md:block absolute -left-3 top-1/2 -translate-y-1/2 text-slate-300">›</div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">📞📞 2do Llamado</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{funnel.llamado2}</p>
                <p className="text-[10px] text-blue-600 font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded-full inline-block">{funnel.tasaLlamado2.toFixed(1)}%</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm text-center relative">
                <div className="hidden md:block absolute -left-3 top-1/2 -translate-y-1/2 text-slate-300">›</div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">📅 Agendado</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{funnel.agendados}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">{funnel.tasaAgendados.toFixed(1)}%</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm text-center relative">
                <div className="hidden md:block absolute -left-3 top-1/2 -translate-y-1/2 text-slate-300">›</div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-tighter">✅ Cerrados</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{funnel.cerrados}</p>
                <p className="text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">{funnel.tasaCerrados.toFixed(1)}% de total</p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Distribución por Prioridad y Poblaciones Vulnerables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Distribución por Prioridad */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <h3 className="text-md font-extrabold text-slate-800 mb-4">Distribución por Prioridad (Casos Activos)</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span> Alta
                  </span>
                  <span className="font-black text-rose-600">{analysis.priorityCounts.Alta}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span> Media
                  </span>
                  <span className="font-black text-amber-600">{analysis.priorityCounts.Media}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Baja
                  </span>
                  <span className="font-black text-yellow-600">{analysis.priorityCounts.Baja}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Reciente
                  </span>
                  <span className="font-black text-blue-600">{analysis.priorityCounts.Reciente}</span>
                </div>
              </div>
            </div>

            {/* Poblaciones Vulnerables */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
              <h3 className="text-md font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-fuchsia-500" /> Poblaciones Vulnerables
              </h3>
              
              <div className="space-y-3">
                {/* Embarazadas */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-700">🤰 Embarazadas</p>
                    <p className="text-[10px] text-slate-400 font-medium">Total: {analysis.vulnerables.embarazadas.total} casos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600">
                      {analysis.vulnerables.embarazadas.resueltas} Resueltas
                    </p>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 ml-1 rounded font-bold">
                      {analysis.vulnerables.embarazadas.total > 0 ? ((analysis.vulnerables.embarazadas.resueltas / analysis.vulnerables.embarazadas.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>

                {/* Menores 5 */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-700">👶 Menores 5 Años</p>
                    <p className="text-[10px] text-slate-400 font-medium">Total: {analysis.vulnerables.menores5.total} casos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-blue-600">
                      {analysis.vulnerables.menores5.contactados} Contactados
                    </p>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 ml-1 rounded font-bold">
                      {analysis.vulnerables.menores5.total > 0 ? ((analysis.vulnerables.menores5.contactados / analysis.vulnerables.menores5.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>

                {/* Mayores 65 */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-700">👴 Mayores 65 Años</p>
                    <p className="text-[10px] text-slate-400 font-medium">Total: {analysis.vulnerables.mayores65.total} casos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600">
                      {analysis.vulnerables.mayores65.agendados} Agendados
                    </p>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 ml-1 rounded font-bold">
                      {analysis.vulnerables.mayores65.total > 0 ? ((analysis.vulnerables.mayores65.agendados / analysis.vulnerables.mayores65.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
