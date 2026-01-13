'use client';

import { useState, useEffect } from 'react';
import { BLOCK_TYPES, COORDINATORS, LOCATIONS } from '@/data/constants';
import { Loader2, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import TimeInput from './TimeInput';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import { Official } from '@/app/admin/personnel/actions';

export default function RequestForm({ onSuccess, personnel }: { onSuccess: () => void, personnel: Official[] }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        coordinator: '',
        location: '',
        profession: '',
        professionalName: '',
        blockType: '',
        startTime: '08:00',
        endTime: '17:00',
        otherReason: '',
    });

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDays, setSelectedDays] = useState<Date[]>([]);

    const PROFESSIONS = Array.from(new Set(personnel.map(p => p.profession)));
    const filteredNames = personnel.filter(p => p.profession === formData.profession);

    const toggleDay = (day: Date) => {
        if (day.getDay() === 0) return; // Disable only Sunday (0) if desired, but Saturday (6) is now allowed

        const exists = selectedDays.find(d => isSameDay(d, day));
        if (exists) {
            setSelectedDays(prev => prev.filter(d => !isSameDay(d, day)));
        } else {
            setSelectedDays(prev => [...prev, day]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedDays.length === 0) {
            alert('Debe seleccionar al menos un día');
            return;
        }

        setIsSubmitting(true);
        setSuccessMessage('');

        // Sort days
        const sortedDays = [...selectedDays].sort((a, b) => a.getTime() - b.getTime());
        const startDate = sortedDays[0].toISOString();
        const endDate = sortedDays[sortedDays.length - 1].toISOString();

        try {
            const payload = {
                ...formData,
                blockType: formData.blockType === 'Otros' ? formData.otherReason : formData.blockType,
                selectedDays: sortedDays.map(d => d.toISOString()),
                startDate, // For backward compatibility
                endDate,   // For backward compatibility
            };

            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSuccessMessage('Solicitud enviada con éxito');
                setFormData({
                    coordinator: '',
                    location: '',
                    profession: '',
                    professionalName: '',
                    blockType: '',
                    startTime: '08:00',
                    endTime: '17:00',
                    otherReason: '',
                });
                setSelectedDays([]);
                onSuccess();
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                alert('Error al enviar la solicitud');
            }
        } catch (error) {
            console.error(error);
            alert('Error al enviar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'profession') {
                newData.professionalName = ''; // Reset name when profession changes
            }
            return newData;
        });
    };

    const [todayStr, setTodayStr] = useState('');

    useEffect(() => {
        setTodayStr(new Date().toLocaleDateString());
    }, []);

    // Calendar Rendering Logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Fill start empty days
    const startDayOfWeek = monthStart.getDay(); // 0 = Sunday
    const emptyStartDays = Array.from({ length: (startDayOfWeek + 6) % 7 }, (_, i) => i);

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-red-600 flex items-center gap-2">
                📝 Ingreso de Solicitud de Bloqueo
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Request Date (Automatic) */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Solicitud</label>
                        <input
                            type="text"
                            value={todayStr}
                            disabled
                            className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                    </div>

                    {/* Coordinator */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Coordinador Solicitante</label>
                        <select
                            name="coordinator"
                            required
                            value={formData.coordinator}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        >
                            <option value="">Seleccione Coordinador</option>
                            {COORDINATORS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Location */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de Bloqueo</label>
                        <select
                            name="location"
                            required
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        >
                            <option value="">Seleccione Lugar</option>
                            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>

                    {/* Profession */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Profesión</label>
                        <select
                            name="profession"
                            required
                            value={formData.profession}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        >
                            <option value="">Seleccione Profesión</option>
                            {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    {/* Professional Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Profesional</label>
                        <select
                            name="professionalName"
                            required
                            disabled={!formData.profession}
                            value={formData.professionalName}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            <option value="">Seleccione Nombre</option>
                            {filteredNames.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Block Type */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Bloqueo</label>
                        <select
                            name="blockType"
                            required
                            value={formData.blockType}
                            onChange={handleChange}
                            className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        >
                            <option value="">Seleccione Tipo</option>
                            {BLOCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Other Reason Field */}
                    {formData.blockType === 'Otros' && (
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Especifique el Motivo (Máx. 30 caracteres)</label>
                            <input
                                type="text"
                                name="otherReason"
                                required
                                maxLength={30}
                                value={formData.otherReason}
                                onChange={handleChange}
                                placeholder="Escriba el motivo aquí..."
                                className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                    )}

                    {/* Times */}
                    <div>
                        <TimeInput
                            label="Hora Inicio"
                            value={formData.startTime}
                            onChange={(val) => setFormData(prev => ({ ...prev, startTime: val }))}
                            required
                        />
                    </div>
                    <div>
                        <TimeInput
                            label="Hora Término"
                            value={formData.endTime}
                            onChange={(val) => setFormData(prev => ({ ...prev, endTime: val }))}
                            required
                        />
                    </div>

                    {/* Calendar Selection */}
                    <div className="col-span-2">
                        <label className="block text-lg font-semibold text-gray-800 mb-4">Seleccione los días de bloqueo</label>
                        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <button
                                    type="button"
                                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                    className="p-2 hover:bg-gray-100 rounded-full transition"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <h3 className="text-lg font-bold text-gray-700 capitalize">
                                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                    className="p-2 hover:bg-gray-100 rounded-full transition"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-2 text-center mb-2">
                                {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(day => (
                                    <div key={day} className="text-xs font-medium text-gray-500 uppercase">{day}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {emptyStartDays.map(i => <div key={`empty-${i}`} />)}
                                {daysInMonth.map(day => {
                                    const isSelected = selectedDays.some(d => isSameDay(d, day));
                                    const isWeekendDay = isWeekend(day);
                                    return (
                                        <button
                                            key={day.toISOString()}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={clsx(
                                                "h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all duration-200",
                                                isSelected ? "bg-blue-600 text-white shadow-md scale-105" : "hover:bg-red-50 text-gray-700",
                                                isToday(day) && !isSelected && "border-2 border-blue-200 font-bold",
                                                day.getDay() === 0 && !isSelected && "text-red-400 bg-red-50/50",
                                                day.getDay() === 6 && !isSelected && "text-blue-400 bg-blue-50/50"
                                            )}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-4 text-center text-sm text-gray-500">
                                {selectedDays.length} día(s) seleccionado(s)
                            </div>
                        </div>
                    </div>


                </div>

                <div className="pt-4">
                    <div className="text-sm text-gray-500 mb-2">
                        Fecha de creación: {todayStr} (Automático)
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Enviar Solicitud'}
                    </button>
                </div>

                {successMessage && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle size={20} />
                        {successMessage}
                    </div>
                )}
            </form>
        </div>
    );
}
