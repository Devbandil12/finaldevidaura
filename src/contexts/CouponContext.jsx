// src/contexts/CouponContext.js
import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { UserContext } from "./UserContext";

export const CouponContext = createContext({
  coupons: [],
  availableCoupons: [],
  autoOfferInstructions: [], // 🟢 For the "how-to" notification
  editingCoupon: null,
  setEditingCoupon: () => {},
  refreshCoupons: () => {},
  saveCoupon: () => {},
  deleteCoupon: () => {},
  isCouponValid: () => false,
  loadAvailableCoupons: () => {},
  loadAutoOfferInstructions: () => {}, // 🟢 For the "how-to" notification
  validateCoupon: () => null,
});

export const CouponProvider = ({ children }) => {
  const [coupons, setCoupons] = useState([]);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [autoOfferInstructions, setAutoOfferInstructions] = useState([]); // 🟢 NEW
  const { userdetails, isUserLoading } = useContext(UserContext);
  const BASE_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

  // --- 1. Admin function to get ALL coupons ---
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

  // --- 2. User function to get available MANUAL coupons ---
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
  
  // 🟢 3. NEW: Function to get automatic offer instructions
  const loadAutoOfferInstructions = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/coupons/automatic-offers`);
      if (!res.ok) throw new Error("Failed to fetch auto offers");
      const data = await res.json(); // This data contains all the rules
      setAutoOfferInstructions(data);
    } catch (err) {
      console.error("[CouponContext] failed to load auto offers:", err);
    }
  }, [BASE_URL]);


  // --- 4. Load data based on user role ---
  useEffect(() => {
    if (isUserLoading) {
      return;
    }
    
    // 🟢 Call for all users (guests included)
    loadAutoOfferInstructions();
    
    if (userdetails?.role === 'admin') {
      refreshCoupons();
    } else if (userdetails?.id) {
      loadAvailableCoupons(userdetails.id);
    } else {
      setCoupons([]);
      setAvailableCoupons([]);
    }
  }, [isUserLoading, userdetails, refreshCoupons, loadAvailableCoupons, loadAutoOfferInstructions]); // 🟢 Add dependency

  // 5. 🟢 --- MODIFIED: saveCoupon ---
  // This now sends all the new promotion rules to the backend
  const saveCoupon = async () => {
    if (!editingCoupon?.code) {
      return window.toast.error("Code is required");
    }

    const formattedPayload = {
      code: editingCoupon.code.toUpperCase(),
      description: editingCoupon.description || "",
      discountType: editingCoupon.discountType,
      discountValue: editingCoupon.discountValue,
      minOrderValue: editingCoupon.minOrderValue,
      minItemCount: editingCoupon.minItemCount,
      
      // 🟢 --- START FIX ---
      // This is the new field you were missing
      maxDiscountAmount: editingCoupon.maxDiscountAmount || null, 
      // 🟢 --- END FIX ---
      
      validFrom: editingCoupon.validFrom ? new Date(editingCoupon.validFrom) : null,
      validUntil: editingCoupon.validUntil ? new Date(editingCoupon.validUntil) : null,
      firstOrderOnly: editingCoupon.firstOrderOnly ?? false,
      maxUsagePerUser: editingCoupon.maxUsagePerUser ?? null,
      
      // 🟢 NEW: Send the new automatic offer rules
      isAutomatic: editingCoupon.isAutomatic ?? false,
      cond_requiredCategory: editingCoupon.cond_requiredCategory || null,
      cond_requiredSize: editingCoupon.cond_requiredSize || null,
      action_targetSize: editingCoupon.action_targetSize || null,
      action_targetMaxPrice: editingCoupon.action_targetMaxPrice || null,
      action_buyX: editingCoupon.action_buyX || null,
      action_getY: editingCoupon.action_getY || null,
    };

    const url = editingCoupon.id
      ? `${BASE_URL}/api/coupons/${editingCoupon.id}`
      : `${BASE_URL}/api/coupons`;
    const method = editingCoupon.id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedPayload), 
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      window.toast.success(editingCoupon.id ? "Coupon updated" : "Coupon added");
      setEditingCoupon(null);
      await refreshCoupons();
    } catch(err) {
      window.toast.error(err.message || "Save failed");
    }
  };

  // --- 6. deleteCoupon (Unchanged) ---
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

  // --- 7. 🟢 MODIFIED: isCouponValid ---
  // This now checks against the post-offer total
  const isCouponValid = useCallback((coupon, cart, postOfferTotal) => {
    // 🟢 Use the post-offer total calculated by the priceController
    const totalValue = postOfferTotal ?? cart.reduce(
      (acc, item) =>
        acc +
        item.quantity *
        // 🟢 FIX: Use variant price, not product price
        Math.floor(item.variant.oprice * (1 - item.variant.discount / 100)),
      0
    ); 
    
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    // 🟢 NEW: Automatic coupons can't be applied manually
    if (coupon.isAutomatic) {
      window.toast.error("This is an automatic offer and cannot be applied manually.");
      return false;
    }

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

  // --- 8. validateCoupon (Unchanged) ---
  // This is for validating a *manual* code with the backend
  const validateCoupon = useCallback(async (code, userId) => {
    if (!code || !userId) {
      window.toast.error("Coupon code and user are required.");
      return null;
    }
    
    try {
      const res = await fetch(`${BASE_URL}/api/coupons/validate?code=${code}&userId=${userId}`, {
        method: "GET",
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.code) { 
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
        autoOfferInstructions, // 🟢 NEW
        editingCoupon,
        setEditingCoupon,
        refreshCoupons,
        saveCoupon,
        deleteCoupon,
        isCouponValid,
        loadAvailableCoupons, 
        loadAutoOfferInstructions, // 🟢 NEW
        validateCoupon,
      }}
    >
      {children}
    </CouponContext.Provider>
  );
};