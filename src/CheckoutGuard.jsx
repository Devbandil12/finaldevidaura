// src/CheckoutGuard.jsx
import React, { useContext, useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { CartContext } from "./contexts/CartContext";
import Loader from "./Components/Loader";

const INTENT_KEY = "checkout_intent";
const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function readIntent() {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.ts) return null;
    const age = Date.now() - Number(data.ts);
    if (age > MAX_AGE_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export default function CheckoutGuard() {
  const { isLoaded, isSignedIn } = useUser();
  const { cart, isCartLoading } = useContext(CartContext);
  const location = useLocation();

  const intent = useMemo(readIntent, []);

  // 1. Wait for Clerk to load fundamental auth state
  if (!isLoaded) return <Loader text="Verifying..." />;

  // 🔒 2. SECURITY FIRST: No Ticket? No Entry.
  if (!intent) {
     return <Navigate to="/cart" replace />;
  }

  // 3. Ticket exists? Now check if they are logged in.
  if (!isSignedIn) {
    if (location.pathname !== "/login") {
        sessionStorage.setItem("post_login_redirect", "/checkout");
    }
    return <Navigate to="/login" replace />;
  }

  // 4. Wait for Cart Data
  if (isCartLoading) return <Loader text="Loading your cart..." />;

  // 5. Check if Cart is Empty (BUT allow if it's a "Buy Now" flow)
  // We check if the source is NOT 'buy_now'. If it is 'buy_now', we skip this check.
  if (intent?.source !== "buy_now" && (!cart || cart.length === 0)) {
    return <Navigate to="/cart" replace />;
  }

  // 6. Access Granted
  return <Outlet />;
}