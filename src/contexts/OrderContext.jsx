// src/contexts/OrderContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from "react"; // 👈 IMPORT useCallback
import { UserContext } from "./UserContext";

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { userdetails, isUserLoading } = useContext(UserContext);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // 🔹 Fetch orders (user → only own, admin → all)
  const getorders = useCallback(async (showLoader = true, isAdmin = false) => { // 👈 WRAP
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
  }, [BACKEND_URL, userdetails?.id]); // 👈 ADD DEPENDENCIES

  // 🔹 Update order status
  const updateOrderStatus = useCallback(async (orderId, newStatus) => { // 👈 WRAP
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
  }, [BACKEND_URL, getorders]); // 👈 ADD DEPENDENCIES

  // 🔹 Cancel order (COD + prepaid via refund API)
  const cancelOrder = useCallback(async (orderId, paymentMode, amount, isAdmin = false) => { // 👈 WRAP
    try {
      if (paymentMode === "online") {
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
      window.toast.success(`Order ${orderId} canceled successfully.`);
      await getorders(true, isAdmin);
    } catch (error) {
      console.error("❌ Failed to cancel order:", error);
      window.toast.error("Failed to cancel order.");
    }
  }, [BACKEND_URL, getorders]); // 👈 ADD DEPENDENCIES

  // 🔹 Single order details
  const getSingleOrderDetails = useCallback(async (orderId) => { // 👈 WRAP
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      return await res.json();
    } catch (error) {
      console.error("❌ Error fetching order details:", error);
      window.toast.error("Failed to load order details.");
      return null;
    }
  }, [BACKEND_URL]); // 👈 ADD DEPENDENCIES

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
  }, [isUserLoading, userdetails, getorders]); // 👈 UPDATE DEPENDENCIES

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