"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/reservas/Calendar";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, XCircle, CalendarRange, HelpCircle } from 'lucide-react';

interface RoomSchedule {
  id: string;
  roomId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Room {
  id: string;
  name: string;
  description: string | null;
  schedules?: RoomSchedule[];
}

interface Asset {
  id: string;
  name: string;
  description: string | null;
}

interface SerializedReservation {
  id: string;
  roomId: string;
  roomName: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string;
  assets: string[];
  assetIds: string[];
}

interface ReservasClientProps {
  rooms: Room[];
  assets: Asset[];
  initialReservations: SerializedReservation[];
  userId: string;
  canReserve?: boolean;
}

export function ReservasClient({ rooms, assets, initialReservations, userId, canReserve = false }: ReservasClientProps) {
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.id || "");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [timeOptions, setTimeOptions] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [busyAssetIds, setBusyAssetIds] = useState<string[]>([]);
  const [calendarKey, setCalendarKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const selectedRoomObj = rooms.find((r: any) => r.id === selectedRoom);
    if (!selectedRoomObj || !selectedRoomObj.schedules || selectedRoomObj.schedules.length === 0) {
      setTimeOptions([]);
      return;
    }

    let day = selectedDate ? selectedDate.getDay() : 1; // Default to Monday
    let daySchedules = selectedRoomObj.schedules.filter((s: any) => s.dayOfWeek === day);

    if (daySchedules.length === 0) {
      daySchedules = selectedRoomObj.schedules;
    }

    if (daySchedules.length > 0) {
      const options: string[] = [];
      daySchedules.forEach((schedule: any) => {
        let [sH, sM] = schedule.startTime.split(':').map(Number);
        let [eH, eM] = schedule.endTime.split(':').map(Number);
        
        let currentH = sH;
        let currentM = sM;
        
        while (currentH < eH || (currentH === eH && currentM <= eM)) {
          if (currentM === 0) {
            options.push(`${currentH.toString().padStart(2, '0')}:00`);
          }
          currentM += 30;
          if (currentM >= 60) {
            currentM -= 60;
            currentH += 1;
          }
        }
      });

      const uniqueOptions = Array.from(new Set(options)).sort();
      setTimeOptions(uniqueOptions);

      setStartTime(prev => uniqueOptions.includes(prev) ? prev : uniqueOptions[0] || "08:00");
      setEndTime(prev => uniqueOptions.includes(prev) ? prev : (uniqueOptions[1] || uniqueOptions[0] || "09:00"));
    } else {
      setTimeOptions([]);
    }
  }, [selectedRoom, selectedDate, rooms]);

  // Pre-calculate reservation timestamps to avoid creating Date objects repeatedly in loops
  const parsedReservations = useMemo(() => {
    return initialReservations.map((r: any) => ({
      ...r,
      startTimeMs: new Date(r.startTime).getTime(),
      endTimeMs: new Date(r.endTime).getTime()
    }));
  }, [initialReservations]);

  useEffect(() => {
    if (!selectedDate || !startTime || !endTime) {
      setBusyAssetIds([]);
      return;
    }

    const startDateTime = new Date(selectedDate);
    const [startH, startM] = startTime.split(":");
    startDateTime.setHours(parseInt(startH), parseInt(startM));

    const endDateTime = new Date(selectedDate);
    const [endH, endM] = endTime.split(":");
    endDateTime.setHours(parseInt(endH), parseInt(endM));

    const startMs = startDateTime.getTime();
    const endMs = endDateTime.getTime();

    const busy = new Set<string>();

    parsedReservations.forEach((r: any) => {
      if (r.status === 'REJECTED') return;

      // Check overlap using pre-calculated numerical timestamps (extremely fast)
      if (r.startTimeMs < endMs && r.endTimeMs > startMs) {
        if (r.assetIds) {
          r.assetIds.forEach((id: string) => busy.add(id));
        }
      }
    });

    setBusyAssetIds(Array.from(busy));
  }, [selectedDate, startTime, endTime, parsedReservations]);

  const filteredReservations = initialReservations.filter((r: any) => r.roomId === selectedRoom);

  const handleAssetChange = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setMessage("Error: Por favor selecciona una fecha en el calendario.");
      return;
    }
    
    setLoading(true);
    setMessage("");

    try {
      const startDateTime = new Date(selectedDate);
      const [startH, startM] = startTime.split(":");
      startDateTime.setHours(parseInt(startH), parseInt(startM));

      const endDateTime = new Date(selectedDate);
      const [endH, endM] = endTime.split(":");
      endDateTime.setHours(parseInt(endH), parseInt(endM));

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          assetIds: selectedAssets,
          reason
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Solicitud enviada con éxito. Esperando aprobación.");
        setReason(""); 
        setSelectedAssets([]); 
        setSelectedDate(null);
        setCalendarKey(prev => prev + 1);
        if (timeOptions.length > 1) {
          setStartTime(timeOptions[0]);
          setEndTime(timeOptions[1]);
        }
        router.refresh();
      } else {
        setMessage("Error: " + (data.message || "Error al solicitar sala."));
      }
    } catch (err) {
      setMessage("Error: Conexión fallida.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Room Selector & Calendar */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Selecciona una Sala</h2>
          <div className="flex flex-wrap gap-2">
            {rooms.map((room: any) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoom(room.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm
                  ${selectedRoom === room.id 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {room.name}
              </button>
            ))}
          </div>
        </div>

        <Calendar 
          key={calendarKey}
          reservations={filteredReservations} 
          onDateSelect={setSelectedDate} 
        />
      </div>

      {/* Right Column: Reservation Form & Details */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Solicitar Reserva</h2>
          
          {message && (
            <div className={`p-4 mb-6 rounded-xl text-sm font-medium border
              ${message.startsWith('Error') 
                ? 'bg-red-50 border-red-100 text-red-700' 
                : 'bg-emerald-50 border-emerald-100 text-emerald-700'
              }
            `}>
              {message}
            </div>
          )}

          {canReserve ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Fecha Seleccionada</label>
                <div className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-700 font-semibold text-sm flex items-center gap-2">
                  <CalendarRange size={16} className="text-gray-400" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecciona una fecha en el calendario"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Motivo de la Reserva</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-700 text-sm placeholder-gray-400 outline-none transition-all" 
                  placeholder="Ej. Reunión de equipo, Capacitación de personal..." 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  required 
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hora Inicio</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-700 text-sm outline-none transition-all bg-white"
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)} 
                    required
                  >
                    {timeOptions.map(t => <option key={`start-${t}`} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hora Fin</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-700 text-sm outline-none transition-all bg-white"
                    value={endTime} 
                    onChange={e => setEndTime(e.target.value)} 
                    required
                  >
                    {timeOptions.map(t => <option key={`end-${t}`} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Activos Requeridos (Opcional)</label>
                <div className="flex flex-col gap-3.5 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  {assets.map((asset: any) => {
                    const selectedRoomObj = rooms.find((r: any) => r.id === selectedRoom);
                    const isCapacitacion = selectedRoomObj?.name.toLowerCase().includes("capacitación") || selectedRoomObj?.name.toLowerCase().includes("capacitacion");
                    const isIncludedInRoom = isCapacitacion && (asset.name.toLowerCase().includes("data") || asset.name.toLowerCase().includes("telón") || asset.name.toLowerCase().includes("telon"));
                    const isAssetBusy = busyAssetIds.includes(asset.id);
                    const isAssetDisabled = isIncludedInRoom || isAssetBusy;

                    return (
                      <label 
                        key={asset.id} 
                        className={`flex items-center gap-3 text-sm font-semibold select-none
                          ${isAssetDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 cursor-pointer'}
                        `}
                      >
                        <input 
                          type="checkbox" 
                          className="w-4.5 h-4.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={isIncludedInRoom ? true : (isAssetBusy ? false : selectedAssets.includes(asset.id))}
                          disabled={isAssetDisabled}
                          onChange={() => handleAssetChange(asset.id)}
                        />
                        <span className="flex-1">{asset.name}</span>
                        {isIncludedInRoom && <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Ya en sala</span>}
                        {isAssetBusy && !isIncludedInRoom && <span className="text-[10px] bg-red-50 border border-red-100 text-red-500 px-2 py-0.5 rounded-full font-bold">Ocupado</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              <button 
                type="submit" 
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-sm transition-all duration-200
                  ${loading || !selectedDate
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                  }
                `} 
                disabled={loading || !selectedDate}
              >
                {loading ? "Procesando..." : "Enviar Solicitud"}
              </button>
            </form>
          ) : (
            <div className="text-center py-10 px-6 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                <Clock size={24} />
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">Solo Lectura</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                No tienes permisos para solicitar nuevas reservas. Puedes visualizar la disponibilidad de las salas en el calendario de la izquierda.
              </p>
            </div>
          )}
        </div>

        {/* Reservation details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4">
            {selectedDate 
              ? `Reservas para el ${format(selectedDate, "dd/MM/yyyy")}` 
              : `Próximas reservas en la sala`}
          </h3>
          
          {(() => {
            const displayReservations = selectedDate 
              ? filteredReservations.filter((r: any) => r.date.startsWith(format(selectedDate, "yyyy-MM-dd")))
              : filteredReservations.slice(0, 5);

            return displayReservations.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {displayReservations.map((r: any) => (
                  <li key={r.id} className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl gap-3 transition-colors">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-blue-600 mb-1">
                        {!selectedDate && <span className="text-gray-400 font-semibold mr-1.5">{format(new Date(r.startTime), "dd/MM")}</span>}
                        {format(new Date(r.startTime), "HH:mm")} - {format(new Date(r.endTime), "HH:mm")}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">{r.userName}</span>
                        <span className="text-gray-300">|</span>
                        <span className="truncate max-w-[200px]" title={r.reason}>{r.reason}</span>
                      </div>
                    </div>
                    <span 
                      className="flex-shrink-0 cursor-help" 
                      title={r.status === 'APPROVED' ? 'Aprobada' : r.status === 'PENDING' ? 'Pendiente' : 'Rechazada'}
                    >
                      {r.status === 'APPROVED' && <CheckCircle size={20} className="text-emerald-500" />}
                      {r.status === 'PENDING' && <Clock size={20} className="text-amber-500" />}
                      {r.status === 'REJECTED' && <XCircle size={20} className="text-red-500" />}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                <HelpCircle size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No hay reservas para mostrar.</p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
