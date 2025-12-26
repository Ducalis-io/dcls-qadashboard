/**
 * Тест авторизации в Jira
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testAuth() {
  const host = process.env.JIRA_HOST;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  console.log('Тестирование авторизации...');
  console.log(`Host: ${host}`);
  console.log(`Email: ${email}`);
  console.log(`Token length: ${token?.length} символов`);
  console.log('');

  // Создаём Basic Auth заголовок
  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  console.log(`Auth header (первые 50 символов): Basic ${auth.substring(0, 50)}...`);
  console.log('');

  // Тест 1: Проверка текущего пользователя
  console.log('Тест 1: GET /rest/api/3/myself');
  try {
    const response = await fetch(`${host}/rest/api/3/myself`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Успешно!');
      console.log(`Пользователь: ${data.displayName} (${data.emailAddress})`);
    } else {
      const text = await response.text();
      console.log('❌ Ошибка:', text);
    }
  } catch (error) {
    console.log('❌ Ошибка запроса:', error);
  }

  console.log('');

  // Тест 2: Получение проектов
  console.log('Тест 2: GET /rest/api/3/project');
  try {
    const response = await fetch(`${host}/rest/api/3/project`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Успешно!');
      console.log(`Найдено проектов: ${data.length}`);
      if (data.length > 0) {
        console.log('Первые 5 проектов:');
        data.slice(0, 5).forEach((p: any) => {
          console.log(`  - ${p.key}: ${p.name}`);
        });
      }
    } else {
      const text = await response.text();
      console.log('❌ Ошибка:', text);
    }
  } catch (error) {
    console.log('❌ Ошибка запроса:', error);
  }

  console.log('');

  // Тест 3: Получение досок
  console.log('Тест 3: GET /rest/agile/1.0/board');
  try {
    const response = await fetch(`${host}/rest/agile/1.0/board`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Успешно!');
      console.log(`Найдено досок: ${data.values?.length || 0}`);
      if (data.values && data.values.length > 0) {
        console.log('Первые 5 досок:');
        data.values.slice(0, 5).forEach((b: any) => {
          console.log(`  - ${b.id}: ${b.name} (${b.type})`);
        });
      }
    } else {
      const text = await response.text();
      console.log('❌ Ошибка:', text);
    }
  } catch (error) {
    console.log('❌ Ошибка запроса:', error);
  }
}

testAuth().catch(console.error);
