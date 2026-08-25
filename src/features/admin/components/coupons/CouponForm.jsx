import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Plus, X, AlertCircle, Search } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
const InputField = React.forwardRef(({ label, name, value, onChange, placeholder, type = "text", span = "col-span-1", ...props }, ref) => (
  <div className={span}>
    <label htmlFor={name} className="block font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2.5 ml-1">{label}</label>
    <div className="relative">
      <input
        id={name}
        ref={ref}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full px-4 py-3.5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all placeholder-[var(--muted)]"
        {...props}
      />
    </div>
  </div>
));

const TextAreaField = ({ label, name, value, onChange, placeholder, span = "col-span-1" }) => (
  <div className={span}>
    <label htmlFor={name} className="block font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2.5 ml-1">{label}</label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={3}
      className="block w-full px-4 py-3.5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all placeholder-[var(--muted)] resize-none leading-relaxed"
    />
  </div>
);

const CouponForm = ({
  editingCoupon,
  setEditingCoupon,
  saveCoupon,
  audienceType,
  setAudienceType,
  userSearchTerm,
  setUserSearchTerm,
  specificUserOptions,
  CATEGORIES,
  handleSearchCategory,
  isSearching,
  matchingUsers
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -20 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, y: -20 }}
      className="overflow-hidden font-body"
    >
      <div className="bg-[var(--surface)] rounded-3xl shadow-[var(--shadow-strong)] border border-[var(--border)] overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 md:px-8 py-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)]">
          <h3 className="font-display text-2xl font-medium text-[var(--text)] flex items-center gap-3 tracking-tight">
            {editingCoupon.id ? <Edit2 size={24} strokeWidth={1.5} className="text-[var(--accent)]"/> : <Plus size={24} strokeWidth={1.5} className="text-[var(--accent)]"/>}
            {editingCoupon.id ? "Edit" : "Create New"}
            {editingCoupon.isAutomatic ? " Promotion" : " Coupon"}
          </h3>
          <button onClick={() => setEditingCoupon(null)} className="p-2 hover:bg-[var(--surface-muted)] rounded-lg text-[var(--muted)] hover:text-[var(--brand)] transition-colors">
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">

            {/* --- Column 1: Details & Action --- */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-2 pb-2 border-b border-[var(--border)]">
                <span className="w-8 h-8 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--brand)] font-display font-medium text-lg">1</span>
                <h4 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Core Details</h4>
              </div>
              
              <div className="space-y-6">
                <div>
                  <InputField
                    label={editingCoupon.isAutomatic ? "Promotion Name (Internal ID)" : "Coupon Code *"}
                    name="code"
                    value={editingCoupon.code || ""}
                    onChange={(e) => setEditingCoupon((ec) => ({ ...ec, code: e.target.value.toUpperCase() }))}
                    placeholder={editingCoupon.isAutomatic ? "e.g. BOGO_SALE" : "e.g. SAVE20"}
                  />
                  <p className="font-body text-[10px] uppercase font-bold tracking-widest text-[var(--muted)] mt-2 ml-1 flex items-center gap-1.5">
                    <AlertCircle size={12} strokeWidth={2.5} />
                    {editingCoupon.isAutomatic ? "Display name for cart summary." : "Customer enters this at checkout."}
                  </p>
                </div>

                {/* TARGET AUDIENCE SECTION */}
                <div className="col-span-1">
                  <label className="block font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2.5 ml-1">Target Audience</label>
                  
                  {/* Tabs */}
                  <div className="flex bg-[var(--surface)] p-1.5 rounded-xl border border-[var(--border)] mb-5 shadow-sm">
                      <button 
                          type="button"
                          onClick={() => { 
                              setAudienceType('public'); 
                              setEditingCoupon(p => ({...p, targetUserId: null, targetCategory: null}));
                          }}
                          className={`flex-1 py-2.5 font-body text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${audienceType === 'public' ? 'bg-[var(--brand)] text-[var(--surface)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-muted)]'}`}
                      >
                          Everyone
                      </button>
                      <button 
                          type="button"
                          onClick={() => { 
                              setAudienceType('specific_user'); 
                              setEditingCoupon(p => ({...p, targetCategory: null})); 
                          }}
                          className={`flex-1 py-2.5 font-body text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${audienceType === 'specific_user' ? 'bg-[var(--brand)] text-[var(--surface)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-muted)]'}`}
                      >
                          Specific User
                      </button>
                      <button 
                          type="button"
                          onClick={() => { 
                              setAudienceType('category'); 
                              setEditingCoupon(p => ({...p, targetUserId: null})); 
                          }}
                          className={`flex-1 py-2.5 font-body text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${audienceType === 'category' ? 'bg-[var(--brand)] text-[var(--surface)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-muted)]'}`}
                      >
                          User Category
                      </button>
                  </div>

                  {/* Panel: Specific User */}
                  {audienceType === 'specific_user' && (
                      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4 mb-4 animate-in fade-in">
                          <label className="flex items-center gap-2 font-body text-[10px] font-bold uppercase tracking-widest text-[var(--brand)] ml-1">
                              <Search size={14} strokeWidth={2.5}/> Search User
                          </label>
                          <input 
                              type="text" 
                              placeholder="Type name or email..." 
                              className="block w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-lg font-body font-bold text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all placeholder-[var(--muted)]"
                              value={userSearchTerm}
                              onChange={e => setUserSearchTerm(e.target.value)}
                          />
                          <div className="relative">
                            <select
                                value={editingCoupon.targetUserId || ""}
                                onChange={(e) => setEditingCoupon(p => ({ ...p, targetUserId: e.target.value || null }))}
                                className="block w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-lg font-body font-bold text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all appearance-none cursor-pointer shadow-sm"
                            >
                                <option value="">-- Select a User --</option>
                                {specificUserOptions.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]">
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                          </div>
                      </div>
                  )}

                  {/* Panel: Category */}
                  {audienceType === 'category' && (
                      <div className="space-y-5 p-5 bg-[var(--surface)] rounded-xl border border-[var(--border)] transition-all mb-4 animate-in fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {CATEGORIES.map(cat => (
                                  <label key={cat.id} className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition-all duration-300 ${editingCoupon.targetCategory === cat.id ? 'bg-[var(--accent-soft)] border-[var(--brand)] shadow-sm' : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)]'}`}>
                                      <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                                        <input 
                                            type="radio" 
                                            name="category_select"
                                            className={`peer appearance-none w-5 h-5 border-2 rounded-full transition-all outline-none cursor-pointer ${editingCoupon.targetCategory === cat.id ? 'bg-[var(--brand)] border-[var(--brand)]' : 'bg-[var(--surface)] border-[var(--border)]'}`}
                                            checked={editingCoupon.targetCategory === cat.id}
                                            onChange={() => {
                                                setEditingCoupon(p => ({ ...p, targetCategory: cat.id }));
                                                handleSearchCategory(true);
                                            }}
                                        />
                                        <div className={`absolute w-2 h-2 rounded-full bg-[var(--surface)] pointer-events-none opacity-0 peer-checked:opacity-100 transition-all ${editingCoupon.targetCategory === cat.id ? 'scale-100' : 'scale-50'}`}></div>
                                      </div>
                                      <div className="min-w-0">
                                          <span className="font-body font-bold text-[var(--text)] text-sm block tracking-wide truncate">{cat.label}</span>
                                          <span className="font-body font-bold text-[10px] text-[var(--sub)] block mt-1 leading-snug">{cat.desc}</span>
                                      </div>
                                  </label>
                              ))}
                          </div>
                          
                          <button 
                              type="button"
                              onClick={() => handleSearchCategory()}
                              disabled={!editingCoupon.targetCategory || isSearching}
                              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--surface)] text-[var(--brand)] border border-[var(--border)] hover:border-[var(--brand)] hover:shadow-sm rounded-lg font-body font-bold text-sm transition-all disabled:opacity-50"
                          >
                              {isSearching ? <div className="animate-spin w-4 h-4 border-2 border-[var(--brand)] rounded-full border-t-transparent"/> : <Search size={16} strokeWidth={2} />}
                              {matchingUsers.length > 0 ? `Found ${matchingUsers.length} Users` : "Preview Users"}
                          </button>

                          {matchingUsers.length > 0 && (
                              <div className="max-h-32 overflow-y-auto bg-[var(--surface)] rounded-lg border border-[var(--border)] p-2 space-y-1 custom-scrollbar">
                                  {matchingUsers.map(u => (
                                      <div key={u.id} className="font-body text-xs font-bold text-[var(--sub)] flex justify-between items-center p-2 hover:bg-[var(--surface)] hover:text-[var(--brand)] rounded-md transition-colors">
                                          <span className="truncate max-w-[140px]">{u.name}</span>
                                          <span className="text-[10px] text-[var(--muted)]">{u.email}</span>
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

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2.5 ml-1">Discount Type</label>
                    <div className="relative">
                      <select
                        value={editingCoupon.discountType || "percent"}
                        onChange={(e) => setEditingCoupon((ec) => ({ ...ec, discountType: e.target.value }))}
                        className="block w-full px-4 py-3.5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all appearance-none cursor-pointer"
                      >
                        <option value="percent">Percentage (%)</option>
                        <option value="flat">Flat Amount (₹)</option>
                        <option value="free_item">Free Item</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
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
                  <div className="bg-[var(--surface-muted)] p-5 rounded-xl border border-[var(--border)] shadow-inner">
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
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-2 pb-2 border-b border-[var(--border)]">
                <span className="w-8 h-8 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--brand)] font-display font-medium text-lg">2</span>
                <h4 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Usage Rules</h4>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
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

                <div className="grid grid-cols-2 gap-5">
                  <InputField
                    label="Max Uses / User"
                    name="maxUsagePerUser"
                    type="number"
                    placeholder="Empty = ∞"
                    value={editingCoupon.maxUsagePerUser ?? ""}
                    onChange={(e) => setEditingCoupon((ec) => ({ ...ec, maxUsagePerUser: e.target.value === "" ? null : +e.target.value }))}
                  />
                  <InputField
                    label="Total Global Uses"
                    name="totalUsageLimit"
                    type="number"
                    placeholder="Empty = ∞"
                    value={editingCoupon.totalUsageLimit ?? ""}
                    onChange={(e) => setEditingCoupon((ec) => ({ ...ec, totalUsageLimit: e.target.value === "" ? null : +e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-end pb-2 mt-2">
                    <label className="flex items-center gap-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full cursor-pointer hover:bg-[var(--surface-muted)] hover:border-[var(--border)] transition-all shadow-sm">
                      <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                        <input 
                            type="checkbox" 
                            className="peer appearance-none w-5 h-5 border-2 rounded transition-all outline-none cursor-pointer bg-[var(--surface)] border-[var(--border)] checked:bg-[var(--brand)] checked:border-[var(--brand)]"
                            checked={editingCoupon.firstOrderOnly ?? false}
                            onChange={(e) => setEditingCoupon((ec) => ({ ...ec, firstOrderOnly: e.target.checked }))}
                        />
                        <svg className={`absolute w-3.5 h-3.5 pointer-events-none text-[var(--bg)] opacity-0 peer-checked:opacity-100 transition-opacity ${editingCoupon.firstOrderOnly ? 'scale-100' : 'scale-50'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span className="font-body text-sm font-bold text-[var(--text)] tracking-wide">First Order Only</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 pt-4 border-t border-[var(--border)]">
                  <div className="col-span-1">
                    <label className="block font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2.5 ml-1">Valid From</label>
                    <DatePicker
                      selected={editingCoupon.validFrom ? new Date(editingCoupon.validFrom) : null}
                      onChange={(date) => setEditingCoupon((ec) => ({ ...ec, validFrom: date ? date.toISOString() : null }))}
                      dateFormat="yyyy-MM-dd"
                      showMonthDropdown
                      showYearDropdown
                      className="block w-full px-4 py-3.5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all placeholder-[var(--muted)]"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2.5 ml-1">Expires On</label>
                    <DatePicker
                      selected={editingCoupon.validUntil ? new Date(editingCoupon.validUntil) : null}
                      onChange={(date) => setEditingCoupon((ec) => ({ ...ec, validUntil: date ? date.toISOString() : null }))}
                      dateFormat="yyyy-MM-dd"
                      showMonthDropdown
                      showYearDropdown
                      className="block w-full px-4 py-3.5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all placeholder-[var(--muted)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- Row 3: Auto Rules (Full Width) --- */}
            {editingCoupon.isAutomatic && (
              <div className="lg:col-span-2 mt-4 pt-4 border-t border-[var(--border)]">
                <div className="bg-[var(--surface)] rounded-2xl p-6 md:p-8 border border-[var(--border)] shadow-sm">
                  <h4 className="font-display text-2xl font-medium text-[var(--brand)] mb-6 flex items-center gap-3">
                    Automatic Conditions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
                    <InputField label="Req. Category" name="cond_requiredCategory" value={editingCoupon.cond_requiredCategory || ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, cond_requiredCategory: e.target.value }))} />
                    <InputField label="Req. Size (ml)" name="cond_requiredSize" type="number" value={editingCoupon.cond_requiredSize ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, cond_requiredSize: e.target.value === "" ? null : +e.target.value }))} />
                    <InputField label="Target Size (ml)" name="action_targetSize" type="number" value={editingCoupon.action_targetSize ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_targetSize: e.target.value === "" ? null : +e.target.value }))} />
                    <InputField label="Target Max Price" name="action_targetMaxPrice" type="number" value={editingCoupon.action_targetMaxPrice ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_targetMaxPrice: e.target.value === "" ? null : +e.target.value }))} />
                    <div className="flex gap-3">
                      <InputField label="Buy X" name="action_buyX" type="number" value={editingCoupon.action_buyX ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_buyX: e.target.value === "" ? null : +e.target.value }))} />
                      <InputField label="Get Y" name="action_getY" type="number" value={editingCoupon.action_getY ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_getY: e.target.value === "" ? null : +e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="flex items-center justify-end gap-4 pt-8 mt-8 border-t border-[var(--border)]">
            <button onClick={() => setEditingCoupon(null)} className="px-6 py-3 font-body text-sm font-bold text-[var(--sub)] bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors shadow-sm">
              Cancel
            </button>
            <button onClick={saveCoupon} className="px-8 py-3 font-body text-sm font-bold text-[var(--bg)] bg-[var(--brand)] rounded-xl hover:brightness-110 transition-all shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] button-hero">
              Save Changes
              <div className="pulse border-[#F5F1E8]"></div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CouponForm;