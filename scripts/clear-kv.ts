/**
 * Скрипт очистки Cloudflare KV хранилища
 * Запуск: npm run clear-kv
 *
 * Удаляет все ключи из KV namespace.
 * Требует подтверждения перед выполнением.
 */

import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

const KV_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Запрашивает подтверждение у пользователя
 */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${message} (y/N): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Получает список всех ключей в KV
 */
function listKeys(): string[] {
  try {
    const output = execSync(
      `npx wrangler kv:key list --namespace-id="${KV_NAMESPACE_ID}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const keys = JSON.parse(output);
    return keys.map((k: { name: string }) => k.name);
  } catch (error) {
    log('Ошибка получения списка ключей', colors.red);
    return [];
  }
}

/**
 * Удаляет ключ из KV
 */
function deleteKey(key: string): boolean {
  try {
    execSync(
      `npx wrangler kv:key delete --namespace-id="${KV_NAMESPACE_ID}" "${key}"`,
      { stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

async function main() {
  log('\n========================================', colors.cyan);
  log('  Clear Cloudflare KV', colors.cyan);
  log('========================================\n', colors.cyan);

  // Проверка переменных окружения
  if (!KV_NAMESPACE_ID) {
    log('CLOUDFLARE_KV_NAMESPACE_ID не установлен в .env.local', colors.red);
    process.exit(1);
  }

  // Получаем список ключей
  log('Получение списка ключей...', colors.cyan);
  const keys = listKeys();

  if (keys.length === 0) {
    log('\nХранилище уже пустое.', colors.green);
    return;
  }

  log(`\nНайдено ключей: ${keys.length}`, colors.yellow);
  keys.forEach((key) => log(`  - ${key}`));

  // Запрашиваем подтверждение
  const confirmed = await confirm(`\nУдалить все ${keys.length} ключей?`);

  if (!confirmed) {
    log('\nОтменено.', colors.yellow);
    return;
  }

  // Удаляем ключи
  log('\nУдаление...', colors.cyan);
  let deleted = 0;
  let failed = 0;

  for (const key of keys) {
    process.stdout.write(`  ${key}... `);
    if (deleteKey(key)) {
      console.log('OK');
      deleted++;
    } else {
      console.log('FAILED');
      failed++;
    }
  }

  // Итог
  log('\n========================================', colors.green);
  log(`  Удалено: ${deleted}, ошибок: ${failed}`, deleted === keys.length ? colors.green : colors.yellow);
  log('========================================\n', colors.green);
}

main().catch(console.error);
