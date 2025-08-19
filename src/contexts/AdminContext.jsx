// src/contexts/AdminContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

export const AdminContext = createContext();
export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

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
      toast.error("Failed to fetch users");
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
      toast.success("User updated");
      await getAllUsers();
    } catch (err) {
      console.error("❌ updateUser failed:", err);
      toast.error("Failed to update user");
    }
  };

  const deleteUser = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User deleted");
      await getAllUsers();
      // ⚠️ To also delete from Clerk, you’ll need Clerk Admin API here
    } catch (err) {
      console.error("❌ deleteUser failed:", err);
      toast.error("Failed to delete user");
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
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      toast.success(`Order #${orderId} updated`);
      await getAllOrders();
    } catch (err) {
      console.error("❌ updateOrderStatus failed:", err);
      toast.error("Failed to update order");
    }
  };

  const cancelOrder = async (orderId, paymentMode, amount) => {
    try {
      if (paymentMode === "razorpay" || paymentMode === "online") {
        // Refund for prepaid
        const res = await fetch(`${BACKEND_URL}/api/payments/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, amount }),
        });
        if (!res.ok) throw new Error("Refund failed");
        toast.success(`Refund initiated for Order #${orderId}`);
      } else {
        // COD
        const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/cancel`, { method: "PUT" });
        if (!res.ok) throw new Error("Cancel failed");
        toast.success(`Order #${orderId} cancelled`);
      }
      await getAllOrders();
    } catch (err) {
      console.error("❌ cancelOrder failed:", err);
      toast.error("Failed to cancel order");
    }
  };

  /* -------------------- COUPONS -------------------- */
  const createCoupon = async (couponData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponData), // include { code, discount, userId? }
      });
      if (!res.ok) throw new Error("Failed to create coupon");
      toast.success("Coupon created");
    } catch (err) {
      console.error("❌ createCoupon failed:", err);
      toast.error("Failed to create coupon");
    }
  };

  /* -------------------- EXPORT -------------------- */
  const exportUsers = (selectedUsers) => {
    // 🔹 selectedUsers: array of user objects
    // Use jsPDF or similar here
    console.log("Exporting users:", selectedUsers);
  };

  const exportOrders = (selectedOrders) => {
    // 🔹 selectedOrders: array of order objects
    // Use jsPDF or similar here
    console.log("Exporting orders:", selectedOrders);
  };

  /* -------------------- EFFECT -------------------- */
  useEffect(() => {
    getAllUsers();
    getAllOrders();
  }, [getAllUsers, getAllOrders]);

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
        updateOrderStatus,
        cancelOrder,
        exportOrders,
        createCoupon,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
