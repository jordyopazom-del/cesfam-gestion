'use client';

import styles from './dashboard.module.css';
import { Clock, Umbrella, GraduationCap, PlusCircle, Users, Baby, Coins, Ghost } from 'lucide-react';
import { formatRequestType, formatStatus } from '@/lib/utils';

interface Balance {
    type: string;
    total: number;
    remaining: number;
}

interface Request {
    id: string;
    type: string;
    start_date: Date;
    end_date: Date;
    days: number;
    status: string;
    description: string | null;
    halfDayPeriod?: string | null;
}

export default function OfficialDashboard({ balances, requests, userName }: { balances: Balance[], requests: Request[], userName?: string | null }) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'ADMINISTRATIVO': return <Clock size={18} className={styles.textPrimary} />;
            case 'CAPACITACION': return <GraduationCap size={18} className={styles.iconCapacitacion} />;
            case 'FERIADO LEGAL': return <Umbrella size={18} className={styles.iconFeriado} />;
            case 'SIN_GOCE': return <Coins size={18} style={{ color: '#94a3b8' }} />;
            case 'MATRIMONIO': return <Users size={18} style={{ color: '#f472b6' }} />;
            case 'NACIMIENTO': return <Baby size={18} style={{ color: '#60a5fa' }} />;
            case 'FALLECIMIENTO_CONYUGE':
            case 'FALLECIMIENTO_PARIENTE':
            case 'FALLECIMIENTO_HIJO': return <Ghost size={18} style={{ color: '#475569' }} />;
            default: return <Clock size={18} className={styles.textPrimary} />;
        }
    };

    const getCardClass = (type: string) => {
        switch (type) {
            case 'ADMINISTRATIVO': return styles.cardAdmin;
            case 'CAPACITACION': return styles.cardCapacitacion;
            case 'FERIADO LEGAL': return styles.cardFeriado;
            case 'SIN_GOCE': return styles.cardMuted;
            case 'MATRIMONIO': return styles.cardPink;
            case 'NACIMIENTO': return styles.cardBlue;
            case 'FALLECIMIENTO_CONYUGE':
            case 'FALLECIMIENTO_PARIENTE':
            case 'FALLECIMIENTO_HIJO': return styles.cardDark;
            default: return '';
        }
    };

    const openModal = () => {
        window.dispatchEvent(new CustomEvent('open-request-modal'));
    };

    return (
        <div className="animate-fade-in">
            <header className={styles.headerWithAction}>
                <div>
                    <h1 className={styles.title}>Mi Resumen {userName && ` - ${userName}`}</h1>
                    <p className={styles.subtitle}>Resumen de días solicitados por tipo de permiso</p>
                </div>
                <button className={styles.quickActionBtn} onClick={openModal}>
                    <PlusCircle size={18} />
                    <span>Nueva Solicitud</span>
                </button>
            </header>

            <div className={styles.grid}>
                {balances.map((balance, index) => (
                    <div key={index} className={`glass-panel ${styles.premiumBalanceCard} ${styles[getCardClass(balance.type)]}`}>
                        <div className={`${styles.flexBetween} ${styles.mb1}`}>
                            <div className={styles.flexGapSmall}>
                                <div className={styles.cardIconBoxSmall}>
                                    {getIcon(balance.type)}
                                </div>
                                <span className={styles.textTinyBold} title={formatRequestType(balance.type)}>{formatRequestType(balance.type)}</span>
                            </div>
                            <span className={styles.balanceValueCompact}>{balance.total - balance.remaining} de {balance.total}</span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${Math.min(100, (balance.remaining / (balance.total || 15)) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.mt3}>
                <h2 className={styles.sectionTitle}>Historial de Solicitudes</h2>

                {requests.length === 0 ? (
                    <div className={`glass-panel ${styles.emptyState}`}>
                        No tienes solicitudes registradas aún.
                    </div>
                ) : (
                    <div className={styles.requestList}>
                        {requests.map((request) => (
                            <div key={request.id} className={`glass-panel ${styles.premiumRequestItem}`}>
                                <div className={styles.flexGap}>
                                    <div className={styles.requestIconSmall}>
                                        {getIcon(request.type)}
                                    </div>
                                    <div>
                                        <div className={`${styles.fw600} ${styles.textSmall}`}>{formatRequestType(request.type)}</div>
                                        <div className={styles.textTinyMuted}>
                                            {new Date(request.start_date).toLocaleDateString()}
                                            {request.days > 1 ? ` al ${new Date(request.end_date).toLocaleDateString()}` : ''}
                                            {request.halfDayPeriod ? ` (${request.halfDayPeriod})` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.flexGap}>
                                    <div className={styles.textSmall}>
                                        <span className={styles.fw600}>{request.days}</span>
                                        <span className={styles.textMuted}> d</span>
                                    </div>
                                    <div className={`${styles.statusBadgeRefined} ${styles[request.status.toLowerCase()]}`}>
                                        <div className={styles.statusIndicator} style={{ backgroundColor: 'currentColor' }}></div>
                                        {formatStatus(request.status)}
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
