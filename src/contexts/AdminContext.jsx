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
  const [activityLogs, setActivityLogs] = useState([]); // ✅ Added State
  const [loading, setLoading] = useState(true);
  const [reportOrders, setReportOrders] = useState([]);
  
  const { userdetails, isUserLoading } = useContext(UserContext);
  
  // URL Helpers
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

  // Update User
  const updateUser = async (userId, updates) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, actorId: userdetails?.id }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      window.toast.success("User updated");
      await getAllUsers();
    } catch (err) {
      console.error("❌ updateUser failed:", err);
      window.toast.error("Failed to update user");
    }
  };

  // Delete User
  const deleteUser = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: userdetails?.id })
      });
      if (!res.ok) throw new Error("Failed to delete user");
      window.toast.success("User deleted");
      await getAllUsers();
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
        body: JSON.stringify({ status, actorId: userdetails?.id }),
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
      const res = await fetch(`${BACKEND_URL}/api/payments/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount,
          actorId: userdetails?.id
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Cancellation failed");
      }

      const data = await res.json();
      window.toast.success(data.message || `Order #${orderId} cancelled`);
      await getAllOrders();

    } catch (err) {
      console.error("❌ cancelOrder failed:", err);
      window.toast.error(err.message || "Failed to cancel order");
    }
  };

  /* -------------------- COUPONS -------------------- */
  const createCoupon = async (couponData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...couponData, actorId: userdetails?.id }),
      });
      if (!res.ok) throw new Error("Failed to create coupon");
      window.toast.success("Coupon created");
    } catch (err) {
      console.error("❌ createCoupon failed:", err);
      window.toast.error("Failed to create coupon");
    }
  };

  /* -------------------- ANALYTICS & LOGS -------------------- */
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

  // ✅ Added Activity Log Fetcher
  const getActivityLogs = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/admin/all-activity-logs`);
      if (!res.ok) throw new Error("Failed to fetch activity logs");
      const data = await res.json();
      setActivityLogs(data);
    } catch (err) {
      console.error("❌ getActivityLogs failed:", err);
    }
  }, [BACKEND_URL]);

  /* -------------------- EXPORT UTILS -------------------- */
  const exportUsers = (selectedUsers) => console.log("Exporting users:", selectedUsers);
  const exportOrders = (selectedOrders) => console.log("Exporting orders:", selectedOrders);

  /* -------------------- INITIALIZATION EFFECT -------------------- */
  useEffect(() => {
    if (isUserLoading) {
      setLoading(true);
      return;
    }

    if (userdetails?.role === "admin") {
      // ✅ Fetch all admin data
      Promise.all([
        getAllUsers(),
        getAllOrders(),
        getAbandonedCarts(),
        getWishlistStats(),
        getActivityLogs() // ✅ Added log fetch here
      ]).finally(() => setLoading(false));
    } else {
      // Reset state if not admin
      setUsers([]);
      setOrders([]);
      setReportOrders([]);
      setAbandonedCarts([]);
      setWishlistStats([]);
      setActivityLogs([]);
      setLoading(false);
    }
  }, [
    isUserLoading, 
    userdetails, 
    getAllUsers, 
    getAllOrders, 
    getAbandonedCarts, 
    getWishlistStats, 
    getActivityLogs
  ]);

  return (
    <AdminContext.Provider
      value={{
        users,
        orders,
        loading,
        reportOrders,
        abandonedCarts,
        wishlistStats,
        activityLogs, // ✅ Exposed to consumers
        
        getAllUsers,
        updateUser,
        deleteUser,
        getAllOrders,
        getSingleOrderDetails,
        updateOrderStatus,
        cancelOrder,
        createCoupon,
        getReportData,
        getActivityLogs,
        
        exportUsers,
        exportOrders,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};