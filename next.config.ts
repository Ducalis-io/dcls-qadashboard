import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Комментируем настройки для деплоя, используем настройки для разработки
  // output: "export",

  // Отключаем оптимизацию изображений для статического экспорта
  images: {
    unoptimized: true,
  },

  // Базовый путь для GitHub Pages (отключаем для локальной разработки)
  // basePath: "/dcls-qadashboard",

  // Отключаем трейлинг слеш
  trailingSlash: true,

  // Отключаем ESLint при билде
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Отключаем TypeScript проверки при билде
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
