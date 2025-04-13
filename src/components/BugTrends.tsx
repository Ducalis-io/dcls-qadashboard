'use client';

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';

// Интерфейс для данных о тенденциях
interface TrendData {
  month: string;
  newBugs: number;
  resolvedBugs: number;
  reopenedBugs: number;
}

// Интерфейс для пропсов компонента
interface BugTrendsProps {
  data: TrendData[];
}

const BugTrends: React.FC<BugTrendsProps> = ({ data }) => {
  // Рассчитываем общий тренд: положительный если исправленных багов больше, чем новых
  const overallTrend = data.reduce(
    (acc, current) => acc + (current.resolvedBugs - current.newBugs), 
    0
  );

  // Рассчитываем средний показатель повторно открытых багов
  const avgReopenedBugs = data.reduce(
    (acc, current) => acc + current.reopenedBugs, 
    0
  ) / data.length;

  return (
    <div className="space-y-6 p-4">
      {/* Статистика трендов */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg shadow ${overallTrend >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <h3 className="text-lg font-medium mb-2">Общий тренд</h3>
          <p className={`text-2xl font-bold ${overallTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {overallTrend >= 0 ? 'Положительный' : 'Отрицательный'}
          </p>
          <p className="text-sm text-gray-600">
            {Math.abs(overallTrend)} {overallTrend >= 0 ? 'багов устранено' : 'новых багов'}
          </p>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Повторно открытые баги</h3>
          <p className="text-2xl font-bold text-amber-600">
            {avgReopenedBugs.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600">в среднем за период</p>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Эффективность</h3>
          <p className="text-2xl font-bold text-blue-600">
            {(data.reduce((acc, current) => acc + current.resolvedBugs, 0) / 
             (data.reduce((acc, current) => acc + current.newBugs, 0) || 1) * 100).toFixed(0)}%
          </p>
          <p className="text-sm text-gray-600">исправлено/обнаружено</p>
        </div>
      </div>
      
      {/* График трендов по месяцам */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Тренды по месяцам</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="newBugs" name="Новые баги" fill="#ff6384" />
              <Bar dataKey="resolvedBugs" name="Исправленные баги" fill="#36a2eb" />
              <Bar dataKey="reopenedBugs" name="Повторно открытые" fill="#ffce56" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BugTrends; 