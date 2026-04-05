/**
 * Утилиты для группировки и объединения периодов
 */

import type { PeriodConfig, PeriodData, SourceMetrics } from '@/services/periodDataService';

// === Типы ===

export interface GroupedPeriodConfig {
  id: string;           // "period1" или "period1-3"
  label: string;        // "01.03 - 15.04"
  startDate: string;
  endDate: string;
  sourceIds: string[];  // ["period1", "period2", "period3"]
}

// === Generic функция мёржа массивов по ключу ===

export function mergeArraysByKey<T extends Record<string, unknown> & { count: number }>(
  arrays: T[][],
  getKey: (item: T) => string
): T[] {
  const merged = new Map<string, T>();

  for (const array of arrays) {
    for (const item of array) {
      const key = getKey(item);
      const existing = merged.get(key);
      if (existing) {
        existing.count += item.count;
      } else {
        merged.set(key, { ...item });
      }
    }
  }

  return Array.from(merged.values());
}

// === Группировка периодов ===

/**
 * Группирует периоды по multiplier.
 * Неполная группа размещается В НАЧАЛЕ списка.
 *
 * Пример: periods=[p1,p2,p3,p4,p5], multiplier=2
 * Результат: [[p1], [p2,p3], [p4,p5]]
 */
export function groupPeriods(
  periods: PeriodConfig[],
  multiplier: number
): PeriodConfig[][] {
  if (multiplier <= 1 || periods.length === 0) {
    return periods.map(p => [p]);
  }

  const remainder = periods.length % multiplier;
  const groups: PeriodConfig[][] = [];
  let startIndex = 0;

  // Неполная группа В НАЧАЛЕ
  if (remainder > 0) {
    groups.push(periods.slice(0, remainder));
    startIndex = remainder;
  }

  // Полные группы
  for (let i = startIndex; i < periods.length; i += multiplier) {
    groups.push(periods.slice(i, i + multiplier));
  }

  return groups;
}

// === Создание конфига для UI ===

/**
 * Форматирует дату в короткий формат DD.MM
 */
function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${day}.${month}`;
}

/**
 * Создаёт конфигурации сгруппированных периодов для UI
 */
export function createGroupedPeriodConfigs(
  groups: PeriodConfig[][]
): GroupedPeriodConfig[] {
  return groups.map(group => {
    const first = group[0];
    const last = group[group.length - 1];

    // ID: если один период — его id, иначе "periodX-Y"
    const id = group.length === 1
      ? first.id
      : `${first.id}-${last.id}`;

    // Label: короткие даты "DD.MM - DD.MM"
    const label = `${formatShortDate(first.startDate)} - ${formatShortDate(last.endDate)}`;

    return {
      id,
      label,
      startDate: first.startDate,
      endDate: last.endDate,
      sourceIds: group.map(p => p.id),
    };
  });
}

// === Объединение метрик одного источника ===

/**
 * Ключ-функции для мёржа массивов метрик.
 * Ключ извлекает идентифицирующее поле из элемента.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const METRIC_KEY_EXTRACTORS: Record<string, (item: any) => string> = {
  severity: (item) => item.label || '',
  environment: (item) => item.environment || '',
  resolution: (item) => item.status || '',
  components: (item) => item.name || '',
  trackers: (item) => item.name || '',
  reasons: (item) => item.reason || '',
};

/**
 * Объединяет SourceMetrics из нескольких периодов в один.
 */
function mergeSourceMetrics(metricsList: SourceMetrics[]): SourceMetrics {
  if (metricsList.length === 1) return metricsList[0];

  return {
    totalBugs: metricsList.reduce((sum, m) => sum + m.totalBugs, 0),
    severity: mergeArraysByKey(metricsList.map(m => m.severity), METRIC_KEY_EXTRACTORS.severity),
    environment: mergeArraysByKey(metricsList.map(m => m.environment), METRIC_KEY_EXTRACTORS.environment),
    resolution: mergeArraysByKey(metricsList.map(m => m.resolution), METRIC_KEY_EXTRACTORS.resolution),
    components: mergeArraysByKey(metricsList.map(m => m.components), METRIC_KEY_EXTRACTORS.components),
    trackers: mergeArraysByKey(metricsList.map(m => m.trackers), METRIC_KEY_EXTRACTORS.trackers),
    reasons: mergeArraysByKey(metricsList.map(m => m.reasons), METRIC_KEY_EXTRACTORS.reasons),
    rawBugs: metricsList.flatMap(m => m.rawBugs),
  };
}

// === Объединение данных периодов ===

/**
 * Объединяет данные нескольких периодов в один.
 * Итерирует по всем source keys и мёржит каждый отдельно.
 */
export function mergePeriodData(periodsData: PeriodData[]): PeriodData {
  if (periodsData.length === 0) {
    throw new Error('Cannot merge empty array of periods');
  }

  if (periodsData.length === 1) {
    return periodsData[0];
  }

  const first = periodsData[0];
  const last = periodsData[periodsData.length - 1];

  // Собираем все source keys из всех периодов
  const allSourceKeys = new Set<string>();
  periodsData.forEach(p => {
    if (p.sources) {
      Object.keys(p.sources).forEach(k => allSourceKeys.add(k));
    }
  });

  // Мёржим каждый source отдельно
  const sources: Record<string, SourceMetrics> = {};
  for (const sourceKey of allSourceKeys) {
    const metricsList = periodsData
      .map(p => p.sources?.[sourceKey])
      .filter((m): m is SourceMetrics => m !== undefined && m !== null);

    if (metricsList.length > 0) {
      sources[sourceKey] = mergeSourceMetrics(metricsList);
    }
  }

  return {
    periodId: `${first.periodId}-${last.periodId}`,
    startDate: first.startDate,
    endDate: last.endDate,
    generatedAt: new Date().toISOString(),
    sources,
  };
}

// === Умный поиск периода при смене multiplier ===

/**
 * Находит лучшее соответствие для текущего выбранного периода
 * после смены multiplier.
 *
 * Логика:
 * 1. Точное совпадение ID → возвращаем его
 * 2. Ищем группу, содержащую хотя бы один sourceId текущего периода
 * 3. Fallback → первый период
 */
export function findBestMatchingPeriod(
  currentId: string,
  oldGrouped: GroupedPeriodConfig[],
  newGrouped: GroupedPeriodConfig[]
): string {
  // 1. Точное совпадение ID
  if (newGrouped.some(p => p.id === currentId)) {
    return currentId;
  }

  // 2. Найти sourceIds текущего периода
  const current = oldGrouped.find(p => p.id === currentId);
  if (!current) {
    return newGrouped[0]?.id ?? '';
  }

  // 3. Найти новую группу, содержащую хотя бы один sourceId
  for (const newPeriod of newGrouped) {
    if (current.sourceIds.some(id => newPeriod.sourceIds.includes(id))) {
      return newPeriod.id;
    }
  }

  // 4. Fallback
  return newGrouped[0]?.id ?? '';
}
