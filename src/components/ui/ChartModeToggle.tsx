'use client';

import React from 'react';
import { ChartMode } from '@/types/metrics';

interface ChartModeToggleProps {
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
  availableModes?: ChartMode[];
}

const MODE_LABELS: Record<ChartMode, string> = {
  pie: 'Pie',
  bar: 'Bar',
  trend: 'Trend',
};

const ChartModeToggle: React.FC<ChartModeToggleProps> = ({
  mode,
  onModeChange,
  availableModes = ['pie', 'trend'],
}) => {
  return (
    <div className="flex space-x-1">
      {availableModes.map((m) => (
        <button
          key={m}
          onClick={() => onModeChange(m)}
          className={`px-2 py-1 text-xs rounded ${
            mode === m
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
};

export default ChartModeToggle;
