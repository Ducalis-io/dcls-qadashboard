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
import { useConfig, useAllPeriodsData } from '@/hooks/useDataSource';
import type { PeriodData } from '@/services/periodDataService';
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

// Type for metric items that can have different fields (без color - вычисляется)
type MetricDataItem = { label?: string; environment?: string; status?: string; reason?: string; count: number };

interface TrendChartProps {
  // Тип данных: какое поле брать из периода
  dataType: 'severity' | 'environment' | 'resolution' | 'reasons' | 'reasonsCreated';
  // Функция для извлечения label из элемента данных
  getLabelKey: (item: MetricDataItem) => string;
}

const TrendChart: React.FC<TrendChartProps> = ({ dataType, getLabelKey }) => {
  const [normalize, setNormalize] = useState(false);
  const [hiddenLabels, setHiddenLabels] = useState<Set<string>>(new Set());

  // Загружаем конфигурацию и данные всех периодов через хуки
  const { config, loading: configLoading } = useConfig();
  const { data: allPeriodsData, loading: dataLoading } = useAllPeriodsData();
  const loading = configLoading || dataLoading;

  // Функция для получения данных из периода с учетом fallback
  const getDataFromPeriod = (period: PeriodData, type: string): MetricDataItem[] => {
    // Для reasonsCreated используем reasonsCreated с fallback на reasons
    if (type === 'reasonsCreated') {
      return period.reasonsCreated || period.reasons || [];
    }
    return (period[type as keyof PeriodData] as MetricDataItem[] | undefined) || [];
  };

  // Собираем все уникальные labels
  const allLabels = useMemo(() => {
    const labelSet = new Set<string>();
    allPeriodsData.forEach(period => {
      const items = getDataFromPeriod(period, dataType);
      items?.forEach(item => {
        labelSet.add(getLabelKey(item));
      });
    });
    return Array.from(labelSet);
  }, [allPeriodsData, dataType, getLabelKey]);

  // Функция для получения цвета на основе типа данных и label
  const getColorForLabel = (label: string): string => {
    switch (dataType) {
      case 'severity':
        return getSeverityColor(label);
      case 'environment':
        return getEnvironmentColor(label);
      case 'resolution':
        return getResolutionColor(label);
      case 'reasons':
      case 'reasonsCreated':
        return getReasonColor(label);
      default:
        return 'rgba(128, 128, 128, 0.8)';
    }
  };

  // Собираем цвета для каждого label
  const labelColors = useMemo(() => {
    const colors: Record<string, string> = {};
    allLabels.forEach(label => {
      colors[label] = getColorForLabel(label);
    });
    return colors;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLabels, dataType]);

  // Подготавливаем данные для графика
  const chartData = useMemo(() => {
    // X axis: периоды (короткие даты)
    const periodLabels = config?.periods.map(p => {
      const endDate = p.endDate;
      // Формат: DD.MM
      const [, month, day] = endDate.split('-');
      return `${day}.${month}`;
    }) || [];

    // Функция для создания цвета заливки с нужной прозрачностью
    const getFillColor = (color: string, opacity: number = 0.5): string => {
      // Если цвет в формате rgba, заменяем opacity
      if (color.startsWith('rgba')) {
        return color.replace(/[\d.]+\)$/, `${opacity})`);
      }
      // Если цвет в формате hsla, заменяем opacity
      if (color.startsWith('hsla')) {
        return color.replace(/[\d.]+\)$/, `${opacity})`);
      }
      // Если цвет в формате rgb, конвертируем в rgba
      if (color.startsWith('rgb(')) {
        return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
      }
      // Если цвет в формате hsl, конвертируем в hsla
      if (color.startsWith('hsl(')) {
        return color.replace('hsl(', 'hsla(').replace(')', `, ${opacity})`);
      }
      return color;
    };

    // Функция для затемнения цвета линии (уменьшаем RGB компоненты)
    const getDarkerColor = (color: string, factor: number = 0.6): string => {
      // Для rgba формата
      const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbaMatch) {
        const r = Math.round(parseInt(rgbaMatch[1]) * factor);
        const g = Math.round(parseInt(rgbaMatch[2]) * factor);
        const b = Math.round(parseInt(rgbaMatch[3]) * factor);
        return `rgba(${r}, ${g}, ${b}, 1)`;
      }
      // Для hsla формата - уменьшаем lightness
      const hslaMatch = color.match(/hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%/);
      if (hslaMatch) {
        const h = parseInt(hslaMatch[1]);
        const s = parseFloat(hslaMatch[2]);
        const l = Math.round(parseFloat(hslaMatch[3]) * factor);
        return `hsla(${h}, ${s}%, ${l}%, 1)`;
      }
      return color;
    };

    // Datasets: один для каждого label
    const datasets = allLabels.map(label => {
      const data = allPeriodsData.map(period => {
        const items = getDataFromPeriod(period, dataType);
        const item = items?.find(i => getLabelKey(i) === label);

        if (normalize) {
          // Процент от общего ТОЛЬКО по ВИДИМЫМ labels
          const total = items?.reduce((sum, i) => {
            const itemLabel = getLabelKey(i);
            // Включаем только видимые labels в сумму
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
        borderColor: getDarkerColor(baseColor, 0.5),  // Линия темнее (60% от базового)
        backgroundColor: getFillColor(baseColor, 0.9), // Заливка светлее и прозрачнее
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
        borderWidth: 1.5,  // Чуть толще для лучшей видимости
        hidden: isHidden,  // Синхронизируем скрытие с нашим state
      };
    });

    return {
      labels: periodLabels,
      datasets,
    };
  }, [allPeriodsData, allLabels, labelColors, config, dataType, getLabelKey, normalize, hiddenLabels]);

  // Обработчик клика по элементу легенды
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
        onClick: handleLegendClick,  // Кастомный обработчик для пересчёта нормализации
      },
      tooltip: {
        // Сортировка элементов тултипа по убыванию значения (совпадает с визуальным порядком графиков)
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
