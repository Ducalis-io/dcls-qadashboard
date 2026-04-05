'use client';

import React from 'react';
import type { DataSourceOption, DataSourceId } from '@/types/metrics';

interface DataSourceSwitcherProps {
  sources: DataSourceOption[];
  activeSource: DataSourceId;
  onChange: (id: DataSourceId) => void;
}

const DataSourceSwitcher: React.FC<DataSourceSwitcherProps> = ({
  sources,
  activeSource,
  onChange,
}) => {
  // Не показываем переключатель если доступен только один источник
  if (sources.length <= 1) return null;

  return (
    <select
      value={activeSource}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
    >
      {sources.map(source => (
        <option key={source.id} value={source.id}>
          {source.shortLabel}
        </option>
      ))}
    </select>
  );
};

export default DataSourceSwitcher;
