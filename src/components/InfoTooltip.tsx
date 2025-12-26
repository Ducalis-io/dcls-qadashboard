'use client';

import React, { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
  title: string;
  children: React.ReactNode;
}

interface TooltipPosition {
  top: number;
  left: number;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ title, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Вычисляем позицию tooltip при показе
  useEffect(() => {
    if (isVisible && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 320; // w-80 = 20rem = 320px
      const tooltipHeight = tooltipRef.current?.offsetHeight || 200;

      // Позиция ниже кнопки
      let top = buttonRect.bottom + 8;
      let left = buttonRect.left - tooltipWidth + buttonRect.width + 20;

      // Проверка выхода за правый край
      if (left + tooltipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth - 10;
      }

      // Проверка выхода за левый край
      if (left < 10) {
        left = 10;
      }

      // Проверка выхода за нижний край - показать сверху
      if (top + tooltipHeight > window.innerHeight - 10) {
        top = buttonRect.top - tooltipHeight - 8;
      }

      // Если и сверху не влезает, показать в видимой области
      if (top < 10) {
        top = 10;
      }

      setPosition({ top, left });
    }
  }, [isVisible]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="ml-2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-bold flex items-center justify-center cursor-help transition-colors"
        aria-label={title}
      >
        ?
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] w-80 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {/* Заголовок */}
          <div className="font-semibold text-yellow-300 mb-2 pb-1 border-b border-gray-700">
            {title}
          </div>

          {/* Контент */}
          <div className="text-gray-200 leading-relaxed">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;

// Предопределённые описания для секций дашборда
export const DATA_DESCRIPTIONS = {
  sprintBacklog: {
    title: 'Динамика бэклога багов',
    content: (
      <>
        <p className="mb-2">
          <strong>Источник:</strong> Исторический подсчёт открытых багов на дату завершения каждого спринта.
        </p>
        <p className="mb-2">
          <strong>JQL:</strong> <code className="bg-gray-700 px-1 rounded text-xs">created &lt;= &quot;дата&quot; AND NOT status WAS IN (&quot;Done&quot;) BEFORE &quot;дата&quot;</code>
        </p>
        <p className="text-yellow-200 text-xs">
          Показывает сколько багов было открыто (не закрыто) в бэклоге на момент завершения спринта.
        </p>
      </>
    ),
  },

  environment: {
    title: 'Распределение по окружениям',
    content: (
      <>
        <p className="mb-2">
          <strong>Источник:</strong> Баги из бэклога спринтов периода.
        </p>
        <p className="mb-2">
          <strong>JQL:</strong> <code className="bg-gray-700 px-1 rounded text-xs">Sprint IN (спринты периода)</code>
        </p>
        <p className="text-yellow-200 text-xs">
          Показывает в каком окружении (prod/stage) были обнаружены баги, которые были назначены на спринты выбранного периода.
        </p>
      </>
    ),
  },

  resolution: {
    title: 'Статус решения',
    content: (
      <>
        <p className="mb-2">
          <strong>Источник:</strong> Баги из бэклога спринтов периода.
        </p>
        <p className="mb-2">
          <strong>JQL:</strong> <code className="bg-gray-700 px-1 rounded text-xs">Sprint IN (спринты периода)</code>
        </p>
        <p className="text-yellow-200 text-xs">
          Показывает текущий статус (Done/In Progress/To Do) багов, которые были в бэклоге спринтов периода.
        </p>
      </>
    ),
  },

  priority: {
    title: 'Приоритеты багов',
    content: (
      <>
        <p className="mb-2">
          <strong>Источник:</strong> Баги из бэклога спринтов периода.
        </p>
        <p className="mb-2">
          <strong>JQL:</strong> <code className="bg-gray-700 px-1 rounded text-xs">Sprint IN (спринты периода)</code>
        </p>
        <p className="text-yellow-200 text-xs">
          Распределение по severity (critical/major/minor и т.д.) багов из бэклога спринтов.
        </p>
      </>
    ),
  },

  components: {
    title: 'Компоненты (созданные в период)',
    content: (
      <>
        <p className="mb-2">
          <strong>Источник:</strong> Баги, созданные в даты периода.
        </p>
        <p className="mb-2">
          <strong>JQL:</strong> <code className="bg-gray-700 px-1 rounded text-xs">created &gt;= &quot;начало&quot; AND created &lt;= &quot;конец&quot;</code>
        </p>
        <p className="mb-2 text-green-300 text-xs">
          <strong>Фильтр Prod:</strong> Показывает какие компоненты пропустили баги на прод (баги найденные на проде).
        </p>
        <p className="text-yellow-200 text-xs">
          В отличие от других секций, здесь учитываются баги по дате создания, а не по принадлежности к спринту.
        </p>
      </>
    ),
  },

  reasons: {
    title: 'Причины багов (созданные в период)',
    content: (
      <>
        <p className="mb-2">
          <strong>Источник:</strong> Баги, созданные в даты периода.
        </p>
        <p className="mb-2">
          <strong>JQL:</strong> <code className="bg-gray-700 px-1 rounded text-xs">created &gt;= &quot;начало&quot; AND created &lt;= &quot;конец&quot;</code>
        </p>
        <p className="text-yellow-200 text-xs">
          Анализ причин возникновения багов (ошибка в коде, недоработка в требованиях и т.д.) по багам созданным в период.
        </p>
      </>
    ),
  },

  trackers: {
    title: 'Источники багов',
    content: (
      <>
        <p className="mb-2">
          <strong>Источник:</strong> Баги из бэклога спринтов периода.
        </p>
        <p className="text-yellow-200 text-xs">
          Распределение по трекерам/источникам (Jira, GitHub и т.д.).
        </p>
      </>
    ),
  },

  testCoverage: {
    title: 'Покрытие тестами',
    content: (
      <>
        <p className="mb-2">
          <strong>Источник:</strong> Статические данные (TODO: интеграция с системой тестирования).
        </p>
        <p className="text-yellow-200 text-xs">
          Процент автоматизированных тестов от общего количества тест-кейсов.
        </p>
      </>
    ),
  },
};
