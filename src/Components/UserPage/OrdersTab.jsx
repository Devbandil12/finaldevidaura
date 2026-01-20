import React, { useState, useMemo } from 'react';
import { Loader2, ShoppingBag, X, ChevronRight, Package, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Shared Utility (You can move this to a utils file) ---
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-IN", { 
    month: "short", day: "numeric", year: "numeric" 
  });
};

export default function OrdersTab({ orders, loadingOrders, products }) {
  const [viewOrder, setViewOrder] = useState(null);
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-zinc-100">
        <div>
          <h2 className="font-serif text-3xl font-medium text-zinc-900 tracking-tight">Order History</h2>
          <p className="text-zinc-500 font-light text-sm mt-1 font-sans">Track your past purchases and returns.</p>
        </div>
      </div>

      {loadingOrders ? (
        <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-zinc-300" /></div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-zinc-50/50 rounded-[2rem] border border-dashed border-zinc-200">
          <ShoppingBag className="text-zinc-300 mb-4" size={48} strokeWidth={1} />
          <h3 className="font-serif text-xl text-zinc-900">No orders yet</h3>
          <p className="text-zinc-400 font-light text-sm mt-2 max-w-xs text-center">Your collection awaits. Discover our signature scents.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => {
            const previewImages = order.orderItems.slice(0, 4).map((item) => {
              const prod = productMap.get(item.productId);
              return prod?.imageurl?.[0] || item.img;
            });
            const remaining = Math.max(0, order.orderItems.length - 4);
            const isDelivered = order.status.toLowerCase() === 'delivered';
            
            // Dynamic Status Colors
            let statusStyle = "bg-zinc-100 text-zinc-600 border-zinc-200";
            if (isDelivered) statusStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
            else if (order.status.toLowerCase().includes('cancel')) statusStyle = "bg-rose-50 text-rose-700 border-rose-100";
            else if (order.status.toLowerCase().includes('ship')) statusStyle = "bg-blue-50 text-blue-700 border-blue-100";

            return (
              <motion.div 
                key={order.id} 
                layoutId={order.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setViewOrder(order)}
                className="group relative bg-white rounded-[2rem] p-6 sm:p-8 cursor-pointer border border-zinc-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-zinc-200 transition-all"
              >
                <div className="flex flex-col md:flex-row gap-8 justify-between">
                  
                  {/* Left: Info */}
                  <div className="space-y-6 flex-1">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusStyle}`}>
                        {order.status}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                        <Calendar size={12} /> {formatDate(order.createdAt)}
                      </div>
                      <div className="text-xs text-zinc-300 font-mono">#{order.id.slice(-6).toUpperCase()}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      {previewImages.map((img, idx) => (
                        <div key={idx} className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 p-1.5 shadow-sm">
                          <img src={img} className="w-full h-full object-contain mix-blend-multiply" alt="Product" />
                        </div>
                      ))}
                      {remaining > 0 && (
                        <div className="w-14 h-14 rounded-xl border border-zinc-100 bg-zinc-50 flex items-center justify-center text-xs font-bold text-zinc-400">
                          +{remaining}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Price & Action */}
                  <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-4 border-t md:border-t-0 border-zinc-50 pt-4 md:pt-0 pl-0 md:pl-8 md:border-l border-zinc-50">
                    <div className="md:text-right">
                      <p className="font-serif text-2xl font-medium text-zinc-900">₹{order.totalAmount}</p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Total Paid</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                        <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {viewOrder && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4" 
            onClick={() => setViewOrder(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} 
              className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col" 
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <div>
                   <h3 className="font-serif text-2xl text-zinc-900">Order Details</h3>
                   <p className="text-xs text-zinc-500 font-mono mt-1">ID: {viewOrder.id}</p>
                </div>
                <button onClick={() => setViewOrder(null)} className="p-2.5 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 transition-colors text-zinc-500">
                   <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                 {/* Product List */}
                 <div className="space-y-6">
                    {viewOrder.orderItems.map(item => {
                        const prod = productMap.get(item.productId);
                        return (
                            <div key={item.id} className="flex gap-5 items-center">
                                <div className="w-20 h-20 rounded-2xl bg-zinc-50 border border-zinc-100 p-2 flex-shrink-0">
                                    <img src={prod?.imageurl?.[0] || item.img} className="w-full h-full object-contain mix-blend-multiply" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-zinc-900 truncate font-serif text-lg">{item.productName}</h4>
                                    <p className="text-xs text-zinc-500 mt-1">Quantity: {item.quantity}</p>
                                </div>
                                <p className="font-medium text-zinc-900 font-serif text-lg">₹{item.totalPrice}</p>
                            </div>
                        )
                    })}
                 </div>

                 {/* Summary Stats */}
                 <div className="bg-zinc-50 rounded-3xl p-6 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Payment Status</span>
                        <span className="font-medium text-zinc-900 capitalize">{viewOrder.paymentInfo?.status || "Paid"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Order Date</span>
                        <span className="font-medium text-zinc-900">{formatDate(viewOrder.createdAt)}</span>
                    </div>
                    <div className="h-px bg-zinc-200 my-2"></div>
                    <div className="flex justify-between text-lg font-serif font-bold">
                        <span className="text-zinc-900">Total Amount</span>
                        <span className="text-zinc-900">₹{viewOrder.totalAmount}</span>
                    </div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}