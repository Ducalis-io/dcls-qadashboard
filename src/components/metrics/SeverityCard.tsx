'use client';

import React, { useState } from 'react';
import { MetricCard } from '@/components/ui';
import TrendChart from '@/components/TrendChart';
import { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import { adaptSeverityData } from '@/utils/metricAdapters';
import { getAvailableSourcesForMetric } from '@/config/dataSources';
import type { SourceMetrics } from '@/services/periodDataService';
import type { DataSourceId } from '@/types/metrics';

interface SeverityCardProps {
  sources: Record<string, SourceMetrics>;
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const SeverityCard: React.FC<SeverityCardProps> = ({
  sources,
  selectedPeriod,
  onPeriodChange,
}) => {
  const availableSources = getAvailableSourcesForMetric('severity', Object.keys(sources));
  const [activeSource, setActiveSource] = useState<DataSourceId>(availableSources[0]?.id ?? 'backlog');

  const sourceData = sources[activeSource];
  const adaptedData = sourceData ? adaptSeverityData(sourceData.severity, sourceData.totalBugs) : [];

  return (
    <MetricCard
      title="Серьёзность багов"
      data={adaptedData}
      tooltipTitle={DATA_DESCRIPTIONS.priority.title}
      tooltipContent={DATA_DESCRIPTIONS.priority.content}
      availableModes={['pie', 'trend']}
      availableSources={availableSources}
      activeSource={activeSource}
      onSourceChange={setActiveSource}
      selectedPeriod={selectedPeriod}
      onPeriodChange={onPeriodChange}
      trendComponent={
        <TrendChart metricField="severity" activeSource={activeSource} getLabelKey={(item) => item.label || ''} />
      }
    />
  );
};

export default SeverityCard;
