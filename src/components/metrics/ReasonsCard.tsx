'use client';

import React from 'react';
import { MetricCard } from '@/components/ui';
import TrendChart from '@/components/TrendChart';
import { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import { adaptReasonsData } from '@/utils/metricAdapters';

interface ReasonsData {
  reason: string;
  count: number;
  percentage: number;
  color: string;
}

interface ReasonsCardProps {
  data: ReasonsData[];
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const ReasonsCard: React.FC<ReasonsCardProps> = ({
  data,
  selectedPeriod,
  onPeriodChange,
}) => {
  const adaptedData = adaptReasonsData(data);

  return (
    <MetricCard
      title="Причины создания багов"
      data={adaptedData}
      tooltipTitle={DATA_DESCRIPTIONS.reasons.title}
      tooltipContent={DATA_DESCRIPTIONS.reasons.content}
      availableModes={['pie', 'trend']}
      selectedPeriod={selectedPeriod}
      onPeriodChange={onPeriodChange}
      trendComponent={
        <TrendChart dataType="reasonsCreated" getLabelKey={(item) => item.reason || ''} />
      }
    />
  );
};

export default ReasonsCard;
