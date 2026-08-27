import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Tag, Percent, User, Users, Calendar, Edit2, Trash2 } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const ManualCoupons = ({
  coupons,
  setEditingCoupon,
  deleteCoupon,
  getBadgeColor,
  CATEGORIES
}) => {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4 sm:space-y-6 font-body">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[var(--surface)] py-4 px-5 sm:px-6 rounded-[1.25rem] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 shadow-[0_4px_16px_rgba(0,0,0,0.02)] transition-all">
        <div className="flex items-center gap-3">
          <Tag size={18} strokeWidth={2} className="text-[var(--muted)] hidden sm:block" />
          <div>
            <h2 className="font-display text-base font-medium text-[var(--text)] tracking-tight">Active Manual Coupons</h2>
            <p className="font-body text-[10px] text-[var(--muted)] mt-0.5 tracking-wide">Standard codes applied at checkout.</p>
          </div>
        </div>
        <button
          onClick={() => setEditingCoupon({
            code: "", discountType: "percent", discountValue: 10, isAutomatic: false,
            minOrderValue: 0, minItemCount: 0, maxDiscountAmount: null, firstOrderOnly: false, maxUsagePerUser: 1, totalUsageLimit: null,
            targetUserId: null, targetCategory: null
          })}
          className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[var(--brand)] text-[var(--surface)] rounded-xl font-body font-bold text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] shrink-0"
        >
          <Plus size={14} strokeWidth={2.5} /> New Coupon
        </button>
      </div>

      {/* STACKED LIST (Replaces bulky table) */}
      <div className="space-y-3">
        {coupons.filter(c => !c.isAutomatic).map((c) => (
          <motion.div 
            variants={itemVariants}
            key={c.id} 
            className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 p-4 sm:p-5 bg-[var(--surface)] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 rounded-[1.25rem] sm:rounded-[1.5rem] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-300 group cursor-default"
          >
            {/* Left: Identity */}
            <div className="flex items-center gap-4 xl:w-[25%] shrink-0">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-muted)]/50 ring-1 ring-[var(--border)]/40 flex items-center justify-center text-[var(--brand)] shadow-sm group-hover:scale-105 transition-all duration-300 shrink-0">
                <Tag size={16} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <div className="font-body font-bold text-[var(--text)] text-sm tracking-tight group-hover:text-[var(--brand)] transition-colors truncate">{c.code}</div>
                <div className="font-body text-[10px] font-medium text-[var(--sub)] truncate mt-0.5">{c.description || "No description provided"}</div>
              </div>
            </div>

            {/* Middle: Grid Data */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 xl:flex-1 w-full">
              
              {/* Discount */}
              <div className="flex flex-col justify-center gap-1.5">
                <span className="font-body text-[8px] font-bold uppercase tracking-widest text-[var(--muted)]">Discount</span>
                <div className="flex flex-col items-start gap-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ring-1 transition-colors duration-300 ${getBadgeColor(c.discountType)}`}>
                    {c.discountType === 'percent' && <Percent size={10} strokeWidth={2.5} className="mr-1"/>}
                    {c.discountType === 'percent' ? `${c.discountValue}% Off` : (c.discountType === 'free_item' ? 'Free Item' : `₹${c.discountValue} Off`)}
                  </span>
                  {c.maxDiscountAmount > 0 && <span className="font-body text-[8px] uppercase tracking-widest font-bold text-[var(--sub)]">Up to ₹{c.maxDiscountAmount}</span>}
                </div>
              </div>

              {/* Targeting */}
              <div className="flex flex-col justify-center gap-1.5">
                <span className="font-body text-[8px] font-bold uppercase tracking-widest text-[var(--muted)]">Audience</span>
                <div className="flex items-center">
                  {c.targetUserId ? (
                      <span className="flex items-center gap-1.5 font-body text-[9px] uppercase tracking-widest font-bold text-[var(--brand)]">
                          <User size={12} strokeWidth={2}/> Exclusive
                      </span>
                  ) : c.targetCategory ? (
                      <span className="flex items-center gap-1.5 font-body text-[9px] uppercase tracking-widest font-bold text-[var(--text)]">
                          <Users size={12} strokeWidth={2}/> {CATEGORIES.find(cat => cat.id === c.targetCategory)?.label || c.targetCategory}
                      </span>
                  ) : (
                      <span className="font-body text-[9px] uppercase tracking-widest font-bold text-[var(--sub)]">
                        Public
                      </span>
                  )}
                </div>
              </div>

              {/* Constraints */}
              <div className="flex flex-col justify-center gap-1">
                <span className="font-body text-[8px] font-bold uppercase tracking-widest text-[var(--muted)] mb-0.5">Constraints</span>
                {c.minOrderValue > 0 && <span className="font-body text-[11px] font-medium text-[var(--text)]">Min ₹{c.minOrderValue}</span>}
                {c.minItemCount > 0 && <span className="font-body text-[11px] font-medium text-[var(--text)]">Min {c.minItemCount} Items</span>}
                <span className="font-body text-[9px] uppercase tracking-widest font-bold text-[var(--sub)] mt-0.5">
                  {c.firstOrderOnly ? "First Order Only" : "Multi-Use"}
                </span>
              </div>

              {/* Validity */}
              <div className="flex flex-col justify-center gap-1.5">
                <span className="font-body text-[8px] font-bold uppercase tracking-widest text-[var(--muted)]">Expires On</span>
                <div className="font-body text-[11px] font-medium text-[var(--text)] flex items-center gap-1.5">
                  <Calendar size={12} strokeWidth={2} className="text-[var(--muted)]"/>
                  {c.validUntil ? new Date(c.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Expiry'}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex justify-end gap-2 xl:opacity-0 group-hover:opacity-100 transition-opacity duration-300 pt-3 xl:pt-0 border-t border-[var(--border)]/20 dark:border-[var(--border)]/40 xl:border-none shrink-0">
              <button 
                onClick={() => setEditingCoupon({ ...c })} 
                className="p-2 text-[var(--text)] hover:text-[var(--brand)] bg-[var(--surface-muted)]/30 hover:bg-[var(--surface-muted)] rounded-lg transition-colors ring-1 ring-[var(--border)]/40 shadow-sm"
                title="Edit"
              >
                <Edit2 size={14} strokeWidth={2} />
              </button>
              <button 
                onClick={() => deleteCoupon(c.id)} 
                className="p-2 text-[var(--muted)] hover:text-[var(--error)] bg-[var(--surface-muted)]/30 hover:bg-[var(--error)]/10 rounded-lg transition-all ring-1 ring-[var(--border)]/40 shadow-sm"
                title="Delete"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        ))}
        
        {/* EMPTY STATE */}
        {coupons.filter(c => !c.isAutomatic).length === 0 && (
          <motion.div variants={itemVariants} className="py-20 text-center ring-1 ring-dashed ring-[var(--border)]/50 rounded-[2rem] bg-[var(--surface-muted)]/10 flex flex-col items-center justify-center">
            <Tag size={24} strokeWidth={1.5} className="text-[var(--muted)] mb-3 opacity-60" />
            <p className="font-display font-medium text-base text-[var(--sub)] tracking-tight">No manual coupons active.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ManualCoupons;