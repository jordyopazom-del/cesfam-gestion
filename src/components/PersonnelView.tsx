'use client';

import { useState } from 'react';
import { Official, addOfficial, deleteOfficial, updateOfficial } from '@/app/admin/personnel/actions';
import { Trash2, UserPlus, Search, Briefcase, User, Edit2, Check, X, Shield } from 'lucide-react';
import clsx from 'clsx';
import UserManagement from './UserManagement';

interface PersonnelViewProps {
    subTab: 'CLINICO' | 'ADMINISTRATIVO' | 'COORDINADOR';
    personnel: Official[];
    refreshPersonnel: () => void;
}

export default function PersonnelView({ subTab, personnel, refreshPersonnel }: PersonnelViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newOfficial, setNewOfficial] = useState<Official>({ name: '', profession: '', type: subTab, email: '' });
    const [editingName, setEditingName] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Official>({ name: '', profession: '', type: subTab, email: '' });

    const filteredPersonnel = personnel
        .filter(p => p.type === subTab)
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                     p.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())));

    const getTitle = () => {
        switch (subTab) {
            case 'CLINICO': return 'Personal Clínico';
            case 'ADMINISTRATIVO': return 'Personal Administrativo';
            case 'COORDINADOR': return 'Solicitantes / Coordinadores';
        }
    };

    const handleAdd = async () => {
        if (!newOfficial.name || !newOfficial.profession) return;
        try {
            await addOfficial({ ...newOfficial, type: subTab });
            setNewOfficial({ name: '', profession: '', type: subTab, email: '' });
            setIsAdding(false);
            refreshPersonnel();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (name: string) => {
        if (confirm(`¿Estás seguro de eliminar a ${name}?`)) {
            try {
                await deleteOfficial(name);
                refreshPersonnel();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const startEdit = (p: Official) => {
        setEditingName(p.name);
        setEditForm(p);
    };

    const handleUpdate = async () => {
        if (!editingName) return;
        try {
            await updateOfficial(editingName, editForm);
            setEditingName(null);
            refreshPersonnel();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
                    <p className="text-sm text-gray-500 mt-1">Gestión de activos clasificados como {subTab.toLowerCase()}</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium px-4"
                        title="Agregar nuevo registro"
                    >
                        <UserPlus size={18} />
                        <span className="hidden md:inline">Agregar</span>
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="p-6 bg-blue-50/50 border-b border-blue-100 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label htmlFor="view-add-name" className="text-xs font-semibold text-gray-500 uppercase ml-1">Nombre Completo</label>
                            <input
                                id="view-add-name"
                                type="text"
                                placeholder="Eje: JUAN PEREZ"
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newOfficial.name}
                                onChange={(e) => setNewOfficial({ ...newOfficial, name: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="view-add-profession" className="text-xs font-semibold text-gray-500 uppercase ml-1">Profesión / Cargo</label>
                            <input
                                id="view-add-profession"
                                type="text"
                                placeholder="Eje: MEDICO"
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newOfficial.profession}
                                onChange={(e) => setNewOfficial({ ...newOfficial, profession: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="view-add-email" className="text-xs font-semibold text-gray-500 uppercase ml-1">Correo Electrónico</label>
                            <input
                                id="view-add-email"
                                type="email"
                                placeholder="Eje: juan@cesfam.cl"
                                title="Correo electrónico del funcionario"
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newOfficial.email}
                                onChange={(e) => setNewOfficial({ ...newOfficial, email: e.target.value.toLowerCase() })}
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                onClick={handleAdd}
                                disabled={!newOfficial.name || !newOfficial.profession}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-all disabled:opacity-50"
                            >
                                Guardar
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4">Profesión / Función</th>
                            <th className="px-6 py-4">Correo</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredPersonnel.map((p) => (
                            <tr key={p.name} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-6 py-4">
                                    {editingName === p.name ? (
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value.toUpperCase() })}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <User size={16} />
                                            </div>
                                            <span className="font-medium text-gray-900">{p.name}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingName === p.name ? (
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                                            value={editForm.profession}
                                            onChange={(e) => setEditForm({ ...editForm, profession: e.target.value.toUpperCase() })}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Briefcase size={14} className="text-gray-400" />
                                            <span>{p.profession}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingName === p.name ? (
                                        <input
                                            type="email"
                                            title="Editar correo electrónico"
                                            className="w-full px-2 py-1 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none lowercase"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value.toLowerCase() })}
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-500 italic">{p.email || 'No asignado'}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={clsx(
                                        "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                                        p.type === 'CLINICO' ? "bg-emerald-50 text-emerald-700" :
                                            p.type === 'ADMINISTRATIVO' ? "bg-amber-50 text-amber-700" :
                                                "bg-blue-50 text-blue-700"
                                    )}>
                                        {p.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {editingName === p.name ? (
                                            <>
                                                <button onClick={handleUpdate} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Guardar cambios">
                                                    <Check size={18} />
                                                </button>
                                                <button onClick={() => setEditingName(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Cancelar edición">
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(p.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredPersonnel.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-300 mb-4">
                            <User size={32} />
                        </div>
                        <h3 className="text-gray-900 font-medium">No se encontraron activos</h3>
                        <p className="text-gray-500 text-sm mt-1">Intenta ajustar tu búsqueda o agrega un nuevo registro.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
