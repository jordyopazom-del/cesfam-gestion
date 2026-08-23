'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import { Clock, ShieldAlert, CheckCircle } from 'lucide-react';

const TOTAL_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos
const WARNING_THRESHOLD_MS = 29 * 60 * 1000; // Al minuto 29 (60 seg restantes)
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'];

export default function SessionTimeoutListener() {
    const pathname = usePathname();
    const router = useRouter();

    const [showWarning, setShowWarning] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(60);

    const lastActivityRef = useRef<number>(Date.now());
    const warningActiveRef = useRef<boolean>(false);

    const isPublicPath = PUBLIC_PATHS.some(p => pathname === p || pathname?.startsWith(p + '/'));

    const handleStayActive = useCallback(() => {
        lastActivityRef.current = Date.now();
        warningActiveRef.current = false;
        setShowWarning(false);
        setSecondsLeft(60);
    }, []);

    const handleAutoLogout = useCallback(async () => {
        warningActiveRef.current = false;
        setShowWarning(false);
        try {
            await logout();
        } catch {
            // Si falla la redirección interna del Server Action, redirigir manualmente
        }
        router.push('/login?reason=inactivity');
    }, [router]);

    // Listener de eventos de actividad del usuario
    useEffect(() => {
        if (isPublicPath) return;

        let throttleTimeout: NodeJS.Timeout | null = null;

        const updateActivity = () => {
            // Si la advertencia ya está visible, no reiniciamos automáticamente por un simple mousemove
            // Exigimos que el usuario interactúe con el botón "Continuar trabajando"
            if (warningActiveRef.current) return;

            if (!throttleTimeout) {
                lastActivityRef.current = Date.now();
                throttleTimeout = setTimeout(() => {
                    throttleTimeout = null;
                }, 1000);
            }
        };

        const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'wheel'];
        events.forEach(event => window.addEventListener(event, updateActivity, { passive: true }));

        // Intervalo de comprobación cada segundo
        const interval = setInterval(() => {
            if (isPublicPath) return;

            const inactiveDuration = Date.now() - lastActivityRef.current;

            if (inactiveDuration >= TOTAL_TIMEOUT_MS) {
                // Se cumplieron los 30 minutos
                handleAutoLogout();
            } else if (inactiveDuration >= WARNING_THRESHOLD_MS) {
                // Estamos en el último minuto (minuto 29 a 30)
                if (!warningActiveRef.current) {
                    warningActiveRef.current = true;
                    setShowWarning(true);
                }
                const remaining = Math.max(0, Math.ceil((TOTAL_TIMEOUT_MS - inactiveDuration) / 1000));
                setSecondsLeft(remaining);
            } else {
                if (warningActiveRef.current) {
                    warningActiveRef.current = false;
                    setShowWarning(false);
                }
            }
        }, 1000);

        return () => {
            events.forEach(event => window.removeEventListener(event, updateActivity));
            clearInterval(interval);
            if (throttleTimeout) clearTimeout(throttleTimeout);
        };
    }, [isPublicPath, handleAutoLogout]);

    if (isPublicPath || !showWarning) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-amber-200 text-center space-y-5 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Clock className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-700 uppercase tracking-wider">
                        <ShieldAlert className="w-3.5 h-3.5" /> Seguridad de Box / SOME
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900">
                        ¿Sigues trabajando ahí?
                    </h3>
                    <p className="text-sm text-slate-600 font-medium">
                        Por seguridad y protección de datos clínicos, tu sesión se cerrará automáticamente por inactividad en:
                    </p>
                </div>

                {/* Contador regresivo grande */}
                <div className="py-3 px-6 bg-slate-900 rounded-2xl inline-block">
                    <span className="text-4xl font-black text-amber-400 font-mono tracking-wider">
                        00:{String(secondsLeft).padStart(2, '0')}
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                        onClick={handleStayActive}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Continuar trabajando
                    </button>
                    <button
                        onClick={handleAutoLogout}
                        className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
                    >
                        Cerrar sesión ahora
                    </button>
                </div>
            </div>
        </div>
    );
}
