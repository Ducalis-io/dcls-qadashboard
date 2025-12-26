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

// Регистрация необходимых компонентов Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Интерфейс для данных о компонентах
interface ComponentData {
  name: string;
  count: number;
  percentage: number;
}

// Интерфейс для сырых багов
interface RawBug {
  key: string;
  summary: string;
  environment?: string;
  component?: string;
  status: string;
  createdDate: string;
}

// Тип фильтра окружения
type EnvironmentFilter = 'all' | 'prod' | 'stage';

// Интерфейс для пропсов компонента
interface ComponentAnalysisProps {
  data: ComponentData[];
  rawBugs?: RawBug[];
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const ComponentAnalysis: React.FC<ComponentAnalysisProps> = ({
  data,
  rawBugs,
  selectedPeriod,
  onPeriodChange
}) => {
  const [envFilter, setEnvFilter] = useState<EnvironmentFilter>('all');
  const [showTrend, setShowTrend] = useState(false);

  // Фильтруем и пересчитываем данные на основе rawBugs
  const filteredData = useMemo(() => {
    // Если нет rawBugs или фильтр "all", используем оригинальные данные
    if (!rawBugs || rawBugs.length === 0 || envFilter === 'all') {
      return data;
    }

    // Фильтруем баги по environment
    const filteredBugs = rawBugs.filter(bug => {
      const env = bug.environment?.toLowerCase() || '';
      if (envFilter === 'prod') {
        return env === 'prod' || env === 'production';
      }
      if (envFilter === 'stage') {
        return env === 'stage' || env === 'staging';
      }
      return true;
    });

    // Пересчитываем компоненты
    const componentCounts = new Map<string, number>();
    filteredBugs.forEach(bug => {
      const component = bug.component || 'no_component';
      componentCounts.set(component, (componentCounts.get(component) || 0) + 1);
    });

    const total = filteredBugs.length;
    const result: ComponentData[] = Array.from(componentCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return result;
  }, [data, rawBugs, envFilter]);

  // Если нет данных
  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden h-full">
        <div className="border-b border-gray-200 p-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-xl font-semibold text-red-800 flex items-center">
              Распределение багов по компонентам (созданные в период)
              <InfoTooltip title={DATA_DESCRIPTIONS.components.title}>
                {DATA_DESCRIPTIONS.components.content}
              </InfoTooltip>
            </h3>
            <div className="flex items-center space-x-2">
              {/* Переключатель Bar/Trend */}
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
              {/* Фильтр по окружению */}
              <div className="flex space-x-1">
                <button
                  onClick={() => setEnvFilter('all')}
                  className={`px-2 py-1 text-xs rounded ${envFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                  Все
                </button>
                <button
                  onClick={() => setEnvFilter('prod')}
                  className={`px-2 py-1 text-xs rounded ${envFilter === 'prod' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                  Prod
                </button>
                <button
                  onClick={() => setEnvFilter('stage')}
                  className={`px-2 py-1 text-xs rounded ${envFilter === 'stage' ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                  Stage
                </button>
              </div>
              {!showTrend && onPeriodChange && selectedPeriod && (
                <PeriodSelector
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={onPeriodChange}
                />
              )}
            </div>
          </div>
        </div>
        {showTrend ? (
          <div className="p-6">
            <ComponentTrendChart envFilter={envFilter} />
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

  // Сортируем данные от большего к меньшему
  const sortedData = [...filteredData].sort((a, b) => b.count - a.count);

  // Рассчитываем общее количество
  const totalBugs = sortedData.reduce((sum, item) => sum + item.count, 0);

  // Подготовка данных для графика
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

  // Настройки графика
  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
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
      x: {
        grid: {
          display: false
        },
        ticks: {
          precision: 0
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    }
  };

  // Получаем заголовок с учетом фильтра
  const getTitle = () => {
    let title = 'Распределение багов по компонентам (созданные в период)';
    if (envFilter === 'prod') {
      title += ' — только Prod';
    } else if (envFilter === 'stage') {
      title += ' — только Stage';
    }
    return title;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      {/* Заголовок */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-xl font-semibold text-red-800 flex items-center">
            {showTrend ? 'Распределение багов по компонентам (созданные в период)' : getTitle()}
            <InfoTooltip title={DATA_DESCRIPTIONS.components.title}>
              {DATA_DESCRIPTIONS.components.content}
            </InfoTooltip>
          </h3>
          <div className="flex items-center space-x-2">
            {/* Переключатель Bar/Trend */}
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
            {/* Фильтр по окружению */}
            <div className="flex space-x-1">
              <button
                onClick={() => setEnvFilter('all')}
                className={`px-2 py-1 text-xs rounded ${envFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                Все
              </button>
              <button
                onClick={() => setEnvFilter('prod')}
                className={`px-2 py-1 text-xs rounded ${envFilter === 'prod' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                Prod
              </button>
              <button
                onClick={() => setEnvFilter('stage')}
                className={`px-2 py-1 text-xs rounded ${envFilter === 'stage' ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                Stage
              </button>
            </div>
            {!showTrend && onPeriodChange && selectedPeriod && (
              <PeriodSelector
                selectedPeriod={selectedPeriod}
                onPeriodChange={onPeriodChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      {showTrend ? (
        <div className="p-6">
          <ComponentTrendChart envFilter={envFilter} />
        </div>
      ) : (
        <>
          {/* Горизонтальная диаграмма */}
          <div className="p-6">
            <div className="h-96">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Таблица данных */}
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
                {sortedData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {item.name}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">
                      {item.count}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">
                      {item.percentage.toFixed(2)}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-medium">
                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                    Всего
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">
                    {totalBugs}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">
                    100.00%
                  </td>
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
