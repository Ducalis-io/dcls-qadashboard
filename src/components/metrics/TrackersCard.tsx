'use client';

import React from 'react';
import { MetricCard } from '@/components/ui';
import { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import { adaptTrackersData } from '@/utils/metricAdapters';

interface TrackersData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface TrackersCardProps {
  data: TrackersData[];
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const TrackersCard: React.FC<TrackersCardProps> = ({
  data,
  selectedPeriod,
  onPeriodChange,
}) => {
  const adaptedData = adaptTrackersData(data);

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
