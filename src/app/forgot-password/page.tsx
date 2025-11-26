'use client';

import { useActionState } from 'react';
import { requestPasswordReset } from '../actions/auth';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [state, action, isPending] = useActionState(requestPasswordReset, undefined);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Recuperar Contraseña
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Ingresa tu correo electrónico y solicitaremos al administrador que restablezca tu clave.
                    </p>
                </div>

                {state?.success ? (
                    <div className="rounded-md bg-green-50 p-4 animate-in fade-in">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">Solicitud enviada</h3>
                                <div className="mt-2 text-sm text-green-700">
                                    <p>{state.success}</p>
                                </div>
                                <div className="mt-4">
                                    <div className="-mx-2 -my-1.5 flex">
                                        <Link
                                            href="/login"
                                            className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-green-50"
                                        >
                                            Volver al inicio
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" action={action}>
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
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Correo Electrónico"
                            />
                        </div>

                        {state?.error && (
                            <div className="text-red-500 text-sm text-center">
                                {state.error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isPending ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    'Solicitar Restablecimiento'
                                )}
                            </button>
                        </div>

                        <div className="text-center">
                            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center gap-2">
                                <ArrowLeft size={16} />
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
