'use client';

import React, { useState } from 'react';
import { MetricCard } from '@/components/ui';
import TrendChart from '@/components/TrendChart';
import { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import { adaptResolutionData } from '@/utils/metricAdapters';
import { getAvailableSourcesForMetric } from '@/config/dataSources';
import type { SourceMetrics } from '@/services/periodDataService';
import type { DataSourceId } from '@/types/metrics';

interface ResolutionCardProps {
  sources: Record<string, SourceMetrics>;
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const ResolutionCard: React.FC<ResolutionCardProps> = ({
  sources,
  selectedPeriod,
  onPeriodChange,
}) => {
  const availableSources = getAvailableSourcesForMetric('resolution', Object.keys(sources));
  const [activeSource, setActiveSource] = useState<DataSourceId>(availableSources[0]?.id ?? 'backlog');

  const sourceData = sources[activeSource];
  const adaptedData = sourceData ? adaptResolutionData(sourceData.resolution, sourceData.totalBugs) : [];

  return (
    <MetricCard
      title="Статус резолюции багов"
      data={adaptedData}
      tooltipTitle={DATA_DESCRIPTIONS.resolution.title}
      tooltipContent={DATA_DESCRIPTIONS.resolution.content}
      availableModes={['pie', 'trend']}
      availableSources={availableSources}
      activeSource={activeSource}
      onSourceChange={setActiveSource}
      selectedPeriod={selectedPeriod}
      onPeriodChange={onPeriodChange}
      trendComponent={
        <TrendChart metricField="resolution" activeSource={activeSource} getLabelKey={(item) => item.status || ''} />
      }
    />
  );
};

export default ResolutionCard;
