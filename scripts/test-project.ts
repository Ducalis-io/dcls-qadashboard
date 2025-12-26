/**
 * Тест доступа к конкретному проекту DCLS
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testProject() {
  const host = process.env.JIRA_HOST;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  const auth = Buffer.from(`${email}:${token}`).toString('base64');

  console.log('Тестирование доступа к проекту DCLS...');
  console.log('');

  // Тест 1: Получить конкретный проект
  console.log('Тест 1: GET /rest/api/3/project/DCLS');
  try {
    const response = await fetch(`${host}/rest/api/3/project/DCLS`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Успешно!');
      console.log(`Проект: ${data.key} - ${data.name}`);
      console.log(`ID: ${data.id}`);
      console.log('');
    } else {
      const text = await response.text();
      console.log('❌ Ошибка:', text);
      console.log('');
    }
  } catch (error) {
    console.log('❌ Ошибка запроса:', error);
    console.log('');
  }

  // Тест 2: Поиск багов в проекте DCLS
  console.log('Тест 2: POST /rest/api/3/search (JQL: project=DCLS AND issuetype=Bug)');
  try {
    const response = await fetch(`${host}/rest/api/3/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        jql: 'project = DCLS AND issuetype = Bug',
        maxResults: 5,
        fields: ['summary', 'status', 'created', 'priority'],
      }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Успешно!');
      console.log(`Найдено багов: ${data.total}`);
      if (data.issues && data.issues.length > 0) {
        console.log('Первые 5 багов:');
        data.issues.forEach((issue: any) => {
          console.log(`  - ${issue.key}: ${issue.fields.summary}`);
        });
      }
      console.log('');
    } else {
      const text = await response.text();
      console.log('❌ Ошибка:', text);
      console.log('');
    }
  } catch (error) {
    console.log('❌ Ошибка запроса:', error);
    console.log('');
  }

  // Тест 3: Получить все проекты с параметрами
  console.log('Тест 3: GET /rest/api/3/project/search');
  try {
    const response = await fetch(`${host}/rest/api/3/project/search`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Успешно!');
      console.log(`Найдено проектов: ${data.total || data.values?.length || 0}`);
      if (data.values && data.values.length > 0) {
        console.log('Проекты:');
        data.values.forEach((p: any) => {
          console.log(`  - ${p.key}: ${p.name}`);
        });
      }
      console.log('');
    } else {
      const text = await response.text();
      console.log('❌ Ошибка:', text);
      console.log('');
    }
  } catch (error) {
    console.log('❌ Ошибка запроса:', error);
    console.log('');
  }

  // Тест 4: Получить доски для проекта
  console.log('Тест 4: GET /rest/agile/1.0/board?projectKeyOrId=DCLS');
  try {
    const response = await fetch(`${host}/rest/agile/1.0/board?projectKeyOrId=DCLS`, {
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
        console.log('Доски:');
        data.values.forEach((b: any) => {
          console.log(`  - ID: ${b.id}, Name: ${b.name}, Type: ${b.type}`);
        });
      }
      console.log('');
    } else {
      const text = await response.text();
      console.log('❌ Ошибка:', text);
      console.log('');
    }
  } catch (error) {
    console.log('❌ Ошибка запроса:', error);
  }
}

testProject().catch(console.error);
