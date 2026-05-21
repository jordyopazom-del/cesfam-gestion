'use client';

import { useState, useEffect } from 'react';
import { Official, addOfficial, deleteOfficial, updateOfficial, importCsvAction } from '@/app/admin/personnel/actions';
import { Trash2, UserPlus, Search, Briefcase, User, Edit2, Check, X, Shield, History, Filter, Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import PersonnelAuditModal from './PersonnelAuditModal';

interface PersonnelViewProps {
    subTab: 'CLINICO' | 'ADMINISTRATIVO';
    personnel: Official[];
    refreshPersonnel: () => void;
}

export default function PersonnelView({ subTab, personnel, refreshPersonnel }: PersonnelViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newOfficial, setNewOfficial] = useState<Official>({ name: '', profession: '', type: subTab, email: '', birthDate: '' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Official>({ name: '', profession: '', type: subTab, email: '', birthDate: '' });
    const [auditingName, setAuditingName] = useState<string | null>(null);
    const [selectedProfession, setSelectedProfession] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 25;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedProfession, subTab]);

    // Carga masiva state
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [csvInput, setCsvInput] = useState('');
    const [csvDelimiter, setCsvDelimiter] = useState(';');
    const [importResult, setImportResult] = useState<{ success: boolean; count: number; error?: string } | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleCsvImport = async () => {
        if (!csvInput.trim()) return;
        setIsImporting(true);
        setImportResult(null);
        try {
            const res = await importCsvAction(csvInput, csvDelimiter);
            setImportResult(res);
            if (res.success) {
                setCsvInput('');
                refreshPersonnel();
            }
        } catch (error: any) {
            setImportResult({ success: false, count: 0, error: error?.message || 'Error al conectar con el servidor' });
        } finally {
            setIsImporting(false);
        }
    };

    const uniqueProfessions = Array.from(new Set(personnel.filter(p => p.type === subTab).map(p => p.profession))).sort();

    const filteredPersonnel = personnel
        .filter(p => p.type === subTab)
        .filter(p => selectedProfession === 'ALL' || p.profession === selectedProfession)
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                     p.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())))
        .sort((a, b) => a.profession.localeCompare(b.profession));

    const totalItems = filteredPersonnel.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedPersonnel = filteredPersonnel.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleAdd = async () => {
        if (!newOfficial.name || !newOfficial.profession) return;
        try {
            await addOfficial({ ...newOfficial, type: subTab });
            setNewOfficial({ name: '', profession: '', type: subTab, email: '', birthDate: '' });
            setIsAdding(false);
            refreshPersonnel();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (p: Official) => {
        if (!p.id) return;
        if (confirm(`¿Estás seguro de eliminar a ${p.name}?`)) {
            try {
                await deleteOfficial(p.id);
                refreshPersonnel();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const startEdit = (p: Official) => {
        setEditingId(p.id || null);
        setEditForm(p);
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        try {
            await updateOfficial(editingId, editForm);
            setEditingId(null);
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
                    <button
                        onClick={() => {
                            setIsBulkImportOpen(true);
                            setImportResult(null);
                            setCsvInput('');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium px-4"
                        title="Carga masiva desde Excel/CSV"
                    >
                        <FileSpreadsheet size={18} />
                        <span className="hidden md:inline">Carga Masiva</span>
                    </button>

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
                     <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                            <label htmlFor="view-add-birthdate" className="text-xs font-semibold text-gray-500 uppercase ml-1">Fecha Nacimiento</label>
                            <input
                                id="view-add-birthdate"
                                type="text"
                                placeholder="Eje: 25-10-1972"
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newOfficial.birthDate || ''}
                                onChange={(e) => setNewOfficial({ ...newOfficial, birthDate: e.target.value })}
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
                                        <div className="flex flex-col gap-1.5">
                                            <input
                                                id={`edit-p-name-input-${p.name}`}
                                                type="text"
                                                placeholder="Nombre completo"
                                                title="Editar nombre completo"
                                                className="w-full px-3 py-1.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-xs"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value.toUpperCase() })}
                                             />
                                            <input
                                                type="text"
                                                placeholder="Fecha nacimiento (Eje: 25-10-1972)"
                                                title="Editar fecha de nacimiento"
                                                className="w-full px-3 py-1.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                                value={editForm.birthDate || ''}
                                                onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 text-xs sm:text-sm shrink-0">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight">{p.name}</span>
                                                {p.birthDate && (
                                                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">🎂 {p.birthDate}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 md:px-6 py-4">
                                    {editingId === p.id ? (
                                        <input
                                            id={`edit-p-profession-${p.name}`}
                                            type="text"
                                            placeholder="Profesión o cargo"
                                            title="Editar profesión o cargo"
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-xs sm:text-sm"
                                            value={editForm.profession}
                                            onChange={(e) => setEditForm({ ...editForm, profession: e.target.value.toUpperCase() })}
                                        />
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
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase whitespace-nowrap",
                                        p.type === 'CLINICO' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                             "bg-amber-50 text-amber-700 border border-amber-100"
                                    )}>
                                        {p.type}
                                    </span>
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

            {/* Modal de Carga Masiva */}
            {isBulkImportOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                                    <FileSpreadsheet size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Carga Masiva de Funcionarios</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Sincroniza tu planilla Excel en ambos sistemas a la vez</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsBulkImportOpen(false)}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            
                            {/* Instrucciones */}
                            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-2">
                                <p className="font-semibold flex items-center gap-1.5">
                                    💡 Instrucciones para tu Excel:
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-xs text-blue-900 ml-1">
                                    <li>En Excel, asegúrate de tener las columnas en este orden exacto:
                                        <div className="mt-1 font-mono bg-blue-100/50 p-1.5 rounded text-[10px] text-blue-950 font-semibold border border-blue-200/50 overflow-x-auto whitespace-nowrap">
                                            Apellido Paterno | Apellido Materno | Nombres | Rut | Nacimiento | Email | Cargo
                                        </div>
                                    </li>
                                    <li>Guarda el archivo como **CSV (delimitado por comas o punto y coma)**, o simplemente **copia el rango de celdas** directamente de Excel y pégalo abajo.</li>
                                    <li>El sistema registrará automáticamente a los funcionarios en **Agendas** y en **Logística**.</li>
                                </ol>
                            </div>

                            {/* Selector delimitador */}
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <label className="text-xs font-bold text-gray-600 uppercase">Separador del archivo:</label>
                                <select 
                                    value={csvDelimiter}
                                    onChange={(e) => setCsvDelimiter(e.target.value)}
                                    className="bg-white border border-gray-200 rounded-lg text-xs font-semibold px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value=";">Punto y Coma (;) — Común en Excel Latino</option>
                                    <option value=",">Coma (,) — CSV Estándar</option>
                                    <option value="&#9;">Tabulación (\t) — Copiado directo de Excel</option>
                                </select>
                            </div>

                            {/* Textarea */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Pega aquí el contenido CSV o celdas de Excel:</label>
                                <textarea
                                    className="w-full h-48 px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none resize-none transition-all"
                                    placeholder="Acuña;Arao;Patricio Alejandro;12262734-9;25-10-72;palejandro.a@gmail.com;Conductor&#10;Rodriguez;Hernandez;Aimee;24939507-2;27-08-66;aimee.r1966@gmail.com;Medico"
                                    value={csvInput}
                                    onChange={(e) => setCsvInput(e.target.value)}
                                    disabled={isImporting}
                                />
                            </div>

                            {/* Resultados */}
                            {importResult && (
                                <div className={clsx(
                                    "p-4 rounded-xl text-sm flex items-start gap-3 border animate-in slide-in-from-bottom-2 duration-300",
                                    importResult.success ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
                                )}>
                                    <div className="mt-0.5">
                                        {importResult.success ? <Check className="text-emerald-600 font-bold" size={18} /> : <X className="text-red-600 font-bold" size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-semibold">
                                            {importResult.success ? '¡Procesamiento masivo exitoso!' : 'Hubo un inconveniente al procesar'}
                                        </p>
                                        <p className="text-xs mt-1 text-gray-600">
                                            {importResult.success 
                                                ? `Se han importado/actualizado con éxito ${importResult.count} funcionarios en ambas bases de datos simultáneamente.` 
                                                : importResult.error || 'Error desconocido de procesamiento.'
                                            }</p>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsBulkImportOpen(false)}
                                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                                disabled={isImporting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCsvImport}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 disabled:bg-emerald-400"
                                disabled={isImporting || !csvInput.trim()}
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={16} />
                                        Procesar e Importar
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
