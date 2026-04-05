'use client';

import React, { useState } from 'react';
import { MetricCard } from '@/components/ui';
import { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import { adaptTrackersData } from '@/utils/metricAdapters';
import { getAvailableSourcesForMetric } from '@/config/dataSources';
import type { SourceMetrics } from '@/services/periodDataService';
import type { DataSourceId } from '@/types/metrics';

interface TrackersCardProps {
  sources: Record<string, SourceMetrics>;
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const TrackersCard: React.FC<TrackersCardProps> = ({
  sources,
  selectedPeriod,
  onPeriodChange,
}) => {
  const availableSources = getAvailableSourcesForMetric('trackers', Object.keys(sources));
  const [activeSource, setActiveSource] = useState<DataSourceId>(availableSources[0]?.id ?? 'backlog');

  const sourceData = sources[activeSource];
  const adaptedData = sourceData ? adaptTrackersData(sourceData.trackers, sourceData.totalBugs) : [];

  return (
    <MetricCard
      title="Трекеры багов"
      data={adaptedData}
      tooltipTitle={DATA_DESCRIPTIONS.trackers.title}
      tooltipContent={DATA_DESCRIPTIONS.trackers.content}
      availableModes={['pie']}
      availableSources={availableSources}
      activeSource={activeSource}
      onSourceChange={setActiveSource}
      selectedPeriod={selectedPeriod}
      onPeriodChange={onPeriodChange}
    />
  );
};

export default TrackersCard;
