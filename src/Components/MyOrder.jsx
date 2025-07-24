// src/components/MyOrders.jsx

import React, { useContext, useState } from "react";
import { createPortal } from "react-dom";
import "../style/myorder.css";
import { OrderContext } from "../contexts/OrderContext";
import { UserContext } from "../contexts/UserContext";
import { ProductContext } from "../contexts/productContext";
import Loader from "./Loader";
import MiniLoader from "./MiniLoader";
const refundStatusMap = {
  created: "Initiated",
  queued: "Queued",
  pending: "In Process",
  processed: "Processing Refund",   // ← not completed!
  speed_changed: "Speed Changed",
  failed: "Failed — Contact Support",
};

const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');


const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });
};

export default function MyOrders() {
  const { orders, updateOrderStatus, updateOrderRefund, loadingOrders } =
    useContext(OrderContext);
  const { userdetails } = useContext(UserContext);
  const { products } = useContext(ProductContext);

  const [expandedOrders, setExpandedOrders] = useState({});
  const [cancellationMessages, setCancellationMessages] = useState({});
  const [modalOrder, setModalOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

const [refundDropdowns, setRefundDropdowns] = useState({});

const [showRefundInfo, setShowRefundInfo] = useState({});


const [cancellingOrderId, setCancellingOrderId] = useState(null);


if (loadingOrders) {
  return <Loader text="Loading your orders..." />;
}

  // filter & sort
  const sortedOrders = (orders || [])
    .filter((o) => o.userId === userdetails.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // 1) refund + cancel API → context helpers
  const cancelOrder = async (order) => {
    try {
      const res = await fetch(`${BACKEND}/api/payments/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          amount: order.totalAmount,
          speed: "optimum",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refund failed");

      // write refund fields & re-fetch
      await updateOrderRefund(order.orderId, data.refund);
      // mark order cancelled
      await updateOrderStatus(order.orderId, "Order Cancelled");

// Show refund info for this order
setShowRefundInfo((prev) => ({ ...prev, [order.orderId]: true }));

// Hide after 6 seconds
setTimeout(() => {
  setShowRefundInfo((prev) => {
    const updated = { ...prev };
    delete updated[order.orderId];
    return updated;
  });
}, 6000);


      // inline message
      setCancellationMessages((prev) => ({
        ...prev,
        [order.orderId]: (
          <div className="cancel-message" key={order.orderId}>
            ✅ Refund Initiated (ID: {data.refund.id})<br />
            Amount: ₹{(data.refund.amount / 100).toFixed(2)}<br />
            Status: {data.refund.status}<br />
            Initiated:{" "}
            {formatDateTime(
              new Date(data.refund.created_at * 1000).toISOString()
            )}
          </div>
        ),
      }));
    } catch (err) {
      console.error(err);
      setCancellationMessages((prev) => ({
        ...prev,
        [modalOrder.orderId]: (
          <div className="error-message" key={modalOrder.orderId}>
            ❌ Cancellation/refund failed; please contact support.
          </div>
        ),
      }));
    }
  };

  const handleConfirmCancel = async () => {
  if (!modalOrder) return;
  setCancellingOrderId(modalOrder.orderId); // Start loader
  setIsModalOpen(false);
  await cancelOrder(modalOrder);
  setCancellingOrderId(null); // Stop loader
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
              className={`myorder-step ${final > idx + 1 ? "completed" : ""
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
        {sortedOrders.length === 0 && <p>No orders found.</p>}

        {sortedOrders.map((order) => {
          const totalItems = order.items.reduce(
            (sum, i) => sum + i.quantity,
            0
          );
          const r = order.refund;

          return (
            <div key={order.orderId} className="order-card">
              <div className="order-header">
                <h3>Order #{order.orderId}</h3>
               <span className="badge">
  {totalItems} {totalItems > 1 ? "items" : "item"}
</span>
<span className={`payment-status ${order.paymentStatus}`}>
  {r?.status === "failed"
    ? "REFUND FAILED"
    : r?.status === "processed"
      ? "REFUNDED"
      : r?.status === "pending" || r?.status === "created" || r?.status === "queued"
        ? "REFUNDING"
        : order.paymentStatus.toUpperCase()}
</span>


              </div>

              <div className="order-summary">
                <p>
                  <strong>Date:</strong> {formatDateTime(order.createdAt)}
                </p>
                <p>
                  <strong>Total Amount:</strong> ₹
                  {order.totalAmount.toFixed(2)}
                </p>
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
                      <p className="product-name">{item.productName}</p>
                      <div className="item-price">
                        ₹{item.price * item.quantity}
                      </div>
                      <div className="item-details">
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
                  );
                })}
              </div>

              <div className="buttons">
                {order.paymentStatus === "paid" && order.status === "order placed" && (
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
                    onClick={() => trackOrder(order.orderId)}
                  >
                    {expandedOrders[order.orderId]
                      ? "Hide Tracking"
                      : "Track Order"}
                  </button>
                )}
              </div>

              {cancellationMessages[order.orderId]}



              {expandedOrders[order.orderId] &&
                order.status !== "Order Cancelled" && (
                  <div className="order-progress">
                    {renderStepProgress(order.progressStep, order.status)}
                  </div>
                )}

              <div className="tracking-status">
                <span>
  <strong>Status:</strong> {order.status}
</span>


{(() => {
  if (r?.status === "processed" && r.processed_at && showRefundInfo[order.orderId]) {
    return (
      <>
        <span>
          <strong>Refund Completed:</strong> ₹{(r.amount / 100).toFixed(2)}
        </span>
        <br />
        <span className="refund-note">
          {r.speed === "optimum"
            ? "Amount credited instantly to your source account."
            : "Amount will be credited within 5–7 business days."}
        </span>
      </>
    );
  } else if (r?.status === "processed") {
    return (
      <span>
        <strong>Refund Processing:</strong> Amount debited, awaiting credit.
      </span>
    );
  } else if (["pending", "created", "queued"].includes(r?.status)) {
    return (
      <span>
        <strong>Refund In Progress:</strong> ₹{(r.amount / 100).toFixed(2)}
      </span>
    );
  } else if (r?.status === "failed") {
    return (
      <span style={{ color: "red" }}>
        <strong>Refund Failed:</strong> Please contact support.
      </span>
    );
  } else {
    return (
      <span>
        <strong>Payment Mode:</strong> {order.paymentMode}
      </span>
    );
  }


})()}

{r?.status === "processed" && r.speed === "normal" && (
  <div className="refund-dropdown-container">
    <div
      className="refund-dropdown-toggle"
      onClick={() =>
        setRefundDropdowns((prev) => ({
          ...prev,
          [order.orderId]: !prev[order.orderId],
        }))
      }
    >
      <span className="dropdown-label">
        Message Notification {refundDropdowns[order.orderId] ? "▴" : "▾"}
      </span>
    </div>

    {refundDropdowns[order.orderId] && (
      <div className="refund-dropdown-content">
        <div className="refund-note-permanent">
          <strong>Refund Speed:</strong> Will be credited within 5–7 business days.
        </div>
        <div className="refund-note-permanent">
          <strong>Note:</strong> Refund speed changed. Please allow extra time.
        </div>
      </div>
    )}
  </div>
)}




              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
