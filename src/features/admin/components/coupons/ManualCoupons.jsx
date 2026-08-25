import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Tag, Percent, User, Users, Calendar, Edit2, Trash2 } from 'lucide-react';

const ManualCoupons = ({
  coupons,
  setEditingCoupon,
  deleteCoupon,
  getBadgeColor,
  CATEGORIES
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 font-body">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-5 bg-[var(--surface)] p-6 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
        <div>
          <h2 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Active Manual Coupons</h2>
          <p className="font-display italic text-lg text-[var(--sub)] mt-1 tracking-wide">Customers enter these codes at checkout.</p>
        </div>
        <button
          onClick={() => setEditingCoupon({
            code: "", discountType: "percent", discountValue: 10, isAutomatic: false,
            minOrderValue: 0, minItemCount: 0, maxDiscountAmount: null, firstOrderOnly: false, maxUsagePerUser: 1, totalUsageLimit: null,
            targetUserId: null, targetCategory: null
          })}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--brand)] text-[var(--surface)] rounded-lg font-body font-bold text-sm tracking-wide hover:brightness-110 transition-all shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] button-hero"
        >
          <Plus size={18} strokeWidth={2.5} /> Create Coupon
          <div className="pulse border-[var(--surface)]"></div>
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-[var(--surface)] rounded-xl shadow-[var(--shadow)] border border-[var(--border)] overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto smooth-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest">Coupon Info</th>
                <th className="px-6 py-4 font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest">Discount</th>
                <th className="px-6 py-4 font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest">Targeting</th>
                <th className="px-6 py-4 font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest">Constraints</th>
                <th className="px-6 py-4 font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest">Validity</th>
                <th className="px-6 py-4 font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {coupons.filter(c => !c.isAutomatic).map((c) => (
                <tr key={c.id} className="hover:bg-[var(--surface)] transition-colors duration-300 group cursor-default">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--brand)] shadow-sm group-hover:scale-105 group-hover:border-[var(--brand)] transition-all duration-300 shrink-0">
                        <Tag size={20} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-body font-bold text-[var(--text)] text-base tracking-wide group-hover:text-[var(--brand)] transition-colors">{c.code}</div>
                        <div className="font-body text-[11px] font-bold text-[var(--sub)] max-w-[160px] truncate mt-0.5">{c.description || "No description"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-body text-[10px] font-bold uppercase tracking-widest border transition-colors duration-300 ${getBadgeColor(c.discountType)}`}>
                      {c.discountType === 'percent' && <Percent size={10} strokeWidth={2.5} className="mr-1"/>}
                      {c.discountType === 'percent' ? `${c.discountValue}% Off` : (c.discountType === 'free_item' ? 'Free Item' : `₹${c.discountValue} Off`)}
                    </span>
                    {c.maxDiscountAmount > 0 && <div className="font-body text-[9px] uppercase tracking-widest font-bold text-[var(--muted)] mt-1.5">Up to ₹{c.maxDiscountAmount}</div>}
                  </td>
                  <td className="px-6 py-5">
                    {c.targetUserId ? (
                        <span className="flex items-center gap-1.5 font-body text-[10px] uppercase tracking-widest font-bold text-[var(--brand)] bg-[var(--surface)] px-2.5 py-1 rounded-md border border-[var(--border)] w-fit group-hover:border-[var(--brand)] transition-colors">
                            <User size={12} strokeWidth={2}/> Exclusive
                        </span>
                    ) : c.targetCategory ? (
                        <span className="flex items-center gap-1.5 font-body text-[10px] uppercase tracking-widest font-bold text-[var(--text)] bg-[var(--surface-muted)] px-2.5 py-1 rounded-md border border-[var(--border)] w-fit group-hover:border-[var(--border)] transition-colors">
                            <Users size={12} strokeWidth={2}/> {CATEGORIES.find(cat => cat.id === c.targetCategory)?.label || c.targetCategory}
                        </span>
                    ) : (
                        <span className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] bg-[var(--surface)] px-2.5 py-1 rounded-md border border-[var(--border)] w-fit">
                          Public
                        </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      {c.minOrderValue > 0 && <div className="font-body text-xs font-bold text-[var(--sub)]">Min ₹{c.minOrderValue}</div>}
                      {c.minItemCount > 0 && <div className="font-body text-xs font-bold text-[var(--sub)]">Min {c.minItemCount} Items</div>}
                      <div className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)]">
                        {c.firstOrderOnly ? "First Order Only" : "Returning Allowed"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-body text-xs font-bold text-[var(--sub)] flex items-center gap-2">
                      <Calendar size={14} strokeWidth={2} className="text-[var(--muted)]"/>
                      {c.validUntil ? new Date(c.validUntil).toLocaleDateString() : 'No Expiry'}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                  </td>
                </tr>
              ))}
              {coupons.filter(c => !c.isAutomatic).length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-[var(--sub)] font-display italic text-xl tracking-wide">
                    No manual coupons found. Create one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ManualCoupons;