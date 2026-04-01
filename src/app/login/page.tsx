'use client';

import { useActionState } from 'react';
import { login } from '../actions/auth';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [state, action, isPending] = useActionState(login, undefined);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        CESFAM Gestión
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Inicia sesión para continuar
                    </p>
                </div>
                <form className="mt-8 space-y-6" action={action}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Correo Electrónico
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Correo Electrónico"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Contraseña"
                            />
                        </div>
                    </div>

                    {state?.error && (
                        <div className="text-red-500 text-sm text-center">
                            {state.error}
                        </div>
                    )}

                    <div className="flex items-center justify-end">
                        <div className="text-sm">
                            <a href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center justify-center pt-2">
                        <div className="text-sm">
                            <a href="/register" className="font-bold text-indigo-600 hover:text-indigo-500">
                                ¿No tienes cuenta? <span className="underline">Solicita acceso aquí</span>
                            </a>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all active:scale-95 shadow-md"
                        >
                            {isPending ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                'INGRESAR'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
