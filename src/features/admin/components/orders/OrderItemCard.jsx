import React from 'react';
import { Package, Calendar, ChevronUp, ChevronDown, CheckSquare, Square } from 'lucide-react';
import StatusDropdown from './StatusDropdown';
import OrderStatusBadge from './OrderStatusBadge';
import OrderDetailsPanel from './OrderDetailsPanel';

const OrderItemCard = ({
  order, idx, isExpanded, isSelected, canSelect, isEditable, finalPaymentStatus, isPaid,
  toggleSelectOrder, toggleOrderDetails, handleStatusChangeRequest,
  orderDetailsData, loadingDetails, handleCancelOrder, handleReturnOrder
}) => {
  return (
    <div
      style={{ zIndex: 1000 - idx, position: 'relative' }}
      className={`bg-[var(--surface)] rounded-[1.5rem] transition-all duration-500 group overflow-hidden ring-1 font-body cursor-default
      ${isSelected 
          ? 'ring-[var(--brand)] shadow-[0_8px_24px_rgba(0,0,0,0.06)] bg-[var(--brand)]/5' 
          : isExpanded
            ? 'shadow-[0_16px_40px_rgba(0,0,0,0.06)] ring-[var(--border)]/40 dark:ring-[var(--border)]/60'
            : 'ring-[var(--border)]/30 dark:ring-[var(--border)]/60 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5'
      }`}
    >
      <div
        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[var(--surface-muted)]/20 transition-colors"
        onClick={() => toggleOrderDetails(order.id)}
      >
        <div className="flex items-center gap-4">
          {/* Selection Checkbox */}
          {canSelect ? (
            <div 
              onClick={(e) => { e.stopPropagation(); toggleSelectOrder(order.id); }} 
              className="cursor-pointer text-[var(--muted)] hover:text-[var(--brand)] transition-colors"
            >
                {isSelected ? <CheckSquare size={20} strokeWidth={2.5} className="text-[var(--brand)]" /> : <Square size={20} strokeWidth={2.5} />}
            </div>
          ) : (
            <div className="w-5" /> 
          )}

          <div className={`w-12 h-12 rounded-[0.85rem] flex items-center justify-center transition-all duration-500 ease-out ring-1 shrink-0
            ${isExpanded ? 'bg-[var(--text)] ring-[var(--border)] text-[var(--surface)] shadow-md scale-105' : 'bg-[var(--surface-muted)]/50 ring-[var(--border)]/40 text-[var(--muted)] group-hover:ring-[var(--brand)]/30 group-hover:text-[var(--brand)]'}`}>
            <Package size={20} strokeWidth={1.5} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-body text-sm font-medium text-[var(--text)] tracking-tight truncate group-hover:text-[var(--brand)] transition-colors">#{order.id}</h3>
              <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold bg-[var(--surface-muted)]/50 text-[var(--muted)] ring-1 ring-[var(--border)]/40 whitespace-nowrap">
                {order.itemCount || order.orderItems?.length || order.items?.length || 1} Items
              </span>
            </div>
            <div className="flex items-center gap-2 font-body text-[10px] font-medium text-[var(--sub)] flex-wrap">
              <Calendar size={12} strokeWidth={2} className="text-[var(--muted)]" />
              <span>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <span className="text-[var(--border)]/60">•</span>
              <span className="text-[var(--text)] tracking-tight">₹{order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap w-full md:w-auto mt-2 sm:mt-0">
          <div className="flex-shrink-0">
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {isEditable && (
              <div onClick={(e) => e.stopPropagation()} className="min-w-[140px] sm:min-w-[160px]">
                <StatusDropdown
                  currentStatus={order.status}
                  hasAwb={!!order.shiprocketAwb}
                  onUpdate={(newStatus) => handleStatusChangeRequest(order.id, newStatus)}
                />
              </div>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); toggleOrderDetails(order.id); }}
              className={`p-2 rounded-xl transition-all duration-300 flex-shrink-0 ring-1 
              ${isExpanded ? "bg-[var(--surface)] text-[var(--text)] ring-[var(--border)]/60 shadow-sm" : "bg-transparent ring-[var(--border)]/30 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] hover:ring-[var(--border)]/60"}`}
            >
              {isExpanded ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <OrderDetailsPanel 
                order={order}
                orderDetailsData={orderDetailsData}
                loadingDetails={loadingDetails}
                isEditable={isEditable}
                finalPaymentStatus={finalPaymentStatus}
                isPaid={isPaid}
                handleCancelOrder={handleCancelOrder}
                handleReturnOrder={handleReturnOrder}
              />
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderItemCard;