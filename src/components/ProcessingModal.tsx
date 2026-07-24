'use client';

import { useState } from 'react';
import { BlockingRequest, AgendaOpeningRequest } from '@/lib/db';
import { Official } from '@/app/admin/personnel/actions';
import { X, User, CheckCircle2, Mail } from 'lucide-react';
import { getMailtoLink } from '@/lib/mailUtils';
import clsx from 'clsx';
import { processUpdateAction } from '@/app/admin/personnel/request-actions';

interface ProcessingModalProps {
    request: BlockingRequest | AgendaOpeningRequest;
    type: 'Bloqueo' | 'Apertura';
    personnel: Official[];
    onClose: () => void;
    onSuccess: (updated: any) => void;
}

export default function ProcessingModal({ request, type, personnel, onClose, onSuccess }: ProcessingModalProps) {
    const [assignedAdmin, setAssignedAdmin] = useState('');
    const [sendEmail, setSendEmail] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!assignedAdmin.trim()) {
            setError('Por favor selecciona o ingresa el funcionario responsable.');
            return;
        }

        let mailWindow: Window | null = null;
        if (sendEmail) {
            mailWindow = window.open('about:blank', '_blank');
        }

        setLoading(true);
        setError(null);

        try {
            const updatedData = await processUpdateAction(request.id, type, {
                status: 'Realizado',
                pdfUrl: ['PROCESADO_EXTENSION_RAS'],
                assignedAdmin: assignedAdmin.trim()
            });

            if (sendEmail && mailWindow) {
                const mailUrl = getMailtoLink(updatedData, type === 'Bloqueo' ? 'blockings' : 'openings', personnel);
                mailWindow.location.href = mailUrl;
            }

            onSuccess(updatedData);
        } catch (updateError: any) {
            if (mailWindow) mailWindow.close();
            console.error('Processing modal error:', updateError);
            setError(updateError.message || 'Error al finalizar la gestión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
                    <div>
                        <h3 className="text-lg font-bold">Asignar y Aprobar {type}</h3>
                        <p className="text-xs text-blue-100 mt-0.5">La extensión RAS enviará los pacientes a Reprogramación</p>
                    </div>
                    <button onClick={onClose} aria-label="Cerrar modal" className="hover:bg-white/20 p-1 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                        <p><strong>Profesional:</strong> {request.professionalName}</p>
                        <p><strong>Solicitante:</strong> {request.coordinator}</p>
                        <p><strong>Horas:</strong> {request.startTime} - {request.endTime}</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                            <User size={15} className="text-blue-600" />
                            Funcionario Responsable (Obligatorio)
                        </label>
                        <input
                            type="text"
                            list="personnel-list"
                            aria-label="Nombre del funcionario"
                            placeholder="Buscar o escribir nombre del funcionario..."
                            value={assignedAdmin}
                            onChange={(e) => setAssignedAdmin(e.target.value)}
                            required
                            className="w-full p-3 text-xs font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                        />
                        <datalist id="personnel-list">
                            {personnel.map((p, i) => (
                                <option key={i} value={p.name}>
                                    {p.profession} ({p.type === 'ADMINISTRATIVO' ? 'Admin' : 'Clínico'})
                                </option>
                            ))}
                        </datalist>
                    </div>

                    <div 
                        onClick={() => setSendEmail(!sendEmail)}
                        className={clsx(
                            "flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                            sendEmail 
                                ? "bg-blue-50 border-blue-200 text-blue-800 ring-2 ring-blue-100" 
                                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                        )}
                    >
                        <div className={clsx(
                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                            sendEmail ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
                        )}>
                            {sendEmail && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                        <Mail size={16} className={sendEmail ? "text-blue-600" : "text-gray-400"} />
                        <span className="font-semibold text-xs">Enviar respaldo por correo al solicitante</span>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-600 font-semibold hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !assignedAdmin.trim()}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-md hover:shadow-lg"
                        >
                            {loading ? 'Procesando...' : 'Confirmar y Enviar Correo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
