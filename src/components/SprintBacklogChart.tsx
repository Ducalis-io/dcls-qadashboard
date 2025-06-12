'use client';

import React, { useEffect, useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ScriptableContext
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchSheetDataFromURL } from '@/utils/googleSheets';

// Моковые данные для гарантированного отображения - обновлено согласно скриншоту
const MOCK_SPRINT_DATA: SprintData[] = [
  { sprint: 'Sprint 3', date: '03.02.2025', backlogBugs: 74 },
  { sprint: 'Sprint 4', date: '10.02.2025', backlogBugs: 76 },
  { sprint: 'Sprint 5', date: '17.02.2025', backlogBugs: 73 },
  { sprint: 'Sprint 6', date: '24.02.2025', backlogBugs: 68 },
  { sprint: 'Sprint 7', date: '03.03.2025', backlogBugs: 71 },
  { sprint: 'Sprint 8', date: '10.03.2025', backlogBugs: 57 },
  { sprint: 'Sprint 9', date: '17.03.2025', backlogBugs: 57 },
  { sprint: 'Sprint 10', date: '24.03.2025', backlogBugs: 54 },
  { sprint: 'Sprint 11', date: '31.03.2025', backlogBugs: 57 },
  { sprint: 'Sprint 12', date: '07.04.2025', backlogBugs: 38 },
  { sprint: 'Sprint 13', date: '14.04.2025', backlogBugs: 0 }
];

// Константы с URL Google Sheets - несколько вариантов для тестирования
const SHEET_URLS = [
  // Рабочая ссылка на таблицу
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSbQv0mUFgEOplZ2en0PLdc_RnFvwaXMwG_vIeg0AaI3U6Z2M0v5mQfZuoA_tp1mz4sAYB8WmtoqE7X/pub?gid=1898074716&single=true&output=csv',
  // Запасные варианты ссылок
  'https://docs.google.com/spreadsheets/d/1sL8Ux5TVi96Kh4dYmqD2Tr6tesMEcA0Xd3fhVJ3Z8dI/export?format=csv',
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQtlQmrAkuA4MbojOsMRZZ9kbqJUMrJfNZl4chJYfLVZJM7LKgYyAn_6JnPCq2Wb9iFsZvQNkJe5K4r/pub?output=csv'
];

// Флаг для использования моковых данных вместо загрузки из Google Sheets
// Установлено true для демонстрации на GitHub Pages
const USE_MOCK_DATA = true; // Используем моковые данные для демонстрации

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
  date: string;
  backlogBugs: number;
}

// Интерфейс для пропсов компонента
interface SprintBacklogChartProps {
  data?: SprintData[]; // Теперь данные опциональны
  period?: string; // Опциональное отображение периода
}

const SprintBacklogChart: React.FC<SprintBacklogChartProps> = ({ data: initialData, period }) => {
  // Добавляем состояние для хранения данных
  const [data, setData] = useState<SprintData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    // Если указано использовать моковые данные, то используем их
    if (USE_MOCK_DATA) {
      console.log('Используем моковые данные для отображения');
      setData(MOCK_SPRINT_DATA);
      return;
    }
    
    // Если данные уже переданы через props, используем их
    if (initialData && initialData.length > 0) {
      console.log('Используем данные из props:', initialData);
      setData(initialData);
      return;
    }

    // Иначе загружаем данные из Google Sheets
    async function loadData() {
      setLoading(true);
      setError(null);
      
      // Пробуем последовательно каждый URL, пока один не сработает
      let lastError = null;
      let success = false;
      
      for (const sheetUrl of SHEET_URLS) {
        if (success) break; // Если уже успешно загрузили, прерываем цикл
        
        try {
          // Отладка URL
          console.log('Попытка загрузки данных из URL:', sheetUrl);
          
          // Получаем данные из Google Sheets
          const sheetData = await fetchSheetDataFromURL(sheetUrl);
          
          // Отладка полученных данных
          console.log('Получены данные из таблицы:', sheetData);
          setRawData(sheetData);
          
          if (sheetData && sheetData.length > 0) {
            console.log('Структура первой строки:', Object.keys(sheetData[0]));
            
            // Получаем данные из таблицы
            const dataRows = sheetData;
            
            // Проверяем, что данные правильно разобраны
            if (dataRows[0] && typeof dataRows[0] === 'object') {
              // Обрабатываем данные, учитывая возможные варианты заголовков:
              // 1. Дата, Спринт, Баги (если используются стандартные заголовки)
              // 2. date, sprint, backlogBugs (если заголовки на английском)
              // 3. Любые другие заголовки, где первые три столбца содержат нужные данные
              const processedData = dataRows.map((row, index) => {
                try {
                  // Получаем ключи/заголовки столбцов
                  const keys = Object.keys(row);
                  console.log(`Обработка строки ${index + 1}, ключи:`, keys);
                  
                  if (keys.length < 3) {
                    console.warn(`Строка ${index + 1} имеет недостаточно столбцов:`, row);
                    return null;
                  }
                  
                  // Проверяем наличие стандартных заголовков (Дата, Спринт, Баги)
                  let dateValue = "";
                  let sprintValue = "";
                  let bugsValue = 0;
                  
                  // Пытаемся найти значения по разным возможным ключам
                  if (row["Дата отчета"] !== undefined && row["Sprint"] !== undefined && row["Кол-во багов в бэклоге (всего)"] !== undefined) {
                    // Вариант с заголовками как на скриншоте
                    dateValue = row["Дата отчета"] || "";
                    sprintValue = row["Sprint"] || "";
                    bugsValue = parseInt(row["Кол-во багов в бэклоге (всего)"] || "0");
                  } else if (row["Дата"] !== undefined && row["Спринт"] !== undefined && row["Баги"] !== undefined) {
                    // Вариант с русскими стандартными заголовками
                    dateValue = row["Дата"] || "";
                    sprintValue = row["Спринт"] || "";
                    bugsValue = parseInt(row["Баги"] || "0");
                  } else if (row["date"] !== undefined && row["sprint"] !== undefined && row["backlogBugs"] !== undefined) {
                    // Вариант с английскими заголовками
                    dateValue = row["date"] || "";
                    sprintValue = row["sprint"] || "";
                    bugsValue = parseInt(row["backlogBugs"] || "0");
                  } else {
                    // Используем первые три столбца по порядку
                    const dateKey = keys[0];
                    const sprintKey = keys[1];
                    const bugsKey = keys[2];
                    
                    dateValue = row[dateKey] || "";
                    sprintValue = row[sprintKey] || "";
                    bugsValue = parseInt(row[bugsKey] || "0");
                  }
                  
                  // Отладка значений
                  console.log(`Строка ${index + 1}: дата=${dateValue}, спринт=${sprintValue}, баги=${bugsValue}`);
                  
                  return {
                    date: dateValue,
                    sprint: sprintValue,
                    backlogBugs: bugsValue
                  };
                } catch (rowErr) {
                  console.error(`Ошибка при обработке строки ${index + 1}:`, rowErr);
                  return null;
                }
              }).filter((item): item is SprintData => {
                // Фильтруем недействительные записи
                if (!item) return false;
                
                // Фильтруем только записи с корректными данными
                const isValid = Boolean(
                  item.sprint && 
                  item.date && 
                  !isNaN(item.backlogBugs) && 
                  item.backlogBugs > 0
                );
                
                if (!isValid) {
                  console.log('Отфильтрована некорректная запись:', item);
                }
                
                return isValid;
              });
              
              console.log('Обработанные данные:', processedData);
              
              if (processedData.length > 0) {
                setData(processedData);
                success = true;
                break;
              } else {
                console.error('Не найдены корректные данные в таблице');
                lastError = new Error("Не найдены корректные данные в таблице");
              }
            } else {
              console.error('Неверный формат данных. Ожидался массив объектов.');
              lastError = new Error("Неверный формат данных. Ожидался массив объектов.");
            }
          } else {
            console.error('Пустые данные из таблицы');
            lastError = new Error("Не удалось загрузить данные из таблицы");
          }
        } catch (err) {
          console.error(`Ошибка при загрузке данных из URL ${sheetUrl}:`, err);
          lastError = err;
        }
      }
      
      // Если ни один URL не сработал
      if (!success) {
        console.error("Все попытки загрузки данных неудачны:", lastError);
        
        setError(`Не удалось загрузить данные: ${lastError instanceof Error ? lastError.message : 'Неизвестная ошибка'}`);
        
        // Используем моковые данные в случае ошибки
        setData(MOCK_SPRINT_DATA);
        console.log('Установлены моковые данные после ошибки:', MOCK_SPRINT_DATA);
      }
      
      setLoading(false);
    }
    
    loadData();
  }, [initialData]);
  
  // Функция для парсинга даты в формате DD.MM.YYYY
  const parseDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  };
  
  // Извлекаем даты периода из строки периода (формат: "DD.MM.YYYY - DD.MM.YYYY")
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  
  if (period) {
    const dates = period.split('-').map(s => s.trim());
    if (dates.length === 2) {
      try {
        startDate = parseDate(dates[0]);
        // Если вторая часть - "текущая дата", используем сегодня
        if (dates[1].toLowerCase().includes('текущ')) {
          endDate = new Date();
        } else {
          endDate = parseDate(dates[1]);
        }
      } catch (e) {
        console.error('Ошибка парсинга дат периода:', e);
      }
    }
  }
  
  // Сортируем данные по дате (по возрастанию)
  const sortedData = [...data].sort((a, b) => {
    // Предполагаем формат даты DD.MM.YYYY
    const [dayA, monthA, yearA] = a.date.split('.').map(Number);
    const [dayB, monthB, yearB] = b.date.split('.').map(Number);
    
    // Сравниваем сначала год, потом месяц, потом день
    if (yearA !== yearB) return yearA - yearB;
    if (monthA !== monthB) return monthA - monthB;
    return dayA - dayB;
  });
  
  // Фильтруем данные по периоду, если указаны даты
  const filteredData = sortedData.filter(item => {
    if (!startDate || !endDate) return true;
    
    const itemDate = parseDate(item.date);
    return itemDate >= startDate && itemDate <= endDate;
  });

  // Обработка случая, когда данные загружаются
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-800 border-t-transparent"></div>
        <p className="ml-2 text-gray-600">Загрузка данных о спринтах...</p>
      </div>
    );
  }

  // Обработка случая, когда произошла ошибка
  if (error && filteredData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Обработка случая, когда нет данных
  if (filteredData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Динамика багов в бэклоге по спринтам
          {period && <span className="text-sm text-gray-500 ml-2">({period})</span>}
        </h3>
        <p className="text-gray-600">Нет данных о багах по спринтам за указанный период</p>
      </div>
    );
  }
  
  // Находим минимальное количество багов для выделения цветом
  const minBugs = Math.min(...filteredData.map(item => item.backlogBugs));
  // Находим максимальное количество багов для контраста
  const maxBugs = Math.max(...filteredData.map(item => item.backlogBugs));
  
  // Подготовка данных для линейного графика
  const chartData = {
    labels: filteredData.map(item => item.sprint),
    datasets: [
      {
        label: 'Баги в бэклоге',
        data: filteredData.map(item => item.backlogBugs),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: (context: ScriptableContext<'line'>) => {
          // Получаем значение текущей точки
          const value = context.raw as number;
          const label = filteredData[context.dataIndex]?.sprint || '';
          
          // Если это Sprint 12 или количество багов меньше 40, выделяем зеленым
          if (label === 'Sprint 12' || value <= 40) {
            return 'rgba(75, 192, 75, 0.8)'; // зеленый для успешного снижения багов
          }
          // Если значение близко к минимальному, выделяем голубым
          if (value - minBugs < 5) {
            return 'rgba(75, 192, 192, 0.8)'; // голубой для хороших результатов
          }
          // Если значение близко к максимальному, выделяем красным
          if (maxBugs - value < 5) {
            return 'rgba(255, 99, 132, 0.8)'; // красный для высокого количества багов
          }
          // Остальные синим
          return 'rgba(53, 162, 235, 0.5)';
        },
        pointRadius: 8,
        pointHoverRadius: 10,
        borderWidth: 2,
        tension: 0.1, // немного сгладим линию
      }
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">
        Динамика багов в бэклоге по спринтам
        {period && <span className="text-sm text-gray-500 ml-2">({period})</span>}
      </h3>
      
      {/* Гибкий контейнер для расположения графика слева и таблицы справа */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Линейный график (занимает 2/3 ширины на десктопе) */}
        <div className="md:w-2/3">
          <div className="h-72">
        <Line 
          data={chartData} 
          options={{
            responsive: true,
                maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                    display: false,
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.dataset.label || '';
                    const value = context.raw as number;
                    return `${label}: ${value} багов`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                min: Math.max(0, minBugs - 10), // Начинаем немного ниже минимального значения
                title: {
                  display: true,
                  text: 'Количество багов'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Спринт'
                }
              }
            }
          }} 
        />
          </div>
      </div>
      
        {/* Компактная таблица справа (занимает 1/3 ширины на десктопе) */}
        <div className="md:w-1/3">
          <div className="overflow-x-auto h-72 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Sprint
                  </th>
                  <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Дата
                  </th>
                  <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Баги
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => {
                  // Определяем цвет фона для строки в зависимости от количества багов
                  let bgColorClass = "bg-white";
                  if (item.backlogBugs === minBugs) {
                    bgColorClass = "bg-green-100"; // минимальное количество багов - зеленый
                  } else if (item.backlogBugs === maxBugs) {
                    bgColorClass = "bg-red-100"; // максимальное количество багов - красный
                  } else if (item.backlogBugs < 60) {
                    bgColorClass = "bg-orange-100"; // меньше 60 багов - оранжевый
                  }
                  
                  return (
                    <tr key={index} className={bgColorClass}>
                      <td className="px-2 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                        {item.sprint}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900">
                        {item.date}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-xs text-right font-semibold text-gray-900">
                        {item.backlogBugs}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintBacklogChart; 