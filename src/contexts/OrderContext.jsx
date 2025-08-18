// src/contexts/OrderContext.jsx
import React, { createContext, useState, useContext } from "react";
import { UserContext } from "./UserContext";

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const { userdetails } = useContext(UserContext);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // ─── Fetch orders ───────────────────────────
  const getorders = async (showLoader = true, isAdmin = false) => {
    if (!isAdmin && !userdetails?.id) return;
    if (showLoader) setLoadingOrders(true);

    try {
      const url = isAdmin
        ? `${BACKEND_URL}/api/orders`
        : `${BACKEND_URL}/api/users/${userdetails.id}/orders`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch orders");

      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("❌ getorders failed:", err);
    } finally {
      if (showLoader) setLoadingOrders(false);
    }
  };

  // ─── Update order refund ─────────────────────
  const updateOrderRefund = async (orderId, amount) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/refund`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) throw new Error("Failed to refund order");
      const result = await res.json();

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                paymentStatus: "refunded",
                refund: result.refund,
              }
            : o
        )
      );

      return result;
    } catch (err) {
      console.error("❌ updateOrderRefund failed:", err);
      throw err;
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        getorders,
        loadingOrders,
        updateOrderRefund,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
