/**
 * Хуки для загрузки данных из выбранного источника.
 *
 * Это обёртки над DashboardContext для обратной совместимости.
 * Вся логика загрузки теперь в DashboardProvider.
 */

import {
  useDashboardContext,
  useCurrentPeriodData,
  useAllGroupedPeriodsData,
  isCloudflareMode,
} from '@/contexts/DashboardContext';

// Реэкспорт для обратной совместимости
export { isCloudflareMode };

/**
 * Хук для получения конфигурации дашборда.
 * Обёртка для обратной совместимости.
 */
export function useConfig() {
  const ctx = useDashboardContext();
  return {
    config: ctx.config,
    loading: ctx.loading,
    error: ctx.error,
  };
}

/**
 * Хук для получения данных всех периодов.
 * Возвращает сгруппированные данные с учётом multiplier.
 */
export function useAllPeriodsData() {
  const result = useAllGroupedPeriodsData();
  return {
    data: result.data,
    loading: result.loading,
    error: null,
  };
}

/**
 * Комбинированный хук для загрузки конфига и данных текущего периода.
 * Расширен для поддержки multiplier.
 */
export function useDashboardData() {
  const ctx = useDashboardContext();
  const { data: periodData } = useCurrentPeriodData();

  return {
    // Оригинальные поля (обратная совместимость)
    config: ctx.config,
    periodData,
    selectedPeriod: ctx.selectedPeriodId,
    changePeriod: ctx.setSelectedPeriodId,
    loading: ctx.loading,
    error: ctx.error,
    isCloudflare: ctx.isCloudflare,

    // Новые поля для multiplier
    multiplier: ctx.multiplier,
    setMultiplier: ctx.setMultiplier,
    groupedPeriods: ctx.groupedPeriods,
    effectiveSprintsPerPeriod: ctx.effectiveSprintsPerPeriod,
  };
}

/**
 * Хук для TrendChart — возвращает сгруппированные данные + периоды для меток.
 */
export function useGroupedPeriodsData() {
  return useAllGroupedPeriodsData();
}
