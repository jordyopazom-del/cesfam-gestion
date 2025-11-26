'use client';

import { useActionState } from 'react';
import { changePassword } from '../actions/auth';
import { Loader2 } from 'lucide-react';

export default function ChangePasswordPage() {
    const [state, action, isPending] = useActionState(changePassword, undefined);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Cambio de Contraseña
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Por seguridad, debes cambiar tu contraseña inicial.
                    </p>
                </div>
                <form className="mt-8 space-y-6" action={action}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="new-password" className="sr-only">
                                Nueva Contraseña
                            </label>
                            <input
                                id="new-password"
                                name="newPassword"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Nueva Contraseña"
                                minLength={6}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="sr-only">
                                Confirmar Contraseña
                            </label>
                            <input
                                id="confirm-password"
                                name="confirmPassword"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Confirmar Contraseña"
                                minLength={6}
                            />
                        </div>
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
                                'Cambiar Contraseña'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
