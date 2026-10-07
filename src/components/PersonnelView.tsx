'use client';

import { useState, useEffect } from 'react';
import { Official, deleteOfficial, updateOfficial } from '@/app/admin/personnel/actions';
import { Trash2, Search, Briefcase, User, Edit2, Check, X, Shield, History, Filter, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import PersonnelAuditModal from './PersonnelAuditModal';
import { ESTAMENTOS_OFICIALES, normalizeProfession, getAreaType } from '@/lib/estamentos';

type AreaFilter = 'ALL' | 'CLINICO' | 'ADMINISTRATIVO';

interface PersonnelViewProps {
    personnel: Official[];
    refreshPersonnel: () => void;
}

const emptyOfficial = (): Official => ({ name: '', profession: '', type: 'CLINICO', email: '', birthDate: '' });

export default function PersonnelView({ personnel, refreshPersonnel }: PersonnelViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [areaFilter, setAreaFilter] = useState<AreaFilter>('ALL');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Official>(emptyOfficial());
    const [auditingName, setAuditingName] = useState<string | null>(null);
    const [selectedProfession, setSelectedProfession] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 25;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedProfession, areaFilter]);

    // Si cambia el área y la profesión elegida ya no existe en ella, se resetea
    useEffect(() => {
        setSelectedProfession('ALL');
    }, [areaFilter]);

    const countClinico = personnel.filter(p => p.type === 'CLINICO').length;
    const countAdmin = personnel.filter(p => p.type === 'ADMINISTRATIVO').length;

    const byArea = personnel.filter(p => areaFilter === 'ALL' || p.type === areaFilter);

    const uniqueProfessions = Array.from(new Set(byArea.map(p => p.profession))).sort();

    const filteredPersonnel = byArea
        .filter(p => selectedProfession === 'ALL' || p.profession === selectedProfession)
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                     p.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())))
        .sort((a, b) => a.profession.localeCompare(b.profession));

    const totalItems = filteredPersonnel.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedPersonnel = filteredPersonnel.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleDelete = async (p: Official) => {
        if (!p.id) return;
        if (confirm(`¿Estás seguro de eliminar a ${p.name}?`)) {
            try {
                await deleteOfficial(p.id);
                refreshPersonnel();
                toast.success('Funcionario eliminado');
            } catch (error) {
                console.error(error);
                toast.error('Error al eliminar funcionario');
            }
        }
    };

    const startEdit = (p: Official) => {
        setEditingId(p.id || null);
        setEditForm({
            ...p,
            profession: normalizeProfession(p.profession)
        });
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        try {
            await updateOfficial(editingId, editForm);
            setEditingId(null);
            refreshPersonnel();
            toast.success('Funcionario actualizado');
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar funcionario');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <User className="text-emerald-600" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Directorio de Personal</h2>
                            <p className="text-gray-500 mt-0.5">Dotación completa del CESFAM</p>
                        </div>
                    </div>
                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 w-fit text-xs font-bold">
                        {([
                            { key: 'ALL', label: 'Todos', count: personnel.length, active: 'text-gray-900' },
                            { key: 'CLINICO', label: 'Clínicos', count: countClinico, active: 'text-emerald-700' },
                            { key: 'ADMINISTRATIVO', label: 'Administrativos', count: countAdmin, active: 'text-amber-700' },
                        ] as const).map(opt => (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => setAreaFilter(opt.key)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg transition-all",
                                    areaFilter === opt.key ? `bg-white shadow-sm ${opt.active}` : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                {opt.label} ({opt.count})
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-56">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-gray-400" />
                       </div>
                       <select
                           className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                           value={selectedProfession}
                           onChange={(e) => setSelectedProfession(e.target.value)}
                       >
                           <option value="ALL">Todas las Profesiones</option>
                           {uniqueProfessions.map(prof => (
                               <option key={prof} value={prof}>{prof}</option>
                           ))}
                       </select>
                       <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                       </div>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-widest font-bold border-b border-gray-100">
                            <th className="w-[32%] pl-8 pr-4 py-4 whitespace-nowrap">Identificación / Nombre</th>
                            <th className="w-[18%] px-4 md:px-6 py-4 whitespace-nowrap">Profesión / Función</th>
                            <th className="w-[25%] px-4 md:px-6 py-4 whitespace-nowrap">📧 Contacto</th>
                            <th className="w-[12%] px-4 md:px-6 py-4 whitespace-nowrap">Área</th>
                            <th className="w-[13%] pl-4 pr-8 md:pr-12 py-4 text-right whitespace-nowrap">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {paginatedPersonnel.map((p) => (
                            <tr key={p.id || p.name} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="pl-8 pr-4 py-4">
                                    {editingId === p.id ? (
                                        <input
                                            id={`edit-p-name-input-${p.name}`}
                                            type="text"
                                            placeholder="Nombre completo"
                                            title="Editar nombre completo"
                                            className="w-full px-3 py-1.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-xs"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value.toUpperCase() })}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 text-xs sm:text-sm shrink-0">
                                                {p.name.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight">{p.name}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 md:px-6 py-4">
                                    {editingId === p.id ? (
                                        <select
                                            id={`edit-p-profession-${p.name}`}
                                            title="Seleccionar profesión o cargo oficial"
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm bg-white font-medium cursor-pointer"
                                            value={editForm.profession}
                                            onChange={(e) => {
                                                const prof = e.target.value;
                                                const autoArea = getAreaType(prof);
                                                setEditForm({ ...editForm, profession: prof, type: autoArea });
                                            }}
                                        >
                                            <option value="" disabled>Seleccione profesión...</option>
                                            {ESTAMENTOS_OFICIALES.map((est) => (
                                                <option key={est} value={est}>{est}</option>
                                            ))}
                                            {editForm.profession && !ESTAMENTOS_OFICIALES.includes(editForm.profession as any) && (
                                                <option value={editForm.profession}>{editForm.profession}</option>
                                            )}
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-600 whitespace-nowrap">
                                            <div className="p-1 bg-gray-100 rounded">
                                                <Briefcase size={11} className="text-gray-500" />
                                            </div>
                                            <span className="text-xs sm:text-sm">{p.profession}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 md:px-6 py-4">
                                    {editingId === p.id ? (
                                        <input
                                            id={`edit-p-email-${p.name}`}
                                            type="email"
                                            placeholder="Correo electrónico"
                                            title="Editar correo electrónico"
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none lowercase text-xs sm:text-sm"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value.toLowerCase() })}
                                        />
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="text-xs sm:text-sm font-medium text-gray-700">{p.email || 'Sin correo'}</span>
                                            {p.email && <span className="text-[9px] text-gray-400">Verificado</span>}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 md:px-6 py-4">
                                    {editingId === p.id ? (
                                        <select
                                            title="Editar área"
                                            className="w-full px-2 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                            value={editForm.type || 'CLINICO'}
                                            onChange={(e) => setEditForm({ ...editForm, type: e.target.value as Official['type'] })}
                                        >
                                            <option value="CLINICO">Clínico</option>
                                            <option value="ADMINISTRATIVO">Administrativo</option>
                                        </select>
                                    ) : (
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase whitespace-nowrap",
                                            p.type === 'CLINICO' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                                 "bg-amber-50 text-amber-700 border border-amber-100"
                                        )}>
                                            {p.type}
                                        </span>
                                    )}
                                </td>
                                <td className="pl-4 pr-8 md:pr-12 py-4 text-right w-[13%]">
                                    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                                        {editingId === p.id ? (
                                            <>
                                                <button onClick={handleUpdate} className="p-1.5 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-all" title="Guardar cambios">
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all" title="Cancelar edición">
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => setAuditingName(p.name)} className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all" title="Historial Clínico">
                                                    <History size={16} />
                                                </button>
                                                <button onClick={() => startEdit(p)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all" title="Editar">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(p)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all" title="Eliminar">
                                                    <Trash2 size={16} />
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

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-500">
                    <div>
                        Mostrando <span className="text-gray-900">{startIndex + 1}</span> a <span className="text-gray-900">{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}</span> de <span className="text-gray-900">{totalItems}</span> funcionarios
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                            .map((page, index, array) => {
                                const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                                return (
                                    <div key={page} className="flex items-center">
                                        {showEllipsisBefore && <span className="px-2 text-gray-400">...</span>}
                                        <button
                                            onClick={() => setCurrentPage(page)}
                                            className={clsx(
                                                "w-8 h-8 rounded-lg border font-bold transition flex items-center justify-center",
                                                currentPage === page
                                                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                                            )}
                                        >
                                            {page}
                                        </button>
                                    </div>
                                );
                            })
                        }
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {auditingName && (
                <PersonnelAuditModal 
                    professionalName={auditingName} 
                    onClose={() => setAuditingName(null)} 
                />
            )}
        </div>
    );
}

