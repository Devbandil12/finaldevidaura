// src/Components/OrderChart.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const OrderChart = ({ orders }) => {
  // 1. Process the orders to group them by date and status
  const processedData = orders.reduce((acc, order) => {
    const date = new Date(order.createdAt).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { 'Order Placed': 0, 'Processing': 0, 'Shipped': 0, 'Delivered': 0, 'Order Cancelled': 0 };
    }
    // Increment the count for the order's status on that date
    if (acc[date][order.status] !== undefined) {
      acc[date][order.status]++;
    }
    return acc;
  }, {});

  // 2. Sort dates to ensure the chart displays chronologically
  const sortedDates = Object.keys(processedData).sort((a, b) => new Date(a) - new Date(b));

  // 3. Format the data for Chart.js
  const chartData = {
    labels: sortedDates,
    datasets: [
      {
        label: 'Delivered',
        data: sortedDates.map(date => processedData[date]['Delivered']),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Shipped',
        data: sortedDates.map(date => processedData[date]['Shipped']),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'Processing',
        data: sortedDates.map(date => processedData[date]['Processing'] + processedData[date]['Order Placed']), // Combine processing and placed
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
      },
      {
        label: 'Cancelled',
        data: sortedDates.map(date => processedData[date]['Order Cancelled']),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  const options = {
    plugins: {
      title: {
        display: true,
        text: 'Daily Order Status Trends',
      },
    },
    responsive: true,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };

  return <Bar options={options} data={chartData} />;
};

export default OrderChart;