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
      className={`bg-[var(--surface)] rounded-2xl transition-all duration-300 group overflow-hidden border font-body cursor-default
      ${isSelected 
          ? 'border-[var(--brand)] shadow-[var(--shadow-strong)] bg-[var(--accent-soft)]' 
          : isExpanded
            ? 'shadow-[var(--shadow-strong)] ring-0 border-[var(--border)]'
            : 'border-[var(--border)] hover:border-[var(--border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)]'
      }`}
    >
      <div
        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
        onClick={() => toggleOrderDetails(order.id)}
      >
        <div className="flex items-center gap-5">
          {/* Selection Checkbox */}
          {canSelect ? (
            <div 
              onClick={(e) => { e.stopPropagation(); toggleSelectOrder(order.id); }} 
              className="cursor-pointer text-[var(--muted)] hover:text-[var(--brand)] transition-colors"
            >
                {isSelected ? <CheckSquare size={24} strokeWidth={2} className="text-[var(--brand)]" /> : <Square size={24} strokeWidth={2} />}
            </div>
          ) : (
            <div className="w-6" /> 
          )}

          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ease-out border shrink-0
            ${isExpanded ? 'bg-[var(--brand)] border-[var(--brand)] text-[var(--bg)] shadow-md scale-105' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] group-hover:border-[var(--brand)] group-hover:text-[var(--brand)]'}`}>
            <Package size={20} strokeWidth={1.5} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <h3 className="font-body text-base font-bold text-[var(--text)] tracking-wide truncate group-hover:text-[var(--brand)] transition-colors">#{order.id}</h3>
              <span className="px-2 py-0.5 rounded-md font-body text-[9px] uppercase tracking-widest font-bold bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] whitespace-nowrap">
                {order.orderItems?.length || 1} Items
              </span>
            </div>
            <div className="flex items-center gap-2.5 font-body text-[11px] font-bold text-[var(--sub)] flex-wrap">
              <Calendar size={12} strokeWidth={2} className="text-[var(--muted)]" />
              <span>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <span className="text-[var(--border)]">•</span>
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
              className={`p-2 rounded-xl transition-all duration-300 flex-shrink-0 border 
              ${isExpanded ? "bg-[var(--surface-muted)] text-[var(--brand)] border-[var(--border)]" : "bg-[var(--surface)] border-transparent text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] hover:border-[var(--border)]"}`}
            >
              {isExpanded ? <ChevronUp size={18} strokeWidth={2} /> : <ChevronDown size={18} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
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
      )}
    </div>
  );
};

export default OrderItemCard;