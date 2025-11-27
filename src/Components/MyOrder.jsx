import React, { useContext, useState } from "react";
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
} from "lucide-react";

// Helper to format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Refund Status Component
const RefundStatusDisplay = ({ refund, onRefresh, isRefreshing }) => {
  if (!refund || !refund.status) return null;

  const { status, amount, refund_completed_at, speed } = refund;
  const formattedAmount = `₹${(amount / 100).toFixed(2)}`;

  const currentStatus = ['created', 'queued', 'pending', 'in_progress'].includes(status)
    ? 'pending'
    : status;

  const statusConfig = {
    processed: {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: `Refund Processed: ${formattedAmount}`,
      details: `The amount was credited on ${formatDateTime(refund_completed_at)}. ${speed === "optimum"
        ? "This was an instant refund."
        : "It may take 5-7 days to reflect in your account."
        }`,
      classes: "bg-green-50 border-green-200 text-green-800",
    },
    pending: {
      icon: <Clock className="h-5 w-5 text-blue-500" />,
      title: `Refund In Progress: ${formattedAmount}`,
      details: "Your refund is being processed and will be credited to your original payment source shortly.",
      classes: "bg-blue-50 border-blue-200 text-blue-800",
    },
    failed: {
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      title: `Refund Failed: ${formattedAmount}`,
      details: "There was an issue processing your refund. Please contact our support team for assistance.",
      classes: "bg-red-50 border-red-200 text-red-800",
    },
  };

  const config = statusConfig[currentStatus];

  if (!config) return null;

  return (
    <div className={`rounded-lg p-4 my-4 border ${config.classes}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{config.title}</h3>
          <p className="text-xs mt-1">{config.details}</p>
          {currentStatus === 'pending' && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// "My Orders" Component
export default function MyOrders() {
  const { orders, setOrders, cancelOrder, loadingOrders } = useContext(OrderContext);
  const { userdetails } = useContext(UserContext);

  const [expandedOrders, setExpandedOrders] = useState({});
  const [modalOrder, setModalOrder] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [refreshingStatusId, setRefreshingStatusId] = useState(null);

  const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  if (loadingOrders) {
    return <Loader text="Loading your orders..." />;
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

  const toggleTrackOrder = (orderId) =>
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));

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

  const renderStepProgress = (progressStep, status) => {
    const steps = [
      { label: "Placed", icon: <Package size={20} /> },
      { label: "Processing", icon: <Cog size={20} /> },
      { label: "Shipped", icon: <Truck size={20} /> },
      { label: "Delivered", icon: <CheckCircle size={20} /> },
    ];

    const isCancelled = status.toLowerCase().includes('cancelled');
    const currentStepIndex = isCancelled ? -1 : (status === "delivered" ? 3 : (progressStep || 1) - 1);

    return (
      <div className="w-full pt-4">
        <div className="flex">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            const stepColor = isCompleted ? 'text-black' : isCurrent ? 'text-indigo-600' : 'text-gray-400';
            const iconBgColor = isCompleted ? 'bg-black' : isCurrent ? 'bg-indigo-600' : 'bg-gray-300';
            const lineColor = isCompleted ? 'bg-black' : 'bg-gray-300';

            return (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center text-center w-1/4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${iconBgColor} transition-colors`}>
                    {step.icon}
                  </div>
                  <p className={`text-xs font-semibold mt-2 ${stepColor}`}>{step.label}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mt-5 bg-gray-300">
                    <div className={`h-full ${lineColor} transition-all duration-500`} style={{ width: idx < currentStepIndex ? '100%' : '0%' }}></div>
                  </div>
                )}
              </React.Fragment>
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
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalOrder(null)}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center" onClick={e => e.stopPropagation()}>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold mt-4 text-zinc-900">Confirm Cancellation</h2>
          <div className="text-sm text-gray-600 mt-2 space-y-2">
            <p>Are you sure you want to cancel <strong>Order #{modalOrder.id}</strong>?</p>
            {isOnlinePayment ? (
              <p>
                A 5% cancellation fee applies. You will be refunded{' '}
                <strong>₹{refundAmount.toFixed(2)}</strong>.
              </p>
            ) : (
              <p>This was a Cash on Delivery order. No refund is required.</p>
            )}
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <button onClick={() => setModalOrder(null)} className="px-6 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-100">
              Go Back
            </button>
            <button onClick={handleConfirmCancel} className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
              Yes, Cancel
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <title>My Orders | Devid Aura</title>
      <meta name="description" content="Track your order history and view the status of your purchases. Manage your past and present orders with Devid Aura." />
      <main className="max-w-6xl mx-auto my-4 sm:my-8 px-4 w-full flex flex-col gap-8">
        {renderCancellationModal()}

        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 mt-[50px]">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Package />
            My Orders
          </h1>
        </div>

        {/* Orders List */}
        <AnimatePresence>
          {sortedOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center border-2 border-dashed border-gray-300 rounded-xl p-12 bg-white"
            >
              <Package className="mx-auto h-12 w-12 text-gray-400" strokeWidth={1} />
              <h2 className="mt-4 text-xl font-semibold text-zinc-800">No Orders Yet</h2>
              <p className="mt-2 text-sm text-gray-500">Your past orders will appear here.</p>
            </motion.div>
          ) : (
            <motion.div layout className="space-y-6">
              <AnimatePresence>
                {sortedOrders.map((order) => {
                  const totalItems = order.orderItems.reduce((sum, i) => sum + i.quantity, 0);
                  const isExpanded = !!expandedOrders[order.id];
                  const refundInfo = order.refund_status ? {
                    status: order.refund_status, amount: order.refund_amount,
                    refund_completed_at: order.refund_completed_at, speed: order.refund_speed,
                  } : null;

                  return (
                    <motion.div
                      layout
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-white border rounded-xl overflow-hidden border border-gray-100 shadow-gray-200/50 shadow-lg transition-shadow transition-shadow hover:shadow-lg"
                    >
                      {/* Order Header */}
                      <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h3 className="font-bold text-lg text-zinc-900">Order #{order.id}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Placed on {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center flex-wrap gap-2 text-xs font-medium">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-800">
                            {totalItems} {totalItems > 1 ? "items" : "item"}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 capitalize">
                            {order.status}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                            {order.paymentMode}
                          </span>
                        </div>
                      </div>

                      {/* Order Body */}
                      <div className="p-4">
                        {/* Items List */}
                        <div className="divide-y divide-gray-200">
                          {order.orderItems.map((item, i) => (
                            <div key={i} className="flex items-start gap-4 py-3">
                              <img
                                src={item.img || "/fallback.png"}
                                alt={item.productName}
                                className="h-16 w-16 object-contain bg-gray-100 rounded-md p-1"
                              />
                              <div className="flex-grow">
                                <p className="font-semibold text-sm text-zinc-800">{item.productName}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {item.size && `Size: ${item.size}ml • `}Qty: {item.quantity}
                                </p>
                              </div>
                              <p className="font-semibold text-sm text-zinc-900">₹{item.price * item.quantity}</p>
                            </div>
                          ))}
                        </div>

                        {refundInfo && (
                          <RefundStatusDisplay refund={refundInfo} onRefresh={() => handleRefreshStatus(order.id)} isRefreshing={refreshingStatusId === order.id} />
                        )}

                        {/* Order Footer */}
                        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                          <p className="font-bold text-lg">
                            Total: <span className="text-zinc-900">₹{order.totalAmount.toFixed(2)}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            {order.status === "Order Placed" && !refundInfo && (
                              cancellingOrderId === order.id ? (
                                <MiniLoader />
                              ) : (
                                <button onClick={() => setModalOrder(order)} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                                  Cancel Order
                                </button>
                              )
                            )}
                            {order.status === "delivered" && (
                              <button onClick={() => reorder(order.id)} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                                <Repeat size={14} /> Reorder
                              </button>
                            )}
                            {order.status !== "Order Cancelled" && (
                              <button onClick={() => toggleTrackOrder(order.id)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                                {isExpanded ? "Hide Tracking" : "Track Order"}
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Tracking View with Animation */}
                      <AnimatePresence>
                        {isExpanded && order.status !== "Order Cancelled" && (
                          <motion.section
                            initial="collapsed"
                            animate="open"
                            exit="collapsed"
                            variants={{
                              open: { opacity: 1, height: "auto" },
                              collapsed: { opacity: 0, height: 0 },
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="bg-gray-50/70 p-4 border-t border-gray-200">
                              {renderStepProgress(order.progressStep, order.status)}
                            </div>
                          </motion.section>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}