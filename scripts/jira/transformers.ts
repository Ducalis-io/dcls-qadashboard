import type {
  JiraIssue,
  PeriodData,
  SeverityData,
  EnvironmentData,
  ResolutionData,
  ComponentData,
  TrackerData,
  ReasonData,
  RawBug,
} from './types';
export type { ComponentData, ReasonData };
import {
  SEVERITY_COLORS,
  ENVIRONMENT_COLORS,
  BUG_REASON_COLORS,
  TRACKER_COLORS,
  RESOLUTION_COLORS,
  getBugReasonColor,
} from './config';

/**
 * Трансформирует массив Jira issues в структурированные данные для дашборда
 */
export function transformBugsToMetrics(
  issues: JiraIssue[],
  severityField: string,
  bugReasonField: string,
  environmentField: string = 'environment',
  componentField: string = ''
): Omit<PeriodData, 'periodId' | 'startDate' | 'endDate' | 'generatedAt'> {
  const total = issues.length;

  // 1. Группировка по Severity
  const severityCounts = new Map<string, number>();
  issues.forEach((issue) => {
    const severityValue = issue.fields[severityField];
    let severity = 'unknown';

    if (typeof severityValue === 'object' && severityValue !== null) {
      severity = (severityValue as any).value || (severityValue as any).name || 'unknown';
    } else if (typeof severityValue === 'string') {
      severity = severityValue;
    } else if (issue.fields.priority?.name) {
      severity = issue.fields.priority.name;
    }

    severity = severity.toLowerCase();
    severityCounts.set(severity, (severityCounts.get(severity) || 0) + 1);
  });

  const severity: SeverityData[] = Array.from(severityCounts.entries()).map(([label, count]) => ({
    label,
    count,
    percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0,
    color: SEVERITY_COLORS[label] || SEVERITY_COLORS.unknown,
  }));

  // 2. Группировка по Environment
  const envCounts = new Map<string, number>();
  issues.forEach((issue) => {
    let env = 'unknown';

    // Пробуем получить environment из указанного поля (кастомного или стандартного)
    const envValue = issue.fields[environmentField] || issue.fields.environment;

    if (typeof envValue === 'object' && envValue !== null) {
      // Кастомное поле может быть объектом с value/name
      env = (envValue as any).value || (envValue as any).name || 'unknown';
    } else if (typeof envValue === 'string' && envValue.trim()) {
      env = envValue;
    }

    env = env.toLowerCase();
    envCounts.set(env, (envCounts.get(env) || 0) + 1);
  });

  const environment: EnvironmentData[] = Array.from(envCounts.entries()).map(
    ([environment, count]) => ({
      environment,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0,
      color: ENVIRONMENT_COLORS[environment] || ENVIRONMENT_COLORS.unknown,
    })
  );

  // 3. Группировка по Resolution Status
  const statusCounts = new Map<string, number>();
  issues.forEach((issue) => {
    const statusCategory = issue.fields.status?.statusCategory?.name || '';
    let normalized = 'To Do';

    if (statusCategory === 'Done' || issue.fields.status?.name === 'Done') {
      normalized = 'Done';
    } else if (statusCategory === 'In Progress' || issue.fields.status?.name === 'In Progress') {
      normalized = 'In Progress';
    }

    statusCounts.set(normalized, (statusCounts.get(normalized) || 0) + 1);
  });

  const resolution: ResolutionData[] = Array.from(statusCounts.entries()).map(
    ([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0,
      color: RESOLUTION_COLORS[status] || RESOLUTION_COLORS.unknown,
    })
  );

  // 4. Группировка по Components
  const componentCounts = new Map<string, number>();
  issues.forEach((issue) => {
    let componentNames: string[] = [];

    // Если указано кастомное поле для компонентов
    if (componentField) {
      const customValue = issue.fields[componentField];
      if (Array.isArray(customValue)) {
        // Массив строк: ["asana", "backlog", "sync_back"]
        componentNames = customValue.map((v: any) =>
          typeof v === 'string' ? v : (v?.value || v?.name || '')
        ).filter(Boolean);
      } else if (typeof customValue === 'object' && customValue !== null) {
        componentNames = [(customValue as any).value || (customValue as any).name || ''];
      } else if (typeof customValue === 'string' && customValue.trim()) {
        componentNames = [customValue];
      }
    } else {
      // Используем стандартное поле components
      const components = issue.fields.components || [];
      componentNames = components.map((c: any) => c.name).filter(Boolean);
    }

    if (componentNames.length === 0) {
      componentCounts.set('no_component', (componentCounts.get('no_component') || 0) + 1);
    } else {
      componentNames.forEach((name) => {
        componentCounts.set(name, (componentCounts.get(name) || 0) + 1);
      });
    }
  });

  const components: ComponentData[] = Array.from(componentCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 5. Группировка по Bug Reasons (Custom Field)
  const reasonCounts = new Map<string, number>();
  issues.forEach((issue) => {
    const reasonValue = issue.fields[bugReasonField];
    let reason = 'другое';

    if (typeof reasonValue === 'object' && reasonValue !== null) {
      reason = (reasonValue as any).value || (reasonValue as any).name || 'другое';
    } else if (typeof reasonValue === 'string') {
      reason = reasonValue;
    }

    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
  });

  const reasons: ReasonData[] = Array.from(reasonCounts.entries()).map(([reason, count]) => ({
    reason,
    count,
    percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0,
    color: getBugReasonColor(reason),
  }));

  // 6. Trackers (пока заглушка, так как не ясно откуда брать)
  // В реальности можно использовать labels или отдельное custom field
  const trackers: TrackerData[] = [
    {
      name: 'Jira',
      count: total,
      percentage: 100,
      color: TRACKER_COLORS.Jira,
    },
  ];

  // 7. Raw bugs для reference
  const rawBugs: RawBug[] = issues.map((issue) => {
    const severityValue = issue.fields[severityField];
    let severity = 'unknown';

    if (typeof severityValue === 'object' && severityValue !== null) {
      severity = (severityValue as any).value || (severityValue as any).name || 'unknown';
    } else if (typeof severityValue === 'string') {
      severity = severityValue;
    } else if (issue.fields.priority?.name) {
      severity = issue.fields.priority.name;
    }

    // Извлекаем environment из указанного поля
    const envValue = issue.fields[environmentField] || issue.fields.environment;
    let env = 'unknown';
    if (typeof envValue === 'object' && envValue !== null) {
      env = (envValue as any).value || (envValue as any).name || 'unknown';
    } else if (typeof envValue === 'string' && envValue.trim()) {
      env = envValue;
    }

    // Извлекаем component из указанного поля (первый из списка)
    let componentName = 'no_component';
    if (componentField) {
      const customValue = issue.fields[componentField];
      if (Array.isArray(customValue) && customValue.length > 0) {
        const first = customValue[0];
        componentName = typeof first === 'string' ? first : (first?.value || first?.name || 'no_component');
      } else if (typeof customValue === 'object' && customValue !== null) {
        componentName = (customValue as any).value || (customValue as any).name || 'no_component';
      } else if (typeof customValue === 'string' && customValue.trim()) {
        componentName = customValue;
      }
    } else if (issue.fields.components?.[0]?.name) {
      componentName = issue.fields.components[0].name;
    }

    return {
      key: issue.key,
      summary: issue.fields.summary,
      severity: severity.toLowerCase(),
      environment: env.toLowerCase(),
      component: componentName,
      status: issue.fields.status?.name || 'unknown',
      createdDate: issue.fields.created?.split('T')[0] || '',
      resolvedDate: issue.fields.resolutiondate?.split('T')[0],
    };
  });

  return {
    totalBugs: total,
    severity,
    environment,
    resolution,
    components,
    trackers,
    reasons,
    rawBugs,
  };
}

/**
 * Извлекает компоненты, причины и rawBugs из массива issues
 * Используется для багов, созданных в период (отдельно от бэклога спринтов)
 */
export function extractComponentsAndReasons(
  issues: JiraIssue[],
  bugReasonField: string,
  componentField: string = '',
  environmentField: string = 'environment'
): { components: ComponentData[]; reasons: ReasonData[]; rawBugs: RawBug[]; total: number } {
  const total = issues.length;

  // Группировка по Components
  const componentCounts = new Map<string, number>();
  issues.forEach((issue) => {
    let componentNames: string[] = [];

    if (componentField) {
      const customValue = issue.fields[componentField];
      if (Array.isArray(customValue)) {
        componentNames = customValue.map((v: any) =>
          typeof v === 'string' ? v : (v?.value || v?.name || '')
        ).filter(Boolean);
      } else if (typeof customValue === 'object' && customValue !== null) {
        componentNames = [(customValue as any).value || (customValue as any).name || ''];
      } else if (typeof customValue === 'string' && customValue.trim()) {
        componentNames = [customValue];
      }
    } else {
      const components = issue.fields.components || [];
      componentNames = components.map((c: any) => c.name).filter(Boolean);
    }

    if (componentNames.length === 0) {
      componentCounts.set('no_component', (componentCounts.get('no_component') || 0) + 1);
    } else {
      componentNames.forEach((name) => {
        componentCounts.set(name, (componentCounts.get(name) || 0) + 1);
      });
    }
  });

  const components: ComponentData[] = Array.from(componentCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Группировка по Bug Reasons
  const reasonCounts = new Map<string, number>();
  issues.forEach((issue) => {
    const reasonValue = issue.fields[bugReasonField];
    let reason = 'другое';

    if (typeof reasonValue === 'object' && reasonValue !== null) {
      reason = (reasonValue as any).value || (reasonValue as any).name || 'другое';
    } else if (typeof reasonValue === 'string') {
      reason = reasonValue;
    }

    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
  });

  const reasons: ReasonData[] = Array.from(reasonCounts.entries()).map(([reason, count]) => ({
    reason,
    count,
    percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0,
    color: getBugReasonColor(reason),
  }));

  // Raw bugs для фильтрации на фронтенде
  const rawBugs: RawBug[] = issues.map((issue) => {
    // Извлекаем environment
    const envValue = issue.fields[environmentField] || issue.fields.environment;
    let env = 'unknown';
    if (typeof envValue === 'object' && envValue !== null) {
      env = (envValue as any).value || (envValue as any).name || 'unknown';
    } else if (typeof envValue === 'string' && envValue.trim()) {
      env = envValue;
    }

    // Извлекаем component
    let componentName = 'no_component';
    if (componentField) {
      const customValue = issue.fields[componentField];
      if (Array.isArray(customValue) && customValue.length > 0) {
        const first = customValue[0];
        componentName = typeof first === 'string' ? first : (first?.value || first?.name || 'no_component');
      } else if (typeof customValue === 'object' && customValue !== null) {
        componentName = (customValue as any).value || (customValue as any).name || 'no_component';
      } else if (typeof customValue === 'string' && customValue.trim()) {
        componentName = customValue;
      }
    } else if (issue.fields.components?.[0]?.name) {
      componentName = issue.fields.components[0].name;
    }

    return {
      key: issue.key,
      summary: issue.fields.summary,
      environment: env.toLowerCase(),
      component: componentName,
      status: issue.fields.status?.name || 'unknown',
      createdDate: issue.fields.created?.split('T')[0] || '',
    };
  });

  return { components, reasons, rawBugs, total };
}

/**
 * Извлекает данные по спринтам для графика backlog
 */
export function extractSprintData(
  issues: JiraIssue[]
): Array<{ sprint: string; date: string; backlogBugs: number }> {
  // Группируем баги по спринтам
  const sprintMap = new Map<string, { date: string; count: number }>();

  issues.forEach((issue) => {
    // Ищем поле Sprint (может быть customfield_10020 или другое)
    const sprintField = Object.entries(issue.fields).find(
      ([key, value]) =>
        key.includes('sprint') && Array.isArray(value) && (value as any[]).length > 0
    );

    if (sprintField) {
      const sprints = sprintField[1] as any[];
      sprints.forEach((sprint) => {
        if (sprint && sprint.name) {
          const sprintName = sprint.name;
          const sprintDate = sprint.startDate?.split('T')[0] || '';

          if (!sprintMap.has(sprintName)) {
            sprintMap.set(sprintName, { date: sprintDate, count: 0 });
          }

          const data = sprintMap.get(sprintName)!;
          data.count++;
        }
      });
    }
  });

  return Array.from(sprintMap.entries())
    .map(([sprint, data]) => ({
      sprint,
      date: data.date,
      backlogBugs: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
