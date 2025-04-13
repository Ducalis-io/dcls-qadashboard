'use client';

import React from 'react';

// Простой компонент загрузки
export const Spinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-800"></div>
      <span className="sr-only">Загрузка...</span>
    </div>
  );
};

export default Spinner; 