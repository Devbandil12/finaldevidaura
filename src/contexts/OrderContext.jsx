// src/contexts/OrderContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { UserContext } from "./UserContext";
import { toast } from "react-toastify";

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { userdetails } = useContext(UserContext);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\\/$/, "");

  const getorders = async (showLoader = true, isAdmin = false) => {
    if (!isAdmin && !userdetails?.id) {
      return;
    }

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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update order status");
      await getorders(true, true);
      toast.success(`Order ${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error("❌ Failed to update order status:", error);
      toast.error("Failed to update order status.");
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/cancel`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to cancel order");
      toast.success(`Order ${orderId} has been successfully canceled.`);
      await getorders(true, true); // Refresh the orders list for admin
    } catch (error) {
      console.error("❌ Failed to cancel order:", error);
      toast.error("Failed to cancel order.");
    }
  };


  const getSingleOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("❌ Error fetching order details:", error);
      toast.error("Failed to load order details.");
      return null;
    }
  };

  useEffect(() => {
    if (userdetails) {
      getorders();
    }
  }, [userdetails]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        getorders,
        setOrders,
        loadingOrders,
        updateOrderStatus,
        getSingleOrderDetails,
        cancelOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

