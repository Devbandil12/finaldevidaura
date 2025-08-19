// src/contexts/OrderContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { UserContext } from "./UserContext";
import { toast } from "react-toastify";

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { userdetails } = useContext(UserContext);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // 🔹 Fetch orders (user → only own, admin → all)
  const getorders = async (showLoader = true, isAdmin = false) => {
    if (!isAdmin && !userdetails?.id) return;
    if (showLoader) setLoadingOrders(true);

    try {
      const url = isAdmin
        ? `${BACKEND_URL}/api/orders/`
        : `${BACKEND_URL}/api/orders/${userdetails.id}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
    } finally {
      if (showLoader) setLoadingOrders(false);
    }
  };

  // 🔹 Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update order status");
      await getorders(true, true);
      toast.success(`Order ${orderId} updated to ${newStatus}`);
    } catch (error) {
      console.error("❌ Failed to update order status:", error);
      toast.error("Failed to update order status.");
    }
  };

  // 🔹 Cancel order (COD + prepaid via refund API)
  const cancelOrder = async (orderId, paymentMode, amount) => {
    try {
      if (paymentMode === "razorpay") {
        // Refund prepaid
        const res = await fetch(`${BACKEND_URL}/api/payments/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, amount }),
        });
        if (!res.ok) throw new Error("Refund failed");
      } else {
        // COD → just cancel
        await fetch(`${BACKEND_URL}/api/orders/${orderId}/cancel`, {
          method: "PUT",
        });
      }
      toast.success(`Order ${orderId} canceled successfully.`);
      await getorders(true, true);
    } catch (error) {
      console.error("❌ Failed to cancel order:", error);
      toast.error("Failed to cancel order.");
    }
  };

  // 🔹 Single order details
  const getSingleOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      return await res.json();
    } catch (error) {
      console.error("❌ Error fetching order details:", error);
      toast.error("Failed to load order details.");
      return null;
    }
  };

  useEffect(() => {
    if (userdetails) getorders();
  }, [userdetails]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        loadingOrders,
        getorders,
        setOrders,
        updateOrderStatus,
        cancelOrder,
        getSingleOrderDetails,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
