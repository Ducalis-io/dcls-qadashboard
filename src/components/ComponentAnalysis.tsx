'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import PeriodSelector from '@/components/PeriodSelector';

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

// Интерфейс для пропсов компонента
interface ComponentAnalysisProps {
  data: ComponentData[];
  period: string;
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const ComponentAnalysis: React.FC<ComponentAnalysisProps> = ({
  data,
  period,
  selectedPeriod,
  onPeriodChange
}) => {
  // Если нет данных
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden h-full">
        <div className="border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-red-800">
              Распределение багов по компонентам
            </h3>
            {onPeriodChange && selectedPeriod && (
              <PeriodSelector
                selectedPeriod={selectedPeriod}
                onPeriodChange={onPeriodChange}
              />
            )}
          </div>
        </div>
        <div className="p-4 text-gray-500 text-center">
          Нет данных о компонентах для выбранного периода
        </div>
      </div>
    );
  }

  // Сортируем данные от большего к меньшему
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  // Рассчитываем общее количество
  const totalBugs = sortedData.reduce((sum, item) => sum + item.count, 0);

  // Подготовка данных для графика
  const chartData = {
    labels: sortedData.map(item => item.name),
    datasets: [
      {
        label: 'Количество багов',
        data: sortedData.map(item => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
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
          label: (context: any) => {
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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      {/* Заголовок */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-red-800">
            Распределение багов по компонентам
          </h3>
          {onPeriodChange && selectedPeriod && (
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={onPeriodChange}
            />
          )}
        </div>
      </div>

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
    </div>
  );
};

export default ComponentAnalysis;
