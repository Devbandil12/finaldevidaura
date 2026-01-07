// src/App.jsx
import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useUser, AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

// --- Minimal Imports (Load these immediately) ---
import SmoothScroll from "./Components/SmoothScroll";

import SsoCallbackLoader from "./Components/SsoCallbackLoader";
import Home from "./pages/Home";
import MainLayout from "./pages/MainLayout"; // Import the new layout

// --- Lazy Load the Heavy Stuff ---
// These won't load when the user is just logging in
// const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Login = lazy(() => import("./pages/CustomAuthModal"));
const Adminpannel = lazy(() => import("./pages/Adminpanel"));
const MyOrder = lazy(() => import("./pages/MyOrder"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Confirmation = lazy(() => import("./pages/Confirmation"));
const UserPage = lazy(() => import("./pages/UserPage"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const CustomComboBuilder = lazy(() => import("./pages/CustomComboBuilder"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
// --- Utilities & Contexts (Keep these) ---
import CheckoutGuard from "./CheckoutGuard";
import ScrollToTop from "./ScrollToTop";
import { ProductProvider } from "./contexts/productContext";
import { OrderProvider } from "./contexts/OrderContext";
import { CartProvider } from "./contexts/CartContext";
import { CouponProvider } from "./contexts/CouponContext";
import { ContactProvider } from "./contexts/ContactContext";
import { UserProvider } from "./contexts/UserContext";
import { AdminProvider } from "./contexts/AdminContext";
import { ReviewProvider } from "./contexts/ReviewContext";
import { NotificationProvider } from "./contexts/NotificationContext";
// 🟢 Imported AuthenticateWithRedirectCallback for SSO handling

// --- Global Error Reporting (no changes needed here) ---
const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
const LOG_ERROR_URL = API_BASE ? `${API_BASE}/api/log-error` : "/api/log-error";

function reportError(type, details) {
  try {
    fetch(LOG_ERROR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        details,
        userAgent: navigator.userAgent,
        url: window.location.href,
        time: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn("Failed to report error:", err);
  }
}

if (typeof window !== "undefined") {
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    const details = {
      message: msg,
      file: url,
      line: lineNo,
      column: columnNo,
      stack: error?.stack || "N/A",
    };
    console.error("Global Error Handler:", details);
    reportError("runtime", details);
    return false;
  };

  window.onunhandledrejection = function (event) {
    const details = {
      reason: event.reason?.message || event.reason || "Unknown",
      stack: event.reason?.stack || "N/A",
    };
    console.error("Unhandled Promise Rejection:", details);
    reportError("promiseRejection", details);
  };
}
// --- End Error Reporting ---


// --- Helper Component for Post-Login Redirection ---
function PostLoginRedirector() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    // 1. Don't interfere if we are currently handling the Google SSO callback
    if (location.pathname === "/sso-callback") return;

    // 2. Wait for the user to be fully loaded and signed in
    if (!isLoaded || !isSignedIn) return;

    // 3. Check if there is a pending redirect
    const target = sessionStorage.getItem("post_login_redirect");

    if (target) {
      if (location.pathname === target) {
        // ✅ SUCCESS: We have arrived at the target (e.g., /checkout).
        // Now it is safe to remove the key so we don't redirect again.
        sessionStorage.removeItem("post_login_redirect");
      } else {
        // ⏳ PENDING: We are not at the target yet (e.g., we are at /).
        // Redirect the user, but DO NOT remove the key yet. 
        // We will remove it in the next render when we actually arrive.
        navigate(target, { replace: true });
      }
    }
  }, [isLoaded, isSignedIn, location.pathname, navigate]);
  return null;
}



const App = () => {
  return (
    <UserProvider>
      <ProductProvider>
        <OrderProvider>
          <CartProvider>
            <CouponProvider>
              <ContactProvider>
                <ReviewProvider>
                  <NotificationProvider>
                    <Router>
                      <ScrollToTop />
                      <PostLoginRedirector />

                      {/* Suspense handles the loading state for lazy pages */}
                      {/* <Suspense fallback={<Loader text="Loading..." />}> */}
                      <SmoothScroll>
                        <Routes>

                          <Route element={<MainLayout />}>
                            {/* Home is now lazy-loaded here */}
                            <Route path="/" element={<Home />} />
                            <Route path="/about" element={<AboutUs />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/custom-combo" element={<CustomComboBuilder />} />
                            <Route path="/privacy" element={<PrivacyPolicy />} />
                            <Route path="/terms" element={<TermsAndConditions />} />
                            <Route path="/myorder" element={<MyOrder />} />
                            <Route path="/product/:productId" element={<ProductDetail />} />
                            <Route path="/wishlist" element={<Wishlist />} />
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/myaccount" element={<UserPage />} />
                            <Route path="/contact" element={<ContactUs />} />



                            <Route element={<CheckoutGuard />}>
                              <Route path="/checkout" element={<Checkout />} />
                            </Route>
                            <Route path="/order-confirmation" element={<Confirmation />} />
                          </Route>
                          <Route path="/Admin" element={
                            <AdminProvider>
                              <Adminpannel />
                            </AdminProvider>
                          }
                          />

                          <Route path="/login" element={<Login />} />

                          <Route
                            path="/sso-callback"
                            element={
                              <>
                                <AuthenticateWithRedirectCallback />
                                <SsoCallbackLoader />
                              </>
                            }
                          />

                        </Routes>
                      </SmoothScroll>
                      {/* </Suspense> */}
                    </Router>
                  </NotificationProvider>
                </ReviewProvider>
              </ContactProvider>
            </CouponProvider>
          </CartProvider>
        </OrderProvider>
      </ProductProvider>
    </UserProvider>
  );
};

export default App;