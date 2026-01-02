#!/usr/bin/env node

/**
 * Скрипт валидации перед сборкой
 * Проверяет, что в local режиме есть реальные данные, а не только заглушки
 */

const fs = require('fs');
const path = require('path');

// Загружаем переменные окружения из .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Определяем источник данных из переменных окружения
const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE || 'local';

console.log('\n🔍 Проверка конфигурации перед сборкой...');
console.log(`📊 Режим данных: ${DATA_SOURCE}\n`);

if (DATA_SOURCE === 'local') {
  const configPath = path.join(__dirname, '../src/data/config.json');

  // Проверяем существование config.json
  if (!fs.existsSync(configPath)) {
    console.error('❌ ОШИБКА: Файл src/data/config.json не найден!');
    console.error('   Запустите: npm run fetch-jira');
    process.exit(1);
  }

  // Читаем и проверяем содержимое config.json
  try {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Проверяем, что это не заглушка (есть периоды)
    if (!configData.periods || configData.periods.length === 0) {
      console.error('❌ ОШИБКА: src/data/config.json содержит только заглушку (нет периодов)!');
      console.error('   Это означает, что данные из Jira еще не были загружены.\n');
      console.error('   Выберите один из вариантов:\n');
      console.error('   1. Загрузите данные из Jira:');
      console.error('      npm run fetch-jira\n');
      console.error('   2. Переключитесь на Cloudflare режим в .env.local:');
      console.error('      NEXT_PUBLIC_DATA_SOURCE=cloudflare');
      console.error('      NEXT_PUBLIC_API_URL=https://your-worker.workers.dev\n');
      process.exit(1);
    }

    // Проверяем наличие файлов периодов
    const periodsDir = path.join(__dirname, '../src/data/periods');
    const missingPeriods = [];

    configData.periods.forEach(period => {
      const periodFile = path.join(periodsDir, `${period.id}.json`);
      if (!fs.existsSync(periodFile)) {
        missingPeriods.push(period.id);
      }
    });

    if (missingPeriods.length > 0) {
      console.error(`❌ ОШИБКА: Отсутствуют файлы периодов: ${missingPeriods.join(', ')}`);
      console.error('   Запустите: npm run fetch-jira');
      process.exit(1);
    }

    console.log(`✅ Найдено периодов: ${configData.periods.length}`);
    console.log(`✅ Проект: ${configData.projectKey}`);
    console.log(`✅ Последнее обновление: ${configData.lastUpdated}\n`);

  } catch (error) {
    console.error('❌ ОШИБКА: Не удалось прочитать src/data/config.json');
    console.error(`   ${error.message}`);
    process.exit(1);
  }

} else if (DATA_SOURCE === 'cloudflare') {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  if (!API_URL) {
    console.error('❌ ОШИБКА: В Cloudflare режиме требуется NEXT_PUBLIC_API_URL');
    console.error('   Добавьте в .env.local:');
    console.error('   NEXT_PUBLIC_API_URL=https://your-worker.workers.dev');
    process.exit(1);
  }

  console.log(`✅ Cloudflare режим настроен`);
  console.log(`✅ API URL: ${API_URL}\n`);

} else {
  console.error(`❌ ОШИБКА: Неизвестный режим данных: ${DATA_SOURCE}`);
  console.error('   Допустимые значения: local, cloudflare');
  process.exit(1);
}

console.log('✅ Валидация пройдена успешно!\n');
