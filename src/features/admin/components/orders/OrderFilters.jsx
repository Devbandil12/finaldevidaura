import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="flex flex-col gap-4 font-body">
      <div className="flex flex-col xl:flex-row xl:justify-between items-start xl:items-center gap-5">
        {/* Quick Status Tabs */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 smooth-scrollbar flex-1 w-full max-w-[100vw]">
          {["All", "Requires Attention", "Payment Pending", "Order Placed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered", "Returns", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange('status', status)}
              className={`px-5 py-2.5 rounded-lg font-body text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 border 
              ${orderFilters.status === status
                  ? "bg-[var(--brand)] text-[var(--surface)] border-[var(--brand)] shadow-[var(--shadow)]"
                  : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:bg-[var(--surface-muted)] hover:border-[var(--border)] hover:text-[var(--brand)] shadow-sm"}`}
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
              placeholder="Search by ID, Customer, Phone..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[var(--surface)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--brand)] border border-[var(--border)] hover:border-[var(--border)] focus:border-[var(--brand)] font-body text-sm font-bold text-[var(--text)] transition-all placeholder-[var(--muted)] shadow-sm"
            />
            <Search 
              className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--brand)] transition-colors" 
              size={18} 
              strokeWidth={1.5} 
            />
          </div>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 font-bold text-xs ${showAdvanced || activeFilterCount > 0 ? 'bg-[var(--brand)] text-[var(--surface)] border-[var(--brand)]' : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-muted)]'}`}
          >
            <Filter size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl flex flex-wrap gap-5 items-end shadow-inner">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--sub)]">Payment</label>
                <select 
                  value={orderFilters.paymentStatus || ''} 
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text)] outline-none focus:border-[var(--brand)] min-w-[140px]"
                >
                  <option value="">Any Payment</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partially_refunded">Partially Refunded</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--sub)]">Fulfillment</label>
                <select 
                  value={orderFilters.fulfillmentStatus || ''} 
                  onChange={(e) => handleFilterChange('fulfillmentStatus', e.target.value)}
                  className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text)] outline-none focus:border-[var(--brand)] min-w-[140px]"
                >
                  <option value="">Any Status</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PACKED">Packed</option>
                  <option value="READY_TO_SHIP">Ready to Ship</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="OOD">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--sub)]">Returns</label>
                <select 
                  value={orderFilters.returnStatus || ''} 
                  onChange={(e) => handleFilterChange('returnStatus', e.target.value)}
                  className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text)] outline-none focus:border-[var(--brand)] min-w-[140px]"
                >
                  <option value="">Any Status</option>
                  <option value="NONE">No Return</option>
                  <option value="REQUESTED">Requested</option>
                  <option value="APPROVED">Approved</option>
                  <option value="RECEIVED">Received</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--sub)]">Refunds</label>
                <select 
                  value={orderFilters.refundStatus || ''} 
                  onChange={(e) => handleFilterChange('refundStatus', e.target.value)}
                  className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text)] outline-none focus:border-[var(--brand)] min-w-[140px]"
                >
                  <option value="">Any Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="processed">Processed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button 
                  onClick={clearFilters}
                  className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--error)] rounded-lg text-sm font-bold hover:bg-red-50 hover:border-red-200 flex items-center gap-2 transition-colors ml-auto"
                >
                  <X size={16} /> Clear All
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