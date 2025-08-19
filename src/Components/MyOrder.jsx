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
  const { orders, cancelOrder, loadingOrders } = useContext(OrderContext);
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
    .filter((o) => userdetails?.id && o.userId === userdetails.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleConfirmCancel = async () => {
    if (!modalOrder) return;
    setCancellingOrderId(modalOrder.id);
    setIsModalOpen(false);

    await cancelOrder(modalOrder.id, modalOrder.paymentMode, modalOrder.totalAmount);

    setCancellingOrderId(null);
    setModalOrder(null);
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
    setIsRefreshing(true);
    try {
      const res = await fetch(`${BACKEND}/api/poll-refunds`);
      if (!res.ok) throw new Error("Failed to refresh status");
      await new Promise((r) => setTimeout(r, 1000));
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

    const final = status === "delivered" ? steps.length + 1 : progressStep || 1;

    return (
      <div className="progress-steps">
        {steps.map((step, idx) => (
          <div key={idx} className="myorder-step-wrapper">
            <div
              className={`myorder-step ${
                final > idx + 1 ? "completed" : ""
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
      {isModalOpen &&
        modalOrder &&
        createPortal(
          <div className="modal-overlay">
            <div className="modal">
              <h2>Confirm Cancellation</h2>
              <p>
                Are you sure you want to cancel{" "}
                <strong>Order #{modalOrder.id}</strong>?
                <br />
                You paid: <strong>₹{modalOrder.totalAmount.toFixed(2)}</strong>
                <br />
                A 5% cancellation fee applies.
                <br />
                You will be refunded:{" "}
                <strong>₹{(modalOrder.totalAmount * 0.95).toFixed(2)}</strong>
              </p>

              <div className="modal-actions">
                <button onClick={handleConfirmCancel} className="btn btn-danger">
                  Yes, Cancel Order
                </button>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
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
          const totalItems = order.ordeItems.reduce((sum, i) => sum + i.quantity, 0);

          // ✅ Map refund fields from DB
          const r = order.refund_status
            ? {
                status: order.refund_status,
                amount: order.refund_amount,
                refund_completed_at: order.refund_completed_at,
                speed: order.refund_speed,
              }
            : null;

          const isExpanded = expandedOrders[order.id];

          return (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-header-left">
                  <h3>Order #{order.id}</h3>
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
                {order.orderItems.map((item, i) => {
                  const fallback = products.find((p) => p.id === item.productId);
                  const imgSrc = item.img || fallback?.imageurl || "/fallback.png";
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
                      <div className="item-price">₹{item.price * item.quantity}</div>
                    </div>
                  );
                })}
              </div>

              {r && (
                <RefundStatusDisplay refund={r} onRefresh={() => handleRefreshStatus(order.id)} />
              )}

              <div className="order-footer">
                <div className="order-summary">
                  <p>
                    <strong>Total Amount:</strong> ₹{order.totalAmount.toFixed(2)}
                  </p>
                  <p>
                    <strong>Ordered On:</strong> {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="buttons">
                  {order.paymentStatus === "paid" &&
                    order.status === "order placed" &&
                    !r &&
                    (cancellingOrderId === order.id ? (
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
                    ))}

                  {order.status === "delivered" && (
                    <button className="reorder-btn" onClick={() => reorder(order.id)}>
                      Reorder
                    </button>
                  )}
                  {order.status !== "cancelled" && (
                    <button className="track-btn" onClick={() => toggleTrackOrder(order.id)}>
                      {isExpanded ? "Hide Tracking" : "Track Order"}
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  )}
                </div>
              </div>

              {cancellationMessages[order.id]}

              {isExpanded && order.status !== "cancelled" && (
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
