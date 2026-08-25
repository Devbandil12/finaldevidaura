import React from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Square, Package, AlertTriangle, Eye } from 'lucide-react';
import moment from 'moment';

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
    <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--surface-muted)] border-b border-[var(--border)] font-body text-[10px] uppercase tracking-widest text-[var(--sub)]">
              {isSelectionEnabled && (
                <th className="py-4 px-4 w-12 text-center">
                  <button onClick={toggleSelectAll} className="hover:text-[var(--brand)] transition-colors">
                    {isAllSelected ? <CheckSquare size={16} className="text-[var(--brand)]" /> : <Square size={16} />}
                  </button>
                </th>
              )}
              <th className="py-4 px-4 font-bold">Order ID & Date</th>
              <th className="py-4 px-4 font-bold">Customer</th>
              <th className="py-4 px-4 font-bold">Items</th>
              <th className="py-4 px-4 font-bold text-right">Amount</th>
              <th className="py-4 px-4 font-bold">Payment</th>
              <th className="py-4 px-4 font-bold">Fulfillment</th>
              <th className="py-4 px-4 font-bold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body text-sm text-[var(--text)] divide-y divide-[var(--border)]">
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
                  className={`hover:bg-[var(--surface-muted)] transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                >
                  {isSelectionEnabled && (
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => toggleSelectOrder(order.id)}
                        className="text-[var(--muted)] hover:text-[var(--brand)] transition-colors"
                      >
                        {isSelected ? <CheckSquare size={16} className="text-[var(--brand)]" /> : <Square size={16} />}
                      </button>
                    </td>
                  )}
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold">#{order.id}</span>
                      {requiresAttention && (
                        <div title={order.attentionReasons?.join(', ')} className="text-red-500">
                          <AlertTriangle size={14} />
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-[var(--sub)] mt-0.5">
                      {moment(order.createdAt).format("MMM D, YYYY h:mm A")}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-medium text-[var(--text)] line-clamp-1">{order.userName || order.user?.name || "Guest"}</div>
                    <div className="text-xs text-[var(--sub)] line-clamp-1">{order.address?.phone || order.userPhone}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Package size={14} className="text-[var(--sub)]" />
                      <span className="font-semibold">{order.orderItems?.length || 0} items</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right font-display font-semibold text-[var(--brand)]">
                    ₹{(Number(order.totalAmount) || 0).toLocaleString()}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold w-max ${
                        String(order.paymentStatus).toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' :
                        String(order.paymentStatus).toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        String(order.paymentStatus).toLowerCase() === 'partially_refunded' ? 'bg-purple-100 text-purple-700' :
                        String(order.paymentStatus).toLowerCase() === 'refunded' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {String(order.paymentStatus || 'PENDING').replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-[var(--sub)]">{isCOD ? 'COD' : 'PREPAID'}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold w-max ${
                        order.fulfillmentStatus === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                        order.fulfillmentStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                        order.fulfillmentStatus === 'PROCESSING' ? 'bg-orange-100 text-orange-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {order.fulfillmentStatus || 'PROCESSING'}
                      </span>
                      {order.shiprocketAwb && (
                        <span className="text-[10px] text-[var(--sub)] tracking-wide">AWB: {order.shiprocketAwb}</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button 
                      onClick={() => toggleOrderDetails(order.id)}
                      className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:text-[var(--brand)] hover:border-[var(--brand)] transition-colors shadow-sm inline-flex items-center gap-1.5 font-bold text-xs"
                    >
                      <Eye size={14} /> Open
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
