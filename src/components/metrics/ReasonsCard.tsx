'use client';

import React, { useState } from 'react';
import { MetricCard } from '@/components/ui';
import TrendChart from '@/components/TrendChart';
import { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import { adaptReasonsData } from '@/utils/metricAdapters';
import { getAvailableSourcesForMetric } from '@/config/dataSources';
import type { SourceMetrics } from '@/services/periodDataService';
import type { DataSourceId } from '@/types/metrics';

interface ReasonsCardProps {
  sources: Record<string, SourceMetrics>;
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const ReasonsCard: React.FC<ReasonsCardProps> = ({
  sources,
  selectedPeriod,
  onPeriodChange,
}) => {
  const availableSources = getAvailableSourcesForMetric('reasons', Object.keys(sources));
  const [activeSource, setActiveSource] = useState<DataSourceId>(availableSources[0]?.id ?? 'backlog');

  const sourceData = sources[activeSource];
  const adaptedData = sourceData ? adaptReasonsData(sourceData.reasons, sourceData.totalBugs) : [];

  return (
    <MetricCard
      title="Причины создан��я багов"
      data={adaptedData}
      tooltipTitle={DATA_DESCRIPTIONS.reasons.title}
      tooltipContent={DATA_DESCRIPTIONS.reasons.content}
      availableModes={['pie', 'trend']}
      availableSources={availableSources}
      activeSource={activeSource}
      onSourceChange={setActiveSource}
      selectedPeriod={selectedPeriod}
      onPeriodChange={onPeriodChange}
      trendComponent={
        <TrendChart metricField="reasons" activeSource={activeSource} getLabelKey={(item) => item.reason || ''} />
      }
    />
  );
};

export default ReasonsCard;
