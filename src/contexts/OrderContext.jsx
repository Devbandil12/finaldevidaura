// src/contexts/OrderContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "./UserContext";

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { userdetails, isUserLoading } = useContext(UserContext);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // Fetch orders
  const getorders = useCallback(async (showLoader = true, isAdmin = false) => {
    if (!isAdmin && !userdetails?.id) return;
    if (showLoader) setLoadingOrders(true);

    try {
      let res;
      if (isAdmin) {
        res = await fetch(`${BACKEND_URL}/api/orders/`);
      } else {
        res = await fetch(`${BACKEND_URL}/api/orders/get-my-orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userdetails.id }),
        });
      }

      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
    } finally {
      if (showLoader) setLoadingOrders(false);
    }
  }, [BACKEND_URL, userdetails?.id]);

  // 🟢 Update order status (With actorId)
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            status: newStatus,
            actorId: userdetails?.id // 🟢 Added actorId
        }),
      });
      if (!res.ok) throw new Error("Failed to update order status");
      await getorders(true, true);
      window.toast.success(`Order ${orderId} updated to ${newStatus}`);
    } catch (error) {
      console.error("❌ Failed to update order status:", error);
      window.toast.error("Failed to update order status.");
    }
  }, [BACKEND_URL, getorders, userdetails?.id]);

  // 🟢 Cancel order (With actorId)
  const cancelOrder = useCallback(
    async (orderId, paymentMode, amount, isAdmin = false) => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/payments/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            orderId, 
            amount,
            actorId: userdetails?.id // 🟢 Added actorId
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Cancellation failed");
        }

        const data = await res.json();
        window.toast.success(data.message || `Order ${orderId} canceled successfully.`);
        
        await getorders(true, isAdmin);

      } catch (error) {
        console.error("❌ Failed to cancel order:", error);
        window.toast.error(error.message || "Failed to cancel order.");
      }
    },
    [BACKEND_URL, getorders, userdetails?.id]
  );

  const getSingleOrderDetails = useCallback(async (orderId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      return await res.json();
    } catch (error) {
      console.error("❌ Error fetching order details:", error);
      window.toast.error("Failed to load order details.");
      return null;
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    if (isUserLoading) {
      setLoadingOrders(true);
      return;
    }

    if (userdetails?.id) {
      getorders();
    } else {
      setOrders([]);
      setLoadingOrders(false);
    }
  }, [isUserLoading, userdetails, getorders]);

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