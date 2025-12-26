import type {
  JiraConfig,
  JiraIssue,
  JiraSearchResult,
  JiraField,
  JiraProject,
  JiraBoard,
  JiraSprint,
} from './types';
import { getLogger } from './logger';

export class JiraClient {
  private baseUrl: string;
  private agileUrl: string;
  private authHeader: string;
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // Минимум 1 секунда между запросами
  private consecutive429Count = 0; // Счётчик последовательных 429
  private requestCount = 0; // Общий счётчик запросов

  constructor(config: JiraConfig) {
    // Если указан cloudId, используем новый URL для Scoped API tokens
    const cloudId = process.env.JIRA_CLOUD_ID;
    if (cloudId) {
      this.baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`;
      this.agileUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0`;
    } else {
      // Fallback на старый URL
      this.baseUrl = `${config.host}/rest/api/3`;
      this.agileUrl = `${config.host}/rest/agile/1.0`;
    }
    this.authHeader = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  }

  // Глобальный rate limiter - ждём между любыми запросами
  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestInterval) {
      const waitMs = this.minRequestInterval - elapsed;
      getLogger().debug(`throttle: ждём ${waitMs}ms (interval=${this.minRequestInterval}ms)`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
    this.lastRequestTime = Date.now();
  }

  private async request<T>(url: string, options: RequestInit = {}, retries = 10): Promise<T> {
    this.requestCount++;
    const reqId = this.requestCount;
    const logger = getLogger();

    // Логируем запрос
    logger.logRequest(url, options.method || 'GET');
    logger.debug(`[REQ#${reqId}] State: consecutive429=${this.consecutive429Count}, interval=${this.minRequestInterval}ms`);

    for (let attempt = 0; attempt <= retries; attempt++) {
      logger.debug(`[REQ#${reqId}] Attempt ${attempt + 1}/${retries + 1}`);

      // Throttle между запросами
      await this.throttle();

      logger.debug(`[REQ#${reqId}] Sending fetch...`);
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Basic ${this.authHeader}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
      });

      // Собираем заголовки
      const headers: Record<string, string> = {};
      response.headers.forEach((v, k) => { headers[k] = v; });

      // Получаем данные
      const responseData = response.ok ? await response.json() : null;

      // Логируем ответ
      logger.logResponse(reqId, response.status, response.statusText, headers, responseData);

      // Обработка rate limit с exponential backoff + jitter
      if (response.status === 429) {
        this.consecutive429Count++;

        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader) : 10;

        logger.debug(`[REQ#${reqId}] 429! consecutive429Count now = ${this.consecutive429Count}, Retry-After header = "${retryAfterHeader}"`);

        // Используем глобальный счётчик 429 для exponential backoff
        // Минимум 30 секунд, игнорируем маленькие Retry-After
        const baseWait = Math.max(retryAfter, 30);
        const exponentialWait = baseWait * Math.pow(2, Math.min(this.consecutive429Count - 1, 5));
        const jitter = Math.random() * 5000; // 0-5 секунд случайный jitter
        const waitTime = (exponentialWait * 1000) + jitter;

        // Максимум 5 минут ожидания
        const cappedWaitTime = Math.min(waitTime, 300000);
        const waitSeconds = Math.round(cappedWaitTime / 1000);

        logger.logRateLimit(attempt + 1, retries + 1, waitSeconds);

        if (attempt < retries) {
          logger.debug(`[REQ#${reqId}] Sleeping ${Math.round(cappedWaitTime)}ms...`);
          await new Promise(resolve => setTimeout(resolve, cappedWaitTime));
          // После ожидания увеличиваем интервал между запросами
          this.minRequestInterval = Math.min(this.minRequestInterval * 2, 5000);
          logger.debug(`[REQ#${reqId}] Woke up, new interval = ${this.minRequestInterval}ms`);
          continue;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        logger.debug(`[REQ#${reqId}] ERROR: ${response.status} - ${errorText.substring(0, 200)}`);
        throw new Error(`Jira API error: ${response.status} ${response.statusText}\n${errorText}`);
      }

      // Успешный запрос - сбрасываем счётчик и уменьшаем интервал
      logger.debug(`[REQ#${reqId}] SUCCESS! Resetting consecutive429Count to 0`);
      this.consecutive429Count = 0;
      this.minRequestInterval = Math.max(this.minRequestInterval * 0.9, 1000);

      return responseData as T;
    }

    logger.debug(`[REQ#${reqId}] FAILED: Max retries exceeded`);
    throw new Error('Max retries exceeded');
  }

  async getProjects(): Promise<JiraProject[]> {
    return this.request<JiraProject[]>(`${this.baseUrl}/project`);
  }

  async getFields(): Promise<JiraField[]> {
    return this.request<JiraField[]>(`${this.baseUrl}/field`);
  }

  async getBoards(): Promise<JiraBoard[]> {
    const result = await this.request<{ values: JiraBoard[] }>(`${this.agileUrl}/board`);
    return result.values || [];
  }

  async getSprints(boardId: number): Promise<JiraSprint[]> {
    const allSprints: JiraSprint[] = [];
    let startAt = 0;
    const maxResults = 50;

    while (true) {
      const result = await this.request<{
        values: JiraSprint[];
        isLast: boolean;
      }>(`${this.agileUrl}/board/${boardId}/sprint?startAt=${startAt}&maxResults=${maxResults}`);

      allSprints.push(...result.values);

      if (result.isLast || result.values.length < maxResults) {
        break;
      }

      startAt += maxResults;
    }

    return allSprints;
  }

  /**
   * Подсчёт issues по JQL без загрузки данных
   * Использует POST /rest/api/3/search/approximate-count
   */
  async countIssues(jql: string): Promise<number> {
    const url = `${this.baseUrl}/search/approximate-count`;

    const result = await this.request<{
      count: number;
    }>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jql }),
    });

    return result.count;
  }

  async searchIssues(
    jql: string,
    fields: string[] = ['*all'],
    maxResults = 100
  ): Promise<JiraIssue[]> {
    const logger = getLogger();
    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    let totalIssues = 0;

    while (true) {
      // Используем новый API endpoint /search/jql с GET запросом
      const params = new URLSearchParams({
        jql,
        startAt: String(startAt),
        maxResults: String(maxResults),
      });

      // Добавляем поля
      // ВАЖНО: Jira API /search/jql по умолчанию возвращает только IDs
      // Используем '*all' для получения ВСЕХ полей включая кастомные
      if (fields && fields.length > 0) {
        if (fields.includes('*all')) {
          // Используем '*all' для получения всех полей (включая кастомные)
          params.append('fields', '*all');
        } else {
          params.append('fields', fields.join(','));
        }
      }

      const result = await this.request<JiraSearchResult>(`${this.baseUrl}/search/jql?${params}`);

      allIssues.push(...result.issues);

      // /search/jql может возвращать либо total, либо isLast
      if (result.total !== undefined) {
        totalIssues = result.total;
      }

      // Логируем прогресс пагинации если знаем total
      if (totalIssues > 0 && totalIssues > maxResults) {
        const percentage = Math.round((allIssues.length / totalIssues) * 100);
        logger.info(`   📥 Загружено ${allIssues.length}/${totalIssues} багов (${percentage}%)`);
      }

      // Проверяем условие выхода: либо isLast=true, либо загружено >= total
      if (result.isLast === true) {
        logger.debug(`[REQ#${this.requestCount}] Pagination complete: isLast=true`);
        break;
      }

      if (totalIssues > 0 && allIssues.length >= totalIssues) {
        logger.debug(`[REQ#${this.requestCount}] Pagination complete: ${allIssues.length} >= ${totalIssues}`);
        break;
      }

      // Защита от бесконечного цикла: если вернулось 0 issues
      if (result.issues.length === 0) {
        logger.debug(`[REQ#${this.requestCount}] Pagination complete: empty response`);
        break;
      }

      startAt += maxResults;
    }

    return allIssues;
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    return this.request<JiraIssue>(`${this.baseUrl}/issue/${issueKey}`);
  }
}
