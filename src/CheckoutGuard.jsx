// src/CheckoutGuard.jsx
import React, { useMemo } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

const INTENT_KEY = "checkout_intent";
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

function readIntent() {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.ts) return null;
    const age = Date.now() - Number(data.ts);
    if (age > MAX_AGE_MS) return null;
    return data; // { ts }
  } catch {
    return null;
  }
}

export default function CheckoutGuard() {
  const { isLoaded, isSignedIn } = useUser();
  const intent = useMemo(readIntent, []);

  // Wait for Clerk to determine auth state (optional: show a loader)
  if (!isLoaded) return null;

  // 1) No valid intent? Never open checkout directly.
  if (!intent) {
    return <Navigate to="/" replace />;
  }

  // 2) Not signed in? Go to login and come back to CART (not checkout).
  if (!isSignedIn) {
    // Policy says: after login, return to /cart
    return <Navigate to="/login" replace />;
  }

  // 3) Valid intent + signed in → enter checkout
  return <Outlet />;
}
