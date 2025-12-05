// src/App.jsx
import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useUser, AuthenticateWithRedirectCallback  } from "@clerk/clerk-react";

// --- Minimal Imports (Load these immediately) ---
import Navbar from "./Components/Navbar";
import MobileBackBar from "./Components/MobileBackBar";
import Footer from "./Components/Footer";
import Loader from "./Components/LoginLoader";
import SsoCallbackLoader from "./Components/SsoCallbackLoader";
import Home from "./Components/Home";

// --- Lazy Load the Heavy Stuff ---
// These won't load when the user is just logging in
// const Home = lazy(() => import("./Components/Home"));
const Products = lazy(() => import("./Components/Products"));
const ProductDetail = lazy(() => import("./Components/ProductDetail"));
const Cart = lazy(() => import("./Components/Cart"));
const Login = lazy(() => import("./Components/CustomAuthModal"));
const Adminpannel = lazy(() => import("./Components/Adminpanel"));
const MyOrder = lazy(() => import("./Components/MyOrder"));
const Wishlist = lazy(() => import("./Components/Wishlist"));
const Checkout = lazy(() => import("./Components/Checkout"));
const UserPage = lazy(() => import("./Components/UserPage"));
const ContactUs = lazy(() => import("./Components/ContactUs"));
const PrivacyPolicy = lazy(() => import("./Components/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./Components/TermsAndConditions"));

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
    if (!isLoaded || !isSignedIn) return;
    const target = sessionStorage.getItem("post_login_redirect");
    if (target) {
      sessionStorage.removeItem("post_login_redirect");
      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
    }
  }, [isLoaded, isSignedIn, location.pathname, navigate]);
  return null;
}

// --- Main Layout ---
const MainLayout = () => (
  <>
    <Navbar isVisible={true} />
    <MobileBackBar />
    <main><Outlet /></main>
    <Footer />
  </>
);

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

                      {/* Suspense handles the loading state for lazy components */}
                      {/* <Suspense fallback={<Loader text="Loading..." />}> */}
                        <Routes>

                          <Route element={<MainLayout />}>
                            {/* Home is now lazy-loaded here */}
                            <Route path="/" element={<Home />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/privacy" element={<PrivacyPolicy />} />
                            <Route path="/terms" element={<TermsAndConditions />} />
                            <Route path="/myorder" element={<MyOrder />} />
                            <Route path="/product/:productId" element={<ProductDetail />} />
                            <Route path="/wishlist" element={<Wishlist />} />
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/myaccount" element={<UserPage />} />
                            <Route path="/contact" element={<ContactUs />} />

                            <Route path="/Admin" element={
                              <AdminProvider>
                                <Adminpannel />
                              </AdminProvider>
                            }
                            />

                            <Route element={<CheckoutGuard />}>
                              <Route path="/checkout" element={<Checkout />} />
                            </Route>
                          </Route>

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