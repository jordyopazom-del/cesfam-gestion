'use client';

import { useState, useEffect } from 'react';
import { BlockingRequest, AgendaOpeningRequest } from '@/lib/db';
import { Official } from '@/app/admin/personnel/actions';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Clock, Briefcase } from 'lucide-react';
import clsx from 'clsx';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, addMonths, subMonths, isSameMonth, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CalendarView({ personnel }: { personnel: Official[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [blockings, setBlockings] = useState<BlockingRequest[]>([]);
    const [openings, setOpenings] = useState<AgendaOpeningRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedDayEvent, setSelectedDayEvent] = useState<{
        date: Date,
        blocks: BlockingRequest[],
        opens: AgendaOpeningRequest[]
    } | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const [reqRes, openRes] = await Promise.all([
                    fetch('/api/requests'),
                    fetch('/api/agenda-openings')
                ]);

                if (reqRes.ok && openRes.ok) {
                    setBlockings(await reqRes.json());
                    setOpenings(await openRes.json());
                }
            } catch (error) {
                console.error("Error fetching calendar data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // Calendar Math
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    // start on Monday (weekStartsOn: 1)
    const startDate = startOfWeek(monthStart, { locale: es, weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { locale: es, weekStartsOn: 1 });
    const dateFormat = "yyyy-MM-dd";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const getEventsForDay = (day: Date) => {
        const dayStr = format(day, dateFormat);
        const dayBlocks = blockings.filter(b => b.selectedDays?.some(d => {
            try { return format(new Date(d), dateFormat) === dayStr } catch(e) { return false }
        }));
        const dayOpens = openings.filter(o => o.selectedDays?.some(d => {
            try { return format(new Date(d), dateFormat) === dayStr } catch(e) { return false }
        }));
        return { dayBlocks, dayOpens };
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                        <CalendarIcon className="text-blue-600" size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Calendario Clínico</h2>
                        <p className="text-gray-500 mt-0.5">Vista mensual de ausencias y aperturas</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl">
                    <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="font-bold text-gray-800 w-36 text-center capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                    <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
                    <p>Sincronizando calendario...</p>
                </div>
            ) : (
                <div className="p-6">
                    {/* Header Days */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDays.map(day => (
                            <div key={day} className="text-center font-bold text-xs uppercase tracking-wider text-gray-500 py-2">
                                {day.substring(0, 3)}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {days.map((day, i) => {
                            const { dayBlocks, dayOpens } = getEventsForDay(day);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isTodayDate = isToday(day);
                            const hasEvents = dayBlocks.length > 0 || dayOpens.length > 0;

                            return (
                                <div 
                                    key={day.toISOString()}
                                    onClick={() => hasEvents && setSelectedDayEvent({ date: day, blocks: dayBlocks, opens: dayOpens })}
                                    className={clsx(
                                        "min-h-[100px] border rounded-xl p-2 transition-all flex flex-col",
                                        !isCurrentMonth ? "bg-gray-50/50 border-transparent opacity-50" : "bg-white border-gray-100 hover:border-blue-300",
                                        isTodayDate && "ring-2 ring-blue-500 ring-offset-2 border-transparent",
                                        hasEvents ? "cursor-pointer hover:shadow-md" : "cursor-default"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={clsx(
                                            "w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold",
                                            isTodayDate ? "bg-blue-600 text-white" : "text-gray-700"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>

                                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                                        {/* Bloqueos */}
                                        {dayBlocks.slice(0, 3).map(b => (
                                            <div key={`b-${b.id}`} className="text-[10px] leading-tight px-1.5 py-1 rounded bg-red-50 text-red-700 font-semibold truncate border border-red-100">
                                                {b.professionalName}
                                            </div>
                                        ))}
                                        {dayBlocks.length > 3 && (
                                            <div className="text-[10px] text-red-500 font-bold px-1">+ {dayBlocks.length - 3} más</div>
                                        )}

                                        {/* Aperturas */}
                                        {dayOpens.slice(0, 3).map(o => (
                                            <div key={`o-${o.id}`} className="text-[10px] leading-tight px-1.5 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold truncate border border-emerald-100">
                                                {o.professionalName}
                                            </div>
                                        ))}
                                        {dayOpens.length > 3 && (
                                            <div className="text-[10px] text-emerald-500 font-bold px-1">+ {dayOpens.length - 3} más</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Event Detail Modal */}
            {selectedDayEvent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedDayEvent(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 capitalize">
                                    {format(selectedDayEvent.date, 'EEEE d MMMM, yyyy', { locale: es })}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Detalle de eventos clínicos</p>
                            </div>
                            <button onClick={() => setSelectedDayEvent(null)} className="p-2 bg-white rounded-full hover:bg-gray-200 transition-colors">
                                <ChevronLeft size={20} className="rotate-180" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {selectedDayEvent.blocks.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-bold flex items-center gap-2 text-red-600 uppercase text-xs tracking-wider">
                                        <Briefcase size={16} /> Bloqueos ({selectedDayEvent.blocks.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedDayEvent.blocks.map(b => (
                                            <div key={b.id} className="p-3 rounded-xl border border-red-100 bg-red-50/50 flex flex-col gap-1">
                                                <div className="font-bold text-gray-900">{b.professionalName}</div>
                                                <div className="text-xs text-gray-600 className='flex gap-2 items-center'">
                                                    <span className="bg-red-100 text-red-700 px-2 rounded-full py-0.5 font-semibold">{b.blockType}</span>
                                                    <span className="flex items-center gap-1"><Clock size={12}/> {b.startTime} - {b.endTime}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedDayEvent.opens.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-bold flex items-center gap-2 text-emerald-600 uppercase text-xs tracking-wider">
                                        <Briefcase size={16} /> Aperturas ({selectedDayEvent.opens.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedDayEvent.opens.map(o => (
                                            <div key={o.id} className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 flex flex-col gap-1">
                                                <div className="font-bold text-gray-900">{o.professionalName}</div>
                                                <div className="text-xs text-gray-600 flex gap-2 items-center">
                                                    <span className="bg-emerald-100 text-emerald-700 px-2 rounded-full py-0.5 font-semibold">{o.requestType || 'Apertura'}</span>
                                                    <span className="flex items-center gap-1"><Clock size={12}/> {o.startTime} - {o.endTime}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
