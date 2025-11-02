// src/contexts/AdminContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserContext } from "./UserContext";
export const AdminContext = createContext();
export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [wishlistStats, setWishlistStats] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportOrders, setReportOrders] = useState([]);
  const { userdetails, isUserLoading } = useContext(UserContext);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
  const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
  /* -------------------- USERS -------------------- */
  const getAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("❌ getAllUsers failed:", err);
      window.toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL]);

  const updateUser = async (userId, updates) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update user");
      window.toast.success("User updated");
      await getAllUsers();
    } catch (err) {
      console.error("❌ updateUser failed:", err);
      window.toast.error("Failed to update user");
    }
  };

  const deleteUser = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      window.toast.success("User deleted");
      await getAllUsers();
      // ⚠️ To also delete from Clerk, you’ll need Clerk Admin API here
    } catch (err) {
      console.error("❌ deleteUser failed:", err);
      window.toast.error("Failed to delete user");
    }
  };

  /* -------------------- ORDERS -------------------- */
  const getAllOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/orders`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("❌ getAllOrders failed:", err);
      window.toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL]);

  // New function to get single order details
  const getSingleOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      return await res.json();
    } catch (error) {
      console.error("❌ Error fetching single order details:", error);
      window.toast.error("Failed to load order details.");
      return null;
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      const updatedOrder = await res.json();
      window.toast.success(`Order #${orderId} updated`);
      await getAllOrders();
      return updatedOrder;
    } catch (err) {
      console.error("❌ updateOrderStatus failed:", err);
      window.toast.error("Failed to update order");
    }
  };

  const cancelOrder = async (orderId, paymentMode, amount) => {
    try {
      // 🟢 FIX: Use a robust, case-insensitive check to cover variations like 
      const isOnlinePayment = paymentMode.toLowerCase().includes("online") || paymentMode.toLowerCase().includes("razorpay");

      if (isOnlinePayment) {
        // Refund for prepaid (Online orders)
        const res = await fetch(`${BACKEND_URL}/api/payments/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, amount }),
        });
        if (!res.ok) throw new Error("Refund failed");
        window.toast.success(`Refund initiated for Order #${orderId}`);
      } else {
        // COD (or any other mode)
        const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/cancel`, { method: "PUT" });
        if (!res.ok) throw new Error("Cancel failed");
        window.toast.success(`Order #${orderId} cancelled`);
      }
      await getAllOrders();
    } catch (err) {
      console.error("❌ cancelOrder failed:", err);
      window.toast.error("Failed to cancel order");
    }
  };

  /* -------------------- COUPONS -------------------- */
  const createCoupon = async (couponData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponData),
      });
      if (!res.ok) throw new Error("Failed to create coupon");
      window.toast.success("Coupon created");
    } catch (err) {
      console.error("❌ createCoupon failed:", err);
      window.toast.error("Failed to create coupon");
    }
  };

  /* -------------------- EXPORT -------------------- */
  const exportUsers = (selectedUsers) => {
    console.log("Exporting users:", selectedUsers);
  };

  const exportOrders = (selectedOrders) => {
    console.log("Exporting orders:", selectedOrders);
  };


  const getReportData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/api/orders/details/for-reports`);
      if (!res.ok) throw new Error("Failed to fetch report data");
      const data = await res.json();
      setReportOrders(data);
    } catch (error) {
      console.error(error);
      window.toast.error("Could not load report data.");
    } finally {
      setLoading(false);
    }
  }, [BASE]);

  const getAbandonedCarts = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart/admin/abandoned`);
      if (!res.ok) throw new Error("Failed to fetch abandoned carts");
      const data = await res.json();
      setAbandonedCarts(data);
    } catch (err) {
      console.error("❌ getAbandonedCarts failed:", err);
      // Don't show toast for this, it's a bg task
    }
  }, [BACKEND_URL]);

  const getWishlistStats = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart/admin/wishlist-stats`);
      if (!res.ok) throw new Error("Failed to fetch wishlist stats");
      const data = await res.json();
      setWishlistStats(data);
    } catch (err) {
      console.error("❌ getWishlistStats failed:", err);
    }
  }, [BACKEND_URL]);

  /* -------------------- EFFECT -------------------- */
 useEffect(() => {
    // Wait for user loading to finish
    if (isUserLoading) {
      setLoading(true); // Keep admin context loading
      return;
    }
    
    // Now, we have a stable user state
    if (userdetails?.role === "admin") {
      // User is an admin, fetch all data
      getAllUsers();
      getAllOrders();
      getAbandonedCarts(); 
      getWishlistStats();
      // setLoading(false) is handled inside these functions
    } else {
      // User is NOT an admin, clear data and stop loading
      setUsers([]);
      setOrders([]);
      setReportOrders([]);
      setAbandonedCarts([]); 
      setWishlistStats([]);
      setLoading(false);
    }
  }, [isUserLoading, userdetails, getAllUsers, getAllOrders, getAbandonedCarts, getWishlistStats]);

  return (
    <AdminContext.Provider
      value={{
        users,
        orders,
        loading,
        getAllUsers,
        updateUser,
        deleteUser,
        exportUsers,
        getAllOrders,
        getSingleOrderDetails,
        updateOrderStatus,
        cancelOrder,
        exportOrders,
        createCoupon,
        reportOrders,
        getReportData,
        abandonedCarts,
        wishlistStats,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};