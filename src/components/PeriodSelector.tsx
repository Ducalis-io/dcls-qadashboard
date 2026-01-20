'use client'

import React from 'react'
import { useGroupedPeriods } from '@/contexts/DashboardContext'

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
  // Используем сгруппированные периоды из контекста
  const { groupedPeriods, loading } = useGroupedPeriods()

  if (loading || groupedPeriods.length === 0) {
    return null
  }

  return (
    <select
      value={selectedPeriod}
      onChange={(e) => onPeriodChange(e.target.value)}
      className={`border border-gray-300 rounded px-3 py-1 text-sm ${className}`}
    >
      {groupedPeriods.map((period) => (
        <option key={period.id} value={period.id}>
          {period.label}
        </option>
      ))}
    </select>
  )
}

export default PeriodSelector
