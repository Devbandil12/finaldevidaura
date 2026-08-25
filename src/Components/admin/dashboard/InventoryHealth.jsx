import React from 'react';
import { PackageOpen, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const InventoryHealth = ({ dashboardData, isLoading, setActiveTab }) => {
  const lowStock = dashboardData?.lowStockVariants || [];
  const lowCount = dashboardData?.lowStockCount || 0;
  const outCount = dashboardData?.outOfStockCount || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="bg-gradient-to-b from-[var(--surface)] to-[var(--surface-muted)]/30 ring-1 ring-[var(--border)]/30 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden h-full flex flex-col relative"
    >
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('/noise.png')] opacity-[var(--grain-opacity)]" />
      
      <div className="px-8 py-6 border-b border-[var(--border)]/30 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 flex items-center justify-center shadow-sm">
            <PackageOpen size={20} strokeWidth={1.5} className="text-[var(--brand)]" />
          </div>
          <div>
            <h3 className="font-display font-medium text-xl text-[var(--text)] tracking-tight">Product & Inventory</h3>
            <p className="font-body text-[11px] text-[var(--muted)] uppercase tracking-widest font-bold mt-1">
              {isLoading ? 'Loading...' : 'Variant stock alerts'}
            </p>
          </div>
        </div>
        <button onClick={() => setActiveTab('products')} className="flex items-center gap-2 px-4 py-2 rounded-full ring-1 ring-[var(--border)]/40 bg-[var(--surface)] text-xs font-bold font-body text-[var(--sub)] hover:text-[var(--brand)] hover:shadow-md transition-all duration-500">
          View Inventory <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="p-6 sm:p-8 flex-1 flex flex-col relative z-10">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-[1.75rem] p-5 flex items-center gap-5 shadow-sm hover:shadow-md hover:ring-[var(--warning)]/30 transition-all duration-500 group">
            <div className="w-12 h-12 rounded-2xl bg-[var(--warning)]/10 ring-1 ring-[var(--warning)]/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
              <AlertTriangle size={20} className="text-[var(--warning)]" />
            </div>
            <div>
              <p className="font-display font-bold text-3xl text-[var(--warning)] leading-none">{lowCount}</p>
              <p className="font-body text-[10px] font-bold text-[var(--warning)] opacity-80 uppercase tracking-widest mt-1.5">Low Stock</p>
            </div>
          </div>
          <div className="bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-[1.75rem] p-5 flex items-center gap-5 shadow-sm hover:shadow-md hover:ring-[var(--error)]/30 transition-all duration-500 group">
            <div className="w-12 h-12 rounded-2xl bg-[var(--error)]/10 ring-1 ring-[var(--error)]/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
              <AlertTriangle size={20} className="text-[var(--error)]" />
            </div>
            <div>
              <p className="font-display font-bold text-3xl text-[var(--error)] leading-none">{outCount}</p>
              <p className="font-body text-[10px] font-bold text-[var(--error)] opacity-80 uppercase tracking-widest mt-1.5">Out of Stock</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2 smooth-scrollbar space-y-3">
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-[var(--surface-muted)] rounded-[1.5rem] animate-pulse" />)}
            </div>
          ) : lowStock.length === 0 ? (
            <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center bg-[var(--surface)]/50 rounded-[2rem] ring-1 ring-[var(--border)]/20">
              <p className="font-display text-2xl text-[var(--text)] tracking-tight">Inventory looks pristine</p>
              <p className="font-body text-sm text-[var(--muted)] mt-2">No low stock alerts at this time.</p>
            </div>
          ) : (
            lowStock.slice(0, 5).map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.01, x: 4 }}
                className="flex items-center gap-5 p-4 rounded-[1.75rem] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 hover:ring-[var(--brand)]/30 transition-all duration-500 shadow-sm hover:shadow-md group cursor-pointer"
                onClick={() => setActiveTab('products')}
              >
                <div className="w-14 h-14 rounded-[1.25rem] overflow-hidden ring-1 ring-[var(--border)]/50 flex-shrink-0 bg-[var(--surface-muted)]">
                  {item.image ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" /> : <PackageOpen size={20} className="text-[var(--muted)] m-auto mt-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-body font-bold text-base text-[var(--text)] truncate group-hover:text-[var(--brand)] transition-colors">{item.productName}</h4>
                  <p className="font-body text-xs text-[var(--sub)] mt-1">{item.name} <span className="opacity-50 mx-1">•</span> {item.size}</p>
                </div>
                <div className={`flex flex-col items-end flex-shrink-0 px-4 py-2 rounded-[1rem] ring-1 ${item.stock === 0 ? 'bg-[var(--error)]/5 ring-[var(--error)]/20' : 'bg-[var(--warning)]/5 ring-[var(--warning)]/20'}`}>
                  <span className={`font-display font-bold text-xl leading-none ${item.stock === 0 ? 'text-[var(--error)]' : 'text-[var(--warning)]'}`}>{item.stock}</span>
                  <span className={`font-body text-[9px] font-bold uppercase tracking-widest mt-1 ${item.stock === 0 ? 'text-[var(--error)]' : 'text-[var(--warning)]'}`}>left</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InventoryHealth;