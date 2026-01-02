import type { NextConfig } from "next";

const isCloudflareMode = process.env.NEXT_PUBLIC_DATA_SOURCE === 'cloudflare';

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

  // В cloudflare режиме игнорируем отсутствующие локальные данные
  webpack: isCloudflareMode
    ? (config, { webpack }) => {
        // Игнорируем модули из @/data/ в cloudflare режиме
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^@\/data\//,
          })
        );
        return config;
      }
    : undefined,
};

export default nextConfig;
