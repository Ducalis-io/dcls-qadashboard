'use client';

import React, { useState } from 'react';
import { MetricCard } from '@/components/ui';
import TrendChart from '@/components/TrendChart';
import { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import { adaptEnvironmentData } from '@/utils/metricAdapters';
import { getAvailableSourcesForMetric } from '@/config/dataSources';
import type { SourceMetrics } from '@/services/periodDataService';
import type { DataSourceId } from '@/types/metrics';

interface EnvironmentCardProps {
  sources: Record<string, SourceMetrics>;
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
  sources,
  selectedPeriod,
  onPeriodChange,
}) => {
  const availableSources = getAvailableSourcesForMetric('environment', Object.keys(sources));
  const [activeSource, setActiveSource] = useState<DataSourceId>(availableSources[0]?.id ?? 'backlog');

  const sourceData = sources[activeSource];
  const adaptedData = sourceData ? adaptEnvironmentData(sourceData.environment, sourceData.totalBugs) : [];

  return (
    <MetricCard
      title="Распределение багов по окружениям"
      data={adaptedData}
      tooltipTitle={DATA_DESCRIPTIONS.environment.title}
      tooltipContent={DATA_DESCRIPTIONS.environment.content}
      availableModes={['pie', 'trend']}
      availableSources={availableSources}
      activeSource={activeSource}
      onSourceChange={setActiveSource}
      selectedPeriod={selectedPeriod}
      onPeriodChange={onPeriodChange}
      trendComponent={
        <TrendChart metricField="environment" activeSource={activeSource} getLabelKey={(item) => item.environment || ''} />
      }
    />
  );
};

export default EnvironmentCard;
