'use client';

import React from 'react';
import { EnvironmentFilter as FilterType } from '@/types/metrics';

interface EnvironmentFilterProps {
  value: FilterType;
  onChange: (filter: FilterType) => void;
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Все окружения' },
  { value: 'prod', label: 'Prod' },
  { value: 'stage', label: 'Stage' },
];

const EnvironmentFilter: React.FC<EnvironmentFilterProps> = ({
  value,
  onChange,
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FilterType)}
      className="px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
    >
      {FILTERS.map((filter) => (
        <option key={filter.value} value={filter.value}>
          {filter.label}
        </option>
      ))}
    </select>
  );
};

export default EnvironmentFilter;
