'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
  LegendItem,
  ChartEvent,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useGroupedPeriodsData } from '@/hooks/useDataSource';
import type { PeriodData } from '@/services/periodDataService';
import type { MetricField, DataSourceId } from '@/types/metrics';
import {
  getSeverityColor,
  getEnvironmentColor,
  getResolutionColor,
  getReasonColor,
} from '@/utils/colors';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

export interface TrendDataItem {
  label: string;
  count: number;
}

// Type for metric items that can have different fields
type MetricDataItem = { label?: string; environment?: string; status?: string; reason?: string; count: number };

interface TrendChartProps {
  metricField: MetricField;
  activeSource: DataSourceId;
  getLabelKey: (item: MetricDataItem) => string;
}

const TrendChart: React.FC<TrendChartProps> = ({ metricField, activeSource, getLabelKey }) => {
  const [normalize, setNormalize] = useState(false);
  const [hiddenLabels, setHiddenLabels] = useState<Set<string>>(new Set());

  const { data: allPeriodsData, groupedPeriods, multiplier, loading } = useGroupedPeriodsData();

  // Get metric data from a period's source
  const getDataFromPeriod = (period: PeriodData): MetricDataItem[] => {
    const source = period.sources?.[activeSource];
    if (!source) return [];
    return (source[metricField as keyof typeof source] as MetricDataItem[] | undefined) || [];
  };

  // Collect all unique labels
  const allLabels = useMemo(() => {
    const labelSet = new Set<string>();
    allPeriodsData.forEach(period => {
      const items = getDataFromPeriod(period);
      items?.forEach(item => {
        labelSet.add(getLabelKey(item));
      });
    });
    return Array.from(labelSet);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPeriodsData, metricField, activeSource, getLabelKey]);

  // Color function based on metric field
  const getColorForLabel = (label: string): string => {
    switch (metricField) {
      case 'severity':
        return getSeverityColor(label);
      case 'environment':
        return getEnvironmentColor(label);
      case 'resolution':
        return getResolutionColor(label);
      case 'reasons':
        return getReasonColor(label);
      default:
        return 'rgba(128, 128, 128, 0.8)';
    }
  };

  const labelColors = useMemo(() => {
    const colors: Record<string, string> = {};
    allLabels.forEach(label => {
      colors[label] = getColorForLabel(label);
    });
    return colors;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLabels, metricField]);

  const chartData = useMemo(() => {
    const periodLabels = groupedPeriods.map(p => {
      const endDate = p.endDate;
      const [, month, day] = endDate.split('-');
      return `${day}.${month}`;
    });

    const getFillColor = (color: string, opacity: number = 0.5): string => {
      if (color.startsWith('rgba')) {
        return color.replace(/[\d.]+\)$/, `${opacity})`);
      }
      if (color.startsWith('hsla')) {
        return color.replace(/[\d.]+\)$/, `${opacity})`);
      }
      if (color.startsWith('rgb(')) {
        return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
      }
      if (color.startsWith('hsl(')) {
        return color.replace('hsl(', 'hsla(').replace(')', `, ${opacity})`);
      }
      return color;
    };

    const getDarkerColor = (color: string, factor: number = 0.6): string => {
      const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbaMatch) {
        const r = Math.round(parseInt(rgbaMatch[1]) * factor);
        const g = Math.round(parseInt(rgbaMatch[2]) * factor);
        const b = Math.round(parseInt(rgbaMatch[3]) * factor);
        return `rgba(${r}, ${g}, ${b}, 1)`;
      }
      const hslaMatch = color.match(/hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%/);
      if (hslaMatch) {
        const h = parseInt(hslaMatch[1]);
        const s = parseFloat(hslaMatch[2]);
        const l = Math.round(parseFloat(hslaMatch[3]) * factor);
        return `hsla(${h}, ${s}%, ${l}%, 1)`;
      }
      return color;
    };

    const datasets = allLabels.map(label => {
      const data = allPeriodsData.map(period => {
        const items = getDataFromPeriod(period);
        const item = items?.find(i => getLabelKey(i) === label);

        if (normalize) {
          const total = items?.reduce((sum, i) => {
            const itemLabel = getLabelKey(i);
            if (!hiddenLabels.has(itemLabel)) {
              return sum + (i.count || 0);
            }
            return sum;
          }, 0) || 1;
          return item ? (item.count / total) * 100 : 0;
        }
        return item?.count || 0;
      });

      const baseColor = labelColors[label] || 'rgba(128, 128, 128, 1)';
      const isHidden = hiddenLabels.has(label);

      return {
        label,
        data,
        borderColor: getDarkerColor(baseColor, 0.5),
        backgroundColor: getFillColor(baseColor, 0.9),
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
        borderWidth: 1.5,
        hidden: isHidden,
      };
    });

    return {
      labels: periodLabels,
      datasets,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPeriodsData, allLabels, labelColors, groupedPeriods, metricField, activeSource, getLabelKey, normalize, hiddenLabels]);

  const handleLegendClick = useCallback((_e: ChartEvent, legendItem: LegendItem) => {
    const label = legendItem.text;
    if (!label) return;

    setHiddenLabels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  }, []);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: { size: 11 },
        },
        onClick: handleLegendClick,
      },
      tooltip: {
        itemSort: (a: TooltipItem<'line'>, b: TooltipItem<'line'>) => b.parsed.y - a.parsed.y,
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const value = context.parsed.y;
            if (normalize) {
              return `${context.dataset.label}: ${value.toFixed(1)}%`;
            }
            return `${context.dataset.label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
        max: normalize ? 100 : undefined,
        title: {
          display: true,
          text: normalize ? 'Процент (%)' : 'Количест��о',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Период (дата окончания)',
        },
      },
    },
  }), [normalize, handleLegendClick]);

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Загрузка данных...
      </div>
    );
  }

  if (allPeriodsData.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Нет данных для отображения
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={normalize}
            onChange={(e) => setNormalize(e.target.checked)}
            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
          />
          <span>Нормализовать (%)</span>
        </label>
      </div>

      <div className="h-64">
        <Line key={`trend-${metricField}-${activeSource}-${multiplier}`} data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TrendChart;
