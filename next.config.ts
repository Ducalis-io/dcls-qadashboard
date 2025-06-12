import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Включаем статический экспорт
  output: "export",

  // Отключаем оптимизацию изображений для статического экспорта
  images: {
    unoptimized: true,
  },

  // Базовый путь для GitHub Pages
  basePath: "/dcls-qadashboard",

  // Отключаем трейлинг слеш
  trailingSlash: true,
};

export default nextConfig;
