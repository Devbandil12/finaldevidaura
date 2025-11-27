// src/contexts/OrderContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "./UserContext";

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { userdetails, isUserLoading } = useContext(UserContext);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // 🔹 Fetch orders (user → only own, admin → all)
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

  // 🔹 Update order status
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update order status");
      await getorders(true, true); // admin updates
      window.toast.success(`Order ${orderId} updated to ${newStatus}`);
    } catch (error) {
      console.error("❌ Failed to update order status:", error);
      window.toast.error("Failed to update order status.");
    }
  }, [BACKEND_URL, getorders]);

  // 🔹 Cancel order (Now uses Refund Controller for BOTH COD and Online)
  const cancelOrder = useCallback(
    async (orderId, paymentMode, amount, isAdmin = false) => {
      try {
        // 🟢 UNIFIED LOGIC: Always call refund API
        // The backend controller determines if it's COD (cancel only) or Online (refund + cancel)
        const res = await fetch(`${BACKEND_URL}/api/payments/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            orderId, 
            amount // Backend requires amount for validation/refund calc
          }),
        });

        if (!res.ok) {
          // Try to get error message from backend response
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Cancellation failed");
        }

        const data = await res.json();
        window.toast.success(data.message || `Order ${orderId} canceled successfully.`);
        
        // Refresh orders list
        await getorders(true, isAdmin);

      } catch (error) {
        console.error("❌ Failed to cancel order:", error);
        window.toast.error(error.message || "Failed to cancel order.");
      }
    },
    [BACKEND_URL, getorders]
  );

  // 🔹 Single order details
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
    // Wait for user loading to finish
    if (isUserLoading) {
      setLoadingOrders(true); // Keep loading
      return;
    }

    // Now, we have a stable user state
    if (userdetails?.id) {
      getorders(); // Fetch orders for this user
    } else {
      // No user, so no orders. Stop loading.
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