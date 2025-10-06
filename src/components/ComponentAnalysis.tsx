'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRuWLNT-ndzf4VP3VGl0YYYGBPY0hwtjCzsG9v8gMiIUvcq3C-UG9V9FEFMR6eUJCLiZkKCXfmgoor/pub?gid=1898074716&single=true&output=csv';

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
  selectedPeriod?: string; // Выбранный период
  onPeriodChange?: (period: string) => void; // Функция изменения периода
}

// Интерфейс для периодов
interface Period {
  id: string;
  label: string;
  selected: boolean;
}

const ComponentAnalysis: React.FC<ComponentAnalysisProps> = ({ data, period, selectedPeriod, onPeriodChange }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataState, setData] = useState<ComponentData[]>(data);
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [selectedPeriods, setSelectedPeriods] = useState<Period[]>([
    { id: 'period1', label: '03.02.2025 - 13.04.2025', selected: true },
    { id: 'period2', label: '13.04.2025 - 08.06.2025', selected: false },
    { id: 'period3', label: '09.06.2025 - 06.07.2025', selected: false },
    { id: 'period4', label: '07.07.2025 - 03.08.2025', selected: false },
    { id: 'period5', label: '04.08.2025 - 31.08.2025', selected: false },
  ]);

  // Моковые данные для всех периодов (в реальном приложении это будет приходить из API)
  const allPeriodsData = {
    period1: [
      { name: 'ai', count: 1, percentage: 2.44 },
      { name: 'auth/registration', count: 1, percentage: 2.44 },
      { name: 'banner', count: 3, percentage: 7.32 },
      { name: 'matrix', count: 3, percentage: 7.32 },
      { name: 'backlog', count: 12, percentage: 29.27 },
      { name: 'voting', count: 5, percentage: 12.20 },
      { name: 'templates', count: 1, percentage: 2.44 },
      { name: 'users', count: 2, percentage: 4.88 },
      { name: 'settings', count: 4, percentage: 9.76 },
      { name: 'sync back', count: 3, percentage: 7.32 },
      { name: 'evaluation', count: 1, percentage: 2.44 },
      { name: 'notifications', count: 1, percentage: 2.44 },
      { name: 'ui_components', count: 2, percentage: 4.88 },
      { name: 'links', count: 1, percentage: 2.44 },
      { name: 'noco', count: 1, percentage: 2.44 }
    ],
    period2: [
      { name: 'course', count: 3, percentage: 11.11 },
      { name: 'banner', count: 1, percentage: 3.70 },
      { name: 'matrix', count: 1, percentage: 3.70 },
      { name: 'backlog', count: 3, percentage: 11.11 },
      { name: 'voting', count: 9, percentage: 33.33 },
      { name: 'billing', count: 1, percentage: 3.70 },
      { name: 'alignment', count: 1, percentage: 3.70 },
      { name: 'settings', count: 2, percentage: 7.41 },
      { name: 'sync back', count: 2, percentage: 7.41 },
      { name: 'notifications', count: 1, percentage: 3.70 },
      { name: 'ui_components', count: 3, percentage: 11.11 }
    ],
    period3: [
      { name: 'ai', count: 1, percentage: 3.13 },
      { name: 'criteria', count: 1, percentage: 3.13 },
      { name: 'columns', count: 1, percentage: 3.13 },
      { name: 'matrix', count: 1, percentage: 3.13 },
      { name: 'backlog', count: 9, percentage: 28.13 },
      { name: 'voting', count: 5, percentage: 15.63 },
      { name: 'templates', count: 1, percentage: 3.13 },
      { name: 'users', count: 1, percentage: 3.13 },
      { name: 'settings', count: 1, percentage: 3.13 },
      { name: 'sync back', count: 1, percentage: 3.13 },
      { name: 'filtration', count: 1, percentage: 3.13 },
      { name: 'notifications', count: 2, percentage: 6.25 },
      { name: 'ui_components', count: 3, percentage: 9.38 },
      { name: 'links', count: 1, percentage: 3.13 },
      { name: 'csv', count: 2, percentage: 6.25 },
      { name: 'noco', count: 1, percentage: 3.13 }
    ],
    period4: [
      { name: 'ai', count: 1, percentage: 7.69 },
      { name: 'filters', count: 1, percentage: 7.69 },
      { name: 'criteria', count: 1, percentage: 7.69 },
      { name: 'billing', count: 1, percentage: 7.69 },
      { name: 'backlog', count: 1, percentage: 7.69 },
      { name: 'voting', count: 4, percentage: 30.77 },
      { name: 'users', count: 1, percentage: 7.69 },
      { name: 'sync back', count: 1, percentage: 7.69 },
      { name: 'links', count: 2, percentage: 15.38 }
    ],
    period5: [
      { name: 'workspace', count: 5, percentage: 20.83 },
      { name: 'columns', count: 2, percentage: 8.33 },
      { name: 'criteria', count: 1, percentage: 4.17 },
      { name: 'billing', count: 1, percentage: 4.17 },
      { name: 'backlog', count: 3, percentage: 12.50 },
      { name: 'voting', count: 6, percentage: 25.00 },
      { name: 'custom_fields', count: 1, percentage: 4.17 },
      { name: 'users', count: 1, percentage: 4.17 },
      { name: 'settings', count: 1, percentage: 4.17 },
      { name: 'ui_components', count: 2, percentage: 8.33 },
      { name: 'links', count: 1, percentage: 4.17 }
    ]
  };

  // Функция для объединения данных выбранных периодов
  const getCombinedData = (): ComponentData[] => {
    const selectedPeriodIds = selectedPeriods.filter(p => p.selected).map(p => p.id);
    
    if (selectedPeriodIds.length === 0) {
      return [];
    }

    // Создаем Map для объединения данных по компонентам
    const combinedMap = new Map<string, ComponentData>();

    selectedPeriodIds.forEach(periodId => {
      const periodData = allPeriodsData[periodId as keyof typeof allPeriodsData] || [];
      
      periodData.forEach(item => {
        if (combinedMap.has(item.name)) {
          const existing = combinedMap.get(item.name)!;
          existing.count += item.count;
        } else {
          combinedMap.set(item.name, { 
            ...item, 
            publicBoardCount: 0,
            widgetCount: 0,
            importCount: 0
          });
        }
      });
    });

    // Преобразуем Map в массив и рассчитываем проценты
    const combinedData = Array.from(combinedMap.values());
    const totalCount = combinedData.reduce((sum, item) => sum + item.count, 0);
    
    return combinedData.map(item => ({
      ...item,
      percentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0
    })).sort((a, b) => b.count - a.count);
  };

  // Обработчик изменения чекбокса периода
  const handlePeriodToggle = (periodId: string) => {
    setSelectedPeriods(prev => 
      prev.map(period => 
        period.id === periodId 
          ? { ...period, selected: !period.selected }
          : period
      )
    );
  };

  // Обработчик выбора всех периодов
  const handleSelectAll = () => {
    setSelectedPeriods(prev => 
      prev.map(period => ({ ...period, selected: true }))
    );
  };

  // Обработчик снятия выбора со всех периодов
  const handleDeselectAll = () => {
    setSelectedPeriods(prev => 
      prev.map(period => ({ ...period, selected: false }))
    );
  };

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

  // Получаем объединенные данные с мемоизацией
  const combinedData = useMemo(() => {
    let resultData;
    
    // Если панель выбора периодов активна, используем внутренние моковые данные для суммирования
    if (showPeriodSelector) {
      resultData = getCombinedData();
    }
    // Если данные переданы через props, используем их
    else if (data && data.length > 0) {
      resultData = data;
    }
    // Иначе используем внутренние моковые данные
    else {
      resultData = getCombinedData();
    }
    
    // Сортируем данные от большего к меньшему
    return resultData.sort((a, b) => b.count - a.count);
  }, [data, selectedPeriods, showPeriodSelector]);

  // Calculate totals - учитываем все типы багов
  const { totalBugs, totalImportBugs, chartData } = useMemo(() => {
    const totalBugs = combinedData.reduce((sum, item) => {
      // Базовое количество
      let itemTotal = item.count;
      // Добавляем publicBoardCount и widgetCount, если они есть
      if (item.publicBoardCount) itemTotal += item.publicBoardCount;
      if (item.widgetCount) itemTotal += item.widgetCount;
      return sum + itemTotal;
    }, 0);
    
    const totalImportBugs = combinedData.reduce((sum, item) => sum + (item.importCount || 0), 0);

    // Prepare chart data - добавляем dataSets для publicBoard и widget
    const chartData = {
      labels: combinedData.map(item => item.name),
      datasets: [
        {
          label: 'Баги',
          data: combinedData.map(item => item.count),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Public Board',
          data: combinedData.map(item => item.publicBoardCount || 0),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Widget',
          data: combinedData.map(item => item.widgetCount || 0),
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
        {
          label: 'Import-баги',
          data: combinedData.map(item => item.importCount || 0),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        }
      ],
    };

    return { totalBugs, totalImportBugs, chartData };
  }, [combinedData]);

  // If we still have data loading
  if (loading) {
    return <div className="flex justify-center p-8"><Spinner /></div>;
  }

  // If we have an error
  if (error) {
    return <div className="bg-red-50 p-4 rounded-md text-red-500">{error}</div>;
  }

  // If we don't have data
  if (!combinedData || combinedData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden h-full">
        <div className="border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-red-800">Распределение багов по компонентам</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                className="border border-gray-300 rounded px-3 py-1 text-sm bg-white hover:bg-gray-50"
              >
                {showPeriodSelector ? 'Скрыть периоды' : 'Выбрать периоды'}
              </button>
            </div>
          </div>
          {showPeriodSelector && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Выберите периоды для сводного отчета:</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Выбрать все
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Снять выбор
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedPeriods.map((period) => (
                  <label key={period.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={period.selected}
                      onChange={() => handlePeriodToggle(period.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{period.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Выбрано периодов: {selectedPeriods.filter(p => p.selected).length} из {selectedPeriods.length}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 text-gray-500">Нет данных о компонентах</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      {/* Заголовок с дропдауном */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-red-800">Распределение багов по компонентам</h3>
                      <div className="flex items-center space-x-2">
              {/* Кнопка для показа/скрытия селектора периодов */}
              <button
                onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                className="border border-gray-300 rounded px-3 py-1 text-sm bg-white hover:bg-gray-50"
              >
                {showPeriodSelector ? 'Скрыть периоды' : 'Выбрать периоды'}
              </button>
              
              {/* Старый селектор для обратной совместимости */}
              {onPeriodChange && !showPeriodSelector && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Режим одиночного периода</span>
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
                  </select>
                </div>
              )}
            </div>
        </div>

        {/* Селектор периодов с чекбоксами */}
        {showPeriodSelector && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Выберите периоды для сводного отчета:</h4>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Режим суммирования</span>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Выбрать все
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Снять выбор
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {selectedPeriods.map((period) => (
                <label key={period.id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={period.selected}
                    onChange={() => handlePeriodToggle(period.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{period.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Выбрано периодов: {selectedPeriods.filter(p => p.selected).length} из {selectedPeriods.length}
            </div>
          </div>
        )}
      </div>
      
      {/* Горизонтальная диаграмма - теперь идет первой */}
      <div className="p-6">
        <div className="h-96">
          <Bar 
            data={chartData} 
            options={{
              indexAxis: 'y' as const,
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false, // Отключаем отображение легенды
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
            {combinedData.map((item, index) => {
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
              <td className="py-2 px-4 border-b border-gray-200 text-sm text-right">{combinedData.reduce((sum, item) => sum + item.count, 0)}</td>
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