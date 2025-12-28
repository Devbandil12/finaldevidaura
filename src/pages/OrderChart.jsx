import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { TrendingUp } from 'lucide-react';

const OrderChart = ({ orders }) => {
  // 1. Group Data
  const processedData = orders.reduce((acc, order) => {
    const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (!acc[date]) {
      acc[date] = { Delivered: 0, Shipped: 0, Processing: 0, Cancelled: 0 };
    }

    const statusMap = {
      'Delivered': 'Delivered',
      'Shipped': 'Shipped',
      'Order Placed': 'Processing',
      'Processing': 'Processing',
      'Order Cancelled': 'Cancelled'
    };

    const mappedStatus = statusMap[order.status] || 'Processing';
    acc[date][mappedStatus] = (acc[date][mappedStatus] || 0) + 1;
    
    return acc;
  }, {});

  const labels = Object.keys(processedData); // Dates are automatically sorted by insertion if processed chronologically

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Delivered',
        data: labels.map(d => processedData[d].Delivered),
        backgroundColor: '#10B981', // Emerald
        borderRadius: 4,
      },
      {
        label: 'Shipped',
        data: labels.map(d => processedData[d].Shipped),
        backgroundColor: '#3B82F6', // Blue
        borderRadius: 4,
      },
      {
        label: 'Processing',
        data: labels.map(d => processedData[d].Processing),
        backgroundColor: '#F59E0B', // Amber
        borderRadius: 4,
      },
      {
        label: 'Cancelled',
        data: labels.map(d => processedData[d].Cancelled),
        backgroundColor: '#EF4444', // Red
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#111827',
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, grid: { color: '#F3F4F6' } },
    },
  };

  return (
    <div className="h-80 w-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="text-gray-500" size={20} /> Order Volume
        </h3>
      </div>
      <div className="flex-1 relative min-h-0">
        <Bar data={chartData} options={options} updateMode="resize" />
      </div>
    </div>
  );
};

export default OrderChart;