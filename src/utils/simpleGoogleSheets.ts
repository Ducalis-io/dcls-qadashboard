/**
 * Упрощенная функция для загрузки данных из публичной Google таблицы
 */

/**
 * Простая функция для загрузки CSV данных из Google Sheets
 * @param url Публичный URL Google Sheets в формате CSV
 * @returns Массив объектов с данными
 */
export async function fetchGoogleSheetsCSV(
  url: string
): Promise<Record<string, string>[]> {
  try {
    console.log("Загрузка данных из:", url);

    // Пробуем загрузить данные напрямую
    const response = await fetch(url, {
      method: "GET",
      mode: "cors", // Пробуем с CORS
      cache: "no-cache",
      headers: {
        Accept: "text/csv, text/plain, */*",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log("Получен CSV:", csvText.substring(0, 200) + "...");

    return parseSimpleCSV(csvText);
  } catch (error) {
    console.error("Ошибка загрузки из Google Sheets:", error);

    // Если не получается загрузить, возвращаем пустой массив
    return [];
  }
}

/**
 * Простой парсер CSV
 * @param csvText CSV текст
 * @returns Массив объектов
 */
function parseSimpleCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split("\n");

  if (lines.length < 2) {
    console.log("CSV содержит меньше 2 строк");
    return [];
  }

  // Первая строка - заголовки
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
  console.log("Найдены заголовки:", headers);

  const result: Record<string, string>[] = [];

  // Остальные строки - данные
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((v) => v.replace(/"/g, "").trim());

    if (values.length >= headers.length) {
      const row: Record<string, string> = {};

      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] || "";
      }

      result.push(row);
    }
  }

  console.log("Обработано строк данных:", result.length);
  return result;
}
