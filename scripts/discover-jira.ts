/**
 * Скрипт обнаружения параметров Jira
 * Запуск: npx tsx scripts/discover-jira.ts
 *
 * Находит:
 * - Проекты и их ключи
 * - Кастомные поля (Severity, причина бага и т.д.)
 * - Доски и спринты
 */

import * as dotenv from 'dotenv';
import { JiraClient } from './jira/client';
import type { JiraConfig } from './jira/types';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('='.repeat(60));
  console.log('JIRA DISCOVERY TOOL');
  console.log('='.repeat(60));
  console.log('');

  // Проверяем переменные окружения
  const config: JiraConfig = {
    host: process.env.JIRA_HOST || '',
    email: process.env.JIRA_EMAIL || '',
    apiToken: process.env.JIRA_API_TOKEN || '',
  };

  if (!config.host || !config.email || !config.apiToken) {
    console.error('❌ Ошибка: Не заданы переменные окружения');
    console.error('');
    console.error('Создайте файл .env.local со следующим содержимым:');
    console.error('');
    console.error('  JIRA_HOST=https://your-domain.atlassian.net');
    console.error('  JIRA_EMAIL=your-email@example.com');
    console.error('  JIRA_API_TOKEN=your-api-token');
    console.error('');
    process.exit(1);
  }

  console.log(`🔗 Jira Host: ${config.host}`);
  console.log(`📧 Email: ${config.email}`);
  console.log('');

  const client = new JiraClient(config);

  // 1. Получаем проекты
  console.log('📁 ПРОЕКТЫ');
  console.log('-'.repeat(40));
  try {
    const projects = await client.getProjects();
    if (projects.length === 0) {
      console.log('  (нет доступных проектов)');
    } else {
      projects.forEach((p) => {
        console.log(`  ${p.key.padEnd(12)} - ${p.name}`);
      });
    }
  } catch (error) {
    console.error(`  ❌ Ошибка получения проектов: ${error}`);
  }
  console.log('');

  // 2. Получаем кастомные поля
  console.log('🏷️  КАСТОМНЫЕ ПОЛЯ');
  console.log('-'.repeat(40));
  try {
    const fields = await client.getFields();
    const customFields = fields.filter((f) => f.custom);

    // Ищем важные поля
    const importantKeywords = ['severity', 'серьезность', 'причина', 'reason', 'root cause', 'environment', 'окружение', 'среда'];

    const relevantFields = customFields.filter((f) =>
      importantKeywords.some((kw) => f.name.toLowerCase().includes(kw))
    );

    if (relevantFields.length > 0) {
      console.log('  Релевантные поля:');
      relevantFields.forEach((f) => {
        console.log(`    ${f.id.padEnd(20)} - ${f.name}`);
      });
      console.log('');
    }

    console.log(`  Всего кастомных полей: ${customFields.length}`);
    console.log('  Все поля:');
    customFields.forEach((f) => {
      console.log(`    ${f.id.padEnd(20)} - ${f.name}`);
    });
  } catch (error) {
    console.error(`  ❌ Ошибка получения полей: ${error}`);
  }
  console.log('');

  // 3. Получаем доски
  console.log('📋 ДОСКИ (BOARDS)');
  console.log('-'.repeat(40));
  try {
    const boards = await client.getBoards();
    if (boards.length === 0) {
      console.log('  (нет доступных досок)');
    } else {
      for (const board of boards) {
        console.log(`  ID: ${String(board.id).padEnd(6)} - ${board.name} (${board.type})`);
        if (board.location) {
          console.log(`         Проект: ${board.location.projectKey}`);
        }

        // Получаем спринты для каждой доски
        try {
          const sprints = await client.getSprints(board.id);
          const activeSprints = sprints.filter((s) => s.state === 'active');
          const closedSprints = sprints.filter((s) => s.state === 'closed');
          const futureSprints = sprints.filter((s) => s.state === 'future');

          console.log(
            `         Спринты: ${sprints.length} всего (active: ${activeSprints.length}, closed: ${closedSprints.length}, future: ${futureSprints.length})`
          );

          if (activeSprints.length > 0) {
            console.log(`         Активный: ${activeSprints[0].name}`);
          }

          // Показываем последние 5 закрытых спринтов
          if (closedSprints.length > 0) {
            const lastClosed = closedSprints.slice(-5);
            console.log('         Последние закрытые:');
            lastClosed.forEach((s) => {
              const dates = s.startDate && s.endDate
                ? ` (${s.startDate.split('T')[0]} - ${s.endDate.split('T')[0]})`
                : '';
              console.log(`           - ${s.name}${dates}`);
            });
          }
        } catch {
          console.log('         ⚠️ Не удалось получить спринты');
        }
        console.log('');
      }
    }
  } catch (error) {
    console.error(`  ❌ Ошибка получения досок: ${error}`);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('СЛЕДУЮЩИЕ ШАГИ');
  console.log('='.repeat(60));
  console.log('');
  console.log('1. Скопируйте нужный Project Key в .env.local:');
  console.log('   JIRA_PROJECT_KEY=YOUR_KEY');
  console.log('');
  console.log('2. Запишите ID кастомного поля Severity:');
  console.log('   (например: customfield_10001)');
  console.log('');
  console.log('3. Запишите ID Board для получения спринтов');
  console.log('');
  console.log('4. Запустите npm run fetch-jira для сбора данных');
  console.log('');
}

main().catch(console.error);
