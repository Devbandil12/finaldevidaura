import React from 'react';
import { ShoppingCart, RefreshCcw, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const fmt = (v) => '₹' + Math.round(v).toLocaleString('en-IN');

const CartRecovery = ({ dashboardData, isLoading, setActiveTab }) => {
  const recovery = dashboardData?.cartRecovery || { abandonedCount: 0, atRiskValue: 0, eligibleCount: 0 };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-muted)]/50 rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between shadow-[0_8px_40px_rgba(0,0,0,0.03)] ring-1 ring-[var(--border)]/30 h-full group"
    >
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('/noise.png')] opacity-[var(--grain-opacity)]"></div>
      
      {/* Cinematic animated glow */}
      <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[var(--accent)] opacity-5 blur-[100px] rounded-full pointer-events-none transition-opacity duration-1000 group-hover:opacity-10"></div>

      <div className="relative z-10 flex justify-between items-start mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-[1.25rem] shadow-sm flex items-center justify-center">
            <ShoppingCart size={20} strokeWidth={1.5} className="text-[var(--brand)]" />
          </div>
          <div>
            <h3 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Cart Recovery</h3>
            <p className="text-[var(--sub)] text-xs mt-1 font-body uppercase tracking-widest font-bold">
              {isLoading ? 'Analyzing carts...' : 'Current period abandoned checkouts'}
            </p>
          </div>
        </div>
        <motion.button 
          whileHover={{ rotate: 180, scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} 
          className="bg-[var(--surface)] p-3 rounded-full ring-1 ring-[var(--border)]/40 shadow-sm cursor-pointer hover:shadow-md text-[var(--sub)] hover:text-[var(--brand)]"
        >
          <RefreshCcw size={16} strokeWidth={2} />
        </motion.button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="mb-10">
          <span className="block text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2">Total At Risk</span>
          <h2 className="font-body text-6xl sm:text-7xl font-bold text-[var(--text)] tracking-tighter leading-none drop-shadow-sm">
            {fmt(recovery.atRiskValue)}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-[var(--surface)] ring-1 ring-[var(--border)]/40 p-5 rounded-[1.75rem] shadow-sm transition-all duration-500 hover:shadow-md hover:ring-[var(--brand)]/20 cursor-default">
            <span className="block font-body text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Abandoned</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-body text-3xl font-bold leading-none text-[var(--text)]">{recovery.abandonedCount}</span>
              <span className="text-xs font-bold text-[var(--sub)] uppercase tracking-widest">users</span>
            </div>
          </div>
          
          <div className="bg-[var(--surface)] ring-1 ring-[var(--border)]/40 p-5 rounded-[1.75rem] shadow-sm transition-all duration-500 hover:shadow-md hover:ring-[var(--brand)]/20 cursor-default">
            <span className="block font-body text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Eligible</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-body text-3xl font-bold leading-none text-[var(--text)]">{recovery.eligibleCount}</span>
              <span className="text-xs font-bold text-[var(--sub)] uppercase tracking-widest">users</span>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => setActiveTab('carts')}
          className="mt-auto w-full bg-[var(--text)] text-[var(--surface)] py-4 sm:py-5 rounded-[1.75rem] font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:bg-[var(--brand)]"
        >
          Review Carts <ArrowRight size={18} strokeWidth={2.5} />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CartRecovery;