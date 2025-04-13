import {
  fetchSheetDataFromURL,
  fetchGoogleSheetData,
} from "@/utils/googleSheets";

// Кэш для хранения данных с временем жизни
interface CacheItem {
  data: any[];
  timestamp: number;
}

// Кэш данных
const dataCache: Record<string, CacheItem> = {};

// Время жизни кэша в миллисекундах (5 минут)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Загружает данные из Google Sheets с кэшированием
 * @param url URL Google Sheets в формате CSV
 * @returns Массив объектов с данными
 */
export async function loadSheetData(url: string): Promise<any[]> {
  try {
    // Проверяем наличие данных в кэше и их актуальность
    const cached = dataCache[url];
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL) {
      console.log("Используются кэшированные данные");
      return cached.data;
    }

    // Если данных нет в кэше или они устарели, загружаем и сохраняем
    console.log("Загрузка свежих данных из таблицы");
    const data = await fetchSheetDataFromURL(url);

    // Сохраняем в кэш
    dataCache[url] = {
      data,
      timestamp: now,
    };

    return data;
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    return [];
  }
}

/**
 * Обрабатывает данные о спринтах
 * @param data Исходные данные
 * @returns Обработанные данные о спринтах
 */
export function processSprintData(data: any[]) {
  // Проверяем, что данные существуют
  if (!data || data.length === 0) {
    console.log("processSprintData: Нет данных для обработки");
    return [];
  }

  console.log("processSprintData: Обработка данных, первая запись:", data[0]);

  // Проверяем формат данных и выбираем стратегию обработки
  const firstRow = data[0];
  const keys = Object.keys(firstRow);

  // Формат 1: Таблица с колонками "Дата отчета", "Sprint", "Кол-во багов в бэклоге (всего)"
  if (
    firstRow["Дата отчета"] !== undefined &&
    firstRow["Sprint"] !== undefined &&
    firstRow["Кол-во багов в бэклоге (всего)"] !== undefined
  ) {
    console.log(
      "processSprintData: Используется формат с Дата отчета, Sprint, Кол-во багов в бэклоге"
    );
    return data.map((item) => ({
      sprint: item["Sprint"] || "",
      date: item["Дата отчета"] || "",
      backlogBugs: parseInt(item["Кол-во багов в бэклоге (всего)"] || "0"),
    }));
  }

  // Формат 2: Таблица с колонками "Дата", "Спринт", "Баги"
  if (
    firstRow["Дата"] !== undefined &&
    firstRow["Спринт"] !== undefined &&
    firstRow["Баги"] !== undefined
  ) {
    console.log("processSprintData: Используется формат с Дата, Спринт, Баги");
    return data.map((item) => ({
      sprint: item["Спринт"] || "",
      date: item["Дата"] || "",
      backlogBugs: parseInt(item["Баги"] || "0"),
    }));
  }

  // Формат 3: Таблица со стандартными полями Type="Sprint"
  if (keys.includes("Type") && keys.includes("ID") && keys.includes("Name")) {
    console.log("processSprintData: Используется формат с Type, ID, Name");
    return data
      .filter((item) => item.Type === "Sprint")
      .map((item) => ({
        sprint: item.Name || "",
        date: item.StartDate || "",
        backlogBugs: parseInt(item.BugCount || item.ID || "0"),
      }));
  }

  // Формат 4: Любой другой формат - используем первые 3 колонки
  console.log(
    "processSprintData: Используются первые 3 колонки:",
    keys.slice(0, 3)
  );
  return data
    .map((item) => {
      // Получаем первые три ключа
      const dateKey = keys[0] || "";
      const sprintKey = keys[1] || "";
      const bugsKey = keys[2] || "";

      return {
        sprint: item[sprintKey] || "",
        date: item[dateKey] || "",
        backlogBugs: parseInt(item[bugsKey] || "0"),
      };
    })
    .filter((item) => item.sprint && !isNaN(item.backlogBugs));
}

/**
 * Обрабатывает данные о тестовых окружениях
 * @param data Исходные данные
 * @returns Обработанные данные о окружениях
 */
export const processEnvironmentData = (data: any[]) => {
  // Проверяем, есть ли данные
  if (!data || data.length === 0) {
    return [];
  }

  // Сначала проверяем, есть ли ячейки H2, H3, H4 в данных
  const h2Cell = data.find(
    (row) => row.id === "H2" || (row.ID && row.ID === "H2")
  );
  const h3Cell = data.find(
    (row) => row.id === "H3" || (row.ID && row.ID === "H3")
  );
  const h4Cell = data.find(
    (row) => row.id === "H4" || (row.ID && row.ID === "H4")
  );

  // Если нашли хотя бы H2 или H3, используем этот формат
  if (h2Cell || h3Cell) {
    console.log("processEnvironmentData: Используются ячейки H2, H3, H4");

    const result = [];

    // Добавляем Production из H2
    if (h2Cell) {
      const prodValue =
        h2Cell.value || h2Cell.Value || h2Cell.bugCount || h2Cell.id;
      result.push({
        name: "Production",
        bugCount: parseInt(prodValue) || 0,
        id: "H2",
      });
    }

    // Добавляем Staging из H3
    if (h3Cell) {
      const stageValue =
        h3Cell.value || h3Cell.Value || h3Cell.bugCount || h3Cell.id;
      result.push({
        name: "Staging",
        bugCount: parseInt(stageValue) || 0,
        id: "H3",
      });
    }

    return result;
  }

  // Иначе ищем колонки по их названиям
  const headers = Object.keys(data[0]);

  // Получаем индексы нужных колонок
  const prodColumnName = headers.find((h) => h.toLowerCase().includes("prod"));
  const stageColumnName = headers.find((h) => h.toLowerCase().includes("stag"));

  // Если не найдены нужные колонки, возвращаем пустой массив
  if (!prodColumnName || !stageColumnName) {
    console.warn("Не найдены колонки для prod или stage в данных");
    return [];
  }

  // Преобразуем данные в нужный формат
  // Берем только строки с непустыми значениями в нужных колонках
  const validRows = data.filter((row) => {
    const prodValue =
      row[prodColumnName] !== undefined ? parseInt(row[prodColumnName]) : 0;
    const stageValue =
      row[stageColumnName] !== undefined ? parseInt(row[stageColumnName]) : 0;
    return !isNaN(prodValue) || !isNaN(stageValue);
  });

  // Если нет валидных строк, возвращаем пустой массив
  if (validRows.length === 0) {
    return [];
  }

  // Получаем суммы багов для prod и stage
  const sumProd = validRows.reduce((sum, row) => {
    const value = parseInt(row[prodColumnName]);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

  const sumStage = validRows.reduce((sum, row) => {
    const value = parseInt(row[stageColumnName]);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

  // Создаем результат в формате, который ожидает компонент
  const result = [
    {
      name: "Production",
      bugCount: sumProd,
      id: sumProd.toString(),
    },
    {
      name: "Staging",
      bugCount: sumStage,
      id: sumStage.toString(),
    },
  ];

  // Если оба значения равны 0, возвращаем пустой массив
  if (sumProd === 0 && sumStage === 0) {
    return [];
  }

  return result;
};

/**
 * Обрабатывает данные о компонентах
 * @param data Исходные данные
 * @returns Обработанные данные о компонентах
 */
export function processComponentData(data: any[]) {
  return data
    .filter((item) => item.Type === "Component")
    .map((item) => ({
      id: item.ID || "",
      name: item.Name || "",
      status: item.Status || "Unknown",
      version: item.Version || "",
    }));
}

/**
 * Получает данные о спринтах
 * @param url URL Google Sheets
 * @returns Массив объектов с данными о спринтах
 */
export async function getSprintData(url: string) {
  const data = await loadSheetData(url);
  return processSprintData(data);
}

/**
 * Получает данные о тестовых окружениях
 * @param url URL Google Sheets
 * @returns Массив объектов с данными о окружениях
 */
export async function getEnvironmentData(url: string) {
  const data = await loadSheetData(url);
  return processEnvironmentData(data);
}

/**
 * Получает данные о компонентах
 * @param url URL Google Sheets
 * @returns Массив объектов с данными о компонентах
 */
export async function getComponentData(url: string) {
  const data = await loadSheetData(url);
  return processComponentData(data);
}

/**
 * Получает все категории данных
 * @param url URL Google Sheets
 * @returns Объект с категоризированными данными
 */
export async function getAllData(url: string) {
  const data = await loadSheetData(url);
  return {
    sprints: processSprintData(data),
    environments: processEnvironmentData(data),
    components: processComponentData(data),
  };
}

/**
 * Получает данные о тестовых окружениях через Visualization API
 * @param spreadsheetId ID Google таблицы
 * @param sheetName Имя листа (по умолчанию "Sheet1")
 * @returns Массив объектов с данными о окружениях
 */
export async function getEnvironmentDataFromAPI(
  spreadsheetId: string,
  sheetName: string = "Sheet1"
): Promise<any[]> {
  try {
    // Получаем данные из ячеек H2, H3, H4
    const data = await fetchGoogleSheetData(spreadsheetId, sheetName, "H2:H4");

    console.log("getEnvironmentDataFromAPI: Получены данные:", data);

    if (!data || data.length === 0) {
      return [];
    }

    // Преобразуем данные в формат для компонента
    const formattedData = data
      .map((item) => {
        // Пропускаем Total, нужны только Production и Staging
        if (item.id === "H4") return null;

        // Создаем объекты для Production и Staging с нужными полями
        return {
          name: item.name,
          bugCount: parseInt(item.value) || 0,
          id: item.id,
        };
      })
      .filter(Boolean); // Удаляем null элементы

    return formattedData;
  } catch (error) {
    console.error(
      "getEnvironmentDataFromAPI: Ошибка при загрузке данных:",
      error
    );
    return [];
  }
}
