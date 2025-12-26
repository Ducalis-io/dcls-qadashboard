/**
 * Получение Cloud ID для Jira
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function getCloudId() {
  const host = process.env.JIRA_HOST;

  console.log('Получение Cloud ID...');
  console.log(`Host: ${host}`);
  console.log('');

  // Метод 1: tenant_info (не требует авторизации)
  console.log('Метод 1: GET /_edge/tenant_info');
  try {
    const response = await fetch(`${host}/_edge/tenant_info`);

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Успешно!');
      console.log(`Cloud ID: ${data.cloudId}`);
      console.log('');
      console.log('Добавьте в .env.local:');
      console.log(`JIRA_CLOUD_ID=${data.cloudId}`);
      return data.cloudId;
    } else {
      const text = await response.text();
      console.log('❌ Ошибка:', text);
    }
  } catch (error) {
    console.log('❌ Ошибка запроса:', error);
  }

  console.log('');

  // Метод 2: OAuth accessible-resources (требует OAuth токен)
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (email && token) {
    console.log('Метод 2: GET /oauth/token/accessible-resources');
    console.log('(Этот метод работает только с OAuth токенами, не с API токенами)');

    const auth = Buffer.from(`${email}:${token}`).toString('base64');

    try {
      const response = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      });

      console.log(`Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Успешно!');
        console.log('Доступные ресурсы:', data);
        if (data.length > 0) {
          console.log(`Cloud ID: ${data[0].id}`);
        }
      } else {
        const text = await response.text();
        console.log('❌ Ошибка:', text);
        console.log('(Ожидаемо - API токены не работают с этим endpoint)');
      }
    } catch (error) {
      console.log('❌ Ошибка запроса:', error);
    }
  }
}

getCloudId().catch(console.error);
