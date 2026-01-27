// src/App.jsx
import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useUser, AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

// --- Minimal Imports (Load these immediately for LCP) ---
import SmoothScroll from "./Components/SmoothScroll";
import SsoCallbackLoader from "./Components/SsoCallbackLoader";
import Home from "./pages/Home"; // Eager load Home for faster LCP
import MainLayout from "./pages/MainLayout";
import Loader from "./Components/Loader";

// --- Lazy Load the Heavy Stuff ---
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

// --- Utilities & Contexts ---
import CheckoutGuard from "./CheckoutGuard";
import { ProductProvider } from "./contexts/productContext";
import { OrderProvider } from "./contexts/OrderContext";
import { CartProvider } from "./contexts/CartContext";
import { CouponProvider } from "./contexts/CouponContext";
import { ContactProvider } from "./contexts/ContactContext";
import { UserProvider } from "./contexts/UserContext";
import { AdminProvider } from "./contexts/AdminContext";
import { ReviewProvider } from "./contexts/ReviewContext";
import { NotificationProvider } from "./contexts/NotificationContext";

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
  const originalErrorHandler = window.onerror;
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    if (msg.includes("ResizeObserver loop completed with undelivered notifications")) {
      return true;
    }
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
}

function PostLoginRedirector() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (location.pathname === "/sso-callback") return;
    if (!isLoaded || !isSignedIn) return;

    const target = sessionStorage.getItem("post_login_redirect");
    if (target) {
      if (location.pathname === target) {
        sessionStorage.removeItem("post_login_redirect");
      } else {
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
                      <PostLoginRedirector />
                      <Suspense fallback={<Loader text="Loading..." />}>
                      <SmoothScroll>
                        <Routes>
                          <Route element={<MainLayout />}>
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
                      </Suspense>
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