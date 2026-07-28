import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "./UserContext";
import { useAuth } from "@clerk/clerk-react"; 

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { userdetails, isUserLoading } = useContext(UserContext);
  const { getToken } = useAuth();
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // Helper
  const getAuthHeaders = async () => {
    const token = await getToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
  };

  // Fetch orders
  const getorders = useCallback(async (showLoader = true, isAdmin = false) => {
    if (!isAdmin && !userdetails?.id) return;
    if (showLoader) setLoadingOrders(true);

    try {
      const headers = await getAuthHeaders();
      let res;
      if (isAdmin) {
        res = await fetch(`${BACKEND_URL}/api/orders/`, { headers });
      } else {
        res = await fetch(`${BACKEND_URL}/api/orders/get-my-orders`, {
          method: "POST",
          headers,
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
  }, [BACKEND_URL, userdetails?.id, getToken]);

  // 🟢 UPDATED: Update order status (Accepts logistics data now)
  const updateOrderStatus = useCallback(async (orderId, newStatus, additionalData = {}) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ 
            status: newStatus,
            ...additionalData // 🟢 Spread courierName, trackingId, message, etc.
        }),
      });
      
      if (!res.ok) throw new Error("Failed to update order status");
      
      await getorders(true, true); // Refresh list
      window.toast.success(`Order ${orderId} updated to ${newStatus}`);
      return true; // Return success for UI handling
    } catch (error) {
      console.error("❌ Failed to update order status:", error);
      window.toast.error("Failed to update order status.");
      return false;
    }
  }, [BACKEND_URL, getorders, getToken]);

  // Cancel order (With token)
 const cancelOrder = useCallback(
  async (orderId, paymentMode, amount) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/payments/refund`, {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          orderId, 
          amount,
          // actorId inferred
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Cancellation failed");
      }

      const data = await res.json();
      window.toast.success(data.message || `Order ${orderId} cancelled successfully.`);
      
      await getorders(true, false); 

    } catch (error) {
      console.error("❌ Failed to cancel order:", error);
      window.toast.error(error.message || "Failed to cancel order.");
    }
  },
  [BACKEND_URL, getorders, getToken]
);

  // 🟢 NEW: Return order (Reverse Pickup via Shiprocket)
  const returnOrder = useCallback(
    async (orderId) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/return`, {
          method: "POST",
          headers,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Return initiation failed");
        }

        const data = await res.json();
        window.toast.success(data.message || `Return for order ${orderId} initiated successfully.`);
        
        await getorders(true, false); // Refresh list for the user
        return true;
      } catch (error) {
        console.error("❌ Failed to initiate return:", error);
        window.toast.error(error.message || "Failed to initiate return.");
        return false;
      }
    },
    [BACKEND_URL, getorders, getToken]
  );

  const getSingleOrderDetails = useCallback(async (orderId) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch order details");
      return await res.json();
    } catch (error) {
      console.error("❌ Error fetching order details:", error);
      window.toast.error("Failed to load order details.");
      return null;
    }
  }, [BACKEND_URL, getToken]);

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
        returnOrder, // 🟢 NEW: Export the return function
        getSingleOrderDetails,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};