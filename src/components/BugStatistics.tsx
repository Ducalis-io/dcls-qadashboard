'use client';

import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  BarElement,
  ArcElement
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Интерфейс для данных о багах
interface BugData {
  date: string;
  open: number;
  closed: number;
  critical: number;
  major: number;
  minor: number;
}

// Интерфейс для пропсов компонента
interface BugStatisticsProps {
  data: BugData[];
}

const BugStatistics: React.FC<BugStatisticsProps> = ({ data }) => {
  // Подготовка данных для линейного графика (открытые/закрытые баги по времени)
  const lineChartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Открытые баги',
        data: data.map(item => item.open),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Закрытые баги',
        data: data.map(item => item.closed),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };
  
  // Подготовка данных для круговой диаграммы (распределение по серьезности)
  const pieChartData = {
    labels: ['Критические', 'Серьезные', 'Незначительные'],
    datasets: [
      {
        data: [
          data.reduce((sum, item) => sum + item.critical, 0),
          data.reduce((sum, item) => sum + item.major, 0),
          data.reduce((sum, item) => sum + item.minor, 0),
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(75, 192, 192)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {/* График открытых/закрытых багов с течением времени */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Динамика багов</h3>
        <Line 
          data={lineChartData} 
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                display: true,
                text: 'Открытые и закрытые баги',
              },
            },
          }} 
        />
      </div>
      
      {/* Диаграмма распределения багов по серьезности */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Распределение по серьезности</h3>
        <Pie 
          data={pieChartData} 
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top' as const,
              },
            },
          }} 
        />
      </div>
    </div>
  );
};

export default BugStatistics; 