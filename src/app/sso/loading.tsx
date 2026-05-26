import React from 'react';

export default function SSOLoading() {
  return (
    <div className="space-y-8 p-6 animate-pulse max-w-7xl mx-auto">
      {/* Title Placeholder */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-96 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
      </div>

      {/* 3 Metric Cards Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-white border border-gray-100 rounded-2xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
              <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
            </div>
            <div className="h-8 w-20 bg-gray-300 rounded-lg"></div>
            <div className="h-3 w-40 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Table Placeholder */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <div className="h-5 w-44 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            <div className="h-9 w-32 bg-gray-100 rounded-lg"></div>
            <div className="h-9 w-20 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-5 gap-4 pb-3 border-b border-gray-100">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="h-4 bg-gray-200 rounded w-3/4"></div>
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="grid grid-cols-5 gap-4 py-2 border-b border-gray-50 items-center">
              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              <div className="h-4 bg-gray-150 rounded w-1/2"></div>
              <div className="h-3 bg-gray-100 rounded w-5/6"></div>
              <div className="h-4 bg-gray-100 rounded w-1/3"></div>
              <div className="h-6 bg-gray-200 rounded-full w-24"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
