'use client';

import React from 'react';
import { EnvironmentFilter as FilterType } from '@/types/metrics';

interface EnvironmentFilterProps {
  value: FilterType;
  onChange: (filter: FilterType) => void;
}

const FILTERS: { value: FilterType; label: string; activeClass: string }[] = [
  { value: 'all', label: 'Все', activeClass: 'bg-blue-600' },
  { value: 'prod', label: 'Prod', activeClass: 'bg-red-600' },
  { value: 'stage', label: 'Stage', activeClass: 'bg-teal-600' },
];

const EnvironmentFilter: React.FC<EnvironmentFilterProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex space-x-1">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`px-2 py-1 text-xs rounded ${
            value === filter.value
              ? `${filter.activeClass} text-white`
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default EnvironmentFilter;
