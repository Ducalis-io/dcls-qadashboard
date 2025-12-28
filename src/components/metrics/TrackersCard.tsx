'use client';

import React from 'react';
import { MetricCard } from '@/components/ui';
import { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import { adaptTrackersData } from '@/utils/metricAdapters';

interface TrackersData {
  name: string;
  count: number;
}

interface TrackersCardProps {
  data: TrackersData[];
  totalBugs: number;
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const TrackersCard: React.FC<TrackersCardProps> = ({
  data,
  totalBugs,
  selectedPeriod,
  onPeriodChange,
}) => {
  const adaptedData = adaptTrackersData(data, totalBugs);

  return (
    <MetricCard
      title="Трекеры багов"
      data={adaptedData}
      tooltipTitle={DATA_DESCRIPTIONS.trackers.title}
      tooltipContent={DATA_DESCRIPTIONS.trackers.content}
      availableModes={['pie']}
      selectedPeriod={selectedPeriod}
      onPeriodChange={onPeriodChange}
    />
  );
};

export default TrackersCard;
