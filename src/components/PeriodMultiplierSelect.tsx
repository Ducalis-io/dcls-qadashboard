'use client';

import React from 'react';
import { useDashboardContext } from '@/contexts/DashboardContext';

interface PeriodMultiplierSelectProps {
  className?: string;
}

/**
 * Компонент выбора множителя объединения периодов.
 * Показывает select с вариантами 1-4 и информацию о количестве спринтов.
 */
export const PeriodMultiplierSelect: React.FC<PeriodMultiplierSelectProps> = ({
  className = '',
}) => {
  const { multiplier, setMultiplier} = useDashboardContext();

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <label htmlFor="period-multiplier" className="text-gray-600 whitespace-nowrap">
        Объединение:
      </label>
      <select
        id="period-multiplier"
        value={multiplier}
        onChange={(e) => setMultiplier(Number(e.target.value))}
        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
      >
        <option value={1}>1 период</option>
        <option value={2}>2 периода</option>
        <option value={3}>3 периода</option>
        <option value={4}>4 периода</option>
      </select>
    </div>
  );
};

export default PeriodMultiplierSelect;
