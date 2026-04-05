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
import type { DataSourceId } from '@/types/metrics';

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

// Палитра цветов для компонентов
const COMPONENT_COLORS = [
  'rgba(54, 162, 235, 0.8)',   // blue
  'rgba(255, 99, 132, 0.8)',   // red
  'rgba(75, 192, 192, 0.8)',   // teal
  'rgba(255, 159, 64, 0.8)',   // orange
  'rgba(153, 102, 255, 0.8)',  // purple
  'rgba(255, 205, 86, 0.8)',   // yellow
  'rgba(201, 203, 207, 0.8)',  // gray
  'rgba(255, 99, 71, 0.8)',    // tomato
  'rgba(46, 204, 113, 0.8)',   // green
  'rgba(142, 68, 173, 0.8)',   // violet
  'rgba(52, 73, 94, 0.8)',     // dark blue
  'rgba(230, 126, 34, 0.8)',   // carrot
];

const OTHER_COLOR = 'rgba(169, 169, 169, 0.8)';
const NO_COMPONENT_COLOR = 'rgba(120, 120, 120, 0.8)';

type EnvironmentFilter = 'all' | 'prod' | 'stage';

interface ComponentTrendChartProps {
  defaultThreshold?: number;
  envFilter?: EnvironmentFilter;
  activeSource: DataSourceId;
}

const ComponentTrendChart: React.FC<ComponentTrendChartProps> = ({
  defaultThreshold = 15,
  envFilter = 'all',
  activeSource,
}) => {
  const [normalize, setNormalize] = useState(false);
  const [threshold, setThreshold] = useState(defaultThreshold);
  const [inputValue, setInputValue] = useState(defaultThreshold.toString());
  const [hiddenLabels, setHiddenLabels] = useState<Set<string>>(new Set());

  const { data: allPeriodsData, groupedPeriods, multiplier, loading } = useGroupedPeriodsData();

  const handleThresholdChange = (value: string) => {
    setInputValue(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setThreshold(num);
    }
  };

  const { significantComponents, chartData } = useMemo(() => {
    const periodsComponentData: Array<{
      periodLabel: string;
      components: Map<string, { count: number; percentage: number }>;
      total: number;
    }> = [];

    allPeriodsData.forEach((period, index) => {
      const groupedPeriod = groupedPeriods[index];
      const endDate = groupedPeriod?.endDate || '';
      const [, month, day] = endDate.split('-');
      const periodLabel = `${day}.${month}`;

      const source = period.sources?.[activeSource];
      const componentMap = new Map<string, { count: number; percentage: number }>();
      let total = 0;

      if (envFilter !== 'all' && source?.rawBugs && source.rawBugs.length > 0) {
        const filteredBugs = source.rawBugs.filter(bug => {
          const env = bug.environment?.toLowerCase() || '';
          if (envFilter === 'prod') {
            return env === 'prod' || env === 'production';
          }
          if (envFilter === 'stage') {
            return env === 'stage' || env === 'staging';
          }
          return true;
        });

        const componentCounts = new Map<string, number>();
        filteredBugs.forEach(bug => {
          const component = bug.component || 'no_component';
          componentCounts.set(component, (componentCounts.get(component) || 0) + 1);
        });

        total = filteredBugs.length;
        componentCounts.forEach((count, name) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          componentMap.set(name, { count, percentage });
        });
      } else {
        const components = source?.components || [];
        total = components.reduce((sum, c) => sum + c.count, 0);

        components.forEach((comp) => {
          const percentage = total > 0 ? (comp.count / total) * 100 : 0;
          componentMap.set(comp.name, { count: comp.count, percentage });
        });
      }

      periodsComponentData.push({ periodLabel, components: componentMap, total });
    });

    const significantSet = new Set<string>();
    periodsComponentData.forEach(({ components }) => {
      components.forEach((data, name) => {
        if (data.percentage >= threshold && name !== 'no_component') {
          significantSet.add(name);
        }
      });
    });

    const significant = Array.from(significantSet).sort();

    const colors: Record<string, string> = {};
    let colorIndex = 0;
    significant.forEach((name) => {
      colors[name] = COMPONENT_COLORS[colorIndex % COMPONENT_COLORS.length];
      colorIndex++;
    });
    colors['Остальное'] = OTHER_COLOR;
    colors['no_component'] = NO_COMPONENT_COLOR;

    const periodLabels = periodsComponentData.map((p) => p.periodLabel);

    const datasetsMap: Record<string, number[]> = {};
    datasetsMap['Остальное'] = [];
    significant.forEach((name) => { datasetsMap[name] = []; });
    datasetsMap['no_component'] = [];

    periodsComponentData.forEach(({ components }) => {
      let othersCount = 0;

      const counts: Record<string, number> = { 'Остальное': 0, 'no_component': 0 };
      significant.forEach((name) => {
        counts[name] = components.get(name)?.count || 0;
      });
      counts['no_component'] = components.get('no_component')?.count || 0;

      components.forEach((data, name) => {
        if (!significantSet.has(name) && name !== 'no_component') {
          othersCount += data.count;
        }
      });
      counts['Остальное'] = othersCount;

      let visibleTotal = 0;
      Object.entries(counts).forEach(([name, count]) => {
        if (!hiddenLabels.has(name)) {
          visibleTotal += count;
        }
      });
      if (visibleTotal === 0) visibleTotal = 1;

      significant.forEach((name) => {
        datasetsMap[name].push(normalize ? (counts[name] / visibleTotal) * 100 : counts[name]);
      });

      datasetsMap['no_component'].push(normalize ? (counts['no_component'] / visibleTotal) * 100 : counts['no_component']);
      datasetsMap['Остальное'].push(normalize ? (counts['Остальное'] / visibleTotal) * 100 : counts['Остальное']);
    });

    const getFillColor = (color: string, opacity: number = 0.9): string => {
      if (color.startsWith('rgba')) {
        return color.replace(/[\d.]+\)$/, `${opacity})`);
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
      return color;
    };

    const datasetOrder = ['Остальное', ...significant, 'no_component'];

    const datasets = datasetOrder.map((name) => ({
      label: name,
      data: datasetsMap[name],
      borderColor: getDarkerColor(colors[name], 0.5),
      backgroundColor: getFillColor(colors[name], 0.9),
      fill: true,
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 6,
      borderWidth: 1.5,
      hidden: hiddenLabels.has(name),
    }));

    return {
      significantComponents: significant,
      chartData: {
        labels: periodLabels,
        datasets,
      },
    };
  }, [allPeriodsData, groupedPeriods, threshold, normalize, envFilter, activeSource, hiddenLabels]);

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

  const options = useMemo(
    () => ({
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
            text: normalize ? 'Процент (%)' : 'Количество',
          },
        },
        x: {
          title: {
            display: true,
            text: 'Период (дата окончания)',
          },
        },
      },
    }),
    [normalize, handleLegendClick]
  );

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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Порог группировки:</span>
          <input
            type="number"
            min="0"
            max="100"
            value={inputValue}
            onChange={(e) => handleThresholdChange(e.target.value)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <span>%</span>
          <span className="text-xs text-gray-400">
            (компоненты &lt; {threshold}% → «Остальное»)
          </span>
        </div>

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

      <div className="h-128" style={{ height: '32rem' }}>
        <Line key={`component-trend-${multiplier}-${envFilter}-${activeSource}`} data={chartData} options={options} />
      </div>

      <div className="text-xs text-gray-500">
        Показаны отдельно: {significantComponents.length > 0 ? significantComponents.join(', ') : '—'}
        {(significantComponents.length > 0 || true) && ' + no_component + «Остальное»'}
      </div>
    </div>
  );
};

export default ComponentTrendChart;
