'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './dashboard.module.css';
import { formatRequestType } from '@/lib/utils';

interface Request {
    id: string;
    type: string;
    start_date: Date;
    end_date: Date;
    days: number;
    status: string;
    description: string | null;
    halfDayPeriod?: string | null;
    user: {
        name: string | null;
        email: string;
    };
}

export default function AdminDashboard({ pendingRequests, todayAbsences, calendarData }: { pendingRequests: Request[], todayAbsences: number, calendarData: Record<number, string[]> }) {
    const router = useRouter();
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [localRequests, setLocalRequests] = useState<Request[]>(pendingRequests);
    const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

    // Calendar Navigation State
    const [viewDate, setViewDate] = useState(new Date());
    const [localCalendarData, setLocalCalendarData] = useState<Record<number, string[]>>(calendarData);
    const [isCalendarLoading, setIsCalendarLoading] = useState(false);

    // Sync local state with props when server data changes (for current month)
    useEffect(() => {
        setLocalRequests(pendingRequests);
        // Only update local calendar if we are looking at the current month
        const now = new Date();
        if (viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear()) {
            setLocalCalendarData(calendarData);
        }
    }, [pendingRequests, calendarData, viewDate]);

    const fetchCalendarData = async (month: number, year: number) => {
        setIsCalendarLoading(true);
        try {
            const res = await fetch(`/api/solicitudes/dashboard?month=${month}&year=${year}`);
            if (res.ok) {
                const data = await res.json();
                setLocalCalendarData(data.adminData.monthAbsences);
                setSelectedDay(null);
            }
        } catch (error) {
            console.error('Error fetching calendar data:', error);
        } finally {
            setIsCalendarLoading(false);
        }
    };

    const handleMonthChange = (offset: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
        fetchCalendarData(newDate.getMonth(), newDate.getFullYear());
    };

    // Calculate calendar details
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    // Adjust to Mon=0, Sun=6
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const emptyDays = Array.from({ length: adjustedFirstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const monthName = viewDate.toLocaleString('es-ES', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const handleDayClick = (day: number) => {
        if (localCalendarData[day]) {
            setSelectedDay(day === selectedDay ? null : day);
        } else {
            setSelectedDay(null);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/solicitudes/requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                // Optimistic UI: Mark for removal
                setRemovingIds(prev => new Set(prev).add(id));

                // Wait for animation
                setTimeout(() => {
                    setLocalRequests(prev => prev.filter(r => r.id !== id));
                    setRemovingIds(prev => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                    });
                    router.refresh();
                }, 300);
            } else {
                const errorText = await res.text();
                alert(`Error: ${errorText}`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error de conexión al procesar la solicitud.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="animate-fade-in">
            <header className={styles.dashboardHeader}>
                <h1 className={styles.dashboardTitle}>Panel de Administración</h1>
                <p className={styles.dashboardSubtitle}>Vista global de asistencia y solicitudes.</p>
            </header>

            <div className={styles.grid}>
                <div className={`glass-panel ${styles.card}`}>
                    <div className={styles.balanceTitle}>Pendientes de Aprobación</div>
                    <div className={styles.balanceValue}>{localRequests.length}</div>
                </div>
                <div className={`glass-panel ${styles.card}`}>
                    <div className={styles.balanceTitle}>Funcionarios de Permiso (Hoy)</div>
                    <div className={`${styles.balanceValue} ${styles.textDanger}`}>{todayAbsences}</div>
                </div>
            </div>

            <div className={`glass-panel ${styles.calendar}`}>
                <div className={styles.flexBetween} style={{ marginBottom: '1.5rem' }}>
                    <div className={styles.flexGap}>
                        <h2 className={styles.fw600} style={{ fontSize: '1.2rem', minWidth: '180px' }}>
                            {capitalizedMonth} {viewDate.getFullYear()}
                        </h2>
                        <div className={styles.calendarNav}>
                            <button
                                className={styles.navBtn}
                                onClick={() => handleMonthChange(-1)}
                                title="Mes anterior"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                className={styles.navBtn}
                                onClick={() => handleMonthChange(1)}
                                title="Mes siguiente"
                            >
                                <ChevronRight size={18} />
                            </button>
                            {isCalendarLoading && <Loader2 size={18} className="animate-spin text-primary" />}
                        </div>
                    </div>
                    <div className={styles.flexGap}>
                        <div className={styles.flexGap} style={{ fontSize: '0.875rem' }}>
                            <div className={styles.dot}></div>
                            <span>Ausencias</span>
                        </div>
                    </div>
                </div>

                <div className={styles.calendarGrid}>
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                        <div key={d} className={styles.dayHeader}>{d}</div>
                    ))}
                    {emptyDays.map(i => (
                        <div key={`empty-${i}`} className={styles.dayEmpty}></div>
                    ))}
                    {days.map(day => (
                        <div
                            key={day}
                            className={`${styles.day} ${selectedDay === day ? styles.daySelected : ''} ${localCalendarData[day] ? styles.dayWithData : ''}`}
                            onClick={() => handleDayClick(day)}
                            style={{ cursor: localCalendarData[day] ? 'pointer' : 'default' }}
                        >
                            <span>{day}</span>
                            {localCalendarData[day] && (
                                <div className={styles.dayDots}>
                                    {localCalendarData[day].slice(0, 3).map((_, i) => (
                                        <User key={i} size={10} className={styles.textPrimary} />
                                    ))}
                                    {localCalendarData[day].length > 3 && <span className={styles.textTiny}>+</span>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {selectedDay && localCalendarData[selectedDay] && (
                    <div className={`animate-fade-in ${styles.dayDetails}`}>
                        <div className={styles.flexBetween} style={{ marginBottom: '1rem' }}>
                            <div className={styles.flexGap}>
                                <h3 className={styles.fw600} style={{ fontSize: '1rem' }}>Funcionarios de permiso el día {selectedDay} de {capitalizedMonth}</h3>
                            </div>
                            <button className={styles.textMuted} onClick={() => setSelectedDay(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Cerrar</button>
                        </div>

                        <div className={styles.modalGrid}>
                            {localCalendarData[selectedDay].map((name, i) => (
                                <div key={i} className={`glass-panel ${styles.flexGap}`} style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem' }}>
                                    <User size={14} className={styles.textPrimary} />
                                    <span className={styles.textSmall}>{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.mt3}>
                <h2 className={styles.sectionTitle}>Gestión de Solicitudes</h2>
                {localRequests.length === 0 ? (
                    <div className={`glass-panel ${styles.emptyState}`}>
                        No hay solicitudes pendientes de validación.
                    </div>
                ) : (
                    <div className={styles.requestList}>
                        {localRequests.map((request) => (
                            <div
                                key={request.id}
                                className={`glass-panel ${styles.requestItem} ${removingIds.has(request.id) ? styles.requestRemoving : ''}`}
                            >
                                <div className={styles.flexBetween}>
                                    <div>
                                        <div className={styles.fw600}>{request.user.name || request.user.email}</div>
                                        <div className={styles.textMutedSmall}>
                                            {formatRequestType(request.type)} • {new Date(request.start_date).toLocaleDateString()}
                                            {request.days > 1 ? ` al ${new Date(request.end_date).toLocaleDateString()}` : ''}
                                            {request.halfDayPeriod ? ` (${request.halfDayPeriod})` : ''}
                                            {` (${request.days} ${request.days === 1 || request.days === 0.5 ? 'día' : 'días'})`}
                                        </div>
                                    </div>
                                    <div className={styles.flexGap}>
                                        <button
                                            className={`${styles.actionBtn} ${styles.approveBtn}`}
                                            title="Aprobar"
                                            onClick={() => handleStatusUpdate(request.id, 'APPROVED')}
                                            disabled={!!processingId}
                                        >
                                            {processingId === request.id ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                            title="Rechazar"
                                            onClick={() => handleStatusUpdate(request.id, 'REJECTED')}
                                            disabled={!!processingId}
                                        >
                                            <XCircle size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
