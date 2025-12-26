# QA Dashboard

Дашборд для анализа багов и контроля качества. Собирает данные из Jira и отображает метрики в виде графиков и таблиц.

## Технологии

- **Next.js 15** (App Router, Static Export)
- **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS 4**
- **Chart.js** + react-chartjs-2
- **Zod** для валидации данных
- **Jira REST API** для сбора данных

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env.local
# Отредактируйте .env.local с вашими Jira credentials

# Сбор данных из Jira
npm run fetch-jira

# Запуск в режиме разработки
npm run dev
```

Приложение будет доступно по адресу http://localhost:3000

## Структура проекта

```
dcls-qadashboard/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Главная страница дашборда
│   │   └── layout.tsx            # Корневой layout
│   │
│   ├── components/
│   │   ├── ui/                   # Базовые UI компоненты (переиспользуемые)
│   │   │   ├── MetricCard.tsx    # Универсальная карточка метрики
│   │   │   ├── MetricCardHeader.tsx
│   │   │   ├── MetricPieChart.tsx
│   │   │   ├── MetricTable.tsx
│   │   │   ├── ChartModeToggle.tsx
│   │   │   ├── EnvironmentFilter.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── metrics/              # Специализированные карточки метрик
│   │   │   ├── SeverityCard.tsx
│   │   │   ├── EnvironmentCard.tsx
│   │   │   ├── ResolutionCard.tsx
│   │   │   ├── TrackersCard.tsx
│   │   │   ├── ReasonsCard.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── ComponentAnalysis.tsx # Анализ компонентов с фильтром по окружению
│   │   ├── ComponentTrendChart.tsx
│   │   ├── SprintBacklogChart.tsx
│   │   ├── TrendChart.tsx
│   │   ├── ErrorBoundary.tsx     # Изоляция ошибок
│   │   ├── InfoTooltip.tsx
│   │   └── PeriodSelector.tsx
│   │
│   ├── services/
│   │   └── periodDataService.ts  # Сервис загрузки данных с Zod валидацией
│   │
│   ├── schemas/
│   │   └── periodData.ts         # Zod схемы для валидации данных
│   │
│   ├── types/
│   │   └── metrics.ts            # Унифицированные TypeScript типы
│   │
│   ├── utils/
│   │   └── metricAdapters.ts     # Адаптеры для преобразования данных
│   │
│   └── data/                     # Данные (генерируются скриптом fetch-jira)
│       ├── config.json           # Конфигурация периодов и видимости секций
│       └── periods/              # Данные по каждому периоду
│           ├── period1.json
│           ├── period2.json
│           └── ...
│
├── scripts/                      # Скрипты сбора данных из Jira
│   ├── fetch-jira.ts             # Основной скрипт сбора данных
│   ├── discover-jira.ts          # Обнаружение полей и структуры Jira
│   └── jira/                     # Модули для работы с Jira API
│       ├── client.ts             # HTTP клиент для Jira
│       ├── config.ts             # Конфигурация и цвета
│       ├── queries.ts            # JQL запросы
│       ├── transformers.ts       # Трансформация данных
│       ├── types.ts              # TypeScript типы
│       └── logger.ts             # Логирование
│
├── logs/                         # Логи (создаются при --logs/--resp)
└── .env.local                    # Переменные окружения (не в git)
```

## Архитектура компонентов

### Иерархия компонентов

```
page.tsx
├── ErrorBoundary
│   └── SeverityCard / EnvironmentCard / ResolutionCard / ...
│       └── MetricCard (универсальный)
│           ├── MetricCardHeader
│           │   ├── ChartModeToggle
│           │   ├── EnvironmentFilter
│           │   └── PeriodSelector
│           ├── MetricPieChart / TrendChart
│           └── MetricTable
└── SprintBacklogChart
└── ComponentAnalysis
    └── ComponentTrendChart
```

### Принципы

1. **Унифицированные типы** (`src/types/metrics.ts`):
   - `MetricItem` - единый формат для всех метрик
   - `ChartMode` - режимы отображения (pie/bar/trend)
   - `EnvironmentFilter` - фильтры окружения

2. **Адаптеры** (`src/utils/metricAdapters.ts`):
   - Преобразуют данные из разных форматов в `MetricItem[]`
   - `adaptSeverityData`, `adaptEnvironmentData`, `adaptResolutionData`, etc.

3. **Zod валидация** (`src/schemas/periodData.ts`):
   - Валидация данных при загрузке
   - Типобезопасность на этапе runtime

4. **Error Boundaries**:
   - Каждая карточка обёрнута в `ErrorBoundary`
   - Ошибка в одной карточке не ломает весь дашборд

## Скрипты сбора данных

### Переменные окружения (.env.local)

```env
# Обязательные
JIRA_HOST=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=PROJECT

# Опциональные
JIRA_BOARD_ID=123                    # ID доски для спринтов
JIRA_FIELD_SEVERITY=customfield_10001
JIRA_FIELD_BUG_REASON=customfield_10002
JIRA_FIELD_ENVIRONMENT=environment
JIRA_FIELD_COMPONENT=                # Пусто = стандартное поле components
SPRINTS_PER_PERIOD=4                 # Спринтов в периоде
MAX_SPRINTS=40                       # Максимум спринтов для графика бэклога
```

### Команды

```bash
# Основной сбор данных
npm run fetch-jira

# С детальными логами
npm run fetch-jira:logs

# С сохранением HTTP ответов
npm run fetch-jira:resp

# Полный режим (логи + ответы)
npm run fetch-jira:full

# Обнаружение структуры Jira
npm run discover-jira

# Сбор данных + сборка
npm run update-data
```

### Что делает fetch-jira

1. Загружает закрытые спринты с доски
2. Группирует спринты в периоды (по N спринтов)
3. Для каждого периода:
   - Собирает баги из бэклога спринтов
   - Собирает баги, созданные в даты периода
   - Рассчитывает метрики (severity, environment, resolution, components, reasons)
4. Для каждого спринта:
   - Считает количество открытых багов на дату завершения (для графика бэклога)
5. Сохраняет в `src/data/`

## Структура данных

### config.json

```typescript
{
  lastUpdated: string;          // Дата последнего обновления
  projectKey: string;           // Ключ проекта
  periods: PeriodConfig[];      // Список периодов
  components: string[];         // Список компонентов
  sprints: SprintData[];        // Данные спринтов для графика бэклога
  visibility: SectionVisibility; // Видимость секций
}
```

### period{N}.json

```typescript
{
  periodId: string;
  startDate: string;            // YYYY-MM-DD
  endDate: string;
  generatedAt: string;
  totalBugs: number;            // Всего багов в бэклоге спринтов
  severity: MetricItem[];       // Распределение по severity
  environment: MetricItem[];    // Распределение по окружению
  resolution: MetricItem[];     // Статусы решения
  components: MetricItem[];     // Компоненты (из бэклога)
  trackers: MetricItem[];       // Источники
  reasons: MetricItem[];        // Причины (из бэклога)
  rawBugs: RawBug[];            // Минимальные данные для фильтрации (environment, component)

  // Данные по багам, созданным в период
  totalBugsCreated: number;
  componentsCreated: MetricItem[];
  reasonsCreated: MetricItem[];
  rawBugsCreated: RawBug[];
}
```

## Правила разработки

### TypeScript

- **Strict mode включён** - все типы должны быть явными
- Не использовать `any` - используйте `unknown` или конкретные типы
- Для Chart.js callbacks используйте типы: `TooltipItem<'pie'>`, `TooltipItem<'line'>`, `Chart`
- При индексации объектов используйте type assertions: `obj[key as keyof Type]`

### Компоненты

- **Не создавать новые компоненты без необходимости** - используйте существующие из `ui/`
- Новые карточки метрик создавайте в `components/metrics/`
- Используйте `MetricCard` как базу для карточек метрик
- Оборачивайте карточки в `ErrorBoundary`

### Данные

- Все данные загружаются через `periodDataService.ts`
- Данные валидируются Zod схемами при загрузке
- Не модифицируйте файлы в `src/data/` вручную - они генерируются скриптом

### Стили

- Используйте Tailwind CSS классы
- Цветовая схема: красный (`red-600`, `red-800`) - основной цвет
- Для графиков используйте `rgba` цвета из `scripts/jira/config.ts`

## NPM скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev сервера |
| `npm run build` | Production сборка |
| `npm run start` | Запуск production сервера |
| `npm run lint` | Проверка ESLint |
| `npm run fetch-jira` | Сбор данных из Jira |
| `npm run update-data` | Сбор данных + сборка |

## Деплой

Проект настроен для статического экспорта на GitHub Pages:

```bash
npm run build
# Результат в папке out/
```

- `basePath` автоматически устанавливается в production
- Изображения не оптимизируются (статический экспорт)

## FAQ

### Как добавить новую метрику?

1. Добавьте поле в `scripts/jira/types.ts` → `PeriodData`
2. Обновите `scripts/jira/transformers.ts` для сбора данных
3. Обновите `src/schemas/periodData.ts` (Zod схема)
4. Создайте адаптер в `src/utils/metricAdapters.ts`
5. Создайте карточку в `src/components/metrics/`
6. Добавьте на страницу в `src/app/page.tsx`

### Как скрыть секцию?

В `config.json` установите `visibility.{section}: false`

### Как изменить количество спринтов в периоде?

Установите `SPRINTS_PER_PERIOD=N` в `.env.local` и перезапустите `fetch-jira`

### Как отладить сбор данных?

```bash
npm run fetch-jira:full
# Логи в logs/fetch-jira.log
# HTTP ответы в logs/responses/
```
