/**
 * Сервис для загрузки данных периодов из JSON файлов
 */

import { PeriodDataSchema, DashboardConfigSchema, ValidatedDashboardConfig } from '@/schemas/periodData';
import configData from '@/data/config.json';

export interface PeriodConfig {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  dataFile: string;
}

// Используем тип напрямую из Zod схемы для избежания дублирования
export type DashboardConfig = ValidatedDashboardConfig;

export interface PeriodData {
  periodId: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  totalBugs: number;
  severity: Array<{
    label: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  environment: Array<{
    environment: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  resolution: Array<{
    status: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  components: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  trackers: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  reasons: Array<{
    reason: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  // Минимальный набор для фильтрации на фронтенде
  // Удалены: key, summary, severity, status, createdDate, resolvedDate
  rawBugs: Array<{
    environment?: string;
    component?: string;
  }>;
  // Данные по багам, созданным в период (для компонентов и причин)
  totalBugsCreated?: number;
  componentsCreated?: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  reasonsCreated?: Array<{
    reason: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  // Минимальный набор для фильтрации на фронтенде
  rawBugsCreated?: Array<{
    environment?: string;
    component?: string;
  }>;
}

/**
 * Получить конфигурацию дашборда
 */
export function getConfig(): DashboardConfig | null {
  try {
    const result = DashboardConfigSchema.safeParse(configData);
    if (!result.success) {
      console.error('Invalid config data:', result.error.issues);
      return configData as DashboardConfig;
    }

    return result.data as DashboardConfig;
  } catch (error) {
    console.error('Failed to load config:', error);
    return null;
  }
}

/**
 * Получить список ID периодов
 */
export function getPeriodIds(): string[] {
  const config = getConfig();
  return config?.periods.map((p) => p.id) || [];
}

/**
 * Получить метку периода по ID
 */
export function getPeriodLabel(periodId: string): string {
  const config = getConfig();
  const period = config?.periods.find((p) => p.id === periodId);
  return period?.label || periodId;
}

/**
 * Получить данные периода
 */
export function getPeriodData(periodId: string): PeriodData | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require(`@/data/periods/${periodId}.json`);

    const result = PeriodDataSchema.safeParse(data);
    if (!result.success) {
      console.error(`Invalid period data for ${periodId}:`, result.error.issues);
      return data;
    }

    return result.data as PeriodData;
  } catch (error) {
    console.error(`Failed to load period data for ${periodId}:`, error);
    return null;
  }
}

/**
 * Получить данные всех периодов
 */
export function getAllPeriodsData(): PeriodData[] {
  const config = getConfig();
  if (!config) return [];

  return config.periods
    .map((p) => getPeriodData(p.id))
    .filter((data): data is PeriodData => data !== null);
}

/**
 * Получить агрегированные данные по компонентам для выбранных периодов
 */
export function getAggregatedComponentData(periodIds: string[]): {
  name: string;
  count: number;
}[] {
  const componentMap = new Map<string, number>();

  periodIds.forEach((periodId) => {
    const data = getPeriodData(periodId);
    if (data) {
      data.components.forEach((comp) => {
        componentMap.set(comp.name, (componentMap.get(comp.name) || 0) + comp.count);
      });
    }
  });

  return Array.from(componentMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
