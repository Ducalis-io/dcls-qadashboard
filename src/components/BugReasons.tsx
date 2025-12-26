'use client';

import React, { useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import PeriodSelector from '@/components/PeriodSelector';
import TrendChart from '@/components/TrendChart';

ChartJS.register(ArcElement, Tooltip, Legend);

interface BugReasonData {
  reason: string;
  count: number;
  percentage: number;
  color: string;
}

interface BugReasonsProps {
  data: BugReasonData[];
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const BugReasons: React.FC<BugReasonsProps> = ({ data, selectedPeriod, onPeriodChange }) => {
  const [showTrend, setShowTrend] = useState(false);

  const chartData = {
    labels: data.map(item => item.reason),
    datasets: [{
      data: data.map(item => item.count),
      backgroundColor: data.map(item => item.color),
      borderColor: data.map(item => item.color.replace('0.8', '1')),
      borderWidth: 1,
    }],
  };

  const totalBugs = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-red-800">Причины возникновения багов</h3>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <button
                onClick={() => setShowTrend(false)}
                className={`px-2 py-1 text-xs rounded ${!showTrend ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                Pie
              </button>
              <button
                onClick={() => setShowTrend(true)}
                className={`px-2 py-1 text-xs rounded ${showTrend ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                Trend
              </button>
            </div>
            {onPeriodChange && selectedPeriod && !showTrend && (
              <PeriodSelector selectedPeriod={selectedPeriod} onPeriodChange={onPeriodChange} />
            )}
          </div>
        </div>
      </div>

      {showTrend ? (
        <div className="p-6">
          <TrendChart dataType="reasons" getLabelKey={(item) => item.reason} />
        </div>
      ) : (
        <>
          <div className="p-6">
            <div className="w-full max-w-md mx-auto h-64 relative">
              <Pie
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        usePointStyle: true,
                        generateLabels: (chart) => {
                          const data = chart.data;
                          if (data.labels?.length && data.datasets.length) {
                            return data.labels.map((label, i) => {
                              const dataset = data.datasets[0];
                              const value = dataset.data?.[i] as number;
                              const percentage = value / totalBugs * 100;
                              const bgColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i]?.toString() || '' : '';
                              const borderColor = Array.isArray(dataset.borderColor) ? dataset.borderColor[i]?.toString() || '' : '';
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
                        }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || '';
                          const value = context.raw as number;
                          const percentage = (value / totalBugs * 100).toFixed(1);
                          return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  },
                }}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Причина</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">кол-во</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, index) => (
                  <tr key={index} className="bg-yellow-50">
                    <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.reason}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{item.count}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{item.percentage.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-yellow-100">
                  <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 text-center">{totalBugs}</td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default BugReasons;
