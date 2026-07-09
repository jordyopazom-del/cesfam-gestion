'use client';

import { useState, useEffect } from 'react';
import { fetchUsers, adminUpdateUser, adminDeleteUser } from '@/app/actions/auth';
import { Users, RefreshCw, CheckCircle, AlertCircle, Search, Shield, Trash2, Download } from 'lucide-react';
import clsx from 'clsx';

interface User {
    email: string | null;
    name: string | null;
    role: string;
    status: string;
    resetRequested?: boolean;
    accessLogistica: boolean;
    accessSolicitudes: boolean;
    accessReservas: boolean;
    accessAgendas: boolean;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [savingEmail, setSavingEmail] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 25;

    // Reset page to 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Local edits per user
    const [edits, setEdits] = useState<Record<string, Partial<User>>>({});

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchUsers();
            setUsers(data as User[]);
        } catch (error) {
            console.error('Failed to load users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const getEdit = (email: string, field: keyof User, fallback: any) =>
        edits[email]?.[field] !== undefined ? edits[email][field] : fallback;

    const setEdit = (email: string, field: keyof User, value: any) => {
        setEdits(prev => ({
            ...prev,
            [email]: { ...prev[email], [field]: value }
        }));
    };

    const handleSave = async (user: User) => {
        const email = user.email || '';
        setSavingEmail(email);
        setMessage(null);
        try {
            const merged = { ...user, ...edits[email] };
            const success = await adminUpdateUser(email, merged.status, merged.role, {
                accessLogistica: merged.accessLogistica,
                accessSolicitudes: merged.accessSolicitudes,
                accessReservas: merged.accessReservas,
                accessAgendas: merged.accessAgendas,
            });
            if (success) {
                setMessage({ type: 'success', text: `Usuario ${email} actualizado.` });
                setEdits(prev => { const n = { ...prev }; delete n[email]; return n; });
                await loadUsers();
            } else {
                setMessage({ type: 'error', text: 'Error al actualizar el usuario.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Error al actualizar el usuario.' });
        } finally {
            setSavingEmail(null);
            setTimeout(() => setMessage(null), 4000);
        }
    };

    const handleApprove = async (user: User) => {
        setSavingEmail(user.email || '');
        setMessage(null);
        try {
            const success = await adminUpdateUser(user.email || '', 'active', user.role, {
                accessLogistica: user.accessLogistica,
                accessSolicitudes: user.accessSolicitudes,
                accessReservas: user.accessReservas,
                accessAgendas: user.accessAgendas,
            });
            if (success) {
                setMessage({ type: 'success', text: `Usuario ${user.email} aprobado.` });
                await loadUsers();
            }
        } finally {
            setSavingEmail(null);
            setTimeout(() => setMessage(null), 4000);
        }
    };

    const handleReject = async (user: User) => {
        setSavingEmail(user.email || '');
        try {
            await adminUpdateUser(user.email || '', 'rejected', user.role, {
                accessLogistica: user.accessLogistica,
                accessSolicitudes: user.accessSolicitudes,
                accessReservas: user.accessReservas,
                accessAgendas: user.accessAgendas,
            });
            await loadUsers();
        } finally {
            setSavingEmail(null);
        }
    };

    const handleDelete = async (email: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario ${email}?`)) {
            return;
        }
        setSavingEmail(email);
        setMessage(null);
        try {
            const success = await adminDeleteUser(email);
            if (success) {
                setMessage({ type: 'success', text: `Usuario ${email} eliminado correctamente.` });
                await loadUsers();
            } else {
                setMessage({ type: 'error', text: 'Error al intentar eliminar al usuario.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Error al intentar eliminar al usuario.' });
        } finally {
            setSavingEmail(null);
            setTimeout(() => setMessage(null), 4000);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const modules: { key: keyof User; label: string; icon: string }[] = [
        { key: 'accessAgendas', label: 'Agendas', icon: '📅' },
        { key: 'accessReservas', label: 'Reservas', icon: '🏠' },
        { key: 'accessLogistica', label: 'Logística', icon: '🚐' },
    ];

    if (loading) {
        return <div className="text-center p-10 text-gray-500">Cargando usuarios...</div>;
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                        <Shield className="text-blue-600" size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Usuarios</h2>
                        <p className="text-gray-500 mt-0.5">Control de cuentas, roles y permisos de módulos</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => {
                            window.open('/api/admin/backup', '_blank');
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all active:scale-[0.98] outline-none cursor-pointer"
                    >
                        <Download size={16} />
                        Exportar Respaldo (.json)
                    </button>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="p-8">
                {message && (
                    <div className={clsx(
                        'mb-4 p-4 rounded-lg flex items-center gap-2',
                        message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    )}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Cabecera de Tabla (Solo Desktop) */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        <div className="lg:col-span-3">Funcionario</div>
                        <div className="lg:col-span-3">Módulos Habilitados</div>
                        <div className="lg:col-span-2 text-center">Estado</div>
                        <div className="lg:col-span-2 text-center">Rol de Acceso</div>
                        <div className="lg:col-span-2 text-right pr-4">Acciones</div>
                    </div>

                    {paginatedUsers.map(user => {
                        const email = user.email || '';
                        const isPending = user.status === 'pending';
                        const hasEdits = !!edits[email] && Object.keys(edits[email]).length > 0;

                        return (
                            <div key={email} className={clsx(
                                'border rounded-xl p-4 transition-all',
                                isPending ? 'border-amber-200 bg-amber-50' : 'border-gray-100 hover:border-blue-100 hover:bg-blue-50/30'
                            )}>
                                <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-4 w-full">
                                    {/* Izquierda: Identidad del Funcionario */}
                                    <div className="flex items-center gap-3 lg:col-span-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 uppercase text-base shrink-0">
                                            {(user.name || 'U').charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-gray-900 text-sm truncate" title={user.name || 'Usuario'}>{user.name || 'Usuario'}</div>
                                            <div className="text-xs text-gray-400 truncate" title={user.email || ''}>{user.email}</div>
                                        </div>
                                    </div>

                                    {/* Centro: Módulos Habilitados */}
                                    <div className="flex flex-row flex-nowrap items-center gap-1.5 lg:col-span-3 overflow-hidden">
                                        {modules.map(({ key, label, icon }) => {
                                            const enabled = getEdit(email, key, user[key]) as boolean;
                                            return (
                                                <label
                                                    key={key}
                                                    className={clsx(
                                                        'flex items-center gap-1 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all select-none text-[10.5px] font-bold shrink-0',
                                                        enabled
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                            : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={enabled}
                                                        onChange={e => setEdit(email, key, e.target.checked)}
                                                    />
                                                    <span>{icon}</span>
                                                    <span>{label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>

                                    {/* Derecha: Estado */}
                                    <div className="flex lg:col-span-2 items-center justify-start lg:justify-center">
                                        {isPending ? (
                                            <div className="flex gap-1 shrink-0">
                                                <button
                                                    onClick={() => handleApprove(user)}
                                                    disabled={savingEmail === email}
                                                    className="px-2 py-1 bg-green-600 text-white rounded-lg text-[9px] font-bold hover:bg-green-700 transition disabled:opacity-50"
                                                >
                                                    ✓ APROBAR
                                                </button>
                                                <button
                                                    onClick={() => handleReject(user)}
                                                    disabled={savingEmail === email}
                                                    className="px-2 py-1 bg-red-600 text-white rounded-lg text-[9px] font-bold hover:bg-red-700 transition disabled:opacity-50"
                                                >
                                                    ✗ RECHAZAR
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={clsx(
                                                'inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border shrink-0',
                                                user.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                            )}>
                                                {user.status === 'active' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                                {user.status === 'active' ? 'ACTIVO' : 'RECHAZADO'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Derecha: Selector de Rol */}
                                    <div className="flex lg:col-span-2 items-center justify-start lg:justify-center">
                                        <select
                                            value={getEdit(email, 'role', user.role) as string}
                                            onChange={e => setEdit(email, 'role', e.target.value)}
                                            title="Cambiar rol de usuario"
                                            className="w-full max-w-[125px] px-2.5 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white outline-none cursor-pointer text-gray-700"
                                        >
                                            <option value="ADMIN">Admin</option>
                                            <option value="SOLICITANTE">Solicitante</option>
                                            <option value="USUARIO">Usuario</option>
                                        </select>
                                    </div>

                                    {/* Derecha: Acciones (Guardar / Eliminar) */}
                                    <div className="flex lg:col-span-2 justify-start lg:justify-end items-center gap-2 min-h-[34px] w-full">
                                        {hasEdits && (
                                            <button
                                                onClick={() => handleSave(user)}
                                                disabled={savingEmail === email}
                                                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 animate-in fade-in zoom-in-95 duration-200 shadow-sm grow"
                                            >
                                                <RefreshCw size={11} className={clsx(savingEmail === email && 'animate-spin')} />
                                                <span>Guardar</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(email)}
                                            disabled={savingEmail === email}
                                            title="Eliminar usuario"
                                            className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition disabled:opacity-50 shadow-sm border border-red-100 hover:border-red-200 shrink-0"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredUsers.length === 0 && (
                        <div className="p-8 text-center text-gray-400">No se encontraron usuarios.</div>
                    )}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-500 mt-6">
                        <div>
                            Mostrando <span className="text-gray-900">{startIndex + 1}</span> a <span className="text-gray-900">{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}</span> de <span className="text-gray-900">{totalItems}</span> usuarios
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
            </div>
        </div>
    );
}
