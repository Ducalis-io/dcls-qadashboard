'use client'

import { useState, useMemo } from 'react'
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
import { getConfig, getPeriodData } from '@/services/periodDataService'

// Данные для покрытия тестами (пока статичные, можно добавить в JSON позже)
const mockCoverageData = {
  automated: 224,
  total: 3680
}

export default function Home() {
  // Загружаем конфигурацию
  const config = useMemo(() => getConfig(), [])

  // Первый период по умолчанию
  const defaultPeriod = config?.periods[0]?.id || 'period1'
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod)
  const [activeTab, setActiveTab] = useState('overview')

  // Загружаем данные текущего периода
  const currentData = useMemo(() => {
    const data = getPeriodData(selectedPeriod)
    if (!data) {
      console.error(`Не удалось загрузить данные для периода ${selectedPeriod}`)
      return null
    }
    return data
  }, [selectedPeriod])

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

  // Если не удалось загрузить конфигурацию
  if (!config) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка загрузки данных</h1>
          <p className="text-gray-700">Не удалось загрузить конфигурацию дашборда.</p>
          <p className="text-gray-600 mt-2">Убедитесь, что файл src/data/config.json существует.</p>
        </div>
      </main>
    )
  }

  // Если не удалось загрузить данные периода
  if (!currentData) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка загрузки данных</h1>
          <p className="text-gray-700">Не удалось загрузить данные для периода {selectedPeriod}.</p>
          <p className="text-gray-600 mt-2">Убедитесь, что файл src/data/periods/{selectedPeriod}.json существует.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">QA Dashboard</h1>
          <p className="text-gray-600 mt-1">Анализ багов и контроль качества</p>
          <p className="text-gray-500 text-sm mt-1">
            Данные из Jira: {config.projectKey} | Обновлено: {new Date(config.lastUpdated).toLocaleString('ru-RU')}
          </p>
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
            {config.visibility?.sprintBacklog !== false && (
              <div className="w-full">
                <SprintBacklogChart />
              </div>
            )}

            {/* Основные метрики - по 2 в ряд максимум */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {config.visibility?.environment !== false && (
                <BugEnvironment
                  data={currentData.environment}
                  period={config.periods.find(p => p.id === selectedPeriod)?.label || ''}
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                />
              )}
              {config.visibility?.resolution !== false && (
                <BugResolution
                  data={currentData.resolution}
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                />
              )}
              {config.visibility?.priority !== false && (
                <BugPriority
                  data={currentData.severity}
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Детальная информация</h2>

            {/* Компоненты и трекеры - grid автоматически подстроится если один скрыт */}
            {(config.visibility?.components !== false || config.visibility?.trackers !== false) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {config.visibility?.components !== false && (
                  <ComponentAnalysis
                    data={currentData.components}
                    period={config.periods.find(p => p.id === selectedPeriod)?.label || ''}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                  />
                )}
                {config.visibility?.trackers !== false && (
                  <BugTrackers
                    data={currentData.trackers}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                  />
                )}
              </div>
            )}

            {config.visibility?.reasons !== false && (
              <div className="w-full">
                <BugReasons
                  data={currentData.reasons}
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'automation' && config.visibility?.testCoverage !== false && (
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
