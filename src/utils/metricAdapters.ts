import { MetricItem } from '@/types/metrics';

/**
 * Адаптер для severity данных
 */
export function adaptSeverityData(data: Array<{
  label: string;
  count: number;
  percentage: number;
  color: string;
}>): MetricItem[] {
  return data.map(item => ({
    id: item.label.toLowerCase().replace(/\s+/g, '_'),
    label: item.label,
    count: item.count,
    percentage: item.percentage,
    color: item.color,
  }));
}

/**
 * Адаптер для environment данных
 */
export function adaptEnvironmentData(data: Array<{
  environment: string;
  count: number;
  percentage: number;
  color: string;
}>): MetricItem[] {
  return data.map(item => ({
    id: item.environment.toLowerCase(),
    label: item.environment,
    count: item.count,
    percentage: item.percentage,
    color: item.color,
  }));
}

/**
 * Адаптер для resolution данных
 */
export function adaptResolutionData(data: Array<{
  status: string;
  count: number;
  percentage: number;
  color: string;
}>): MetricItem[] {
  return data.map(item => ({
    id: item.status.toLowerCase().replace(/\s+/g, '_'),
    label: item.status,
    count: item.count,
    percentage: item.percentage,
    color: item.color,
  }));
}

/**
 * Адаптер для components данных
 */
export function adaptComponentData(data: Array<{
  name: string;
  count: number;
  percentage: number;
}>, defaultColor: string = 'rgba(54, 162, 235, 0.8)'): MetricItem[] {
  return data.map(item => ({
    id: item.name.toLowerCase().replace(/\s+/g, '_'),
    label: item.name,
    count: item.count,
    percentage: item.percentage,
    color: defaultColor,
  }));
}

/**
 * Адаптер для reasons данных
 */
export function adaptReasonsData(data: Array<{
  reason: string;
  count: number;
  percentage: number;
  color: string;
}>): MetricItem[] {
  return data.map(item => ({
    id: item.reason.toLowerCase().replace(/\s+/g, '_'),
    label: item.reason,
    count: item.count,
    percentage: item.percentage,
    color: item.color,
  }));
}

/**
 * Адаптер для trackers данных
 */
export function adaptTrackersData(data: Array<{
  name: string;
  count: number;
  percentage: number;
  color: string;
}>): MetricItem[] {
  return data.map(item => ({
    id: item.name.toLowerCase().replace(/\s+/g, '_'),
    label: item.name,
    count: item.count,
    percentage: item.percentage,
    color: item.color,
  }));
}
