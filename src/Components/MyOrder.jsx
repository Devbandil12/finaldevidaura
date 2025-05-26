// src/pages/MyOrders.js
import React, { useContext, useState } from "react";
import ProductImage from "../assets/images/mockup-empty-perfume-bottle-perfume-brand-design_826454-355-removebg-preview.png";
import "../style/myorder.css";
import { OrderContext } from "../contexts/OrderContext"; // ← use this
import { UserContext } from "../contexts/UserContext";
import axios from "axios";

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
  // Now reading orders (and updater) from OrderContext
  const { orders, updateOrderStatus } = useContext(OrderContext);
  const { userdetails } = useContext(UserContext); // still used for user info if needed

  const [expandedOrders, setExpandedOrders] = useState({});
  const [cancellationMessages, setCancellationMessages] = useState({});

  // Sort newest first
  const sortedOrders = (orders || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const cancelOrder = async (order) => {
    const { orderId, paymentMode, paymentStatus, totalAmount, status } = order;

    if (status === "Delivered" || status === "Order Cancelled") {
      alert(`Cannot cancel: order is already ${status.toLowerCase()}.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}?`))
      return;

    // COD
    if (paymentMode === "Cash on Delivery") {
      await updateOrderStatus(orderId, "Order Cancelled");
      return;
    }

    // Razorpay
    if (paymentMode === "Razorpay" && paymentStatus === "paid") {
      const feePercent = 5;
      const fee = Math.floor((totalAmount * feePercent) / 100);
      const refundAmt = totalAmount - fee;
      if (
        !window.confirm(
          `A cancellation fee of ₹${fee} (${feePercent}%) will be deducted.\n` +
            `You will be refunded ₹${refundAmt}.\n\nProceed?`
        )
      )
        return;

      await updateOrderStatus(orderId, "Cancellation in Progress");
      setCancellationMessages((prev) => ({
        ...prev,
        [orderId]: "Cancellation in progress…",
      }));

      try {
        const res = await axios.post(
          import.meta.env.VITE_BACKEND_URL + "/refund",
          {
            orderId: orderId,
          }
        );
        console.log(res.data);
        await updateOrderStatus(orderId, "Order Cancelled");
        setCancellationMessages((prev) => ({
          ...prev,
          [orderId]: `Order Cancelled & ₹${refundAmt} refunded`,
        }));
      } catch (err) {
        console.error(err);
        alert("Refund failed; please contact support.");
      }
      return;
    }

    // Fallback
    await updateOrderStatus(orderId, "Order Cancelled");
    setCancellationMessages((prev) => ({
      ...prev,
      [orderId]: "Order Cancelled",
    }));
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
        imageurl: item.img || ProductImage,
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
    const final = status === "Delivered" ? steps.length + 1 : progressStep ?? 1;
    return (
      <div className="progress-steps">
        {steps.map((step, idx) => (
          <div key={idx} className="step-wrapper">
            <div
              className={`myorder-step ${final > idx + 1 ? "completed" : ""} ${
                final === idx + 1 ? "current" : ""
              }`}
            >
              <div className="step-number">{idx + 1}</div>
              <div className="step-label">{step}</div>
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
        <div className="orders-section" id="orders-list">
          {sortedOrders.length === 0 && <p>No orders found.</p>}

          {sortedOrders.map((order, idx) => (
            <div key={order.orderId + idx} className="order-card">
              <div className="flex justify-between p-5 font-semibold">
                <h3>Order #{order.orderId}</h3>
                {order.status !== "Order Cancelled" &&
                  order.status !== "Cancellation in Progress" && (
                    <label
                      className={`jhaatu_item text-black border-2 rounded ${
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
                {order.items.map((item, i) => (
                  <div key={i} className="order-item">
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
                {order.status !== "Delivered" &&
                  order.status !== "Order Cancelled" && (
                    <button
                      className="cancel-btn"
                      onClick={() => cancelOrder(order)}
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
              </div>

              {cancellationMessages[order.orderId] && (
                <div className="cancel-message">
                  {cancellationMessages[order.orderId]}
                </div>
              )}

              {expandedOrders[order.orderId] &&
                order.status !== "Order Cancelled" && (
                  <div className="order-progress">
                    {renderStepProgress(order.progressStep, order.status)}
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
