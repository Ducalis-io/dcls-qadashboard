/**
 * Хук для загрузки данных из выбранного источника
 * Поддерживает два режима:
 *   - local: данные из src/data (статические импорты)
 *   - cloudflare: данные из Cloudflare KV API
 *
 * Режим определяется переменной NEXT_PUBLIC_DATA_SOURCE
 */

import { useState, useEffect, useCallback } from 'react';
import type { DashboardConfig, PeriodData } from '@/services/periodDataService';

// Определяем источник данных
const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE || 'local';
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Проверяет, используется ли Cloudflare режим
 */
export function isCloudflareMode(): boolean {
  return DATA_SOURCE === 'cloudflare' && !!API_URL;
}

/**
 * Загружает конфигурацию из локальных файлов
 */
async function loadLocalConfig(): Promise<DashboardConfig | null> {
  try {
    const imported = await import('@/data/config.json');
    return imported.default as DashboardConfig;
  } catch (error) {
    console.error('Failed to load local config:', error);
    return null;
  }
}

/**
 * Загружает конфигурацию из Cloudflare API
 */
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

/**
 * Загружает данные периода из локальных файлов
 */
async function loadLocalPeriodData(periodId: string): Promise<PeriodData | null> {
  try {
    const imported = await import(`@/data/periods/${periodId}.json`);
    return imported.default as PeriodData;
  } catch (error) {
    console.error(`Failed to load local period data for ${periodId}:`, error);
    return null;
  }
}

/**
 * Загружает данные периода из Cloudflare API
 */
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

/**
 * Хук для загрузки конфигурации дашборда
 */
export function useConfig() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = isCloudflareMode()
          ? await loadCloudflareConfig()
          : await loadLocalConfig();

        if (!cancelled) {
          setConfig(data);
        }
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

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading, error };
}

/**
 * Хук для загрузки данных периода
 */
export function usePeriodData(periodId: string | null) {
  const [data, setData] = useState<PeriodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!periodId) {
      setData(null);
      setLoading(false);
      return;
    }

    // Сохраняем в локальную переменную для TypeScript
    const currentPeriodId = periodId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = isCloudflareMode()
          ? await loadCloudflarePeriodData(currentPeriodId)
          : await loadLocalPeriodData(currentPeriodId);

        if (!cancelled) {
          setData(result);
        }
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

    load();

    return () => {
      cancelled = true;
    };
  }, [periodId]);

  return { data, loading, error };
}

/**
 * Хук для загрузки данных всех периодов
 */
export function useAllPeriodsData() {
  const { config, loading: configLoading, error: configError } = useConfig();
  const [allData, setAllData] = useState<PeriodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (configLoading) {
      return;
    }

    if (!config) {
      setLoading(false);
      return;
    }

    // Сохраняем config в локальную переменную для TypeScript
    const currentConfig = config;
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setError(null);

      try {
        // Загружаем все периоды параллельно
        const loadFunction = isCloudflareMode()
          ? loadCloudflarePeriodData
          : loadLocalPeriodData;

        const results = await Promise.all(
          currentConfig.periods.map((period) => loadFunction(period.id))
        );

        // Фильтруем null значения
        const validResults = results.filter((data): data is PeriodData => data !== null);

        if (!cancelled) {
          setAllData(validResults);
        }
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

    return () => {
      cancelled = true;
    };
  }, [config, configLoading]);

  return {
    data: allData,
    loading: configLoading || loading,
    error: configError || error,
  };
}

/**
 * Комбинированный хук для загрузки конфига и данных текущего периода
 */
export function useDashboardData() {
  const { config, loading: configLoading, error: configError } = useConfig();
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  // Устанавливаем первый период как выбранный после загрузки конфига
  useEffect(() => {
    if (config && config.periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(config.periods[0].id);
    }
  }, [config, selectedPeriod]);

  const { data: periodData, loading: periodLoading, error: periodError } = usePeriodData(selectedPeriod);

  const changePeriod = useCallback((periodId: string) => {
    setSelectedPeriod(periodId);
  }, []);

  return {
    config,
    periodData,
    selectedPeriod,
    changePeriod,
    loading: configLoading || periodLoading,
    error: configError || periodError,
    isCloudflare: isCloudflareMode(),
  };
}
