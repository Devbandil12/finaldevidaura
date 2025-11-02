// src/contexts/CouponContext.js
import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { UserContext } from "./UserContext";

export const CouponContext = createContext({
  coupons: [],
  editingCoupon: null,
  setEditingCoupon: () => {},
  refreshCoupons: () => {},
  saveCoupon: () => {},
  deleteCoupon: () => {},
  isCouponValid: () => false,
  loadAvailableCoupons: () => {},
  validateCoupon: () => null,
});

export const CouponProvider = ({ children }) => {
  const [coupons, setCoupons] = useState([]);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const { userdetails, isUserLoading } = useContext(UserContext);
  const BASE_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

  // --- 1. MOVED THESE FUNCTIONS UP ---

  const refreshCoupons = useCallback(async () => {
    const endpoint = `${BASE_URL}/api/coupons`;
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setCoupons(data);
      return data;
    } catch (err) {
      console.error("[CouponContext] failed to load:", err);
    }
  }, [BASE_URL]);

  const loadAvailableCoupons = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/coupons/available?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch available coupons");
      const data = await res.json();
      setAvailableCoupons(data);
    } catch (err) {
      console.error("[CouponContext] failed to load available coupons:", err);
    }
  }, [BASE_URL]);

  // --- 2. NOW THIS useEffect CAN SAFELY ACCESS THE FUNCTIONS ---

  useEffect(() => {
    // Wait for user loading to finish
    if (isUserLoading) {
      return;
    }

    // Now, we have a stable user state
    if (userdetails?.role === 'admin') {
      // Admin: fetch all coupons
      refreshCoupons();
    } else if (userdetails?.id) {
      // Logged-in user: fetch their available coupons
      loadAvailableCoupons(userdetails.id);
    } else {
      // Guest: clear all coupon data
      setCoupons([]);
      setAvailableCoupons([]);
    }
  }, [isUserLoading, userdetails, refreshCoupons, loadAvailableCoupons]); // This is now safe

  const saveCoupon = async () => {
    if (!editingCoupon?.code) {
      return window.toast.error("Code is required");
    }

    // Correctly format the date strings from the form into Date objects
    const formattedPayload = {
      code: editingCoupon.code.toUpperCase(),
      discountType: editingCoupon.discountType,
      discountValue: editingCoupon.discountValue,
      minOrderValue: editingCoupon.minOrderValue,
      minItemCount: editingCoupon.minItemCount,
      description: editingCoupon.description || "",
      validFrom: editingCoupon.validFrom ? new Date(editingCoupon.validFrom) : null,
      validUntil: editingCoupon.validUntil ? new Date(editingCoupon.validUntil) : null,
      firstOrderOnly: editingCoupon.firstOrderOnly ?? false,
      maxUsagePerUser: editingCoupon.maxUsagePerUser ?? null,
    };

    const url = editingCoupon.id
      ? `${BASE_URL}/api/coupons/${editingCoupon.id}`
      : `${BASE_URL}/api/coupons`;
    const method = editingCoupon.id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedPayload), // Use the formattedPayload
      });
      if (!res.ok) throw new Error();
      window.toast.success(editingCoupon.id ? "Coupon updated" : "Coupon added");
      setEditingCoupon(null);
      await refreshCoupons();
    } catch {
      window.toast.error("Save failed");
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      const res = await fetch(`${BASE_URL}/api/coupons/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      window.toast.success("Coupon deleted");
      await refreshCoupons();
    } catch {
      window.toast.error("Delete failed");
    }
  };

  const isCouponValid = useCallback((coupon, cart) => {
    const totalValue = cart.reduce(
      (acc, item) =>
        acc +
        item.quantity *
        Math.floor(item.product.oprice * (1 - item.product.discount / 100)),
      0
    );

    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    if (coupon.minOrderValue && totalValue < coupon.minOrderValue) {
      window.toast.error(`Minimum order value ₹${coupon.minOrderValue} required`);
      return false;
    }

    if (coupon.minItemCount && totalItems < coupon.minItemCount) {
      window.toast.error(`Minimum ${coupon.minItemCount} items required`);
      return false;
    }

    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      window.toast.error(`Coupon is not active yet`);
      return false;
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      window.toast.error(`Coupon has expired`);
      return false;
    }

    return true;
  }, []);

  const validateCoupon = useCallback(async (code, userId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, userId }),
      });
      const data = await res.json();
      if (!res.ok || !data.code) { // <--- Added !data.code check here
        window.toast.error(data.message || "Invalid coupon code");
        return null;
      }
      return data;
    } catch (err) {
      console.error("[CouponContext] validation failed:", err);
      window.toast.error("Validation failed. Please try again.");
      return null;
    }
  }, [BASE_URL]);

  return (
    <CouponContext.Provider
      value={{
        coupons,
        availableCoupons,
        editingCoupon,
        setEditingCoupon,
        refreshCoupons,
        saveCoupon,
        deleteCoupon,
        isCouponValid,
        loadAvailableCoupons, 
        validateCoupon,
      }}
    >
      {children}
    </CouponContext.Provider>
  );
};