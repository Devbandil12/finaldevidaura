import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const OrderChart = ({ delivered, pending, cancelled }) => {
  const data = {
    labels: ['Delivered', 'Pending', 'Cancelled'],
    datasets: [
      {
        data: [delivered, pending, cancelled],
        backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
        hoverBackgroundColor: ['#218838', '#e0a800', '#c82333'],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem) {
            let label = tooltipItem.label || '';
            if (label) {
              label += ': ';
            }
            label += tooltipItem.raw;
            return label;
          }
        }
      }
    }
  };

  return <Pie data={data} options={options} />;
};

export default OrderChart;
