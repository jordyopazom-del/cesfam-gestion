'use client';

import { useState, useEffect } from 'react';
import { User, Search, Mail, ChevronRight, Info, Ghost, Baby, Users, Coins, Plus, Trash2, X, Loader2, Lock, Shield, Clock } from 'lucide-react';
import styles from './dashboard.module.css';
import { formatRequestType } from '@/lib/utils';

interface Balance {
    type: string;
    total: number;
    used: number;
    remaining: number;
}

interface Official {
    id: string;
    name: string | null;
    email: string;
    role: string;
    balances: Balance[];
    _count: {
        requests: number;
    };
}

export default function OfficialsModule() {
    const [officials, setOfficials] = useState<Official[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    // Form state for new official
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'OFFICIAL',
        contractedHours: 44
    });

    useEffect(() => {
        fetchOfficials();
    }, []);

    const fetchOfficials = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/solicitudes/admin/officials');
            if (res.ok) {
                const data = await res.json();
                setOfficials(data);
            }
        } catch (error) {
            console.error('Error fetching officials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOfficial = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/solicitudes/admin/officials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchOfficials();
                setIsCreateModalOpen(false);
                setFormData({ name: '', email: '', password: '', role: 'OFFICIAL', contractedHours: 44 });
            } else {
                const err = await res.json();
                alert(err.message || 'Error al crear el funcionario');
            }
        } catch (error) {
            console.error('Error creating official:', error);
            alert('Error de conexión');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteOfficial = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar permanentemente a este funcionario? Esta acción no se puede deshacer.')) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/solicitudes/admin/officials/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setOfficials(officials.filter(o => o.id !== id));
                setSelectedOfficial(null);
            }
        } catch (error) {
            console.error('Error deleting official:', error);
            alert('Error al eliminar funcionario');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleResetPassword = async (id: string) => {
        if (!newPassword) {
            alert('Por favor ingrese una nueva contraseña');
            return;
        }

        setIsResettingPassword(true);
        try {
            const res = await fetch(`/api/solicitudes/admin/officials/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword })
            });

            if (res.ok) {
                alert('Contraseña restablecida con éxito');
                setNewPassword('');
            } else {
                const error = await res.json();
                alert('Error: ' + error.message);
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            alert('Error al restablecer la contraseña');
        } finally {
            setIsResettingPassword(false);
        }
    };

    const filteredOfficials = officials.filter(o =>
    (o.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getIcon = (type: string) => {
        switch (type) {
            case 'SIN_GOCE': return <Coins size={14} className={styles.textMuted} />;
            case 'MATRIMONIO': return <Users size={14} className={styles.iconPink} />;
            case 'NACIMIENTO': return <Baby size={14} className={styles.iconBlue} />;
            case 'FALLECIMIENTO_CONYUGE':
            case 'FALLECIMIENTO_PARIENTE':
            case 'FALLECIMIENTO_HIJO': return <Ghost size={14} className={styles.textMuted} />;
            default: return <Info size={14} className={styles.textPrimary} />;
        }
    };

    return (
        <div className="animate-fade-in">
            <header className={styles.dashboardHeader}>
                <div className={styles.flexBetween}>
                    <div>
                        <h1 className={styles.dashboardTitle}>Gestión de Funcionarios</h1>
                        <p className={styles.dashboardSubtitle}>Administra el personal y consulta sus saldos vigentes.</p>
                    </div>
                    <button
                        className={styles.btnAdd}
                        onClick={() => setIsCreateModalOpen(true)}
                        title="Registrar nuevo funcionario en el sistema"
                    >
                        <Plus size={20} />
                        Nuevo Funcionario
                    </button>
                </div>
            </header>

            <div className={`glass-panel ${styles.searchBar}`}>
                <Search size={18} className={styles.textMuted} />
                <input
                    type="text"
                    placeholder="Buscar funcionario por nombre o email..."
                    className={`glass-input ${styles.ml1} ${styles.flex1} ${styles.borderNone} ${styles.bgNone}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className={styles.grid}>
                {loading ? (
                    <div className={styles.emptyState}>Cargando funcionarios...</div>
                ) : filteredOfficials.length === 0 ? (
                    <div className={styles.emptyState}>No se encontraron funcionarios.</div>
                ) : (
                    filteredOfficials.map(official => (
                        <div
                            key={official.id}
                            className={`glass-panel ${styles.card} animate-fade-in ${styles.cursorPointer}`}
                            onClick={() => setSelectedOfficial(official)}
                        >
                            <div className={styles.flexBetween}>
                                <div className={styles.flexGap}>
                                    <div className={styles.iconCircle}>
                                        <User size={24} className={styles.textPrimary} />
                                    </div>
                                    <div>
                                        <div className={`${styles.fw600} ${styles.textLg}`}>{official.name || 'Sin nombre'}</div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className={styles.textMuted} />
                            </div>

                            <div className={styles.officialStats}>
                                <div className={`glass-panel ${styles.officialStatCard}`}>
                                    <div className={styles.textTinyMuted}>Solicitudes</div>
                                    <div className={styles.fw600}>{official._count.requests}</div>
                                </div>
                                <div className={`glass-panel ${styles.officialStatCard}`}>
                                    <div className={styles.textTinyMuted}>Rol</div>
                                    <div className={styles.userRoleBadge}>{official.role === 'ADMIN' ? 'Admin' : 'Funcionario'}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Detalles del Funcionario */}
            {selectedOfficial && (
                <div className={styles.modalOverlay} onClick={() => setSelectedOfficial(null)}>
                    <div className={`glass-panel ${styles.modalContent} ${styles.modalLarge}`} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.flexGap}>
                                <User size={28} className={styles.textPrimary} />
                                <div>
                                    <h2 className={styles.dashboardTitle}>{selectedOfficial.name || 'Detalles'}</h2>
                                </div>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setSelectedOfficial(null)} title="Cerrar detalles">
                                <X size={24} className={styles.textMuted} />
                            </button>
                        </div>

                        <div className={styles.mt2}>
                            <h3 className={`${styles.fw600} ${styles.mb1} ${styles.flexGap}`}>
                                <Info size={18} className={styles.textPrimary} />
                                Saldos Disponibles (2026)
                            </h3>

                            <div className={styles.balanceGrid}>
                                {selectedOfficial.balances.map((balance, bIdx) => (
                                    <div key={bIdx} className={`glass-panel ${styles.balanceCard}`}>
                                        <div className={styles.flexBetween}>
                                            <span className={styles.textTinyMuted}>{formatRequestType(balance.type)}</span>
                                            {getIcon(balance.type)}
                                        </div>
                                        <div className={`${styles.flexBetween} ${styles.alignEnd} ${styles.mt05}`}>
                                            <div className={`${styles.fw700} ${styles.textXl}`}>{balance.remaining}</div>
                                            <div className={styles.textTinyMuted}>de {balance.total} d</div>
                                        </div>
                                        <div className={styles.progressTrack}>
                                            <div className={styles.progressFill} style={{ width: `${(balance.remaining / balance.total) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.mt2}>
                            <h3 className={`${styles.fw600} ${styles.mb1} ${styles.flexGap}`}>
                                <Lock size={18} className={styles.textPrimary} />
                                Seguridad y Acceso
                            </h3>
                            <div className={`glass-panel ${styles.p1} ${styles.flexGap} ${styles.alignEnd}`}>
                                <div className={styles.flex1}>
                                    <label className={styles.textTinyMuted}>Restablecer Contraseña</label>
                                    <div className={styles.inputIconWrapper}>
                                        <Lock size={14} className={styles.inputIcon} />
                                        <input
                                            type="password"
                                            className={`glass-input ${styles.premiumInput}`}
                                            style={{ padding: '0.6rem 0.6rem 0.6rem 2.5rem !important' }}
                                            placeholder="Nueva clave temporal"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    className={styles.btnPrimaryLarge}
                                    style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem' }}
                                    onClick={() => handleResetPassword(selectedOfficial.id)}
                                    disabled={isResettingPassword}
                                >
                                    {isResettingPassword ? <Loader2 size={16} className="animate-spin" /> : 'Restablecer Clave'}
                                </button>
                            </div>
                        </div>

                        <div className={styles.modalActions}>

                            <button
                                className={styles.deleteBtn}
                                onClick={() => handleDeleteOfficial(selectedOfficial.id)}
                                disabled={isDeleting}
                                title="Eliminar permanentemente a este funcionario"
                            >
                                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                Eliminar Funcionario
                            </button>
                            <button
                                className={styles.btnPrimaryLarge}
                                onClick={() => setSelectedOfficial(null)}
                                title="Cerrar ventana de detalles"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Creación de Funcionario */}
            {isCreateModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`glass-panel ${styles.modalContent} ${styles.modalLarge}`} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.flexGap}>
                                <div className={styles.iconCircle}>
                                    <Plus size={24} className={styles.textPrimary} />
                                </div>
                                <div>
                                    <h2 className={styles.dashboardTitle}>Nuevo Funcionario</h2>
                                    <p className={styles.textMutedSmall}>Registra un nuevo miembro en el equipo.</p>
                                </div>
                            </div>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setIsCreateModalOpen(false)}
                                title="Cerrar formulario de registro"
                            >
                                <X size={24} className={styles.textMuted} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOfficial} className={styles.mt2}>
                            <div className={styles.modalGrid}>
                                <div className={styles.formGroup}>
                                    <label>Nombre Completo</label>
                                    <div className={styles.inputIconWrapper}>
                                        <User size={18} className={styles.inputIcon} />
                                        <input
                                            type="text"
                                            className={`glass-input ${styles.premiumInput}`}
                                            placeholder="Ej: Juan Pérez"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Correo Electrónico</label>
                                    <div className={styles.inputIconWrapper}>
                                        <Mail size={18} className={styles.inputIcon} />
                                        <input
                                            type="email"
                                            className={`glass-input ${styles.premiumInput}`}
                                            placeholder="ejemplo@correo.com"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Contraseña Temporal</label>
                                    <div className={styles.inputIconWrapper}>
                                        <Lock size={18} className={styles.inputIcon} />
                                        <input
                                            type="password"
                                            className={`glass-input ${styles.premiumInput}`}
                                            placeholder="Mínimo 6 caracteres"
                                            required
                                            minLength={6}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Rol del Usuario</label>
                                    <div className={styles.inputIconWrapper}>
                                        <Shield size={18} className={styles.inputIcon} />
                                        <select
                                            className={`glass-input ${styles.premiumInput}`}
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                            title="Seleccionar rol del funcionario"
                                        >
                                            <option value="OFFICIAL">Funcionario Estándar</option>
                                            <option value="ADMIN">Administrador</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Horas Contratadas</label>
                                    <div className={styles.inputIconWrapper}>
                                        <Clock size={18} className={styles.inputIcon} />
                                        <select
                                            className={`glass-input ${styles.premiumInput}`}
                                            value={formData.contractedHours}
                                            onChange={e => setFormData({ ...formData, contractedHours: Number(e.target.value) })}
                                            title="Seleccionar horas de contrato"
                                        >
                                            <option value={44}>44 Horas</option>
                                            <option value={33}>33 Horas</option>
                                            <option value={22}>22 Horas</option>
                                            <option value={11}>11 Horas</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className={`${styles.modalActions} ${styles.mt1}`}>
                                <button
                                    type="button"
                                    className={`${styles.textMuted} ${styles.borderNone} ${styles.bgNone} ${styles.cursorPointer}`}
                                    onClick={() => setIsCreateModalOpen(false)}
                                    title="Cancelar creación"
                                >
                                    Cancelar Registro
                                </button>
                                <button
                                    type="submit"
                                    className={styles.btnPrimaryLarge}
                                    disabled={isSubmitting}
                                    title="Confirmar creación de funcionario"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Crear Cuenta de Funcionario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
