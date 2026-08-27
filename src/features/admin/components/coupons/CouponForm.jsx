import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Plus, X, AlertCircle, Search } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Sophisticated Recessed Input Component
const InputField = React.forwardRef(({ label, name, value, onChange, placeholder, type = "text", span = "col-span-1", ...props }, ref) => (
  <div className={`${span} group`}>
    <label htmlFor={name} className="block font-body text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-[var(--brand)]">{label}</label>
    <div className="relative">
      <input
        id={name}
        ref={ref}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full px-3 py-2.5 bg-[var(--surface-muted)]/40 ring-1 ring-[var(--border)]/40 hover:ring-[var(--border)] rounded-xl font-body font-medium text-xs text-[var(--text)] outline-none focus:bg-[var(--surface)] focus:ring-[var(--brand)]/50 transition-all placeholder-[var(--muted)] shadow-inner"
        {...props}
      />
    </div>
  </div>
));

// Sophisticated Recessed TextArea
const TextAreaField = ({ label, name, value, onChange, placeholder, span = "col-span-1" }) => (
  <div className={`${span} group`}>
    <label htmlFor={name} className="block font-body text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-[var(--brand)]">{label}</label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={2}
      className="block w-full px-3 py-2.5 bg-[var(--surface-muted)]/40 ring-1 ring-[var(--border)]/40 hover:ring-[var(--border)] rounded-xl font-body font-medium text-xs text-[var(--text)] outline-none focus:bg-[var(--surface)] focus:ring-[var(--brand)]/50 transition-all placeholder-[var(--muted)] resize-none leading-relaxed shadow-inner"
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
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingCoupon?.code?.trim()) {
      if (window.toast?.error) window.toast.error("Coupon code / name is required");
      return;
    }
    try {
      await saveCoupon(editingCoupon);
      setEditingCoupon(null);
    } catch (err) {
      console.error("Save coupon error:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden font-body"
    >
      <div className="bg-[var(--surface)] rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.06)] ring-1 ring-[var(--border)]/40 dark:ring-[var(--border)]/60 overflow-hidden mt-2 mb-8">
        
        {/* HEADER */}
        <div className="px-6 sm:px-8 py-5 border-b border-[var(--border)]/30 dark:border-[var(--border)]/50 flex justify-between items-center bg-[var(--surface)]">
          <h3 className="font-display text-lg sm:text-xl font-medium text-[var(--text)] flex items-center gap-2.5 tracking-tight">
            {editingCoupon.id ? <Edit2 size={18} strokeWidth={2} className="text-[var(--accent)]"/> : <Plus size={18} strokeWidth={2.5} className="text-[var(--accent)]"/>}
            {editingCoupon.id ? "Edit Configuration" : "New Configuration"}
            <span className="font-body text-[9px] uppercase tracking-widest font-bold text-[var(--muted)] ml-2 px-2 py-0.5 rounded bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/40 hidden sm:inline-block">
              {editingCoupon.isAutomatic ? "Automation Rule" : "Manual Code"}
            </span>
          </h3>
          <button onClick={() => setEditingCoupon(null)} className="p-1.5 hover:bg-[var(--surface-muted)] rounded-lg text-[var(--muted)] hover:text-[var(--text)] transition-colors">
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-10">

            {/* --- Column 1: Details & Action --- */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-1 pb-3 border-b border-[var(--border)]/20 dark:border-[var(--border)]/40">
                <span className="w-6 h-6 rounded-md bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/40 flex items-center justify-center text-[var(--brand)] font-body font-bold text-xs">1</span>
                <h4 className="font-display text-base font-medium text-[var(--text)] tracking-tight">Core Details</h4>
              </div>
              
              <div className="space-y-5">
                <div>
                  <InputField
                    label={editingCoupon.isAutomatic ? "Promotion Name (Internal ID)" : "Coupon Code *"}
                    name="code"
                    value={editingCoupon.code || ""}
                    onChange={(e) => setEditingCoupon((ec) => ({ ...ec, code: e.target.value.toUpperCase() }))}
                    placeholder={editingCoupon.isAutomatic ? "e.g. BOGO_SALE" : "e.g. SAVE20"}
                  />
                  <p className="font-body text-[8px] uppercase font-bold tracking-widest text-[var(--muted)] mt-1.5 ml-1 flex items-center gap-1.5">
                    <AlertCircle size={10} strokeWidth={2.5} />
                    {editingCoupon.isAutomatic ? "Display name for cart summary." : "Customer enters this at checkout."}
                  </p>
                </div>

                {/* TARGET AUDIENCE SECTION */}
                <div className="col-span-1">
                  <label className="block font-body text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2 ml-1">Target Audience</label>
                  
                  {/* Luxury Segmented Tabs */}
                  <div className="flex bg-[var(--surface-muted)]/30 p-1 rounded-xl ring-1 ring-[var(--border)]/40 mb-4 shadow-inner">
                      <button 
                          type="button"
                          onClick={() => { 
                              setAudienceType('public'); 
                              setEditingCoupon(p => ({...p, targetUserId: null, targetCategory: null}));
                          }}
                          className={`flex-1 py-1.5 font-body text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${audienceType === 'public' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm ring-1 ring-[var(--border)]/50' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                      >
                          Public
                      </button>
                      <button 
                          type="button"
                          onClick={() => { 
                              setAudienceType('specific_user'); 
                              setEditingCoupon(p => ({...p, targetCategory: null})); 
                          }}
                          className={`flex-1 py-1.5 font-body text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${audienceType === 'specific_user' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm ring-1 ring-[var(--border)]/50' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                      >
                          Specific User
                      </button>
                      <button 
                          type="button"
                          onClick={() => { 
                              setAudienceType('category'); 
                              setEditingCoupon(p => ({...p, targetUserId: null})); 
                          }}
                          className={`flex-1 py-1.5 font-body text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${audienceType === 'category' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm ring-1 ring-[var(--border)]/50' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                      >
                          Segment
                      </button>
                  </div>

                  {/* Panel: Specific User */}
                  {audienceType === 'specific_user' && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--surface-muted)]/20 rounded-xl ring-1 ring-[var(--border)]/40 p-4 space-y-3 mb-4">
                          <label className="flex items-center gap-1.5 font-body text-[9px] font-bold uppercase tracking-widest text-[var(--brand)] ml-0.5">
                              <Search size={12} strokeWidth={2.5}/> Search Account
                          </label>
                          <input 
                              type="text" 
                              placeholder="Type name or email..." 
                              className="block w-full px-3 py-2 bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-lg font-body font-medium text-xs text-[var(--text)] outline-none focus:ring-[var(--brand)]/50 transition-all placeholder-[var(--muted)] shadow-sm"
                              value={userSearchTerm}
                              onChange={e => setUserSearchTerm(e.target.value)}
                          />
                          <div className="relative">
                            <select
                                value={editingCoupon.targetUserId || ""}
                                onChange={(e) => setEditingCoupon(p => ({ ...p, targetUserId: e.target.value || null }))}
                                className="block w-full px-3 py-2 bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-lg font-body font-medium text-xs text-[var(--text)] outline-none focus:ring-[var(--brand)]/50 transition-all appearance-none cursor-pointer shadow-sm"
                            >
                                <option value="">-- Select Target User --</option>
                                {specificUserOptions.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]">
                               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                          </div>
                      </motion.div>
                  )}

                  {/* Panel: Category */}
                  {audienceType === 'category' && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-4 bg-[var(--surface-muted)]/20 rounded-xl ring-1 ring-[var(--border)]/40 mb-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                              {CATEGORIES.map(cat => (
                                  <label key={cat.id} className={`flex items-start gap-2.5 cursor-pointer p-3 rounded-xl transition-all duration-300 ring-1 ${editingCoupon.targetCategory === cat.id ? 'bg-[var(--surface)] ring-[var(--brand)] shadow-sm' : 'bg-[var(--surface)] ring-[var(--border)]/30 hover:ring-[var(--border)] hover:bg-[var(--surface-muted)]'}`}>
                                      <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                                        <input 
                                            type="radio" 
                                            name="category_select"
                                            className={`peer appearance-none w-4 h-4 rounded-full transition-all outline-none cursor-pointer ring-1 ${editingCoupon.targetCategory === cat.id ? 'bg-[var(--brand)] ring-[var(--brand)]' : 'bg-[var(--surface-muted)] ring-[var(--border)]/50'}`}
                                            checked={editingCoupon.targetCategory === cat.id}
                                            onChange={() => {
                                                setEditingCoupon(p => ({ ...p, targetCategory: cat.id }));
                                                handleSearchCategory(true);
                                            }}
                                        />
                                        <div className={`absolute w-1.5 h-1.5 rounded-full bg-[var(--surface)] pointer-events-none opacity-0 peer-checked:opacity-100 transition-all ${editingCoupon.targetCategory === cat.id ? 'scale-100' : 'scale-50'}`}></div>
                                      </div>
                                      <div className="min-w-0 pt-0.5">
                                          <span className="font-body font-bold text-[var(--text)] text-xs block tracking-tight truncate">{cat.label}</span>
                                          <span className="font-body font-medium text-[9px] text-[var(--muted)] block mt-0.5 leading-snug">{cat.desc}</span>
                                      </div>
                                  </label>
                              ))}
                          </div>
                          
                          <button 
                              type="button"
                              onClick={() => handleSearchCategory()}
                              disabled={!editingCoupon.targetCategory || isSearching}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[var(--surface)] text-[var(--brand)] ring-1 ring-[var(--border)]/50 hover:ring-[var(--brand)]/50 hover:bg-[var(--surface-muted)]/30 rounded-lg font-body font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 shadow-sm"
                          >
                              {isSearching ? <div className="animate-spin w-3 h-3 border-2 border-[var(--brand)] rounded-full border-t-transparent"/> : <Search size={14} strokeWidth={2} />}
                              {matchingUsers.length > 0 ? `Found ${matchingUsers.length} Users` : "Preview Segment"}
                          </button>

                          {matchingUsers.length > 0 && (
                              <div className="max-h-24 overflow-y-auto bg-[var(--surface)] rounded-lg ring-1 ring-[var(--border)]/40 p-1.5 space-y-0.5 custom-scrollbar shadow-inner">
                                  {matchingUsers.map(u => (
                                      <div key={u.id} className="font-body text-[10px] font-medium text-[var(--sub)] flex justify-between items-center px-2.5 py-1.5 hover:bg-[var(--surface-muted)]/50 hover:text-[var(--text)] rounded transition-colors">
                                          <span className="truncate max-w-[140px]">{u.name}</span>
                                          <span className="text-[9px] text-[var(--muted)]">{u.email}</span>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </motion.div>
                  )}
                </div>

                <TextAreaField
                  label="Internal Memo"
                  name="description"
                  value={editingCoupon.description || ""}
                  onChange={(e) => setEditingCoupon((ec) => ({ ...ec, description: e.target.value }))}
                  placeholder="e.g. Summer Sale 2024 Campaign details..."
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block font-body text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-[var(--brand)]">Discount Type</label>
                    <div className="relative">
                      <select
                        value={editingCoupon.discountType || "percent"}
                        onChange={(e) => setEditingCoupon((ec) => ({ ...ec, discountType: e.target.value }))}
                        className="block w-full px-3 py-2.5 bg-[var(--surface-muted)]/40 ring-1 ring-[var(--border)]/40 hover:ring-[var(--border)] rounded-xl font-body font-medium text-xs text-[var(--text)] outline-none focus:bg-[var(--surface)] focus:ring-[var(--brand)]/50 transition-all appearance-none cursor-pointer shadow-inner"
                      >
                        <option value="percent">Percentage (%)</option>
                        <option value="flat">Flat Amount (₹)</option>
                        <option value="free_item">Free Item</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
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
                  <div className="bg-[var(--surface-muted)]/20 p-4 rounded-xl ring-1 ring-[var(--border)]/40 shadow-inner">
                    <InputField
                      label="Max Cap (₹)"
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
              <div className="flex items-center gap-3 mb-1 pb-3 border-b border-[var(--border)]/20 dark:border-[var(--border)]/40">
                <span className="w-6 h-6 rounded-md bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/40 flex items-center justify-center text-[var(--brand)] font-body font-bold text-xs">2</span>
                <h4 className="font-display text-base font-medium text-[var(--text)] tracking-tight">Usage Constraints</h4>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Min Spend (₹)"
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
                    label="Uses / User"
                    name="maxUsagePerUser"
                    type="number"
                    placeholder="Empty = ∞"
                    value={editingCoupon.maxUsagePerUser ?? ""}
                    onChange={(e) => setEditingCoupon((ec) => ({ ...ec, maxUsagePerUser: e.target.value === "" ? null : +e.target.value }))}
                  />
                  <InputField
                    label="Global Limit"
                    name="totalUsageLimit"
                    type="number"
                    placeholder="Empty = ∞"
                    value={editingCoupon.totalUsageLimit ?? ""}
                    onChange={(e) => setEditingCoupon((ec) => ({ ...ec, totalUsageLimit: e.target.value === "" ? null : +e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-end pb-1 mt-1">
                    <label className="flex items-center gap-3 p-3.5 bg-[var(--surface-muted)]/20 ring-1 ring-[var(--border)]/40 rounded-xl w-full cursor-pointer hover:bg-[var(--surface-muted)]/50 transition-all shadow-sm">
                      <div className="relative flex items-center justify-center shrink-0">
                        <input 
                            type="checkbox" 
                            className="peer appearance-none w-4 h-4 ring-1 rounded-[4px] transition-all outline-none cursor-pointer bg-[var(--surface)] ring-[var(--border)]/60 checked:bg-[var(--brand)] checked:ring-[var(--brand)]"
                            checked={editingCoupon.firstOrderOnly ?? false}
                            onChange={(e) => setEditingCoupon((ec) => ({ ...ec, firstOrderOnly: e.target.checked }))}
                        />
                        <svg className={`absolute w-2.5 h-2.5 pointer-events-none text-[var(--surface)] opacity-0 peer-checked:opacity-100 transition-opacity ${editingCoupon.firstOrderOnly ? 'scale-100' : 'scale-50'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span className="font-body text-xs font-bold text-[var(--text)] tracking-wide">First Order Only Restriction</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--border)]/20 dark:border-[var(--border)]/40">
                  <div className="col-span-1 group">
                    <label className="block font-body text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-[var(--brand)]">Start Date</label>
                    <DatePicker
                      selected={editingCoupon.validFrom ? new Date(editingCoupon.validFrom) : null}
                      onChange={(date) => setEditingCoupon((ec) => ({ ...ec, validFrom: date ? date.toISOString() : null }))}
                      dateFormat="yyyy-MM-dd"
                      showMonthDropdown
                      showYearDropdown
                      className="block w-full px-3 py-2.5 bg-[var(--surface-muted)]/40 ring-1 ring-[var(--border)]/40 hover:ring-[var(--border)] rounded-xl font-body font-medium text-xs text-[var(--text)] outline-none focus:bg-[var(--surface)] focus:ring-[var(--brand)]/50 transition-all placeholder-[var(--muted)] shadow-inner"
                    />
                  </div>
                  <div className="col-span-1 group">
                    <label className="block font-body text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-[var(--brand)]">Expiry Date</label>
                    <DatePicker
                      selected={editingCoupon.validUntil ? new Date(editingCoupon.validUntil) : null}
                      onChange={(date) => setEditingCoupon((ec) => ({ ...ec, validUntil: date ? date.toISOString() : null }))}
                      dateFormat="yyyy-MM-dd"
                      showMonthDropdown
                      showYearDropdown
                      className="block w-full px-3 py-2.5 bg-[var(--surface-muted)]/40 ring-1 ring-[var(--border)]/40 hover:ring-[var(--border)] rounded-xl font-body font-medium text-xs text-[var(--text)] outline-none focus:bg-[var(--surface)] focus:ring-[var(--brand)]/50 transition-all placeholder-[var(--muted)] shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- Row 3: Auto Rules (Full Width) --- */}
            {editingCoupon.isAutomatic && (
              <div className="lg:col-span-2 mt-2 pt-5 border-t border-[var(--border)]/20 dark:border-[var(--border)]/40">
                <div className="bg-[var(--surface-muted)]/20 rounded-[1.5rem] p-6 ring-1 ring-[var(--border)]/40 shadow-inner">
                  <h4 className="font-display text-base font-medium text-[var(--brand)] mb-4 flex items-center gap-2">
                    Condition Modifiers
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <InputField label="Req. Category" name="cond_requiredCategory" value={editingCoupon.cond_requiredCategory || ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, cond_requiredCategory: e.target.value }))} />
                    <InputField label="Req. Size (ml)" name="cond_requiredSize" type="number" value={editingCoupon.cond_requiredSize ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, cond_requiredSize: e.target.value === "" ? null : +e.target.value }))} />
                    <InputField label="Target Size (ml)" name="action_targetSize" type="number" value={editingCoupon.action_targetSize ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_targetSize: e.target.value === "" ? null : +e.target.value }))} />
                    <InputField label="Target Max Cap" name="action_targetMaxPrice" type="number" value={editingCoupon.action_targetMaxPrice ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_targetMaxPrice: e.target.value === "" ? null : +e.target.value }))} />
                    <div className="flex gap-2 col-span-2 md:col-span-1 lg:col-span-1">
                      <InputField label="Buy X" name="action_buyX" type="number" value={editingCoupon.action_buyX ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_buyX: e.target.value === "" ? null : +e.target.value }))} />
                      <InputField label="Get Y" name="action_getY" type="number" value={editingCoupon.action_getY ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_getY: e.target.value === "" ? null : +e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-[var(--border)]/30 dark:border-[var(--border)]/50">
            <button 
              type="button"
              onClick={() => setEditingCoupon(null)} 
              className="px-5 py-2.5 font-body text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] bg-[var(--surface)] ring-1 ring-[var(--border)]/50 rounded-xl hover:bg-[var(--surface-muted)] transition-colors shadow-sm"
            >
              Discard
            </button>
            <button 
              type="button"
              onClick={handleSave} 
              className="px-6 py-2.5 font-body text-[10px] font-bold uppercase tracking-widest text-[var(--surface)] bg-[var(--text)] hover:bg-[var(--brand)] rounded-xl transition-all shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CouponForm;