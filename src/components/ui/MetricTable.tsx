'use client';

import React from 'react';
import { MetricItem, TableColumn } from '@/types/metrics';

interface MetricTableProps {
  data: MetricItem[];
  columns?: TableColumn[];
  showTotal?: boolean;
}

const DEFAULT_COLUMNS: TableColumn[] = [
  { key: 'label', title: 'Название', align: 'left' },
  { key: 'count', title: 'Количество', align: 'right' },
  {
    key: 'percentage',
    title: '%',
    align: 'right',
    format: (value: unknown) => `${(value as number).toFixed(2)}%`,
  },
];

const MetricTable: React.FC<MetricTableProps> = ({
  data,
  columns = DEFAULT_COLUMNS,
  showTotal = true,
}) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const getValue = (item: MetricItem, column: TableColumn): string => {
    const value = item[column.key as keyof MetricItem];
    if (column.format) {
      return column.format(value, item);
    }
    return String(value ?? '');
  };

  const getAlignment = (align?: string): string => {
    switch (align) {
      case 'right':
        return 'text-right';
      case 'center':
        return 'text-center';
      default:
        return 'text-left';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${getAlignment(
                  col.align
                )}`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-6 py-2 whitespace-nowrap text-sm text-gray-900 ${getAlignment(
                    col.align
                  )}`}
                >
                  {getValue(item, col)}
                </td>
              ))}
            </tr>
          ))}
          {showTotal && (
            <tr className="bg-gray-100 font-medium">
              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                Всего
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                {total}
              </td>
              {columns.length > 2 && (
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                  100.00%
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MetricTable;
