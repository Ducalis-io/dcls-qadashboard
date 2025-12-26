'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getConfig } from '@/services/periodDataService';

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Интерфейс для данных о спринтах
interface SprintData {
  sprint: string;
  startDate?: string;
  endDate?: string;
  date?: string; // для обратной совместимости
  backlogBugs: number;
}

// Интерфейс для пропсов компонента
interface SprintBacklogChartProps {
  data?: SprintData[];
  period?: string;
}

const SprintBacklogChart: React.FC<SprintBacklogChartProps> = ({ data: initialData, period }) => {
  // Загружаем конфигурацию и данные спринтов
  const config = useMemo(() => getConfig(), []);
  const sprintData = initialData || config?.sprints || [];

  // Если нет данных спринтов
  if (!sprintData || sprintData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-4">
          Динамика багов в бэклоге по спринтам
        </h2>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium">Нет данных о спринтах</p>
          <p className="text-sm mt-2">Данные о спринтах пока не собраны из Jira</p>
          <p className="text-xs mt-1 text-gray-400">Запустите: npm run fetch-jira</p>
        </div>
      </div>
    );
  }

  // Вычисляем min/max для шкалы с отступом 10%
  const bugCounts = sprintData.map(item => item.backlogBugs);
  const minBugs = Math.min(...bugCounts);
  const maxBugs = Math.max(...bugCounts);
  const range = maxBugs - minBugs;
  const padding = Math.max(range * 0.1, 5); // минимум 5 багов отступ
  const yMin = Math.max(0, Math.floor(minBugs - padding));
  const yMax = Math.ceil(maxBugs + padding);

  // Подготовка данных для графика
  const chartData = {
    labels: sprintData.map(item => {
      const date = item.endDate || item.date || '';
      return `${item.sprint}\n${date}`;
    }),
    datasets: [
      {
        label: 'Баги в бэклоге',
        data: sprintData.map(item => item.backlogBugs),
        borderColor: 'rgb(220, 38, 38)',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Настройки графика
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            const item = sprintData[index];
            const date = item.endDate || item.date || '';
            return `${item.sprint} (${date})`;
          },
          label: (context: any) => {
            return `Баги в бэклоге: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        min: yMin,
        max: yMax,
        title: {
          display: true,
          text: 'Количество багов',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Спринты',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-red-800 mb-4">
        Динамика багов в бэклоге по спринтам
      </h2>
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Всего спринтов: {sprintData.length}</p>
        {sprintData.length > 0 && (
          <p>
            Период: {sprintData[0].endDate || sprintData[0].date} - {sprintData[sprintData.length - 1].endDate || sprintData[sprintData.length - 1].date}
          </p>
        )}
      </div>
    </div>
  );
};

export default SprintBacklogChart;
