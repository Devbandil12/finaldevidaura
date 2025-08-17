// src/contexts/CouponContext.js
import React, { createContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

export const CouponContext = createContext({
  coupons: [],
  editingCoupon: null,
  setEditingCoupon: () => { },
  refreshCoupons: () => { },
  saveCoupon: () => { },
  deleteCoupon: () => { },
  isCouponValid: () => false,
  loadAvailableCoupons: () => { },
  validateCoupon: () => null,
});


export const CouponProvider = ({ children }) => {
  const [coupons, setCoupons] = useState([]);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  const BASE_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");
  
  const refreshCoupons = useCallback(async () => {
    const endpoint = `${BASE_URL}/api/coupons`;
    console.log("🔍 [CouponContext] fetching coupons from:", endpoint);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setCoupons(data);
      return data;
    } catch (err) {
      console.error("[CouponContext] failed to load:", err);
      toast.error("Could not load coupons");
    }
  }, [BASE_URL]);


  useEffect(() => {
    refreshCoupons();
  }, [refreshCoupons]);

  const saveCoupon = async () => {
    if (!editingCoupon?.code) {
      return toast.error("Code is required");
    }

    const payload = {
      code: editingCoupon.code.toUpperCase(),
      discountType: editingCoupon.discountType,
      discountValue: editingCoupon.discountValue,
      minOrderValue: editingCoupon.minOrderValue,
      minItemCount: editingCoupon.minItemCount,
      description: editingCoupon.description || "",
      validFrom: editingCoupon.validFrom || null,
      validUntil: editingCoupon.validUntil || null,
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
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingCoupon.id ? "Coupon updated" : "Coupon added");
      setEditingCoupon(null);
      await refreshCoupons();
    } catch {
      toast.error("Save failed");
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      const res = await fetch(`${BASE_URL}/api/coupons/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Coupon deleted");
      await refreshCoupons();
    } catch {
      toast.error("Delete failed");
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
      toast.error(`Minimum order value ₹${coupon.minOrderValue} required`);
      return false;
    }

    if (coupon.minItemCount && totalItems < coupon.minItemCount) {
      toast.error(`Minimum ${coupon.minItemCount} items required`);
      return false;
    }

    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      toast.error(`Coupon is not active yet`);
      return false;
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      toast.error(`Coupon has expired`);
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
      toast.error(data.message || "Invalid coupon code");
      return null;
    }
    return data;
  } catch (err) {
    console.error("[CouponContext] validation failed:", err);
    toast.error("Validation failed. Please try again.");
    return null;
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
      toast.error("Could not load available coupons");
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
