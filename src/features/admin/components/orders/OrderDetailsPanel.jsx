import React from 'react';
import { Loader2, AlertCircle, User, Phone, Mail, MapPin, CreditCard } from 'lucide-react';
import VerticalTimeline from './VerticalTimeline';

const calculateBreakdown = (orderData) => {
  if (!orderData) return null;
  const subtotal = (orderData.orderItems || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
  const breakdown = orderDetailsData ? calculateBreakdown(orderDetailsData) : null;

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface)] animate-in slide-in-from-top-1 duration-300 cursor-default pb-8 px-4 sm:px-8 font-body">
      {loadingDetails ? (
        <div className="py-16 flex flex-col justify-center items-center text-[var(--muted)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--brand)]" strokeWidth={1.5} />
          <span className="font-display italic text-lg tracking-wide">Retrieving details...</span>
        </div>
      ) : orderDetailsData ? (
        <div className="pt-8">
          {order.status !== "Order Cancelled" && order.status !== "pending_payment" && (
            <VerticalTimeline 
                timeline={orderDetailsData.timeline} 
                currentStatus={order.status}
                courierDetails={{
                    courierName: orderDetailsData.courierName,
                    trackingId: orderDetailsData.shiprocketAwb,
                }}
            />
          )}
          
          {order.status === "pending_payment" && (
              <div className="mb-8 p-5 bg-[var(--accent-soft)] border border-[var(--accent)] rounded-xl flex items-center gap-3 text-[var(--brand)] shadow-sm">
                  <AlertCircle size={20} strokeWidth={2} />
                  <span className="font-body font-bold text-sm">This order is awaiting payment. Do not process until status changes to "Order Placed".</span>
              </div>
          )}

          <div className="flex flex-col xl:flex-row gap-8">
            {/* ITEMS ORDERED SECTION */}
            <div className="flex-1 min-w-0">
              <h4 className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-4 px-1">Items Ordered</h4>
              <div className="bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] shadow-[var(--shadow)]">
                <div className="divide-y divide-[var(--border)]">
                  {(orderDetailsData.orderItems || []).map((item, idx) => (
                    <div key={idx} className="p-5 flex items-center gap-5 hover:bg-[var(--surface)] transition-colors duration-300 group">
                      <div className="w-16 h-16 rounded-xl bg-[var(--surface)] overflow-hidden flex-shrink-0 border border-[var(--border)] group-hover:border-[var(--brand)] transition-colors">
                        <img src={item.img || "/fallback.png"} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity blend-luxury group-hover:scale-105 duration-500 ease-out" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-body font-bold text-[var(--text)] text-sm tracking-wide truncate group-hover:text-[var(--brand)] transition-colors">{item.productName}</div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="bg-[var(--surface-muted)] border border-[var(--border)] px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold text-[var(--muted)]">{item.variantName}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-body text-xs font-bold text-[var(--muted)] mb-1">₹{item.price.toLocaleString()} x {item.quantity}</div>
                        <div className="font-body font-bold text-[var(--text)] text-base tracking-tight">₹{(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* BREAKDOWN SECTION */}
                <div className="p-6 bg-[var(--surface)] space-y-3 border-t border-[var(--border)]">
                  <div className="flex justify-between items-center font-body text-xs font-bold text-[var(--sub)]">
                    <span className="uppercase tracking-widest text-[10px]">Subtotal</span>
                    <span className="text-sm">₹{breakdown.subtotal.toLocaleString()}</span>
                  </div>
                  {breakdown.discount > 0 && (
                    <div className="flex justify-between items-center font-body text-xs font-bold text-[var(--success)]">
                      <span className="uppercase tracking-widest text-[10px]">Discount {orderDetailsData.couponCode && `(${orderDetailsData.couponCode})`}</span>
                      <span className="text-sm">-₹{breakdown.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {breakdown.wallet > 0 && (
                    <div className="flex justify-between items-center font-body text-xs font-bold text-[var(--brand)]">
                      <span className="uppercase tracking-widest text-[10px]">Wallet Used</span>
                      <span className="text-sm">-₹{breakdown.wallet.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-body text-xs font-bold text-[var(--sub)]">
                    <span className="uppercase tracking-widest text-[10px]">Delivery</span>
                    <span className="text-sm">{breakdown.delivery === 0 ? "Free" : `₹${breakdown.delivery.toLocaleString()}`}</span>
                  </div>
                </div>

                {/* GRAND TOTAL */}
                <div className="p-6 bg-[var(--surface-muted)] flex justify-between items-center border-t border-[var(--border)]">
                  <span className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest">Grand Total</span>
                  <span className="font-body text-2xl font-bold text-[var(--text)] tracking-tight">₹{breakdown.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* SIDE PANELS SECTION */}
            <div className="w-full xl:w-80 space-y-6">
              
              {/* Customer Info */}
              <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] transition-shadow">
                <h4 className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-5 flex items-center gap-2">
                  <User size={14} strokeWidth={2} /> Customer
                </h4>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--brand)] flex items-center justify-center font-body font-bold text-lg">
                    {orderDetailsData.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-body font-bold text-[var(--text)] text-sm tracking-wide truncate">{orderDetailsData.userName}</div>
                    <div className="font-body text-[11px] uppercase tracking-widest font-bold text-[var(--muted)] mt-1">Registered User</div>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-3 font-body font-bold text-xs text-[var(--sub)]">
                    <Phone size={14} strokeWidth={2} className="text-[var(--muted)]" /> {orderDetailsData.phone || "N/A"}
                  </div>
                  <div className="flex items-center gap-3 font-body font-bold text-xs text-[var(--sub)] truncate" title={order.userEmail}>
                    <Mail size={14} strokeWidth={2} className="text-[var(--muted)] shrink-0" /> {order.userEmail || "No Email"}
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] transition-shadow">
                <h4 className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-5 flex items-center gap-2">
                  <MapPin size={14} strokeWidth={2} /> Shipping
                </h4>
                <div className="text-sm font-body font-bold text-[var(--sub)] leading-relaxed">
                  <p className="text-[var(--text)] mb-1.5">{orderDetailsData.shippingAddress?.address}</p>
                  <p className="text-xs">{orderDetailsData.shippingAddress?.city}, {orderDetailsData.shippingAddress?.state}</p>
                  <p className="text-[11px] text-[var(--muted)] uppercase tracking-widest mt-2">{orderDetailsData.shippingAddress?.postalCode}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] transition-shadow">
                <h4 className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-5 flex items-center gap-2">
                  <CreditCard size={14} strokeWidth={2} /> Payment
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3.5 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <span className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)]">Method</span>
                    <span className="font-body text-xs font-bold text-[var(--text)] uppercase tracking-wide">{orderDetailsData.paymentMode}</span>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)]">Status</span>
                    <span className={`px-2.5 py-1 rounded-md font-body text-[9px] uppercase tracking-widest font-bold border transition-colors ${isPaid ? 'bg-[var(--surface)] text-[var(--success)] border-[var(--border)]' : 'bg-[var(--surface-muted)] text-[var(--accent)] border-transparent'}`}>
                      {finalPaymentStatus}
                    </span>
                  </div>
                </div>
                
                {/* Cancel / Return Action Buttons */}
                {(isEditable && order.status !== "Return Initiated" && order.status !== "Returned") && (
                  <button
                    onClick={() => handleCancelOrder(order)}
                    className="w-full mt-6 py-2.5 font-body text-xs font-bold uppercase tracking-widest text-[var(--error)] bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--error)] hover:text-[var(--bg)] hover:border-[var(--error)] transition-all duration-300 shadow-sm"
                  >
                    Cancel Order
                  </button>
                )}

                {order.status === "Delivered" && (
                  <button
                    onClick={() => handleReturnOrder && handleReturnOrder(order.id)}
                    className="w-full mt-4 py-2.5 font-body text-xs font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] hover:text-[var(--surface)] hover:border-[var(--accent)] transition-all duration-300 shadow-sm"
                  >
                    Initiate Return
                  </button>
                )}

              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center flex flex-col items-center justify-center text-[var(--muted)]">
          <AlertCircle className="w-10 h-10 mb-4 opacity-50" strokeWidth={1.5} />
          <p className="font-display italic text-xl tracking-wide">Failed to load details</p>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPanel;