'use client';

import { useState } from 'react';
import { BlockingRequest } from '@/lib/db';
import { Official } from '@/app/admin/personnel/actions';
import { X, Upload, User, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface ProcessingModalProps {
    request: BlockingRequest;
    personnel: Official[];
    onClose: () => void;
    onSuccess: (updatedRequest: BlockingRequest) => void;
}

export default function ProcessingModal({ request, personnel, onClose, onSuccess }: ProcessingModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [assignedAdmin, setAssignedAdmin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !assignedAdmin) {
            setError('Por favor complete todos los campos.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Upload File
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) throw new Error('Error al subir el archivo');
            const { url: pdfUrl } = await uploadRes.json();

            // 2. Update Request
            const updateRes = await fetch(`/api/requests/${request.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agendaBlockedStatus: 'Realizado',
                    pdfUrl,
                    assignedAdmin
                }),
            });

            if (!updateRes.ok) throw new Error('Error al actualizar la solicitud');
            const updatedData = await updateRes.json();

            onSuccess(updatedData);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
                    <h3 className="text-xl font-bold">Procesar Solicitud de Bloqueo</h3>
                    <button onClick={onClose} aria-label="Cerrar modal" className="hover:bg-white/20 p-1 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleUpload} className="p-6 space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                        <p><strong>Profesional:</strong> {request.professionalName}</p>
                        <p><strong>Tipo:</strong> {request.blockType}</p>
                        <p><strong>Horas:</strong> {request.startTime} - {request.endTime}</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Subir Solicitud de Bloqueo (PDF)</label>
                        <label htmlFor="file-upload" className="sr-only">Subir archivo PDF</label>
                        <div className={clsx(
                            "relative border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer",
                            file ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30"
                        )}>
                            <input
                                id="file-upload"
                                type="file"
                                accept=".pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            {file ? (
                                <>
                                    <CheckCircle2 size={32} className="text-green-500" />
                                    <span className="text-sm font-medium text-green-700">{file.name}</span>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-red-500 underline">Cambiar archivo</button>
                                </>
                            ) : (
                                <>
                                    <Upload size={32} className="text-gray-400" />
                                    <span className="text-sm text-gray-500">Haz clic o arrastra un archivo PDF</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <User size={16} className="text-blue-600" />
                            Asignar Administrativo para Llamados
                        </label>
                        <input
                            type="text"
                            list="personnel-list"
                            aria-label="Nombre del administrativo"
                            placeholder="Nombre del administrativo..."
                            value={assignedAdmin}
                            onChange={(e) => setAssignedAdmin(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                        <datalist id="personnel-list">
                            {personnel.map((p, i) => (
                                <option key={i} value={p.name} />
                            ))}
                        </datalist>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !file || !assignedAdmin}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {loading ? 'Procesando...' : 'Finalizar Bloqueo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
