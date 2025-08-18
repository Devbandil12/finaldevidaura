// src/components/MyOrders.jsx

import React, { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { OrderContext } from "../contexts/OrderContext";
import { UserContext } from "../contexts/UserContext";
import { ProductContext } from "../contexts/productContext";
import Loader from "./Loader";
import MiniLoader from "./MiniLoader";
import "../style/myorder.css";
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaShippingFast,
  FaBox,
  FaClipboardList,
  FaSync,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });
};

const RefundStatusDisplay = ({ refund, onRefresh }) => {
  if (!refund || !refund.status) return null;

  const { status, amount, refund_completed_at, speed } = refund;
  const formattedAmount = `₹${(amount / 100).toFixed(2)}`;
  
  let icon, message, details, cardClass;

  switch (status) {
    case "created":
    case "queued":
    case "pending":
      icon = <FaClock className="icon in-progress-icon" />;
      message = `Refund of ${formattedAmount} Initiated`;
      details = (
        <>
          Your refund is in progress. The amount will be credited to your original payment source.
          <button className="refresh-btn" onClick={onRefresh}>
            <FaSync /> Refresh Status
          </button>
        </>
      );
      cardClass = "refund-card-pending";
      break;
    case "processed":
      icon = <FaCheckCircle className="icon success-icon" />;
      message = `Refund of ${formattedAmount} Processed`;
      details = (
        <>
          The amount has been successfully credited on {formatDateTime(refund_completed_at)}.
          <br />
          <span className="note">
            {speed === "optimum"
              ? "This was a speed-optimized refund and was credited instantly."
              : "This was a normal refund. It may take 5-7 business days for the credit to reflect in your account."}
          </span>
        </>
      );
      cardClass = "refund-card-success";
      break;
    case "failed":
      icon = <FaTimesCircle className="icon failed-icon" />;
      message = `Refund of ${formattedAmount} Failed`;
      details = (
        <>
          There was an issue processing your refund. Please contact our support team for assistance.
          <button className="contact-btn">Contact Support</button>
        </>
      );
      cardClass = "refund-card-failed";
      break;
    default:
      return null;
  }

  return (
    <div className={`refund-card ${cardClass}`}>
      <div className="refund-header">
        {icon}
        <h3>{message}</h3>
      </div>
      <p className="refund-details">{details}</p>
    </div>
  );
};

export default function MyOrders() {
  // ✅ FIXED: useOrders hook instead of useContext(OrderContext)
  const { orders, updateOrderRefund } = useContext(OrderContext);
  const { userdetails } = useContext(UserContext);
  const { products } = useContext(ProductContext);

  const [expandedOrders, setExpandedOrders] = useState({});
  const [cancellationMessages, setCancellationMessages] = useState({});
  const [modalOrder, setModalOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (loadingOrders) {
    return <Loader text="Loading your orders..." />;
  }

  const sortedOrders = (orders || [])
    .filter((o) => o.userId === userdetails.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const cancelOrder = async (order) => {
  try {
    let res;

    // COD orders → just cancel
    if (order.paymentMode === "cod") {
      res = await fetch(`${BACKEND}/api/orders/${order.orderId}/cancel`, {
        method: "PATCH",
      });
    } 
    // Online (Razorpay) orders → refund + cancel
    else if (order.paymentMode === "online" && order.paymentStatus === "paid") {
      res = await fetch(`${BACKEND}/api/orders/${order.orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: order.totalAmount * 0.95 }),
      });
    } else {
      throw new Error("Unsupported order type for cancellation");
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Cancel/Refund failed");

    // Update UI (status, refund info)
    await updateOrderStatus(order.orderId, "Order Cancelled");
    if (data.refund) {
      await updateOrderRefund(order.orderId, data.refund);
    }

    // Show cancellation message
    setCancellationMessages((prev) => ({
      ...prev,
      [order.orderId]: (
        <div className="cancel-message" key={order.orderId}>
          ✅ {order.paymentMode === "online" ? "Refund Initiated" : "Order Cancelled"} <br />
          {data.refund && (
            <>
              ID: {data.refund.id} <br />
              Amount: ₹{(data.refund.amount / 100).toFixed(2)} <br />
              Status: {data.refund.status} <br />
              Initiated:{" "}
              {new Date(data.refund.created_at * 1000).toLocaleString()}
            </>
          )}
        </div>
      ),
    }));
  } catch (err) {
    console.error(err);
    setCancellationMessages((prev) => ({
      ...prev,
      [order.orderId]: (
        <div className="error-message" key={order.orderId}>
          ❌ Cancellation failed; please contact support.
        </div>
      ),
    }));
  }
};


  const handleConfirmCancel = async () => {
  if (!modalOrder) return;
  setCancellingOrderId(modalOrder.orderId);
  setIsModalOpen(false);
  await cancelOrder(modalOrder); 
  setCancellingOrderId(null);
  setModalOrder(null);
};


  const reorder = (orderId) => {
    const order = orders.find((o) => o.orderId === orderId);
    if (!order) return;
    const items = order.items.map((item) => ({
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
    setIsRefreshing(true);
    try {
      const res = await fetch(`${BACKEND}/api/poll-refunds`);
      if (!res.ok) throw new Error("Failed to refresh status");
      await new Promise(r => setTimeout(r, 1000));
      console.log(`Successfully refreshed status for order ${orderId}.`);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderStepProgress = (progressStep, status) => {
    const steps = [
      { label: "Order Placed", icon: <FaBox /> },
      { label: "Processing", icon: <FaClipboardList /> },
      { label: "Shipped", icon: <FaShippingFast /> },
      { label: "Delivered", icon: <FaCheckCircle /> },
    ];

    const final = status === "Delivered" ? steps.length + 1 : progressStep || 1;

    return (
      <div className="progress-steps">
        {steps.map((step, idx) => (
          <div key={idx} className="myorder-step-wrapper">
            <div
              className={`myorder-step ${final > idx + 1 ? "completed" : ""
                } ${final === idx + 1 ? "current" : ""}`}
            >
              <div className="step-icon">{step.icon}</div>
              <div className="step-label">{step.label}</div>
            </div>
            {idx < steps.length - 1 && (
              <div className={`step-line ${final > idx + 1 ? "completed" : ""}`}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="myorder-container">
      {/* Modal */}
      {isModalOpen &&
        modalOrder &&
        createPortal(
          <div className="modal-overlay">
            <div className="modal">
              <h2>Confirm Cancellation</h2>
              <p>
                Are you sure you want to cancel{" "}
                <strong>Order #{modalOrder.orderId}</strong>?
                <br />
                You paid: <strong>₹{modalOrder.totalAmount.toFixed(2)}</strong><br />
                A 5% cancellation fee applies.
                <br />
                You will be refunded:{" "}
                <strong>
                  ₹{(modalOrder.totalAmount * 0.95).toFixed(2)}
                </strong>
              </p>

              <div className="modal-actions">
                <button
                  onClick={handleConfirmCancel}
                  className="btn btn-danger"
                >
                  Yes, Cancel Order
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  No, Go Back
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="myorders">
        {!loadingOrders && sortedOrders.length === 0 && <p>No orders found.</p>}

        {sortedOrders.map((order) => {
          const totalItems = order.items.reduce(
            (sum, i) => sum + i.quantity,
            0
          );
          const r = order.refund;
          const isExpanded = expandedOrders[order.orderId];

          return (
            <div key={order.orderId} className="order-card">
              <div className="order-header">
                <div className="order-header-left">
                  <h3>Order #{order.orderId}</h3>
                  <span className="badge">
                    {totalItems} {totalItems > 1 ? "items" : "item"}
                  </span>
                </div>
                <div className="order-header-right">
                  <p className="order-status-text">
                    Status: <span className="status-highlight">{order.status}</span>
                  </p>
                  <p className="order-status-text">
                    Payment: <span className="status-highlight">{order.paymentMode}</span>
                  </p>
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item, i) => {
                  const fallback = products.find(
                    (p) => p.id === item.productId
                  );
                  const imgSrc =
                    item.img || fallback?.imageurl || "/fallback.png";
                  return (
                    <div key={i} className="order-item">
                      <img src={imgSrc} alt={item.productName} />
                      <div className="item-details-main">
                        <p className="product-name">{item.productName}</p>
                        <div className="item-details-sub">
                          {item.size && (
                            <p>
                              Size: <span>{item.size} ml</span>
                            </p>
                          )}
                          <p>
                            Qty: <span>{item.quantity}</span>
                          </p>
                        </div>
                      </div>
                      <div className="item-price">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  );
                })}
              </div>

              {r && <RefundStatusDisplay refund={r} onRefresh={() => handleRefreshStatus(order.orderId)} />}

              <div className="order-footer">
                <div className="order-summary">
                  <p>
                    <strong>Total Amount:</strong> ₹
                    {order.totalAmount.toFixed(2)}
                  </p>
                  <p>
                    <strong>Ordered On:</strong> {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="buttons">
                  {order.paymentStatus === "paid" && order.status === "order placed" && !r && (
                    cancellingOrderId === order.orderId ? (
                      <MiniLoader text="Cancelling..." />
                    ) : (
                      <button
                        className="cancel-btn"
                        onClick={() => {
                          setModalOrder(order);
                          setIsModalOpen(true);
                        }}
                      >
                        Cancel Order
                      </button>
                    )
                  )}

                  {order.status === "Delivered" && (
                    <button
                      className="reorder-btn"
                      onClick={() => reorder(order.orderId)}
                    >
                      Reorder
                    </button>
                  )}
                  {order.status !== "Order Cancelled" && (
                    <button
                      className="track-btn"
                      onClick={() => toggleTrackOrder(order.orderId)}
                    >
                      {isExpanded ? "Hide Tracking" : "Track Order"}
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  )}
                </div>
              </div>

              {cancellationMessages[order.orderId]}

              {isExpanded && order.status !== "Order Cancelled" && (
                <div className="order-progress">
                  {renderStepProgress(order.progressStep, order.status)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {isRefreshing && <Loader text="Refreshing status..." />}
    </div>
  );
}
