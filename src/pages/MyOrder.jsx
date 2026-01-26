import React, { useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom"; 
import { OrderContext } from "../contexts/OrderContext";
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext"; 
import Loader from "../Components/Loader";
import MiniLoader from "../Components/MiniLoader";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Clock,
  XCircle,
  Package, // Kept for fallback icons if needed
  ChevronDown,
  ChevronUp,
  RotateCw,
  AlertTriangle,
  Repeat,
  ArrowRight,
  ShoppingBag,
  Receipt,
  CreditCard,
  Banknote,
  Download,
  Calendar,      // 🟢 Added
  PackageCheck,  // 🟢 Added
  MapPin         // 🟢 Added
} from "lucide-react";

// --- Soft "Buttery" Animation Config ---
const softSpring = {
  type: "spring",
  stiffness: 180,
  damping: 24,
  mass: 1,
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

// Helper to format date
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// --- Sub-Components ---

// 🟢 NEW: Vertical Timeline Component
const VerticalTimeline = ({ timeline, currentStatus, courierDetails }) => {
  // Use timeline if available, otherwise fallback to simple status
  // Note: Backend returns timeline sorted DESC (latest first)
  const events = timeline && timeline.length > 0 
    ? timeline 
    : [{ title: "Order Placed", description: "Order received", timestamp: new Date(), status: "Order Placed" }];

  return (
    <div className="mt-6 md:mt-8 space-y-0 relative pl-2 md:pl-4">
      {/* Vertical Line */}
      <div className="absolute left-[19px] md:left-[27px] top-4 bottom-4 w-0.5 bg-zinc-100" />

      {events.map((event, index) => {
        const isLatest = index === 0;
        const dateObj = new Date(event.timestamp);
        
        return (
          <div key={index} className="relative flex gap-4 md:gap-6 pb-8 last:pb-0">
            {/* Icon/Dot */}
            <div className={`relative z-10 h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center border-4 border-white ${
              isLatest ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200' : 'bg-zinc-100 text-zinc-400'
            }`}>
              {isLatest ? <PackageCheck size={18} /> : <div className="h-2 w-2 rounded-full bg-zinc-400" />}
            </div>

            {/* Content */}
            <div className={`flex-1 pt-1 md:pt-1.5 ${isLatest ? 'opacity-100' : 'opacity-70'}`}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-4">
                <div>
                  <h4 className="text-sm md:text-base font-semibold text-zinc-900">{event.title}</h4>
                  <p className="text-xs md:text-sm text-zinc-500 mt-1 max-w-md leading-relaxed">
                    {event.description}
                  </p>
                  
                  {/* Show Courier Details if this is the Shipped event */}
                  {event.status === 'Shipped' && courierDetails?.trackingId && (
                    <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg inline-block">
                        <p className="text-xs text-blue-800 font-medium">
                            Courier: {courierDetails.courierName}
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                            AWB: {courierDetails.trackingId}
                        </p>
                        {courierDetails.trackingUrl && (
                          <a href={courierDetails.trackingUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 underline mt-1 block">
                            Track
                          </a>
                        )}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-0.5 mt-2 md:mt-0 text-xs font-medium text-zinc-400">
                  <span className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded md:bg-transparent md:p-0">
                    <Calendar size={12} />
                    {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded md:bg-transparent md:p-0">
                    <Clock size={12} />
                    {dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const RefundStatusDisplay = ({ refund, onRefresh, isRefreshing }) => {
  const [expanded, setExpanded] = useState(false);

  if (!refund || !refund.status) return null;

  const { status, amount, refund_completed_at, speed } = refund;
  const formattedAmount = `₹${(amount / 100).toFixed(2)}`;

  // Normalize status
  const currentStatus = ['created', 'queued', 'pending', 'in_progress'].includes(status)
    ? 'pending'
    : status;

  // Logic to check if 7 days have passed
  let isLongAgo = false;
  if (refund_completed_at) {
    const completedDate = new Date(refund_completed_at);
    const today = new Date();
    const diffTime = Math.abs(today - completedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 7) isLongAgo = true;
  }

  // Define UI Content
  let title = "Refund Processed";
  let details = "";
  let icon = <CheckCircle className="h-4 w-4 text-zinc-900" />;
  let style = "bg-zinc-50 border-zinc-100 text-zinc-900";
  let showRefresh = true;

  if (currentStatus === 'processed') {
    if (speed === 'optimum' || speed === 'instant' || isLongAgo) {
      title = "Refund Complete";
      details = `Refund is complete. ${formattedAmount} has been credited to your account.`;
      showRefresh = false; 
    } else {
      title = "Refund Processed";
      details = `Refund processed. ${formattedAmount} will be credited in your account within 5-7 working days.`;
    }
  } else if (currentStatus === 'pending') {
    title = "Refund Processing";
    icon = <Clock className="h-4 w-4 text-zinc-500" />;
    style = "bg-white border-dashed border-zinc-300 text-zinc-500";
    
    if (speed === 'optimum') {
      details = `${formattedAmount} is being processed via optimum Refund.`;
    } else {
      details = `${formattedAmount} is being processed.`;
    }
  } else if (currentStatus === 'failed') {
    title = "Refund Failed";
    details = "Contact support for assistance.";
    icon = <XCircle className="h-4 w-4 text-zinc-900" />;
    style = "bg-zinc-50 border-zinc-200 text-zinc-900";
    showRefresh = false;
  }

  return (
    <div 
      className={`rounded-2xl px-4 py-3 md:px-5 md:py-4 mt-6 border transition-all duration-300 ${style}`}
    >
      {/* --- Top Row (Always Visible) --- */}
      <div className="flex items-center justify-between">
        {/* Clickable Area to Toggle Dropdown */}
        <div 
          onClick={() => setExpanded(!expanded)} 
          className="flex items-center gap-3 md:gap-4 cursor-pointer group select-none flex-grow"
        >
          <div className="p-2 bg-white rounded-full shadow-sm shrink-0">
            {icon}
          </div>
          
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{title}</h3>
            {/* Chevron Icon that rotates */}
            <div className={`transition-transform duration-300 text-zinc-400 ${expanded ? 'rotate-180' : ''}`}>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* Refresh Button (Stops propagation so it doesn't toggle dropdown) */}
        {showRefresh && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            disabled={isRefreshing}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
            title="Check for status updates"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* --- Dropdown Content (Hidden by default) --- */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-xs opacity-70 mt-2 ml-[3.25rem] leading-relaxed pb-1">
              {details}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function MyOrders() {
  const navigate = useNavigate(); // Hook for navigation
  const { orders, setOrders, cancelOrder, loadingOrders } = useContext(OrderContext);
  const { userdetails } = useContext(UserContext);
  const { startBuyNow } = useContext(CartContext); // Hook for Buy Now logic

  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [modalOrder, setModalOrder] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [refreshingStatusId, setRefreshingStatusId] = useState(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // --- Click Outside Logic ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!expandedOrderId) return;
      const activeCard = document.querySelector(`[data-order-id="${expandedOrderId}"]`);
      if (activeCard && !activeCard.contains(event.target)) {
        setExpandedOrderId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expandedOrderId]);

  if (loadingOrders) {
    return <Loader text="Loading collection..." />;
  }

  // 1. Get Sorted Orders
  const sortedOrders = (orders || [])
    .filter((o) => userdetails?.id && o.userId === userdetails.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // 2. Separate into Groups
  const activeOrders = sortedOrders.filter(o => {
    const s = o.status.toLowerCase();
    return !s.includes('cancelled') && s !== 'delivered';
  });

  const deliveredOrders = sortedOrders.filter(o => o.status.toLowerCase() === 'delivered');

  const cancelledOrders = sortedOrders.filter(o => o.status.toLowerCase().includes('cancelled'));


  const handleConfirmCancel = async () => {
    if (!modalOrder) return;
    setCancellingOrderId(modalOrder.id);
    setModalOrder(null);
    await cancelOrder(modalOrder.id, modalOrder.paymentMode, modalOrder.totalAmount);
    setCancellingOrderId(null);
  };

  const reorder = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || !order.orderItems || order.orderItems.length === 0) return;

    // Grab the first item (Current "Buy Now" system supports single item flow)
    const item = order.orderItems[0];

    // Construct the Buy Now object
    const buyNowItem = {
      product: {
        id: item.productId,
        name: item.productName,
        imageurl: [item.img], // Cart expects array
      },
      variant: {
        id: item.variantId || item.productId,
        name: item.size ? `${item.size}ml` : "Standard",
        size: item.size,
        oprice: item.price, 
        price: item.price,
        stock: 999, // Assume stock exists for UI; API will validate later
        discount: 0
      },
      quantity: item.quantity,
    };

    // 1. Set the Buy Now state in CartContext
    startBuyNow(buyNowItem);

    // 2. Navigate to Cart Page (NOT Checkout) with Buy Now flag
    navigate("/cart", { state: { isBuyNow: true } });
  };

  const toggleTrackOrder = (orderId) => {
    setExpandedOrderId((prevId) => (prevId === orderId ? null : orderId));
  };

  const handleRefreshStatus = async (orderId) => {
    setRefreshingStatusId(orderId);
    try {
      const res = await fetch(`${BACKEND}/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order status");
      const updatedOrder = await res.json();
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshingStatusId(null);
    }
  };

  const canDownloadInvoice = (order) => {
    const status = order.status?.toLowerCase() || "";
    const isOnline = order.paymentMode === 'online' || order.paymentMode === 'wallet';
    if (status.includes('cancelled')) return false;
    if (isOnline) {
      return status !== 'order placed';
    } else {
      return status === 'delivered';
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      setDownloadingInvoiceId(orderId);
      const response = await fetch(`${BACKEND}/api/orders/${orderId}/invoice`, {
        method: 'GET',
        headers: {},
      });

      if (!response.ok) throw new Error("Failed to download invoice");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Invoice download error:", error);
      alert("Could not download invoice. Please try again.");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const renderCancellationModal = () => {
    if (!modalOrder) return null;
    const isOnlinePayment = modalOrder.paymentMode === "online" || modalOrder.paymentMode === "wallet";
    const refundAmount = modalOrder.totalAmount * 0.95;

    return createPortal(
      <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModalOrder(null)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={softSpring}
          className="bg-white rounded-[28px] md:rounded-[32px] shadow-2xl p-6 md:p-8 max-w-sm w-full border border-zinc-100"
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="h-12 w-12 md:h-14 md:w-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 text-red-500">
              <AlertTriangle size={24} strokeWidth={1.5} />
            </div>

            <h2 className="text-xl font-semibold text-zinc-900 mb-2">Cancel Order?</h2>

            <div className="text-zinc-500 text-sm mb-6 space-y-2 leading-relaxed">
              <p>Are you sure you want to cancel <br /><span className="text-zinc-900 font-medium">Order #{modalOrder.id}</span>?</p>
              {isOnlinePayment && (
                <div className="mt-4 p-4 bg-zinc-50 rounded-2xl text-xs text-left border border-zinc-100">
                  <p className="flex justify-between mb-1 text-zinc-500"><span>Cancellation Fee (5%):</span> <span>-₹{(modalOrder.totalAmount * 0.05).toFixed(2)}</span></p>
                  <div className="h-px bg-zinc-200 my-2"></div>
                  <p className="flex justify-between text-zinc-900 font-bold text-sm"><span>Refund Amount:</span> <span>₹{refundAmount.toFixed(2)}</span></p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setModalOrder(null)}
                className="py-3 px-4 rounded-full text-sm font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="py-3 px-4 rounded-full text-sm font-medium bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>,
      document.body
    );
  };

  // Helper to render a single card (to avoid duplication across sections)
  const renderOrderCard = (order) => {
    const isExpanded = expandedOrderId === order.id;
    const isPrepaid = order.paymentMode === "online" || order.paymentMode === "wallet";
    const refundInfo = order.refund_status ? {
      status: order.refund_status, amount: order.refund_amount,
      refund_completed_at: order.refund_completed_at, speed: order.refund_speed,
    } : null;

    // 🟢 CALCULATE BREAKDOWN
    const subtotal = order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = (order.discountAmount || 0) + (order.offerDiscount || 0);
    const wallet = order.walletAmountUsed || 0;
    // Reverse calc delivery
    const delivery = Math.max(0, order.totalAmount - subtotal + discount + wallet);

    return (
      <motion.div
        data-order-id={order.id}
        variants={cardVariant}
        layout
        key={order.id}
        className="group bg-white rounded-3xl md:rounded-[32px] border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)] transition-all duration-500 overflow-hidden"
      >
        <div className="p-5 md:p-8">
          {/* Top Row: ID, Date & Statuses */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                <Receipt size={16} strokeWidth={1.5} className="md:w-[18px] md:h-[18px]" />
              </div>
              <div>
                <span className="text-sm md:text-base font-semibold text-zinc-900 break-all">Order #{order.id}</span>
                <p className="text-[10px] md:text-xs text-zinc-400 font-medium">{formatDateTime(order.createdAt)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:justify-end">
              {/* Payment Badge */}
              <div className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] font-bold tracking-wider border flex items-center gap-1.5 ${isPrepaid
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-500 border-zinc-200'
                }`}>
                {isPrepaid ? <CreditCard size={10} strokeWidth={2} className="md:w-3 md:h-3" /> : <Banknote size={10} strokeWidth={2} className="md:w-3 md:h-3" />}
                {isPrepaid ? "PREPAID" : "COD"}
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold tracking-wide border capitalize ${order.status === 'delivered'
                ? 'bg-zinc-100 text-zinc-900 border-zinc-200'
                : 'bg-white text-zinc-600 border-zinc-200'
                }`}>
                {order.status}
              </div>
            </div>
          </div>

          {/* Items Grid */}
          <div className="space-y-4 md:space-y-6">
            {order.orderItems.map((item, i) => (
              <div key={i} className="flex items-start md:items-center gap-4 md:gap-6 group/item">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-zinc-50 flex-shrink-0 flex items-center justify-center p-2 md:p-4 mix-blend-multiply transition-colors duration-300 group-hover/item:bg-zinc-100">
                  <img
                    src={item.img || "/fallback.png"}
                    alt={item.productName}
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-900 truncate pr-2">{item.productName}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-md bg-zinc-50 border border-zinc-100 text-[10px] font-medium text-zinc-500">
                      Qty: {item.quantity}
                    </span>
                    {item.size && (
                      <span className="px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-md bg-zinc-50 border border-zinc-100 text-[10px] font-medium text-zinc-500">
                        {item.size}ml
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {refundInfo && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <RefundStatusDisplay refund={refundInfo} onRefresh={() => handleRefreshStatus(order.id)} isRefreshing={refreshingStatusId === order.id} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 🟢 NEW: PRICE BREAKDOWN SUMMARY */}
          <div className="mt-6 p-4 bg-zinc-50/50 rounded-2xl border border-zinc-50 space-y-2">
            <div className="flex justify-between items-center text-xs text-zinc-500">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-600 font-medium">
                <span className="flex items-center gap-1">
                  Savings 
                  {order.couponCode && <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">{order.couponCode}</span>}
                </span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}

            {wallet > 0 && (
              <div className="flex justify-between items-center text-xs text-zinc-700 font-medium">
                <span>Wallet Used</span>
                <span>-₹{wallet.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-zinc-500">
              <span>Delivery</span>
              <span>{delivery === 0 ? "Free" : `₹${delivery.toFixed(2)}`}</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-4 pt-4 border-t border-zinc-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-start w-full sm:w-auto mr-auto">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-0 sm:mb-1">Total Amount</span>
              <span className="text-lg md:text-xl font-medium text-zinc-900">₹{order.totalAmount.toFixed(2)}</span>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 w-full sm:flex sm:w-auto sm:items-center sm:justify-end">

              {canDownloadInvoice(order) && (
                <button
                  onClick={() => handleDownloadInvoice(order.id)}
                  disabled={downloadingInvoiceId === order.id}
                  className="px-4 py-3 md:px-6 md:py-3 rounded-full text-xs font-semibold border border-zinc-200 text-zinc-800 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                >
                  {downloadingInvoiceId === order.id ? (
                    <RotateCw className="animate-spin" size={14} />
                  ) : (
                    <Download size={14} />
                  )}
                  {downloadingInvoiceId === order.id ? "Downloading..." : "Invoice"}
                </button>
              )}

              {order.status === "Order Placed" && !refundInfo && (
                cancellingOrderId === order.id ? <div className="flex justify-center w-full"><MiniLoader /></div> : (
                  <button
                    onClick={() => setModalOrder(order)}
                    className="px-4 py-3 md:px-6 md:py-3 rounded-full text-xs font-semibold text-zinc-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors w-full sm:w-auto"
                  >
                    Cancel Order
                  </button>
                )
              )}

              {order.status.toLowerCase() === "delivered" && (
                <button
                  onClick={() => reorder(order.id)}
                  className="px-4 py-3 md:px-6 md:py-3 rounded-full text-xs font-semibold border border-zinc-200 text-zinc-800 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Repeat size={14} /> Buy Again
                </button>
              )}

              {order.status !== "Order Cancelled" && (
                <button
                  onClick={() => toggleTrackOrder(order.id)}
                  className="px-4 py-3 md:px-8 md:py-3 rounded-full text-xs font-semibold bg-zinc-900 text-white shadow-lg shadow-zinc-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {isExpanded ? "Hide Details" : "Track Order"}
                  {isExpanded ? <ChevronUp size={14} /> : <ArrowRight size={14} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Tracking */}
        <AnimatePresence>
          {isExpanded && order.status !== "Order Cancelled" && (
            <motion.div
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { opacity: 1, height: "auto" },
                collapsed: { opacity: 0, height: 0 },
              }}
              transition={softSpring}
              className="bg-zinc-50/50 border-t border-zinc-50"
            >
              <div className="p-5 md:p-8">
                {/* 🟢 MODIFIED: Use Vertical Timeline */}
                <VerticalTimeline 
                    timeline={order.timeline} 
                    currentStatus={order.status}
                    courierDetails={{
                        courierName: order.courierName,
                        trackingId: order.trackingId,
                        trackingUrl: order.trackingUrl
                    }} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <>
      <title>My Orders | Devid Aura</title>
      <main className="max-w-5xl mx-auto my-6 md:my-12 px-4 md:px-6 w-full min-h-screen">
        {renderCancellationModal()}

        {/* --- Header --- */}
        <div className="mt-20 md:mt-[100px] mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-5">
            <div>
              <h1 className="text-3xl md:text-4xl font-normal text-zinc-900 tracking-tight">
                Order History
              </h1>
              <p className="text-zinc-500 text-sm font-medium max-w-md leading-relaxed mt-2">
                View and track your recent purchases, manage returns, and download invoices from your collection history.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-light text-zinc-900">{sortedOrders.length}</span>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Orders</span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <AnimatePresence mode="wait">
          {sortedOrders.length === 0 ? (
            // --- EMPTY STATE ---
            <motion.div
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center justify-center py-20 md:py-32 bg-white rounded-[32px] border border-zinc-100 shadow-sm text-center px-6"
            >
              <div className="h-16 w-16 md:h-20 md:w-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-zinc-300" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg md:text-xl font-medium text-zinc-900">Your collection is empty</h2>
              <p className="mt-2 text-sm text-zinc-400">Time to discover your signature scent.</p>
            </motion.div>
          ) : (
            // --- SECTIONS ---
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-16"
            >
              {/* 1. ACTIVE ORDERS */}
              {activeOrders.length > 0 && (
                <section>
                  <h2 className="text-xl md:text-2xl font-medium text-zinc-900 tracking-tight mb-6 flex items-center gap-3">
                    Active Orders
                    <span className="text-sm font-normal text-zinc-400 bg-zinc-50 px-2.5 py-0.5 rounded-full border border-zinc-100">
                      {activeOrders.length}
                    </span>
                  </h2>
                  <div className="space-y-6 md:space-y-8">
                    {activeOrders.map(renderOrderCard)}
                  </div>
                </section>
              )}

              {/* 2. SUCCESSFUL (Delivered) ORDERS */}
              {deliveredOrders.length > 0 && (
                <section>
                  <h2 className="text-xl md:text-2xl font-medium text-zinc-900 tracking-tight mb-6 flex items-center gap-3">
                    Delivered
                  </h2>
                  <div className="space-y-6 md:space-y-8">
                    {deliveredOrders.map(renderOrderCard)}
                  </div>
                </section>
              )}

              {/* 3. CANCELLED ORDERS */}
              {cancelledOrders.length > 0 && (
                <section>
                  <h2 className="text-xl md:text-2xl font-medium text-zinc-900 tracking-tight mb-6 flex items-center gap-3">
                    Cancelled
                  </h2>
                  <div className="space-y-6 md:space-y-8 opacity-80 hover:opacity-100 transition-opacity duration-300">
                    {cancelledOrders.map(renderOrderCard)}
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}