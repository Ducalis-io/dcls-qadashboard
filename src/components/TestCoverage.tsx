'use client';

import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Регистрация необходимых компонентов Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Интерфейс для данных о покрытии тестами
interface CoverageData {
  automated: number;
  total: number;
}

// Интерфейс для пропсов компонента
interface TestCoverageProps {
  data: CoverageData;
  selectedPeriod?: string; // Выбранный период
  onPeriodChange?: (period: string) => void; // Функция изменения периода
}

const TestCoverage: React.FC<TestCoverageProps> = ({ data, selectedPeriod, onPeriodChange }) => {
  // Рассчитываем процент покрытия
  const coveragePercentage = (data.automated / data.total) * 100;
  const nonCoveragePercentage = 100 - coveragePercentage;
  
  // Подготовка данных для диаграммы
  const chartData = {
    labels: ['Автоматизировано', 'Не автоматизировано'],
    datasets: [
      {
        data: [data.automated, data.total - data.automated],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 206, 86)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      {/* Заголовок с дропдауном */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-red-800">Покрытие автотестами</h3>
          {onPeriodChange && (
            <select 
              value={selectedPeriod} 
              onChange={(e) => onPeriodChange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="period1">03.02.2025 - 13.04.2025</option>
              <option value="period2">13.04.2025 - 08.06.2025</option>
              <option value="period3">09.06.2025 - 06.07.2025</option>
              <option value="period4">07.07.2025 - 03.08.2025</option>
              <option value="period5">04.08.2025 - 31.08.2025</option>
              <option value="period6">01.09.2025 - 28.09.2025</option>
              <option value="period7">29.09.2025 - 26.10.2025</option>
            </select>
          )}
        </div>
      </div>
      
      {/* Круговая диаграмма - теперь идет первой */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-red-800 mb-4">
          Coverage by Autotests
        </h3>
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
                          const percentage = i === 0 ? coveragePercentage : nonCoveragePercentage;
                          
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
                            hidden: false,
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
                      const percentage = (value / data.total * 100).toFixed(1);
                      return `${label}: ${value} (${percentage}%)`;
                    }
                  }
                }
              },
            }} 
          />
        </div>
        
        {/* Ключевой показатель покрытия */}
        <div className="mt-6 text-center">
          <div className="inline-block px-4 py-2 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Текущее покрытие автотестами</p>
            <p className="text-3xl font-bold text-blue-600">{coveragePercentage.toFixed(1)}%</p>
          </div>
        </div>
      </div>
      
      {/* Таблица данных - теперь идет второй */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coverage by Autotests
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="bg-yellow-50">
              <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                Automated
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                {data.automated}
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                {coveragePercentage.toFixed(2)}
              </td>
            </tr>
            <tr className="bg-yellow-100">
              <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                Total
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                {data.total}
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                100
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestCoverage; 