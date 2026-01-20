'use client';

/**
 * DashboardContext - единый источник данных для всего дашборда.
 *
 * Решает проблему дублирования загрузки данных:
 * - Загружает config и все периоды ОДИН раз при монтировании
 * - Предоставляет хуки-селекторы для компонентов
 * - Управляет состоянием multiplier и selectedPeriodId
 *
 * ВАЖНО: selectedPeriodId вычисляется СИНХРОННО, чтобы избежать
 * промежуточных состояний при смене multiplier.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import type { DashboardConfig, PeriodData } from '@/services/periodDataService';
import {
  groupPeriods,
  createGroupedPeriodConfigs,
  mergePeriodData,
  findBestMatchingPeriod,
  type GroupedPeriodConfig,
} from '@/utils/periodMerger';

// === Конфигурация источника данных ===

const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE || 'local';
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function isCloudflareMode(): boolean {
  return DATA_SOURCE === 'cloudflare' && !!API_URL;
}

// === Функции загрузки данных ===

async function loadLocalConfig(): Promise<DashboardConfig | null> {
  try {
    const imported = await import('@/data/config.json');
    return imported.default as DashboardConfig;
  } catch (error) {
    console.error('Failed to load local config:', error);
    return null;
  }
}

async function loadCloudflareConfig(): Promise<DashboardConfig | null> {
  try {
    const response = await fetch(`${API_URL}/config`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load config from Cloudflare:', error);
    return null;
  }
}

async function loadLocalPeriodData(periodId: string): Promise<PeriodData | null> {
  try {
    const imported = await import(`@/data/periods/${periodId}.json`);
    return imported.default as PeriodData;
  } catch (error) {
    console.error(`Failed to load local period data for ${periodId}:`, error);
    return null;
  }
}

async function loadCloudflarePeriodData(periodId: string): Promise<PeriodData | null> {
  try {
    const response = await fetch(`${API_URL}/periods/${periodId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to load period data for ${periodId} from Cloudflare:`, error);
    return null;
  }
}

async function loadConfig(): Promise<DashboardConfig | null> {
  return isCloudflareMode() ? loadCloudflareConfig() : loadLocalConfig();
}

async function loadPeriodData(periodId: string): Promise<PeriodData | null> {
  return isCloudflareMode()
    ? loadCloudflarePeriodData(periodId)
    : loadLocalPeriodData(periodId);
}

// === Типы контекста ===

interface DashboardContextValue {
  // Данные (загружаются один раз)
  config: DashboardConfig | null;
  allPeriodsData: PeriodData[];
  loading: boolean;
  error: Error | null;
  isCloudflare: boolean;

  // Multiplier state
  multiplier: number;
  setMultiplier: (value: number) => void;

  // Selected period state (всегда валиден для текущих groupedPeriods)
  selectedPeriodId: string | null;
  setSelectedPeriodId: (id: string) => void;

  // Computed (мемоизированные)
  groupedPeriods: GroupedPeriodConfig[];
  effectiveSprintsPerPeriod: number;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

// === Provider ===

interface DashboardProviderProps {
  children: React.ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  // Состояния данных
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [allPeriodsData, setAllPeriodsData] = useState<PeriodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Состояния UI
  const [multiplier, setMultiplierState] = useState(1);

  // rawSelectedPeriodId - то что пользователь выбрал (может быть невалидным для текущих groupedPeriods)
  const [rawSelectedPeriodId, setRawSelectedPeriodId] = useState<string | null>(null);

  // Ref для хранения предыдущих groupedPeriods (для умного поиска при смене multiplier)
  const prevGroupedRef = useRef<GroupedPeriodConfig[]>([]);

  // Безопасный setter для multiplier (clamp 1-4)
  const setMultiplier = useCallback((value: number) => {
    setMultiplierState(Math.max(1, Math.min(4, value)));
  }, []);

  // Загрузка config + всех периодов при монтировании
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setError(null);

      try {
        const cfg = await loadConfig();
        if (cancelled) return;

        if (!cfg) {
          throw new Error('Failed to load config');
        }
        setConfig(cfg);

        // Загружаем ВСЕ периоды параллельно
        const results = await Promise.all(
          cfg.periods.map(p => loadPeriodData(p.id))
        );
        if (cancelled) return;

        // Фильтруем null, сохраняем порядок
        const validResults = results.filter(
          (data): data is PeriodData => data !== null
        );
        setAllPeriodsData(validResults);

      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, []);

  // Computed: сгруппированные периоды
  const groupedPeriods = useMemo(() => {
    if (!config) return [];
    const groups = groupPeriods(config.periods, multiplier);
    return createGroupedPeriodConfigs(groups);
  }, [config, multiplier]);

  // СИНХРОННО вычисляем валидный selectedPeriodId
  // Это ключевое изменение - избегаем промежуточного null состояния
  const selectedPeriodId = useMemo(() => {
    if (groupedPeriods.length === 0) return null;

    // Если rawSelectedPeriodId не установлен - берём первый
    if (!rawSelectedPeriodId) {
      return groupedPeriods[0].id;
    }

    // Если rawSelectedPeriodId валиден в текущих groupedPeriods - используем его
    if (groupedPeriods.some(p => p.id === rawSelectedPeriodId)) {
      return rawSelectedPeriodId;
    }

    // rawSelectedPeriodId невалиден - ищем лучшее соответствие
    const prev = prevGroupedRef.current;
    if (prev.length > 0) {
      return findBestMatchingPeriod(rawSelectedPeriodId, prev, groupedPeriods);
    }

    // Fallback - первый период
    return groupedPeriods[0].id;
  }, [groupedPeriods, rawSelectedPeriodId]);

  // Обновляем prevGroupedRef ПОСЛЕ вычисления selectedPeriodId
  // Используем useEffect чтобы сохранить предыдущее значение для следующего рендера
  useEffect(() => {
    if (groupedPeriods.length > 0) {
      prevGroupedRef.current = groupedPeriods;
    }
  }, [groupedPeriods]);

  // Синхронизируем rawSelectedPeriodId с вычисленным selectedPeriodId
  // Это нужно чтобы при следующем изменении multiplier, мы искали от актуального периода
  useEffect(() => {
    if (selectedPeriodId && selectedPeriodId !== rawSelectedPeriodId) {
      setRawSelectedPeriodId(selectedPeriodId);
    }
  }, [selectedPeriodId, rawSelectedPeriodId]);

  // Setter для selectedPeriodId (для ручного выбора пользователем)
  const setSelectedPeriodId = useCallback((id: string) => {
    setRawSelectedPeriodId(id);
  }, []);

  // Computed: эффективное количество спринтов в периоде
  const effectiveSprintsPerPeriod = useMemo(() => {
    const base = config?.sprintsPerPeriod ?? 1;
    return base * multiplier;
  }, [config?.sprintsPerPeriod, multiplier]);

  const value: DashboardContextValue = {
    config,
    allPeriodsData,
    loading,
    error,
    isCloudflare: isCloudflareMode(),
    multiplier,
    setMultiplier,
    selectedPeriodId,
    setSelectedPeriodId,
    groupedPeriods,
    effectiveSprintsPerPeriod,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// === Хуки-селекторы ===

/**
 * Базовый хук для доступа к контексту.
 * Бросает ошибку, если используется вне DashboardProvider.
 */
export function useDashboardContext(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}

/**
 * Хук для получения сгруппированных периодов (для PeriodSelector)
 */
export function useGroupedPeriods() {
  const { groupedPeriods, loading } = useDashboardContext();
  return { groupedPeriods, loading };
}

/**
 * Хук для получения данных текущего выбранного периода.
 * Автоматически мёржит данные при multiplier > 1.
 */
export function useCurrentPeriodData() {
  const { allPeriodsData, groupedPeriods, selectedPeriodId, loading } = useDashboardContext();

  return useMemo(() => {
    if (!selectedPeriodId || loading) {
      return { data: null, loading };
    }

    const grouped = groupedPeriods.find(p => p.id === selectedPeriodId);
    if (!grouped) {
      // Это не должно происходить благодаря синхронному вычислению selectedPeriodId
      return { data: null, loading: false };
    }

    // Собираем данные из sourceIds
    const periodsToMerge = grouped.sourceIds
      .map(id => allPeriodsData.find(p => p.periodId === id))
      .filter((p): p is PeriodData => p !== null && p !== undefined);

    if (periodsToMerge.length === 0) {
      return { data: null, loading: false };
    }

    if (periodsToMerge.length === 1) {
      return { data: periodsToMerge[0], loading: false };
    }

    return { data: mergePeriodData(periodsToMerge), loading: false };
  }, [allPeriodsData, groupedPeriods, selectedPeriodId, loading]);
}

/**
 * Хук для получения данных всех сгруппированных периодов.
 * Используется для TrendChart и ComponentTrendChart.
 */
export function useAllGroupedPeriodsData() {
  const { allPeriodsData, groupedPeriods, config, multiplier, loading } = useDashboardContext();

  return useMemo(() => {
    if (loading || !config) {
      return { data: [], groupedPeriods: [], multiplier, loading };
    }

    if (multiplier <= 1) {
      return { data: allPeriodsData, groupedPeriods, multiplier, loading: false };
    }

    // Группируем и мержим
    const groups = groupPeriods(config.periods, multiplier);
    const mergedData = groups.map(group => {
      const periodsToMerge = group
        .map(p => allPeriodsData.find(d => d.periodId === p.id))
        .filter((p): p is PeriodData => p !== null && p !== undefined);

      if (periodsToMerge.length === 0) return null;
      if (periodsToMerge.length === 1) return periodsToMerge[0];
      return mergePeriodData(periodsToMerge);
    }).filter((p): p is PeriodData => p !== null);

    return { data: mergedData, groupedPeriods, multiplier, loading: false };
  }, [allPeriodsData, groupedPeriods, config, multiplier, loading]);
}
