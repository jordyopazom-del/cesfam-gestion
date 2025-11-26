'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPersonnel, addOfficial, deleteOfficial, Official } from './actions';
import { Trash2, Plus, User, Briefcase } from 'lucide-react';

export default function PersonnelAdminPage() {
    const router = useRouter();
    const [personnel, setPersonnel] = useState<Official[]>([]);
    const [newOfficial, setNewOfficial] = useState<Official>({ name: '', profession: '' });
    const [loading, setLoading] = useState(true);

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; name: string | null }>({ isOpen: false, name: null });

    useEffect(() => {
        loadPersonnel();
    }, []);

    async function loadPersonnel() {
        try {
            const data = await getPersonnel();
            setPersonnel(data);
        } catch (error) {
            console.error('Failed to load personnel:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAdd() {
        if (!newOfficial.name || !newOfficial.profession) return;

        try {
            await addOfficial(newOfficial);
            setNewOfficial({ name: '', profession: '' });
            router.refresh();
            await loadPersonnel();
        } catch (error) {
            console.error('Failed to add official:', error);
        }
    }

    function openDeleteModal(name: string) {
        setDeleteModal({ isOpen: true, name });
    }

    function closeDeleteModal() {
        setDeleteModal({ isOpen: false, name: null });
    }

    async function confirmDelete() {
        if (!deleteModal.name) return;

        try {
            await deleteOfficial(deleteModal.name);
            closeDeleteModal();
            router.refresh();
            await loadPersonnel();
        } catch (error) {
            console.error('Failed to delete official:', error);
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl relative">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Administración de Funcionarios</h1>

            <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
                    <Plus className="w-5 h-5" />
                    Agregar Nuevo Funcionario
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Nombre Completo"
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={newOfficial.name}
                            onChange={(e) => setNewOfficial({ ...newOfficial, name: e.target.value.toUpperCase() })}
                        />
                    </div>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Profesión"
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={newOfficial.profession}
                            onChange={(e) => setNewOfficial({ ...newOfficial, profession: e.target.value.toUpperCase() })}
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={!newOfficial.name || !newOfficial.profession}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Agregar
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-700">Listado de Funcionarios ({personnel.length})</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando funcionarios...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="p-4">Nombre</th>
                                    <th className="p-4">Profesión</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {personnel.map((p, index) => (
                                    <tr key={`${p.name}-${index}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800">{p.name}</td>
                                        <td className="p-4 text-gray-600">
                                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                                {p.profession}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => openDeleteModal(p.name)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {personnel.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-gray-500">
                                            No hay funcionarios registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar Eliminación</h3>
                        <p className="text-gray-600 mb-6">
                            ¿Estás seguro de que deseas eliminar al funcionario <span className="font-semibold text-gray-800">{deleteModal.name}</span>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeDeleteModal}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
