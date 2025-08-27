'use client';

import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { loadSheetData } from '@/services/dataService';

// ID таблицы из URL
const SPREADSHEET_ID = '2PACX-1vSRuWLNT-ndzf4VP3VGl0YYYGBPY0hwtjCzsG9v8gMiIUvcq3C-UG9V9FEFMR6eUJCLiZkKCXfmgoor'; // Обновленный ID таблицы
// Имя листа и диапазон
const SHEET_NAME = 'backlog';
const RANGE = 'G2:H4'; // Диапазон, где G8 содержит "prod", G9 содержит "stage" и G10 содержит "total"

// URL для загрузки данных из таблицы
const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=1898074716&single=true&output=csv`;

// Регистрация необходимых компонентов Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Интерфейс для данных об окружениях
interface EnvironmentData {
  environment: string;  // Название окружения
  count: number;      // Количество багов
  percentage: number;  // Процент от общего числа багов
  color: string;       // Цвет для графика
}

// Интерфейс для пропсов компонента
interface BugEnvironmentProps {
  data?: EnvironmentData[]; // Опциональные данные
  period: string;
  selectedPeriod?: string; // Выбранный период
  onPeriodChange?: (period: string) => void; // Функция изменения периода
}

const BugEnvironment: React.FC<BugEnvironmentProps> = ({ data: initialData, period, selectedPeriod, onPeriodChange }) => {
  // Состояние для хранения данных
  const [data, setData] = useState<EnvironmentData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    // Если данные уже переданы через props, используем их
    if (initialData && initialData.length > 0) {
      setData(initialData);
      return;
    }

    // Иначе загружаем данные из сервиса
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('BugEnvironment: Начало загрузки данных из таблицы:', SHEET_URL);
        
        // Получаем данные напрямую из таблицы
        const sheetData = await loadSheetData(SHEET_URL);
        
        console.log('BugEnvironment: Получены данные из таблицы:', sheetData);
        
        // Если данных нет, устанавливаем пустой массив и завершаем
        if (!sheetData || sheetData.length === 0) {
          console.error('BugEnvironment: Не получены данные из таблицы');
          setData([]);
          setLoading(false);
          return;
        }

        // Выводим полученные данные для отладки
        console.log('BugEnvironment: Структура первых строк:', 
          sheetData.slice(0, Math.min(3, sheetData.length))
        );
        
        // Дамп всех ключей из первой строки
        if (sheetData.length > 0) {
          console.log('BugEnvironment: Доступные колонки:', Object.keys(sheetData[0]));
        }

        // Ищем строки с данными о prod и stage
        // В таблице это может быть в разных местах
        const prodRow = sheetData.find(row => {
          return Object.entries(row).some(([key, value]) => 
            typeof value === 'string' && 
            value.toString().toLowerCase().trim() === 'prod'
          );
        });
        
        const stageRow = sheetData.find(row => {
          return Object.entries(row).some(([key, value]) => 
            typeof value === 'string' && 
            value.toString().toLowerCase().trim() === 'stage'
          );
        });
        
        const totalRow = sheetData.find(row => {
          return Object.entries(row).some(([key, value]) => 
            typeof value === 'string' && 
            value.toString().toLowerCase().trim().includes('total')
          );
        });

        console.log('BugEnvironment: Найденные строки:', { 
          prodRow: prodRow || 'не найдено', 
          stageRow: stageRow || 'не найдено', 
          totalRow: totalRow || 'не найдено' 
        });
        
        if (!prodRow && !stageRow) {
          // Альтернативный поиск: ищем строки, где есть данные в колонках Prod и Stage
          for (const row of sheetData) {
            console.log('BugEnvironment: Проверка строки:', row);
            
            // Ищем колонки с prod/stage в заголовке
            const prodKey = Object.keys(row).find(key => 
              key.toLowerCase().includes('prod')
            );
            
            const stageKey = Object.keys(row).find(key => 
              key.toLowerCase().includes('stag')
            );
            
            if (prodKey || stageKey) {
              console.log('BugEnvironment: Найдены колонки:', { prodKey, stageKey });
              
              // Создаем массив данных для окружений
              const formattedData: EnvironmentData[] = [];
              let totalBugs = 0;
              
              if (prodKey && row[prodKey]) {
                const prodBugs = parseInt(row[prodKey]) || 0;
                totalBugs += prodBugs;
                
                formattedData.push({
                  environment: 'Production',
                  count: prodBugs,
                  percentage: 0, // Заполним позже
                  color: '#FF6384' // Красный для Production
                });
              }
              
              if (stageKey && row[stageKey]) {
                const stageBugs = parseInt(row[stageKey]) || 0;
                totalBugs += stageBugs;
                
                formattedData.push({
                  environment: 'Staging',
                  count: stageBugs,
                  percentage: 0, // Заполним позже
                  color: '#36A2EB' // Синий для Staging
                });
              }
              
              // Вычисляем проценты
              if (totalBugs > 0) {
                formattedData.forEach(item => {
                  item.percentage = Math.round((item.count / totalBugs) * 100);
                });
              }
              
              console.log('BugEnvironment: Данные найдены в колонках:', formattedData);
              setData(formattedData);
              setLoading(false);
              return;
            }
          }
          
          console.error('BugEnvironment: Не найдены данные о prod и stage в таблице');
          setError('Не найдены данные о prod и stage в таблице');
          setLoading(false);
          return;
        }

        // Создаем массив данных для окружений
        const formattedData: EnvironmentData[] = [];
        
        // Получаем значения для prod и stage
        let prodBugs = 0;
        let stageBugs = 0;
        
        if (prodRow) {
          // Находим число рядом с 'prod'
          const entries = Object.entries(prodRow);
          console.log('BugEnvironment: Содержимое prodRow:', entries);
          
          // Ищем ключ с 'prod'
          const prodEntry = entries.find(([key, value]) => 
            typeof value === 'string' && value.toLowerCase() === 'prod'
          );
          
          if (prodEntry) {
            const prodKey = prodEntry[0];
            const keyIndex = Object.keys(prodRow).indexOf(prodKey);
            const nextKey = Object.keys(prodRow)[keyIndex + 1];
            
            if (nextKey) {
              prodBugs = parseInt(prodRow[nextKey]) || 0;
              console.log(`BugEnvironment: Найдено значение для prod: ${prodBugs} (ключ ${nextKey})`);
            }
          }
          
          // Если не нашли через соседний ключ, ищем через соседние значения
          if (prodBugs === 0) {
            let foundProd = false;
            for (const [key, value] of entries) {
              if (foundProd && value && !isNaN(parseInt(value.toString()))) {
                prodBugs = parseInt(value.toString());
                console.log(`BugEnvironment: Найдено значение для prod через соседнее значение: ${prodBugs}`);
                break;
              }
              
              if (typeof value === 'string' && value.toLowerCase() === 'prod') {
                foundProd = true;
              }
            }
          }
        }
        
        if (stageRow) {
          // Находим число рядом с 'stage'
          const entries = Object.entries(stageRow);
          console.log('BugEnvironment: Содержимое stageRow:', entries);
          
          // Ищем ключ с 'stage'
          const stageEntry = entries.find(([key, value]) => 
            typeof value === 'string' && value.toLowerCase() === 'stage'
          );
          
          if (stageEntry) {
            const stageKey = stageEntry[0];
            const keyIndex = Object.keys(stageRow).indexOf(stageKey);
            const nextKey = Object.keys(stageRow)[keyIndex + 1];
            
            if (nextKey) {
              stageBugs = parseInt(stageRow[nextKey]) || 0;
              console.log(`BugEnvironment: Найдено значение для stage: ${stageBugs} (ключ ${nextKey})`);
            }
          }
          
          // Если не нашли через соседний ключ, ищем через соседние значения
          if (stageBugs === 0) {
            let foundStage = false;
            for (const [key, value] of entries) {
              if (foundStage && value && !isNaN(parseInt(value.toString()))) {
                stageBugs = parseInt(value.toString());
                console.log(`BugEnvironment: Найдено значение для stage через соседнее значение: ${stageBugs}`);
                break;
              }
              
              if (typeof value === 'string' && value.toLowerCase() === 'stage') {
                foundStage = true;
              }
            }
          }
        }
        
        // Получаем общее количество багов
        let totalBugs = prodBugs + stageBugs;
        
        // Если есть строка с total, используем ее значение
        if (totalRow) {
          const entries = Object.entries(totalRow);
          console.log('BugEnvironment: Содержимое totalRow:', entries);
          
          // Ищем ключ с 'total'
          const totalEntry = entries.find(([key, value]) => 
            typeof value === 'string' && value.toString().toLowerCase().includes('total')
          );
          
          if (totalEntry) {
            const totalKey = totalEntry[0];
            const keyIndex = Object.keys(totalRow).indexOf(totalKey);
            const nextKey = Object.keys(totalRow)[keyIndex + 1];
            
            if (nextKey) {
              const parsedTotal = parseInt(totalRow[nextKey]);
              if (!isNaN(parsedTotal)) {
                totalBugs = parsedTotal;
                console.log(`BugEnvironment: Найдено значение для total: ${totalBugs} (ключ ${nextKey})`);
              }
            }
          }
          
          // Если не нашли через соседний ключ, ищем через соседние значения
          let foundTotal = false;
          for (const [key, value] of entries) {
            if (foundTotal && value && !isNaN(parseInt(value.toString()))) {
              const parsedTotal = parseInt(value.toString());
              if (!isNaN(parsedTotal)) {
                totalBugs = parsedTotal;
                console.log(`BugEnvironment: Найдено значение для total через соседнее значение: ${totalBugs}`);
                break;
              }
            }
            
            if (typeof value === 'string' && value.toString().toLowerCase().includes('total')) {
              foundTotal = true;
            }
          }
        }
        
        console.log('BugEnvironment: Извлеченные данные:', { prodBugs, stageBugs, totalBugs });
        
        // Добавляем данные для Production
        if (prodBugs > 0) {
          formattedData.push({
            environment: 'Production',
            count: prodBugs,
            percentage: totalBugs > 0 ? Math.round((prodBugs / totalBugs) * 100) : 0,
            color: '#FF6384' // Красный для Production
          });
        }
        
        // Добавляем данные для Staging
        if (stageBugs > 0) {
          formattedData.push({
            environment: 'Staging',
            count: stageBugs,
            percentage: totalBugs > 0 ? Math.round((stageBugs / totalBugs) * 100) : 0,
            color: '#36A2EB' // Синий для Staging
          });
        }
        
        console.log('BugEnvironment: Финальные данные для отображения:', formattedData);
        setData(formattedData);
      } catch (err) {
        console.error('BugEnvironment: Ошибка при загрузке данных окружений:', err);
        setError('Ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
      } finally {
      setLoading(false);
    }
    };
    
    loadData();
  }, [initialData]);

  // Подготовка данных для диаграммы
  const chartData = {
    labels: data.map(item => item.environment),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  // Общее количество багов
  const totalBugs = data.reduce((sum, item) => sum + item.count, 0);

  // Если данные загружаются, показываем индикатор загрузки
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-800 border-t-transparent"></div>
        <p className="ml-2 text-gray-600">Загрузка данных...</p>
      </div>
    );
  }

  // Если произошла ошибка, показываем сообщение об ошибке
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Если нет данных, показываем сообщение
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-4">{period} Bugs</h2>
        <p className="text-gray-600">Нет данных о багах по окружениям</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      {/* Заголовок с дропдауном периода */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-red-800">Распределение багов по окружениям</h3>
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
            </select>
          )}
        </div>
      </div>
      
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
                    boxWidth: 15,
                    padding: 15,
                    font: {
                      size: 12
                    }
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.raw as number;
                      const percentage = data[context.dataIndex]?.percentage.toFixed(2) || '0';
                      return `${label}: ${value} (${percentage}%)`;
                    }
                  }
                }
              }
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
                  {item.environment}
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
                Total
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
    </div>
  );
};

export default BugEnvironment; 