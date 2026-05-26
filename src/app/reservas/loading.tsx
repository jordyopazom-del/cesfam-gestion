import React from 'react';

export default function ReservasLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse max-w-7xl mx-auto">
      {/* Upper Navigation Bar Placeholder */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-4">
        <div className="space-y-2">
          <div className="h-8 w-60 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-80 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-24 bg-gray-100 rounded-lg"></div>
          <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar Placeholder (Rooms list) */}
        <div className="space-y-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="h-5 w-36 bg-gray-200 rounded mb-4"></div>
          {[1, 2, 3, 4, 5].map((room) => (
            <div key={room} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-gray-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-3 w-16 bg-gray-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Area Placeholder (Monthly Calendar Grid) */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
          {/* Calendar Header Weekdays */}
          <div className="grid grid-cols-7 gap-2 border-b border-gray-100 pb-3">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
              <div key={day} className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
            ))}
          </div>

          {/* Calendar Cells (5 weeks x 7 days) */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, idx) => (
              <div key={idx} className="border border-gray-50 rounded-xl min-h-[90px] p-2 flex flex-col justify-between hover:bg-gray-50/50 transition-colors">
                <div className="h-4 w-5 bg-gray-150 rounded text-left"></div>
                {/* Random simulated reservations */}
                {idx % 4 === 0 && (
                  <div className="h-4 bg-blue-100 rounded w-full border-l-2 border-blue-300"></div>
                )}
                {idx % 7 === 2 && (
                  <div className="h-4 bg-emerald-100 rounded w-full border-l-2 border-emerald-300"></div>
                )}
                {idx % 9 === 5 && (
                  <div className="h-4 bg-amber-100 rounded w-full border-l-2 border-amber-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
