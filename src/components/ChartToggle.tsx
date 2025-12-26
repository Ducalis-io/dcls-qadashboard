'use client';

import React, { useState } from 'react';

interface ChartToggleProps {
  pieChart: React.ReactNode;
  trendChart: React.ReactNode;
}

const ChartToggle: React.FC<ChartToggleProps> = ({ pieChart, trendChart }) => {
  const [showTrend, setShowTrend] = useState(false);

  return (
    <div>
      {/* Переключатель */}
      <div className="flex items-center justify-end mb-3 space-x-2">
        <button
          onClick={() => setShowTrend(false)}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            !showTrend
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          Pie
        </button>
        <button
          onClick={() => setShowTrend(true)}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            showTrend
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          Trend
        </button>
      </div>

      {/* Контент */}
      {showTrend ? trendChart : pieChart}
    </div>
  );
};

export default ChartToggle;
