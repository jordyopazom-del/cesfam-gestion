"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Search, UploadCloud, ChevronRight, CheckCircle2, Clock, Calendar, RefreshCcw } from "lucide-react";
import { getPatientsByBlock, getPatientSearch, updatePatientStatus, uploadRASPdf } from "@/app/sso/reprogramacion/actions";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function ReproClient({
  initialActiveBlocks,
  initialHistoryBlocks,
  userRole,
}: {
  initialActiveBlocks: any[];
  initialHistoryBlocks: any[];
  userRole: string;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [activeBlocks, setActiveBlocks] = useState(initialActiveBlocks);
  const [historyBlocks, setHistoryBlocks] = useState(initialHistoryBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const loadPatients = async (blockId: number) => {
    setSelectedBlockId(blockId);
    setLoadingPatients(true);
    const res = await getPatientsByBlock(blockId);
    if (res.success && res.data) setPatients(res.data);
    else toast.error("Error al cargar pacientes");
    setLoadingPatients(false);
  };

  const handlePatientUpdate = async (patientId: number, status: string, solution: string) => {
    const res = await updatePatientStatus(patientId, status, solution);
    if (res.success) {
      toast.success("Paciente actualizado");
      if (selectedBlockId) loadPatients(selectedBlockId);
    } else {
      toast.error(res.error || "Error al actualizar");
    }
  };

  const tabs = [
    { name: "Gestión Operativa", id: 0 },
    ...(userRole === "admin"
      ? [
          { name: "Historial de Auditoría", id: 1 },
          { name: "Subir Reporte RAS", id: 2 },
        ]
      : []),
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[70vh]">
      <div className="flex border-b border-slate-200 bg-slate-50/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-4 text-sm font-semibold transition-colors relative",
              activeTab === tab.id ? "text-blue-600 bg-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            {tab.name}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 0 && (
          <GestionTab
            blocks={activeBlocks.filter((b: any) => b.Resueltos < b["Total Afectados"])}
            selectedBlockId={selectedBlockId}
            onSelectBlock={loadPatients}
            onBack={() => setSelectedBlockId(null)}
            patients={patients}
            loading={loadingPatients}
            onUpdatePatient={handlePatientUpdate}
          />
        )}
        {activeTab === 1 && <HistoryTab blocks={historyBlocks} />}
        {activeTab === 2 && <UploadTab />}
      </div>
    </div>
  );
}

function GestionTab({ blocks, selectedBlockId, onSelectBlock, onBack, patients, loading, onUpdatePatient }: any) {
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    const t = toast.loading("Buscando paciente...");
    const res = await getPatientSearch(globalSearch);
    if (res.success && res.data) {
      setSearchResults(res.data);
      if (res.data.length === 0) toast.error("No se encontró al paciente", { id: t });
      else toast.success(`Se encontraron ${res.data.length} registros`, { id: t });
    } else {
      toast.error("Error al buscar", { id: t });
    }
  };

  if (selectedBlockId !== null) {
    const block = blocks.find((b: any) => b.id === selectedBlockId);
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
          >
            ⬅ Volver a Bandeja
          </button>
          <div className="text-right">
            <h3 className="text-xl font-bold text-slate-800">Afectados: {block?.Profesional}</h3>
            <p className="text-sm text-slate-500">Fecha Bloqueo: {block?.["Fecha Bloqueo"]}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCcw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">RUT</th>
                  <th className="px-4 py-3">Nombre Paciente</th>
                  <th className="px-4 py-3">Fecha Citación</th>
                  <th className="px-4 py-3">Teléfonos</th>
                  <th className="px-4 py-3">Solución / Obs.</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-slate-600">{p.RUT}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.Nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{p.Fecha_Atencion}</td>
                    <td className="px-4 py-3 text-slate-600">{p.Telefonos}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={p.Solucion || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (p.Solucion || "")) onUpdatePatient(p.id, p.Estado, e.target.value);
                        }}
                        className="w-full px-2 py-1 text-sm border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-0 bg-transparent"
                        placeholder="Añadir nota..."
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={p.Estado || "Pendiente"}
                        onChange={(e) => onUpdatePatient(p.id, e.target.value, p.Solucion || "")}
                        className={cn(
                          "px-2 py-1 text-xs font-bold rounded-full border-0 cursor-pointer outline-none ring-1 ring-inset",
                          p.Estado === "Reprogramado" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
                          p.Estado === "Avisado - Sin Cupo" ? "bg-amber-50 text-amber-700 ring-amber-200" :
                          p.Estado === "No ubicable" ? "bg-red-50 text-red-700 ring-red-200" :
                          p.Estado?.includes("llamado") ? "bg-blue-50 text-blue-700 ring-blue-200" :
                          "bg-slate-100 text-slate-600 ring-slate-200"
                        )}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="1er llamado">1er llamado</option>
                        <option value="2do llamado">2do llamado</option>
                        <option value="Avisado - Sin Cupo">Avisado - Sin Cupo</option>
                        <option value="Reprogramado">Reprogramado</option>
                        <option value="No ubicable">No ubicable</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">🔎 Búsqueda Rápida en Ventanilla</h3>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Ej. 12345678-9 o Juan Pérez..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
            Buscar
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">RUT</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Profesional</th>
                  <th className="px-4 py-3">Cita Original</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Nota SOME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {searchResults.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-600">{p.RUT}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.Nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{p.Profesional_Bloqueo}</td>
                    <td className="px-4 py-3 text-slate-600">{p.Fecha_Citacion}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{p.Estado}</td>
                    <td className="px-4 py-3 text-slate-500">{p.Solucion || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">📋 Bloqueos Pendientes ({blocks.length})</h3>
        {blocks.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">¡Excelente! No hay bloqueos pendientes.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {blocks.map((b: any) => (
              <div
                key={b.id}
                onClick={() => onSelectBlock(b.id)}
                className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{b.Profesional}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> Bloqueo el {b["Fecha Bloqueo"]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Avance</p>
                    <p className="font-mono font-bold text-slate-700">{b.Resueltos} / {b["Total Afectados"]}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryTab({ blocks }: { blocks: any[] }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Registro Histórico Completo
        </h3>
        <p className="text-sm text-slate-600">Todos los bloqueos procesados y sus resoluciones.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Fecha Carga</th>
              <th className="px-4 py-3">Gestor a cargo</th>
              <th className="px-4 py-3">Profesional</th>
              <th className="px-4 py-3">Fecha Bloqueo</th>
              <th className="px-4 py-3">Motivo</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {blocks.map((b: any) => {
              const isDone = b.Resueltos >= b["Total Afectados"] && b["Total Afectados"] > 0;
              return (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{b["Fecha Subida"]}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{b["Subido Por"]}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{b.Profesional}</td>
                  <td className="px-4 py-3 text-slate-600">{b["Fecha Bloqueo"]}</td>
                  <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{b.Motivo}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md",
                      isDone ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                      {isDone ? "Completado" : `Pendiente (${b.Resueltos}/${b["Total Afectados"]})`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UploadTab() {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    if (!file || file.size === 0) return toast.error("Selecciona un archivo PDF");

    setLoading(true);
    const t = toast.loading("Procesando documento PDF de RAS...");
    try {
      const res = await uploadRASPdf(formData);
      if (res.success) {
        toast.success(`Leído con éxito: ${res.professionalName} (${res.patientCount} pacientes)`, { id: t });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error(res.error || "Fallo en el procesamiento del PDF", { id: t });
      }
    } catch {
      toast.error("Error de servidor", { id: t });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in fade-in duration-300">
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-sm border border-blue-100">
          <UploadCloud className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Subir Reporte RAS Valdivia</h2>
        <p className="text-slate-500 mt-2">
          Sube el PDF de <strong>Detalle de Horas Bloqueadas</strong> generado en la plataforma RAS para distribuirlo al SOME automáticamente.
        </p>
      </div>
      <form onSubmit={handleUpload} className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center transition-all hover:bg-slate-100 hover:border-blue-400">
        <input
          type="file"
          name="file"
          accept=".pdf"
          required
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:transition-colors file:cursor-pointer cursor-pointer mb-6"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all disabled:opacity-50"
        >
          {loading ? "Analizando e Insertando..." : "Analizar y Procesar Documento"}
        </button>
      </form>
    </div>
  );
}
