'use client';

import { useState, useEffect } from 'react';
import { Search, User, BarChart3, Download } from 'lucide-react';
import styles from './dashboard.module.css';
import { formatRequestType } from '@/lib/utils';

interface UserReport {
    id: string;
    name: string | null;
    email: string;
    summary: Record<string, number>;
    totalDays: number;
}

export default function ReportsModule() {
    const [reports, setReports] = useState<UserReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/solicitudes/admin/reports');
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = reports.filter(r =>
    (r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const exportToCSV = () => {
        const headers = ["Funcionario", "Email", "Tipo", "Días Utilizados"];
        const rows = reports.flatMap(r =>
            Object.entries(r.summary).map(([type, days]) => [
                r.name || 'Sin nombre',
                r.email,
                formatRequestType(type),
                days.toString()
            ])
        );

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `reporte_asistencia_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="animate-fade-in">
            <header className={styles.dashboardHeader}>
                <div className={styles.flexBetween}>
                    <div>
                        <h1 className={styles.dashboardTitle}>Reportes de Asistencia</h1>
                        <p className={styles.dashboardSubtitle}>Resumen detallado de permisos utilizados por funcionario.</p>
                    </div>
                    <button
                        className={styles.btnAdd}
                        onClick={exportToCSV}
                        title="Descargar reporte en formato CSV"
                    >
                        <Download size={18} />
                        Exportar CSV
                    </button>
                </div>
            </header>

            <div className={`glass-panel ${styles.searchBar}`}>
                <Search size={18} className={styles.textMuted} />
                <input
                    type="text"
                    placeholder="Filtrar por nombre o email..."
                    className={`glass-input ${styles.ml1} ${styles.flex1} ${styles.borderNone} ${styles.bgNone}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className={styles.emptyState}>Generando reportes...</div>
            ) : filteredReports.length === 0 ? (
                <div className={styles.emptyState}>No se encontraron datos para mostrar.</div>
            ) : (
                <div className={styles.grid}>
                    {filteredReports.map(report => (
                        <div key={report.id} className={`glass-panel ${styles.card}`}>
                            <div className={`${styles.flexBetween} ${styles.mb15}`}>
                                <div className={styles.flexGap}>
                                    <div className={styles.iconCircle}>
                                        <User size={20} className={styles.textPrimary} />
                                    </div>
                                    <div>
                                        <div className={styles.fw600}>{report.name || 'Sin nombre'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.mt1}>
                                <div className={`${styles.flexGap} ${styles.mb075} ${styles.text09} ${styles.textMuted}`}>
                                    <BarChart3 size={16} />
                                    <span>Desglose por tipo</span>
                                </div>
                                <div className={styles.flexColGap05}>
                                    {Object.entries(report.summary).length === 0 ? (
                                        <div className={`${styles.textTinyMuted} ${styles.italic}`}>Sin permisos aprobados este año.</div>
                                    ) : (
                                        Object.entries(report.summary).map(([type, days]) => (
                                            <div key={type} className={`glass-panel ${styles.flexBetween} ${styles.reportItem}`}>
                                                <span>{formatRequestType(type)}</span>
                                                <span className={styles.fw600}>{days} {days === 1 ? 'día' : 'días'}</span>
                                            </div>
                                        ))
                                    )}
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
