/**
 * Скрипт деплоя данных в Cloudflare KV
 * Запуск: npm run deploy-data [--from-local] [--from-jira]
 *
 * Опции:
 *   --from-local  Загрузить данные из src/data (по умолчанию)
 *   --from-jira   Сначала собрать данные из Jira, потом загрузить в KV
 *
 * Требует настроенные переменные окружения:
 *   CLOUDFLARE_API_TOKEN
 *   CLOUDFLARE_ACCOUNT_ID
 */

import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

const DATA_DIR = path.join(__dirname, '../src/data');
const PERIODS_DIR = path.join(DATA_DIR, 'periods');

// Парсим аргументы командной строки
const args = process.argv.slice(2);
const fromJira = args.includes('--from-jira');
const fromLocal = args.includes('--from-local') || !fromJira; // по умолчанию --from-local

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step: string) {
  log(`\n${step}`, colors.cyan);
}

function logSuccess(message: string) {
  log(`   ${message}`, colors.green);
}

function logError(message: string) {
  log(`   ${message}`, colors.red);
}

/**
 * Проверяет наличие необходимых переменных окружения
 */
function checkEnvironment(): boolean {
  const required = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_KV_NAMESPACE_ID'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logError(`Отсутствуют переменные окружения: ${missing.join(', ')}`);
    logError('Добавьте их в .env.local');
    return false;
  }

  return true;
}

// KV Namespace ID из переменной окружения
const KV_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

/**
 * Проверяет установлен ли wrangler
 */
function checkWrangler(): boolean {
  try {
    execSync('npx wrangler --version', { stdio: 'pipe' });
    return true;
  } catch {
    logError('Wrangler не установлен. Запустите: npm install');
    return false;
  }
}

/**
 * Запускает fetch-jira для сбора данных
 */
function runFetchJira(): boolean {
  logStep('Сбор данных из Jira...');

  try {
    const result = spawnSync('npx', ['tsx', 'scripts/fetch-jira.ts'], {
      stdio: 'inherit',
      shell: true,
    });

    if (result.status !== 0) {
      logError('Ошибка при сборе данных из Jira');
      return false;
    }

    logSuccess('Данные из Jira собраны');
    return true;
  } catch (error) {
    logError(`Ошибка: ${error}`);
    return false;
  }
}

/**
 * Загружает один файл в KV
 */
function uploadToKV(key: string, filePath: string): boolean {
  try {
    // Используем wrangler kv:key put с namespace-id из переменной окружения
    const cmd = `npx wrangler kv:key put --namespace-id="${KV_NAMESPACE_ID}" "${key}" --path="${filePath}"`;
    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`Ошибка загрузки ${key}: ${errorMessage}`);
    return false;
  }
}

/**
 * Загружает все данные из src/data в KV
 */
async function uploadAllData(): Promise<boolean> {
  logStep('Загрузка данных в Cloudflare KV...');

  let success = true;
  let uploaded = 0;
  let failed = 0;

  // 1. Загружаем config.json
  const configPath = path.join(DATA_DIR, 'config.json');
  if (fs.existsSync(configPath)) {
    process.stdout.write('   config... ');
    if (uploadToKV('config', configPath)) {
      console.log('OK');
      uploaded++;
    } else {
      console.log('FAILED');
      failed++;
      success = false;
    }
  } else {
    logError('config.json не найден');
    return false;
  }

  // 2. Загружаем все period файлы
  if (!fs.existsSync(PERIODS_DIR)) {
    logError(`Папка ${PERIODS_DIR} не найдена`);
    return false;
  }

  const periodFiles = fs.readdirSync(PERIODS_DIR).filter((f) => f.endsWith('.json'));

  if (periodFiles.length === 0) {
    logError('Файлы периодов не найдены');
    return false;
  }

  for (const file of periodFiles) {
    const periodId = file.replace('.json', '');
    const filePath = path.join(PERIODS_DIR, file);
    const key = `periods/${periodId}`;

    process.stdout.write(`   ${key}... `);
    if (uploadToKV(key, filePath)) {
      console.log('OK');
      uploaded++;
    } else {
      console.log('FAILED');
      failed++;
      success = false;
    }
  }

  // Итог
  log('');
  if (success) {
    logSuccess(`Загружено файлов: ${uploaded}`);
  } else {
    logError(`Загружено: ${uploaded}, ошибок: ${failed}`);
  }

  return success;
}

/**
 * Главная функция
 */
async function main() {
  log('\n========================================', colors.bright);
  log('  Deploy to Cloudflare KV', colors.bright);
  log('========================================', colors.bright);

  // Показываем режим работы
  if (fromJira) {
    log('\nРежим: --from-jira (сбор из Jira + загрузка в KV)', colors.yellow);
  } else {
    log('\nРежим: --from-local (загрузка из src/data)', colors.yellow);
  }

  // Проверки
  logStep('Проверка окружения...');

  if (!checkEnvironment()) {
    process.exit(1);
  }
  logSuccess('Переменные окружения OK');

  if (!checkWrangler()) {
    process.exit(1);
  }
  logSuccess('Wrangler OK');

  // Если --from-jira, сначала собираем данные
  if (fromJira) {
    if (!runFetchJira()) {
      process.exit(1);
    }
  }

  // Загружаем данные в KV
  const success = await uploadAllData();

  if (success) {
    log('\n========================================', colors.green);
    log('  Деплой завершён успешно!', colors.green);
    log('========================================\n', colors.green);
  } else {
    log('\n========================================', colors.red);
    log('  Деплой завершён с ошибками', colors.red);
    log('========================================\n', colors.red);
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Критическая ошибка: ${error}`);
  process.exit(1);
});
