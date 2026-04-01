'use client';

import { useActionState } from 'react';
import { register } from '@/app/actions/auth';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

export default function RegisterPage() {
    const [state, action, isPending] = useActionState(register, undefined);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-lg mb-6">
                        <UserPlus className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Solicitar Acceso
                    </h1>
                    <p className="text-gray-500 mt-2">Completa tus datos para registrarte en el sistema</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
                    {state?.success ? (
                        <div className="text-center space-y-6 py-4">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-100 animate-bounce">
                                    <CheckCircle size={32} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-green-800 font-bold text-lg">¡Solicitud Enviada!</p>
                                <p className="text-green-600 font-medium">
                                    {state.success}
                                </p>
                            </div>
                            <div className="pt-4">
                                <Link 
                                    href="/login" 
                                    className="inline-flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all"
                                >
                                    <ArrowLeft size={18} />
                                    Volver al Inicio de Sesión
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form action={action} className="space-y-6">
                            {state?.error && (
                                <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm animate-in shake duration-300">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p className="font-semibold">{state.error}</p>
                                </div>
                            )}

                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="name" className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                                        Nombre Completo
                                    </label>
                                    <div className="relative group/field">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/field:text-blue-500 transition-colors">
                                            <User size={18} />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            placeholder="Tu nombre y apellido"
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 font-medium placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative group/field">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/field:text-blue-500 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="ejemplo@munifutrono.cl"
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 font-medium placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="password" className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                                        Contraseña
                                    </label>
                                    <div className="relative group/field">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/field:text-blue-500 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 font-medium placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="confirmPassword" className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                                        Confirmar Contraseña
                                    </label>
                                    <div className="relative group/field">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/field:text-blue-500 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 font-medium placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    disabled={isPending}
                                    type="submit"
                                    className={clsx(
                                        "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm tracking-wide flex items-center justify-center gap-3",
                                        isPending && "bg-blue-400 cursor-not-allowed opacity-70"
                                    )}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            PROCESANDO...
                                        </>
                                    ) : (
                                        'SOLICITAR REGISTRO'
                                    )}
                                </button>
                            </div>

                            <div className="text-center pt-2">
                                <Link 
                                    href="/login" 
                                    className="text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                    ¿Ya tienes cuenta? <span className="text-blue-600 ml-1">Inicia sesión</span>
                                </Link>
                            </div>
                        </form>
                    )}
                </div>

                <div className="text-center text-gray-400 text-xs font-medium">
                    © 2026 Ilustre Municipalidad de Futrono
                </div>
            </div>
        </div>
    );
}
