import { z } from 'zod';

// Схема для метрик без color и percentage (вычисляются на фронте)
export const MetricItemSchema = z.object({
  label: z.string().optional(),
  environment: z.string().optional(),
  status: z.string().optional(),
  name: z.string().optional(),
  reason: z.string().optional(),
  count: z.number().int().min(0),
  // percentage и color теперь optional - вычисляются на фронте
  percentage: z.number().min(0).max(100).optional(),
  color: z.string().optional(),
});

/**
 * Минимальный набор данных о баге для фильтрации на фронтенде.
 *
 * Удалены чувствительные поля для публичного деплоя:
 * - key: z.string()              // Jira issue key
 * - summary: z.string()          // Issue title
 * - severity: z.string().optional()
 * - status: z.string()
 * - createdDate: z.string()
 * - resolvedDate: z.string().optional()
 */
export const RawBugSchema = z.object({
  environment: z.string().optional(),
  component: z.string().optional(),
});

export const PeriodDataSchema = z.object({
  periodId: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  generatedAt: z.string(),
  totalBugs: z.number().int().min(0),
  severity: z.array(MetricItemSchema),
  environment: z.array(MetricItemSchema),
  resolution: z.array(MetricItemSchema),
  components: z.array(MetricItemSchema),
  trackers: z.array(MetricItemSchema),
  reasons: z.array(MetricItemSchema),
  rawBugs: z.array(RawBugSchema),
  totalBugsCreated: z.number().int().min(0).optional(),
  componentsCreated: z.array(MetricItemSchema).optional(),
  reasonsCreated: z.array(MetricItemSchema).optional(),
  rawBugsCreated: z.array(RawBugSchema).optional(),
});

export const PeriodConfigSchema = z.object({
  id: z.string(),
  label: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  dataFile: z.string().optional(),
});

export const DashboardConfigSchema = z.object({
  lastUpdated: z.string(),
  // jiraHost removed - sensitive info, not used on frontend
  projectKey: z.string(),
  sprintsPerPeriod: z.number().optional(),      // Сколько спринтов в одном периоде
  totalSprintsAnalyzed: z.number().optional(),  // Общее количество анализируемых спринтов
  periods: z.array(PeriodConfigSchema),
  components: z.array(z.string()),
  sprints: z.array(z.object({
    sprint: z.string(),
    // sprintId removed - not used on frontend
    startDate: z.string(),
    endDate: z.string(),
    backlogBugs: z.number(),
  })),
  visibility: z.object({
    sprintBacklog: z.boolean(),
    environment: z.boolean(),
    resolution: z.boolean(),
    priority: z.boolean(),
    components: z.boolean(),
    trackers: z.boolean(),
    reasons: z.boolean(),
    testCoverage: z.boolean(),
  }).optional(),
});

export type ValidatedPeriodData = z.infer<typeof PeriodDataSchema>;
export type ValidatedDashboardConfig = z.infer<typeof DashboardConfigSchema>;
