import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const GeoDistribution = ({ geoDistribution, setActiveTab }) => {
  if (!geoDistribution || geoDistribution.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-muted)]/40 ring-1 ring-[var(--border)]/30 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden h-full flex flex-col relative">
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('/noise.png')] opacity-[var(--grain-opacity)]" />
        <div className="px-8 py-6 border-b border-[var(--border)]/30 flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-[1.25rem] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 flex items-center justify-center shadow-sm">
            <MapPin size={20} strokeWidth={1.5} className="text-[var(--brand)]" />
          </div>
          <h3 className="font-display font-medium text-xl text-[var(--text)] tracking-tight">Top Markets</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
          <p className="font-display text-xl text-[var(--text)]">No regional data</p>
          <p className="font-body text-sm text-[var(--muted)] mt-2">Not enough sales data for this period.</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...geoDistribution.map(g => g.count), 1);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-muted)]/40 ring-1 ring-[var(--border)]/30 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden h-full flex flex-col relative"
    >
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('/noise.png')] opacity-[var(--grain-opacity)]" />

      <div className="px-8 py-6 border-b border-[var(--border)]/30 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 flex items-center justify-center shadow-sm">
            <MapPin size={20} strokeWidth={1.5} className="text-[var(--brand)]" />
          </div>
          <h3 className="font-display font-medium text-xl text-[var(--text)] tracking-tight">Top Markets</h3>
        </div>
        <button onClick={() => setActiveTab('reports')} className="flex items-center gap-2 px-4 py-2 rounded-full ring-1 ring-[var(--border)]/40 bg-[var(--surface)] text-xs font-bold font-body text-[var(--sub)] hover:text-[var(--brand)] hover:shadow-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
          Analytics <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </div>
      
      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center space-y-6 relative z-10">
        {geoDistribution.map((geo, idx) => {
          const percentage = ((geo.count / maxCount) * 100).toFixed(0);
          return (
            <div key={idx} className="group cursor-default p-4 -mx-4 rounded-[1.75rem] hover:bg-[var(--surface)] hover:ring-1 hover:ring-[var(--border)]/40 hover:shadow-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
              <div className="flex justify-between items-end mb-3 px-1">
                <span className="text-sm font-bold text-[var(--text)] tracking-wide group-hover:text-[var(--brand)] transition-colors">
                  {geo.state}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-2xl font-bold text-[var(--text)] tracking-tight group-hover:text-[var(--brand)] transition-colors leading-none">
                    {geo.count.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Orders</span>
                </div>
              </div>
              <div className="w-full bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/20 rounded-full h-2 overflow-hidden shadow-inner mx-1">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${Math.max(percentage, 2)}%` }} transition={{ delay: idx * 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[var(--text)] h-full rounded-full opacity-80 group-hover:opacity-100 group-hover:bg-[var(--brand)] relative overflow-hidden" 
                >
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-[200%] animate-[shimmer_2s_infinite]"></div>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default GeoDistribution;