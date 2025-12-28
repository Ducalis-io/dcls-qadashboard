'use client';

import React from 'react';
import { MetricCard } from '@/components/ui';
import TrendChart from '@/components/TrendChart';
import { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import { adaptEnvironmentData } from '@/utils/metricAdapters';

interface EnvironmentData {
  environment: string;
  count: number;
}

interface EnvironmentCardProps {
  data: EnvironmentData[];
  totalBugs: number;
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
  data,
  totalBugs,
  selectedPeriod,
  onPeriodChange,
}) => {
  const adaptedData = adaptEnvironmentData(data, totalBugs);

  return (
    <MetricCard
      title="Распределение багов по окружениям"
      data={adaptedData}
      tooltipTitle={DATA_DESCRIPTIONS.environment.title}
      tooltipContent={DATA_DESCRIPTIONS.environment.content}
      availableModes={['pie', 'trend']}
      selectedPeriod={selectedPeriod}
      onPeriodChange={onPeriodChange}
      trendComponent={
        <TrendChart dataType="environment" getLabelKey={(item) => item.environment || ''} />
      }
    />
  );
};

export default EnvironmentCard;
