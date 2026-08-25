import React, { useRef, useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Hook to dynamically extract computed CSS variables and trigger a canvas re-render on theme switch
const useChartTheme = () => {
  const chartRef = useRef(null);
  const [themeKey, setThemeKey] = useState(0);
  const [colors, setColors] = useState({
    surface: '#FFFFFF', text: '#161513', sub: '#5F5952', border: '#E5E1DB',
    success: '#10B981', warning: '#F59E0B', error: '#EF4444'
  });

  useEffect(() => {
    const updateColors = () => {
      if (!chartRef.current) return;
      const styles = getComputedStyle(chartRef.current);
      
      const getVal = (varName) => {
        let val = styles.getPropertyValue(varName).trim();
        if (!val) return undefined;
        // Auto-wrap raw Tailwind variables (e.g. "255 255 255" to "rgb(255, 255, 255)") if needed
        if (/^[\d\.]+\s+[\d\.]+%?\s+[\d\.]+%?$/.test(val)) {
            return val.includes('%') ? `hsl(${val})` : `rgb(${val.split(' ').join(', ')})`;
        }
        return val;
      };

      setColors({
        surface: getVal('--surface') || '#FFFFFF',
        text: getVal('--text') || '#161513',
        sub: getVal('--sub') || '#5F5952',
        border: getVal('--border') || '#E5E1DB',
        success: getVal('--success') || '#10B981',
        warning: getVal('--warning') || '#F59E0B',
        error: getVal('--error') || '#EF4444'
      });
      setThemeKey(prev => prev + 1);
    };

    updateColors();
    
    const observer = new MutationObserver(() => {
      // setTimeout ensures the browser has calculated the new computed styles
      setTimeout(updateColors, 10);
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    return () => {
      observer.disconnect();
    };
  }, []);

  return { chartRef, colors, themeKey };
};

const OrderChart = ({ delivered, pending, cancelled }) => {
  const { chartRef, colors, themeKey } = useChartTheme();

  const data = {
    labels: ['Delivered', 'Pending', 'Cancelled'],
    datasets: [
      {
        data: [delivered || 0, pending || 0, cancelled || 0],
        backgroundColor: [colors.success, colors.warning, colors.error],
        // Creates a beautiful negative-space cutout effect between the slices
        borderColor: colors.surface,
        borderWidth: 3, 
        // Dramatic pop-out effect on hover
        hoverOffset: 12, 
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 10 // Gives the hover effect room to breathe without getting clipped
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 24,
          color: colors.sub,
          font: {
            family: 'Manrope',
            size: 13,
            weight: '800', // Extra bold for that premium typographic feel
          }
        }
      },
      tooltip: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        titleColor: colors.text,
        bodyColor: colors.sub,
        padding: 16, // Plush, generous padding
        boxPadding: 8,
        cornerRadius: 16, // Softer, highly rounded corners for the Spatial UI vibe
        titleFont: {
          family: 'Manrope',
          size: 14,
          weight: '800',
        },
        bodyFont: {
          family: 'Manrope',
          size: 13,
          weight: '700',
        },
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

  return (
    <div 
      ref={chartRef} 
      className="relative w-full h-full min-h-[300px] flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
    >
      <Pie key={themeKey} data={data} options={options} />
    </div>
  );
};

export default OrderChart;