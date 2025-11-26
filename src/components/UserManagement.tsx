'use client';

import { useState, useEffect } from 'react';
import { fetchUsers, adminResetPassword } from '@/app/actions/auth';
import { Users, RefreshCw, CheckCircle, AlertCircle, Search } from 'lucide-react';
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
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Users size={24} className="text-blue-600" />
                        Gestión de Usuarios
                    </h2>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {message && (
                    <div className={clsx(
                        "mb-4 p-4 rounded-lg flex items-center gap-2",
                        message.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Nombre</th>
                                <th className="p-4">Correo</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4 text-center">Estado</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.email} className={clsx(
                                    "hover:bg-gray-50 transition",
                                    user.resetRequested && "bg-yellow-50"
                                )}>
                                    <td className="p-4 font-medium text-gray-900">{user.name}</td>
                                    <td className="p-4">{user.email}</td>
                                    <td className="p-4">
                                        <span className={clsx(
                                            "px-2 py-1 rounded-full text-xs font-medium",
                                            user.role === 'Admin' ? "bg-purple-100 text-purple-800" :
                                                user.role === 'Director' ? "bg-indigo-100 text-indigo-800" :
                                                    "bg-gray-100 text-gray-800"
                                        )}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {user.resetRequested && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold animate-pulse">
                                                <AlertCircle size={12} />
                                                Solicitó Cambio
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleResetPassword(user.email)}
                                            disabled={resetting === user.email}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition disabled:opacity-50"
                                            title="Restablecer contraseña a valor por defecto"
                                        >
                                            <RefreshCw size={14} className={clsx(resetting === user.email && "animate-spin")} />
                                            Resetear Clave
                                        </button>
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
