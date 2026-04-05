'use client';

import React, { useState, useMemo } from 'react';
import { MetricCard } from '@/components/ui';
import TrendChart from '@/components/TrendChart';
import { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import { adaptReasonsData } from '@/utils/metricAdapters';
import { filterBugsByEnv, aggregateReasons } from '@/utils/envFilter';
import { getAvailableSourcesForMetric } from '@/config/dataSources';
import type { SourceMetrics } from '@/services/periodDataService';
import type { DataSourceId, EnvironmentFilter } from '@/types/metrics';

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
  const [envFilter, setEnvFilter] = useState<EnvironmentFilter>('all');

  const sourceData = sources[activeSource];

  const adaptedData = useMemo(() => {
    if (!sourceData) return [];
    if (envFilter === 'all') {
      return adaptReasonsData(sourceData.reasons, sourceData.totalBugs);
    }
    const filtered = filterBugsByEnv(sourceData.rawBugs, envFilter);
    return adaptReasonsData(aggregateReasons(filtered), filtered.length);
  }, [sourceData, envFilter]);

  return (
    <MetricCard
      title="Причины создания багов"
      data={adaptedData}
      tooltipTitle={DATA_DESCRIPTIONS.reasons.title}
      tooltipContent={DATA_DESCRIPTIONS.reasons.content}
      availableModes={['pie', 'trend']}
      availableSources={availableSources}
      activeSource={activeSource}
      onSourceChange={setActiveSource}
      showEnvFilter
      envFilter={envFilter}
      onEnvFilterChange={setEnvFilter}
      selectedPeriod={selectedPeriod}
      onPeriodChange={onPeriodChange}
      trendComponent={
        <TrendChart metricField="reasons" activeSource={activeSource} envFilter={envFilter} getLabelKey={(item) => item.reason || ''} />
      }
    />
  );
};

export default ReasonsCard;
