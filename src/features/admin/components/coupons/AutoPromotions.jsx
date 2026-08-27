import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, ShoppingBag, Layers, Activity } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const AutoPromotions = ({
  coupons,
  setEditingCoupon,
  deleteCoupon,
  getBadgeColor
}) => {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4 sm:space-y-6 font-body">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[var(--surface)] py-4 px-5 sm:px-6 rounded-[1.25rem] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 shadow-[0_4px_16px_rgba(0,0,0,0.02)] transition-all">
        <div className="flex items-center gap-3">
          <Activity size={18} strokeWidth={2} className="text-[var(--muted)] hidden sm:block" />
          <div>
            <h2 className="font-display text-base font-medium text-[var(--text)] tracking-tight">Active Automation Rules</h2>
            <p className="font-body text-[10px] text-[var(--muted)] mt-0.5 tracking-wide">Promos applied automatically upon cart conditions.</p>
          </div>
        </div>
        <button
          onClick={() => setEditingCoupon({
            code: "NEW_OFFER", discountType: "free_item", discountValue: 0, isAutomatic: true,
            minOrderValue: 0, minItemCount: 0, maxDiscountAmount: null, cond_requiredCategory: "Template", firstOrderOnly: false, maxUsagePerUser: null, totalUsageLimit: null,
            action_targetSize: 30, action_targetMaxPrice: 600, targetUserId: null, targetCategory: null
          })}
          className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[var(--brand)] text-[var(--surface)] rounded-xl font-body font-bold text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] shrink-0"
        >
          <Plus size={14} strokeWidth={2.5} /> New Rule
        </button>
      </div>

      {/* HORIZONTAL CARDS GRID (1 Column for maximum landscape width) */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5">
        {coupons.filter(c => c.isAutomatic).map((c) => (
          <motion.div 
            variants={itemVariants}
            key={c.id} 
            className="flex flex-col xl:flex-row xl:items-stretch bg-[var(--surface)] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 group cursor-default overflow-hidden relative"
          >
            {/* Action Buttons (Absolute in Desktop, static in mobile) */}
            <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 hidden xl:flex">
              <button 
                onClick={() => setEditingCoupon({ ...c })} 
                className="p-2 text-[var(--text)] hover:text-[var(--brand)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] rounded-lg transition-colors ring-1 ring-[var(--border)]/40 shadow-sm"
                title="Edit"
              >
                <Edit2 size={14} strokeWidth={2} />
              </button>
              <button 
                onClick={() => deleteCoupon(c.id)} 
                className="p-2 text-[var(--muted)] hover:text-[var(--error)] bg-[var(--surface)] hover:bg-[var(--error)]/10 rounded-lg transition-all ring-1 ring-[var(--border)]/40 shadow-sm"
                title="Delete"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>

            {/* Left: Identity */}
            <div className="xl:w-[30%] p-5 bg-[var(--surface-muted)]/20 border-b xl:border-b-0 xl:border-r border-[var(--border)]/20 dark:border-[var(--border)]/40 flex items-center gap-4 shrink-0">
              <div className="w-12 h-12 rounded-[0.85rem] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 flex items-center justify-center text-[var(--brand)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] group-hover:scale-105 group-hover:ring-[var(--brand)]/30 transition-all duration-500 shrink-0">
                <ShoppingBag size={20} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 pt-0.5 pr-12 xl:pr-0">
                <div className="font-body font-bold text-[var(--text)] text-sm tracking-tight group-hover:text-[var(--brand)] transition-colors truncate">{c.code}</div>
                <div className="font-body text-[10px] font-medium text-[var(--sub)] truncate mt-1">{c.description || "No description provided"}</div>
              </div>

              {/* Mobile Actions */}
              <div className="flex gap-1.5 ml-auto xl:hidden">
                <button onClick={() => setEditingCoupon({ ...c })} className="p-2 text-[var(--text)] hover:text-[var(--brand)] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-lg shadow-sm"><Edit2 size={14} /></button>
                <button onClick={() => deleteCoupon(c.id)} className="p-2 text-[var(--muted)] hover:text-[var(--error)] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-lg shadow-sm"><Trash2 size={14} /></button>
              </div>
            </div>

            {/* Right: Grid Data */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-5 xl:flex-1 content-center">
              
              {/* Trigger Condition */}
              <div className="flex flex-col justify-center gap-1.5">
                <span className="font-body text-[8px] font-bold uppercase tracking-widest text-[var(--muted)]">Trigger Condition</span>
                <div className="flex flex-col items-start gap-1">
                  <span className="font-body font-medium text-[11px] text-[var(--text)] tracking-tight">
                    {c.cond_requiredCategory ? `Buy ${c.cond_requiredCategory}` : `Min ₹${c.minOrderValue?.toLocaleString()}`}
                  </span>
                  {c.cond_requiredSize && <span className="font-body text-[9px] uppercase tracking-widest font-medium text-[var(--sub)] mt-1">Req Size: {c.cond_requiredSize}ml</span>}
                </div>
              </div>

              {/* Reward */}
              <div className="flex flex-col justify-center gap-1.5">
                <span className="font-body text-[8px] font-bold uppercase tracking-widest text-[var(--muted)]">Reward</span>
                <div className="flex flex-col items-start gap-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ring-1 transition-colors duration-300 ${getBadgeColor(c.discountType)}`}>
                    {c.discountType.replace('_', ' ')}
                  </span>
                  <span className="font-body font-medium text-[11px] text-[var(--success)] tracking-tight mt-1">
                    {c.action_targetSize ? `${c.action_targetSize}ml Item` : `${c.discountValue}% Off`}
                  </span>
                </div>
              </div>

              {/* Audience */}
              <div className="flex flex-col justify-center gap-2">
                <span className="font-body text-[8px] font-bold uppercase tracking-widest text-[var(--muted)]">Audience Segment</span>
                <div className="flex items-center">
                  {c.targetUserId ? (
                      <span className="flex items-center gap-1.5 font-body text-[11px] font-medium tracking-tight text-[var(--brand)]">
                          Exclusive User
                      </span>
                  ) : c.targetCategory ? (
                      <span className="flex items-center gap-1.5 font-body text-[11px] font-medium tracking-tight text-[var(--text)]">
                          Category Segment
                      </span>
                  ) : (
                      <span className="font-body text-[11px] font-medium tracking-tight text-[var(--sub)]">
                        Global Public
                      </span>
                  )}
                </div>
              </div>

              {/* Constraints / Logic */}
              <div className="flex flex-col justify-center gap-1">
                <span className="font-body text-[8px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1">Logic / Limit</span>
                {c.action_buyX ? (
                    <span className="font-body text-[11px] font-medium text-[var(--brand)]">Buy {c.action_buyX} Get {c.action_getY}</span>
                ) : (
                    <span className="font-body text-[11px] font-medium text-[var(--text)]">
                        {c.maxDiscountAmount ? `Cap: ₹${c.maxDiscountAmount}` : 'No Limit'}
                    </span>
                )}
                <span className="font-body text-[11px] font-medium text-[var(--text)] mt-0.5">
                  {c.firstOrderOnly ? "First Order Only" : "Multi-Use"}
                </span>
              </div>

            </div>
          </motion.div>
        ))}
        
        {/* EMPTY STATE */}
        {coupons.filter(c => c.isAutomatic).length === 0 && (
          <motion.div variants={itemVariants} className="py-24 text-center ring-1 ring-dashed ring-[var(--border)]/50 rounded-[2rem] bg-[var(--surface-muted)]/10 flex flex-col items-center justify-center">
            <Layers size={28} strokeWidth={1.5} className="text-[var(--muted)] mb-4 opacity-60" />
            <p className="font-display font-medium text-lg text-[var(--sub)] tracking-tight">No automated rules configured.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AutoPromotions;