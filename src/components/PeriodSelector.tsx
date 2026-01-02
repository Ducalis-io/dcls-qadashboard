'use client'

import React from 'react'
import { useConfig } from '@/hooks/useDataSource'

interface PeriodSelectorProps {
  selectedPeriod: string
  onPeriodChange: (period: string) => void
  className?: string
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  className = ''
}) => {
  // Загружаем конфигурацию с периодами через хук
  const { config, loading } = useConfig()

  if (loading || !config || config.periods.length === 0) {
    return null
  }

  return (
    <select
      value={selectedPeriod}
      onChange={(e) => onPeriodChange(e.target.value)}
      className={`border border-gray-300 rounded px-3 py-1 text-sm ${className}`}
    >
      {config.periods.map((period) => (
        <option key={period.id} value={period.id}>
          {period.label}
        </option>
      ))}
    </select>
  )
}

export default PeriodSelector
