import React, { useRef, useState, useEffect } from 'react';
import { Users, UserPlus, UserCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';

const useChartTheme = () => {
  const chartRef = useRef(null);
  const [themeKey, setThemeKey] = useState(0);
  const [colors, setColors] = useState({ brand: '#0E0D0B', surface: '#FFFFFF', text: '#161513', sub: '#5F5952', border: '#E5E1DB', accent: '#B08D4A' });

  useEffect(() => {
    const updateColors = () => {
      if (!chartRef.current) return;
      const styles = getComputedStyle(chartRef.current);
      const getVal = (varName) => {
        let val = styles.getPropertyValue(varName).trim();
        if (!val) return undefined;
        if (/^[\d\.]+\s+[\d\.]+%?\s+[\d\.]+%?$/.test(val)) return val.includes('%') ? `hsl(${val})` : `rgb(${val.split(' ').join(', ')})`;
        return val;
      };
      setColors({ brand: getVal('--brand') || '#0E0D0B', surface: getVal('--surface') || '#FFFFFF', text: getVal('--text') || '#161513', sub: getVal('--sub') || '#5F5952', border: getVal('--border') || '#E5E1DB', accent: getVal('--accent') || '#B08D4A' });
      setThemeKey(prev => prev + 1);
    };
    const frameId = requestAnimationFrame(updateColors);
    const observer = new MutationObserver(() => requestAnimationFrame(updateColors));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => { cancelAnimationFrame(frameId); observer.disconnect(); };
  }, []);
  return { chartRef, colors, themeKey };
};

const CustomerSnapshot = ({ dashboardData, isLoading }) => {
  const { chartRef, colors, themeKey } = useChartTheme();
  const newCount = dashboardData?.newCustomers || 0;
  const returnCount = dashboardData?.returningCustomers || 0;
  const total = newCount + returnCount;
  const returningRate = dashboardData?.returningRate || 0;
  const growthTrend = dashboardData?.customerTrend || 0;

  const chartData = {
    labels: ['New', 'Returning'],
    datasets: [{ data: [newCount, returnCount], backgroundColor: [colors.brand, colors.accent], borderWidth: 0, hoverOffset: 4 }]
  };

  const chartOptions = { cutout: '80%', plugins: { legend: { display: false }, tooltip: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, titleColor: colors.text, bodyColor: colors.sub, padding: 12, bodyFont: { family: 'Manrope' } } }, maintainAspectRatio: false };

  return (
    <motion.div 
      ref={chartRef}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="bg-gradient-to-bl from-[var(--surface)] to-[var(--surface-muted)]/40 ring-1 ring-[var(--border)]/30 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden h-full flex flex-col relative"
    >
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('/noise.png')] opacity-[var(--grain-opacity)]" />
      
      <div className="px-8 py-6 border-b border-[var(--border)]/30 flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-[1.25rem] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 flex items-center justify-center shadow-sm">
          <Users size={20} strokeWidth={1.5} className="text-[var(--brand)]" />
        </div>
        <div>
          <h3 className="font-display font-medium text-xl text-[var(--text)] tracking-tight">Customer Snapshot</h3>
          <p className="font-body text-[11px] text-[var(--muted)] uppercase tracking-widest font-bold mt-1">
            {isLoading ? 'Loading...' : 'Current period metrics'}
          </p>
        </div>
      </div>

      <div className="p-8 flex-1 flex flex-col relative z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-10">
          <div className="relative w-36 h-36 flex-shrink-0 drop-shadow-md">
            {total > 0 ? (
              <Doughnut key={themeKey} data={chartData} options={chartOptions} />
            ) : (
              <div className="w-full h-full rounded-full ring-4 ring-[var(--surface-muted)]" />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-[var(--surface)]/50 rounded-full m-[10px] backdrop-blur-sm ring-1 ring-[var(--border)]/20 shadow-inner">
              <span className="font-body font-bold text-[10px] text-[var(--muted)] uppercase tracking-widest">Total</span>
              <span className="font-body font-bold text-2xl text-[var(--text)] leading-none mt-1">{total}</span>
            </div>
          </div>
          
          <div className="flex-1 w-full space-y-4 pt-2">
            <div className="flex justify-between items-center bg-[var(--surface)] ring-1 ring-[var(--border)]/40 p-4 rounded-[1.5rem] shadow-sm group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[var(--brand)]/5 text-[var(--brand)]"><UserPlus size={16} /></div>
                <span className="font-body font-bold text-sm text-[var(--sub)] group-hover:text-[var(--text)] transition-colors">New</span>
              </div>
              <span className="font-body font-bold text-2xl text-[var(--text)] leading-none">{newCount}</span>
            </div>
            <div className="flex justify-between items-center bg-[var(--surface)] ring-1 ring-[var(--border)]/40 p-4 rounded-[1.5rem] shadow-sm group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[var(--accent)]/5 text-[var(--accent)]"><UserCheck size={16} /></div>
                <span className="font-body font-bold text-sm text-[var(--sub)] group-hover:text-[var(--text)] transition-colors">Returning</span>
              </div>
              <span className="font-body font-bold text-2xl text-[var(--text)] leading-none">{returnCount}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="bg-[var(--surface)] p-6 rounded-[1.75rem] ring-1 ring-[var(--border)]/40 shadow-sm hover:shadow-md transition-all duration-500 cursor-default">
            <p className="font-body text-[10px] text-[var(--muted)] uppercase tracking-widest font-bold mb-2">Repeat Rate</p>
            <p className="font-display text-3xl text-[var(--text)]">{returningRate.toFixed(1)}%</p>
          </div>
          <div className="bg-[var(--surface)] p-6 rounded-[1.75rem] ring-1 ring-[var(--border)]/40 shadow-sm hover:shadow-md transition-all duration-500 cursor-default">
            <p className="font-body text-[10px] text-[var(--muted)] uppercase tracking-widest font-bold mb-2">Cust. Growth</p>
            <div className="flex items-end gap-2">
              <p className="font-display text-3xl text-[var(--text)] leading-none">{growthTrend >= 0 ? '+' : ''}{growthTrend.toFixed(1)}%</p>
              {dashboardData?.hasTrend && (growthTrend >= 0 ? <TrendingUp size={20} className="text-[var(--success)] mb-1" /> : <TrendingDown size={20} className="text-[var(--error)] mb-1" />)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CustomerSnapshot;