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

# Запуск в режиме разработки
npm run dev
```

Приложение будет доступно по адресу http://localhost:3000

## Режимы работы

Дашборд поддерживает два источника данных:

| Режим | Описание | Когда использовать |
|-------|----------|-------------------|
| `local` | Данные из `src/data/` | Разработка, простой деплой |
| `cloudflare` | Данные из Cloudflare KV API | Продакшен без git push данных |

Настройка в `.env.local`:
```env
DATA_SOURCE=local                    # или cloudflare
NEXT_PUBLIC_API_URL=https://...      # URL Worker'а (для cloudflare)
```

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
│   │   └── ErrorBoundary.tsx
│   │
│   ├── hooks/
│   │   └── useDataSource.ts      # Хук загрузки данных (local/cloudflare)
│   │
│   ├── services/
│   │   └── periodDataService.ts  # Сервис загрузки данных
│   │
│   ├── schemas/
│   │   └── periodData.ts         # Zod схемы для валидации
│   │
│   ├── types/
│   │   └── metrics.ts            # TypeScript типы
│   │
│   ├── utils/
│   │   ├── colors.ts             # Цвета для графиков
│   │   └── metricAdapters.ts     # Адаптеры данных
│   │
│   └── data/                     # Данные (генерируются fetch-jira)
│       ├── config.json
│       └── periods/
│
├── scripts/
│   ├── fetch-jira.ts             # Сбор данных из Jira
│   ├── deploy-to-kv.ts           # Деплой в Cloudflare KV
│   ├── clear-kv.ts               # Очистка Cloudflare KV
│   └── jira/                     # Модули для Jira API
│
├── docs/                         # Документация
├── wrangler.toml                 # Конфигурация Cloudflare
└── .env.local                    # Переменные окружения (не в git)
```

## Архитектура компонентов

```
page.tsx
├── ErrorBoundary
│   └── SeverityCard / EnvironmentCard / ResolutionCard / ...
│       └── MetricCard (универсальный)
│           ├── MetricCardHeader
│           ├── MetricPieChart / TrendChart
│           └── MetricTable
├── SprintBacklogChart
└── ComponentAnalysis
```

### Принципы

1. **Унифицированные типы** — `MetricItem` единый формат для всех метрик
2. **Адаптеры** — преобразуют JSON в `MetricItem[]`, вычисляют цвета
3. **Zod валидация** — типобезопасность на этапе runtime
4. **Error Boundaries** — ошибка в одной карточке не ломает дашборд

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
DATA_SOURCE=local                    # local | cloudflare
NEXT_PUBLIC_API_URL=https://...      # URL Cloudflare Worker
```

Полный список в `.env.example`.

## NPM скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev сервера |
| `npm run build` | Production сборка |
| `npm run lint` | Проверка ESLint |
| `npm run fetch-jira` | Сбор данных из Jira |
| `npm run fetch-jira:logs` | С детальными логами |
| `npm run fetch-jira:full` | С логами и HTTP ответами |
| `npm run deploy-data` | Деплой в Cloudflare KV |
| `npm run clear-kv` | Очистка Cloudflare KV |
| `npm run update-kv` | fetch-jira + deploy-data |
| `npm run update-data` | fetch-jira + build |

## Что делает fetch-jira

1. Загружает закрытые спринты с доски
2. Группирует спринты в периоды (по N спринтов)
3. Для каждого периода:
   - Собирает баги из бэклога спринтов
   - Собирает баги, созданные в даты периода
   - Рассчитывает метрики (severity, environment, resolution, components, reasons)
4. Для каждого спринта считает открытые баги (для графика бэклога)
5. Сохраняет в `src/data/`

## Структура данных

### config.json

```typescript
{
  lastUpdated: string;
  projectKey: string;
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
  startDate: string;            // YYYY-MM-DD
  endDate: string;
  totalBugs: number;
  severity: Array<{ label: string; count: number }>;
  environment: Array<{ environment: string; count: number }>;
  resolution: Array<{ status: string; count: number }>;
  components: Array<{ name: string; count: number }>;
  // ... и другие метрики
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

### Данные

- Загружаются через `useDataSource` хук (или `periodDataService.ts` для local)
- Валидируются Zod схемами
- Не модифицируйте `src/data/` вручную

### Стили

- Используйте Tailwind CSS
- Цвета для графиков в `src/utils/colors.ts`

## FAQ

### Как добавить новую метрику?

1. Добавьте поле в `scripts/jira/types.ts`
2. Обновите `scripts/jira/transformers.ts`
3. Обновите `src/schemas/periodData.ts`
4. Добавьте цвета в `src/utils/colors.ts`
5. Создайте адаптер в `src/utils/metricAdapters.ts`
6. Создайте карточку в `src/components/metrics/`

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
