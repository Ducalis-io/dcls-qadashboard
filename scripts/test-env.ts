/**
 * Тест парсинга .env.local
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('Проверка переменных окружения:');
console.log('='.repeat(60));
console.log('');

console.log('JIRA_HOST:');
console.log(`  Значение: "${process.env.JIRA_HOST}"`);
console.log(`  Длина: ${process.env.JIRA_HOST?.length} символов`);
console.log('');

console.log('JIRA_EMAIL:');
console.log(`  Значение: "${process.env.JIRA_EMAIL}"`);
console.log(`  Длина: ${process.env.JIRA_EMAIL?.length} символов`);
console.log(`  Содержит @: ${process.env.JIRA_EMAIL?.includes('@')}`);
console.log('');

console.log('JIRA_API_TOKEN:');
console.log(`  Первые 20 символов: "${process.env.JIRA_API_TOKEN?.substring(0, 20)}..."`);
console.log(`  Последние 20 символов: "...${process.env.JIRA_API_TOKEN?.substring(process.env.JIRA_API_TOKEN.length - 20)}"`);
console.log(`  Длина: ${process.env.JIRA_API_TOKEN?.length} символов`);
console.log('');

// Проверяем Basic Auth
const email = process.env.JIRA_EMAIL || '';
const token = process.env.JIRA_API_TOKEN || '';

console.log('Basic Auth строка (до кодирования):');
console.log(`  "${email}:${token.substring(0, 20)}..."`);
console.log('');

const auth = Buffer.from(`${email}:${token}`).toString('base64');
console.log('Basic Auth (закодировано):');
console.log(`  Первые 80 символов: ${auth.substring(0, 80)}...`);
console.log(`  Общая длина: ${auth.length} символов`);
