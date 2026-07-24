"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Search, ChevronRight, CheckCircle2, Clock, Calendar, RefreshCcw } from "lucide-react";
import { getPatientsByBlock, getPatientSearch, updatePatientStatus, getReprogramadores, assignBlock } from "@/app/reprogramacion/actions";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function ReproClient({
  initialActiveBlocks,
  initialHistoryBlocks,
  userRole,
  userEmail,
  userName,
}: {
  initialActiveBlocks: any[];
  initialHistoryBlocks: any[];
  userRole: string;
  userEmail: string;
  userName: string;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [activeBlocks, setActiveBlocks] = useState(initialActiveBlocks);
  const [historyBlocks, setHistoryBlocks] = useState(initialHistoryBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [reprogramadores, setReprogramadores] = useState<{email: string, name: string | null}[]>([]);

  const isAdmin = userRole === "admin" || userRole === "ADMIN" || userRole === "COORDINADOR";

  useEffect(() => {
    if (isAdmin) {
      getReprogramadores().then(res => {
        if (res.success && res.data) setReprogramadores(res.data);
      });
    }
  }, [isAdmin]);

  const handleAssign = async (e: any, blockId: number, email: string) => {
    e.stopPropagation();
    const t = toast.loading("Asignando...");
    try {
      const res = await assignBlock(blockId, email);
      if (res.success) {
        toast.success("Asignado exitosamente", { id: t });
        setActiveBlocks(prev => prev.map(b => b.id === blockId ? { ...b, AsignadoA: email } : b));
      } else {
        toast.error("Error al asignar", { id: t });
      }
    } catch {
      toast.error("Error de conexión", { id: t });
    }
  };

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
    { name: isAdmin ? "Gestión Operativa" : "Bandeja de Entrada", id: 0 },
    { name: "Historial de Auditoría", id: 1 },
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
            blocks={activeBlocks.filter((b: any) => {
              if (b.Resueltos >= b["Total Afectados"]) return false;
              if (!isAdmin) {
                return b.AsignadoA === userEmail || b.AsignadoA === userName;
              }
              return true;
            })}
            selectedBlockId={selectedBlockId}
            onSelectBlock={loadPatients}
            onBack={() => setSelectedBlockId(null)}
            patients={patients}
            loading={loadingPatients}
            onUpdatePatient={handlePatientUpdate}
            showResolved={showResolved}
            setShowResolved={setShowResolved}
            isAdmin={isAdmin}
            handleAssign={handleAssign}
            reprogramadores={reprogramadores}
          />
        )}
        {activeTab === 1 && <HistoryTab blocks={historyBlocks} />}
      </div>
    </div>
  );
}

function GestionTab({ blocks, selectedBlockId, onSelectBlock, onBack, patients, loading, onUpdatePatient, showResolved, setShowResolved, isAdmin, handleAssign, reprogramadores }: any) {
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [subFilter, setSubFilter] = useState<"unassigned" | "assigned">("unassigned");

  const unassignedBlocks = blocks.filter((b: any) => b.AsignadoA === "Sin asignar" || !b.AsignadoA);
  const assignedBlocks = blocks.filter((b: any) => b.AsignadoA && b.AsignadoA !== "Sin asignar");

  const displayedBlocks = isAdmin
    ? (subFilter === "unassigned" ? unassignedBlocks : assignedBlocks)
    : blocks;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    const t = toast.loading("Buscando paciente...");
    const res = await getPatientSearch(globalSearch);
    if (res.success && res.data) {
      setSearchResults(res.data);
      if (res.data.length === 0) toast.error("No se encontró al paciente", { id: t });
      else toast.success(`Se encontraron ${res.data.length} paciente(s)`, { id: t });
    } else {
      toast.error("Error al realizar la búsqueda", { id: t });
    }
  };

  if (selectedBlockId) {
    const currentBlock = blocks.find((b: any) => b.id === selectedBlockId);
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            ← Volver a la lista
          </button>
          {currentBlock && (
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block uppercase">Profesional Afectado</span>
              <span className="text-sm font-bold text-slate-800">{currentBlock.Profesional}</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              👥 Pacientes del Bloqueo ({patients.length})
            </h3>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Mostrar también resueltos
            </label>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm animate-pulse font-medium">
              Cargando pacientes del bloqueo...
            </div>
          ) : patients.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm font-medium">
              No hay pacientes registrados en este bloqueo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">RUT</th>
                    <th className="px-4 py-3">Nombre Paciente</th>
                    <th className="px-4 py-3">Fecha Citación</th>
                    <th className="px-4 py-3">Teléfonos</th>
                    <th className="px-4 py-3">Solución / Obs.</th>
                    <th className="px-4 py-3 w-48">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.filter((p: any) => showResolved || !["Reprogramado", "Avisado - Sin Cupo", "No ubicable"].includes(p.Estado)).map((p: any) => (
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
                          className="w-full px-2 py-1 text-xs text-slate-800 font-semibold border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-0 bg-transparent"
                          placeholder="Añadir nota..."
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={p.Estado}
                          onChange={(e) => onUpdatePatient(p.id, e.target.value, p.Solucion || "")}
                          className={cn(
                            "w-full px-2 py-1.5 text-xs font-bold rounded-lg border outline-none cursor-pointer transition-colors",
                            p.Estado === "Reprogramado" ? "bg-emerald-50 border-emerald-300 text-emerald-700" :
                            p.Estado === "Avisado - Sin Cupo" ? "bg-amber-50 border-amber-300 text-amber-700" :
                            p.Estado === "No ubicable" ? "bg-rose-50 border-rose-300 text-rose-700" :
                            "bg-slate-50 border-slate-200 text-slate-700"
                          )}
                        >
                          <option value="Pendiente">🟡 Pendiente</option>
                          <option value="Reprogramado">🟢 Reprogramado</option>
                          <option value="Avisado - Sin Cupo">🟠 Avisado - Sin Cupo</option>
                          <option value="No ubicable">🔴 No ubicable</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">🔎 Búsqueda Rápida en Ventanilla</h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Ej. 12345678-9 o Juan Pérez..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 text-xs">
            Buscar
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
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
        {isAdmin ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              📋 Bloqueos Operativos
            </h3>
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSubFilter("unassigned")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                  subFilter === "unassigned"
                    ? "bg-white text-rose-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                Sin Asignar ({unassignedBlocks.length})
              </button>
              <button
                type="button"
                onClick={() => setSubFilter("assigned")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                  subFilter === "assigned"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                En Proceso / Asignados ({assignedBlocks.length})
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              📋 Mi Bandeja de Entrada ({displayedBlocks.length})
            </h3>
          </div>
        )}

        {displayedBlocks.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">
              {isAdmin
                ? subFilter === "unassigned"
                  ? "¡Excelente! No hay bloqueos pendientes por asignar."
                  : "No hay bloqueos actualmente en proceso."
                : "¡Excelente! Tu bandeja de entrada está al día."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {displayedBlocks.map((b: any) => (
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
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Avance</p>
                    <p className="font-mono font-bold text-slate-700">{b.Resueltos} / {b["Total Afectados"]}</p>
                  </div>
                  {isAdmin && (
                    <AssigneeSelect
                      currentAssigned={b.AsignadoA || "Sin asignar"}
                      blockId={b.id}
                      reprogramadores={reprogramadores}
                      handleAssign={handleAssign}
                    />
                  )}
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
  const [expandedBlockId, setExpandedBlockId] = useState<number | null>(null);
  const [blockPatients, setBlockPatients] = useState<Record<number, any[]>>({});
  const [loadingPatients, setLoadingPatients] = useState<Record<number, boolean>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const toggleExpand = async (blockId: number) => {
    if (expandedBlockId === blockId) {
      setExpandedBlockId(null);
      return;
    }
    setExpandedBlockId(blockId);

    if (!blockPatients[blockId]) {
      setLoadingPatients((prev) => ({ ...prev, [blockId]: true }));
      const res = await getPatientsByBlock(blockId);
      if (res.success && res.data) {
        setBlockPatients((prev) => ({ ...prev, [blockId]: res.data }));
      }
      setLoadingPatients((prev) => ({ ...prev, [blockId]: false }));
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    const res = await getPatientSearch(searchQuery);
    if (res.success && res.data) {
      setSearchResults(res.data);
      if (res.data.length === 0) {
        toast.error("No se encontraron resultados en el historial");
      } else {
        toast.success(`Se encontraron ${res.data.length} paciente(s)`);
      }
    } else {
      toast.error("Error al buscar en el historial");
    }
    setIsSearching(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Registro Histórico Completo
          </h3>
          <p className="text-sm text-slate-600">Haz clic en cualquier bloqueo para desplegar el detalle de sus pacientes.</p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) setSearchResults(null);
              }}
              placeholder="Buscar por RUT o Nombre..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {isSearching ? "..." : "Buscar"}
          </button>
          {searchResults !== null && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults(null);
              }}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {searchResults !== null ? (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Resultados de búsqueda ({searchResults.length})
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">RUT</th>
                  <th className="px-4 py-3">Nombre Paciente</th>
                  <th className="px-4 py-3">Profesional Bloqueado</th>
                  <th className="px-4 py-3">Fecha Citación</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Solución / Observación</th>
                  <th className="px-4 py-3">Gestor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {searchResults.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-700">{p.RUT}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.Nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{p.Profesional_Bloqueo}</td>
                    <td className="px-4 py-3 text-slate-600">{p.Fecha_Citacion}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-md uppercase",
                        p.Estado === "Reprogramado" ? "bg-emerald-100 text-emerald-800" :
                        p.Estado === "Avisado - Sin Cupo" ? "bg-amber-100 text-amber-800" :
                        p.Estado === "No ubicable" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"
                      )}>
                        {p.Estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={p.Solucion || "-"}>
                      {p.Solucion || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {p.Ultimo_Gestor || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Fecha Carga</th>
                <th className="px-4 py-3">Gestor a cargo</th>
                <th className="px-4 py-3">Profesional</th>
                <th className="px-4 py-3">Fecha Bloqueo</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Avance</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {blocks.map((b: any) => {
                const isDone = b.Resueltos >= b["Total Afectados"] && b["Total Afectados"] > 0;
                const isExpanded = expandedBlockId === b.id;
                const patientsList = blockPatients[b.id] || [];
                const isLoading = loadingPatients[b.id];

                return (
                  <React.Fragment key={b.id}>
                    <tr
                      onClick={() => toggleExpand(b.id)}
                      className={cn("hover:bg-slate-50 cursor-pointer transition-colors", isExpanded && "bg-slate-50/80")}
                    >
                      <td className="px-4 py-3 text-slate-400">
                        <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90 text-blue-600")} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{b["Fecha Subida"]}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium truncate max-w-[140px]" title={b["Subido Por"]}>
                        {b["Subido Por"]}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 truncate max-w-[150px]" title={b.Profesional}>
                        {b.Profesional}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{b["Fecha Bloqueo"]}</td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-[160px]" title={b.Motivo}>
                        {b.Motivo}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {b.Resueltos} / {b["Total Afectados"]}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md",
                          isDone ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                          {isDone ? "Completado" : `Pendiente (${b.Resueltos}/${b["Total Afectados"]})`}
                        </span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/50 border-y border-slate-200">
                        <td colSpan={8} className="p-4 pl-12">
                          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                👥 Pacientes del Bloqueo ({patientsList.length})
                              </h4>
                              {isLoading && <span className="text-xs text-blue-600 font-medium animate-pulse">Cargando detalle de pacientes...</span>}
                            </div>

                            {!isLoading && patientsList.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-2">No hay información de pacientes para este bloqueo.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                      <th className="px-3 py-2">RUT</th>
                                      <th className="px-3 py-2">Nombre Paciente</th>
                                      <th className="px-3 py-2">Fecha Citación</th>
                                      <th className="px-3 py-2">Teléfonos</th>
                                      <th className="px-3 py-2">Estado Final</th>
                                      <th className="px-3 py-2">Solución / Nota</th>
                                      <th className="px-3 py-2">Última Modificación</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {patientsList.map((p: any) => (
                                      <tr key={p.id} className="hover:bg-slate-50/80">
                                        <td className="px-3 py-2 font-mono font-semibold text-slate-700">{p.RUT}</td>
                                        <td className="px-3 py-2 font-medium text-slate-800">{p.Nombre}</td>
                                        <td className="px-3 py-2 text-slate-600">{p.Fecha_Atencion} ({p.Tipo})</td>
                                        <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">{p.Telefonos || "-"}</td>
                                        <td className="px-3 py-2">
                                          <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-md uppercase",
                                            p.Estado === "Reprogramado" ? "bg-emerald-100 text-emerald-800" :
                                            p.Estado === "Avisado - Sin Cupo" ? "bg-amber-100 text-amber-800" :
                                            p.Estado === "No ubicable" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"
                                          )}>
                                            {p.Estado}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-slate-700 max-w-[200px] truncate" title={p.Solucion || "-"}>
                                          {p.Solucion || <span className="text-slate-400 italic">Sin nota</span>}
                                        </td>
                                        <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">
                                          {p.Fecha_Actualizacion ? `${p.Fecha_Actualizacion} (${p.Ultimo_Gestor || 'Sistema'})` : "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AssigneeSelect({
  currentAssigned,
  blockId,
  reprogramadores,
  handleAssign,
}: {
  currentAssigned: string;
  blockId: number;
  reprogramadores: { email: string; name: string | null }[];
  handleAssign: (e: any, blockId: number, email: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const currentRep = reprogramadores?.find(
    (r) => r.email === currentAssigned || r.name === currentAssigned
  );
  const displayName = currentRep?.name || (currentAssigned !== "Sin asignar" ? currentAssigned : "Sin Asignar");

  const filtered = (reprogramadores || []).filter((r) => {
    const text = `${r.name || ""} ${r.email}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="relative flex flex-col items-end" onClick={(e) => e.stopPropagation()}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Asignado a</p>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 max-w-[160px] truncate shadow-sm"
      >
        <span className="truncate">{displayName}</span>
        <ChevronRight className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", isOpen && "rotate-90")} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Escribe para buscar..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-50">
            <button
              type="button"
              onClick={(e) => {
                handleAssign(e, blockId, "unassign");
                setIsOpen(false);
                setSearch("");
              }}
              className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors"
            >
              🚫 Sin Asignar
            </button>

            {filtered.map((r) => (
              <button
                key={r.email}
                type="button"
                onClick={(e) => {
                  handleAssign(e, blockId, r.email);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors flex flex-col",
                  currentAssigned === r.email || currentAssigned === r.name
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "hover:bg-slate-100 text-slate-700"
                )}
              >
                <span className="font-semibold">{r.name || r.email}</span>
                <span className="text-[10px] text-slate-400 font-mono truncate">{r.email}</span>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="text-[11px] text-slate-400 text-center py-2 italic">Sin coincidencias</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
