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

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action })
      });

      if (res.ok) {
        setReservations(prev => prev.filter(r => r.id !== id));
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
            {reservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <HelpCircle size={32} className="text-gray-300" />
                    <span className="font-semibold text-gray-500">No hay solicitudes pendientes</span>
                    <span className="text-xs text-gray-400">Todas las reservas han sido procesadas.</span>
                  </div>
                </td>
              </tr>
            ) : (
              reservations.map(r => (
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
