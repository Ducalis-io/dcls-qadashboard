'use client';

import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import PeriodSelector from '@/components/PeriodSelector';
import InfoTooltip, { DATA_DESCRIPTIONS } from '@/components/InfoTooltip';

// Регистрация необходимых компонентов Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Интерфейс для данных о трекерах
interface TrackerData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

// Интерфейс для пропсов компонента
interface BugTrackersProps {
  data: TrackerData[];
  selectedPeriod?: string; // Выбранный период
  onPeriodChange?: (period: string) => void; // Функция изменения периода
}

const BugTrackers: React.FC<BugTrackersProps> = ({ data, selectedPeriod, onPeriodChange }) => {
  // Проверяем, нужно ли показывать пустое состояние
  const shouldShowEmpty = selectedPeriod === 'period3' || !data || data.length === 0;
  
  // Подготовка данных для диаграммы
  const chartData = {
    labels: shouldShowEmpty ? [] : data.map(item => item.name),
    datasets: [
      {
        data: shouldShowEmpty ? [] : data.map(item => item.count),
        backgroundColor: shouldShowEmpty ? [] : data.map(item => item.color),
        borderColor: shouldShowEmpty ? [] : data.map(item => item.color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  // Общее количество багов
  const totalBugs = shouldShowEmpty ? 0 : data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      {/* Заголовок с дропдауном */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-red-800 flex items-center">
            Баги в трекерах
            <InfoTooltip title={DATA_DESCRIPTIONS.trackers.title}>
              {DATA_DESCRIPTIONS.trackers.content}
            </InfoTooltip>
          </h3>
          {onPeriodChange && selectedPeriod && (
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={onPeriodChange}
            />
          )}
        </div>
      </div>
      
      {/* Условное отображение содержимого */}
      {shouldShowEmpty ? (
        <div className="p-6 text-center">
          <div className="w-full max-w-md mx-auto h-64 relative flex items-center justify-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-24 w-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
              </svg>
              <p className="text-lg font-medium">No specific bugs</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Круговая диаграмма - теперь идет первой */}
          <div className="p-6">
            <div className="w-full max-w-md mx-auto h-64 relative">
              <Pie 
                data={chartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        usePointStyle: true,
                        generateLabels: (chart) => {
                          const data = chart.data;
                          if (data.labels?.length && data.datasets.length) {
                            return data.labels.map((label, i) => {
                              const dataset = data.datasets[0];
                              const value = dataset.data?.[i] as number;
                              const percentage = value / totalBugs * 100;
                              
                              // Получаем цвета из оригинальных данных
                              const bgColor = typeof dataset.backgroundColor === 'string' 
                                ? dataset.backgroundColor 
                                : Array.isArray(dataset.backgroundColor) 
                                  ? dataset.backgroundColor[i]?.toString() || ''
                                  : '';
                                  
                              const borderColor = typeof dataset.borderColor === 'string' 
                                ? dataset.borderColor 
                                : Array.isArray(dataset.borderColor) 
                                  ? dataset.borderColor[i]?.toString() || ''
                                  : '';
                              
                              return {
                                text: `${label}\n${percentage.toFixed(1)}%`,
                                fillStyle: bgColor,
                                strokeStyle: borderColor,
                                lineWidth: 1,
                                hidden: false, // Просто устанавливаем false, без доступа к meta
                                index: i,
                              };
                            });
                          }
                          return [];
                        }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || '';
                          const value = context.raw as number;
                          const percentage = (value / totalBugs * 100).toFixed(1);
                          return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  },
                }} 
              />
            </div>
          </div>
          
          {/* Таблица данных - теперь идет второй */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Баги в интеграции с трекерами
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, index) => (
                  <tr key={index} className="bg-yellow-50">
                    <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.count}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.percentage.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-yellow-100">
                  <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    total
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                    {totalBugs}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                    
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

export default BugTrackers; 