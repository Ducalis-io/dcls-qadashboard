import type { EnvironmentFilter } from '@/types/metrics';
import type { SourceMetrics } from '@/services/periodDataService';

type RawBug = SourceMetrics['rawBugs'][number];

/**
 * Фильтрует rawBugs по окружению.
 * Возвращает исходный массив при filter='all' или отсутствии данных.
 */
export function filterBugsByEnv(rawBugs: RawBug[], filter: EnvironmentFilter): RawBug[] {
  if (filter === 'all' || !rawBugs || rawBugs.length === 0) {
    return rawBugs;
  }

  return rawBugs.filter(bug => {
    const env = bug.environment?.toLowerCase() || '';
    if (filter === 'prod') return env === 'prod' || env === 'production';
    if (filter === 'stage') return env === 'stage' || env === 'staging';
    return true;
  });
}

/**
 * Пересчитывает severity из отфильтрованных rawBugs.
 */
export function aggregateSeverity(bugs: RawBug[]): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const bug of bugs) {
    const key = bug.severity || 'unknown';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

/**
 * Пересчитывает environment из отфильтрованных rawBugs.
 */
export function aggregateEnvironment(bugs: RawBug[]): Array<{ environment: string; count: number }> {
  const counts = new Map<string, number>();
  for (const bug of bugs) {
    const key = bug.environment || 'unknown';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([environment, count]) => ({ environment, count }));
}

/**
 * Пересчитывает resolution из отфильтрованных rawBugs.
 */
export function aggregateResolution(bugs: RawBug[]): Array<{ status: string; count: number }> {
  const counts = new Map<string, number>();
  for (const bug of bugs) {
    const key = bug.status || 'To Do';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
}

/**
 * Пересчитывает components из отфильтрованных rawBugs.
 */
export function aggregateComponents(bugs: RawBug[]): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const bug of bugs) {
    const key = bug.component || 'no_component';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Пересчитывает reasons из отфильтрованных rawBugs.
 */
export function aggregateReasons(bugs: RawBug[]): Array<{ reason: string; count: number }> {
  const counts = new Map<string, number>();
  for (const bug of bugs) {
    const key = bug.reason || 'другое';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([reason, count]) => ({ reason, count }));
}
