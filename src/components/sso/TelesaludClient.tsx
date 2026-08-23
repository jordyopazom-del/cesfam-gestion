"use client";

import { useState, useTransition, useMemo } from "react";
import { updateDemandStatus, updateDemandNotes, updateDemandObservation } from "@/app/sso/demand/actions";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  ChevronDown, ChevronUp, History, Phone, Calendar,
  Stethoscope, Search, Filter, FileEdit, Download, Eye, EyeOff,
} from "lucide-react";

// En Telesalud los estados de cierre son los mismos que en el resto del módulo
const TELESALUD_STATUS_OPTIONS = [
  "💻 Telesalud",
  "📋 Pendiente", "📞 1er Llamado", "📞📞 2do Llamado",
  "📅 Agendado", "🙅 Rechaza Atención", "📵 No Ubicable", "⛔ No Corresponde", "❌ Repetido",
];

// Una vez que el caso deja de ser Telesalud se considera cerrado en esta bandeja
const CLOSED_FROM_TELESALUD = [
  "📅 Agendado", "🙅 Rechaza Atención", "📵 No Ubicable",
  "⛔ No Corresponde", "❌ Repetido", "📋 Pendiente",
  "📞 1er Llamado", "📞📞 2do Llamado",
];

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

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "Alta": return { text: "Prioridad Alta", bg: "bg-rose-100 text-rose-700", dot: "bg-rose-500" };
    case "Media": return { text: "Prioridad Media", bg: "bg-orange-100 text-orange-700", dot: "bg-orange-500" };
    case "Baja": return { text: "Prioridad Baja", bg: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
    default: return { text: "Reciente", bg: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
  }
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

export default function TelesaludClient({ data }: { data: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPoli, setSelectedPoli] = useState("Todos");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedAge, setSelectedAge] = useState("Todos");

  const policlinicos = useMemo(
    () => ["Todos", ...Array.from(new Set(data.map((d) => normalizePoli(d.policlinic)).filter(Boolean)))],
    [data]
  );

  const filteredData = data.filter((row) => {
    if (searchTerm && !row.rut?.toLowerCase().includes(searchTerm.toLowerCase()) && !row.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (selectedPoli !== "Todos" && normalizePoli(row.policlinic) !== selectedPoli) return false;
    if (selectedAge === "Infantil" && !(row.age !== null && row.age < 5)) return false;
    if (selectedAge === "Pediatrico" && !(row.age !== null && row.age >= 5 && row.age < 15)) return false;
    if (selectedAge === "Adulto" && !(row.age !== null && row.age >= 15 && row.age < 65)) return false;
    if (selectedAge === "AdultoMayor" && !(row.age !== null && row.age >= 65)) return false;
    return true;
  });

  const handleExportExcel = () => {
    if (filteredData.length === 0) { toast.error("No hay registros para exportar"); return; }
    const exportData = filteredData.map((row) => ({
      Estado: row.status,
      RUT: row.rut,
      Paciente: row.fullName,
      Edad: row.age || "",
      Ingreso: row.requestDate ? new Date(row.requestDate).toLocaleDateString("es-CL") : "",
      Plazo: row.plazo || "",
      Policlínico: normalizePoli(row.policlinic),
      Establecimiento: row.establishment || "",
      Teléfono: row.observation || "",
      Notas: row.notes || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Telesalud");
    XLSX.writeFile(workbook, "Telesalud.xlsx");
    toast.success("Excel exportado correctamente");
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
        <div className="relative flex-1 w-full">
          <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block ml-1">Búsqueda rápida</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="RUT o Nombre del paciente..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <label className="text-[11px] font-extrabold text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Policlínico</label>
          <select className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-bold text-slate-800 shadow-sm" value={selectedPoli} onChange={(e) => setSelectedPoli(e.target.value)}>
            {policlinicos.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all ${showAdvanced ? "bg-purple-600 text-white border-purple-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            <Filter className="h-4 w-4" /> Avanzados
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white border border-emerald-600 shadow-sm hover:bg-emerald-700 transition-all">
            <Download className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-in slide-in-from-top-4 duration-300">
          <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block ml-1">Grupo de Edad</label>
          <select className="w-full max-w-xs px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-bold" value={selectedAge} onChange={(e) => setSelectedAge(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="Infantil">Lactante / Preescolar (&lt; 5 años)</option>
            <option value="Pediatrico">Escolar / Adolescente (5 - 14 años)</option>
            <option value="Adulto">Adulto (15 - 64 años)</option>
            <option value="AdultoMayor">Adulto Mayor (&gt;= 65 años)</option>
          </select>
        </div>
      )}

      {/* Contador */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-slate-200" />
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">En Telesalud</span>
          <span className="text-[11px] font-bold text-purple-600">{filteredData.length} pacientes</span>
        </div>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-purple-50 border-b border-purple-100 text-purple-700 font-semibold text-[11px] tracking-wider uppercase">
                <th className="py-4 px-4 w-28">Prioridad</th>
                <th className="py-4 px-4 w-44">Estado</th>
                <th className="py-4 px-4 w-48">Paciente</th>
                <th className="py-4 px-4 w-32">Ingreso / Plazo</th>
                <th className="py-4 px-4 w-40">Atención / Policlínico</th>
                <th className="py-4 px-4">Teléfono</th>
                <th className="py-4 px-4 w-48">Notas</th>
                <th className="py-4 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => (
                <TelesaludRow key={row.id} row={row} />
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan={8} className="py-16 text-center text-slate-500 font-medium">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">💻</span>
                    <span className="font-bold text-slate-600">Sin pacientes en Telesalud</span>
                    <span className="text-sm text-slate-400">Cuando marques un paciente como "💻 Telesalud" en Rechazos o Derivaciones, aparecerá aquí.</span>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TelesaludRow({ row }: { row: any }) {
  const [status, setStatus] = useState(row.status);
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleUpdate = (newStatus: string) => {
    setStatus(newStatus);
    startTransition(async () => {
      const res = await updateDemandStatus(row.id, newStatus);
      if (!res.success) {
        toast.error("Error al actualizar");
        setStatus(row.status); // revert
      } else {
        if (newStatus !== "💻 Telesalud") {
          toast.success(`Paciente cerrado como: ${newStatus}. Ya no aparecerá en esta bandeja.`);
        }
      }
    });
  };

  const handleUpdateNotes = async (notes: string) => {
    const res = await updateDemandNotes(row.id, notes);
    if (!res.success) toast.error("Error al actualizar notas");
    else toast.success("Notas guardadas");
  };

  const handleUpdateObservation = async (observation: string) => {
    const res = await updateDemandObservation(row.id, observation);
    if (!res.success) toast.error("Error al actualizar teléfono");
    else toast.success("Teléfono guardado");
  };

  const dynamicPriority = calculateDynamicPriority(row.requestDate);
  const badge = getPriorityBadge(dynamicPriority);

  let fechaIngreso = "N/A";
  if (row.requestDate) {
    try {
      const d = new Date(row.requestDate);
      fechaIngreso = `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
    } catch { /**/ }
  }

  if (status !== "💻 Telesalud") return null;

  return (
    <>
      <tr className="hover:bg-purple-50/40 transition-colors">
        <td className="py-4 px-4">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${badge.bg} text-[9px] font-black uppercase tracking-tighter whitespace-nowrap`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} animate-pulse`} />
            {badge.text}
          </div>
        </td>
        <td className="py-4 px-4">
          <select
            className="w-full min-w-[150px] border border-purple-200 text-[11px] rounded p-1.5 font-bold cursor-pointer bg-purple-50 hover:bg-white transition-colors focus:ring-2 focus:ring-purple-400 focus:outline-none"
            value={status}
            onChange={(e) => handleUpdate(e.target.value)}
            disabled={isPending}
          >
            {TELESALUD_STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </td>
        <td className="py-4 px-4">
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-tight">{row.fullName}</span>
            <span className="text-[11px] text-slate-500 font-medium">{row.rut} • {row.age ? `${row.age} años` : "S/I"}</span>
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold whitespace-nowrap">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              {fechaIngreso}
            </div>
            {row.plazo && (
              <span className="text-[10px] font-semibold text-slate-500 mt-0.5 ml-5">Plazo: {row.plazo}</span>
            )}
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="flex flex-col text-slate-700 font-bold">
            <span className="flex items-center gap-1 text-[11px] font-black text-purple-600">
              <Stethoscope className="h-3.5 w-3.5 shrink-0" />
              {row.attentionType || "CONTROL"}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">{normalizePoli(row.policlinic)}</span>
          </div>
        </td>
        {/* Columna Teléfono — editable */}
        <td className="py-4 px-4">
          <div className="flex items-start gap-1.5 max-w-[220px]">
            <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-1.5" />
            <textarea
              defaultValue={row.observation || ""}
              onBlur={(e) => {
                if (e.target.value !== (row.observation || "")) {
                  handleUpdateObservation(e.target.value);
                }
              }}
              rows={2}
              className="w-full px-2 py-1 text-[11px] text-slate-800 font-semibold border border-slate-200 rounded-lg hover:border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 bg-white hover:bg-slate-50 focus:bg-white transition-all shadow-sm resize-y"
              placeholder="Ingresar teléfono..."
            />
          </div>
        </td>
        {/* Columna Notas — 2 filas */}
        <td className="py-4 px-4">
          <textarea
            defaultValue={row.notes || ""}
            onBlur={(e) => {
              if (e.target.value !== (row.notes || "")) {
                handleUpdateNotes(e.target.value);
              }
            }}
            rows={2}
            className="w-full min-w-[120px] px-2 py-1.5 text-[12px] text-slate-800 font-extrabold border border-slate-300 rounded-lg hover:border-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 bg-white hover:bg-slate-50 focus:bg-white transition-all shadow-sm resize-y"
            placeholder="Añadir nota..."
          />
        </td>
        <td className="py-4 px-4 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-purple-50/30 animate-in fade-in duration-200">
          <td colSpan={8} className="p-4 border-t border-purple-100">
            <div className="flex flex-col gap-2 max-w-2xl ml-8">
              <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                <History className="h-3.5 w-3.5 text-slate-500" />
                Historial de actividad
              </h4>
              {row.auditLogs && row.auditLogs.length > 0 ? (
                <div className="space-y-1.5 mt-1 border-l-2 border-purple-200 pl-4 py-1">
                  {row.auditLogs.map((log: any, idx: number) => {
                    let formattedDate = log.timestamp;
                    try {
                      const logDate = new Date(log.timestamp);
                      formattedDate = `${String(logDate.getDate()).padStart(2, "0")}-${String(logDate.getMonth() + 1).padStart(2, "0")}-${logDate.getFullYear()} a las ${String(logDate.getHours()).padStart(2, "0")}:${String(logDate.getMinutes()).padStart(2, "0")}`;
                    } catch { /**/ }
                    return (
                      <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 shrink-0" />
                        <span className="text-slate-500 shrink-0">{formattedDate}:</span>
                        <span>{log.newValue} — por <strong className="text-slate-800">{log.changedBy || "Sistema"}</strong></span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No hay registros de actividad para este paciente.</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
