// Функция для загрузки данных из опубликованной Google таблицы
export async function fetchSheetData(sheetId: string, tabName: string) {
  // URL для опубликованной таблицы в формате CSV
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${tabName}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Ошибка загрузки данных");

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error("Ошибка при загрузке данных из Google Sheets:", error);
    return [];
  }
}

/**
 * Функция для получения данных из опубликованной Google таблицы
 * @param url URL опубликованной таблицы в формате CSV
 * @returns Массив объектов с данными из таблицы
 */
export async function fetchSheetDataFromURL(url: string): Promise<any[]> {
  try {
    console.log("fetchSheetDataFromURL: Начало загрузки данных из", url);

    // Преобразуем URL, если это обычная ссылка на редактирование
    if (url.includes("/edit") && !url.includes("/pub")) {
      // Превращаем URL редактирования в URL экспорта CSV
      const spreadsheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)\/edit/)?.[1];
      if (spreadsheetId) {
        url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
        console.log("fetchSheetDataFromURL: Преобразованный URL:", url);
      }
    }

    // Список CORS-прокси для попытки (если прямой доступ не работает)
    const corsProxies = [
      "https://corsproxy.io/?",
      "https://cors-anywhere.herokuapp.com/",
      "https://api.allorigins.win/raw?url=",
    ];

    console.log("fetchSheetDataFromURL: Попытка прямой загрузки с URL:", url);

    // Пробуем загрузить напрямую
    try {
      // Получаем данные в формате CSV
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "text/csv,text/plain,*/*",
          "Cache-Control": "no-cache",
        },
        credentials: "omit",
      });

      console.log(
        "fetchSheetDataFromURL: Статус прямого ответа:",
        response.status
      );

      if (response.ok) {
        const csvText = await response.text();
        console.log(
          "fetchSheetDataFromURL: Получен CSV длиной",
          csvText.length
        );
        console.log(
          "fetchSheetDataFromURL: Первые 100 символов:",
          csvText.substring(0, 100)
        );

        if (csvText && csvText.trim() !== "") {
          console.log(
            "fetchSheetDataFromURL: Успешно получены данные напрямую"
          );
          return parseCSV(csvText);
        }
      }

      // Если прямая загрузка не удалась, пробуем через прокси
      console.log(
        "fetchSheetDataFromURL: Прямая загрузка не удалась, пробуем через CORS прокси"
      );
      throw new Error("Требуется прокси");
    } catch (directError) {
      // Перебираем все доступные прокси пока один не сработает
      let lastError = directError;

      for (const corsProxy of corsProxies) {
        try {
          const corsUrl = `${corsProxy}${encodeURIComponent(url)}`;
          console.log(
            "fetchSheetDataFromURL: Пробуем через CORS прокси:",
            corsUrl
          );

          // Пробуем загрузить через текущий CORS прокси
          const response = await fetch(corsUrl, {
            method: "GET",
            headers: {
              Accept: "text/csv,text/plain,*/*",
            },
            credentials: "omit",
          });

          console.log(
            "fetchSheetDataFromURL: Статус ответа через прокси",
            response.status
          );

          if (!response.ok) {
            throw new Error(`Ошибка HTTP через прокси: ${response.status}`);
          }

          const csvText = await response.text();
          console.log(
            "fetchSheetDataFromURL: Получен CSV через прокси длиной",
            csvText.length
          );
          console.log(
            "fetchSheetDataFromURL: Первые 100 символов через прокси:",
            csvText.substring(0, 100)
          );

          // Проверка наличия содержимого
          if (!csvText || csvText.trim() === "") {
            throw new Error("Получены пустые данные через прокси");
          }

          console.log(
            "fetchSheetDataFromURL: Успешно получены данные через прокси"
          );
          return parseCSV(csvText);
        } catch (proxyError) {
          console.error(
            `Ошибка при использовании прокси ${corsProxy}:`,
            proxyError
          );
          lastError = proxyError;
          // Продолжаем со следующим прокси
        }
      }

      // Если все прокси не сработали, выбрасываем последнюю ошибку
      throw lastError;
    }
  } catch (error) {
    console.error("Ошибка при загрузке данных из Google Sheets:", error);

    // Вместо возврата моковых данных возвращаем пустой массив и логируем ошибку подробно
    console.log(
      "fetchSheetDataFromURL: Ошибка загрузки данных. Возвращаем пустой массив.",
      error instanceof Error ? error.message : "Неизвестная ошибка"
    );
    return [];
  }
}

/**
 * Преобразует CSV текст в массив объектов
 * @param csvText CSV текст
 * @returns Массив объектов, где ключи - заголовки столбцов
 */
function parseCSV(csvText: string): any[] {
  console.log("parseCSV: Начало парсинга CSV");

  try {
    // Разбиваем текст на строки
    const lines = csvText.split("\n");
    console.log("parseCSV: Найдено строк:", lines.length);

    if (lines.length === 0) {
      console.error("parseCSV: CSV не содержит строк");
      return [];
    }

    // Сначала проверяем, не является ли это данными из диапазона ячеек H2:H4
    if (lines.length <= 4) {
      // Проверяем, похоже ли это на диапазон ячеек H2:H4
      const cellPattern = /^(H\d+)$|^"?(H\d+)"?$/;
      const cellValues = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Если это одиночное значение, проверяем, является ли оно ячейкой H2, H3 или H4
        if (/^H[2-4]$/.test(line)) {
          // Это просто идентификатор ячейки
          cellValues.push({
            id: line,
            value: "",
          });
        } else {
          // Это может быть значение в ячейке
          const match = line.match(/^(?:"([^"]*)"|([\d.]+))$/);
          if (match) {
            const cellId = `H${i + 2}`; // H2, H3, H4
            const value = match[1] !== undefined ? match[1] : match[2];
            cellValues.push({
              id: cellId,
              value: value,
            });
          }
        }
      }

      // Если нашли хотя бы одну ячейку, считаем что это формат H2:H4
      if (cellValues.length > 0) {
        console.log(
          "parseCSV: Обнаружен формат диапазона ячеек H2:H4:",
          cellValues
        );

        // Добавляем имена для Production и Staging
        return cellValues.map((cell) => {
          if (cell.id === "H2") {
            return { ...cell, name: "Production" };
          } else if (cell.id === "H3") {
            return { ...cell, name: "Staging" };
          } else if (cell.id === "H4") {
            return { ...cell, name: "Total" };
          }
          return cell;
        });
      }
    }

    // Стандартная обработка CSV с заголовками
    // Первая строка содержит заголовки
    const headers = lines[0]
      .split(",")
      .map((header) => header.trim().replace(/^"|"$/g, ""));

    console.log("parseCSV: Найдены заголовки:", headers);

    // Если заголовки не распознаны, создаём стандартные заголовки
    if (headers.length < 3 || headers.some((h) => !h)) {
      console.log(
        "parseCSV: Используем стандартные заголовки Дата,Спринт,Баги"
      );
      return createDataWithDefaultHeaders(lines);
    }

    // Обработка заголовков из таблицы на скриншоте
    const mappedHeaders = headers.map((header) => {
      // Преобразуем заголовки для соответствия ожиданиям компонентов
      if (header === "Дата отчета") return "Дата";
      if (header === "Sprint") return "Спринт";
      if (header === "Кол-во багов в бэклоге (всего)") return "Баги";
      return header;
    });

    // Массив для хранения результатов
    const result = [];

    // Проходим по всем строкам, кроме заголовка
    for (let i = 1; i < lines.length; i++) {
      // Пропускаем пустые строки
      if (!lines[i].trim()) continue;

      // Создаем объект для текущей строки
      const obj: Record<string, string> = {};

      // Разбиваем строку на ячейки с учетом кавычек
      const cells = parseCSVLine(lines[i]);

      // Заполняем объект значениями
      mappedHeaders.forEach((header, j) => {
        if (j < cells.length) {
          // Очищаем значение от кавычек
          obj[header] = cells[j].trim().replace(/^"|"$/g, "");
        } else {
          obj[header] = "";
        }
      });

      // Добавляем объект в результат
      result.push(obj);
    }

    console.log("parseCSV: Успешно разобрано записей:", result.length);
    return result;
  } catch (error) {
    console.error("parseCSV: Ошибка при парсинге CSV:", error);
    return [];
  }
}

// Более надежный парсер строки CSV с учетом кавычек
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentValue = "";

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Переключаем состояние кавычек
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      // Если встретили запятую вне кавычек, завершаем текущее значение
      result.push(currentValue);
      currentValue = "";
    } else {
      // Добавляем символ к текущему значению
      currentValue += char;
    }
  }

  // Добавляем последнее значение
  result.push(currentValue);

  return result;
}

// Создает данные с стандартными заголовками, если не удалось распознать их из CSV
function createDataWithDefaultHeaders(lines: string[]): any[] {
  const result = [];

  // Используем стандартные заголовки
  const headers = ["Дата", "Спринт", "Баги"];

  // Обрабатываем все строки, предполагая что они содержат данные
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const cells = parseCSVLine(lines[i]);

    if (cells.length < 3) continue;

    result.push({
      [headers[0]]: cells[0].trim().replace(/^"|"$/g, ""),
      [headers[1]]: cells[1].trim().replace(/^"|"$/g, ""),
      [headers[2]]: cells[2].trim().replace(/^"|"$/g, ""),
    });
  }

  return result;
}

/**
 * Альтернативный метод для получения данных из Google таблицы через API
 * Использует более надежный подход через Google Visualization API
 * @param spreadsheetId ID таблицы
 * @param sheetName Имя листа
 * @param range Диапазон ячеек (например, "H2:H4")
 * @returns Массив объектов с данными
 */
export async function fetchGoogleSheetData(
  spreadsheetId: string,
  sheetName: string = "Sheet1",
  range: string = ""
): Promise<any[]> {
  try {
    console.log("fetchGoogleSheetData: Начало загрузки данных");

    // Формируем запрос к Google Visualization API
    let url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?`;

    // Добавляем параметры запроса
    const params = new URLSearchParams();
    params.append("sheet", sheetName);
    if (range) {
      params.append("range", range);
    }
    // Запрашиваем данные в формате JSON
    params.append("tqx", "out:json");

    url += params.toString();

    console.log("fetchGoogleSheetData: URL запроса:", url);

    // Выполняем запрос
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/javascript, */*",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ошибка: ${response.status}`);
    }

    // Получаем текст ответа
    const responseText = await response.text();

    // Ответ приходит в формате JSON с префиксом "google.visualization.Query.setResponse("
    // Нужно очистить этот префикс и закрывающую скобку в конце
    const jsonText = responseText.replace(
      /^.*?google\.visualization\.Query\.setResponse\((.*)\);?$/,
      "$1"
    );

    // Парсим JSON
    const jsonData = JSON.parse(jsonText);

    // Проверяем, что API вернул успешный ответ
    if (jsonData.status !== "ok") {
      throw new Error(
        `API ошибка: ${jsonData.errors?.[0]?.message || "Неизвестная ошибка"}`
      );
    }

    // Извлекаем данные из таблицы
    const table = jsonData.table;
    const headers = table.cols.map((col: any) => col.label || col.id);

    console.log("fetchGoogleSheetData: Получены заголовки:", headers);

    // Преобразуем данные в массив объектов
    const result = [];

    // Обработка ячеек в диапазоне H2:H4
    if (
      range &&
      range.toUpperCase().startsWith("H2") &&
      table.rows.length <= 3
    ) {
      for (let i = 0; i < table.rows.length; i++) {
        const row = table.rows[i];
        const value = row.c?.[0]?.v?.toString() || "";
        const cellId = `H${i + 2}`; // H2, H3, H4

        // Создаем объект с id и value
        const cellData: any = { id: cellId, value };

        // Добавляем имя для Production и Staging
        if (cellId === "H2") {
          cellData.name = "Production";
        } else if (cellId === "H3") {
          cellData.name = "Staging";
        } else if (cellId === "H4") {
          cellData.name = "Total";
        }

        result.push(cellData);
      }
    } else {
      // Стандартная обработка табличных данных
      for (let i = 0; i < table.rows.length; i++) {
        const row = table.rows[i];
        const rowData: Record<string, any> = {};

        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          const cell = row.c?.[j];
          rowData[header] = cell?.v || "";
        }

        result.push(rowData);
      }
    }

    console.log(
      "fetchGoogleSheetData: Успешно получено записей:",
      result.length
    );
    return result;
  } catch (error) {
    console.error("fetchGoogleSheetData: Ошибка при загрузке данных:", error);
    return [];
  }
}
