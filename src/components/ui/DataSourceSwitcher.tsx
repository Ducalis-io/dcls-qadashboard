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
    <div className="flex space-x-1">
      {sources.map(source => (
        <button
          key={source.id}
          onClick={() => onChange(source.id)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            activeSource === source.id
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title={source.label}
        >
          {source.shortLabel}
        </button>
      ))}
    </div>
  );
};

export default DataSourceSwitcher;
