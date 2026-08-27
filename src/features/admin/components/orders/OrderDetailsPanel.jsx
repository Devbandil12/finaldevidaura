import React from 'react';
import { Loader2, AlertCircle, User, Phone, Mail, MapPin, CreditCard } from 'lucide-react';
// Assuming VerticalTimeline is imported/exists in your tree as before

const calculateBreakdown = (orderData) => {
  if (!orderData) return null;
  const items = orderData.orderItems || orderData.items || [];
  const subtotal = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
  const discount = (orderData.discountAmount || 0) + (orderData.offerDiscount || 0);
  const wallet = orderData.walletAmountUsed || 0;
  const total = orderData.totalAmount || 0;
  const delivery = Math.max(0, total - subtotal + discount + wallet);
  return { subtotal, discount, wallet, delivery, total };
};

const OrderDetailsPanel = ({
  order,
  orderDetailsData,
  loadingDetails,
  isEditable,
  finalPaymentStatus,
  isPaid,
  handleCancelOrder,
  handleReturnOrder
}) => {
  const activeData = orderDetailsData || order;
  const breakdown = activeData ? calculateBreakdown(activeData) : null;
  const items = activeData?.orderItems || activeData?.items || [];

  return (
    <div className="border-t border-[var(--border)]/20 dark:border-[var(--border)]/40 bg-[var(--surface-muted)]/10 animate-in slide-in-from-top-2 duration-500 cursor-default pb-8 px-5 sm:px-8 font-body">
      {loadingDetails ? (
        <div className="py-16 flex flex-col justify-center items-center text-[var(--muted)]">
          <Loader2 className="w-6 h-6 animate-spin mb-3 text-[var(--brand)]" strokeWidth={2} />
          <span className="font-body text-[10px] font-bold uppercase tracking-widest">Retrieving Asset...</span>
        </div>
      ) : activeData ? (
        <div className="pt-6 sm:pt-8">
          
          {activeData.status === "pending_payment" && (
              <div className="mb-6 p-4 bg-[var(--warning)]/10 ring-1 ring-[var(--warning)]/30 rounded-xl flex items-start sm:items-center gap-3 text-[var(--warning)] shadow-sm">
                  <AlertCircle size={18} strokeWidth={2.5} className="shrink-0 mt-0.5 sm:mt-0" />
                  <span className="font-body font-medium text-xs">Payment authorization pending. Await "Order Placed" status before fulfillment.</span>
              </div>
          )}

          <div className="flex flex-col xl:flex-row gap-6 sm:gap-8">
            {/* ITEMS ORDERED SECTION */}
            <div className="flex-1 min-w-0">
              <h4 className="font-body text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3 px-1">Consignment Items</h4>
              <div className="bg-[var(--surface)] rounded-[1.5rem] overflow-hidden ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                <div className="divide-y divide-[var(--border)]/20 dark:divide-[var(--border)]/40">
                  {items.length > 0 ? (
                    items.map((item, idx) => (
                      <div key={idx} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-[var(--surface-muted)]/30 transition-colors duration-300 group">
                        <div className="w-14 h-14 rounded-xl bg-[var(--surface-muted)]/50 overflow-hidden flex-shrink-0 ring-1 ring-[var(--border)]/40 group-hover:ring-[var(--brand)]/40 transition-all">
                          <img src={item.img || "/fallback.png"} alt="" className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 duration-700 ease-out" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-body font-bold text-[var(--text)] text-sm tracking-tight truncate group-hover:text-[var(--brand)] transition-colors">{item.productName || item.product?.name || "Product"}</div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="bg-[var(--surface-muted)] ring-1 ring-[var(--border)]/30 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold text-[var(--sub)]">{item.variantName || (item.size ? `${item.size}ml` : "Standard")}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 pl-3">
                          <div className="font-body text-[10px] font-medium text-[var(--muted)] mb-0.5">₹{(Number(item.price) || 0).toLocaleString()} × {item.quantity || 1}</div>
                          <div className="font-body font-medium text-[var(--text)] text-sm tracking-tight">₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-[var(--muted)] text-xs">No consignment items available.</div>
                  )}
                </div>

                {/* BREAKDOWN SECTION */}
                <div className="p-5 sm:p-6 bg-[var(--surface)] space-y-3 border-t border-[var(--border)]/30 dark:border-[var(--border)]/50">
                  <div className="flex justify-between items-center font-body text-xs font-medium text-[var(--sub)]">
                    <span className="uppercase tracking-widest text-[9px] font-bold text-[var(--muted)]">Subtotal</span>
                    <span>₹{breakdown.subtotal.toLocaleString()}</span>
                  </div>
                  {breakdown.discount > 0 && (
                    <div className="flex justify-between items-center font-body text-xs font-medium text-[var(--success)]">
                      <span className="uppercase tracking-widest text-[9px] font-bold">Discount {orderDetailsData.couponCode && `(${orderDetailsData.couponCode})`}</span>
                      <span>-₹{breakdown.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {breakdown.wallet > 0 && (
                    <div className="flex justify-between items-center font-body text-xs font-medium text-[var(--error)]">
                      <span className="uppercase tracking-widest text-[9px] font-bold">Wallet Allocated</span>
                      <span>-₹{breakdown.wallet.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-body text-xs font-medium text-[var(--sub)]">
                    <span className="uppercase tracking-widest text-[9px] font-bold text-[var(--muted)]">Logistics</span>
                    <span>{breakdown.delivery === 0 ? "Complimentary" : `₹${breakdown.delivery.toLocaleString()}`}</span>
                  </div>
                </div>

                {/* GRAND TOTAL */}
                <div className="p-5 sm:p-6 bg-[var(--surface-muted)]/30 flex justify-between items-center border-t border-[var(--border)]/30 dark:border-[var(--border)]/60">
                  <span className="font-body text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Net Value</span>
                  <span className="font-body text-xl font-medium text-[var(--text)] tracking-tight">₹{breakdown.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* SIDE PANELS SECTION */}
            <div className="w-full xl:w-80 space-y-5">
              
              {/* Customer Info */}
              <div className="bg-[var(--surface)] p-5 rounded-[1.25rem] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
                <h4 className="font-body text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <User size={12} strokeWidth={2} /> Identity
                </h4>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-10 h-10 rounded-[0.85rem] bg-[var(--surface-muted)]/50 ring-1 ring-[var(--border)]/40 text-[var(--text)] flex items-center justify-center font-display font-medium text-base shadow-sm">
                    {orderDetailsData.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-body font-bold text-[var(--text)] text-sm tracking-tight truncate">{orderDetailsData.userName}</div>
                    <div className="font-body text-[9px] uppercase tracking-widest font-bold text-[var(--sub)] mt-0.5">Profile Match</div>
                  </div>
                </div>
                <div className="space-y-2.5 pt-4 border-t border-[var(--border)]/20 dark:border-[var(--border)]/40">
                  <div className="flex items-center gap-2.5 font-body font-medium text-xs text-[var(--text)]">
                    <Phone size={12} strokeWidth={2.5} className="text-[var(--muted)]" /> {orderDetailsData.phone || "N/A"}
                  </div>
                  <div className="flex items-center gap-2.5 font-body font-medium text-xs text-[var(--text)] truncate" title={order.userEmail}>
                    <Mail size={12} strokeWidth={2.5} className="text-[var(--muted)] shrink-0" /> {order.userEmail || "Unverified"}
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="bg-[var(--surface)] p-5 rounded-[1.25rem] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
                <h4 className="font-body text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <MapPin size={12} strokeWidth={2} /> Routing Details
                </h4>
                <div className="text-xs font-body font-medium text-[var(--sub)] leading-relaxed">
                  <p className="text-[var(--text)] mb-1">{orderDetailsData.shippingAddress?.address}</p>
                  <p>{orderDetailsData.shippingAddress?.city}, {orderDetailsData.shippingAddress?.state}</p>
                  <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-widest mt-2">{orderDetailsData.shippingAddress?.postalCode}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-[var(--surface)] p-5 rounded-[1.25rem] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
                <h4 className="font-body text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <CreditCard size={12} strokeWidth={2} /> Transaction
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-[var(--surface-muted)]/30 rounded-lg ring-1 ring-[var(--border)]/30 shadow-inner">
                    <span className="font-body text-[9px] uppercase tracking-widest font-bold text-[var(--muted)]">Vector</span>
                    <span className="font-body text-[11px] font-bold text-[var(--text)] uppercase tracking-wider">{orderDetailsData.paymentMode}</span>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="font-body text-[9px] uppercase tracking-widest font-bold text-[var(--muted)]">Clearance</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold ring-1 transition-colors ${isPaid ? 'bg-[var(--success)]/10 text-[var(--success)] ring-[var(--success)]/30' : 'bg-[var(--warning)]/10 text-[var(--warning)] ring-[var(--warning)]/30'}`}>
                      {finalPaymentStatus}
                    </span>
                  </div>
                </div>
                
                {/* Cancel / Return Action Buttons */}
                {(isEditable && order.status !== "Return Initiated" && order.status !== "Returned") && (
                  <button
                    onClick={() => handleCancelOrder(order)}
                    className="w-full mt-5 py-2 font-body text-[10px] font-bold uppercase tracking-widest text-[var(--error)] bg-transparent ring-1 ring-[var(--error)]/40 rounded-lg hover:bg-[var(--error)] hover:text-white hover:ring-[var(--error)] transition-all duration-300 shadow-sm"
                  >
                    Halt Order
                  </button>
                )}

                {order.status === "Delivered" && (
                  <button
                    onClick={() => handleReturnOrder && handleReturnOrder(order.id)}
                    className="w-full mt-3 py-2 font-body text-[10px] font-bold uppercase tracking-widest text-[var(--text)] bg-[var(--surface)] ring-1 ring-[var(--border)]/50 rounded-lg hover:bg-[var(--surface-muted)] hover:ring-[var(--border)] transition-all duration-300 shadow-sm"
                  >
                    Initiate RMA
                  </button>
                )}

              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center flex flex-col items-center justify-center text-[var(--muted)]">
          <AlertCircle className="w-8 h-8 mb-3 opacity-40" strokeWidth={1.5} />
          <p className="font-body text-[10px] uppercase font-bold tracking-widest">Failed to load asset</p>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPanel;