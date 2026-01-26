// src/components/admin/CouponsTab.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tag, Percent, Calendar, AlertCircle, Trash2, Edit2, 
  Plus, Ticket, Layers, ShoppingBag, X,
  Search, User, Users
} from 'lucide-react';

// --- STYLED HELPER COMPONENTS ---
const InputField = React.forwardRef(({ label, name, value, onChange, placeholder, type = "text", span = "col-span-1", ...props }, ref) => (
  <div className={span}>
    <label htmlFor={name} className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
    <div className="relative">
      <input
        id={name}
        ref={ref}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
        {...props}
      />
    </div>
  </div>
));

const TextAreaField = ({ label, name, value, onChange, placeholder, span = "col-span-1" }) => (
  <div className={span}>
    <label htmlFor={name} className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={3}
      className="block w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 resize-none"
    />
  </div>
);

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

      // Filter logic (Client-side simulation for preview)
      // Note: This is an approximation. The backend is the source of truth.
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
              // Standard
              case 'new_user': return joinDate > thirtyDaysAgo;
              case 'vip': return totalSpent > 10000;
              case 'returning': return orderCount > 2;
              case 'inactive': return orderCount > 0 && lastOrderDate && lastOrderDate < sixtyDaysAgo;
              
              // Expansion
              case 'one_time_buyer': return orderCount === 1;
              case 'big_spenders': return aov > 2000;
              case 'almost_vip': return totalSpent >= 7000 && totalSpent < 10000;
              case 'loyal_customers': return orderCount >= 10;
              case 'subscribers': return u.notify_promos === true;
              case 'frequent_low_spender': return orderCount > 5 && totalSpent < 5000;

              // Unique
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

  // 🟢 Filtered list for "Specific User" dropdown
  const specificUserOptions = useMemo(() => {
      if (!users) return [];
      if (!userSearchTerm) return users.slice(0, 10);
      return users.filter(u => 
        (u.name || "").toLowerCase().includes(userSearchTerm.toLowerCase()) || 
        (u.email || "").toLowerCase().includes(userSearchTerm.toLowerCase())
      ).slice(0, 20);
  }, [users, userSearchTerm]);

  const getBadgeColor = (type) => {
    switch (type) {
      case 'percent': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'flat': return 'bg-green-50 text-green-700 border-green-100';
      case 'free_item': return 'bg-orange-50 text-orange-700 border-orange-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-8 bg-gray-50 min-h-screen">

      {/* --- 1. Header & Tab Navigation --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
            <Ticket className="w-8 h-8 text-indigo-600" />
            Promo Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage discount codes and automatic cart promotions.</p>
        </div>

        <div className="flex p-1 bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => { setCouponSubTab("manual"); setEditingCoupon(null); }}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
              couponSubTab === "manual"
                ? "bg-gray-900 text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Tag size={16} /> Manual Coupons
          </button>
          <button
            onClick={() => { setCouponSubTab("auto"); setEditingCoupon(null); }}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
              couponSubTab === "auto"
                ? "bg-gray-900 text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Layers size={16} /> Auto Promotions
          </button>
        </div>
      </div>

      {/* --- 2. Add/Edit Form --- */}
      <AnimatePresence>
        {editingCoupon && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {editingCoupon.id ? <Edit2 size={18} className="text-indigo-600"/> : <Plus size={18} className="text-indigo-600"/>}
                  {editingCoupon.id ? "Edit" : "Create New"}
                  {editingCoupon.isAutomatic ? " Promotion" : " Coupon"}
                </h3>
                <button onClick={() => setEditingCoupon(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">

                  {/* --- Column 1: Details & Action --- */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">1</span>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Core Details</h4>
                    </div>
                    
                    <div className="space-y-5 pl-10">
                      <div>
                        <InputField
                          label={editingCoupon.isAutomatic ? "Promotion Name (Internal ID)" : "Coupon Code *"}
                          name="code"
                          value={editingCoupon.code || ""}
                          onChange={(e) => setEditingCoupon((ec) => ({ ...ec, code: e.target.value.toUpperCase() }))}
                          placeholder={editingCoupon.isAutomatic ? "e.g. BOGO_SALE" : "e.g. SAVE20"}
                        />
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                          <AlertCircle size={10} />
                          {editingCoupon.isAutomatic ? "Display name for cart summary." : "Customer enters this at checkout."}
                        </p>
                      </div>

                      {/* 🟢 TARGET AUDIENCE SECTION */}
                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Audience</label>
                        
                        {/* Tabs */}
                        <div className="flex gap-2 mb-4 p-1 bg-gray-50 rounded-xl border border-gray-200">
                            <button 
                                type="button"
                                onClick={() => { 
                                    setAudienceType('public'); 
                                    setEditingCoupon(p => ({...p, targetUserId: null, targetCategory: null}));
                                }}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${audienceType === 'public' ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Everyone
                            </button>
                            <button 
                                type="button"
                                onClick={() => { 
                                    setAudienceType('specific_user'); 
                                    setEditingCoupon(p => ({...p, targetCategory: null})); 
                                }}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${audienceType === 'specific_user' ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Specific User
                            </button>
                            <button 
                                type="button"
                                onClick={() => { 
                                    setAudienceType('category'); 
                                    setEditingCoupon(p => ({...p, targetUserId: null})); 
                                }}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${audienceType === 'category' ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                User Category
                            </button>
                        </div>

                        {/* Panel: Specific User */}
                        {audienceType === 'specific_user' && (
                            <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-3 space-y-2 mb-4">
                                <label className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                                    <Search size={12}/> Search User
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Type name or email..." 
                                    className="block w-full px-3 py-2 bg-white rounded-lg text-sm border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    value={userSearchTerm}
                                    onChange={e => setUserSearchTerm(e.target.value)}
                                />
                                <select
                                    value={editingCoupon.targetUserId || ""}
                                    onChange={(e) => setEditingCoupon(p => ({ ...p, targetUserId: e.target.value || null }))}
                                    className="block w-full px-3 py-2 bg-white rounded-lg text-sm text-gray-900 border border-indigo-100 outline-none cursor-pointer"
                                >
                                    <option value="">-- Select a User --</option>
                                    {specificUserOptions.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Panel: Category */}
                        {audienceType === 'category' && (
                            <div className="space-y-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 transition-all mb-4">
                                <div className="grid grid-cols-1 gap-2">
                                    {CATEGORIES.map(cat => (
                                        <label key={cat.id} className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg border transition-all ${editingCoupon.targetCategory === cat.id ? 'bg-white border-indigo-300 shadow-sm' : 'border-transparent hover:bg-white/50'}`}>
                                            <input 
                                                type="radio" 
                                                name="category_select"
                                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                checked={editingCoupon.targetCategory === cat.id}
                                                onChange={() => {
                                                    setEditingCoupon(p => ({ ...p, targetCategory: cat.id }));
                                                    setMatchingUsers([]); 
                                                }}
                                            />
                                            <div>
                                                <span className="text-xs font-bold text-gray-800 block">{cat.label}</span>
                                                <span className="text-[10px] text-gray-500 block">{cat.desc}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                
                                <button 
                                    type="button"
                                    onClick={handleSearchCategory}
                                    disabled={!editingCoupon.targetCategory || isSearching}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"
                                >
                                    {isSearching ? <div className="animate-spin w-3 h-3 border-2 border-white rounded-full border-t-transparent"/> : <Search size={12} />}
                                    {matchingUsers.length > 0 ? `Found ${matchingUsers.length} Users` : "Preview Users"}
                                </button>

                                {matchingUsers.length > 0 && (
                                    <div className="max-h-24 overflow-y-auto bg-white rounded-lg border border-indigo-100 p-2 space-y-1 scrollbar-thin">
                                        {matchingUsers.map(u => (
                                            <div key={u.id} className="text-[10px] text-gray-600 flex justify-between items-center p-1 hover:bg-gray-50 rounded">
                                                <span className="truncate max-w-[120px] font-medium">{u.name}</span>
                                                <span className="text-gray-400">{u.email}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                      </div>

                      <TextAreaField
                        label="Internal Description"
                        name="description"
                        value={editingCoupon.description || ""}
                        onChange={(e) => setEditingCoupon((ec) => ({ ...ec, description: e.target.value }))}
                        placeholder="e.g. Summer Sale 2024 Campaign"
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Discount Type</label>
                          <select
                            value={editingCoupon.discountType || "percent"}
                            onChange={(e) => setEditingCoupon((ec) => ({ ...ec, discountType: e.target.value }))}
                            className="block w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          >
                            <option value="percent">Percentage (%)</option>
                            <option value="flat">Flat Amount (₹)</option>
                            <option value="free_item">Free Item</option>
                          </select>
                        </div>
                        <InputField
                          label="Value"
                          name="discountValue"
                          type="number"
                          value={editingCoupon.discountValue ?? 0}
                          onChange={(e) => setEditingCoupon((ec) => ({ ...ec, discountValue: +e.target.value }))}
                        />
                      </div>

                      {editingCoupon.discountType === 'percent' && (
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                          <InputField
                            label="Max Discount Cap (₹)"
                            name="maxDiscountAmount"
                            type="number"
                            placeholder="0 = No Limit"
                            value={editingCoupon.maxDiscountAmount ?? ""}
                            onChange={(e) => setEditingCoupon((ec) => ({ ...ec, maxDiscountAmount: e.target.value === "" ? null : +e.target.value }))}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* --- Column 2: Rules & Validity --- */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">2</span>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Usage Rules</h4>
                    </div>

                    <div className="space-y-5 pl-10">
                      <div className="grid grid-cols-2 gap-4">
                        <InputField
                          label="Min Order (₹)"
                          name="minOrderValue"
                          type="number"
                          value={editingCoupon.minOrderValue ?? 0}
                          onChange={(e) => setEditingCoupon((ec) => ({ ...ec, minOrderValue: +e.target.value }))}
                        />
                        <InputField
                          label="Min Items"
                          name="minItemCount"
                          type="number"
                          value={editingCoupon.minItemCount ?? 0}
                          onChange={(e) => setEditingCoupon((ec) => ({ ...ec, minItemCount: +e.target.value }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <InputField
                          label="Max Uses / User"
                          name="maxUsagePerUser"
                          type="number"
                          placeholder="Empty = ∞"
                          value={editingCoupon.maxUsagePerUser ?? ""}
                          onChange={(e) => setEditingCoupon((ec) => ({ ...ec, maxUsagePerUser: e.target.value === "" ? null : +e.target.value }))}
                        />
                        <div className="flex items-end pb-3">
                          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl w-full cursor-pointer hover:bg-gray-100 transition">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                              checked={editingCoupon.firstOrderOnly ?? false}
                              onChange={(e) => setEditingCoupon((ec) => ({ ...ec, firstOrderOnly: e.target.checked }))}
                            />
                            <span className="text-sm font-medium text-gray-700">First Order Only</span>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                        <InputField
                          label="Valid From"
                          name="validFrom"
                          type="date"
                          value={editingCoupon.validFrom ? new Date(editingCoupon.validFrom).toISOString().split("T")[0] : ""}
                          onChange={(e) => setEditingCoupon((ec) => ({ ...ec, validFrom: e.target.value }))}
                        />
                        <InputField
                          label="Expires On"
                          name="validUntil"
                          type="date"
                          value={editingCoupon.validUntil ? new Date(editingCoupon.validUntil).toISOString().split("T")[0] : ""}
                          onChange={(e) => setEditingCoupon((ec) => ({ ...ec, validUntil: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* --- Row 3: Auto Rules (Full Width) --- */}
                  {editingCoupon.isAutomatic && (
                    <div className="lg:col-span-2 mt-4">
                      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                        <h4 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                          <Layers size={16}/> Automatic Conditions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          <InputField label="Req. Category" name="cond_requiredCategory" value={editingCoupon.cond_requiredCategory || ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, cond_requiredCategory: e.target.value }))} />
                          <InputField label="Req. Size (ml)" name="cond_requiredSize" type="number" value={editingCoupon.cond_requiredSize ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, cond_requiredSize: e.target.value === "" ? null : +e.target.value }))} />
                          <InputField label="Target Size (ml)" name="action_targetSize" type="number" value={editingCoupon.action_targetSize ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_targetSize: e.target.value === "" ? null : +e.target.value }))} />
                          <InputField label="Target Max Price" name="action_targetMaxPrice" type="number" value={editingCoupon.action_targetMaxPrice ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_targetMaxPrice: e.target.value === "" ? null : +e.target.value }))} />
                          <div className="flex gap-2">
                            <InputField label="Buy X" name="action_buyX" type="number" value={editingCoupon.action_buyX ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_buyX: e.target.value === "" ? null : +e.target.value }))} />
                            <InputField label="Get Y" name="action_getY" type="number" value={editingCoupon.action_getY ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_getY: e.target.value === "" ? null : +e.target.value }))} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                <div className="flex items-center justify-end gap-3 pt-8 mt-4 border-t border-gray-100">
                  <button onClick={() => setEditingCoupon(null)} className="px-6 py-3 text-sm font-bold text-gray-600 bg-white rounded-xl hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button onClick={saveCoupon} className="px-8 py-3 text-sm font-bold text-white bg-gray-900 rounded-xl hover:bg-black transition shadow-lg shadow-gray-200">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 3. Manual Coupons List --- */}
      {couponSubTab === 'manual' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Active Manual Coupons</h2>
              <p className="text-xs text-gray-500">Customers enter these codes at checkout.</p>
            </div>
            <button
              onClick={() => setEditingCoupon({
                code: "", discountType: "percent", discountValue: 10, isAutomatic: false,
                minOrderValue: 0, minItemCount: 0, maxDiscountAmount: null, firstOrderOnly: false, maxUsagePerUser: 1,
                targetUserId: null, targetCategory: null
              })}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
            >
              <Plus size={16} /> Create Coupon
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Coupon Info</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Discount</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Targeting</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Constraints</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Validity</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.filter(c => !c.isAutomatic).map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                            <Tag size={18} />
                          </div>
                          <div>
                            <div className="font-mono font-bold text-gray-900 text-sm">{c.code}</div>
                            <div className="text-xs text-gray-500 max-w-[150px] truncate">{c.description || "No description"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(c.discountType)}`}>
                          {c.discountType === 'percent' && <Percent size={10} className="mr-1"/>}
                          {c.discountType === 'percent' ? `${c.discountValue}% Off` : (c.discountType === 'free_item' ? 'Free Item' : `₹${c.discountValue} Off`)}
                        </span>
                        {c.maxDiscountAmount > 0 && <div className="text-[10px] text-gray-400 mt-1">Up to ₹{c.maxDiscountAmount}</div>}
                      </td>
                      {/* 🟢 NEW TARGETING COLUMN */}
                      <td className="px-6 py-4">
                        {c.targetUserId ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 w-fit">
                                <User size={10}/> User Exclusive
                            </span>
                        ) : c.targetCategory ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100 w-fit">
                                <Users size={10}/> {CATEGORIES.find(cat => cat.id === c.targetCategory)?.label || c.targetCategory}
                            </span>
                        ) : (
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded border border-gray-200 w-fit">Public</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {c.minOrderValue > 0 && <div className="text-xs text-gray-600 flex items-center gap-1">Min ₹{c.minOrderValue}</div>}
                          {c.minItemCount > 0 && <div className="text-xs text-gray-600 flex items-center gap-1">Min {c.minItemCount} Items</div>}
                          <div className="text-xs text-gray-400">{c.firstOrderOnly ? "First Order Only" : "Returning Allowed"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 flex items-center gap-1.5">
                          <Calendar size={12} className="text-gray-400"/>
                          {c.validUntil ? new Date(c.validUntil).toLocaleDateString() : 'No Expiry'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingCoupon({ ...c })} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"><Edit2 size={14} /></button>
                          <button onClick={() => deleteCoupon(c.id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {coupons.filter(c => !c.isAutomatic).length === 0 && (
                    <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-sm">No manual coupons found. Create one above.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- 4. Automatic Promotions List --- */}
      {couponSubTab === 'auto' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Automatic Promotions</h2>
              <p className="text-xs text-gray-500">Applied automatically when cart conditions are met.</p>
            </div>
            <button
              onClick={() => setEditingCoupon({
                code: "NEW_OFFER", discountType: "free_item", discountValue: 0, isAutomatic: true,
                minOrderValue: 0, minItemCount: 0, maxDiscountAmount: null, cond_requiredCategory: "Template",
                action_targetSize: 30, action_targetMaxPrice: 600, targetUserId: null, targetCategory: null
              })}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
            >
              <Plus size={16} /> Create Promotion
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {coupons.filter(c => c.isAutomatic).map((c) => (
              <div key={c.id} className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] p-5 hover:shadow-md transition-all group relative">
                <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingCoupon({ ...c })} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-md"><Edit2 size={14} /></button>
                  <button onClick={() => deleteCoupon(c.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-md"><Trash2 size={14} /></button>
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{c.code}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{c.description}</p>
                    <span className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${getBadgeColor(c.discountType)}`}>
                      {c.discountType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-50">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Trigger</span>
                    <span className="font-medium text-gray-700">
                      {c.cond_requiredCategory ? `Buy ${c.cond_requiredCategory}` : `Min ₹${c.minOrderValue}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Reward</span>
                    <span className="font-medium text-gray-700">
                      {c.action_targetSize ? `${c.action_targetSize}ml Item` : `${c.discountValue}% Off`}
                    </span>
                  </div>
                  {/* 🟢 NEW: Targeting Badge for Auto Offers */}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Audience</span>
                    <span className={`font-bold ${c.targetUserId ? 'text-indigo-600' : 'text-gray-600'}`}>
                      {c.targetUserId ? 'Exclusive' : c.targetCategory ? 'Category' : 'Everyone'}
                    </span>
                  </div>

                  {c.action_buyX && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Logic</span>
                      <span className="font-bold text-indigo-600">Buy {c.action_buyX} Get {c.action_getY}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {coupons.filter(c => c.isAutomatic).length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <Layers size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm font-medium">No active automatic promotions.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CouponsTab;