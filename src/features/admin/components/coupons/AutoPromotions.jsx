import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, ShoppingBag, Layers } from 'lucide-react';

const AutoPromotions = ({
  coupons,
  setEditingCoupon,
  deleteCoupon,
  getBadgeColor
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 font-body">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-5 bg-[var(--surface)] p-6 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
        <div>
          <h2 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Automatic Promotions</h2>
          <p className="font-display italic text-lg text-[var(--sub)] mt-1 tracking-wide">Applied automatically when cart conditions are met.</p>
        </div>
        <button
          onClick={() => setEditingCoupon({
            code: "NEW_OFFER", discountType: "free_item", discountValue: 0, isAutomatic: true,
            minOrderValue: 0, minItemCount: 0, maxDiscountAmount: null, cond_requiredCategory: "Template", firstOrderOnly: false, maxUsagePerUser: null, totalUsageLimit: null,
            action_targetSize: 30, action_targetMaxPrice: 600, targetUserId: null, targetCategory: null
          })}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--brand)] text-[var(--surface)] rounded-lg font-body font-bold text-sm tracking-wide hover:brightness-110 transition-all shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] button-hero"
        >
          <Plus size={18} strokeWidth={2.5} /> Create Promotion
          <div className="pulse border-[var(--surface)]"></div>
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {coupons.filter(c => c.isAutomatic).map((c) => (
          <div key={c.id} className="bg-[var(--surface)] rounded-2xl shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] border border-[var(--border)] hover:border-[var(--border)] p-6 transition-all duration-300 group relative flex flex-col cursor-default">
            
            {/* HOVER ACTIONS */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={() => setEditingCoupon({ ...c })} 
                className="p-2 text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-muted)] rounded-lg transition-colors border border-transparent hover:border-[var(--border)] shadow-sm"
                title="Edit"
              >
                <Edit2 size={16} strokeWidth={2} />
              </button>
              <button 
                onClick={() => deleteCoupon(c.id)} 
                className="p-2 text-[var(--muted)] hover:text-[var(--bg)] hover:bg-[var(--error)] rounded-lg transition-all border border-transparent hover:border-[var(--error)] shadow-sm"
                title="Delete"
              >
                <Trash2 size={16} strokeWidth={2} />
              </button>
            </div>

            {/* CARD HEADER */}
            <div className="flex items-start gap-4 mb-2">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--brand)] shadow-sm group-hover:scale-105 group-hover:border-[var(--brand)] transition-all duration-300 shrink-0">
                <ShoppingBag size={20} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1 pr-16 lg:pr-0">
                <h3 className="font-body font-bold text-[var(--text)] text-base tracking-wide truncate group-hover:text-[var(--brand)] transition-colors">{c.code}</h3>
                <p className="font-body text-xs font-bold text-[var(--sub)] line-clamp-1 mt-0.5">{c.description}</p>
                <span className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-md font-body text-[9px] font-bold uppercase tracking-widest border transition-colors duration-300 ${getBadgeColor(c.discountType)}`}>
                  {c.discountType.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* CARD DETAILS */}
            <div className="space-y-3 pt-5 mt-5 border-t border-[var(--border)] flex-1 flex flex-col justify-end">
              <div className="flex justify-between items-center text-xs">
                <span className="font-body font-bold text-[10px] uppercase tracking-widest text-[var(--muted)]">Trigger</span>
                <span className="font-body font-bold text-[var(--text)] text-sm tracking-tight">
                  {c.cond_requiredCategory ? `Buy ${c.cond_requiredCategory}` : `Min ₹${c.minOrderValue?.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-body font-bold text-[10px] uppercase tracking-widest text-[var(--muted)]">Reward</span>
                <span className="font-body font-bold text-[var(--success)] text-sm tracking-tight">
                  {c.action_targetSize ? `${c.action_targetSize}ml Item` : `${c.discountValue}% Off`}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-body font-bold text-[10px] uppercase tracking-widest text-[var(--muted)]">Audience</span>
                <span className={`font-body font-bold text-sm tracking-tight ${c.targetUserId ? 'text-[var(--brand)]' : 'text-[var(--text)]'}`}>
                  {c.targetUserId ? 'Exclusive' : c.targetCategory ? 'Category' : 'Everyone'}
                </span>
              </div>

              {c.action_buyX && (
                <div className="flex justify-between items-center text-xs mt-1 pt-3 border-t border-[var(--border)]">
                  <span className="font-body font-bold text-[10px] uppercase tracking-widest text-[var(--muted)]">Logic</span>
                  <span className="font-body font-bold text-[var(--brand)] text-sm tracking-tight">Buy {c.action_buyX} Get {c.action_getY}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* EMPTY STATE */}
        {coupons.filter(c => c.isAutomatic).length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)] shadow-[var(--shadow)] flex flex-col items-center justify-center">
            <Layers size={40} strokeWidth={1} className="text-[var(--muted)] mb-4 opacity-50" />
            <p className="font-display italic text-xl text-[var(--sub)] tracking-wide">No active automatic promotions.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AutoPromotions;