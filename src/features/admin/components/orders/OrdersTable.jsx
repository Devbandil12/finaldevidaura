import React from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Square, Package, AlertTriangle, Eye } from 'lucide-react';
import moment from 'moment';
import OrderStatusBadge from './OrderStatusBadge';

const OrdersTable = ({ 
  orders, 
  selectedOrders, 
  toggleSelectOrder, 
  toggleSelectAll, 
  isAllSelected, 
  isSelectionEnabled, 
  toggleOrderDetails 
}) => {
  return (
    <div className="w-full bg-[var(--surface)] border border-[var(--border)]/30 dark:border-[var(--border)]/60 rounded-[1.5rem] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.03)] font-body">
      <div className="overflow-x-auto smooth-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
          <thead>
            <tr className="bg-[var(--surface-muted)]/30 border-b border-[var(--border)]/30 dark:border-[var(--border)]/60 text-[9px] uppercase font-bold text-[var(--muted)] tracking-widest">
              {isSelectionEnabled && (
                <th className="py-4 px-5 w-10 text-center">
                  <button onClick={toggleSelectAll} className="hover:text-[var(--brand)] transition-colors">
                    {isAllSelected ? <CheckSquare size={16} strokeWidth={2.5} className="text-[var(--brand)]" /> : <Square size={16} strokeWidth={2.5} />}
                  </button>
                </th>
              )}
              <th className="py-4 px-5">Identifier</th>
              <th className="py-4 px-5">Customer Profile</th>
              <th className="py-4 px-5 text-center">Items</th>
              <th className="py-4 px-5 text-right">Value (₹)</th>
              <th className="py-4 px-5">Status Matrix</th>
              <th className="py-4 px-5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]/20 dark:divide-[var(--border)]/40">
            {orders.map((order) => {
              const isSelected = selectedOrders.has(order.id);
              const requiresAttention = order.requiresAttention;
              
              const pMode = (order.paymentMode || "").toUpperCase();
              const isCOD = pMode.includes("COD") || pMode.includes("CASH");

              return (
                <motion.tr 
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`transition-colors duration-300 group cursor-default ${isSelected ? 'bg-[var(--brand)]/5' : 'bg-[var(--surface)] hover:bg-[var(--surface-muted)]/30'}`}
                >
                  {isSelectionEnabled && (
                    <td className="py-3 px-5 text-center">
                      <button 
                        onClick={() => toggleSelectOrder(order.id)}
                        className="text-[var(--muted)] hover:text-[var(--brand)] transition-colors"
                      >
                        {isSelected ? <CheckSquare size={16} strokeWidth={2.5} className="text-[var(--brand)]" /> : <Square size={16} strokeWidth={2.5} />}
                      </button>
                    </td>
                  )}
                  
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2 mb-0.5">
                      {/* Strictly font-body font-medium for IDs */}
                      <span className="font-body font-medium text-[var(--text)] text-sm tracking-tight">#{order.id}</span>
                      {requiresAttention && (
                        <div title={order.attentionReasons?.join(', ')} className="text-red-500">
                          <AlertTriangle size={12} strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] font-medium text-[var(--sub)]">
                      {moment(order.createdAt).format("MMM D, YYYY h:mm A")}
                    </div>
                  </td>

                  <td className="py-3 px-5">
                    <div className="font-medium text-[var(--text)] text-sm tracking-tight line-clamp-1">{order.userName || order.user?.name || "Guest Checkout"}</div>
                    <div className="text-[10px] font-medium text-[var(--sub)] line-clamp-1 mt-0.5">{order.address?.phone || order.userPhone}</div>
                  </td>

                  <td className="py-3 px-5 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-[var(--surface-muted)]/50 ring-1 ring-[var(--border)]/40 rounded-lg shadow-inner">
                      <Package size={12} strokeWidth={2} className="text-[var(--muted)]" />
                      <span className="font-medium text-[11px] text-[var(--text)]">{order.itemCount || order.orderItems?.length || order.items?.length || 0}</span>
                    </div>
                  </td>

                  {/* Strictly font-body font-medium for Pricing */}
                  <td className="py-3 px-5 text-right font-body font-medium text-sm tracking-tight text-[var(--text)]">
                    ₹{(Number(order.totalAmount) || 0).toLocaleString()}
                  </td>

                  <td className="py-3 px-5">
                    <div className="flex flex-col gap-1.5 items-start">
                      <OrderStatusBadge status={order.status} />
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--muted)]">{isCOD ? 'COD' : 'PREPAID'}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--border)]"></span>
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${String(order.paymentStatus).toLowerCase() === 'paid' ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                          {String(order.paymentStatus || 'PENDING').replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-5 text-center">
                    <button 
                      onClick={() => toggleOrderDetails(order.id)}
                      className="p-2 rounded-xl ring-1 ring-[var(--border)]/40 bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--brand)] hover:ring-[var(--brand)]/50 transition-all shadow-sm"
                      title="View Details"
                    >
                      <Eye size={16} strokeWidth={2} />
                    </button>
                  </td>

                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTable;