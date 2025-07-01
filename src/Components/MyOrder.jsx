// MyOrders.jsx
import React, { useContext, useState } from "react";
import "../style/myorder.css";
import { OrderContext } from "../contexts/OrderContext";
import { UserContext } from "../contexts/UserContext";
import { ProductContext } from "../contexts/productContext";

/** Formats a date string into a readable format with AM/PM. */
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });
};

const MyOrders = () => {
  const { orders, updateOrderStatus } = useContext(OrderContext);
  const { userdetails } = useContext(UserContext);
  const { products } = useContext(ProductContext);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [cancellationMessages, setCancellationMessages] = useState({});

  // Only current user's orders, newest first
  const sortedOrders = (orders || [])
    .filter((o) => o.userId === userdetails.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const cancelOrder = async (order) => {
    if (!window.confirm(`Cancel Order #${order.orderId}?`)) return;

    try {
      const res = await fetch(import.meta.env.VITE_BACKEND_URL + "/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refund failed");

      // Update local context/status
      await updateOrderStatus(order.orderId, "Order Cancelled");

      // Show rich cancellation message
      setCancellationMessages((prev) => ({
        ...prev,
        [order.orderId]: (
          <div className="cancel-message" key={`msg-${order.orderId}`}>
            <p>✅ Refund Initiated (ID: {data.refund.id})</p>
            <p>
              Amount: ₹{(data.refund.amount / 100).toFixed(2)}<br />
              Status: {data.refund.status}<br />
              Initiated: {formatDateTime(new Date(data.refund.created_at * 1000).toISOString())}<br />
              Expected in 2–5 business days.
            </p>
          </div>
        ),
      }));
    } catch (err) {
      console.error(err);
      setCancellationMessages((prev) => ({
        ...prev,
        [order.orderId]: (
          <div className="error-message" key={`err-${order.orderId}`}>
            ❌ Cancellation/refund failed; please contact support.
          </div>
        ),
      }));
    }
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

  const trackOrder = (orderId) =>
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));

  const renderStepProgress = (progressStep, status) => {
    const steps = ["Order Placed", "Processing", "Shipped", "Delivered"];
    const final =
      status === "Delivered" ? steps.length + 1 : progressStep || 1;
    return (
      <div className="progress-steps">
        {steps.map((label, idx) => (
          <div key={idx} className="myorder-step-wrapper">
            <div
              className={`myorder-step ${
                final > idx + 1 ? "completed" : ""
              } ${final === idx + 1 ? "current" : ""}`}
            >
              <div className="step-number">{idx + 1}</div>
              <div className="step-label">{label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="myorder-container">
      <h1 className="my-order-title">My Orders</h1>
      <div className="myorders">
        {sortedOrders.length === 0 && <p>No orders found.</p>}

        {sortedOrders.map((order) => {
          const totalItems = order.items.reduce(
            (sum, i) => sum + i.quantity,
            0
          );

          return (
            <div key={order.orderId} className="order-card">
              <div className="order-header">
                <h3>Order #{order.orderId}</h3>
                <span className="badge">
                  {totalItems} {totalItems > 1 ? "items" : "item"}
                </span>
                <span
                  className={`payment-status ${order.paymentStatus}`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              <div className="order-summary">
                <p>
                  <strong>Date:</strong>{" "}
                  {formatDateTime(order.createdAt)}
                </p>
                <p>
                  <strong>Total Amount:</strong> ₹{order.totalAmount}
                </p>
              </div>

              <div className="order-items">
                {order.items.map((item, i) => {
                  const fallback = products.find(
                    (p) => p.id === item.productId
                  );
                  const imgSrc =
                    item.img ||
                    fallback?.imageurl ||
                    "/fallback.png";
                  return (
                    <div key={i} className="order-item">
                      <img src={imgSrc} alt={item.productName} />
                      <p className="product-name">
                        {item.productName}
                      </p>
                      <div className="item-price">
                        ₹{item.price * item.quantity}
                      </div>
                      <div className="item-details">
                        <p>
                          Qty: <span>{item.quantity}</span>
                        </p>
                        {item.size && (
                          <p>
                            Size: <span>{item.size} ml</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="buttons">
                {/* Cancel if paid and not already cancelled/delivered */}
                {order.paymentStatus === "paid" &&
                  order.status !== "Order Cancelled" && (
                    <button
                      className="cancel-btn"
                      onClick={() => cancelOrder(order)}
                    >
                      Cancel Order
                    </button>
                  )}

                {/* Reorder & Track */}
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
                    onClick={() => trackOrder(order.orderId)}
                  >
                    {expandedOrders[order.orderId]
                      ? "Hide Tracking"
                      : "Track Order"}
                  </button>
                )}
              </div>

              {/* Inline cancellation/refund message */}
              {cancellationMessages[order.orderId]}

              {/* Refund tracker */}
              {order.refund_id && (
                <div className="refund-tracker">
                  <p>
                    <strong>Refund ID:</strong> {order.refund_id}
                  </p>
                  <p>
                    <strong>Initiated:</strong>{" "}
                    {formatDateTime(order.refund_initiated_at)}
                  </p>
                  <p>
                    <strong>Speed:</strong> {order.refund_speed}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {{
                      created: "Received by Razorpay",
                      speed_changed: "Speed Updated",
                      processed: "Refund Completed",
                      failed: "Refund Failed—contact support",
                    }[order.refund_status]}
                  </p>
                  {order.refund_status === "processed" && (
                    <p>
                      <strong>Completed:</strong>{" "}
                      {formatDateTime(order.refund_completed_at)}
                    </p>
                  )}
                  <p>
                    <strong>Amount:</strong> ₹
                    {order.refund_amount
                      ? (order.refund_amount / 100).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              )}

              {/* Order progress */}
              {expandedOrders[order.orderId] &&
                order.status !== "Order Cancelled" && (
                  <div className="order-progress">
                    {renderStepProgress(
                      order.progressStep,
                      order.status
                    )}
                  </div>
                )}

              {/* Bottom status bar */}
              <div className="tracking-status">
                <span>
                  <strong>Status:</strong> {order.status}
                </span>
                {order.refund_status === "processed" ? (
                  <span>
                    <strong>Refunded:</strong> ₹
                    {order.refund_amount
                      ? (order.refund_amount / 100).toFixed(2)
                      : "0.00"}
                  </span>
                ) : order.refund_status === "created" ||
                  order.refund_status === "speed_changed" ? (
                  <span>
                    <strong>Refund In Progress:</strong> ₹
                    {order.refund_amount
                      ? (order.refund_amount / 100).toFixed(2)
                      : "0.00"}
                  </span>
                ) : (
                  <span>
                    <strong>Payment Mode:</strong> {order.paymentMode}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyOrders;
