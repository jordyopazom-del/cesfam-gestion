'use client';

import { useState, useEffect } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import styles from './dashboard.module.css';

interface RequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    balances?: { type: string; remaining: number }[];
}

export default function RequestModal({ isOpen, onClose, balances = [] }: RequestModalProps) {
    const [type, setType] = useState('ADMINISTRATIVO');

    // Get balance for selected type
    const currentBalance = balances.find(b => b.type === type);
    const feriadoBalance = balances.find(b => b.type === 'FERIADO LEGAL')?.remaining || 0;

    const [start_date, setStartDate] = useState('');
    const [end_date, setEndDate] = useState('');
    const [description, setDescription] = useState('');
    const [isHalfDay, setIsHalfDay] = useState(false);
    const [halfDayPeriod, setHalfDayPeriod] = useState('AM');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setType('ADMINISTRATIVO');
            setStartDate('');
            setEndDate('');
            setDescription('');
            setIsHalfDay(false);
            setHalfDayPeriod('AM');
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Business Rule Check: Vacation Reminder
    const now = new Date();
    const isAfterOct30 = (now.getMonth() === 9 && now.getDate() >= 30) || now.getMonth() > 9;
    const showVacationReminder = isAfterOct30 && feriadoBalance > 0;

    const calculateBusinessDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const s = new Date(start);
        const e = new Date(end);
        let count = 0;
        const cur = new Date(s);
        while (cur <= e) {
            const dayOfWeek = cur.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    };

    const requestedDays = isHalfDay ? 0.5 : calculateBusinessDays(start_date, end_date);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Business Rule: Check balance
        const balance = currentBalance?.remaining || 0;
        if (balance <= 0 || requestedDays > balance) {
            setError('Saldo de días insuficiente');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/solicitudes/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    start_date,
                    end_date: isHalfDay ? start_date : end_date,
                    description,
                    isHalfDay,
                    halfDayPeriod: isHalfDay ? halfDayPeriod : null
                })
            });

            if (res.ok) {
                alert('Solicitud enviada con éxito. Se ha enviado un correo de confirmación.');
                onClose();
                window.location.reload();
            } else {
                const errorText = await res.text();
                setError(`Error: ${errorText}`);
            }
        } catch (error) {
            console.error(error);
            setError('Error de conexión al servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={`glass-panel animate-fade-in ${styles.modalContent}`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.dashboardTitle}>Nueva Solicitud</h2>
                    <button
                        onClick={onClose}
                        className={styles.closeBtn}
                        title="Cerrar"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {showVacationReminder && (
                        <div className={styles.alertWarning}>
                            <AlertCircle size={20} />
                            <span>
                                Recuerde que debe hacer uso de sus días de vacaciones antes del 31 de diciembre del presente año.
                            </span>
                        </div>
                    )}

                    {error && (
                        <div className={styles.alertError}>
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}


                    <div className={styles.formSection}>
                        <label htmlFor="block_type" className={styles.formLabel}>Tipo de Solicitud</label>
                        <select
                            id="block_type"
                            name="block_type"
                            className={`glass-input ${styles.inputFull}`}
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            title="Seleccionar tipo de solicitud"
                        >
                            <option value="ADMINISTRATIVO">Permiso Administrativo</option>
                            <option value="FERIADO LEGAL">Feriado Legal (Vacaciones)</option>
                            <option value="CAPACITACION">Permiso de Capacitación</option>
                            <option value="SIN_GOCE">Permiso sin Goce</option>
                            <option value="MATRIMONIO">Permiso de Matrimonio</option>
                            <option value="NACIMIENTO">Permiso de Nacimiento</option>
                            <option value="FALLECIMIENTO_CONYUGE">Fallecimiento Hijo Gestación o Cónyuge</option>
                            <option value="FALLECIMIENTO_PARIENTE">Fallecimiento Hermano o Padres</option>
                            <option value="FALLECIMIENTO_HIJO">Fallecimiento Hijo</option>
                        </select>

                        {currentBalance && (
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryItem}>
                                    <span>Saldo actual:</span>
                                    <span className={styles.fw600}>{currentBalance.remaining} días</span>
                                </div>
                                {requestedDays > 0 && (
                                    <>
                                        <div className={styles.summaryItem}>
                                            <span>Días solicitados:</span>
                                            <span className={`${styles.fw600} ${requestedDays > currentBalance.remaining ? styles.textDanger : ''}`}>
                                                - {requestedDays} días
                                            </span>
                                        </div>
                                        <div className={styles.summaryDivider}>
                                            <div className={styles.summaryTotal}>
                                                <span>Saldo resultante:</span>
                                                <span className={requestedDays > currentBalance.remaining ? styles.textDanger : styles.textSuccess}>
                                                    {currentBalance.remaining - requestedDays} días
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {type === 'ADMINISTRATIVO' && (
                        <div className={styles.formSection}>
                            <label className={styles.checkboxGroup}>
                                <input
                                    type="checkbox"
                                    className={styles.checkboxInput}
                                    checked={isHalfDay}
                                    onChange={(e) => setIsHalfDay(e.target.checked)}
                                />
                                Solicitud de medio día
                            </label>

                            {isHalfDay && (
                                <div className={`${styles.periodGroup} ${styles.mt1} animate-fade-in`}>
                                    <label className={styles.radioOption}>
                                        <input
                                            type="radio"
                                            name="period"
                                            value="AM"
                                            checked={halfDayPeriod === 'AM'}
                                            onChange={(e) => setHalfDayPeriod(e.target.value)}
                                            className={styles.radioInput}
                                        />
                                        AM (Mañana)
                                    </label>
                                    <label className={styles.radioOption}>
                                        <input
                                            type="radio"
                                            name="period"
                                            value="PM"
                                            checked={halfDayPeriod === 'PM'}
                                            onChange={(e) => setHalfDayPeriod(e.target.value)}
                                            className={styles.radioInput}
                                        />
                                        PM (Tarde)
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    <div className={`${styles.fieldGroup} ${styles.formSection}`}>
                        <div className={styles.flex1}>
                            <label htmlFor="start_date" className={styles.formLabel}>
                                {isHalfDay ? 'Fecha del permiso' : 'Desde'}
                            </label>
                            <input
                                id="start_date"
                                name="start_date"
                                type="date"
                                className={`glass-input ${styles.inputFull}`}
                                required
                                value={start_date}
                                onChange={(e) => setStartDate(e.target.value)}
                                title="Fecha de inicio"
                            />
                        </div>
                        {!isHalfDay && (
                            <div className={styles.flex1}>
                                <label htmlFor="end_date" className={styles.formLabel}>Hasta</label>
                                <input
                                    id="end_date"
                                    name="end_date"
                                    type="date"
                                    className={`glass-input ${styles.inputFull}`}
                                    required={!isHalfDay}
                                    value={end_date}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    title="Fecha de término"
                                />
                            </div>
                        )}
                    </div>

                    <div className={styles.formSection}>
                        <label htmlFor="description" className={styles.formLabel}>Observaciones</label>
                        <textarea
                            id="description"
                            name="description"
                            className={`glass-input ${styles.textAreaLarge}`}
                            placeholder="Explica brevemente el motivo..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            title="Observaciones adicionales"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`btn-primary ${styles.submitBtn}`}
                    >
                        {loading ? 'Enviando...' : <><Send size={18} /> Enviar Solicitud</>}
                    </button>
                </form>

            </div>
        </div>
    );
}

