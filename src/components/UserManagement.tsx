'use client';

import { useState, useEffect } from 'react';
import { fetchUsers, adminResetPassword } from '@/app/actions/auth';
import { Users, RefreshCw, CheckCircle, AlertCircle, Search, Shield } from 'lucide-react';
import clsx from 'clsx';

interface User {
    email: string;
    name: string;
    role: string;
    resetRequested?: boolean;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [resetting, setResetting] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleResetPassword = async (email: string) => {
        if (!confirm(`¿Está seguro de que desea restablecer la contraseña para ${email}? La contraseña volverá a ser la predeterminada.`)) {
            return;
        }

        setResetting(email);
        setMessage(null);

        try {
            const success = await adminResetPassword(email);
            if (success) {
                setMessage({ type: 'success', text: `Contraseña restablecida para ${email}` });
                await loadUsers();
            } else {
                setMessage({ type: 'error', text: 'Error al restablecer la contraseña' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al restablecer la contraseña' });
        } finally {
            setResetting(null);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <p className="text-gray-500 mt-0.5">Control de cuentas, roles y seguridad del sistema</p>
                    </div>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="p-8">

                {message && (
                    <div className={clsx(
                        "mb-4 p-4 rounded-lg flex items-center gap-2",
                        message.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </div>
                )}

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-widest font-bold border-b border-gray-100">
                                <th className="px-8 py-5">Nombre de Usuario</th>
                                <th className="px-8 py-5">Correo / ID</th>
                                <th className="px-8 py-5">Rol de Acceso</th>
                                <th className="px-8 py-5 text-center">Estado</th>
                                <th className="px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map((user) => (
                                <tr key={user.email} className={clsx(
                                    "hover:bg-gray-50 transition group",
                                    user.resetRequested && "bg-yellow-50"
                                )}>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 uppercase">
                                                {user.name.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-gray-900">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 font-medium text-gray-600">{user.email}</td>
                                    <td className="px-8 py-5">
                                        <span className={clsx(
                                            "px-3 py-1 rounded-full text-[11px] font-bold tracking-tight uppercase",
                                            user.role === 'Admin' ? "bg-purple-100 text-purple-800 border border-purple-200" :
                                                user.role === 'Director' ? "bg-indigo-100 text-indigo-800 border border-indigo-200" :
                                                    "bg-gray-100 text-gray-800 border border-gray-200"
                                        )}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {user.resetRequested ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-bold border border-amber-100 animate-pulse">
                                                <AlertCircle size={12} />
                                                PENDIENTE
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-bold border border-green-100">
                                                <CheckCircle size={12} />
                                                ACTIVO
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 transition-opacity duration-200">
                                            <button
                                                onClick={() => handleResetPassword(user.email)}
                                                disabled={resetting === user.email}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition disabled:opacity-50"
                                                title="Restablecer contraseña a valor por defecto"
                                            >
                                                <RefreshCw size={14} className={clsx(resetting === user.email && "animate-spin")} />
                                                <span className="hidden lg:inline">RESETEAR CLAVE</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
