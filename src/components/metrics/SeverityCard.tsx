'use client';

import React from 'react';
import { MetricCard } from '@/components/ui';
import TrendChart from '@/components/TrendChart';
import { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import { adaptSeverityData } from '@/utils/metricAdapters';

interface SeverityData {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface SeverityCardProps {
  data: SeverityData[];
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const SeverityCard: React.FC<SeverityCardProps> = ({
  data,
  selectedPeriod,
  onPeriodChange,
}) => {
  const adaptedData = adaptSeverityData(data);

  return (
    <MetricCard
      title="Серьёзность багов"
      data={adaptedData}
      tooltipTitle={DATA_DESCRIPTIONS.priority.title}
      tooltipContent={DATA_DESCRIPTIONS.priority.content}
      availableModes={['pie', 'trend']}
      selectedPeriod={selectedPeriod}
      onPeriodChange={onPeriodChange}
      trendComponent={
        <TrendChart dataType="severity" getLabelKey={(item) => item.label || ''} />
      }
    />
  );
};

export default SeverityCard;
