/**
 * Тест доступа через Cloud API с cloudId
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testCloudAPI() {
  const cloudId = process.env.JIRA_CLOUD_ID;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  const auth = Buffer.from(`${email}:${token}`).toString('base64');

  console.log('Тестирование Cloud API...');
  console.log(`Cloud ID: ${cloudId}`);
  console.log(`Base URL: https://api.atlassian.com/ex/jira/${cloudId}`);
  console.log('');

  // Тест 1: Получить проект DCLS
  console.log('Тест 1: GET /rest/api/3/project/DCLS');
  const projectUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project/DCLS`;
  console.log(`URL: ${projectUrl}`);

  try {
    const response = await fetch(projectUrl, {
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
    } else {
      const text = await response.text();
      console.log('❌ Ошибка:', text);
    }
  } catch (error) {
    console.log('❌ Ошибка запроса:', error);
  }

  console.log('');

  // Тест 2: Поиск проектов
  console.log('Тест 2: GET /rest/api/3/project/search');
  const searchUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project/search`;
  console.log(`URL: ${searchUrl}`);

  try {
    const response = await fetch(searchUrl, {
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
    } else {
      const text = await response.text();
      console.log('❌ Ошибка:', text);
    }
  } catch (error) {
    console.log('❌ Ошибка запроса:', error);
  }

  console.log('');

  // Тест 3: Поиск багов через новый API
  console.log('Тест 3: GET /rest/api/3/search/jql (project=DCLS AND issuetype=Bug)');
  const jqlUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search/jql`;
  const jqlParams = new URLSearchParams({
    jql: 'project = DCLS AND issuetype = Bug',
    maxResults: '5',
  });

  console.log(`URL: ${jqlUrl}?${jqlParams}`);

  try {
    const response = await fetch(`${jqlUrl}?${jqlParams}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Успешно!');
      console.log(`Найдено багов: ${data.total}`);
      if (data.issues && data.issues.length > 0) {
        console.log('Первые 5 багов:');
        data.issues.forEach((issue: any) => {
          console.log(`  - ${issue.key}: ${issue.fields?.summary || 'N/A'}`);
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

  // Тест 4: Получить доски
  console.log('Тест 4: GET /rest/agile/1.0/board');
  const boardUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/board`;
  console.log(`URL: ${boardUrl}`);

  try {
    const response = await fetch(boardUrl, {
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
    } else {
      const text = await response.text();
      console.log('❌ Ошибка:', text);
    }
  } catch (error) {
    console.log('❌ Ошибка запроса:', error);
  }
}

testCloudAPI().catch(console.error);
