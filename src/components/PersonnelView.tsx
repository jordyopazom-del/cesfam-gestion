'use client';

import { useState } from 'react';
import { Official, addOfficial, deleteOfficial, updateOfficial } from '@/app/admin/personnel/actions';
import { Trash2, UserPlus, Search, Briefcase, User, Edit2, Check, X, Shield } from 'lucide-react';
import clsx from 'clsx';

interface PersonnelViewProps {
    subTab: 'CLINICO' | 'ADMINISTRATIVO';
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
            <div className="p-8 border-b border-gray-100 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-50 rounded-xl">
                        {subTab === 'CLINICO' ? <User className="text-emerald-600" size={28} /> : <Briefcase className="text-amber-600" size={28} />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {subTab === 'CLINICO' ? 'Personal Clínico' : 'Personal Administrativo'}
                        </h2>
                        <p className="text-gray-500 mt-0.5">Gestión de activos del área {subTab.toLowerCase()}</p>
                    </div>
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
                                title="Cerrar formulario"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-widest font-bold border-b border-gray-100">
                            <th className="px-8 py-5 whitespace-nowrap">Identificación / Nombre</th>
                            <th className="px-8 py-5 whitespace-nowrap">Profesión / Función</th>
                            <th className="px-8 py-5 whitespace-nowrap">📧 Contacto</th>
                            <th className="px-8 py-5 whitespace-nowrap">Área</th>
                            <th className="px-8 py-5 text-right whitespace-nowrap">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredPersonnel.map((p) => (
                            <tr key={p.name} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-8 py-5">
                                    {editingName === p.name ? (
                                        <input
                                            id={`edit-p-name-input-${p.name}`}
                                            type="text"
                                            placeholder="Nombre completo"
                                            title="Editar nombre completo"
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-sm"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value.toUpperCase() })}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                                                {p.name.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-gray-900 whitespace-nowrap">{p.name}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-8 py-5">
                                    {editingName === p.name ? (
                                        <input
                                            id={`edit-p-profession-${p.name}`}
                                            type="text"
                                            placeholder="Profesión o cargo"
                                            title="Editar profesión o cargo"
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-sm"
                                            value={editForm.profession}
                                            onChange={(e) => setEditForm({ ...editForm, profession: e.target.value.toUpperCase() })}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-600 whitespace-nowrap">
                                            <div className="p-1.5 bg-gray-100 rounded-md">
                                                <Briefcase size={12} className="text-gray-500" />
                                            </div>
                                            <span className="text-sm">{p.profession}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-8 py-5">
                                    {editingName === p.name ? (
                                        <input
                                            id={`edit-p-email-${p.name}`}
                                            type="email"
                                            placeholder="Correo electrónico"
                                            title="Editar correo electrónico"
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none lowercase text-sm"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value.toLowerCase() })}
                                        />
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-700">{p.email || 'Sin correo'}</span>
                                            {p.email && <span className="text-[10px] text-gray-400">Verificado</span>}
                                        </div>
                                    )}
                                </td>
                                <td className="px-8 py-5">
                                    <span className={clsx(
                                        "px-3 py-1 rounded-full text-[11px] font-bold tracking-tight uppercase",
                                        p.type === 'CLINICO' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                             "bg-amber-50 text-amber-700 border border-amber-100"
                                    )}>
                                        {p.type}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        {editingName === p.name ? (
                                            <>
                                                <button onClick={handleUpdate} className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-all" title="Guardar cambios">
                                                    <Check size={18} />
                                                </button>
                                                <button onClick={() => setEditingName(null)} className="p-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all" title="Cancelar edición">
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEdit(p)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all" title="Editar">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(p.name)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all" title="Eliminar">
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
                        <h3 className="text-gray-900 font-medium">No se encontraron registros</h3>
                        <p className="text-gray-500 text-sm mt-1">Intenta ajustar tu búsqueda o cambia la categoría arriba.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
