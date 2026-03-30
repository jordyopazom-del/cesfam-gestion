'use client';

import { useState } from 'react';
import { BlockingRequest, AgendaOpeningRequest } from '@/lib/db';
import { Official } from '@/app/admin/personnel/actions';
import { X, Upload, User, CheckCircle2, FileText } from 'lucide-react';
import clsx from 'clsx';

interface ProcessingModalProps {
    request: BlockingRequest | AgendaOpeningRequest;
    type: 'Bloqueo' | 'Apertura';
    personnel: Official[];
    onClose: () => void;
    onSuccess: (updated: any) => void;
}

export default function ProcessingModal({ request, type, personnel, onClose, onSuccess }: ProcessingModalProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [assignedAdmin, setAssignedAdmin] = useState('');
    const [isNoPatients, setIsNoPatients] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isNoPatients && (files.length === 0 || !assignedAdmin)) {
            setError('Por favor complete todos los campos.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let pdfUrls: string[] = ['SIN PACIENTES'];
            let adminToSave = 'N/A';

            if (!isNoPatients && files.length > 0) {
                // 1. Upload All Files
                const uploadedUrls: string[] = [];
                for (const file of files) {
                    const formData = new FormData();
                    formData.append('file', file);

                    const uploadRes = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!uploadRes.ok) {
                        const errorData = await uploadRes.json().catch(() => ({}));
                        throw new Error(errorData.details || errorData.error || `Error al subir el archivo: ${file.name}`);
                    }
                    const uploadData = await uploadRes.json();
                    uploadedUrls.push(uploadData.url);
                }
                pdfUrls = uploadedUrls;
                adminToSave = assignedAdmin;
            }

            // 2. Update Request
            const apiUrl = type === 'Bloqueo' ? `/api/requests/${request.id}` : `/api/agenda-openings/${request.id}`;
            const statusKey = type === 'Bloqueo' ? 'agendaBlockedStatus' : 'status';

            const updateRes = await fetch(apiUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    [statusKey]: 'Realizado',
                    pdfUrls,
                    assignedAdmin: adminToSave
                }),
            });

            if (!updateRes.ok) {
                const errorData = await updateRes.json().catch(() => ({}));
                throw new Error(errorData.error || 'Error al actualizar la solicitud');
            }
            const updatedData = await updateRes.json();

            onSuccess(updatedData);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
                    <h3 className="text-xl font-bold">Procesar {type}</h3>
                    <button onClick={onClose} aria-label="Cerrar modal" className="hover:bg-white/20 p-1 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleUpload} className="p-6 space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                        <p><strong>Profesional:</strong> {request.professionalName}</p>
                        {type === 'Bloqueo' ? (
                            <p><strong>Tipo:</strong> {(request as BlockingRequest).blockType}</p>
                        ) : (
                            <>
                                <p><strong>Tipo:</strong> {(request as AgendaOpeningRequest).requestType || 'Apertura'}</p>
                                <p><strong>Categoría:</strong> {(request as AgendaOpeningRequest).categoryType || '-'}</p>
                                <p><strong>Rendimiento:</strong> {(request as AgendaOpeningRequest).performance} min</p>
                            </>
                        )}
                        <p><strong>Horas:</strong> {request.startTime} - {request.endTime}</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg animate-shake">
                            {error}
                        </div>
                    )}

                    {/* Checkbox "Sin Pacientes" */}
                    <div 
                        onClick={() => setIsNoPatients(!isNoPatients)}
                        className={clsx(
                            "flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                            isNoPatients 
                                ? "bg-green-50 border-green-200 text-green-800 ring-2 ring-green-100" 
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        )}
                    >
                        <div className={clsx(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                            isNoPatients ? "bg-green-600 border-green-600" : "bg-white border-gray-300"
                        )}>
                            {isNoPatients && <CheckCircle2 size={16} className="text-white" />}
                        </div>
                        <span className="font-semibold text-sm">Sin pacientes en la agenda (Finalizar inmediatamente)</span>
                    </div>

                    {!isNoPatients && (
                        <>
                            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-semibold text-gray-700">Subir Respaldos (PDFs)</label>
                                
                                {files.length > 0 && (
                                    <div className="space-y-2">
                                        {files.map((f, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded-lg text-xs">
                                                <div className="flex items-center gap-2 text-green-700 font-medium overflow-hidden">
                                                    <FileText size={14} className="shrink-0" />
                                                    <span className="truncate">{f.name}</span>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeFile(i)}
                                                    aria-label={`Eliminar archivo ${f.name}`}
                                                    title={`Eliminar archivo ${f.name}`}
                                                    className="text-red-500 hover:text-red-700 transition"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className={clsx(
                                    "relative border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer",
                                    "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30"
                                )}>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".pdf"
                                        multiple
                                        aria-label="Seleccionar uno o más archivos PDF de respaldo"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                    />
                                    <Upload size={32} className="text-gray-400" />
                                    <span className="text-sm text-gray-500">Haz clic o arrastra uno o más archivos PDF</span>
                                    <span className="text-[10px] text-gray-400">Puedes seleccionar múltiples archivos</span>
                                </div>
                            </div>

                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <User size={16} className="text-blue-600" />
                                    Asignar Funcionario para Llamados
                                </label>
                                <input
                                    type="text"
                                    list="personnel-list"
                                    aria-label="Nombre del funcionario"
                                    placeholder="Nombre del funcionario (Clínico o Administrativo)..."
                                    value={assignedAdmin}
                                    onChange={(e) => setAssignedAdmin(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                <datalist id="personnel-list">
                                    {personnel.map((p, i) => (
                                        <option key={i} value={p.name}>
                                            {p.profession} ({p.type === 'ADMINISTRATIVO' ? 'Admin' : 'Clínico'})
                                        </option>
                                    ))}
                                </datalist>
                            </div>
                        </>
                    )}

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
                            disabled={loading || (!isNoPatients && (files.length === 0 || !assignedAdmin))}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {loading ? 'Procesando...' : `Finalizar ${type}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
