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

// Transformed data types
export interface SeverityData {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface EnvironmentData {
  environment: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ResolutionData {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ComponentData {
  name: string;
  count: number;
  percentage: number;
}

export interface TrackerData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ReasonData {
  reason: string;
  count: number;
  percentage: number;
  color: string;
}

export interface SprintBugData {
  sprint: string;
  sprintId: number;
  startDate: string;
  endDate: string;
  backlogBugs: number;
  inProgressBugs?: number;
  totalOpenBugs?: number;
}

export interface RawBug {
  key: string;
  summary: string;
  severity?: string;
  environment?: string;
  component?: string;
  status: string;
  createdDate: string;
  resolvedDate?: string;
  sprintName?: string;
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
  jiraHost: string;
  projectKey: string;
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
