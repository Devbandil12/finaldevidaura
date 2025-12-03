import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tag, Percent, Calendar, AlertCircle, Trash2, Edit2, 
  Plus, CheckCircle, Ticket, Layers, ShoppingBag, X 
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
        className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
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
      className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 resize-none"
    />
  </div>
);

const CouponsTab = ({ 
  coupons, 
  couponSubTab, 
  setCouponSubTab, 
  editingCoupon, 
  setEditingCoupon, 
  saveCoupon, 
  deleteCoupon 
}) => {

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

        <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
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
                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
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
                          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 w-full cursor-pointer hover:bg-gray-100 transition">
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
                  <button onClick={() => setEditingCoupon(null)} className="px-6 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
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
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Active Manual Coupons</h2>
              <p className="text-xs text-gray-500">Customers enter these codes at checkout.</p>
            </div>
            <button
              onClick={() => setEditingCoupon({
                code: "", discountType: "percent", discountValue: 10, isAutomatic: false,
                minOrderValue: 0, minItemCount: 0, maxDiscountAmount: null, firstOrderOnly: false, maxUsagePerUser: 1
              })}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-sm"
            >
              <Plus size={16} /> Create Coupon
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Coupon Info</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Discount</th>
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
                        {/* CORRECTED FIX: opacity-100 (mobile default), sm:opacity-0 (desktop hidden default), group-hover:opacity-100 (desktop hover override) */}
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingCoupon({ ...c })} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"><Edit2 size={14} /></button>
                          <button onClick={() => deleteCoupon(c.id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {coupons.filter(c => !c.isAutomatic).length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">No manual coupons found. Create one above.</td></tr>
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
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Automatic Promotions</h2>
              <p className="text-xs text-gray-500">Applied automatically when cart conditions are met.</p>
            </div>
            <button
              onClick={() => setEditingCoupon({
                code: "NEW_OFFER", discountType: "free_item", discountValue: 0, isAutomatic: true,
                minOrderValue: 0, minItemCount: 0, maxDiscountAmount: null, cond_requiredCategory: "Template",
                action_targetSize: 30, action_targetMaxPrice: 600
              })}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-sm"
            >
              <Plus size={16} /> Create Promotion
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {coupons.filter(c => c.isAutomatic).map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all group relative">
                {/* CORRECTED FIX: opacity-100 (mobile default), md:opacity-0 (desktop hidden default), group-hover:opacity-100 (desktop hover override) */}
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