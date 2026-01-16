'use client'

import { useState } from 'react'
import { SeverityCard, EnvironmentCard, ResolutionCard, TrackersCard, ReasonsCard } from '@/components/metrics'
import ComponentAnalysis from '@/components/ComponentAnalysis'
import TestCoverage from '@/components/TestCoverage'
import SprintBacklogChart from '@/components/SprintBacklogChart'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useDashboardData } from '@/hooks/useDataSource'

// Данные для покрытия тестами (пока статичные, можно добавить в JSON позже)
const mockCoverageData = {
  automated: 224,
  total: 3680
}

export default function Home() {
  // Загружаем данные через хук (поддерживает local и cloudflare режимы)
  const {
    config,
    periodData: currentData,
    selectedPeriod,
    changePeriod: setSelectedPeriod,
    loading,
  } = useDashboardData()

  const [activeTab, setActiveTab] = useState('overview')

  // Компонент для вкладок
  const TabButton = ({ label, isActive, onClick }: {
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

  // Состояние загрузки
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </main>
    )
  }

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
  if (!currentData || !selectedPeriod) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка загрузки данных</h1>
          <p className="text-gray-700">Не удалось загрузить данные для периода {selectedPeriod || 'unknown'}.</p>
          <p className="text-gray-600 mt-2">Проверьте источник данных и попробуйте обновить страницу.</p>
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
            Данные из Jira: {config.projectKey} |
            {config.totalSprintsAnalyzed && config.sprintsPerPeriod && (
              <> Анализ: {config.totalSprintsAnalyzed} спринтов, {config.sprintsPerPeriod} спринта/период | </>
            )}
            Обновлено: {new Date(config.lastUpdated).toLocaleString('ru-RU')}
          </p>
        </div>

        {/* Вкладки */}
        <div className="mb-6">
          <div className="flex space-x-1 border-b">
            <TabButton
              label="Обзор"
              isActive={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <TabButton
              label="Детали"
              isActive={activeTab === 'details'}
              onClick={() => setActiveTab('details')}
            />
            {config.visibility?.testCoverage !== false && (
              <TabButton
                label="Автоматизация"
                isActive={activeTab === 'automation'}
                onClick={() => setActiveTab('automation')}
              />
            )}
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
                <ErrorBoundary title="Распределение багов по окружениям">
                  <EnvironmentCard
                    data={currentData.environment}
                    totalBugs={currentData.totalBugs}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                  />
                </ErrorBoundary>
              )}
              {config.visibility?.resolution !== false && (
                <ErrorBoundary title="Статус резолюции багов">
                  <ResolutionCard
                    data={currentData.resolution}
                    totalBugs={currentData.totalBugs}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                  />
                </ErrorBoundary>
              )}
              {config.visibility?.priority !== false && (
                <ErrorBoundary title="Серьёзность багов">
                  <SeverityCard
                    data={currentData.severity}
                    totalBugs={currentData.totalBugs}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                  />
                </ErrorBoundary>
              )}
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Детальная информация</h2>

            {/* Компоненты - на всю ширину если трекеры скрыты */}
            {config.visibility?.components !== false && (
              <div className="w-full">
                <ErrorBoundary title="Анализ компонентов">
                  <ComponentAnalysis
                    data={currentData.componentsCreated || currentData.components}
                    rawBugs={currentData.rawBugsCreated || currentData.rawBugs}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                  />
                </ErrorBoundary>
              </div>
            )}

            {/* Трекеры - отдельно */}
            {config.visibility?.trackers !== false && (
              <div className="w-full">
                <ErrorBoundary title="Трекеры багов">
                  <TrackersCard
                    data={currentData.trackers}
                    totalBugs={currentData.totalBugs}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                  />
                </ErrorBoundary>
              </div>
            )}

            {config.visibility?.reasons !== false && (
              <div className="w-full">
                <ErrorBoundary title="Причины создания багов">
                  <ReasonsCard
                    data={currentData.reasonsCreated || currentData.reasons}
                    totalBugs={currentData.totalBugsCreated || currentData.totalBugs}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                  />
                </ErrorBoundary>
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
