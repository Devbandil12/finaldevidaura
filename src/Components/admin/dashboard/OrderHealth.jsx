import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Package } from 'lucide-react';

const STATUSES = [
  { key: 'pending',    label: 'Pending',    theme: 'warning', filterStatus: 'Order Placed' },
  { key: 'processing', label: 'Processing', theme: 'info',    filterStatus: 'Processing' },
  { key: 'shipped',    label: 'Shipped',    theme: 'brand',   filterStatus: 'Shipped' },
  { key: 'delivered',  label: 'Delivered',  theme: 'success', filterStatus: 'Delivered' },
  { key: 'cancelled',  label: 'Cancelled',  theme: 'error',   filterStatus: 'Order Cancelled' },
  { key: 'rto',        label: 'RTO',        theme: 'warning', filterStatus: 'RTO' },
  { key: 'returns',    label: 'Returns',    theme: 'accent',  filterStatus: 'Return Initiated' },
  { key: 'refunds',    label: 'Refunds',    theme: 'error',   filterStatus: null },
];

const OrderHealth = ({ orderHealth, isLoading, setActiveTab }) => {
  const total = STATUSES.reduce((s, st) => s + (orderHealth?.[st.key] || 0), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-muted)]/40 ring-1 ring-[var(--border)]/30 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col h-full relative"
    >
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('/noise.png')] opacity-[var(--grain-opacity)]" />

      <div className="px-8 py-6 border-b border-[var(--border)]/30 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 flex items-center justify-center shadow-sm">
            <Package size={20} strokeWidth={1.5} className="text-[var(--brand)]" />
          </div>
          <div>
            <h3 className="font-display font-medium text-xl text-[var(--text)] tracking-tight">Order Health</h3>
            <p className="font-body text-[11px] text-[var(--muted)] uppercase tracking-widest font-bold mt-1">
              {isLoading ? 'Loading...' : `${total} total this period`}
            </p>
          </div>
        </div>
        <button onClick={() => setActiveTab('orders')} className="flex items-center gap-2 px-4 py-2 rounded-full ring-1 ring-[var(--border)]/40 bg-[var(--surface)] text-xs font-bold font-body text-[var(--sub)] hover:text-[var(--brand)] hover:shadow-md transition-all duration-500">
          All Orders <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-4 flex-1 relative z-10">
        {STATUSES.map((s, idx) => {
          const count = orderHealth?.[s.key] || 0;
          return (
            <motion.button
              key={s.key}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={count > 0 ? { scale: 1.02, y: -2 } : {}}
              whileTap={count > 0 ? { scale: 0.98 } : {}}
              onClick={() => s.filterStatus && setActiveTab('orders')}
              className={`flex flex-col justify-between p-5 rounded-[1.75rem] ring-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group text-left
                ${count > 0 
                  ? `bg-[var(--surface)] ring-[var(--border)]/40 cursor-pointer shadow-sm hover:shadow-lg hover:ring-[var(--${s.theme})]/30` 
                  : 'bg-[var(--surface-muted)]/50 ring-[var(--border)]/20 cursor-default opacity-80'}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-3 h-3 rounded-full flex-shrink-0 shadow-inner ${count > 0 ? `bg-[var(--${s.theme})] shadow-[0_0_12px_var(--${s.theme})]` : 'bg-[var(--border)]'}`} />
                <span className={`font-body font-bold text-xs uppercase tracking-widest ${count > 0 ? `text-[var(--text)]` : 'text-[var(--muted)]'}`}>{s.label}</span>
              </div>
              <span className={`font-display font-bold text-4xl leading-none ${count > 0 ? `text-[var(--${s.theme})]` : 'text-[var(--muted)]'}`}>
                {isLoading ? <span className="inline-block w-8 h-8 bg-[var(--surface-muted)] rounded-xl animate-pulse" /> : count}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default OrderHealth;