# QA Dashboard - Jira Integration

Дашборд для анализа багов с автоматическим сбором данных из Jira Cloud.

## Быстрый старт

### 1. Настройка `.env.local`

```env
# Подключение к Jira
JIRA_HOST=https://your-domain.atlassian.net
JIRA_CLOUD_ID=ваш-cloud-id
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=ваш-api-токен
JIRA_PROJECT_KEY=DCLS
JIRA_BOARD_ID=20

# Кастомные поля (найти через npm run discover-jira)
JIRA_FIELD_SEVERITY=customfield_10724
JIRA_FIELD_BUG_REASON=customfield_10725
JIRA_FIELD_ENVIRONMENT=customfield_10721
JIRA_FIELD_COMPONENT=customfield_10723

# Настройки периодов
SPRINTS_PER_PERIOD=4
MAX_SPRINTS=40

# Видимость секций (0 = скрыть)
SHOW_SPRINT_BACKLOG=1
SHOW_ENVIRONMENT=1
SHOW_RESOLUTION=1
SHOW_PRIORITY=1
SHOW_COMPONENTS=1
SHOW_TRACKERS=0
SHOW_REASONS=1
SHOW_TEST_COVERAGE=1
```

**Получить Cloud ID:** `https://your-domain.atlassian.net/_edge/tenant_info`

**Создать API Token:** https://id.atlassian.com/manage-profile/security/api-tokens

### 2. Обнаружение параметров Jira

```bash
npm run discover-jira
```

Покажет все проекты, доски, спринты и кастомные поля.

### 3. Сбор данных

```bash
npm run fetch-jira
```

### 4. Запуск

```bash
npm run dev
```

---

## Структура данных

```
src/data/
├── config.json         # Конфигурация + visibility + спринты
└── periods/
    ├── period1.json    # Данные периода
    └── ...
```

---

## Функции дашборда

| Секция | Описание | ENV флаг |
|--------|----------|----------|
| Динамика бэклога | График багов по спринтам | `SHOW_SPRINT_BACKLOG` |
| Окружения | Распределение prod/stage | `SHOW_ENVIRONMENT` |
| Резолюция | Done/To Do/In Progress | `SHOW_RESOLUTION` |
| Приоритеты | Severity багов | `SHOW_PRIORITY` |
| Компоненты | По кастомному полю | `SHOW_COMPONENTS` |
| Трекеры | Источники багов | `SHOW_TRACKERS` |
| Причины | Root cause анализ | `SHOW_REASONS` |
| Покрытие | Автотесты | `SHOW_TEST_COVERAGE` |

Каждая круговая диаграмма имеет переключатель **Pie/Trend** для просмотра динамики по периодам с опцией нормализации.

---

## Troubleshooting

| Ошибка | Решение |
|--------|---------|
| 401 Unauthorized | Проверьте `JIRA_CLOUD_ID` и API токен |
| 429 Too Many Requests | Скрипт обрабатывает автоматически (retry + backoff) |
| Компоненты = no_component | Укажите `JIRA_FIELD_COMPONENT` |
| Environment = unknown | Укажите `JIRA_FIELD_ENVIRONMENT` |

---

## Команды

```bash
npm run dev              # Локальный сервер
npm run discover-jira    # Поиск параметров Jira
npm run fetch-jira       # Сбор данных
npm run build            # Production сборка
```

---

**Версия:** 1.1.0 | **Обновлено:** 26.12.2025
