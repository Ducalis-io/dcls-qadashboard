import type { PeriodConfig } from './types';

/**
 * JQL запросы для получения данных из Jira
 */

export function getBugsForPeriodJQL(projectKey: string, period: PeriodConfig): string {
  // Если есть sprintIds, используем их для точной выборки
  if (period.sprintIds && period.sprintIds.length > 0) {
    return `
      project = ${projectKey}
      AND issuetype = Bug
      AND Sprint IN (${period.sprintIds.join(',')})
      ORDER BY created DESC
    `
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Fallback на даты если sprintIds нет (для обратной совместимости)
  return `
    project = ${projectKey}
    AND issuetype = Bug
    AND created >= "${period.startDate}"
    AND created <= "${period.endDate}"
    ORDER BY created DESC
  `
    .replace(/\s+/g, ' ')
    .trim();
}

export function getBugsForSprintJQL(projectKey: string, sprintId: number): string {
  return `
    project = ${projectKey}
    AND issuetype = Bug
    AND Sprint = ${sprintId}
    ORDER BY created DESC
  `
    .replace(/\s+/g, ' ')
    .trim();
}

export function getAllBugsJQL(projectKey: string): string {
  return `
    project = ${projectKey}
    AND issuetype = Bug
    ORDER BY created DESC
  `
    .replace(/\s+/g, ' ')
    .trim();
}

export function getBugsInDateRangeJQL(
  projectKey: string,
  startDate: string,
  endDate: string
): string {
  return `
    project = ${projectKey}
    AND issuetype = Bug
    AND created >= "${startDate}"
    AND created <= "${endDate}"
    ORDER BY created DESC
  `
    .replace(/\s+/g, ' ')
    .trim();
}

export function getBugsForSprintsJQL(projectKey: string, sprintIds: number[]): string {
  const sprintFilter = sprintIds.map((id) => `Sprint = ${id}`).join(' OR ');

  return `
    project = ${projectKey}
    AND issuetype = Bug
    AND (${sprintFilter})
    ORDER BY created DESC
  `
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Получить открытые баги на конкретную дату (ретроспективно)
 * Логика: баги созданы до этой даты И НЕ БЫЛИ в статусе Done до этой даты
 *
 * Используем оператор WAS ... BEFORE для проверки исторического состояния:
 * - created <= targetDate — баг был создан до указанной даты
 * - NOT status WAS IN ("Done") BEFORE targetDate — баг НЕ БЫЛ закрыт до этой даты
 *
 * Это даёт точное количество открытых багов в бэклоге на момент завершения спринта
 */
export function getOpenBugsAtDateJQL(
  projectKey: string,
  targetDate: string
): string {
  return `
    project = ${projectKey}
    AND issuetype = Bug
    AND created <= "${targetDate}"
    AND NOT status WAS IN ("Done") BEFORE "${targetDate}"
    ORDER BY created DESC
  `
    .replace(/\s+/g, ' ')
    .trim();
}
