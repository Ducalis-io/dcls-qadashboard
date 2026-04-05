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

// Описание источников данных (общее для всех карточек)
const SOURCE_DESCRIPTIONS = (
  <div className="mt-2 pt-2 border-t border-gray-700">
    <p className="font-semibold text-blue-300 mb-1 text-xs">Источники данных (переключатель):</p>
    <ul className="text-xs text-gray-300 space-y-1">
      <li><strong className="text-white">В спринтах</strong> — все баги из спринтов периода <code className="bg-gray-700 px-1 rounded">Sprint IN (ids)</code></li>
      <li><strong className="text-white">Созданные</strong> — баги, созданные в даты периода <code className="bg-gray-700 px-1 rounded">created &gt;= ... AND created &lt;= ...</code></li>
      <li><strong className="text-white">Бэклог</strong> — все открытые баги проекта на конец периода <code className="bg-gray-700 px-1 rounded">NOT status WAS IN (&quot;Done&quot;, &quot;RFT&quot;, &quot;Test&quot;)</code></li>
    </ul>
  </div>
);

// Предопределённые описания для секций дашборда
export const DATA_DESCRIPTIONS = {
  sprintBacklog: {
    title: 'Динамика бэклога багов',
    content: (
      <>
        <p className="mb-2">
          Исторический подсчёт открытых багов на дату завершения каждого спринта.
        </p>
        <p className="mb-2">
          <strong>JQL:</strong> <code className="bg-gray-700 px-1 rounded text-xs">created &lt;= &quot;дата&quot; AND NOT status WAS IN (&quot;Done&quot;, &quot;RFT&quot;, &quot;Test&quot;) BEFORE &quot;дата&quot;</code>
        </p>
        <p className="text-yellow-200 text-xs">
          Баги, которые не были закрыты / не в тестировании на момент завершения спринта. Отдельный источник, не переключается.
        </p>
      </>
    ),
  },

  environment: {
    title: 'Распределение по окружениям',
    content: (
      <>
        <p className="mb-2">
          В каком окружении (prod/stage) были обнаружены баги.
        </p>
        {SOURCE_DESCRIPTIONS}
      </>
    ),
  },

  resolution: {
    title: 'Статус решения',
    content: (
      <>
        <p className="mb-2">
          Текущий статус (Done / In Progress / To Do) багов.
        </p>
        {SOURCE_DESCRIPTIONS}
      </>
    ),
  },

  priority: {
    title: 'Серьёзность багов',
    content: (
      <>
        <p className="mb-2">
          Распределение по severity (critical / major / minor и т.д.).
        </p>
        {SOURCE_DESCRIPTIONS}
      </>
    ),
  },

  components: {
    title: 'Компоненты',
    content: (
      <>
        <p className="mb-2">
          Распределение багов по компонентам продукта.
        </p>
        <p className="mb-2 text-yellow-300 text-xs">
          <strong>Примечание:</strong> один баг может относиться к нескольким компонентам — в этом случае он учитывается в каждом из них. Поэтому сумма по компонентам может превышать общее число багов. Нормализованный вид (%) показывает долю каждого компонента без этого эффекта.
        </p>
        <p className="mb-2 text-green-300 text-xs">
          <strong>Фильтр Prod/Stage:</strong> позволяет увидеть какие компоненты пропускают баги на конкретное окружение.
        </p>
        {SOURCE_DESCRIPTIONS}
      </>
    ),
  },

  reasons: {
    title: 'Причины багов',
    content: (
      <>
        <p className="mb-2">
          Анализ причин возникновения багов (ошибка в коде, недоработка в требованиях и т.д.).
        </p>
        {SOURCE_DESCRIPTIONS}
      </>
    ),
  },

  trackers: {
    title: 'Трекеры багов',
    content: (
      <>
        <p className="mb-2">
          Распределение по трекерам/источникам (Jira, GitHub и т.д.).
        </p>
        {SOURCE_DESCRIPTIONS}
      </>
    ),
  },

  testCoverage: {
    title: 'Покрытие тестами',
    content: (
      <>
        <p className="mb-2">
          Статические данные (TODO: интеграция с системой тестирования).
        </p>
        <p className="text-yellow-200 text-xs">
          Процент автоматизированных тестов от общего количества тест-кейсов.
        </p>
      </>
    ),
  },
};
