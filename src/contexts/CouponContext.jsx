import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

export const CouponContext = createContext({
  coupons: [],
  editingCoupon: null,
  setEditingCoupon: () => { },
  refreshCoupons: () => { },
  saveCoupon: () => { },
  deleteCoupon: () => { },
  isCouponValid: () => false,
  loadAvailableCoupons: () => { }
});

const BASE_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

export const CouponProvider = ({ children }) => {
  const [coupons, setCoupons] = useState([]);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  // Load coupons
  const refreshCoupons = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/coupons`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCoupons(data);
    } catch {
      toast.error("Could not load coupons");
    }
  };

  useEffect(() => {
    refreshCoupons();
  }, []);

  // Save coupon (create or update)
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

  // Delete coupon
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

  // Validate coupon conditions (client side)
  const isCouponValid = (coupon, cart) => {
    const totalValue = cart.reduce(
      (acc, item) =>
        acc +
        item.quantity *
        Math.floor(
          item.product.oprice -
          (item.product.discount / 100) * item.product.oprice
        ),
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
  };

  // Load available coupons for user
  const loadAvailableCoupons = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/coupons/available?userId=${userId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAvailableCoupons(data);
    } catch {
      toast.error("Could not load available coupons");
    }
  };

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
      }}
    >
      {children}
    </CouponContext.Provider>
  );
};
