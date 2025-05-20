// src/pages/MyOrders.js
import React, { useContext, useState } from "react";
import ProductImage from "../assets/images/mockup-empty-perfume-bottle-perfume-brand-design_826454-355-removebg-preview.png";
import "../style/myorder.css";
import { UserContext } from "../contexts/UserContext";
import { OrderContext } from "../contexts/OrderContext";

/**
 * Formats a date string into a readable format with AM/PM.
 */
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });
};

const MyOrders = () => {
  const { orders } = useContext(UserContext);
  const { updateOrderStatus } = useContext(OrderContext);

  const [messages, setMessages] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});

  // Sort newest first
  const sortedOrders = (orders || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const cancelOrder = async (orderId) => {
    const order = orders.find((o) => o.orderId === orderId);
    if (!order) return;

    // Prevent cancellation if already processed
    if (["Processing", "Shipped", "Delivered"].includes(order.status)) {
      setMessages((prev) => ({
        ...prev,
        [orderId]: `Cannot cancel: order already ${order.status.toLowerCase()}.`,
      }));
      return;
    }

    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}?`))
      return;

    await updateOrderStatus(orderId, "Order Cancelled");
    setMessages((prev) => ({ ...prev, [orderId]: "Order Cancelled" }));
  };

  const reorder = (orderId) => {
    const order = orders.find((o) => o.orderId === orderId);
    if (!order) return;

    const formattedItems = order.items.map((item) => ({
      product: {
        id: item.productId || item.product?.id,
        name: item.productName || item.product?.name,
        oprice: item.price,
        discount: item.discount || 0,
        quantity: item.quantity || 1,
        imageurl: item.img || item.product?.imageurl || ProductImage,
        size: item.product?.size || "100",
      },
      quantity: item.quantity || 1,
    }));

    localStorage.setItem("selectedItems", JSON.stringify(formattedItems));
    window.location.href = "/checkout";
  };

  const trackOrder = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  /**
   * Renders a 4‑step progress bar based on order.status.
   * Steps: Order Placed → Processing → Shipped → Delivered
   */
  const renderStepProgress = (status) => {
    const steps = ["Order Placed", "Processing", "Shipped", "Delivered"];
    const statusToStep = {
      "Order Placed": 1,
      Processing: 2,
      Shipped: 3,
      Delivered: 4,
    };
    const currentStep = statusToStep[status] || 1;

    return (
      <div className="progress-steps">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={idx} className="step-wrapper">
              <div
                className={`myorder-step ${
                  isCompleted ? "completed" : ""
                } ${isCurrent ? "current" : ""}`}
              >
                <div className="step-number">{stepNum}</div>
                <div className="step-label">{label}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="myorder-container">
      <h1 className="my-order-title">My Orders</h1>
      <div className="myorders">
        <div className="orders-section" id="orders-list">
          {sortedOrders.length === 0 && <p>No orders found.</p>}

          {sortedOrders.map((order, index) => (
            <div key={order.orderId + index} className="order-card">
              <div className="flex justify-between p-5 font-semibold">
                <h3>Order #{order.orderId}</h3>
                {/* Hide payment status if cancelled */}
                {order.status !== "Order Cancelled" && (
                  <label
                    className={`jhaatu_item text-black border-2 rounded-xl p-2 ${
                      order.paymentStatus === "paid"
                        ? "bg-green-500"
                        : "bg-yellow-400"
                    }`}
                  >
                    {order.paymentStatus}
                  </label>
                )}
              </div>

              <p className="order-details">
                <strong>Date:</strong> {formatDateTime(order.createdAt)}
              </p>
              <p className="order-details">
                <strong>Total Amount:</strong> ₹{order.totalAmount}
              </p>

              <div className="order-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <img
                      src={item.img || ProductImage}
                      alt={item.productName}
                    />
                    <span>
                      {item.productName} - ₹{item.price}
                    </span>
                  </div>
                ))}
              </div>

              <div className="buttons">
                {order.status === "Order Cancelled" ? (
                  <button className="cancelled-btn" disabled>
                    Order Cancelled
                  </button>
                ) : (
                  <>
                    {order.status !== "Delivered" && (
                      <button
                        className="cancel-btn"
                        onClick={() => cancelOrder(order.orderId)}
                      >
                        Cancel Order
                      </button>
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
                        onClick={() => trackOrder(order.orderId)}
                      >
                        {expandedOrders[order.orderId]
                          ? "Hide Track Order"
                          : "Track Order"}
                      </button>
                    )}
                  </>
                )}
              </div>

              {messages[order.orderId] && (
                <div className="cancel-message">
                  {messages[order.orderId]}
                </div>
              )}

              {expandedOrders[order.orderId] &&
                order.status !== "Order Cancelled" && (
                  <div className="order-progress">
                    {renderStepProgress(order.status)}
                  </div>
                )}

              <div className="tracking-status flex justify-between items-center">
                <span>
                  <strong>Status:</strong> {order.status}
                </span>
                <span>
                  <strong>Payment Mode:</strong> {order.paymentMode}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
