"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarRange, HelpCircle, Check, X } from 'lucide-react';

interface AdminClientProps {
  initialReservations: any[];
}

export function AdminClient({ initialReservations }: AdminClientProps) {
  const [reservations, setReservations] = useState(initialReservations);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"PENDING" | "HISTORY">("PENDING");

  const displayedReservations = reservations.filter(r => 
    activeTab === "PENDING" ? r.status === "PENDING" : r.status !== "PENDING"
  );

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED" | "CANCELLED") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action })
      });

      if (res.ok) {
        const data = await res.json();
        const reservation = data.reservation;
        
        if ((action === "APPROVED" || action === "REJECTED" || action === "CANCELLED") && reservation) {
          const startTime = new Date(reservation.startTime);
          const endTime = new Date(reservation.endTime);
          
          const formattedDate = format(startTime, "dd-MM-yyyy");
          const formattedStartTime = format(startTime, "HH:mm");
          const formattedEndTime = format(endTime, "HH:mm");
          
          const recipient = reservation.user.email || "";
          
          const actionText = action === "APPROVED" ? "Aprobada" : action === "REJECTED" ? "Rechazada" : "Cancelada";
          const subject = encodeURIComponent(`Reserva ${actionText}: ${reservation.room.name}`);
          
          const assetsList = reservation.assets && reservation.assets.length > 0
            ? reservation.assets.map((a: any) => a.asset.name).join(", ")
            : "Ninguno";
          
          const bodyLines = [
            `Estimado/a,`,
            ``,
            `Le informamos que la solicitud de Reserva de Sala ha sido ${action === "APPROVED" ? "procesada y aprobada con éxito" : action === "REJECTED" ? "rechazada" : "cancelada y la sala ha sido liberada"}.`,
            ``,
            `📋 Detalles de la Solicitud:`,
            `- Sala: ${reservation.room.name}`,
            `- Solicitante: ${reservation.user.name || "Usuario"}`,
            `- Fechas Reservadas: ${formattedDate}`,
            `- Horario: ${formattedStartTime} - ${formattedEndTime}`,
            `- Motivo: ${reservation.reason || "Sin motivo"}`,
            `- Activos Adicionales: ${assetsList}`,
            ``,
            action === "REJECTED" ? `Motivo del rechazo: [POR FAVOR INDICAR MOTIVO]` : action === "CANCELLED" ? `Motivo de la cancelación: [POR FAVOR INDICAR MOTIVO]` : "",
            (action === "REJECTED" || action === "CANCELLED") ? `` : "",
            `Saludos cordiales.`
          ];
          
          const body = encodeURIComponent(bodyLines.join("\n"));
          window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`, "_blank");
        }
        
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
      } else {
        alert("Error procesando solicitud.");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-6 px-6 pt-4 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`pb-4 text-sm font-bold transition-all border-b-2 ${
            activeTab === "PENDING" 
              ? "text-blue-600 border-blue-600" 
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          Pendientes
          <span className="ml-2 bg-blue-50 text-blue-600 py-0.5 px-2 rounded-full text-[10px]">
            {reservations.filter(r => r.status === "PENDING").length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`pb-4 text-sm font-bold transition-all border-b-2 ${
            activeTab === "HISTORY" 
              ? "text-blue-600 border-blue-600" 
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          Historial Procesado
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-gray-500">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-4">Solicitante</th>
              <th scope="col" className="px-6 py-4">Sala</th>
              <th scope="col" className="px-6 py-4">Horario</th>
              <th scope="col" className="px-6 py-4">Motivo</th>
              <th scope="col" className="px-6 py-4">Activos Extra</th>
              <th scope="col" className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-t border-gray-100">
            {displayedReservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <HelpCircle size={32} className="text-gray-300" />
                    <span className="font-semibold text-gray-500">
                      {activeTab === "PENDING" ? "No hay solicitudes pendientes" : "No hay historial disponible"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {activeTab === "PENDING" ? "Todas las reservas han sido procesadas." : "Aún no has procesado ninguna solicitud."}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              displayedReservations.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{r.userName}</div>
                    <div className="text-xs text-gray-400 font-semibold">{r.userEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                      {r.roomName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 font-bold text-gray-700">
                      <CalendarRange size={14} className="text-gray-400" />
                      {format(new Date(r.startTime), "dd/MM/yyyy")}
                    </div>
                    <div className="text-xs text-gray-400 font-semibold mt-0.5">
                      {format(new Date(r.startTime), "HH:mm")} - {format(new Date(r.endTime), "HH:mm")}
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[220px]">
                    <div className="text-gray-600 font-medium truncate" title={r.reason}>
                      {r.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {r.assets ? (
                      <span className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                        {r.assets}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Ninguno</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {activeTab === "PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <button 
                          type="button"
                          onClick={() => handleAction(r.id, "APPROVED")}
                          disabled={processing === r.id}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-emerald-100 transition-all disabled:opacity-50"
                        >
                          <Check size={14} />
                          Aprobar
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleAction(r.id, "REJECTED")}
                          disabled={processing === r.id}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition-all disabled:opacity-50"
                        >
                          <X size={14} />
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <select
                          value={r.status}
                          onChange={(e) => handleAction(r.id, e.target.value as any)}
                          disabled={processing === r.id}
                          className={`text-xs font-bold rounded-lg border px-2.5 py-1.5 outline-none transition-all cursor-pointer ${
                            r.status === "APPROVED" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-500/20" 
                              : r.status === "CANCELLED"
                              ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 focus:ring-2 focus:ring-orange-500/20"
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 focus:ring-2 focus:ring-red-500/20"
                          } disabled:opacity-50`}
                        >
                          <option value="APPROVED">✓ Aprobado</option>
                          <option value="CANCELLED">⏸ Cancelado / Suspendido</option>
                          <option value="REJECTED">✕ Rechazado</option>
                        </select>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
