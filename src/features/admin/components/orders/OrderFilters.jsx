import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Reusable Custom Luxury Dropdown ---
const LuxurySelect = ({ value, options, onChange, placeholder = "Any Status" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <div className="relative font-body w-full min-w-[150px]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-medium tracking-tight transition-all duration-300 ring-1 
        ${isOpen 
            ? 'ring-[var(--brand)]/50 shadow-sm bg-[var(--surface)] text-[var(--text)]' 
            : 'bg-[var(--surface)] ring-[var(--border)]/40 dark:ring-[var(--border)]/60 hover:bg-[var(--surface-muted)]/50 hover:ring-[var(--border)]/80 text-[var(--text)] shadow-sm'}`}
      >
        <span className="truncate mr-3">{selectedLabel}</span>
        <ChevronDown size={14} strokeWidth={2} className={`text-[var(--muted)] transition-transform duration-500 ease-out shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 mt-2 w-full min-w-[180px] bg-[var(--surface)]/95 backdrop-blur-xl rounded-[1.25rem] shadow-[0_16px_40px_rgba(0,0,0,0.12)] z-[99999] overflow-hidden ring-1 ring-[var(--border)]/40 dark:ring-[var(--border)]/70"
          >
            <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
              {/* Option for "Any / Clear" */}
              <button
                onClick={() => handleSelect('')}
                className={`w-full text-left px-3 py-2 text-[11px] font-medium tracking-tight flex items-center justify-between rounded-lg transition-colors duration-200 
                ${value === '' ? 'bg-[var(--surface-muted)] text-[var(--text)] shadow-inner' : 'text-[var(--sub)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'}`}
              >
                {placeholder}
                {value === '' && <Check size={14} strokeWidth={3} className="text-[var(--text)]" />}
              </button>
              
              <div className="h-px w-full bg-[var(--border)]/30 my-1"></div>

              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-2 text-[11px] font-medium tracking-tight flex items-center justify-between rounded-lg transition-colors duration-200 
                  ${value === opt.value ? 'bg-[var(--brand)]/10 text-[var(--brand)] shadow-inner' : 'text-[var(--sub)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'}`}
                >
                  {opt.label}
                  {value === opt.value && <Check size={14} strokeWidth={3} className="text-[var(--brand)]" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// --- MAIN COMPONENT ---
const OrderFilters = ({ orderFilters, setOrderFilters, orderSearchQuery, setOrderSearchQuery, setSelectedOrders }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key, value) => {
    setOrderFilters({ ...orderFilters, [key]: value });
    setSelectedOrders(new Set());
  };

  const clearFilters = () => {
    setOrderFilters({
      status: 'All',
      paymentStatus: '',
      fulfillmentStatus: '',
      returnStatus: '',
      refundStatus: ''
    });
  };

  const activeFilterCount = Object.values(orderFilters).filter(v => v && v !== 'All').length;

  return (
    // Added relative z-20 to ensure dropdowns pop over the orders table below
    <div className="flex flex-col gap-4 sm:gap-5 font-body mb-6 relative z-20">
      <div className="flex flex-col xl:flex-row xl:justify-between items-start xl:items-center gap-4 sm:gap-5">
        {/* Soft Luxury Status Tabs */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 smooth-scrollbar flex-1 w-full max-w-[100vw]">
          {["All", "Requires Attention", "Payment Pending", "Order Placed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered", "Returns", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange('status', status)}
              className={`px-5 py-2.5 rounded-xl font-body text-[9px] sm:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ring-1 
              ${orderFilters.status === status
                  ? "bg-[var(--surface)] text-[var(--text)] ring-[var(--border)]/60 dark:ring-[var(--border)]/80 shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                  : "bg-transparent text-[var(--muted)] ring-transparent hover:bg-[var(--surface-muted)]/50 hover:text-[var(--text)]"}`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search & Advanced Toggle */}
        <div className="flex gap-3 w-full xl:w-auto shrink-0">
          <div className="relative flex-1 xl:w-80 group">
            <input
              type="text"
              placeholder="Search ID, Customer..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-muted)]/30 rounded-xl focus:outline-none ring-1 ring-[var(--border)]/40 dark:ring-[var(--border)]/60 focus:ring-[var(--brand)]/50 focus:bg-[var(--surface)] font-body font-medium text-xs sm:text-sm text-[var(--text)] transition-all placeholder-[var(--muted)] shadow-inner z-10 relative"
            />
            <Search 
              className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--brand)] transition-colors z-20" 
              size={16} 
              strokeWidth={2} 
            />
          </div>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2.5 rounded-xl ring-1 transition-all flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest shadow-sm z-10 relative ${showAdvanced || activeFilterCount > 0 ? 'bg-[var(--surface)] text-[var(--text)] ring-[var(--border)]/60 dark:ring-[var(--border)]/80' : 'bg-transparent text-[var(--muted)] ring-[var(--border)]/40 dark:ring-[var(--border)]/60 hover:bg-[var(--surface-muted)]/50'}`}
          >
            <Filter size={14} strokeWidth={2.5} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            // Here is the magic trick: Transition overflow to visible when done animating
            initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
            animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
            exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="p-5 sm:p-6 bg-[var(--surface-muted)]/20 border border-[var(--border)]/30 dark:border-[var(--border)]/60 rounded-[1.5rem] flex flex-wrap gap-5 items-end shadow-inner">
              
              {/* Payment Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest font-bold text-[var(--muted)] ml-1">Payment</label>
                <LuxurySelect 
                  value={orderFilters.paymentStatus || ''}
                  onChange={(val) => handleFilterChange('paymentStatus', val)}
                  placeholder="Any Payment"
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "paid", label: "Paid" },
                    { value: "partially_refunded", label: "Partially Refunded" },
                    { value: "refunded", label: "Refunded" },
                    { value: "failed", label: "Failed" }
                  ]}
                />
              </div>

              {/* Fulfillment Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest font-bold text-[var(--muted)] ml-1">Fulfillment</label>
                <LuxurySelect 
                  value={orderFilters.fulfillmentStatus || ''}
                  onChange={(val) => handleFilterChange('fulfillmentStatus', val)}
                  placeholder="Any Status"
                  options={[
                    { value: "PROCESSING", label: "Processing" },
                    { value: "PACKED", label: "Packed" },
                    { value: "READY_TO_SHIP", label: "Ready to Ship" },
                    { value: "SHIPPED", label: "Shipped" },
                    { value: "OOD", label: "Out for Delivery" },
                    { value: "DELIVERED", label: "Delivered" }
                  ]}
                />
              </div>

              {/* Returns Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest font-bold text-[var(--muted)] ml-1">Returns</label>
                <LuxurySelect 
                  value={orderFilters.returnStatus || ''}
                  onChange={(val) => handleFilterChange('returnStatus', val)}
                  placeholder="Any Status"
                  options={[
                    { value: "NONE", label: "No Return" },
                    { value: "REQUESTED", label: "Requested" },
                    { value: "APPROVED", label: "Approved" },
                    { value: "RECEIVED", label: "Received" },
                    { value: "REJECTED", label: "Rejected" }
                  ]}
                />
              </div>

              {/* Refunds Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest font-bold text-[var(--muted)] ml-1">Refunds</label>
                <LuxurySelect 
                  value={orderFilters.refundStatus || ''}
                  onChange={(val) => handleFilterChange('refundStatus', val)}
                  placeholder="Any Status"
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "in_progress", label: "In Progress" },
                    { value: "processed", label: "Processed" },
                    { value: "failed", label: "Failed" }
                  ]}
                />
              </div>

              {/* Clear All Button */}
              {activeFilterCount > 0 && (
                <button 
                  onClick={clearFilters}
                  className="px-4 py-2.5 bg-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50 rounded-xl text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 transition-colors ml-auto"
                >
                  <X size={14} strokeWidth={2.5} /> Clear All
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderFilters;