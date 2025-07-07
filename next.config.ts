import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Включаем статический экспорт только для продакшена
  output: process.env.NODE_ENV === "production" ? "export" : undefined,

  // Отключаем оптимизацию изображений для статического экспорта
  images: {
    unoptimized: true,
  },

  // Базовый путь для GitHub Pages (только в продакшене)
  basePath: process.env.NODE_ENV === "production" ? "/dcls-qadashboard" : "",

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
