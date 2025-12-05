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

  // 🟢 Update User (With actorId)
  const updateUser = async (userId, updates) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, actorId: userdetails?.id }), // 🟢 Added actorId
      });
      if (!res.ok) throw new Error("Failed to update user");
      window.toast.success("User updated");
      await getAllUsers();
    } catch (err) {
      console.error("❌ updateUser failed:", err);
      window.toast.error("Failed to update user");
    }
  };

  // 🟢 Delete User (With actorId)
  const deleteUser = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, { 
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actorId: userdetails?.id }) // 🟢 Added actorId to body
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

  // 🟢 Update Order Status (With actorId)
  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, actorId: userdetails?.id }), // 🟢 Added actorId
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

  // 🟢 Cancel Order (With actorId)
  const cancelOrder = async (orderId, paymentMode, amount) => {
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
      window.toast.success(data.message || `Order #${orderId} cancelled`);
      await getAllOrders();

    } catch (err) {
      console.error("❌ cancelOrder failed:", err);
      window.toast.error(err.message || "Failed to cancel order");
    }
  };

  /* -------------------- COUPONS -------------------- */
  // 🟢 Create Coupon (With actorId)
  const createCoupon = async (couponData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...couponData, actorId: userdetails?.id }), // 🟢 Added actorId
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
    if (isUserLoading) {
      setLoading(true); 
      return;
    }
    
    if (userdetails?.role === "admin") {
      getAllUsers();
      getAllOrders();
      getAbandonedCarts(); 
      getWishlistStats();
    } else {
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