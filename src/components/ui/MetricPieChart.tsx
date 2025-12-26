'use client';

import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem, Chart } from 'chart.js';
import { MetricItem } from '@/types/metrics';

ChartJS.register(ArcElement, Tooltip, Legend);

interface MetricPieChartProps {
  data: MetricItem[];
  height?: string;
}

const MetricPieChart: React.FC<MetricPieChartProps> = ({
  data,
  height = 'h-64',
}) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.count),
        backgroundColor: data.map((item) => item.color),
        borderColor: data.map((item) =>
          item.color.replace(/[\d.]+\)$/, '1)')
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          generateLabels: (chart: Chart) => {
            const chartData = chart.data;
            if (chartData.labels?.length && chartData.datasets.length) {
              return (chartData.labels as string[]).map((label: string, i: number) => {
                const dataset = chartData.datasets[0];
                const value = dataset.data?.[i] as number;
                const percentage = total > 0 ? (value / total) * 100 : 0;
                const bgColor = Array.isArray(dataset.backgroundColor)
                  ? dataset.backgroundColor[i]?.toString() || ''
                  : '';
                const borderColor = Array.isArray(dataset.borderColor)
                  ? dataset.borderColor[i]?.toString() || ''
                  : '';

                return {
                  text: `${label}\n${percentage.toFixed(1)}%`,
                  fillStyle: bgColor,
                  strokeStyle: borderColor,
                  lineWidth: 1,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const value = context.raw as number;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className={`w-full max-w-md mx-auto ${height} relative`}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default MetricPieChart;
