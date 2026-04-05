'use client';

import React, { useState, useMemo } from 'react';
import { MetricCard } from '@/components/ui';
import TrendChart from '@/components/TrendChart';
import { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import { adaptEnvironmentData } from '@/utils/metricAdapters';
import { filterBugsByEnv, aggregateEnvironment } from '@/utils/envFilter';
import { getAvailableSourcesForMetric } from '@/config/dataSources';
import type { SourceMetrics } from '@/services/periodDataService';
import type { DataSourceId, EnvironmentFilter } from '@/types/metrics';

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
  const [envFilter, setEnvFilter] = useState<EnvironmentFilter>('all');

  const sourceData = sources[activeSource];

  const adaptedData = useMemo(() => {
    if (!sourceData) return [];
    if (envFilter === 'all') {
      return adaptEnvironmentData(sourceData.environment, sourceData.totalBugs);
    }
    const filtered = filterBugsByEnv(sourceData.rawBugs, envFilter);
    return adaptEnvironmentData(aggregateEnvironment(filtered), filtered.length);
  }, [sourceData, envFilter]);

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
      showEnvFilter
      envFilter={envFilter}
      onEnvFilterChange={setEnvFilter}
      selectedPeriod={selectedPeriod}
      onPeriodChange={onPeriodChange}
      trendComponent={
        <TrendChart metricField="environment" activeSource={activeSource} envFilter={envFilter} getLabelKey={(item) => item.environment || ''} />
      }
    />
  );
};

export default EnvironmentCard;
