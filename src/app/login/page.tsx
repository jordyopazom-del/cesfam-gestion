'use client';

import { useActionState } from 'react';
import { login } from '../actions/auth';
import { Loader2, Mail, Lock, ShieldCheck, HeartPulse } from 'lucide-react';

export default function LoginPage() {
    const [state, action, isPending] = useActionState(login, undefined);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
            {/* Background design elements */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

            <div className="max-w-md w-full space-y-8 bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 transform hover:scale-105 transition-transform duration-300">
                        <HeartPulse className="text-white w-9 h-9" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight">
                        CESFAM <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Gestión</span>
                    </h2>
                    <p className="mt-2 text-sm text-slate-300/80 font-medium">
                        Sistema Unificado de Control y Administración
                    </p>
                </div>

                <form className="mt-8 space-y-5" action={action}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Correo Electrónico
                            </label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 placeholder-slate-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                                    placeholder="ejemplo@munifutrono.cl"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Contraseña
                                </label>
                                <a 
                                    href="/forgot-password" 
                                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    ¿La olvidaste?
                                </a>
                            </div>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 placeholder-slate-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    {state?.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold text-center animate-shake">
                            {state.error}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex justify-center py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 active:from-blue-700 active:to-blue-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="animate-spin h-5 w-5" />
                                    <span>Verificando...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5" />
                                    <span>INGRESAR AL SISTEMA</span>
                                </div>
                            )}
                        </button>
                    </div>

                    <div className="pt-4 border-t border-white/5 text-center">
                        <a 
                            href="/register" 
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                            ¿No tienes cuenta? <span className="underline">Solicita acceso aquí</span>
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
