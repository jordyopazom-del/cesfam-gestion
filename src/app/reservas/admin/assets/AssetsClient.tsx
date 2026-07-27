"use client";

import { useState } from "react";
import { Trash2, Sparkles } from 'lucide-react';

interface AssetsClientProps {
  initialAssets: any[];
}

export function AssetsClient({ initialAssets }: AssetsClientProps) {
  const [assets, setAssets] = useState(initialAssets);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });

      if (res.ok) {
        const newAsset = await res.json();
        setAssets([...assets, newAsset].sort((a, b) => a.name.localeCompare(b.name)));
        setName("");
        setDescription("");
        alert("Activo creado exitosamente");
      } else {
        alert("Error al crear el activo");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este activo?")) return;
    
    try {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAssets(assets.filter(a => a.id !== id));
      } else {
        alert("Error al eliminar el activo");
      }
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Form to create asset */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Sparkles size={18} className="text-blue-500" />
          Nuevo Activo
        </h2>
        
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nombre del Activo</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-700 text-sm placeholder-gray-400 outline-none transition-all"
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              placeholder="Ej. Sillas extra, Pizarra"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
            <textarea 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-700 text-sm placeholder-gray-400 outline-none transition-all"
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Detalles sobre el activo"
              rows={3}
            />
          </div>

          <button 
            type="submit" 
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-sm transition-all duration-200
              ${loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
              }
            `}
            disabled={loading || !name}
          >
            {loading ? "Guardando..." : "Guardar Activo"}
          </button>
        </form>
      </div>

      {/* Right Column: List of existing assets */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gray-800">Activos Existentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assets.map(asset => (
            <div key={asset.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-800">{asset.name}</h3>
                {asset.description && (
                  <p className="text-xs text-gray-500 mt-1">{asset.description}</p>
                )}
              </div>
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => handleDelete(asset.id)} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl border border-red-100 transition-all"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {assets.length === 0 && (
            <div className="col-span-full p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm font-semibold text-gray-500">No hay activos configurados todavía.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
