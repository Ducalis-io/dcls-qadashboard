import { MetricItem } from '@/types/metrics';
import {
  getSeverityColor,
  getEnvironmentColor,
  getResolutionColor,
  getReasonColor,
  getTrackerColor,
  calculatePercentage,
  DEFAULT_COMPONENT_COLOR,
} from './colors';

/**
 * Адаптер для severity данных
 * Вычисляет color и percentage на лету
 */
export function adaptSeverityData(data: Array<{
  label: string;
  count: number;
}>, totalBugs: number): MetricItem[] {
  return data.map(item => ({
    id: item.label.toLowerCase().replace(/\s+/g, '_'),
    label: item.label,
    count: item.count,
    percentage: calculatePercentage(item.count, totalBugs),
    color: getSeverityColor(item.label),
  }));
}

/**
 * Адаптер для environment данных
 * Вычисляет color и percentage на лету
 */
export function adaptEnvironmentData(data: Array<{
  environment: string;
  count: number;
}>, totalBugs: number): MetricItem[] {
  return data.map(item => ({
    id: item.environment.toLowerCase(),
    label: item.environment,
    count: item.count,
    percentage: calculatePercentage(item.count, totalBugs),
    color: getEnvironmentColor(item.environment),
  }));
}

/**
 * Адаптер для resolution данных
 * Вычисляет color и percentage на лету
 */
export function adaptResolutionData(data: Array<{
  status: string;
  count: number;
}>, totalBugs: number): MetricItem[] {
  return data.map(item => ({
    id: item.status.toLowerCase().replace(/\s+/g, '_'),
    label: item.status,
    count: item.count,
    percentage: calculatePercentage(item.count, totalBugs),
    color: getResolutionColor(item.status),
  }));
}

/**
 * Адаптер для components данных
 * Вычисляет percentage на лету, использует дефолтный цвет
 */
export function adaptComponentData(data: Array<{
  name: string;
  count: number;
}>, totalBugs: number, defaultColor: string = DEFAULT_COMPONENT_COLOR): MetricItem[] {
  return data.map(item => ({
    id: item.name.toLowerCase().replace(/\s+/g, '_'),
    label: item.name,
    count: item.count,
    percentage: calculatePercentage(item.count, totalBugs),
    color: defaultColor,
  }));
}

/**
 * Адаптер для reasons данных
 * Вычисляет color и percentage на лету
 */
export function adaptReasonsData(data: Array<{
  reason: string;
  count: number;
}>, totalBugs: number): MetricItem[] {
  return data.map(item => ({
    id: item.reason.toLowerCase().replace(/\s+/g, '_'),
    label: item.reason,
    count: item.count,
    percentage: calculatePercentage(item.count, totalBugs),
    color: getReasonColor(item.reason),
  }));
}

/**
 * Адаптер для trackers данных
 * Вычисляет color и percentage на лету
 */
export function adaptTrackersData(data: Array<{
  name: string;
  count: number;
}>, totalBugs: number): MetricItem[] {
  return data.map(item => ({
    id: item.name.toLowerCase().replace(/\s+/g, '_'),
    label: item.name,
    count: item.count,
    percentage: calculatePercentage(item.count, totalBugs),
    color: getTrackerColor(item.name),
  }));
}
