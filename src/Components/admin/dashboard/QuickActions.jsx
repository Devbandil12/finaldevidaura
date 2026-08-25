import React from 'react';
import { Plus, Ticket, ShoppingBag, Headphones, Settings, PieChart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const ACTIONS = [
  { id: 'products',     label: 'Add Product',   icon: Plus,         isPrimary: true },
  { id: 'coupons',      label: 'Create Coupon', icon: Ticket,       isPrimary: false },
  { id: 'orders',       label: 'View Orders',   icon: ShoppingBag,  isPrimary: false },
  { id: 'support',      label: 'Open Support',  icon: Headphones,   isPrimary: false },
  { id: 'site_control', label: 'Site Control',  icon: Settings,     isPrimary: false },
  { id: 'reports',      label: 'Analytics',     icon: PieChart,     isPrimary: false },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const QuickActions = ({ setActiveTab }) => {
  return (
    <motion.div 
      className="bg-[var(--surface)] border border-[var(--border)]/40 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-5 sm:p-8 relative overflow-hidden h-full flex flex-col justify-center transition-colors duration-500"
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('/noise.png')]" style={{ opacity: "var(--grain-opacity, 0.05)" }} />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h3 className="font-display text-2xl sm:text-3xl font-medium text-[var(--text)] tracking-tight">
            Quick Actions
          </h3>
          <p className="font-body text-[10px] sm:text-xs text-[var(--muted)] mt-1.5 tracking-widest uppercase font-bold">
            Workspace Shortcuts
          </p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--surface-muted)] border border-[var(--border)]/50 text-[var(--brand)] shadow-sm flex items-center justify-center transition-colors duration-500">
           <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
        </div>
      </div>
      
      {/* Actions Grid - Fixed Responsiveness (Switched xl:grid-cols-6 to xl:grid-cols-2 2xl:grid-cols-3) */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4 relative z-10"
      >
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(action.id)}
              className={`relative flex flex-col items-center justify-center gap-3 p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] border transition-all duration-300 ease-out group overflow-hidden
                ${action.isPrimary 
                  ? 'bg-[var(--text)] border-[var(--text)] shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)]' 
                  : 'bg-[var(--surface)] border-[var(--border)]/50 hover:bg-[var(--surface-muted)] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)]'
                }`}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3
                ${action.isPrimary 
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' 
                  : 'bg-[var(--surface-muted)] border border-[var(--border)]/30 text-[var(--sub)] group-hover:text-[var(--text)] group-hover:border-[var(--border)]'
                }`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
              </div>
              
              <span className={`font-body font-bold text-[10px] sm:text-xs tracking-wide text-center leading-tight transition-colors duration-300
                ${action.isPrimary ? 'text-[var(--surface)]' : 'text-[var(--text)]'}
              `}>
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default QuickActions;