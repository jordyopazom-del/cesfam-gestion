'use client';

import { useState, useEffect } from 'react';
import { COORDINATORS, LOCATIONS } from '@/data/constants';
import { Loader2, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import TimeInput from './TimeInput';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import { Official } from '@/app/admin/personnel/actions';

const PERFORMANCES = [10, 15, 20, 30, 40, 45, 60];
const REQUEST_TYPES = ['Apertura', 'Desbloqueo'];
const CATEGORY_TYPES = [
    'Visitas', 'Morbilidad', 'Control', 'Taller', 'Salud Mental', 
    'Ingreso', 'EMPA', 'EMP', 'PAP', 'Fondo de Ojo', 'RX Dental', 
    'RX', 'Cirugia Menor', 'Operativo', 'Kine Motora', 'Kine Respiratoria'
];

export default function AgendaOpeningForm({ onSuccess, personnel }: { onSuccess: () => void, personnel: Official[] }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        coordinator: '',
        location: '',
        profession: '',
        professionalName: '',
        performance: 20,
        startTime: '08:00',
        endTime: '17:00',
        requestType: 'Apertura',
        categoryType: '',
    });

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDays, setSelectedDays] = useState<Date[]>([]);

    const PROFESSIONS = Array.from(new Set(personnel.map(p => p.profession)));
    const filteredNames = personnel.filter(p => p.profession === formData.profession);

    // Calendar Logic
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    // Pad the start of the month
    const startDay = startOfMonth(currentMonth).getDay();
    // Adjust for Monday start (0 is Sunday in JS, but we want Monday as 0 visually usually, but let's stick to Sunday start for simplicity or adjust)
    // Let's use Sunday start for standard calendar view
    const prefixDays = Array.from({ length: (startDay + 6) % 7 });

    const toggleDay = (day: Date) => {
        if (selectedDays.some(d => isSameDay(d, day))) {
            setSelectedDays(prev => prev.filter(d => !isSameDay(d, day)));
        } else {
            setSelectedDays(prev => [...prev, day]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedDays.length === 0) {
            alert('Por favor seleccione al menos un día en el calendario.');
            return;
        }

        setIsSubmitting(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const payload = {
                ...formData,
                selectedDays: selectedDays.map(d => d.toISOString()),
            };

            const res = await fetch('/api/agenda-openings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSuccessMessage('Solicitud de apertura enviada con éxito');
                setFormData({
                    coordinator: '',
                    location: '',
                    profession: '',
                    professionalName: '',
                    performance: 20,
                    startTime: '08:00',
                    endTime: '17:00',
                    requestType: 'Apertura',
                    categoryType: '',
                });
                setSelectedDays([]);
                onSuccess();
                setTimeout(() => setSuccessMessage(''), 3000);
            } else if (res.status === 409) {
                const data = await res.json();
                setErrorMessage(data.message || 'El profesional ya tiene una apertura de agenda en ese horario.');
            } else {
                setErrorMessage('Error al enviar la solicitud. Intente nuevamente.');
            }
        } catch (error) {
            console.error(error);
            setErrorMessage('Error de conexión al enviar la solicitud.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const [todayStr, setTodayStr] = useState('');

    useEffect(() => {
        setTodayStr(new Date().toLocaleDateString());
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'profession') {
                newData.professionalName = '';
            }
            return newData;
        });
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-blue-600 flex items-center gap-2">
                📅 Solicitud de Apertura de Agenda
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Fecha y Coordinador en una fila */}
                    <div>
                        <label htmlFor="fecha-solicitud" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Solicitud</label>
                        <input
                            id="fecha-solicitud"
                            type="text"
                            value={todayStr}
                            disabled
                            className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label htmlFor="coordinator" className="block text-sm font-medium text-gray-700 mb-1">Coordinador Solicitante</label>
                        <select
                            id="coordinator"
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

                    {/* Fila Nueva: Tipo de Solicitud y Tipo */}
                    <div>
                        <label htmlFor="requestType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Solicitud</label>
                        <select
                            id="requestType"
                            name="requestType"
                            required
                            value={formData.requestType}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        >
                            {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="categoryType" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                            id="categoryType"
                            name="categoryType"
                            required
                            value={formData.categoryType}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        >
                            <option value="">Seleccione Tipo</option>
                            {CATEGORY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Lugar y Rendimiento en una fila */}
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Lugar de Apertura</label>
                        <select
                            id="location"
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

                    <div>
                        <label htmlFor="performance" className="block text-sm font-medium text-gray-700 mb-1">Rendimiento (Minutos)</label>
                        <select
                            id="performance"
                            name="performance"
                            required
                            value={formData.performance}
                            onChange={(e) => setFormData(prev => ({ ...prev, performance: Number(e.target.value) }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        >
                            {PERFORMANCES.map(perf => (
                                <option key={perf} value={perf}>{perf} min</option>
                            ))}
                        </select>
                    </div>

                    {/* Profesión y Nombre Profesional */}
                    <div>
                        <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1">Profesión</label>
                        <select
                            id="profession"
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

                    <div>
                        <label htmlFor="professionalName" className="block text-sm font-medium text-gray-700 mb-1">Nombre Profesional</label>
                        <select
                            id="professionalName"
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

                    {/* Times */}
                    <div>
                        <TimeInput
                            label="Hora Inicio"
                            value={formData.startTime}
                            onChange={(val: string) => setFormData(prev => ({ ...prev, startTime: val }))}
                            required
                        />
                    </div>
                    <div>
                        <TimeInput
                            label="Hora Término"
                            value={formData.endTime}
                            onChange={(val: string) => setFormData(prev => ({ ...prev, endTime: val }))}
                            required
                        />
                    </div>

                    {/* Calendar Selection (Unified Layout) */}
                    <div className="col-span-2">
                        <label className="block text-lg font-semibold text-gray-800 mb-4">Seleccione los días de apertura</label>
                        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <button
                                    type="button"
                                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                    className="p-2 hover:bg-gray-100 rounded-full transition"
                                    aria-label="Mes anterior"
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
                                    aria-label="Mes siguiente"
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
                                {prefixDays.map((_, i) => <div key={`empty-${i}`} />)}
                                {daysInMonth.map(day => {
                                    const isSelected = selectedDays.some(d => isSameDay(d, day));
                                    return (
                                        <button
                                            key={day.toISOString()}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={clsx(
                                                "h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all duration-200",
                                                isSelected ? "bg-blue-600 text-white shadow-md scale-105" : "hover:bg-blue-50 text-gray-700",
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
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Enviar Solicitud de Apertura'}
                    </button>
                </div>

                {successMessage && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle size={20} />
                        {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg flex items-start gap-3">
                        <span className="text-red-500 mt-0.5 flex-shrink-0">⚠️</span>
                        <span className="text-sm font-medium">{errorMessage}</span>
                    </div>
                )}
            </form>
        </div>
    );
}
