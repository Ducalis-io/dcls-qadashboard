import * as fs from 'fs';
import * as path from 'path';

/**
 * Централизованная система логирования
 *
 * Поддерживает:
 * - Разные уровни логов (debug, info, warn, error)
 * - Вывод в консоль и/или файл
 * - Сохранение HTTP респонсов
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  enableDebugLogs: boolean;
  logToFile: boolean;
  logFilePath?: string;
  saveResponses: boolean;
  responsesDir?: string;
}

class Logger {
  private options: LoggerOptions;
  private logStream?: fs.WriteStream;
  private requestCounter = 0;

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = {
      enableDebugLogs: false,
      logToFile: false,
      saveResponses: false,
      ...options,
    };

    // Создаем файл логов если нужно
    if (this.options.logToFile && this.options.logFilePath) {
      const logDir = path.dirname(this.options.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      this.logStream = fs.createWriteStream(this.options.logFilePath, { flags: 'a' });
      this.log('info', `=== Начало сессии логирования ${new Date().toISOString()} ===`);
    }

    // Создаем директорию для респонсов если нужно
    if (this.options.saveResponses && this.options.responsesDir) {
      if (!fs.existsSync(this.options.responsesDir)) {
        fs.mkdirSync(this.options.responsesDir, { recursive: true });
      }
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLogMessage(level: LogLevel, ...args: any[]): string {
    const timestamp = this.formatTimestamp();
    const levelStr = level.toUpperCase().padEnd(5);
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    return `[${timestamp}] ${levelStr} ${message}`;
  }

  log(level: LogLevel, ...args: any[]): void {
    // Пропускаем debug логи если не включены
    if (level === 'debug' && !this.options.enableDebugLogs) {
      return;
    }

    const formattedMessage = this.formatLogMessage(level, ...args);

    // Пишем в файл если включено
    if (this.logStream) {
      this.logStream.write(formattedMessage + '\n');
    }

    // Для консоли используем более краткий формат, если не debug режим
    if (!this.options.logToFile) {
      // Обычный вывод в консоль
      console.log(...args);
    }
  }

  debug(...args: any[]): void {
    this.log('debug', ...args);
  }

  info(...args: any[]): void {
    this.log('info', ...args);
  }

  warn(...args: any[]): void {
    this.log('warn', ...args);
  }

  error(...args: any[]): void {
    this.log('error', ...args);
  }

  /**
   * Логирование HTTP запроса
   */
  logRequest(url: string, method: string = 'GET'): number {
    this.requestCounter++;
    const reqId = this.requestCounter;

    if (this.options.enableDebugLogs) {
      this.debug(`[REQ#${reqId}] ${method} ${url}`);
    } else {
      // В обычном режиме выводим краткую информацию
      const shortUrl = url.split('?')[0].split('/').slice(-3).join('/');
      this.info(`   → Запрос #${reqId}: ${shortUrl}`);
    }

    return reqId;
  }

  /**
   * Логирование HTTP ответа
   */
  logResponse(
    reqId: number,
    status: number,
    statusText: string,
    headers?: Record<string, string>,
    data?: any
  ): void {
    if (this.options.enableDebugLogs) {
      this.debug(`[REQ#${reqId}] Response: ${status} ${statusText}`);
      if (headers) {
        this.debug(`[REQ#${reqId}] Headers:`, JSON.stringify(headers));
      }
    } else {
      // В обычном режиме показываем только статус
      const emoji = status === 200 ? '✓' : status === 429 ? '⏱️' : '✗';
      this.info(`   ${emoji} Ответ #${reqId}: ${status} ${statusText}`);
    }

    // Сохраняем респонс в файл если включено
    if (this.options.saveResponses && this.options.responsesDir && data) {
      this.saveResponse(reqId, status, statusText, headers, data);
    }
  }

  /**
   * Сохранение HTTP респонса в файл
   */
  private saveResponse(
    reqId: number,
    status: number,
    statusText: string,
    headers?: Record<string, string>,
    data?: any
  ): void {
    if (!this.options.responsesDir) return;

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const fileName = `req-${String(reqId).padStart(4, '0')}-${timestamp}.json`;
    const filePath = path.join(this.options.responsesDir, fileName);

    const responseData = {
      requestId: reqId,
      timestamp: new Date().toISOString(),
      status,
      statusText,
      headers: headers || {},
      data,
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(responseData, null, 2));
      this.debug(`   💾 Респонс сохранен: ${fileName}`);
    } catch (error) {
      this.error(`   ❌ Ошибка сохранения респонса: ${error}`);
    }
  }

  /**
   * Логирование периода обработки
   */
  logPeriod(periodNum: number, totalPeriods: number, periodLabel: string): void {
    this.info('');
    this.info(`📊 Период ${periodNum}/${totalPeriods}: ${periodLabel}`);
    this.info('-'.repeat(60));
  }

  /**
   * Логирование JQL запроса
   */
  logJQL(jql: string): void {
    if (this.options.enableDebugLogs) {
      this.debug(`   JQL: ${jql}`);
    } else {
      // Показываем только ключевые части JQL
      const parts = jql.split('AND').map(p => p.trim());

      // Проверяем использование Sprint IN
      const sprintFilter = parts.find(p => p.includes('Sprint IN'));
      if (sprintFilter) {
        // Извлекаем ID спринтов
        const match = sprintFilter.match(/Sprint IN \(([^)]+)\)/);
        if (match) {
          const sprintIds = match[1].split(',');
          this.info(`   Фильтр: Sprint IN (${sprintIds.length} спринтов)`);
        }
      } else {
        // Fallback на даты
        const dateRange = parts.find(p => p.includes('created'));
        if (dateRange) {
          this.info(`   Фильтр: ${dateRange}`);
        }
      }
    }
  }

  /**
   * Логирование результатов поиска
   */
  logSearchResults(issuesCount: number, periodId?: string): void {
    if (issuesCount === 0) {
      this.warn(`   ⚠️  Багов не найдено`);
    } else {
      this.info(`   ✓ Найдено багов: ${issuesCount}`);
    }
  }

  /**
   * Логирование статистики периода
   */
  logPeriodStats(stats: {
    severity?: Array<{ label: string; count: number }>;
    environment?: Array<{ environment: string; count: number }>;
    components?: Array<{ name: string; count: number }>;
  }): void {
    if (this.options.enableDebugLogs) {
      if (stats.severity) {
        this.debug(`   Severity: ${stats.severity.map(s => `${s.label}(${s.count})`).join(', ')}`);
      }
      if (stats.environment) {
        this.debug(`   Environment: ${stats.environment.map(e => `${e.environment}(${e.count})`).join(', ')}`);
      }
      if (stats.components) {
        this.debug(`   Components: ${stats.components.length} уникальных`);
      }
    } else {
      // Показываем только ключевую статистику
      if (stats.severity && stats.severity.length > 0) {
        const top3 = stats.severity.slice(0, 3);
        this.info(`   Severity: ${top3.map(s => `${s.label}:${s.count}`).join(', ')}`);
      }
    }
  }

  /**
   * Логирование задержки
   */
  logDelay(seconds: number, reason?: string): void {
    const reasonText = reason ? ` (${reason})` : '';
    this.info(`   ⏳ Пауза ${seconds} сек${reasonText}...`);
  }

  /**
   * Логирование rate limit
   */
  logRateLimit(attempt: number, maxAttempts: number, waitSeconds: number): void {
    this.warn(`   ⏱️  Rate limit 429 (попытка ${attempt}/${maxAttempts}), ждём ${waitSeconds} сек...`);
  }

  /**
   * Закрытие логгера
   */
  close(): void {
    if (this.logStream) {
      this.log('info', `=== Конец сессии логирования ${new Date().toISOString()} ===`);
      this.logStream.end();
    }
  }
}

// Глобальный экземпляр логгера (будет инициализирован в main скрипте)
let globalLogger: Logger | null = null;

export function initLogger(options: Partial<LoggerOptions>): Logger {
  globalLogger = new Logger(options);
  return globalLogger;
}

export function getLogger(): Logger {
  if (!globalLogger) {
    // Fallback на консольный логгер
    globalLogger = new Logger({ enableDebugLogs: false, logToFile: false });
  }
  return globalLogger;
}

export function closeLogger(): void {
  if (globalLogger) {
    globalLogger.close();
    globalLogger = null;
  }
}
