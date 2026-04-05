import type { DataSourceOption, DataSourceId, MetricField } from '@/types/metrics';

/**
 * Реестр доступных источников данных.
 * Для добавления нового источника — добавьте одну запись сюда.
 */
export const DATA_SOURCES: DataSourceOption[] = [
  { id: 'backlog', label: 'В спринтах периода', shortLabel: 'В спринтах' },
  { id: 'created', label: 'Созданные в период', shortLabel: 'Созданные' },
  { id: 'totalBacklog', label: 'Открытые на конец периода', shortLabel: 'Бэклог' },
];

/**
 * Ограничения: какие источники доступны для конкретных метрик.
 * Если метрика не указана — доступны все источники.
 */
export const METRIC_SOURCE_OVERRIDES: Partial<Record<MetricField, DataSourceId[]>> = {
  // trackers: ['backlog'],  // раскомментировать при необходимости ограничить
};

/**
 * Возвращает доступные источники для конкретной метрики,
 * учитывая ограничения и фактическое наличие данных в sources.
 */
export function getAvailableSourcesForMetric(
  field: MetricField,
  availableSourceIds: string[]
): DataSourceOption[] {
  const allowed = METRIC_SOURCE_OVERRIDES[field];

  return DATA_SOURCES.filter(source => {
    // Источник должен существовать в данных
    if (!availableSourceIds.includes(source.id)) return false;
    // Если есть ограничения — проверяем
    if (allowed && !allowed.includes(source.id)) return false;
    return true;
  });
}
