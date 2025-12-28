/**
 * Константы цветов для метрик дашборда
 * Цвета применяются на фронте, а не хранятся в данных
 */

// Цвета для severity
export const SEVERITY_COLORS: Record<string, string> = {
  blocker: 'rgba(220, 38, 127, 0.8)',       // Малиновый
  critical: 'rgba(255, 99, 132, 0.8)',      // Красный
  major: 'rgba(255, 159, 64, 0.8)',         // Оранжевый
  minor: 'rgba(75, 192, 192, 0.8)',         // Бирюзовый
  trivial: 'rgba(201, 203, 207, 0.8)',      // Серый
  low: 'rgba(153, 102, 255, 0.8)',          // Фиолетовый
  medium: 'rgba(255, 205, 86, 0.8)',        // Жёлтый
  high: 'rgba(255, 99, 71, 0.8)',           // Томатный
  'not prioritized': 'rgba(169, 169, 169, 0.8)', // Тёмно-серый
  unknown: 'rgba(128, 128, 128, 0.8)',
};

// Цвета для окружения
export const ENVIRONMENT_COLORS: Record<string, string> = {
  prod: 'rgba(255, 99, 132, 0.8)',           // Красный
  production: 'rgba(255, 99, 132, 0.8)',     // Красный
  stage: 'rgba(75, 192, 192, 0.8)',          // Бирюзовый
  staging: 'rgba(75, 192, 192, 0.8)',        // Бирюзовый
  dev: 'rgba(54, 162, 235, 0.8)',            // Синий
  development: 'rgba(54, 162, 235, 0.8)',    // Синий
  test: 'rgba(255, 205, 86, 0.8)',           // Жёлтый
  testing: 'rgba(255, 205, 86, 0.8)',        // Жёлтый
  qa: 'rgba(153, 102, 255, 0.8)',            // Фиолетовый
  uat: 'rgba(255, 159, 64, 0.8)',            // Оранжевый
  preprod: 'rgba(255, 99, 71, 0.8)',         // Томатный
  local: 'rgba(201, 203, 207, 0.8)',         // Серый
  unknown: 'rgba(128, 128, 128, 0.8)',
};

// Цвета для причин багов
export const BUG_REASON_COLORS: Record<string, string> = {
  'специфический/редкий кейс': 'rgba(54, 162, 235, 0.8)',      // Синий
  'недоработка в требованиях': 'rgba(255, 99, 132, 0.8)',      // Красный
  'недоработка требований': 'rgba(255, 99, 132, 0.8)',         // Красный (альтернатива)
  'кейс не был предусмотрен': 'rgba(75, 192, 192, 0.8)',       // Бирюзовый
  'не предусмотрен тест-кейс': 'rgba(75, 192, 192, 0.8)',      // Бирюзовый (альтернатива)
  'не проверялось на регрессе': 'rgba(255, 159, 64, 0.8)',     // Оранжевый
  'сломалось при мерже': 'rgba(153, 102, 255, 0.8)',           // Фиолетовый
  'ошибка в коде': 'rgba(255, 205, 86, 0.8)',                  // Жёлтый
  'проблема окружения': 'rgba(255, 99, 71, 0.8)',              // Томатный
  'проблема данных': 'rgba(220, 38, 127, 0.8)',                // Малиновый
  'некорректная логика': 'rgba(100, 149, 237, 0.8)',           // Васильковый
  другое: 'rgba(201, 203, 207, 0.8)',                          // Серый
  unknown: 'rgba(128, 128, 128, 0.8)',
};

// Цвета для трекеров
export const TRACKER_COLORS: Record<string, string> = {
  Jira: 'rgba(54, 162, 235, 0.8)',
  GitHub: 'rgba(255, 99, 132, 0.8)',
  Linear: 'rgba(75, 192, 192, 0.8)',
  Asana: 'rgba(255, 159, 64, 0.8)',
  YouTrack: 'rgba(153, 102, 255, 0.8)',
  unknown: 'rgba(128, 128, 128, 0.8)',
};

// Цвета для статусов
export const RESOLUTION_COLORS: Record<string, string> = {
  Done: 'rgba(75, 192, 192, 0.8)',           // Бирюзовый (успех)
  'To Do': 'rgba(255, 159, 64, 0.8)',        // Оранжевый
  'In Progress': 'rgba(54, 162, 235, 0.8)',  // Синий
  Open: 'rgba(255, 205, 86, 0.8)',           // Жёлтый
  Backlog: 'rgba(201, 203, 207, 0.8)',       // Серый
  'Ready for Test': 'rgba(153, 102, 255, 0.8)', // Фиолетовый
  RFT: 'rgba(153, 102, 255, 0.8)',           // Фиолетовый
  Testing: 'rgba(100, 149, 237, 0.8)',       // Васильковый
  Blocked: 'rgba(255, 99, 71, 0.8)',         // Томатный
  Closed: 'rgba(34, 139, 34, 0.8)',          // Зелёный
  unknown: 'rgba(128, 128, 128, 0.8)',
};

// Дефолтный цвет для компонентов
export const DEFAULT_COMPONENT_COLOR = 'rgba(54, 162, 235, 0.8)';

/**
 * Генерирует уникальный цвет на основе строки (хеш)
 * Использует HSL для гарантированно различимых цветов
 */
export function generateColorFromString(str: string): string {
  // Простой хеш строки
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Генерируем HSL цвет с фиксированной насыщенностью и яркостью
  const hue = Math.abs(hash) % 360;
  const saturation = 65 + (Math.abs(hash >> 8) % 10);
  const lightness = 55 + (Math.abs(hash >> 16) % 10);

  return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`;
}

/**
 * Получить цвет для severity
 */
export function getSeverityColor(label: string): string {
  return SEVERITY_COLORS[label.toLowerCase()] || SEVERITY_COLORS.unknown;
}

/**
 * Получить цвет для environment
 */
export function getEnvironmentColor(env: string): string {
  return ENVIRONMENT_COLORS[env.toLowerCase()] || ENVIRONMENT_COLORS.unknown;
}

/**
 * Получить цвет для resolution/status
 */
export function getResolutionColor(status: string): string {
  return RESOLUTION_COLORS[status] || RESOLUTION_COLORS.unknown;
}

/**
 * Получить цвет для причины бага
 * Если причина есть в словаре - возвращает заданный цвет
 * Иначе генерирует уникальный цвет на основе названия
 */
export function getReasonColor(reason: string): string {
  return BUG_REASON_COLORS[reason] || generateColorFromString(reason);
}

/**
 * Получить цвет для трекера
 */
export function getTrackerColor(name: string): string {
  return TRACKER_COLORS[name] || TRACKER_COLORS.unknown;
}

/**
 * Вычислить процент
 */
export function calculatePercentage(count: number, total: number): number {
  return total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0;
}
