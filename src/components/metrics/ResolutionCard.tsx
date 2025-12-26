'use client';

import React from 'react';
import { MetricCard } from '@/components/ui';
import TrendChart from '@/components/TrendChart';
import { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import { adaptResolutionData } from '@/utils/metricAdapters';

interface ResolutionData {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface ResolutionCardProps {
  data: ResolutionData[];
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const ResolutionCard: React.FC<ResolutionCardProps> = ({
  data,
  selectedPeriod,
  onPeriodChange,
}) => {
  const adaptedData = adaptResolutionData(data);

  return (
    <MetricCard
      title="Статус резолюции багов"
      data={adaptedData}
      tooltipTitle={DATA_DESCRIPTIONS.resolution.title}
      tooltipContent={DATA_DESCRIPTIONS.resolution.content}
      availableModes={['pie', 'trend']}
      selectedPeriod={selectedPeriod}
      onPeriodChange={onPeriodChange}
      trendComponent={
        <TrendChart dataType="resolution" getLabelKey={(item) => item.status || ''} />
      }
    />
  );
};

export default ResolutionCard;
