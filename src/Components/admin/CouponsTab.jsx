import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, Layers, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CouponForm from '../../features/admin/components/coupons/CouponForm';
import ManualCoupons from '../../features/admin/components/coupons/ManualCoupons';
import AutoPromotions from '../../features/admin/components/coupons/AutoPromotions';

// 🟢 PREDEFINED CATEGORIES FOR TARGETING (ALL 16 CATEGORIES ADDED)
const CATEGORIES = [
  // --- Standard ---
  { id: 'new_user', label: 'New Users', desc: 'Joined < 30 days ago' },
  { id: 'vip', label: 'VIP Members', desc: 'High spenders (> ₹10k)' },
  { id: 'returning', label: 'Returning', desc: 'More than 2 orders' },
  { id: 'inactive', label: 'Inactive', desc: 'No orders in 60 days' },

  // --- Expansion ---
  { id: 'one_time_buyer', label: 'One-Time Buyers', desc: 'Ordered exactly once' },
  { id: 'big_spenders', label: 'Big Spenders', desc: 'Avg Order Value > ₹2000' },
  { id: 'almost_vip', label: 'Almost VIP', desc: 'Spent ₹7k - ₹10k' },
  { id: 'loyal_customers', label: 'Loyalists', desc: '10+ Orders placed' },
  { id: 'subscribers', label: 'Subscribers', desc: 'Opted-in for promos' },
  { id: 'frequent_low_spender', label: 'Frequent/Low Spend', desc: '5+ orders, < ₹5k total' },

  // --- Unique / Behavioral ---
  { id: 'coupon_hunter', label: 'Coupon Hunters', desc: 'Only buys with discounts' },
  { id: 'churn_risk', label: 'At Risk', desc: 'Regulars drifting away (45+ days)' },
  { id: 'trending_user', label: 'Trending', desc: '2+ orders in last 14 days' },
  { id: 'anniversary_month', label: 'Anniversaries', desc: 'Joined this month (prev years)' },
  { id: 'whale', label: 'Whales', desc: 'Top 1% Spenders (> ₹50k)' },
  { id: 'weekend_shopper', label: 'Weekend Warriors', desc: 'Prefers Sat/Sun shopping' },
];

const CouponsTab = ({ 
  coupons, 
  users = [], // 🟢 Added users prop for targeting logic
  couponSubTab, 
  setCouponSubTab, 
  editingCoupon, 
  setEditingCoupon, 
  saveCoupon, 
  deleteCoupon 
}) => {

  // 🟢 Local State for Audience Targeting UI
  const [audienceType, setAudienceType] = useState('public'); // 'public' | 'specific_user' | 'category'
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [matchingUsers, setMatchingUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 🟢 FIXED: Only run initialization when the form OPENS (changes ID), not on every edit
  useEffect(() => {
      if (editingCoupon) {
          if (editingCoupon.targetUserId) {
              setAudienceType('specific_user');
          } else if (editingCoupon.targetCategory) {
              setAudienceType('category');
          } else {
              setAudienceType('public');
          }
      } else {
          setAudienceType('public');
          setMatchingUsers([]);
          setUserSearchTerm("");
      }
  }, [editingCoupon ? (editingCoupon.id || 'NEW') : null]);

  // 🟢 Logic to Preview Users in a Category
  const handleSearchCategory = () => {
      if (!users || !editingCoupon?.targetCategory) return;
      setIsSearching(true);
      setMatchingUsers([]); 
      
      const cat = editingCoupon.targetCategory;
      const now = new Date();
      
      // Time Constants for Frontend Simulation
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const filtered = users.filter(u => {
          const orders = u.orders || [];
          const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
          const orderCount = orders.length;
          const lastOrderDate = orderCount > 0 
            ? new Date(Math.max(...orders.map(o => new Date(o.createdAt)))) 
            : null;
          const joinDate = new Date(u.createdAt);
          const aov = orderCount > 0 ? totalSpent / orderCount : 0;

          switch(cat) {
              case 'new_user': return joinDate > thirtyDaysAgo;
              case 'vip': return totalSpent > 10000;
              case 'returning': return orderCount > 2;
              case 'inactive': return orderCount > 0 && lastOrderDate && lastOrderDate < sixtyDaysAgo;
              case 'one_time_buyer': return orderCount === 1;
              case 'big_spenders': return aov > 2000;
              case 'almost_vip': return totalSpent >= 7000 && totalSpent < 10000;
              case 'loyal_customers': return orderCount >= 10;
              case 'subscribers': return u.notify_promos === true;
              case 'frequent_low_spender': return orderCount > 5 && totalSpent < 5000;
              case 'coupon_hunter': 
                  if(orderCount < 2) return false;
                  return (orders.filter(o => o.couponCode).length / orderCount) >= 0.75;
              case 'churn_risk':
                  if(!lastOrderDate || orderCount < 3) return false;
                  const daysSince = Math.ceil(Math.abs(now - lastOrderDate) / (1000 * 60 * 60 * 24));
                  return daysSince > 45 && daysSince <= 90;
              case 'trending_user':
                  return orders.filter(o => new Date(o.createdAt) > twoWeeksAgo).length >= 2;
              case 'anniversary_month':
                  return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() < now.getFullYear();
              case 'whale': return totalSpent > 50000;
              case 'weekend_shopper':
                  if(orderCount < 2) return false;
                  const weekends = orders.filter(o => {
                      const d = new Date(o.createdAt).getDay();
                      return d === 0 || d === 6;
                  }).length;
                  return (weekends / orderCount) > 0.6;
              default: return false;
          }
      });

      setTimeout(() => {
          setMatchingUsers(filtered);
          setIsSearching(false);
      }, 500); 
  };

  const specificUserOptions = useMemo(() => {
      if (!users) return [];
      if (!userSearchTerm) return users.slice(0, 10);
      return users.filter(u => 
        (u.name || "").toLowerCase().includes(userSearchTerm.toLowerCase()) || 
        (u.email || "").toLowerCase().includes(userSearchTerm.toLowerCase())
      ).slice(0, 20);
  }, [users, userSearchTerm]);

  // 🟢 Redesigned Badge Colors (Quiet Luxury System)
  const getBadgeColor = (type) => {
    switch (type) {
      case 'percent': return 'bg-[var(--accent)]/10 text-[var(--accent)] ring-[var(--accent)]/20';
      case 'flat': return 'bg-[var(--success)]/10 text-[var(--success)] ring-[var(--success)]/20';
      case 'free_item': return 'bg-[var(--brand)]/10 text-[var(--brand)] ring-[var(--brand)]/20';
      default: return 'bg-[var(--surface-muted)] text-[var(--sub)] ring-[var(--border)]/40';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 bg-[var(--bg)] min-h-screen font-body transition-colors duration-500 pb-28 w-full overflow-hidden">

      {/* --- 1. Header & Tab Navigation --- */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[var(--surface)] py-5 px-6 sm:px-8 rounded-[1.5rem] sm:rounded-[2rem] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-500"
      >
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-medium text-[var(--text)] flex items-center gap-3 tracking-tight">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--surface-muted)]/50 ring-1 ring-[var(--border)]/40 dark:ring-[var(--border)]/60 text-[var(--brand)] shadow-sm">
              <Ticket size={18} className="sm:w-5 sm:h-5" strokeWidth={1.5} />
            </div>
            Promo & Campaigns
          </h2>
          <p className="font-body text-[10px] sm:text-[11px] text-[var(--muted)] mt-1.5 sm:mt-2 tracking-wide">
            Manage discount codes and automate conditional cart promotions.
          </p>
        </div>

        <div className="flex bg-[var(--surface-muted)]/30 p-1 rounded-[1rem] ring-1 ring-[var(--border)]/40 shadow-inner w-full lg:w-auto">
          <button
            onClick={() => { setCouponSubTab("manual"); setEditingCoupon(null); }}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 font-body font-bold text-[10px] sm:text-[11px] uppercase tracking-widest rounded-xl transition-all duration-300 flex-1 lg:flex-none ${
              couponSubTab === "manual"
                ? "bg-[var(--surface)] text-[var(--text)] ring-1 ring-[var(--border)]/50 shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
            }`}
          >
            <Tag size={16} strokeWidth={2} /> Manual
          </button>
          <button
            onClick={() => { setCouponSubTab("auto"); setEditingCoupon(null); }}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 font-body font-bold text-[10px] sm:text-[11px] uppercase tracking-widest rounded-xl transition-all duration-300 flex-1 lg:flex-none ${
              couponSubTab === "auto"
                ? "bg-[var(--surface)] text-[var(--text)] ring-1 ring-[var(--border)]/50 shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
            }`}
          >
            <Layers size={16} strokeWidth={2} /> Automated
          </button>
        </div>
      </motion.div>

      {/* --- 2. Add/Edit Form --- */}
      <AnimatePresence>
        {editingCoupon && (
          <CouponForm 
            editingCoupon={editingCoupon}
            setEditingCoupon={setEditingCoupon}
            saveCoupon={saveCoupon}
            audienceType={audienceType}
            setAudienceType={setAudienceType}
            userSearchTerm={userSearchTerm}
            setUserSearchTerm={setUserSearchTerm}
            specificUserOptions={specificUserOptions}
            CATEGORIES={CATEGORIES}
            handleSearchCategory={handleSearchCategory}
            isSearching={isSearching}
            matchingUsers={matchingUsers}
          />
        )}
      </AnimatePresence>

      {/* --- 3. Manual Coupons List --- */}
      {couponSubTab === 'manual' && (
        <ManualCoupons 
          coupons={coupons}
          setEditingCoupon={setEditingCoupon}
          deleteCoupon={deleteCoupon}
          getBadgeColor={getBadgeColor}
          CATEGORIES={CATEGORIES}
        />
      )}

      {/* --- 4. Automatic Promotions List --- */}
      {couponSubTab === 'auto' && (
        <AutoPromotions 
          coupons={coupons}
          setEditingCoupon={setEditingCoupon}
          deleteCoupon={deleteCoupon}
          getBadgeColor={getBadgeColor}
        />
      )}
    </div>
  );
};

export default CouponsTab;