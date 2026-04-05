/**
 * Унифицированный интерфейс для элемента метрики.
 * Все данные (severity, environment, resolution и т.д.) приводятся к этому формату.
 */
export interface MetricItem {
  /** Уникальный идентификатор (например: 'critical', 'prod', 'Done') */
  id: string;
  /** Отображаемое название */
  label: string;
  /** Количество */
  count: number;
  /** Процент от общего */
  percentage: number;
  /** Цвет для графика (rgba формат) */
  color: string;
}

/**
 * Данные метрики для одного периода
 */
export interface MetricData {
  items: MetricItem[];
  total: number;
}

/**
 * Идентификатор источника данных
 */
export type DataSourceId = string; // 'backlog' | 'created' | ... extensible

/**
 * Описание источника данных для UI
 */
export interface DataSourceOption {
  id: DataSourceId;
  label: string;       // Полное название: "В спринтах периода"
  shortLabel: string;  // Короткое для кнопок: "В спринтах"
}

/**
 * Названия полей метрик внутри SourceMetrics
 */
export type MetricField = 'severity' | 'environment' | 'resolution' | 'components' | 'trackers' | 'reasons';

/**
 * Конфигурация колонки таблицы
 */
export interface TableColumn {
  key: keyof MetricItem | string;
  title: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown, item: MetricItem) => string;
}

/**
 * Тип фильтра окружения
 */
export type EnvironmentFilter = 'all' | 'prod' | 'stage';

/**
 * Режим отображения графика
 */
export type ChartMode = 'pie' | 'bar' | 'trend';
