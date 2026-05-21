"use client";

import { useState, useTransition, useMemo } from "react";
import { updateDemandStatus } from "@/app/sso/demand/actions";
import toast from "react-hot-toast";
import {
  ChevronDown, ChevronUp, MessageSquare, History, Phone, Calendar,
  Stethoscope, Search, Filter, Eye, EyeOff, FileEdit, Download,
  Users, Baby
} from "lucide-react";

const STATUS_OPTIONS = [
  "📋 Pendiente", "📞 1er Llamado", "📞📞 2do Llamado",
  "📅 Agendado", "🔄 Derivado", "💻 Telesalud",
  "🙅 Rechaza Atención", "⛔ No Corresponde", "📵 No Ubicable", "❌ Repetido"
];

const RESOLVED_STATUSES = [
  "📅 Agendado", "🔄 Derivado", "🙅 Rechaza Atención",
  "❌ Repetido", "💻 Telesalud", "⛔ No Corresponde", "📵 No Ubicable"
];

function getPriorityBadge(priority: string, status: string) {
  if (RESOLVED_STATUSES.includes(status))
    return { text: "Resuelto", bg: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" };
  switch (priority) {
    case "Alta": return { text: "Prioridad Alta", bg: "bg-rose-100 text-rose-700", dot: "bg-rose-500" };
    case "Media": return { text: "Prioridad Media", bg: "bg-orange-100 text-orange-700", dot: "bg-orange-500" };
    case "Baja": return { text: "Prioridad Baja", bg: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
    default: return { text: "Reciente", bg: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
  }
}

function calculateDynamicPriority(dateString: string | null | undefined): string {
  if (!dateString) return "Reciente";
  try {
    const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
    if (diffDays > 30) return "Alta";
    if (diffDays > 15) return "Media";
    if (diffDays > 7) return "Baja";
    return "Reciente";
  } catch { return "Reciente"; }
}

const normalizePoli = (poli: string | null | undefined) => {
  if (!poli) return "";
  const map: Record<string, string> = {
    ODONTOLOGIA: "Odontología", TERAPIA: "Terapia", PODOLOGIA: "Podología",
    NUTRICION: "Nutrición", MATRONERIA: "Matronería", PSICOLOGIA: "Psicología",
    MEDICINA: "Medicina", ENFERMERIA: "Enfermería", KINESIOLOGIA: "Kinesiología",
    FONOAUDIOLOGIA: "Fonoaudiología",
  };
  const upper = poli.trim().toUpperCase();
  return map[upper] || (upper.charAt(0) + upper.slice(1).toLowerCase());
};

export default function RechazosClient({ data }: { data: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("Todos");
  const [showResolved, setShowResolved] = useState(false);
  const [selectedPoli, setSelectedPoli] = useState("Todos");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedAge, setSelectedAge] = useState("Todos");
  const [pregnancyOnly, setPregnancyOnly] = useState(false);

  const policlinicos = useMemo(
    () => ["Todos", ...Array.from(new Set(data.map((d) => normalizePoli(d.policlinic)).filter(Boolean)))],
    [data]
  );

  const filteredData = data.filter((row) => {
    const isResolved = RESOLVED_STATUSES.includes(row.status);
    if (!showResolved && isResolved) return false;
    if (searchTerm && !row.rut?.toLowerCase().includes(searchTerm.toLowerCase()) && !row.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (selectedPoli !== "Todos" && normalizePoli(row.policlinic) !== selectedPoli) return false;
    if (selectedPriority !== "Todos") {
      const dp = calculateDynamicPriority(row.requestDate);
      const badge = getPriorityBadge(dp, row.status);
      if (selectedPriority === "Resuelto" && badge.text !== "Resuelto") return false;
      if (selectedPriority !== "Resuelto" && !badge.text.includes(selectedPriority)) return false;
    }
    if (selectedAge === "Infantil" && !(row.age !== null && row.age < 5)) return false;
    if (selectedAge === "Pediatrico" && !(row.age !== null && row.age >= 5 && row.age < 15)) return false;
    if (selectedAge === "Adulto" && !(row.age !== null && row.age >= 15 && row.age < 65)) return false;
    if (selectedAge === "AdultoMayor" && !(row.age !== null && row.age >= 65)) return false;
    if (pregnancyOnly && (!row.pregnancy || ["NONE", "NO", "FALSE", "0"].includes(row.pregnancy?.toUpperCase()))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
        <div className="relative flex-1 w-full">
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1">Búsqueda rápida</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="RUT o Nombre del paciente..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1">Policlínico</label>
          <select className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 font-bold" value={selectedPoli} onChange={(e) => setSelectedPoli(e.target.value)}>
            {policlinicos.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="w-full md:w-48">
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1">Prioridad</label>
          <select className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 font-bold" value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
            <option value="Todos">Todas</option>
            <option value="Alta">🔴 Alta</option>
            <option value="Media">🟠 Media</option>
            <option value="Baja">🟡 Baja</option>
            <option value="Reciente">⚪ Reciente</option>
            <option value="Resuelto">🟢 Resueltos</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowResolved(!showResolved)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all ${showResolved ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            {showResolved ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showResolved ? "Ver Todo" : "Pendientes"}
          </button>
          <button onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all ${showAdvanced ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            <Filter className="h-4 w-4" /> Avanzados
          </button>
        </div>
      </div>

      {/* Contador */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-slate-200" />
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Listado Filtrado</span>
          <span className="text-[11px] font-bold text-blue-600">{filteredData.length} pacientes</span>
        </div>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] tracking-wider uppercase">
                <th className="py-4 px-4 w-32">Prioridad</th>
                <th className="py-4 px-4 w-40">Estado</th>
                <th className="py-4 px-4">Paciente</th>
                <th className="py-4 px-4 w-32">Ingreso</th>
                <th className="py-4 px-4">Policlínico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => (
                <TableRow key={row.id} row={row} showResolved={showResolved} />
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500 font-medium">No hay casos que mostrar con los filtros actuales.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TableRow({ row, showResolved }: { row: any; showResolved: boolean }) {
  const [status, setStatus] = useState(row.status);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (newStatus: string) => {
    setStatus(newStatus);
    startTransition(async () => {
      const res = await updateDemandStatus(row.id, newStatus);
      if (!res.success) toast.error("Error al actualizar");
    });
  };

  const dynamicPriority = calculateDynamicPriority(row.requestDate);
  const badge = getPriorityBadge(dynamicPriority, status);

  let fechaIngreso = "N/A";
  if (row.requestDate) {
    try {
      const d = new Date(row.requestDate);
      fechaIngreso = `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
    } catch { /**/ }
  }

  if (!showResolved && RESOLVED_STATUSES.includes(status)) return null;

  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      <td className="py-4 px-4">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${badge.bg} text-[9px] font-black uppercase tracking-tighter whitespace-nowrap`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} animate-pulse`} />
          {badge.text}
        </div>
      </td>
      <td className="py-4 px-4">
        <select
          className="w-full min-w-[140px] border border-slate-200 text-[11px] rounded p-1.5 font-bold cursor-pointer bg-slate-100/50 hover:bg-white transition-colors"
          value={status}
          onChange={(e) => handleUpdate(e.target.value)}
          disabled={isPending}
        >
          {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </td>
      <td className="py-4 px-4">
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 leading-tight">{row.fullName}</span>
          <span className="text-[11px] text-slate-500 font-medium">{row.rut} • {row.age} años</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold whitespace-nowrap">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {fechaIngreso}
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{normalizePoli(row.policlinic)}</span>
      </td>
    </tr>
  );
}
