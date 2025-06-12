import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Включаем статический экспорт
  output: "export",

  // Отключаем оптимизацию изображений для статического экспорта
  images: {
    unoptimized: true,
  },

  // Отключаем трейлинг слеш
  trailingSlash: true,
};

export default nextConfig;
