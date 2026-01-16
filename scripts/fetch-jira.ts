/**
 * Скрипт сбора данных из Jira
 * Запуск: npm run fetch-jira [--logs] [--resp]
 *
 * Опции:
 *   --logs  Записывать детальные логи в файл logs/fetch-jira.log
 *   --resp  Сохранять HTTP респонсы в папку logs/responses/
 *
 * Собирает баги из Jira, группирует по периодам (по спринтам)
 * и сохраняет в src/data/ для использования в дашборде
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { JiraClient } from './jira/client';
import { getJiraConfigFromEnv, createPeriodsFromSprints } from './jira/config';
import { getBugsForPeriodJQL, getOpenBugsAtDateJQL, getBugsInDateRangeJQL } from './jira/queries';
import { transformBugsToMetrics, extractSprintData, extractComponentsAndReasons } from './jira/transformers';
import type { PeriodConfig, DashboardConfig, PeriodData, SprintBugData, JiraSprint, SectionVisibility } from './jira/types';
import { initLogger, getLogger, closeLogger } from './jira/logger';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

const DATA_DIR = path.join(__dirname, '../src/data');
const PERIODS_DIR = path.join(DATA_DIR, 'periods');
const LOGS_DIR = path.join(__dirname, '../logs');

// Парсим аргументы командной строки
const args = process.argv.slice(2);
const enableLogs = args.includes('--logs');
const enableResp = args.includes('--resp');

/**
 * Собирает данные о багах в бэклоге для каждого закрытого спринта
 */
async function collectSprintBacklogData(
  client: JiraClient,
  boardId: number,
  projectKey: string,
  maxSprints: number = 50
): Promise<SprintBugData[]> {
  const logger = getLogger();

  logger.info('');
  logger.info('📊 Сбор данных спринтов для графика бэклога...');

  // 1. Получаем все закрытые спринты
  logger.info(`   🔍 Загрузка спринтов с доски ${boardId}...`);
  const allSprints = await client.getSprints(boardId);
  const closedSprints = allSprints
    .filter((s) => s.state === 'closed' && s.completeDate)
    .sort((a, b) => (a.completeDate || '').localeCompare(b.completeDate || ''));

  // Берём только последние N спринтов
  const sprints = closedSprints.slice(-maxSprints);
  logger.info(`   Найдено ${closedSprints.length} закрытых спринтов, используем последние ${sprints.length}`);

  const sprintData: SprintBugData[] = [];

  // 2. Для каждого спринта считаем баги в бэклоге на дату завершения
  for (let i = 0; i < sprints.length; i++) {
    const sprint = sprints[i];
    const completeDateStr = sprint.completeDate!.split('T')[0]; // YYYY-MM-DD

    // Задержка между запросами (кроме первого)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // JQL для подсчета открытых багов на дату завершения спринта
    const jql = getOpenBugsAtDateJQL(projectKey, completeDateStr);

    try {
      // Используем countIssues - быстрый метод без загрузки данных
      // Делает один запрос и возвращает только total
      const backlogCount = await client.countIssues(jql);

      sprintData.push({
        sprint: sprint.name,
        // sprintId removed - not used on frontend
        startDate: sprint.startDate?.split('T')[0] || '',
        endDate: sprint.endDate?.split('T')[0] || '',
        backlogBugs: backlogCount,
      });

      const progressPercent = Math.round(((i + 1) / sprints.length) * 100);
      logger.info(`   ✓ ${sprint.name}: ${backlogCount} открытых багов (${i + 1}/${sprints.length}, ${progressPercent}%)`);

    } catch (error) {
      logger.error(`   ✗ Ошибка при обработке ${sprint.name}: ${error}`);
    }
  }

  logger.info(`   ✅ Собрано данных для ${sprintData.length} спринтов`);

  return sprintData;
}

async function main() {
  // Очистка старых данных перед запуском
  const logFilePath = enableLogs ? path.join(LOGS_DIR, 'fetch-jira.log') : undefined;
  const responsesDir = enableResp ? path.join(LOGS_DIR, 'responses') : undefined;

  // Удаляем старый лог файл
  if (logFilePath && fs.existsSync(logFilePath)) {
    fs.unlinkSync(logFilePath);
  }

  // Очищаем директорию с responses
  if (responsesDir && fs.existsSync(responsesDir)) {
    const files = fs.readdirSync(responsesDir);
    files.forEach(file => {
      fs.unlinkSync(path.join(responsesDir, file));
    });
  }

  // Очищаем старые файлы периодов
  if (fs.existsSync(PERIODS_DIR)) {
    const files = fs.readdirSync(PERIODS_DIR);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(PERIODS_DIR, file));
      }
    });
  }

  initLogger({
    enableDebugLogs: enableLogs,
    logToFile: enableLogs,
    logFilePath,
    saveResponses: enableResp,
    responsesDir,
  });

  const logger = getLogger();

  console.log('='.repeat(60));
  console.log('JIRA DATA FETCH');
  console.log('='.repeat(60));
  console.log('');

  if (enableLogs) {
    console.log(`📝 Детальные логи: ${logFilePath}`);
  }
  if (enableResp) {
    console.log(`💾 HTTP респонсы: ${responsesDir}`);
  }
  if (enableLogs || enableResp) {
    console.log('');
  }

  // Получаем конфигурацию
  const config = getJiraConfigFromEnv();

  if (!config.host || !config.email || !config.apiToken || !config.projectKey) {
    logger.error('❌ Ошибка: Не заданы обязательные переменные окружения');
    logger.error('');
    logger.error('Убедитесь, что в .env.local указаны:');
    logger.error('  JIRA_HOST');
    logger.error('  JIRA_EMAIL');
    logger.error('  JIRA_API_TOKEN');
    logger.error('  JIRA_PROJECT_KEY');
    logger.error('');
    logger.error('Запустите npm run discover-jira для получения этих данных');
    closeLogger();
    process.exit(1);
  }

  logger.info(`🔗 Jira Host: ${config.host}`);
  logger.info(`📁 Project: ${config.projectKey}`);
  logger.info(`⚙️  Severity Field: ${config.severityField}`);
  logger.info(`⚙️  Bug Reason Field: ${config.bugReasonField}`);
  logger.info(`⚙️  Environment Field: ${config.environmentField}`);
  logger.info(`⚙️  Component Field: ${config.componentField || '(стандартное поле components)'}`);
  logger.info(`📊 Спринтов на период: ${config.sprintsPerPeriod}`);
  logger.info(`📊 Максимум спринтов: ${config.maxSprints}`);
  logger.info('');

  // Создаем клиент
  const client = new JiraClient({
    host: config.host,
    email: config.email,
    apiToken: config.apiToken,
  });

  // Создаем директории если не существуют
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PERIODS_DIR)) {
    fs.mkdirSync(PERIODS_DIR, { recursive: true });
  }

  let periods: PeriodConfig[] = [];

  // Если указан Board ID, создаем периоды на основе спринтов
  if (config.boardId) {
    logger.info(`📋 Получение спринтов с доски ${config.boardId}...`);
    try {
      const sprints = await client.getSprints(config.boardId);
      const allClosedSprints = sprints
        .filter((s) => s.state === 'closed' && s.startDate && s.endDate)
        .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));

      logger.info(`   Найдено ${allClosedSprints.length} закрытых спринтов`);

      // Берём только последние N спринтов (самые свежие)
      const closedSprints = allClosedSprints.slice(-config.maxSprints);
      logger.info(`   Используем последние ${closedSprints.length} спринтов`);

      periods = createPeriodsFromSprints(closedSprints, config.sprintsPerPeriod);
      logger.info(`   Создано ${periods.length} периодов`);
    } catch (error) {
      logger.error(`   ❌ Ошибка получения спринтов: ${error}`);
      logger.error('   Используйте ручную настройку периодов в коде');
      closeLogger();
      process.exit(1);
    }
  } else {
    logger.warn('⚠️  Board ID не указан, используйте JIRA_BOARD_ID в .env.local');
    logger.warn('   Запустите npm run discover-jira для получения Board ID');
    closeLogger();
    process.exit(1);
  }

  const allComponents = new Set<string>();
  const periodStats: Array<{ period: string; bugs: number; time: number }> = [];
  const overallStartTime = Date.now();

  // Обрабатываем каждый период
  for (let i = 0; i < periods.length; i++) {
    const periodStartTime = Date.now();
    const period = periods[i];
    logger.logPeriod(i + 1, periods.length, period.label);

    // Показываем спринты, которые будут обработаны
    if (period.sprintNames && period.sprintNames.length > 0) {
      logger.info(`   🏃 Спринты: ${period.sprintNames.join(', ')}`);
    } else if (period.sprintIds && period.sprintIds.length > 0) {
      logger.info(`   🏃 Спринты (ID): ${period.sprintIds.join(', ')}`);
    }

    const jql = getBugsForPeriodJQL(config.projectKey, period);
    logger.logJQL(jql);

    // Задержка между запросами для избежания rate limit
    if (i > 0) {
      logger.logDelay(5, 'между периодами');
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 секунд
    }

    logger.info(`   🔍 Загрузка багов из Jira...`);
    const startTime = Date.now();
    const issues = await client.searchIssues(jql);
    const loadTime = ((Date.now() - startTime) / 1000).toFixed(1);

    logger.logSearchResults(issues.length, period.id);
    logger.info(`   ⏱️  Время загрузки: ${loadTime}s`);

    if (issues.length === 0) {
      logger.warn(`   ⚠️  Период пропущен (нет багов)`);
      continue;
    }

    // Трансформируем данные бэклога спринтов
    logger.info(`   🔄 Обработка ${issues.length} багов бэклога...`);
    const transformStart = Date.now();
    const metrics = transformBugsToMetrics(issues, config.severityField, config.bugReasonField, config.environmentField, config.componentField);
    const transformTime = ((Date.now() - transformStart) / 1000).toFixed(1);
    logger.info(`   ✓ Обработка бэклога завершена за ${transformTime}s`);

    // Собираем все компоненты (из бэклога)
    metrics.components.forEach((c) => allComponents.add(c.name));

    // === ВТОРОЙ ЗАПРОС: Баги созданные в период (для компонентов и причин) ===
    logger.info(`   🔍 Загрузка багов, созданных в период ${period.startDate} - ${period.endDate}...`);

    // Задержка между запросами
    await new Promise(resolve => setTimeout(resolve, 2000));

    const createdJQL = getBugsInDateRangeJQL(config.projectKey, period.startDate, period.endDate);
    logger.logJQL(createdJQL);

    const createdStartTime = Date.now();
    const createdIssues = await client.searchIssues(createdJQL);
    const createdLoadTime = ((Date.now() - createdStartTime) / 1000).toFixed(1);

    logger.info(`   ✓ Найдено ${createdIssues.length} багов созданных в период (${createdLoadTime}s)`);

    // Извлекаем компоненты, причины и rawBugs из багов созданных в период
    const createdMetrics = extractComponentsAndReasons(
      createdIssues,
      config.bugReasonField,
      config.componentField,
      config.environmentField
    );

    // Собираем все компоненты (из созданных)
    createdMetrics.components.forEach((c) => allComponents.add(c.name));

    logger.info(`   📊 Компоненты (созданные): ${createdMetrics.components.length} категорий`);
    logger.info(`   📊 Причины (созданные): ${createdMetrics.reasons.length} категорий`);
    logger.info(`   📊 Raw bugs (созданные): ${createdMetrics.rawBugs.length} записей`);

    // Сохраняем данные периода
    const periodData: PeriodData = {
      periodId: period.id,
      startDate: period.startDate,
      endDate: period.endDate,
      generatedAt: new Date().toISOString(),
      ...metrics,
      // Добавляем данные по багам, созданным в период
      totalBugsCreated: createdMetrics.total,
      componentsCreated: createdMetrics.components,
      reasonsCreated: createdMetrics.reasons,
      rawBugsCreated: createdMetrics.rawBugs,
    };

    const periodFilePath = path.join(PERIODS_DIR, `${period.id}.json`);
    fs.writeFileSync(periodFilePath, JSON.stringify(periodData, null, 2));
    logger.info(`   ✅ Сохранено в ${periodFilePath}`);

    // Выводим краткую статистику
    logger.logPeriodStats({
      severity: metrics.severity,
      environment: metrics.environment,
      components: metrics.components,
    });

    // Собираем статистику периода
    const periodTime = (Date.now() - periodStartTime) / 1000;
    periodStats.push({
      period: period.label,
      bugs: issues.length,
      time: periodTime,
    });

    // Показываем общий прогресс и оценку времени
    const completedPeriods = i + 1;
    const totalPeriods = periods.length;
    const progressPercent = Math.round((completedPeriods / totalPeriods) * 100);
    const avgTimePerPeriod = periodStats.reduce((sum, s) => sum + s.time, 0) / periodStats.length;
    const remainingPeriods = totalPeriods - completedPeriods;
    const estimatedRemainingTime = Math.round(avgTimePerPeriod * remainingPeriods);

    logger.info('');
    logger.info(`   📊 Общий прогресс: ${completedPeriods}/${totalPeriods} периодов (${progressPercent}%)`);

    if (remainingPeriods > 0) {
      const mins = Math.floor(estimatedRemainingTime / 60);
      const secs = estimatedRemainingTime % 60;
      const timeStr = mins > 0 ? `~${mins}м ${secs}с` : `~${secs}с`;
      logger.info(`   ⏳ Осталось ~${remainingPeriods} периодов, примерное время: ${timeStr}`);
    }
  }

  // Собираем данные спринтов для графика бэклога
  let sprintBacklogData: SprintBugData[] = [];
  if (config.boardId) {
    try {
      // Используем параметр из окружения или дефолт 50
      const sprintAnalysisCount = parseInt(process.env.SPRINT_ANALYSIS_COUNT || '50');
      sprintBacklogData = await collectSprintBacklogData(
        client,
        config.boardId,
        config.projectKey,
        sprintAnalysisCount
      );
    } catch (error) {
      logger.error(`❌ Ошибка при сборе данных спринтов: ${error}`);
      logger.warn('   График спринтов будет пуст');
    }
  }

  // Сохраняем конфигурацию дашборда
  logger.info('');
  logger.info('💾 Сохранение конфигурации дашборда...');

  // Читаем ENV флаги видимости секций (по умолчанию все включены)
  const parseVisibilityFlag = (envVar: string | undefined): boolean => {
    if (envVar === undefined || envVar === '') return true;
    return envVar !== '0' && envVar.toLowerCase() !== 'false';
  };

  const visibility: SectionVisibility = {
    sprintBacklog: parseVisibilityFlag(process.env.SHOW_SPRINT_BACKLOG),
    environment: parseVisibilityFlag(process.env.SHOW_ENVIRONMENT),
    resolution: parseVisibilityFlag(process.env.SHOW_RESOLUTION),
    priority: parseVisibilityFlag(process.env.SHOW_PRIORITY),
    components: parseVisibilityFlag(process.env.SHOW_COMPONENTS),
    trackers: parseVisibilityFlag(process.env.SHOW_TRACKERS || '0'),
    reasons: parseVisibilityFlag(process.env.SHOW_REASONS),
    testCoverage: parseVisibilityFlag(process.env.SHOW_TEST_COVERAGE || '0'),
  };

  logger.info('👁️  Видимость секций:');
  Object.entries(visibility).forEach(([key, value]) => {
    logger.info(`   ${key}: ${value ? '✓' : '✗'}`);
  });

  const dashboardConfig: DashboardConfig = {
    lastUpdated: new Date().toISOString(),
    // jiraHost removed - sensitive info, not used on frontend
    projectKey: config.projectKey,
    sprintsPerPeriod: config.sprintsPerPeriod,
    totalSprintsAnalyzed: config.maxSprints,
    periods: periods.map((p) => ({
      id: p.id,
      label: p.label,
      startDate: p.startDate,
      endDate: p.endDate,
      dataFile: `${p.id}.json`,
    })),
    components: Array.from(allComponents).sort(),
    sprints: sprintBacklogData,
    visibility,
  };

  fs.writeFileSync(path.join(DATA_DIR, 'config.json'), JSON.stringify(dashboardConfig, null, 2));

  const totalTime = Math.round((Date.now() - overallStartTime) / 1000);
  const totalBugs = periodStats.reduce((sum, s) => sum + s.bugs, 0);

  logger.info('');
  logger.info('='.repeat(60));
  logger.info('✅ ГОТОВО!');
  logger.info('='.repeat(60));
  logger.info('');
  logger.info(`📊 Собрано периодов: ${periods.length}`);
  logger.info(`🐛 Всего багов: ${totalBugs}`);
  logger.info(`🏷️  Компонентов: ${allComponents.size}`);
  logger.info(`📈 Спринтов с данными бэклога: ${sprintBacklogData.length}`);
  logger.info(`⏱️  Общее время: ${Math.floor(totalTime / 60)}м ${totalTime % 60}с`);
  logger.info('');
  logger.info('📈 Статистика по периодам:');
  periodStats.forEach((stat, idx) => {
    logger.info(`   ${idx + 1}. ${stat.period}: ${stat.bugs} багов (${Math.round(stat.time)}s)`);
  });
  logger.info('');
  logger.info('Следующие шаги:');
  logger.info('  1. npm run dev - запустить дашборд локально');
  logger.info('  2. npm run build - собрать для продакшена');
  logger.info('  3. git add src/data/ && git commit && git push - задеплоить');
  logger.info('');

  // Закрываем логгер
  closeLogger();
}

main().catch((error) => {
  const logger = getLogger();
  logger.error('');
  logger.error('❌ ОШИБКА:');
  logger.error(error);
  closeLogger();
  process.exit(1);
});
