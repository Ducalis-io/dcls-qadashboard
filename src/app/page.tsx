'use client'

import { useState } from 'react'
import BugEnvironment from '@/components/BugEnvironment'
import BugPriority from '@/components/BugPriority'
import BugResolution from '@/components/BugResolution'
import ComponentAnalysis from '@/components/ComponentAnalysis'
import BugTrackers from '@/components/BugTrackers'
import TestCoverage from '@/components/TestCoverage'
import SprintBacklogChart from '@/components/SprintBacklogChart'
import BugReasons from '@/components/BugReasons'
import BugStatistics from '@/components/BugStatistics'
import BugTrends from '@/components/BugTrends'

// Моковые данные для периода 1
const mockSeverityDataPeriod1 = [
  { label: 'blocker', count: 0, percentage: 0.00, color: 'rgba(220, 38, 127, 0.8)' },
  { label: 'critical', count: 6, percentage: 14.63, color: 'rgba(255, 99, 132, 0.8)' },
  { label: 'major', count: 15, percentage: 36.59, color: 'rgba(255, 159, 64, 0.8)' },
  { label: 'minor', count: 11, percentage: 26.83, color: 'rgba(75, 192, 192, 0.8)' },
  { label: 'trivial', count: 9, percentage: 21.95, color: 'rgba(201, 203, 207, 0.8)' },
];

const mockEnvironmentDataPeriod1 = [
  { environment: 'prod', count: 41, percentage: 32.54, color: 'rgba(255, 99, 132, 0.8)' },
  { environment: 'stage', count: 85, percentage: 67.46, color: 'rgba(75, 192, 192, 0.8)' },
];

const mockResolutionDataPeriod1 = [
  { status: 'Done', count: 115, percentage: 91.27, color: 'rgba(75, 192, 192, 0.8)' },
  { status: 'To Do', count: 11, percentage: 8.73, color: 'rgba(255, 159, 64, 0.8)' },
];

const mockComponentDataPeriod1 = [
  { name: 'backlog', count: 12, percentage: 17.14 },
  { name: 'voting', count: 8, percentage: 11.43 },
  { name: 'ui_components', count: 6, percentage: 8.57 },
  { name: 'auth', count: 10, percentage: 14.29 },
  { name: 'api', count: 14, percentage: 20.00 },
  { name: 'database', count: 7, percentage: 10.00 },
  { name: 'notifications', count: 5, percentage: 7.14 },
  { name: 'reports', count: 8, percentage: 11.43 }
]

// Моковые данные для периода 2
const mockSeverityDataPeriod2 = [
  { label: 'blocker', count: 1, percentage: 4.17, color: 'rgba(220, 38, 127, 0.8)' },
  { label: 'critical', count: 1, percentage: 4.17, color: 'rgba(255, 99, 132, 0.8)' },
  { label: 'major', count: 6, percentage: 25.00, color: 'rgba(255, 159, 64, 0.8)' },
  { label: 'minor', count: 9, percentage: 37.50, color: 'rgba(75, 192, 192, 0.8)' },
  { label: 'trivial', count: 7, percentage: 29.17, color: 'rgba(201, 203, 207, 0.8)' },
];

const mockEnvironmentDataPeriod2 = [
  { environment: 'prod', count: 24, percentage: 20.69, color: 'rgba(255, 99, 132, 0.8)' },
  { environment: 'stage', count: 92, percentage: 79.31, color: 'rgba(75, 192, 192, 0.8)' },
];

const mockResolutionDataPeriod2 = [
  { status: 'Done', count: 94, percentage: 88.68, color: 'rgba(75, 192, 192, 0.8)' },
  { status: 'To Do', count: 12, percentage: 11.32, color: 'rgba(255, 159, 64, 0.8)' },
];

const mockComponentDataPeriod2 = [
  { name: 'backlog', count: 8, percentage: 10.81 },
  { name: 'voting', count: 12, percentage: 16.22 },
  { name: 'ui_components', count: 4, percentage: 5.41 },
  { name: 'auth', count: 15, percentage: 20.27 },
  { name: 'api', count: 11, percentage: 14.86 },
  { name: 'database', count: 9, percentage: 12.16 },
  { name: 'notifications', count: 7, percentage: 9.46 },
  { name: 'reports', count: 8, percentage: 10.81 }
]

// Моковые данные для периода 3
const mockSeverityDataPeriod3 = [
  { label: 'blocker', count: 0, percentage: 0.00, color: 'rgba(255, 0, 0, 0.8)' },
  { label: 'critical', count: 2, percentage: 7.14, color: 'rgba(255, 99, 132, 0.8)' },
  { label: 'major', count: 9, percentage: 32.14, color: 'rgba(255, 205, 86, 0.8)' },
  { label: 'minor', count: 9, percentage: 32.14, color: 'rgba(75, 192, 192, 0.8)' },
  { label: 'trivial', count: 8, percentage: 28.57, color: 'rgba(153, 102, 255, 0.8)' }
]

const mockEnvironmentDataPeriod3 = [
  { environment: 'prod', count: 26, percentage: 33.77, color: 'rgba(255, 99, 132, 0.8)' },
  { environment: 'stage', count: 51, percentage: 66.23, color: 'rgba(54, 162, 235, 0.8)' }
]

const mockResolutionDataPeriod3 = [
  { status: 'Done', count: 58, percentage: 81.69, color: 'rgba(75, 192, 192, 0.8)' },
  { status: 'To Do', count: 13, percentage: 18.31, color: 'rgba(255, 205, 86, 0.8)' }
]

const mockComponentDataPeriod3 = [
  { name: 'backlog', count: 9, percentage: 28.13 },
  { name: 'voting', count: 5, percentage: 15.63 },
  { name: 'ui_components', count: 3, percentage: 9.38 },
  { name: 'notifications', count: 2, percentage: 6.25 },
  { name: 'csv', count: 2, percentage: 6.25 },
  { name: 'ai', count: 1, percentage: 3.13 },
  { name: 'criteria', count: 1, percentage: 3.13 },
  { name: 'columns', count: 1, percentage: 3.13 },
  { name: 'matrix', count: 1, percentage: 3.13 },
  { name: 'templates', count: 1, percentage: 3.13 },
  { name: 'users', count: 1, percentage: 3.13 },
  { name: 'settings', count: 1, percentage: 3.13 },
  { name: 'sync_back', count: 1, percentage: 3.13 },
  { name: 'filtration', count: 1, percentage: 3.13 },
  { name: 'url', count: 1, percentage: 3.13 },
  { name: 'noco', count: 1, percentage: 3.13 }
]

// Моковые данные для периода 4 (07.07.2025 - 03.08.2025)
const mockSeverityDataPeriod4 = [
  { label: 'blocker', count: 0, percentage: 0.00, color: 'rgba(220, 38, 127, 0.8)' },
  { label: 'critical', count: 1, percentage: 5.26, color: 'rgba(255, 99, 132, 0.8)' },
  { label: 'major', count: 4, percentage: 14.04, color: 'rgba(255, 159, 64, 0.8)' },
  { label: 'minor', count: 7, percentage: 43.86, color: 'rgba(75, 192, 192, 0.8)' },
  { label: 'trivial', count: 0, percentage: 36.84, color: 'rgba(201, 203, 207, 0.8)' },
];

const mockEnvironmentDataPeriod4 = [
  { environment: 'prod', count: 12, percentage: 21.05, color: 'rgba(255, 99, 132, 0.8)' },
  { environment: 'stage', count: 45, percentage: 78.95, color: 'rgba(75, 192, 192, 0.8)' },
];

const mockResolutionDataPeriod4 = [
  { status: 'Done', count: 52, percentage: 84.21, color: 'rgba(75, 192, 192, 0.8)' },
  { status: 'To Do', count: 5, percentage: 15.79, color: 'rgba(255, 159, 64, 0.8)' },
];

const mockComponentDataPeriod4 = [
  { name: 'ai', count: 1, percentage: 7.69 },
  { name: 'filters', count: 1, percentage: 7.69 },
  { name: 'criteria', count: 1, percentage: 7.69 },
  { name: 'billing', count: 1, percentage: 7.69 },
  { name: 'backlog', count: 1, percentage: 7.69 },
  { name: 'voting', count: 4, percentage: 30.77 },
  { name: 'users', count: 1, percentage: 7.69 },
  { name: 'sync back', count: 1, percentage: 7.69 },
  { name: 'url', count: 2, percentage: 15.38 }
]

// Моковые данные для периода 5 (04.08.2025 - 31.08.2025)
const mockSeverityDataPeriod5 = [
  { label: 'blocker', count: 0, percentage: 0.00, color: 'rgba(220, 38, 127, 0.8)' },
  { label: 'critical', count: 2, percentage: 10.00, color: 'rgba(255, 99, 132, 0.8)' },
  { label: 'major', count: 5, percentage: 25.00, color: 'rgba(255, 159, 64, 0.8)' },
  { label: 'minor', count: 9, percentage: 45.00, color: 'rgba(75, 192, 192, 0.8)' },
  { label: 'trivial', count: 4, percentage: 20.00, color: 'rgba(201, 203, 207, 0.8)' },
];

const mockEnvironmentDataPeriod5 = [
  { environment: 'prod', count: 20, percentage: 28.57, color: 'rgba(255, 99, 132, 0.8)' },
  { environment: 'stage', count: 50, percentage: 71.43, color: 'rgba(75, 192, 192, 0.8)' },
];

const mockResolutionDataPeriod5 = [
  { status: 'Done', count: 52, percentage: 83.87, color: 'rgba(75, 192, 192, 0.8)' },
  { status: 'To Do', count: 10, percentage: 16.13, color: 'rgba(255, 159, 64, 0.8)' },
];

const mockComponentDataPeriod5 = [
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

// Данные для трекеров багов (используется TrackerData интерфейс)
const mockTrackerDataPeriod1 = [
  { name: 'Jira', count: 25, percentage: 55.56, color: 'rgba(54, 162, 235, 0.8)' },
  { name: 'GitHub', count: 15, percentage: 33.33, color: 'rgba(255, 99, 132, 0.8)' },
  { name: 'Linear', count: 5, percentage: 11.11, color: 'rgba(75, 192, 192, 0.8)' }
]

const mockTrackerDataPeriod2 = [
  { name: 'Jira', count: 30, percentage: 63.83, color: 'rgba(54, 162, 235, 0.8)' },
  { name: 'GitHub', count: 12, percentage: 25.53, color: 'rgba(255, 99, 132, 0.8)' },
  { name: 'Linear', count: 5, percentage: 10.64, color: 'rgba(75, 192, 192, 0.8)' }
]

const mockTrackerDataPeriod3 = [
  { name: 'Jira', count: 18, percentage: 64.29, color: 'rgba(54, 162, 235, 0.8)' },
  { name: 'GitHub', count: 8, percentage: 28.57, color: 'rgba(255, 99, 132, 0.8)' },
  { name: 'Linear', count: 2, percentage: 7.14, color: 'rgba(75, 192, 192, 0.8)' }
]

const mockTrackerDataPeriod4 = [
  { name: 'Jira', count: 2, percentage: 100, color: 'rgba(54, 162, 235, 0.8)' }
]

const mockTrackerDataPeriod5 = [
  { name: 'jira', count: 1, percentage: 33.33, color: 'rgba(54, 162, 235, 0.8)' },
  { name: 'asana', count: 1, percentage: 33.33, color: 'rgba(75, 192, 192, 0.8)' },
  { name: 'gitgub', count: 1, percentage: 33.33, color: 'rgba(255, 159, 64, 0.8)' }
]

// Данные для причин багов
const mockReasonsDataPeriod1 = [
  { reason: 'специфический/редкий кейс', count: 9, percentage: 27.27, color: 'rgba(54, 162, 235, 0.8)' },
  { reason: 'недоработка в требованиях', count: 2, percentage: 6.06, color: 'rgba(255, 99, 132, 0.8)' },
  { reason: 'кейс не был предусмотрен', count: 6, percentage: 18.18, color: 'rgba(75, 192, 192, 0.8)' },
  { reason: 'не проверялось на регрессе', count: 7, percentage: 21.21, color: 'rgba(255, 159, 64, 0.8)' },
  { reason: 'сломалось при мерже', count: 0, percentage: 0, color: 'rgba(153, 102, 255, 0.8)' },
  { reason: 'другое', count: 9, percentage: 27.27, color: 'rgba(201, 203, 207, 0.8)' },
];

const mockReasonsDataPeriod2 = [
  { reason: 'специфический/редкий кейс', count: 3, percentage: 25.00, color: 'rgba(54, 162, 235, 0.8)' },
  { reason: 'недоработка в требованиях', count: 1, percentage: 9.38, color: 'rgba(255, 99, 132, 0.8)' },
  { reason: 'кейс не был предусмотрен', count: 0, percentage: 21.88, color: 'rgba(75, 192, 192, 0.8)' },
  { reason: 'не проверялось на регрессе', count: 5, percentage: 18.75, color: 'rgba(255, 159, 64, 0.8)' },
  { reason: 'сломалось при мерже', count: 0, percentage: 3.13, color: 'rgba(153, 102, 255, 0.8)' },
  { reason: 'другое', count: 4, percentage: 21.88, color: 'rgba(201, 203, 207, 0.8)' },
];

const mockReasonsDataPeriod3 = [
  { reason: 'специфический/редкий кейс', count: 5, percentage: 22.73, color: 'rgba(54, 162, 235, 0.8)' },
  { reason: 'недоработка в требованиях', count: 0, percentage: 4.55, color: 'rgba(255, 99, 132, 0.8)' },
  { reason: 'кейс не был предусмотрен', count: 2, percentage: 18.18, color: 'rgba(75, 192, 192, 0.8)' },
  { reason: 'не проверялось на регрессе', count: 7, percentage: 13.64, color: 'rgba(255, 159, 64, 0.8)' },
  { reason: 'сломалось при мерже', count: 0, percentage: 9.09, color: 'rgba(153, 102, 255, 0.8)' },
  { reason: 'другое', count: 3, percentage: 31.82, color: 'rgba(201, 203, 207, 0.8)' },
];

const mockReasonsDataPeriod4 = [
  { reason: 'специфический/редкий кейс', count: 1, percentage: 14.04, color: 'rgba(54, 162, 235, 0.8)' },
  { reason: 'недоработка в требованиях', count: 1, percentage: 5.26, color: 'rgba(255, 99, 132, 0.8)' },
  { reason: 'кейс не был предусмотрен', count: 3, percentage: 7.02, color: 'rgba(75, 192, 192, 0.8)' },
  { reason: 'не проверялось на регрессе', count: 2, percentage: 21.05, color: 'rgba(255, 159, 64, 0.8)' },
  { reason: 'сломалось при мерже', count: 0, percentage: 3.51, color: 'rgba(153, 102, 255, 0.8)' },
  { reason: 'другое', count: 5, percentage: 49.12, color: 'rgba(201, 203, 207, 0.8)' },
];

const mockReasonsDataPeriod5 = [
  { reason: 'специфический/редкий кейс', count: 2, percentage: 12.50, color: 'rgba(54, 162, 235, 0.8)' },
  { reason: 'недоработка в требованиях', count: 3, percentage: 18.75, color: 'rgba(255, 99, 132, 0.8)' },
  { reason: 'кейс не был предусмотрен', count: 1, percentage: 6.25, color: 'rgba(75, 192, 192, 0.8)' },
  { reason: 'не проверялось на регрессе', count: 4, percentage: 25.00, color: 'rgba(255, 159, 64, 0.8)' },
  { reason: 'другое', count: 6, percentage: 37.50, color: 'rgba(201, 203, 207, 0.8)' },
];

// Данные для покрытия тестами (объект, не массив!)
const mockCoverageData = {
  automated: 151,
  total: 3680
}

// Данные для статистики багов
const mockStatisticsData = [
  { date: '2025-02', open: 45, closed: 38, critical: 5, major: 15, minor: 25 },
  { date: '2025-03', open: 52, closed: 41, critical: 8, major: 18, minor: 26 },
  { date: '2025-04', open: 48, closed: 55, critical: 3, major: 20, minor: 25 },
  { date: '2025-05', open: 38, closed: 45, critical: 2, major: 16, minor: 20 },
  { date: '2025-06', open: 42, closed: 49, critical: 4, major: 18, minor: 20 }
]

// Данные для трендов
const mockTrendsData = [
  { month: 'Февраль', newBugs: 45, resolvedBugs: 38, reopenedBugs: 5 },
  { month: 'Март', newBugs: 52, resolvedBugs: 41, reopenedBugs: 3 },
  { month: 'Апрель', newBugs: 48, resolvedBugs: 55, reopenedBugs: 2 },
  { month: 'Май', newBugs: 38, resolvedBugs: 45, reopenedBugs: 4 },
  { month: 'Июнь', newBugs: 42, resolvedBugs: 49, reopenedBugs: 1 }
]

// Функция для получения данных текущего периода
const getCurrentPeriodData = (period: string) => {
  switch (period) {
    case 'period1':
      return {
        severity: mockSeverityDataPeriod1,
        environment: mockEnvironmentDataPeriod1,
        resolution: mockResolutionDataPeriod1,
        component: mockComponentDataPeriod1,
        trackers: mockTrackerDataPeriod1,
        reasons: mockReasonsDataPeriod1
      }
    case 'period2':
      return {
        severity: mockSeverityDataPeriod2,
        environment: mockEnvironmentDataPeriod2,
        resolution: mockResolutionDataPeriod2,
        component: mockComponentDataPeriod2,
        trackers: mockTrackerDataPeriod2,
        reasons: mockReasonsDataPeriod2
      }
    case 'period3':
      return {
        severity: mockSeverityDataPeriod3,
        environment: mockEnvironmentDataPeriod3,
        resolution: mockResolutionDataPeriod3,
        component: mockComponentDataPeriod3,
        trackers: mockTrackerDataPeriod3,
        reasons: mockReasonsDataPeriod3
      }
    case 'period4':
      return {
        severity: mockSeverityDataPeriod4,
        environment: mockEnvironmentDataPeriod4,
        resolution: mockResolutionDataPeriod4,
        component: mockComponentDataPeriod4,
        trackers: mockTrackerDataPeriod4,
        reasons: mockReasonsDataPeriod4
      }
    case 'period5':
      return {
        severity: mockSeverityDataPeriod5,
        environment: mockEnvironmentDataPeriod5,
        resolution: mockResolutionDataPeriod5,
        component: mockComponentDataPeriod5,
        trackers: mockTrackerDataPeriod5,
        reasons: mockReasonsDataPeriod5
      }
    default:
      return {
        severity: mockSeverityDataPeriod1,
        environment: mockEnvironmentDataPeriod1,
        resolution: mockResolutionDataPeriod1,
        component: mockComponentDataPeriod1,
        trackers: mockTrackerDataPeriod1,
        reasons: mockReasonsDataPeriod1
      }
  }
}

export default function Home() {
  const [selectedPeriod, setSelectedPeriod] = useState('period1')
  const [activeTab, setActiveTab] = useState('overview') // Добавляем состояние для вкладок
  const currentData = getCurrentPeriodData(selectedPeriod)

  // Компонент для вкладок
  const TabButton = ({ id, label, isActive, onClick }: {
    id: string
    label: string
    isActive: boolean
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      className={`px-6 py-2 font-medium rounded-t-lg transition-colors ${
        isActive
          ? 'bg-red-600 text-white border-b-2 border-red-600'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {label}
    </button>
  )

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">QA Dashboard</h1>
          <p className="text-gray-600 mt-1">Анализ багов и контроль качества</p>
        </div>
        
        {/* Вкладки */}
        <div className="mb-6">
          <div className="flex space-x-1 border-b">
            <TabButton
              id="overview"
              label="Обзор"
              isActive={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <TabButton
              id="details"
              label="Детали"
              isActive={activeTab === 'details'}
              onClick={() => setActiveTab('details')}
            />
            <TabButton
              id="automation"
              label="Автоматизация"
              isActive={activeTab === 'automation'}
              onClick={() => setActiveTab('automation')}
            />
          </div>
        </div>

        {/* Содержимое вкладок */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Динамика багов по спринтам */}
            <div className="w-full">
              <SprintBacklogChart />
            </div>
            
            {/* Основные метрики */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <BugEnvironment 
                data={currentData.environment}
                period=""
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
              <BugResolution 
                data={currentData.resolution}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
              <BugPriority 
                data={currentData.severity}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Детальная информация</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ComponentAnalysis 
                data={currentData.component}
                period=""
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
              <BugTrackers 
                data={currentData.trackers}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
            </div>
            
            <div className="w-full">
              <BugReasons 
                data={currentData.reasons} 
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Покрытие автотестами</h2>
            
            <div className="w-full max-w-2xl mx-auto">
              <TestCoverage
                data={mockCoverageData}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
