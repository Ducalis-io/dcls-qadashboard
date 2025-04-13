'use client';

import React, { useState, useEffect } from 'react';
import BugStatistics from '@/components/BugStatistics';
import BugTrends from '@/components/BugTrends';
import BugPriority from '@/components/BugPriority';
import BugEnvironment from '@/components/BugEnvironment';
import BugResolution from '@/components/BugResolution';
import ComponentAnalysis from '@/components/ComponentAnalysis';
import BugTrackers from '@/components/BugTrackers';
import TestCoverage from '@/components/TestCoverage';
import SprintBacklogChart from '@/components/SprintBacklogChart';
import BugReasons from '@/components/BugReasons';
import { getEnvironmentData, getSprintData } from '@/services/dataService';
import { fetchSheetDataFromURL } from '@/utils/googleSheets';

// URL опубликованной таблицы
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSbQv0mUFgEOplZ2en0PLdc_RnFvwaXMwG_vIeg0AaI3U6Z2M0v5mQfZuoA_tp1mz4sAYB8WmtoqE7X/pub?gid=1898074716&single=true&output=csv';

// Примеры данных - в реальном приложении они будут загружаться из API или бэкенда
const mockBugData = [
  { date: '2023-01', open: 25, closed: 12, critical: 5, major: 12, minor: 8 },
  { date: '2023-02', open: 28, closed: 15, critical: 6, major: 15, minor: 7 },
  { date: '2023-03', open: 22, closed: 20, critical: 4, major: 10, minor: 8 },
  { date: '2023-04', open: 18, closed: 22, critical: 3, major: 9, minor: 6 },
  { date: '2023-05', open: 23, closed: 19, critical: 5, major: 11, minor: 7 },
  { date: '2023-06', open: 20, closed: 21, critical: 4, major: 10, minor: 6 },
];

const mockTrendData = [
  { month: 'Январь', newBugs: 25, resolvedBugs: 20, reopenedBugs: 3 },
  { month: 'Февраль', newBugs: 28, resolvedBugs: 22, reopenedBugs: 4 },
  { month: 'Март', newBugs: 22, resolvedBugs: 26, reopenedBugs: 2 },
  { month: 'Апрель', newBugs: 18, resolvedBugs: 24, reopenedBugs: 1 },
  { month: 'Май', newBugs: 23, resolvedBugs: 21, reopenedBugs: 5 },
  { month: 'Июнь', newBugs: 20, resolvedBugs: 25, reopenedBugs: 2 },
];

const mockSeverityData = [
  { label: 'critical', count: 6, percentage: 14.63, color: 'rgba(255, 99, 132, 0.8)' },
  { label: 'major', count: 15, percentage: 36.59, color: 'rgba(255, 159, 64, 0.8)' },
  { label: 'minor', count: 11, percentage: 26.83, color: 'rgba(75, 192, 192, 0.8)' },
  { label: 'trivial', count: 9, percentage: 21.95, color: 'rgba(201, 203, 207, 0.8)' },
];

const mockEnvironmentData = [
  { environment: 'Prod', count: 41, percentage: 32.8, color: 'rgba(255, 99, 132, 0.8)' },
  { environment: 'Stage', count: 85, percentage: 67.2, color: 'rgba(75, 192, 192, 0.8)' },
];

const mockResolutionData = [
  { status: 'Done', count: 115, percentage: 92.0, color: 'rgba(75, 192, 192, 0.8)' },
  { status: 'To Do', count: 11, percentage: 8.8, color: 'rgba(255, 159, 64, 0.8)' },
];

const mockComponentData: any[] = [
  {
    name: 'voting', 
    count: 5, 
    percentage: 12.20
  },
  {
    name: 'ai', 
    count: 1, 
    percentage: 2.44
  },
  {
    name: 'auth/registration', 
    count: 1, 
    percentage: 2.44
  },
  {
    name: 'banner', 
    count: 3, 
    percentage: 7.32
  },
  {
    name: 'matrix', 
    count: 3, 
    percentage: 7.32
  },
  {
    name: 'backlog', 
    count: 12, 
    percentage: 29.27
  },
  {
    name: 'templates', 
    count: 1, 
    percentage: 2.44
  },
  {
    name: 'users', 
    count: 2, 
    percentage: 4.88
  },
  {
    name: 'settings', 
    count: 4, 
    percentage: 9.76
  },
  {
    name: 'sync back', 
    count: 3, 
    percentage: 7.32
  },
  {
    name: 'evaluation', 
    count: 1, 
    percentage: 2.44
  },
  {
    name: 'notifications', 
    count: 1, 
    percentage: 2.44
  },
  {
    name: 'ui_components', 
    count: 2, 
    percentage: 4.88
  },
  {
    name: 'url', 
    count: 1, 
    percentage: 2.44
  },
  {
    name: 'noco', 
    count: 1, 
    percentage: 2.44
  }
];

const mockTrackerData = [
  { name: 'jira', count: 6, percentage: 50.00, color: 'rgba(54, 162, 235, 0.8)' },
  { name: 'linear', count: 2, percentage: 16.67, color: 'rgba(255, 99, 132, 0.8)' },
  { name: 'asana', count: 2, percentage: 16.67, color: 'rgba(75, 192, 192, 0.8)' },
  { name: 'youtrack', count: 1, percentage: 8.33, color: 'rgba(255, 159, 64, 0.8)' },
  { name: 'kaiten', count: 1, percentage: 8.33, color: 'rgba(153, 102, 255, 0.8)' },
];

const mockReasonsData = [
  { reason: 'специфический/редкий кейс', count: 9, percentage: 27.27, color: 'rgba(54, 162, 235, 0.8)' },
  { reason: 'недоработка в требованиях', count: 2, percentage: 6.06, color: 'rgba(255, 99, 132, 0.8)' },
  { reason: 'кейс не был предусмотрен', count: 6, percentage: 18.18, color: 'rgba(75, 192, 192, 0.8)' },
  { reason: 'не проверялось на регрессе', count: 7, percentage: 21.21, color: 'rgba(255, 159, 64, 0.8)' },
  { reason: 'сломалось при мерже', count: 0, percentage: 0, color: 'rgba(153, 102, 255, 0.8)' },
  { reason: 'другое', count: 9, percentage: 27.27, color: 'rgba(201, 203, 207, 0.8)' },
];

const mockCoverageData = {
  automated: 114,
  total: 4000
};

// Данные о багах в бэклоге по спринтам
const mockSprintBacklogData = [
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
];

// Период для отображения данных
// Форматируем текущую дату в формат ДД.ММ.ГГГГ
const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const currentDate = new Date();
const startDate = '03.02.2025';
const endDate = formatDate(currentDate);
const dataPeriod = `${startDate} - ${endDate}`;

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  // Добавляем состояния для хранения реальных данных
  const [environmentData, setEnvironmentData] = useState(mockEnvironmentData);
  const [sprintBacklogData, setSprintBacklogData] = useState(mockSprintBacklogData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      try {
        // Загружаем данные об окружениях для отображения в компоненте BugEnvironment
        const envData = await getEnvironmentData(SHEET_URL);
        console.log('Загружены данные об окружениях:', envData);
        
        // Генерируем цвета и проценты для окружений
        if (envData && envData.length > 0) {
          const totalBugs = envData.reduce((sum, env) => sum + (env.bugCount || 0), 0);
          const processedEnvData = envData.map((env, index) => {
            // Генерируем случайный цвет для каждого окружения
            const hue = Math.floor(Math.random() * 360);
            
            return {
              environment: env.name,
              count: env.bugCount || 0,
              percentage: totalBugs > 0 ? ((env.bugCount || 0) / totalBugs) * 100 : 0,
              color: `hsla(${hue}, 70%, 60%, 0.8)`
            };
          });
          
          // Устанавливаем данные окружений
          setEnvironmentData(processedEnvData);
        }
        
        // Загружаем данные о спринтах для отображения в компоненте SprintBacklogChart
        try {
          const sprintData = await getSprintData(SHEET_URL);
          console.log('Загружены данные о спринтах:', sprintData);
          
          if (sprintData && sprintData.length > 0) {
            // Устанавливаем данные о спринтах
            setSprintBacklogData(sprintData);
          }
        } catch (sprintError) {
          console.error('Ошибка при загрузке данных о спринтах:', sprintError);
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Заголовок дашборда */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">QA Dashboard</h1>
          <p className="mt-1 text-gray-500">Анализ багов и контроль качества</p>
        </div>
      </div>
      
      {/* Навигация по дашборду */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4">
            <button 
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'overview' 
                  ? 'bg-red-800 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Обзор
            </button>
            <button 
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'details' 
                  ? 'bg-red-800 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Детали
            </button>
            <button 
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'trends' 
                  ? 'bg-red-800 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('trends')}
            >
              Тренды
            </button>
            <button 
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'backlog' 
                  ? 'bg-red-800 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('backlog')}
            >
              Автоматизация
            </button>
          </nav>
        </div>
      </div>
      
      {/* Содержимое дашборда */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-800 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Загрузка данных...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {/* SprintBacklogChart занимает всю ширину вверху */}
                <div className="col-span-1 lg:col-span-3">
                  <SprintBacklogChart data={sprintBacklogData} period={dataPeriod} />
                </div>
                
                {/* Первый ряд: BugEnvironment занимает одну колонку */}
                <div className="lg:col-span-1 h-full">
                  <BugEnvironment data={environmentData} period={dataPeriod} />
                </div>
                
                {/* Второй ряд: BugResolution и BugPriority занимают по одной колонке */}
                <div className="h-full">
                  <BugResolution data={mockResolutionData} />
                </div>
                
                <div className="h-full">
                  <BugPriority data={mockSeverityData} period={dataPeriod} />
                </div>
              </div>
            )}
            
            {activeTab === 'trends' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Тренды и динамика</h2>
                <BugTrends data={mockTrendData} />
              </div>
            )}
            
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Детальная информация</h2>
                </div>
                
                <div className="space-y-6">
                  <ComponentAnalysis data={mockComponentData} period={dataPeriod} />
                  <BugReasons data={mockReasonsData} />
                </div>
                
                <div className="space-y-6">
                  <BugTrackers data={mockTrackerData} />
                </div>
              </div>
            )}
            
            {activeTab === 'backlog' && (
              <div className="grid grid-cols-1 gap-6">
                <div className="col-span-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Покрытие автотестами</h2>
                </div>
                
                <div className="h-full">
                  <TestCoverage data={mockCoverageData} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
