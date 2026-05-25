"use client";

import { useState, useMemo } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface CalendarProps {
  reservations: Reservation[];
  onDateSelect?: (date: Date) => void;
}

export function Calendar({ reservations, onDateSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    if (onDateSelect) onDateSelect(day);
  };

  // Group reservations by date string once to achieve O(1) lookup inside the grid loop
  const reservationsByDate = useMemo(() => {
    const group = new Map<string, Reservation[]>();
    reservations.forEach(r => {
      try {
        const parsedDate = new Date(r.date);
        const dateStr = format(parsedDate, "yyyy-MM-dd");
        if (!group.has(dateStr)) {
          group.set(dateStr, []);
        }
        group.get(dateStr)!.push(r);
      } catch (e) {
        console.error("Error parsing reservation date:", e);
      }
    });
    return group;
  }, [reservations]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 capitalize">
          {format(currentDate, dateFormat, { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={handlePrevMonth} 
            className="p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            type="button"
            onClick={handleNextMonth} 
            className="p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);
          
          // Check for reservations on this day using optimized O(1) map lookup
          const dateStr = format(day, "yyyy-MM-dd");
          const dayReservations = reservationsByDate.get(dateStr) || [];
          const hasApproved = dayReservations.some(r => r.status === "APPROVED");
          const hasPending = dayReservations.some(r => r.status === "PENDING");

          return (
            <button 
              key={day.toString()} 
              type="button"
              onClick={() => handleDateClick(day)}
              className={`
                min-h-[72px] p-2 rounded-xl border flex flex-col text-left transition-all relative outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500' 
                  : isTodayDate 
                    ? 'border-blue-200 bg-blue-50/20' 
                    : 'border-gray-100 hover:border-gray-300 bg-white'
                }
                ${isCurrentMonth ? 'text-gray-800' : 'text-gray-300 opacity-40'}
              `}
            >
              <span className={`
                text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors
                ${isTodayDate 
                  ? 'bg-blue-600 text-white font-bold' 
                  : isSelected 
                    ? 'text-blue-700' 
                    : 'text-gray-700'
                }
              `}>
                {format(day, "d")}
              </span>
              
              {/* Indicators */}
              <div className="mt-auto pt-2 w-full flex flex-col gap-1">
                {hasApproved && (
                  <div className="w-full h-1 bg-emerald-500 rounded-full" title="Reservas Aprobadas" />
                )}
                {hasPending && (
                  <div className="w-full h-1 bg-amber-500 rounded-full" title="Reservas Pendientes" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
