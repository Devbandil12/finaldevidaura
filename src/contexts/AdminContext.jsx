import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserContext } from "./UserContext";
import { useAuth } from "@clerk/clerk-react";

export const AdminContext = createContext();
export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [wishlistStats, setWishlistStats] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [reportOrders, setReportOrders] = useState([]);

  const { userdetails, isUserLoading } = useContext(UserContext);
  const { getToken } = useAuth(); 

  // URL Helpers
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
  const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // 🟢 Helper for Auth Headers
  const getAuthHeaders = async () => {
    const token = await getToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
  };

  /* -------------------- USERS -------------------- */
  const getAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("❌ getAllUsers failed:", err);
      window.toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, getToken]);

  // Update User
  const updateUser = async (userId, updates) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
        method: "PUT",
        headers, 
        body: JSON.stringify({ ...updates }), 
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
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers,
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
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("❌ getAllOrders failed:", err);
      window.toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, getToken]);

  const getSingleOrderDetails = async (orderId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const headers = await getAuthHeaders(); 
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers,
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

  const updateBulkOrderStatus = async (orderIds, status) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/orders/bulk-status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ orderIds, status }),
      });

      if (!res.ok) throw new Error("Failed to update orders");
      
      const data = await res.json();
      window.toast.success(data.message || "Bulk update successful");
      await getAllOrders(); // Refresh list
      return true;
    } catch (err) {
      console.error("❌ updateBulkOrderStatus failed:", err);
      window.toast.error("Failed to update orders");
      return false;
    }
  };

  const cancelOrder = async (orderId, paymentMode, amount) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Cancellation failed");
      }

      const data = await res.json();
      window.toast.success(data.message || `Order #${orderId} cancelled by Admin`);
      await getAllOrders();

    } catch (err) {
      console.error("❌ cancelOrder failed:", err);
      window.toast.error(err.message || "Failed to cancel order");
    }
  };

  /* -------------------- COUPONS -------------------- */
  const createCoupon = async (couponData) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/coupons`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...couponData }),
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
      const token = await getToken();
      const res = await fetch(`${BASE}/api/orders/details/for-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch report data");
      const data = await res.json();
      setReportOrders(data);
    } catch (error) {
      console.error(error);
      window.toast.error("Could not load report data.");
    } finally {
      setLoading(false);
    }
  }, [BASE, getToken]);

  const getAbandonedCarts = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/cart/admin/abandoned`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch abandoned carts");
      const data = await res.json();
      setAbandonedCarts(data);
    } catch (err) {
      console.error("❌ getAbandonedCarts failed:", err);
    }
  }, [BACKEND_URL, getToken]);

  const getWishlistStats = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/cart/admin/wishlist-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch wishlist stats");
      const data = await res.json();
      setWishlistStats(data);
    } catch (err) {
      console.error("❌ getWishlistStats failed:", err);
    }
  }, [BACKEND_URL, getToken]);

  const getActivityLogs = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/users/admin/all-activity-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch activity logs");
      const data = await res.json();
      setActivityLogs(data);
    } catch (err) {
      console.error("❌ getActivityLogs failed:", err);
    }
  }, [BACKEND_URL, getToken]);

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
      Promise.all([
        getAllUsers(),
        getAllOrders(),
        getAbandonedCarts(),
        getWishlistStats(),
        getActivityLogs() 
      ]).finally(() => setLoading(false));
    } else {
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
        activityLogs,

        getAllUsers,
        updateUser,
        deleteUser,
        getAllOrders,
        getSingleOrderDetails,
        updateOrderStatus,
        updateBulkOrderStatus,
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