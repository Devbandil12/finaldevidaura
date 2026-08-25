import React from 'react';
import { Award, TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const TopProducts = ({ topProductsByVolume, topProductsByRevenue, setActiveTab }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="bg-gradient-to-b from-[var(--surface)] to-[var(--surface-muted)]/30 ring-1 ring-[var(--border)]/30 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden h-full flex flex-col relative"
    >
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('/noise.png')] opacity-[var(--grain-opacity)]" />

      <div className="px-8 py-6 border-b border-[var(--border)]/30 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 flex items-center justify-center shadow-sm">
            <Award size={20} strokeWidth={1.5} className="text-[var(--brand)]" />
          </div>
          <h3 className="font-display font-medium text-xl text-[var(--text)] tracking-tight">Top Products</h3>
        </div>
        <button onClick={() => setActiveTab('products')} className="flex items-center gap-2 px-4 py-2 rounded-full ring-1 ring-[var(--border)]/40 bg-[var(--surface)] text-xs font-bold font-body text-[var(--brand)] hover:shadow-md transition-all duration-500">
          View All <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]/30 flex-1 relative z-10">

        {/* COLUMN 1: BY VOLUME */}
        <div className="p-6 sm:p-8">
          <h4 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-6">By Volume Sold</h4>
          <div className="space-y-5">
            {topProductsByVolume?.length > 0 ? (
              topProductsByVolume.map((product, idx) => (
                <motion.div 
                  key={`vol-${product.id}`} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="flex items-center gap-5 group cursor-default p-4 -mx-4 rounded-[1.75rem] transition-all duration-500 hover:bg-[var(--surface)] hover:ring-1 hover:ring-[var(--border)]/40 hover:shadow-sm"
                >
                  <div className="font-display font-bold text-lg text-[var(--muted)] w-6 text-right group-hover:text-[var(--brand)] transition-colors">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <img src={product.img || '/placeholder.png'} alt={product.name} className="w-14 h-14 rounded-[1.25rem] object-cover ring-1 ring-[var(--border)]/50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:ring-[var(--brand)]/40 group-hover:shadow-md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-body font-bold text-[var(--text)] truncate transition-colors duration-500 group-hover:text-[var(--brand)]">{product.name}</p>
                  </div>
                  <div className="font-display text-xl font-bold text-[var(--brand)] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 px-4 py-2 rounded-full transition-all duration-500 group-hover:ring-[var(--brand)]/30 group-hover:bg-[var(--brand)]/5 shadow-sm">
                    {product.volume.toLocaleString()}
                  </div>
                </motion.div>
              ))
            ) : (<p className="text-xl text-[var(--sub)] font-display tracking-tight mt-6">No volume data available.</p>)}
          </div>
        </div>

        {/* COLUMN 2: BY REVENUE */}
        <div className="p-6 sm:p-8">
          <h4 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-6 flex items-center gap-2">By Revenue <TrendingUp size={16} strokeWidth={2.5} className="text-[var(--success)]" /></h4>
          <div className="space-y-5">
            {topProductsByRevenue?.length > 0 ? (
              topProductsByRevenue.map((product, idx) => (
                <motion.div 
                  key={`rev-${product.id}`} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="flex items-center gap-5 group cursor-default p-4 -mx-4 rounded-[1.75rem] transition-all duration-500 hover:bg-[var(--surface)] hover:ring-1 hover:ring-[var(--border)]/40 hover:shadow-sm"
                >
                  <div className="font-display font-bold text-lg text-[var(--muted)] w-6 text-right group-hover:text-[var(--brand)] transition-colors">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <img src={product.img || '/placeholder.png'} alt={product.name} className="w-14 h-14 rounded-[1.25rem] object-cover ring-1 ring-[var(--border)]/50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:ring-[var(--success)]/40 group-hover:shadow-md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-body font-bold text-[var(--text)] truncate transition-colors duration-500 group-hover:text-[var(--brand)]">{product.name}</p>
                  </div>
                  <div className="font-display text-xl font-bold text-[var(--success)] tracking-tight bg-[var(--surface)] ring-1 ring-[var(--border)]/40 px-4 py-2 rounded-full transition-all duration-500 group-hover:ring-[var(--success)]/30 group-hover:bg-[var(--success)]/5 shadow-sm">
                    ₹{product.revenue.toLocaleString()}
                  </div>
                </motion.div>
              ))
            ) : (<p className="text-xl text-[var(--sub)] font-display tracking-tight mt-6">No revenue data available.</p>)}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default TopProducts;