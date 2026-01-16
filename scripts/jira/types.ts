// Jira API Types

export interface JiraConfig {
  host: string;
  email: string;
  apiToken: string;
  projectKey?: string;
}

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    priority?: { name: string };
    status: { name: string; statusCategory?: { name: string } };
    components?: Array<{ name: string }>;
    environment?: string;
    created: string;
    resolutiondate?: string;
    issuetype?: { name: string };
    [key: string]: unknown;
  };
}

export interface JiraSearchResult {
  issues: JiraIssue[];
  total?: number;        // Может не возвращаться в /search/jql
  maxResults?: number;
  startAt?: number;
  isLast?: boolean;      // Используется в /search/jql для пагинации
  nextPageToken?: string; // Cursor для следующей страницы (cursor-based пагинация)
}

export interface JiraField {
  id: string;
  name: string;
  custom: boolean;
  schema?: {
    type: string;
    custom?: string;
  };
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'closed' | 'future';
  startDate?: string;
  endDate?: string;
  completeDate?: string;
}

export interface JiraBoard {
  id: number;
  name: string;
  type: string;
  location?: {
    projectKey: string;
    projectName: string;
  };
}

// Period types
export interface PeriodConfig {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  sprintIds?: number[];
  sprintNames?: string[];
}

// Transformed data types (без color и percentage - вычисляются на фронте)
export interface SeverityData {
  label: string;
  count: number;
}

export interface EnvironmentData {
  environment: string;
  count: number;
}

export interface ResolutionData {
  status: string;
  count: number;
}

export interface ComponentData {
  name: string;
  count: number;
}

export interface TrackerData {
  name: string;
  count: number;
}

export interface ReasonData {
  reason: string;
  count: number;
}

export interface SprintBugData {
  sprint: string;
  // sprintId removed - not used on frontend, was Jira internal ID
  startDate: string;
  endDate: string;
  backlogBugs: number;
  inProgressBugs?: number;
  totalOpenBugs?: number;
}

/**
 * Минимальный набор данных о баге для фронтенда (фильтрация по окружению/компоненту).
 *
 * Удалены чувствительные поля для публичного деплоя:
 * - key: string           // Jira issue key (e.g., "PROJ-123")
 * - summary: string       // Issue title
 * - severity?: string     // Bug severity
 * - status: string        // Issue status
 * - createdDate: string   // Creation date
 * - resolvedDate?: string // Resolution date
 * - sprintName?: string   // Sprint name
 */
export interface RawBug {
  environment?: string;
  component?: string;
}

export interface PeriodData {
  periodId: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  totalBugs: number;
  severity: SeverityData[];
  environment: EnvironmentData[];
  resolution: ResolutionData[];
  components: ComponentData[];
  trackers: TrackerData[];
  reasons: ReasonData[];
  rawBugs: RawBug[];
  // Данные по багам, созданным в период (для компонентов и причин)
  totalBugsCreated?: number;
  componentsCreated?: ComponentData[];
  reasonsCreated?: ReasonData[];
  rawBugsCreated?: RawBug[];
}

export interface SectionVisibility {
  sprintBacklog: boolean;    // Динамика багов по спринтам
  environment: boolean;      // Распределение по окружениям
  resolution: boolean;       // Распределение по резолюции
  priority: boolean;         // Приоритеты багов
  components: boolean;       // Компоненты
  trackers: boolean;         // Баги в трекерах
  reasons: boolean;          // Причины багов
  testCoverage: boolean;     // Покрытие тестами
}

export interface DashboardConfig {
  lastUpdated: string;
  // jiraHost removed - sensitive info, not used on frontend
  projectKey: string;
  sprintsPerPeriod: number;      // Сколько спринтов в одном периоде
  totalSprintsAnalyzed: number;  // Общее количество анализируемых спринтов
  periods: Array<{
    id: string;
    label: string;
    startDate: string;
    endDate: string;
    dataFile: string;
  }>;
  components: string[];
  sprints: SprintBugData[];
  visibility: SectionVisibility;
}
