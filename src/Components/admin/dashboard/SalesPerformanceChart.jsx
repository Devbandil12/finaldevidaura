import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, BarChart2, Layers } from 'lucide-react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(...registerables);

const fmt = (v) => {
  if (v >= 100000) return '₹' + (v / 100000).toFixed(1) + 'L';
  if (v >= 1000) return '₹' + (v / 1000).toFixed(1) + 'K';
  return '₹' + Math.round(v).toLocaleString('en-IN');
};

const useChartTheme = () => {
  const chartRef = useRef(null);
  const [themeKey, setThemeKey] = useState(0);
  const [colors, setColors] = useState({
    brand: '#0E0D0B', border: '#DDD5C8', surface: '#FBF8F3', 
    text: '#161513', sub: '#5F5952', muted: '#948B7F', 
    accent: '#B08D4A', accentSoft: '#EFE0C6', surfaceMuted: '#F9F9F9'
  });

  useEffect(() => {
    const updateColors = () => {
      const el = chartRef.current || document.documentElement;
      const styles = getComputedStyle(el);
      const getVal = (varName) => styles.getPropertyValue(varName).trim();

      setColors({
        brand: getVal('--brand') || '#0E0D0B',
        border: getVal('--border') || '#DDD5C8',
        surface: getVal('--surface') || '#FBF8F3',
        text: getVal('--text') || '#161513',
        sub: getVal('--sub') || '#5F5952',
        muted: getVal('--muted') || '#948B7F',
        accent: getVal('--accent') || '#B08D4A',
        accentSoft: getVal('--accent-soft') || '#EFE0C6',
        surfaceMuted: getVal('--surface-muted') || '#F9F9F9'
      });
      setThemeKey(prev => prev + 1);
    };

    updateColors();

    const observer = new MutationObserver(() => {
      // setTimeout ensures the browser has calculated the new computed styles
      setTimeout(updateColors, 10);
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, []);

  return { chartRef, colors, themeKey };
};

const SalesPerformanceChart = ({ chartData, hasTrend, comparisonLabel, timeRange }) => {
  const [mode, setMode] = useState('revenue'); // 'revenue' | 'orders' | 'both'
  const { chartRef, colors, themeKey } = useChartTheme();

  const labels = chartData?.labels || [];
  const revCurrent = chartData?.revenue || [];
  const revPrev = chartData?.prevRevenue || [];
  const volData = chartData?.volume || {};

  const ordersData = labels.map((_, i) =>
    (volData.Delivered?.[i] || 0) + (volData.Shipped?.[i] || 0) +
    (volData.Processing?.[i] || 0) + (volData.Cancelled?.[i] || 0)
  );

  const currentTotal = revCurrent.reduce((a, b) => a + b, 0);
  const prevTotal = revPrev.reduce((a, b) => a + b, 0);
  const pctChange = prevTotal > 0 && hasTrend ? ((currentTotal - prevTotal) / prevTotal) * 100 : null;

  const datasets = [];

  if (mode === 'revenue' || mode === 'both') {
    datasets.push({
      type: 'line',
      label: 'Revenue (Current)',
      data: revCurrent,
      borderColor: colors.brand,
      backgroundColor: colors.surfaceMuted,
      fill: mode === 'revenue',
      tension: 0.4,
      pointRadius: labels.length <= 10 ? 5 : 0,
      pointHoverRadius: 8,
      pointBackgroundColor: colors.surface,
      pointBorderColor: colors.brand,
      pointBorderWidth: 2,
      borderWidth: 3,
      yAxisID: 'yRevenue',
    });
    if (mode === 'both' && hasTrend) {
      datasets.push({
        type: 'line',
        label: 'Revenue (Previous)',
        data: revPrev,
        borderColor: colors.border,
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [5, 5],
        yAxisID: 'yRevenue',
      });
    }
  }

  if (mode === 'orders' || mode === 'both') {
    datasets.push({
      type: 'bar',
      label: 'Orders',
      data: ordersData,
      backgroundColor: colors.accent,
      borderColor: colors.surface,
      borderWidth: 2,
      borderRadius: 8,
      yAxisID: 'yOrders',
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        titleColor: colors.text,
        bodyColor: colors.sub,
        titleFont: { family: 'Manrope', weight: 'bold', size: 14 },
        bodyFont: { family: 'Manrope', size: 13 },
        padding: 16,
        boxPadding: 8,
        callbacks: {
          label: (ctx) => {
            if (ctx.dataset.yAxisID === 'yRevenue') return ` ${fmt(ctx.raw)}`;
            return ` ${ctx.raw} orders`;
          },
        },
      },
    },
    scales: {
      yRevenue: {
        display: mode !== 'orders',
        position: 'left',
        grid: { color: colors.border, drawBorder: false, borderDash: [4, 4] },
        border: { display: false },
        ticks: {
          callback: v => fmt(v),
          color: colors.sub,
          font: { family: 'Manrope', size: 12, weight: 'bold' },
          maxTicksLimit: 6,
          padding: 12,
        },
      },
      yOrders: {
        display: mode !== 'revenue',
        position: mode === 'both' ? 'right' : 'left',
        grid: { display: mode === 'both' ? false : true, color: colors.border, drawBorder: false, borderDash: [4, 4] },
        border: { display: false },
        ticks: {
          color: colors.sub,
          font: { family: 'Manrope', size: 12, weight: 'bold' },
          maxTicksLimit: 6,
          padding: 12,
        },
      },
      x: {
        grid: { display: false, drawBorder: false },
        border: { display: false },
        ticks: {
          color: colors.muted,
          font: { family: 'Manrope', size: 11, weight: 'bold' },
          maxRotation: 0,
          maxTicksLimit: 8,
          padding: 12,
        },
      },
    },
  };

  const TABS = [
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: BarChart2 },
    { id: 'both', label: 'Both', icon: Layers },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="bg-gradient-to-t from-[var(--surface)] to-[var(--surface-muted)]/30 ring-1 ring-[var(--border)]/30 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] p-8 sm:p-10 relative overflow-hidden transition-all duration-500 ease-in-out"
    >
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('/noise.png')] opacity-[var(--grain-opacity)]" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 relative z-10 transition-colors duration-500">
        <div>
          <h3 className="font-display text-3xl font-medium text-[var(--text)] flex items-center gap-4 tracking-tight transition-colors duration-500">
            <div className="p-3 rounded-[1.25rem] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 shadow-sm transition-colors duration-500">
              <TrendingUp size={24} strokeWidth={1.5} className="text-[var(--brand)] transition-colors duration-500" />
            </div>
            Sales Performance
          </h3>
          {pctChange !== null && (
            <div className="flex items-center gap-3 mt-4 pl-1">
              <span className="font-display font-bold text-2xl text-[var(--text)] leading-none transition-colors duration-500">{fmt(currentTotal)}</span>
              <span className="font-body text-xs text-[var(--muted)] font-bold uppercase tracking-widest transition-colors duration-500">{comparisonLabel}</span>
              <span className={`font-body font-bold text-xs px-3 py-1.5 rounded-full transition-colors duration-500 ${pctChange >= 0 ? 'bg-[var(--success)]/10 text-[var(--success)] ring-1 ring-[var(--success)]/20' : 'bg-[var(--error)]/10 text-[var(--error)] ring-1 ring-[var(--error)]/20'}`}>
                {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Toggle */}
        <div className="flex gap-2 bg-[var(--surface)] p-1.5 rounded-full ring-1 ring-[var(--border)]/40 shadow-inner transition-all duration-500">
          {TABS.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.4 }}
              onClick={() => setMode(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold font-body transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                mode === id
                  ? 'bg-[var(--text)] text-[var(--surface)] shadow-md'
                  : 'text-[var(--sub)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="h-[350px] w-full relative z-10 transition-colors duration-500">
        {labels.length > 0 ? (
          <Chart key={themeKey} type="bar" data={{ labels, datasets }} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-[var(--sub)] font-display text-2xl tracking-tight transition-colors duration-500">
            No data for selected period.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SalesPerformanceChart;