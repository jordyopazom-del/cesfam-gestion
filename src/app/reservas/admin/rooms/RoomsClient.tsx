"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Calendar, Clock, Sparkles } from 'lucide-react';

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface RoomsClientProps {
  initialRooms: any[];
}

export function RoomsClient({ initialRooms }: RoomsClientProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState(initialRooms);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schedules, setSchedules] = useState<{dayOfWeek: number, startTime: string, endTime: string}[]>([
    { dayOfWeek: 1, startTime: "08:00", endTime: "18:00" }
  ]);
  const [loading, setLoading] = useState(false);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/assets')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setAllAssets(data);
      })
      .catch(console.error);
  }, []);

  const addSchedule = () => setSchedules([...schedules, { dayOfWeek: 1, startTime: "08:00", endTime: "18:00" }]);
  
  const updateSchedule = (index: number, field: string, value: string | number) => {
    const newS = [...schedules];
    (newS[index] as any)[field] = value;
    setSchedules(newS);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleEdit = (room: any) => {
    setEditingRoomId(room.id);
    setName(room.name);
    setDescription(room.description || "");
    setSchedules(room.schedules.map((s: any) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime
    })));
    setSelectedAssetIds(room.assets ? room.assets.map((a: any) => a.id) : []);
  };

  const handleCancelEdit = () => {
    setEditingRoomId(null);
    setName("");
    setDescription("");
    setSchedules([{ dayOfWeek: 1, startTime: "08:00", endTime: "18:00" }]);
    setSelectedAssetIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isEditing = !!editingRoomId;
    const url = isEditing ? `/api/admin/rooms/${editingRoomId}` : "/api/admin/rooms";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, schedules, assetIds: selectedAssetIds })
      });

      if (res.ok) {
        alert(isEditing ? "Sala actualizada exitosamente" : "Sala creada exitosamente");
        window.location.reload();
      } else {
        alert(isEditing ? "Error al actualizar la sala" : "Error al crear la sala");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta sala? Se perderán todas sus reservas.")) return;
    
    try {
      const res = await fetch(`/api/admin/rooms/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRooms(rooms.filter(r => r.id !== id));
      }
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Form to create/edit room */}
      <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 height-fit">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Sparkles size={18} className="text-blue-500" />
          {editingRoomId ? "Editar Sala" : "Nueva Sala"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nombre de la Sala</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-700 text-sm placeholder-gray-400 outline-none transition-all"
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              placeholder="Ej. Sala de Capacitación"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
            <textarea 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-700 text-sm placeholder-gray-400 outline-none transition-all"
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Ej. Equipado con proyector y aire acondicionado"
              rows={2}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Horarios Permitidos</label>
              <button 
                type="button" 
                onClick={addSchedule} 
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs rounded-lg border border-gray-200 transition-all"
              >
                <Plus size={12} />
                Añadir Horario
              </button>
            </div>
            
            <div className="space-y-2.5">
              {schedules.map((s, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  <div className="col-span-5">
                    <select 
                      className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 bg-white outline-none"
                      value={s.dayOfWeek} 
                      onChange={e => updateSchedule(idx, 'dayOfWeek', parseInt(e.target.value))}
                    >
                      {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input 
                      type="time" 
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 bg-white outline-none"
                      value={s.startTime} 
                      onChange={e => updateSchedule(idx, 'startTime', e.target.value)} 
                    />
                  </div>
                  <div className="col-span-3">
                    <input 
                      type="time" 
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 bg-white outline-none"
                      value={s.endTime} 
                      onChange={e => updateSchedule(idx, 'endTime', e.target.value)} 
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button 
                      type="button" 
                      onClick={() => removeSchedule(idx)} 
                      className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {allAssets.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Activos Fijos en la Sala</label>
              <div className="flex flex-col gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                {allAssets.map(asset => (
                  <label key={asset.id} className="flex items-center gap-3 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={selectedAssetIds.includes(asset.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssetIds([...selectedAssetIds, asset.id]);
                        } else {
                          setSelectedAssetIds(selectedAssetIds.filter(id => id !== asset.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    {asset.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button 
              type="submit" 
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-sm transition-all duration-200
                ${loading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                }
              `}
              disabled={loading}
            >
              {loading ? "Guardando..." : (editingRoomId ? "Actualizar Sala" : "Guardar Sala")}
            </button>
            {editingRoomId && (
              <button 
                type="button" 
                onClick={handleCancelEdit}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                disabled={loading}
              >
                Cancelar Edición
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Column: List of existing rooms */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gray-800">Salas Existentes</h2>
        {rooms.map(room => (
          <div key={room.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-800">{room.name}</h3>
                {room.description && (
                  <p className="text-xs text-gray-400 mt-1 font-semibold">{room.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => handleEdit(room)} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-blue-50 text-blue-600 font-bold text-xs rounded-xl border border-blue-100 transition-all"
                >
                  Editar
                </button>
                <button 
                  type="button"
                  onClick={() => handleDelete(room.id)} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl border border-red-100 transition-all"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <strong className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Horarios Configurados</strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {room.schedules && room.schedules.length > 0 ? room.schedules.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white border border-gray-100 px-3 py-2 rounded-xl">
                    <Calendar size={12} className="text-gray-400" />
                    <span>{DAYS[s.dayOfWeek]}:</span>
                    <Clock size={12} className="text-gray-400 ml-1" />
                    <span>{s.startTime} - {s.endTime}</span>
                  </div>
                )) : (
                  <span className="text-xs text-gray-400 font-medium">No hay horarios configurados</span>
                )}
              </div>
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 mt-3">
                <strong className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Activos Fijos</strong>
                <div className="flex flex-wrap gap-2">
                  {room.assets && room.assets.length > 0 ? room.assets.map((a: any) => (
                    <span key={a.id} className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                      {a.name}
                    </span>
                  )) : (
                    <span className="text-xs text-gray-400 font-medium">No tiene activos fijos</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
