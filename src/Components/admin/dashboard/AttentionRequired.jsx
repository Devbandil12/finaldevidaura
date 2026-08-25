import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShoppingBag, Package, RefreshCcw, Headphones, Shield, Ticket, RotateCcw, ArrowRight, CheckCircle2 } from 'lucide-react';

const ITEMS = [
  { key: 'slaBreaches', label: 'SLA Breach', icon: Shield, tab: 'support', priority: 'critical', ctaLabel: 'Review', description: 'Support SLA breached' },
  { key: 'pendingRefunds', label: 'Refunds Pending', icon: RefreshCcw, tab: 'orders', priority: 'critical', ctaLabel: 'Review', description: 'Awaiting refund processing' },
  { key: 'pendingOrders', label: 'Pending Orders', icon: ShoppingBag, tab: 'orders', priority: 'high', ctaLabel: 'Review', description: 'Orders not yet confirmed' },
  { key: 'rtoOrders', label: 'RTO Orders', icon: RotateCcw, tab: 'orders', priority: 'high', ctaLabel: 'Review', description: 'Returned to origin' },
  { key: 'openTickets', label: 'Open Tickets', icon: Headphones, tab: 'support', priority: 'medium', ctaLabel: 'Open Inbox', description: 'Unresolved support tickets' },
  { key: 'lowStock', label: 'Low Stock', icon: Package, tab: 'products', priority: 'medium', ctaLabel: 'Restock', description: 'Variants under 10 units' },
  { key: 'expiringCoupons', label: 'Coupons Expiring', icon: Ticket, tab: 'coupons', priority: 'info', ctaLabel: 'View', description: 'Expire within 7 days' },
];

const PRIORITY_STYLES = {
  critical: { bg: 'bg-[var(--error)]/5', ring: 'ring-[var(--error)]/20', text: 'text-[var(--error)]', hover: 'hover:bg-[var(--error)]/10 hover:ring-[var(--error)]/30' },
  high: { bg: 'bg-[var(--warning)]/5', ring: 'ring-[var(--warning)]/20', text: 'text-[var(--warning)]', hover: 'hover:bg-[var(--warning)]/10 hover:ring-[var(--warning)]/30' },
  medium: { bg: 'bg-[var(--accent)]/5', ring: 'ring-[var(--accent)]/20', text: 'text-[var(--accent)]', hover: 'hover:bg-[var(--accent)]/10 hover:ring-[var(--accent)]/30' },
  info: { bg: 'bg-[var(--info)]/5', ring: 'ring-[var(--info)]/20', text: 'text-[var(--info)]', hover: 'hover:bg-[var(--info)]/10 hover:ring-[var(--info)]/30' },
};

const AttentionRequired = ({ attentionData, isLoading, setActiveTab }) => {
  const activeItems = ITEMS.filter(item => (attentionData?.[item.key] || 0) > 0);
  const allClear = !isLoading && activeItems.length === 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="bg-gradient-to-b from-[var(--surface)] to-[var(--surface-muted)]/30 ring-1 ring-[var(--border)]/30 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden relative group"
    >
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('/noise.png')] opacity-[var(--grain-opacity)]" />
      
      <div className="px-8 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 flex items-center justify-center shadow-sm">
            <AlertTriangle size={20} strokeWidth={1.5} className="text-[var(--error)]" />
          </div>
          <div>
            <h3 className="font-display font-medium text-xl text-[var(--text)] tracking-tight">Attention Required</h3>
            <p className="font-body text-[11px] text-[var(--muted)] uppercase tracking-widest font-bold mt-1">
              {isLoading ? 'Checking systems...' : allClear ? 'All systems nominal' : `${activeItems.length} items require review`}
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 pb-8 relative z-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-[var(--surface-muted)] rounded-[1.5rem] animate-pulse" />)}
          </div>
        ) : allClear ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center justify-center py-12 gap-5 bg-[var(--surface)]/50 rounded-[2rem] ring-1 ring-[var(--border)]/20">
            <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center ring-1 ring-[var(--success)]/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
              <CheckCircle2 size={28} className="text-[var(--success)]" />
            </div>
            <div className="text-center">
              <p className="font-display text-2xl text-[var(--text)] tracking-tight">Operations nominal.</p>
              <p className="font-body text-sm text-[var(--muted)] mt-1">No pending actions at this time.</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {activeItems.map((item, idx) => {
                const styles = PRIORITY_STYLES[item.priority];
                const count = attentionData?.[item.key] || 0;
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.key}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex flex-col justify-between p-5 rounded-[1.75rem] ring-1 transition-all duration-500 bg-[var(--surface)] shadow-sm hover:shadow-md cursor-pointer ${styles.ring} ${styles.hover}`}
                    onClick={() => setActiveTab(item.tab)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-[1rem] flex items-center justify-center ring-1 ${styles.bg} ${styles.ring}`}>
                        <Icon size={18} strokeWidth={2} className={styles.text} />
                      </div>
                      <span className={`font-body font-bold text-lg leading-none ${styles.text}`}>{count}</span>
                    </div>
                    <div>
                      <p className="font-body font-bold text-sm text-[var(--text)]">{item.label}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="font-body text-[11px] text-[var(--sub)] line-clamp-1">{item.description}</p>
                        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${styles.text}`}>
                          {item.ctaLabel} <ArrowRight size={10} strokeWidth={3} />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AttentionRequired;