# QA Dashboard

Дашборд для анализа багов и контроля качества. Собирает данные из Jira и отображает метрики в виде графиков и таблиц.

## Технологии

- **Next.js 15** (App Router, Static Export)
- **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS 4**
- **Chart.js** + react-chartjs-2
- **Zod** для валидации данных
- **Cloudflare KV** для хранения данных (опционально)

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env.local
# Отредактируйте .env.local

# Сбор данных из Jira
npm run fetch-jira

# Деплой в Cloudflare 
npm run deploy-data  

# fetch-jira + deploy-data 
npm run update-kv

# Запуск в режиме разработки
npm run dev
```

Приложение будет доступно по адресу http://localhost:3000

## Режимы работы

Дашборд поддерживает два источника данных для загрузки:

| Режим | Описание | Когда использовать |
|-------|----------|-------------------|
| `local` | Данные из `src/data/` | Разработка, простой деплой |
| `cloudflare` | Данные из Cloudflare KV API | Продакшен без git push данных |

Настройка в `.env.local`:
```env
NEXT_PUBLIC_DATA_SOURCE=local        # или cloudflare
NEXT_PUBLIC_API_URL=https://...      # URL Worker'а (для cloudflare)
```

## Структура проекта

```
dcls-qadashboard/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Главная страница дашборда
│   │   └── layout.tsx            # Корневой layout (с Providers)
│   │
│   ├── components/
│   │   ├── ui/                   # Базовые UI компоненты (переиспользуемые)
│   │   │   ├── MetricCard.tsx    # Универсальная карточка метрики
│   │   │   ├── DataSourceSwitcher.tsx  # Dropdown переключения источника данных
│   │   │   ├── EnvironmentFilter.tsx  # Dropdown фильтра окружения (Все/Prod/Stage)
│   │   │   ├── MetricPieChart.tsx
│   │   │   ├── MetricTable.tsx
│   │   │   └── ...
│   │   │
│   │   ├── metrics/              # Специализированные карточки метрик
│   │   │   ├── SeverityCard.tsx
│   │   │   ├── EnvironmentCard.tsx
│   │   │   └── ...
│   │   │
│   │   ├── ComponentAnalysis.tsx
│   │   ├── SprintBacklogChart.tsx
│   │   ├── PeriodSelector.tsx        # Выбор периода
│   │   ├── PeriodMultiplierSelect.tsx # Множитель объединения периодов
│   │   ├── Providers.tsx             # Client-side providers wrapper
│   │   └── ErrorBoundary.tsx
│   │
│   ├── config/
│   │   └── dataSources.ts       # Реестр источников данных (backlog, created, ...)
│   │
│   ├── contexts/
│   │   └── DashboardContext.tsx  # Единый источник данных (Provider + хуки)
│   │
│   ├── hooks/
│   │   └── useDataSource.ts      # Хуки-обёртки для обратной совместимости
│   │
│   ├── services/
│   │   └── periodDataService.ts  # Типы данных (функции deprecated)
│   │
│   ├── schemas/
│   │   └── periodData.ts         # Zod схемы для валидации
│   │
│   ├── types/
│   │   └── metrics.ts            # TypeScript типы
│   │
│   ├── utils/
│   │   ├── colors.ts             # Цвета для графиков
│   │   ├── envFilter.ts          # Фильтрация rawBugs по окружению и агрегация метрик
│   │   ├── metricAdapters.ts     # Адаптеры данных
│   │   └── periodMerger.ts       # Утилиты группировки и мёржа периодов
│   │
│   └── data/                     # Данные (генерируются fetch-jira или заглушки)
│       ├── config.json           # Конфигурация (или заглушка для cloudflare)
│       └── periods/              # Файлы периодов
│
├── scripts/
│   ├── fetch-jira.ts             # Сбор данных из Jira
│   ├── deploy-to-kv.ts           # Деплой в Cloudflare KV
│   ├── clear-kv.ts               # Очистка Cloudflare KV
│   ├── validate-build.js         # Валидация конфигурации перед сборкой
│   └── jira/                     # Модули для Jira API
│
├── docs/                         # Документация
├── wrangler.toml                 # Конфигурация Cloudflare
└── .env.local                    # Переменные окружения (не в git)
```

## Архитектура

### Источники данных (Data Sources)

Каждая метрика может отображать данные из нескольких источников. Источник данных — это набор багов, отобранных по определённому критерию из Jira.

| Источник | Описание | JQL |
|----------|----------|-----|
| **backlog** | Все баги из спринтов периода | `Sprint IN (sprintIds)` |
| **created** | Баги, созданные в даты периода | `created >= startDate AND created <= endDate` |
| **totalBacklog** | Открытые баги проекта на конец периода | `created <= endDate AND NOT status WAS IN ("Done", "RFT", "Test") BEFORE endDate` |

На каждой карточке метрики есть переключатель источника (dropdown «В спринтах» / «Созданные» / «Бэклог»). Это позволяет анализировать одну и ту же метрику (severity, environment и т.д.) с разных точек зрения.

### Фильтр по окружению (Environment Filter)

Каждая карточка метрики имеет dropdown-фильтр окружения: «Все окружения» / «Prod» / «Stage». При выборе конкретного окружения данные пересчитываются из `rawBugs` — массива минимальных записей о багах, хранящихся в каждом источнике. Фильтрация работает как для pie/bar, так и для trend-графиков.

**Особенность компонентов:** один баг может относиться к нескольким компонентам. При подсчёте по компонентам такой баг учитывается в каждом из них, поэтому сумма по компонентам может превышать общее число багов.

Данные хранятся в расширяемой структуре `sources`:

```json
{
  "periodId": "period1",
  "startDate": "2025-06-09",
  "endDate": "2025-06-16",
  "sources": {
    "backlog": {
      "totalBugs": 27,
      "severity": [{ "label": "critical", "count": 5 }, ...],
      "environment": [...],
      "resolution": [...],
      "components": [...],
      "trackers": [...],
      "reasons": [...],
      "rawBugs": [{ "environment": "prod", "components": ["sync", "api"], "severity": "critical", "status": "Done", "reason": "код" }, ...]
    },
    "created": {
      "totalBugs": 18,
      "severity": [...],
      ...
    },
    "totalBacklog": {
      "totalBugs": 142,
      "severity": [...],
      ...
    }
  }
}
```

**Добавление нового источника** требует минимальных изменений:
1. Добавить запись в `src/config/dataSources.ts`
2. Добавить сбор данных в `scripts/fetch-jira.ts` (записать в `sources.newSourceId`)
3. Всё остальное (мёржер периодов, переключатели, карточки, тренды) подхватит автоматически

### Поток данных

```
DashboardProvider (единственный источник данных)
├── config ─────────────────────┐
├── allPeriodsData (raw) ───────┼── загружается ОДИН раз при монтировании
├── loading ────────────────────┘
├── multiplier (state)          # Множитель объединения периодов (1-4)
├── selectedPeriodId (state)
└── groupedPeriods (computed)   # Сгруппированные периоды

        ↓ Context

Хуки-селекторы (НЕ загружают, только читают + трансформируют)
├── useDashboardContext()       # Весь контекст
├── useGroupedPeriods()         # Периоды для PeriodSelector
├── useCurrentPeriodData()      # Данные выбранного периода (с мёржем)
└── useAllGroupedPeriodsData()  # Все периоды для TrendChart

        ↓

Компоненты (получают sources, управляют activeSource и envFilter внутри)
├── page.tsx                    # Передаёт currentData.sources в карточки
├── SeverityCard / EnvironmentCard / ...
│   ├── DataSourceSwitcher      # Dropdown «В спринтах» / «Созданные» / «Бэклог»
│   ├── EnvironmentFilter       # Dropdown «Все окружения» / «Prod» / «Stage»
│   └── MetricCard → TrendChart / PieChart / Table
├── ComponentAnalysis
│   ├── DataSourceSwitcher
│   ├── EnvironmentFilter
│   └── ComponentTrendChart
└── SprintBacklogChart          # Отдельный источник (config.sprints)
```

### Иерархия компонентов

```
layout.tsx
└── Providers (DashboardProvider)
    └── page.tsx
        ├── PeriodMultiplierSelect        # Выбор множителя (1-4)
        ├── SprintBacklogChart
        ├── ErrorBoundary
        │   └── SeverityCard / EnvironmentCard / ResolutionCard / ...
        │       ├── DataSourceSwitcher    # Dropdown источника
        │       ├── EnvironmentFilter     # Dropdown окружения
        │       └── MetricCard (универсальный)
        │           ├── MetricCardHeader + PeriodSelector
        │           ├── MetricPieChart / TrendChart
        │           └── MetricTable
        └── ComponentAnalysis
            ├── DataSourceSwitcher
            ├── EnvironmentFilter
            └── ComponentTrendChart
```

### Принципы

1. **Единый источник данных** — `DashboardProvider` загружает все данные один раз
2. **Расширяемые источники** — структура `sources: Record<string, SourceMetrics>` позволяет добавлять новые источники без изменения схемы или компонентов
3. **Кросс-фильтрация** — `rawBugs` хранит минимальный набор полей каждого бага, что позволяет на фронтенде фильтровать по окружению с пересчётом любой метрики (severity, resolution и т.д.)
4. **Хуки-селекторы** — компоненты получают только нужные данные через хуки
5. **Унифицированные типы** — `SourceMetrics` единый формат для всех источников, `MetricItem` единый формат для отображения
6. **Адаптеры** — преобразуют JSON в `MetricItem[]`, вычисляют цвета
7. **Zod валидация** — типобезопасность на этапе runtime
8. **Error Boundaries** — ошибка в одной карточке не ломает дашборд

## Множитель объединения периодов

Дашборд поддерживает группировку периодов через множитель (1-4).

**Пример:** При импорте создано 20 периодов по 2 спринта. Пользователь выбирает множитель 2 — получает 10 объединённых периодов по 4 спринта каждый.

### Как работает

1. В шапке страницы select с вариантами 1, 2, 3, 4
2. По умолчанию множитель = 1 (исходное поведение)
3. При выборе множителя > 1:
   - Периоды группируются (неполная группа в начале)
   - Данные суммируются (counts, массивы метрик) — для каждого источника отдельно
   - PeriodSelector показывает объединённые периоды
   - Графики отображают агрегированные данные
4. При смене множителя выбранный период не сбрасывается — используется умный поиск соответствия

### Пример группировки

```
Периоды: [p1, p2, p3, p4, p5], множитель = 2
Результат: [[p1], [p2, p3], [p4, p5]]
           ↑ неполная группа в начале
```

## Переменные окружения

```env
# === Jira (обязательные) ===
JIRA_HOST=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=PROJECT

# === Jira (опциональные) ===
JIRA_BOARD_ID=123                    # ID доски для спринтов
JIRA_FIELD_SEVERITY=customfield_10001
JIRA_FIELD_BUG_REASON=customfield_10002
JIRA_FIELD_ENVIRONMENT=environment
JIRA_FIELD_COMPONENT=                # Пусто = стандартное поле
SPRINTS_PER_PERIOD=4                 # Спринтов в периоде
MAX_SPRINTS=40                       # Максимум для графика бэклога

# === Cloudflare (опционально) ===
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_KV_NAMESPACE_ID=...

# === Frontend ===
NEXT_PUBLIC_DATA_SOURCE=local        # local | cloudflare
NEXT_PUBLIC_API_URL=https://...      # URL Cloudflare Worker
```

Полный список в `.env.example`.

## NPM скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev сервера |
| `npm run build` | Production сборка |
| `npm run lint` | Проверка ESLint |
| `npm run fetch-jira` | Сбор данных из Jira (полный) |
| `npm run fetch-jira:logs` | С детальными логами |
| `npm run fetch-jira:full` | С логами и HTTP ответами |
| `npm run deploy-data` | Деплой в Cloudflare KV |
| `npm run clear-kv` | Очистка Cloudflare KV |
| `npm run update-kv` | fetch-jira + deploy-data |
| `npm run update-data` | fetch-jira + build |

## Что делает fetch-jira

1. Загружает закрытые спринты с доски
2. Группирует спринты в периоды (по N спринтов)
3. Для каждого периода собирает **три набора данных** (источника):
   - **backlog** — баги из бэклога спринтов (полный набор метрик: severity, environment, resolution, components, trackers, reasons)
   - **created** — баги, созданные в даты периода (тот же полный набор метрик)
   - **totalBacklog** — все открытые баги проекта на дату окончания периода (исключая Done, RFT, Test)
4. Для каждого спринта считает открытые баги в бэклоге проекта (для графика бэклога), исключая статусы Done, RFT, Test
5. Сохраняет в `src/data/`

### Частичный сбор данных

Полный сбор может занимать длительное время. Для досбора отдельных периодов используйте флаг `--periods`:

```bash
# Досбор конкретных периодов
npm run fetch-jira -- --periods 39,40

# Диапазон периодов
npm run fetch-jira -- --periods 35-40

# Комбинация
npm run fetch-jira -- --periods 38,39-40

# С логами
npm run fetch-jira -- --periods 39,40 --logs

# Пропустить сбор данных спринтов (график бэклога)
npm run fetch-jira -- --skip-sprints
```

В частичном режиме (`--periods`):
- Старые файлы периодов **не удаляются**
- Данные спринтов для графика бэклога **берутся из существующего config.json**
- config.json обновляется с сохранением информации обо всех периодах

## Структура данных

### config.json

```typescript
{
  lastUpdated: string;
  projectKey: string;
  sprintsPerPeriod: number;       // Спринтов в одном периоде
  totalSprintsAnalyzed: number;   // Общее количество анализируемых спринтов
  periods: PeriodConfig[];
  components: string[];
  sprints: SprintData[];
  visibility: SectionVisibility;
}
```

### period{N}.json

```typescript
{
  periodId: string;
  startDate: string;              // YYYY-MM-DD
  endDate: string;
  generatedAt: string;
  sources: {
    backlog: SourceMetrics;       // Все баги из спринтов периода
    created: SourceMetrics;       // Баги, созданные в период
    totalBacklog: SourceMetrics;  // Открытые баги проекта на конец периода
    // ... будущие источники добавляются как новые ключи
  }
}

// SourceMetrics — единая структура для любого источника
interface SourceMetrics {
  totalBugs: number;
  severity: Array<{ label: string; count: number }>;
  environment: Array<{ environment: string; count: number }>;
  resolution: Array<{ status: string; count: number }>;
  components: Array<{ name: string; count: number }>;
  trackers: Array<{ name: string; count: number }>;
  reasons: Array<{ reason: string; count: number }>;
  rawBugs: Array<{ environment?: string; components?: string[]; severity?: string; status?: string; reason?: string }>;
}
```

## Сборка

Проект настроен для статического экспорта:

```bash
npm run build
# Результат в папке out/
```

- `basePath` автоматически устанавливается в production
- Изображения не оптимизируются (статический экспорт)
- Перед сборкой автоматически запускается валидация (`prebuild`)

### Валидация перед сборкой

При `npm run build` проверяется корректность конфигурации:

**В local режиме:**
- Наличие `config.json` с реальными данными (не заглушка)
- Наличие всех файлов периодов

**В cloudflare режиме:**
- Наличие `NEXT_PUBLIC_API_URL`

Если валидация не пройдена, сборка остановится с подсказкой.

## Деплой

### GitHub Pages (режим local)

1. Данные хранятся в репозитории (`src/data/`)
2. При push в master автоматически деплоится через GitHub Actions
3. Для обновления данных: `npm run fetch-jira` → commit → push

### GitHub Pages + Cloudflare KV (режим cloudflare)

1. Данные хранятся в Cloudflare KV
2. Сайт загружает данные через API при открытии
3. Для обновления данных: `npm run update-kv` (без git push)

Настройка GitHub Variables для cloudflare режима:
- `NEXT_PUBLIC_DATA_SOURCE` = `cloudflare`
- `NEXT_PUBLIC_API_URL` = URL вашего Worker'а

## Правила разработки

### TypeScript

- **Strict mode включён** — все типы должны быть явными
- Не использовать `any` — используйте `unknown` или конкретные типы

### Компоненты

- Используйте существующие из `ui/`
- Новые карточки метрик создавайте в `components/metrics/`
- Оборачивайте карточки в `ErrorBoundary`
- Карточки получают `sources: Record<string, SourceMetrics>` и управляют `activeSource` и `envFilter` внутри

### Данные

- Загружаются через `DashboardProvider` один раз при монтировании
- Компоненты получают данные через хуки:
  - `useDashboardContext()` — полный доступ к контексту
  - `useGroupedPeriods()` — сгруппированные периоды (для PeriodSelector)
  - `useCurrentPeriodData()` — данные выбранного периода
  - `useAllGroupedPeriodsData()` — все периоды (для TrendChart)
  - `useDashboardData()` — комбинированный хук для page.tsx
- Функции из `periodDataService.ts` — **deprecated**, используйте хуки
- Валидируются Zod схемами
- Не модифицируйте `src/data/` вручную
- В cloudflare режиме папка `src/data/` содержит только заглушки для TypeScript

### Стили

- Используйте Tailwind CSS
- Цвета для графиков в `src/utils/colors.ts`

## FAQ

### Как добавить новый источник данных?

1. Добавьте запись в `src/config/dataSources.ts` (id, label, shortLabel)
2. Добавьте сбор данных в `scripts/fetch-jira.ts` — запишите результат `transformBugsToMetrics()` в `sources.yourSourceId`
3. Готово — переключатели на карточках, мёржер периодов и тренды подхватят новый источник автоматически

### Как добавить новую метрику?

1. Добавьте поле в `SourceMetrics` в `scripts/jira/types.ts` и `src/services/periodDataService.ts`
2. Обновите `scripts/jira/transformers.ts` (функция `transformBugsToMetrics`)
3. Обновите `src/schemas/periodData.ts` (схема `SourceMetricsSchema`)
4. Обновите `src/utils/periodMerger.ts` (ключ-функция в `METRIC_KEY_EXTRACTORS` и `mergeSourceMetrics`)
5. Добавьте цвета в `src/utils/colors.ts`
6. Создайте адаптер в `src/utils/metricAdapters.ts`
7. Создайте карточку в `src/components/metrics/`

### Как скрыть секцию?

В `config.json` установите `visibility.{section}: false`

### Как изменить количество спринтов в периоде?

Установите `SPRINTS_PER_PERIOD=N` в `.env.local` и перезапустите `fetch-jira`

### Как объединить периоды на UI?

Используйте select "Объединение" в шапке дашборда. Выберите множитель 2-4 для группировки периодов.

### Как досбрать отдельные периоды?

```bash
npm run fetch-jira -- --periods 39,40
```

### Как отладить сбор данных?

```bash
npm run fetch-jira:full
# Логи в logs/fetch-jira.log
# HTTP ответы в logs/responses/
```
