'use client';

import React, { useState, ReactNode } from 'react';
import { MetricItem, ChartMode, EnvironmentFilter as FilterType, TableColumn } from '@/types/metrics';
import MetricCardHeader from './MetricCardHeader';
import MetricPieChart from './MetricPieChart';
import MetricTable from './MetricTable';
import ChartModeToggle from './ChartModeToggle';
import EnvironmentFilter from './EnvironmentFilter';
import EmptyState from './EmptyState';
import PeriodSelector from '@/components/PeriodSelector';

interface MetricCardProps {
  title: string;
  data: MetricItem[];

  tooltipTitle?: string;
  tooltipContent?: ReactNode;

  availableModes?: ChartMode[];
  defaultMode?: ChartMode;

  trendComponent?: ReactNode;

  showEnvFilter?: boolean;
  envFilter?: FilterType;
  onEnvFilterChange?: (filter: FilterType) => void;

  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
  showPeriodSelector?: boolean;

  tableColumns?: TableColumn[];
  showTable?: boolean;

  additionalContent?: ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  data,
  tooltipTitle,
  tooltipContent,
  availableModes = ['pie', 'trend'],
  defaultMode = 'trend',
  trendComponent,
  showEnvFilter = false,
  envFilter = 'all',
  onEnvFilterChange,
  selectedPeriod,
  onPeriodChange,
  showPeriodSelector = true,
  tableColumns,
  showTable = true,
  additionalContent,
}) => {
  const [mode, setMode] = useState<ChartMode>(defaultMode);

  const showTrend = mode === 'trend';
  const isEmpty = !data || data.length === 0;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      <MetricCardHeader
        title={title}
        tooltipTitle={tooltipTitle}
        tooltipContent={tooltipContent}
      >
        {availableModes.length > 1 && (
          <ChartModeToggle
            mode={mode}
            onModeChange={setMode}
            availableModes={availableModes}
          />
        )}

        {showEnvFilter && onEnvFilterChange && (
          <EnvironmentFilter value={envFilter} onChange={onEnvFilterChange} />
        )}

        {!showTrend && showPeriodSelector && onPeriodChange && selectedPeriod && (
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={onPeriodChange}
          />
        )}
      </MetricCardHeader>

      {showTrend ? (
        <div className="p-6">
          {trendComponent || <EmptyState message="Trend компонент не настроен" />}
        </div>
      ) : isEmpty ? (
        <EmptyState filter={envFilter} />
      ) : (
        <>
          <div className="p-6">
            <MetricPieChart data={data} />
          </div>

          {additionalContent}

          {showTable && <MetricTable data={data} columns={tableColumns} />}
        </>
      )}
    </div>
  );
};

export default MetricCard;
