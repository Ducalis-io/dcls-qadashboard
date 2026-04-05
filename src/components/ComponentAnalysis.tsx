'use client';

import React, { useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem
} from 'chart.js';
import PeriodSelector from '@/components/PeriodSelector';
import InfoTooltip, { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';
import ComponentTrendChart from '@/components/ComponentTrendChart';
import DataSourceSwitcher from '@/components/ui/DataSourceSwitcher';
import EnvironmentFilter from '@/components/ui/EnvironmentFilter';
import { getAvailableSourcesForMetric } from '@/config/dataSources';
import { filterBugsByEnv, aggregateComponents } from '@/utils/envFilter';
import type { SourceMetrics } from '@/services/periodDataService';
import type { DataSourceId, EnvironmentFilter as FilterType } from '@/types/metrics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ComponentAnalysisProps {
  sources: Record<string, SourceMetrics>;
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const ComponentAnalysis: React.FC<ComponentAnalysisProps> = ({
  sources,
  selectedPeriod,
  onPeriodChange
}) => {
  const availableSources = getAvailableSourcesForMetric('components', Object.keys(sources));
  const [activeSource, setActiveSource] = useState<DataSourceId>(availableSources[0]?.id ?? 'backlog');
  const [envFilter, setEnvFilter] = useState<FilterType>('all');
  const [showTrend, setShowTrend] = useState(true);

  const sourceData = sources[activeSource];

  const filteredData = useMemo(() => {
    if (!sourceData) return [];
    if (envFilter === 'all') return sourceData.components || [];
    const filtered = filterBugsByEnv(sourceData.rawBugs, envFilter);
    return aggregateComponents(filtered);
  }, [sourceData, envFilter]);

  const headerControls = (
    <div className="flex items-center space-x-2">
      <DataSourceSwitcher
        sources={availableSources}
        activeSource={activeSource}
        onChange={setActiveSource}
      />
      <EnvironmentFilter value={envFilter} onChange={setEnvFilter} />
      <div className="flex space-x-1">
        <button
          onClick={() => setShowTrend(false)}
          className={`px-2 py-1 text-xs rounded ${!showTrend ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
        >
          Bar
        </button>
        <button
          onClick={() => setShowTrend(true)}
          className={`px-2 py-1 text-xs rounded ${showTrend ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
        >
          Trend
        </button>
      </div>
      {!showTrend && onPeriodChange && selectedPeriod && (
        <PeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={onPeriodChange}
        />
      )}
    </div>
  );

  const getTitle = () => {
    let title = 'Распределение багов по компонентам';
    if (envFilter === 'prod') {
      title += ' — только Prod';
    } else if (envFilter === 'stage') {
      title += ' — только Stage';
    }
    return title;
  };

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden h-full">
        <div className="border-b border-gray-200 p-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-xl font-semibold text-red-800 flex items-center">
              Распределение багов по компонентам
              <InfoTooltip title={DATA_DESCRIPTIONS.components.title}>
                {DATA_DESCRIPTIONS.components.content}
              </InfoTooltip>
            </h3>
            {headerControls}
          </div>
        </div>
        {showTrend ? (
          <div className="p-6">
            <ComponentTrendChart envFilter={envFilter} activeSource={activeSource} />
          </div>
        ) : (
          <div className="p-4 text-gray-500 text-center">
            Нет данных о компонентах для выбранного периода
            {envFilter !== 'all' && ` (фильтр: ${envFilter})`}
          </div>
        )}
      </div>
    );
  }

  const sortedData = [...filteredData].sort((a, b) => b.count - a.count);
  const totalBugs = sortedData.reduce((sum, item) => sum + item.count, 0);

  const chartData = {
    labels: sortedData.map(item => item.name),
    datasets: [
      {
        label: 'Количество багов',
        data: sortedData.map(item => item.count),
        backgroundColor: envFilter === 'prod'
          ? 'rgba(239, 68, 68, 0.5)'
          : envFilter === 'stage'
            ? 'rgba(20, 184, 166, 0.5)'
            : 'rgba(54, 162, 235, 0.5)',
        borderColor: envFilter === 'prod'
          ? 'rgba(239, 68, 68, 1)'
          : envFilter === 'stage'
            ? 'rgba(20, 184, 166, 1)'
            : 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const value = context.raw as number;
            const percentage = totalBugs > 0 ? ((value / totalBugs) * 100).toFixed(1) : '0.0';
            return `Багов: ${value} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { precision: 0 } },
      y: { grid: { display: false } }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-xl font-semibold text-red-800 flex items-center">
            {showTrend ? 'Распределение багов по компонентам' : getTitle()}
            <InfoTooltip title={DATA_DESCRIPTIONS.components.title}>
              {DATA_DESCRIPTIONS.components.content}
            </InfoTooltip>
          </h3>
          {headerControls}
        </div>
      </div>

      {showTrend ? (
        <div className="p-6">
          <ComponentTrendChart envFilter={envFilter} activeSource={activeSource} />
        </div>
      ) : (
        <>
          <div className="p-6">
            <div className="h-96">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Компонент
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Количество
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => {
                  const percentage = totalBugs > 0 ? ((item.count / totalBugs) * 100) : 0;
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">{item.name}</td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">{item.count}</td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">{percentage.toFixed(2)}%</td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-100 font-medium">
                  <td className="py-2 px-4 border-b border-gray-200 text-sm">Всего</td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">{totalBugs}</td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">100.00%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ComponentAnalysis;
