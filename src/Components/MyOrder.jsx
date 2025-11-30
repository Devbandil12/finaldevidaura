import React, { useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { OrderContext } from "../contexts/OrderContext";
import { UserContext } from "../contexts/UserContext";
import Loader from "./Loader";
import MiniLoader from "./MiniLoader";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Package,
  Cog,
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
  FileText
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

const RefundStatusDisplay = ({ refund, onRefresh, isRefreshing }) => {
  if (!refund || !refund.status) return null;

  const { status, amount, refund_completed_at } = refund;
  const formattedAmount = `₹${(amount / 100).toFixed(2)}`;

  const currentStatus = ['created', 'queued', 'pending', 'in_progress'].includes(status)
    ? 'pending'
    : status;

  const statusConfig = {
    processed: {
      icon: <CheckCircle className="h-4 w-4 text-zinc-900" />,
      title: "Refund Processed",
      details: `${formattedAmount} credited on ${formatDateTime(refund_completed_at)}.`,
      style: "bg-zinc-50 border-zinc-100 text-zinc-900",
    },
    pending: {
      icon: <Clock className="h-4 w-4 text-zinc-500" />,
      title: "Refund Processing",
      details: `${formattedAmount} is being processed.`,
      style: "bg-white border-dashed border-zinc-300 text-zinc-500",
    },
    failed: {
      icon: <XCircle className="h-4 w-4 text-zinc-900" />,
      title: "Refund Failed",
      details: "Contact support for assistance.",
      style: "bg-zinc-50 border-zinc-200 text-zinc-900",
    },
  };

  const config = statusConfig[currentStatus];
  if (!config) return null;

  return (
    <div className={`rounded-2xl p-5 mt-6 border flex items-center justify-between gap-4 ${config.style}`}>
      <div className="flex items-center gap-4">
        <div className="p-2 bg-white rounded-full shadow-sm">{config.icon}</div>
        <div>
          <h3 className="text-sm font-medium">{config.title}</h3>
          <p className="text-xs opacity-70 mt-0.5">{config.details}</p>
        </div>
      </div>
      {currentStatus === 'pending' && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-full hover:bg-black/5 transition-colors"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};

export default function MyOrders() {
  const { orders, setOrders, cancelOrder, loadingOrders } = useContext(OrderContext);
  const { userdetails } = useContext(UserContext);

  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [modalOrder, setModalOrder] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [refreshingStatusId, setRefreshingStatusId] = useState(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // --- NEW: Click Outside Logic ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If no order is expanded, do nothing
      if (!expandedOrderId) return;

      // Find the currently expanded card element in the DOM
      const activeCard = document.querySelector(`[data-order-id="${expandedOrderId}"]`);

      // If the click target is NOT inside the active card, close it
      if (activeCard && !activeCard.contains(event.target)) {
        setExpandedOrderId(null);
      }
    };

    // Using mousedown for better UI responsiveness than click
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expandedOrderId]);
  // -------------------------------

  if (loadingOrders) {
    return <Loader text="Loading collection..." />;
  }

  const sortedOrders = (orders || [])
    .filter((o) => userdetails?.id && o.userId === userdetails.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleConfirmCancel = async () => {
    if (!modalOrder) return;
    setCancellingOrderId(modalOrder.id);
    setModalOrder(null);
    await cancelOrder(modalOrder.id, modalOrder.paymentMode, modalOrder.totalAmount);
    setCancellingOrderId(null);
  };

  const reorder = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const items = order.orderItems.map((item) => ({
      product: {
        id: item.productId,
        name: item.productName,
        oprice: item.price,
        discount: item.discount || 0,
        quantity: item.quantity,
        imageurl: item.img,
        size: item.size || "100",
      },
      quantity: item.quantity,
    }));
    localStorage.setItem("selectedItems", JSON.stringify(items));
    window.location.href = "/checkout";
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
    const isOnline = order.paymentMode === 'online'; // Ensure this matches your DB value (e.g., 'online', 'card', 'upi')
    const isDelivered = order.status?.toLowerCase() === 'delivered';
    const isCancelled = order.status?.toLowerCase().includes('cancelled');

    if (isCancelled) return false;

    // Requirement: For online, don't show until delivered
    if (isOnline) {
      return isDelivered;
    }

    // For COD or others, show by default (or adjust if you want them to wait too)
    return true;
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      setDownloadingInvoiceId(orderId);
      const response = await fetch(`${BACKEND}/api/orders/${orderId}/invoice`, {
        method: 'GET',
        headers: {
          // Add Authorization header if your backend requires it
          // 'Authorization': `Bearer ${token}` 
        },
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

  const renderStepProgress = (progressStep, status) => {
    const steps = [
      { label: "Confirmed", icon: <Package size={16} /> },
      { label: "Processing", icon: <Cog size={16} /> },
      { label: "On The Way", icon: <Truck size={16} /> },
      { label: "Delivered", icon: <ShoppingBag size={16} /> },
    ];

    const isCancelled = status.toLowerCase().includes('cancelled');
    const currentStepIndex = isCancelled ? -1 : (status === "delivered" ? 3 : (progressStep || 1) - 1);

    return (
      <div className="w-full pt-8 pb-4 px-2">
        <div className="flex relative justify-between items-center">
          {/* Background Track */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-zinc-100 -z-10 -translate-y-1/2 rounded-full" />

          {/* Active Fill Track */}
          <motion.div
            className="absolute top-1/2 left-0 h-[2px] bg-zinc-900 -z-10 -translate-y-1/2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: "circOut" }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            return (
              <div key={idx} className="flex flex-col items-center gap-4 bg-transparent">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${isCompleted
                  ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-200'
                  : 'bg-white border-zinc-100 text-zinc-300'
                  }`}>
                  {step.icon}
                </div>
                <p className={`text-[10px] uppercase tracking-wider font-semibold transition-colors duration-300 ${isCompleted ? 'text-zinc-900' : 'text-zinc-300'}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCancellationModal = () => {
    if (!modalOrder) return null;
    const isOnlinePayment = modalOrder.paymentMode === "online";
    const refundAmount = modalOrder.totalAmount * 0.95;

    return createPortal(
      <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setModalOrder(null)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={softSpring}
          className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 max-w-sm w-full border border-zinc-100"
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="h-14 w-14 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-900">
              <AlertTriangle size={24} strokeWidth={1.5} />
            </div>

            <h2 className="text-xl font-semibold text-zinc-900 mb-2">Cancel Order?</h2>

            <div className="text-zinc-500 text-sm mb-8 space-y-2 leading-relaxed">
              <p>Are you sure you want to cancel <br /><span className="text-zinc-900 font-medium">Order #{modalOrder.id}</span>?</p>
              {isOnlinePayment && (
                <div className="mt-4 p-4 bg-zinc-50 rounded-2xl text-xs">
                  <p className="mb-1">Cancellation Fee: 5%</p>
                  <p className="text-zinc-900 font-bold text-sm">Refund: ₹{refundAmount.toFixed(2)}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setModalOrder(null)}
                className="py-3 px-4 rounded-full text-sm font-medium border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="py-3 px-4 rounded-full text-sm font-medium bg-zinc-900 text-white shadow-lg shadow-zinc-200 hover:bg-black transition-all"
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

  return (
    <>
      <title>My Orders | Devid Aura</title>
      <main className="max-w-5xl mx-auto my-12 px-6 w-full min-h-screen">
        {renderCancellationModal()}

        {/* --- Minimal Editorial Header --- */}
        <div className="mt-[100px] mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-zinc-200 pb-5">
            <div>
              <h1 className="text-3xl md:text-4xl font-normal text-zinc-900 tracking-tight">
                Order History
              </h1>
              <p className="text-zinc-500 text-sm font-medium max-w-md leading-relaxed">
                View and track your recent purchases, manage returns, and download invoices from your collection history.
              </p>
            </div>

            {/* Simple Counter */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-light text-zinc-900">{sortedOrders.length}</span>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Orders</span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <AnimatePresence mode="wait">
          {sortedOrders.length === 0 ? (
            <motion.div
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center justify-center py-32 bg-white rounded-[32px] border border-zinc-100 shadow-sm text-center"
            >
              <div className="h-20 w-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="h-8 w-8 text-zinc-300" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-medium text-zinc-900">Your collection is empty</h2>
              <p className="mt-2 text-sm text-zinc-400">Time to discover your signature scent.</p>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              {sortedOrders.map((order) => {
                const totalItems = order.orderItems.reduce((sum, i) => sum + i.quantity, 0);
                const isExpanded = expandedOrderId === order.id;
                const isPrepaid = order.paymentMode === "online";
                const refundInfo = order.refund_status ? {
                  status: order.refund_status, amount: order.refund_amount,
                  refund_completed_at: order.refund_completed_at, speed: order.refund_speed,
                } : null;

                return (
                  <motion.div
                    // Add this data attribute for the click-outside logic
                    data-order-id={order.id}
                    variants={cardVariant}
                    layout
                    key={order.id}
                    className="group bg-white rounded-[32px] border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)] transition-all duration-500 overflow-hidden"
                  >
                    <div className="p-8">
                      {/* Top Row: ID, Date & Statuses */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400">
                            <Receipt size={18} strokeWidth={1.5} />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-zinc-900">Order #{order.id}</h3>
                            <p className="text-xs text-zinc-400 font-medium">{formatDateTime(order.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Payment Badge */}
                          <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider border flex items-center gap-1.5 ${isPrepaid
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-white text-zinc-500 border-zinc-200'
                            }`}>
                            {isPrepaid ? <CreditCard size={12} strokeWidth={2} /> : <Banknote size={12} strokeWidth={2} />}
                            {isPrepaid ? "PREPAID" : "COD"}
                          </div>

                          {/* Status Badge */}
                          <div className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border ${order.status === 'delivered'
                            ? 'bg-zinc-100 text-zinc-900 border-zinc-200'
                            : 'bg-white text-zinc-600 border-zinc-200'
                            }`}>
                            {order.status}
                          </div>
                        </div>
                      </div>

                      {/* Items Grid */}
                      <div className="space-y-6">
                        {order.orderItems.map((item, i) => (
                          <div key={i} className="flex items-center gap-6 group/item">
                            <div className="h-24 w-24 rounded-2xl bg-zinc-50 flex-shrink-0 flex items-center justify-center p-4 mix-blend-multiply transition-colors duration-300 group-hover/item:bg-zinc-100">
                              <img
                                src={item.img || "/fallback.png"}
                                alt={item.productName}
                                className="h-full w-full object-contain mix-blend-multiply"
                              />
                            </div>
                            <div className="flex-grow">
                              <h4 className="text-sm font-semibold text-zinc-900">{item.productName}</h4>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-100 text-[10px] font-medium text-zinc-500">
                                  Qty: {item.quantity}
                                </span>
                                {item.size && (
                                  <span className="px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-100 text-[10px] font-medium text-zinc-500">
                                    {item.size}ml
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-zinc-900">
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

                      {/* Action Bar */}
                      <div className="mt-8 pt-6 border-t border-zinc-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div className="flex flex-col items-start mr-auto">
                          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-1">Total Amount</span>
                          <span className="text-xl font-medium text-zinc-900">₹{order.totalAmount.toFixed(2)}</span>
                        </div>

                        {/* Buttons - Right Aligned on Mobile */}
                        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">

                          {canDownloadInvoice(order) && (
                            <button
                              onClick={() => handleDownloadInvoice(order.id)}
                              disabled={downloadingInvoiceId === order.id}
                              // 🟢 UPDATED CLASSNAME: Matches "Buy Again" style (pill shape, zinc colors)
                              className="px-6 py-3 rounded-full text-xs font-semibold border border-zinc-200 text-zinc-800 hover:bg-zinc-50 transition-all flex items-center gap-2 disabled:opacity-50"
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
                            cancellingOrderId === order.id ? <MiniLoader /> : (
                              <button
                                onClick={() => setModalOrder(order)}
                                className="px-6 py-3 rounded-full text-xs font-semibold text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Cancel Order
                              </button>
                            )
                          )}

                          {order.status === "delivered" && (
                            <button
                              onClick={() => reorder(order.id)}
                              className="px-6 py-3 rounded-full text-xs font-semibold border border-zinc-200 text-zinc-800 hover:bg-zinc-50 transition-all flex items-center gap-2"
                            >
                              <Repeat size={14} /> Buy Again
                            </button>
                          )}

                          {order.status !== "Order Cancelled" && (
                            <button
                              onClick={() => toggleTrackOrder(order.id)}
                              className="px-8 py-3 rounded-full text-xs font-semibold bg-zinc-900 text-white shadow-lg shadow-zinc-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center gap-2"
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
                          <div className="p-8">
                            {renderStepProgress(order.progressStep, order.status)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}