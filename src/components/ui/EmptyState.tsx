'use client';

import React from 'react';

interface EmptyStateProps {
  message?: string;
  filter?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'Нет данных для отображения',
  filter,
}) => {
  return (
    <div className="p-8 text-center text-gray-500">
      <p>{message}</p>
      {filter && filter !== 'all' && (
        <p className="text-sm mt-1">(фильтр: {filter})</p>
      )}
    </div>
  );
};

export default EmptyState;
