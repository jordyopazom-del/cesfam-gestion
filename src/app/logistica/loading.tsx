import React from 'react';

export default function LogisticaLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse max-w-7xl mx-auto">
      {/* Header Placeholder */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-72 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="h-10 w-44 bg-gray-200 rounded-lg"></div>
      </div>

      {/* 4 Metric Cards Grid Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 bg-white border border-gray-100 rounded-2xl space-y-3 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-gray-100 rounded"></div>
              <div className="h-6 w-14 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Split Layout: Map / Active Rondas list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulated Map Container (Left, 2 cols) */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6 flex flex-col justify-between min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-44 bg-gray-200 rounded"></div>
            <div className="h-4 w-28 bg-gray-100 rounded"></div>
          </div>
          {/* Simulated Map Placeholder styling */}
          <div className="flex-1 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 animate-pulse flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div className="h-3 w-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        {/* Active Schedule List Container (Right, 1 col) */}
        <div className="space-y-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col min-h-[400px]">
          <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="flex-1 space-y-3">
            {[1, 2, 3, 4].map((ronda) => (
              <div key={ronda} className="p-4 border border-gray-50 rounded-xl space-y-3 bg-gray-50/50">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-3 w-12 bg-gray-100 rounded"></div>
                </div>
                <div className="h-5 w-32 bg-gray-200 rounded-lg"></div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-150 rounded-full"></div>
                  <div className="h-6 w-20 bg-gray-100 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
