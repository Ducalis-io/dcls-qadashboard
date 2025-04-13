'use client';

import React, { useEffect, useState } from 'react';
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
import { Spinner } from '@/components/Spinner';
import { getComponentData } from '@/services/dataService';

// URL опубликованной таблицы - импортируем из конфигурации или задаем здесь
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSbQv0mUFgEOplZ2en0PLdc_RnFvwaXMwG_vIeg0AaI3U6Z2M0v5mQfZuoA_tp1mz4sAYB8WmtoqE7X/pub?gid=1898074716&single=true&output=csv';

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
  publicBoardCount?: number; // Опциональное поле для количества багов public board
  publicBoardPercentage?: number; // Опциональное поле для процента багов public board
  widgetCount?: number; // Опциональное поле для количества багов widget
  widgetPercentage?: number; // Опциональное поле для процента багов widget
  importCount?: number; // Добавляем поле для импорт-багов
  importPercentage?: number; // Добавляем процент импорт-багов
}

// Интерфейс для пропсов компонента
interface ComponentAnalysisProps {
  data: ComponentData[];
  period: string;
}

const ComponentAnalysis: React.FC<ComponentAnalysisProps> = ({ data, period }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataState, setData] = useState<ComponentData[]>(data);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Process data from API or service
        const componentData = await getComponentData(SHEET_URL);
        if (componentData && componentData.length > 0) {
          // Преобразуем данные в формат ComponentData
          const transformedData: ComponentData[] = componentData.map(component => {
            // Предполагаем, что count будет из id, а percentage рассчитываем
            const count = parseInt(component.id) || 0;
            return {
              name: component.name,
              count: count,
              percentage: 0, // Процент рассчитаем после получения общего количества
              // Другие поля могут быть добавлены при необходимости
            };
          });
          
          // Рассчитываем общее количество и проценты
          const totalCount = transformedData.reduce((sum, item) => sum + item.count, 0);
          const dataWithPercentages = transformedData.map(item => ({
            ...item,
            percentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0
          }));
          
          // Сортируем данные по количеству в порядке убывания
          const sortedData = [...dataWithPercentages].sort((a, b) => b.count - a.count);
          setData(sortedData);
        } else {
          // Fallback to initial data if no data is returned
          setData(data);
        }
      } catch (err) {
        setError('Ошибка при загрузке данных компонентов');
        console.error('Error loading component data:', err);
        setData(data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Пустой массив зависимостей, чтобы загрузка происходила только при монтировании

  // If we still have data loading
  if (loading) {
    return <div className="flex justify-center p-8"><Spinner /></div>;
  }

  // If we have an error
  if (error) {
    return <div className="bg-red-50 p-4 rounded-md text-red-500">{error}</div>;
  }

  // If we don't have data
  if (!data || data.length === 0) {
    return <div className="p-4 text-gray-500">Нет данных о компонентах</div>;
  }

  // Сортируем данные от большего к меньшему
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  // Calculate totals - учитываем все типы багов
  const totalBugs = sortedData.reduce((sum, item) => {
    // Базовое количество
    let itemTotal = item.count;
    // Добавляем publicBoardCount и widgetCount, если они есть
    if (item.publicBoardCount) itemTotal += item.publicBoardCount;
    if (item.widgetCount) itemTotal += item.widgetCount;
    return sum + itemTotal;
  }, 0);
  const totalImportBugs = sortedData.reduce((sum, item) => sum + (item.importCount || 0), 0);

  // Prepare chart data - добавляем dataSets для publicBoard и widget
  const chartData = {
    labels: sortedData.map(item => item.name),
    datasets: [
      {
        label: 'Баги',
        data: sortedData.map(item => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Public Board',
        data: sortedData.map(item => item.publicBoardCount || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Widget',
        data: sortedData.map(item => item.widgetCount || 0),
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
      {
        label: 'Import-баги',
        data: sortedData.map(item => item.importCount || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      {/* Заголовок с периодом */}
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-xl font-semibold text-red-800"></h3>
      </div>
      
      {/* Горизонтальная диаграмма - теперь идет первой */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-red-800 mb-4">
          Распределение багов по компонентам
        </h3>
        <div className="h-96">
          <Bar 
            data={chartData} 
            options={{
              indexAxis: 'y' as const,
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'bottom',
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const datasetIndex = context.datasetIndex;
                      const value = context.raw as number;
                      
                      if (value === 0) return ''; // Возвращаем пустую строку для нулевых значений
                      
                      if (datasetIndex === 0) {
                        // Основной дата-сет (обычные баги)
                        const percentage = (value / totalBugs * 100).toFixed(1);
                        return `Багов: ${value} (${percentage}%)`;
                      } else if (datasetIndex === 1) {
                        // Дата-сет для public board
                        const percentage = (value / totalBugs * 100).toFixed(1);
                        return `Public Board: ${value} (${percentage}%)`;
                      } else if (datasetIndex === 2) {
                        // Дата-сет для widget
                        const percentage = (value / totalBugs * 100).toFixed(1);
                        return `Widget: ${value} (${percentage}%)`;
                      } else if (datasetIndex === 3) {
                        // Дата-сет для import
                        const percentage = (value / totalBugs * 100).toFixed(1);
                        return `Import: ${value} (${percentage}%)`;
                      }
                      return '';
                    }
                  }
                }
              },
              scales: {
                x: {
                  stacked: true,
                  grid: {
                    display: false
                  }
                },
                y: {
                  stacked: true,
                  grid: {
                    display: false
                  }
                }
              }
            }} 
          />
        </div>
      </div>
      
      {/* Таблица данных - теперь идет второй */}
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Component type
              </th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              </th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                %
              </th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Всего
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => {
              // Рассчитываем общее количество багов для каждого компонента
              const componentTotal = item.count + (item.publicBoardCount || 0) + (item.widgetCount || 0);
              return (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm">{item.name}</td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">{item.count}</td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">{item.percentage.toFixed(2)}%</td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm text-right font-medium">{componentTotal}</td>
                </tr>
              );
            })}
            <tr className="bg-gray-100 font-medium">
              <td className="py-2 px-4 border-b border-gray-200 text-sm">Всего</td>
              <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">{sortedData.reduce((sum, item) => sum + item.count, 0)}</td>
              <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">100.00%</td>
              <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">{totalBugs}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComponentAnalysis; 