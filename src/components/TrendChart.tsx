'use client';

import React, { useMemo, useState } from 'react';
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getAllPeriodsData, getConfig } from '@/services/periodDataService';

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
  color: string;
}

interface TrendChartProps {
  // Тип данных: какое поле брать из периода
  dataType: 'severity' | 'environment' | 'resolution' | 'reasons';
  // Функция для извлечения label из элемента данных
  getLabelKey: (item: any) => string;
}

const TrendChart: React.FC<TrendChartProps> = ({ dataType, getLabelKey }) => {
  const [normalize, setNormalize] = useState(false);

  const config = useMemo(() => getConfig(), []);
  const allPeriodsData = useMemo(() => getAllPeriodsData(), []);

  // Собираем все уникальные labels
  const allLabels = useMemo(() => {
    const labelSet = new Set<string>();
    allPeriodsData.forEach(period => {
      const items = period[dataType] as any[];
      items?.forEach(item => {
        labelSet.add(getLabelKey(item));
      });
    });
    return Array.from(labelSet);
  }, [allPeriodsData, dataType, getLabelKey]);

  // Собираем цвета для каждого label
  const labelColors = useMemo(() => {
    const colors: Record<string, string> = {};
    allPeriodsData.forEach(period => {
      const items = period[dataType] as any[];
      items?.forEach(item => {
        const label = getLabelKey(item);
        if (!colors[label] && item.color) {
          colors[label] = item.color;
        }
      });
    });
    return colors;
  }, [allPeriodsData, dataType, getLabelKey]);

  // Подготавливаем данные для графика
  const chartData = useMemo(() => {
    // X axis: периоды (короткие даты)
    const periodLabels = config?.periods.map(p => {
      const endDate = p.endDate;
      // Формат: DD.MM
      const [year, month, day] = endDate.split('-');
      return `${day}.${month}`;
    }) || [];

    // Datasets: один для каждого label
    const datasets = allLabels.map(label => {
      const data = allPeriodsData.map(period => {
        const items = period[dataType] as any[];
        const item = items?.find(i => getLabelKey(i) === label);

        if (normalize) {
          // Процент от общего
          const total = items?.reduce((sum, i) => sum + (i.count || 0), 0) || 1;
          return item ? (item.count / total) * 100 : 0;
        }
        return item?.count || 0;
      });

      return {
        label,
        data,
        borderColor: labelColors[label] || 'rgba(128, 128, 128, 0.8)',
        backgroundColor: labelColors[label]?.replace('0.8', '0.3') || 'rgba(128, 128, 128, 0.3)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      };
    });

    return {
      labels: periodLabels,
      datasets,
    };
  }, [allPeriodsData, allLabels, labelColors, config, dataType, getLabelKey, normalize]);

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
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
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
  }), [normalize]);

  if (allPeriodsData.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Нет данных для отображения
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Контрол нормализации */}
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

      {/* График */}
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TrendChart;
