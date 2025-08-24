// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";

// Layout & pages
import Navbar from "./Components/Navbar";
import MobileBackBar from "./Components/MobileBackBar";
import HeroSection from "./Components/HeroSection";
import Footer from "./Components/Footer";
import Login from "./Components/CustomAuthModal";
import Products from "./Components/Products";
import MyOrder from "./Components/MyOrder";
import Wishlist from "./Components/Wishlist";
import Cart from "./Components/Cart";
import Checkout from "./Components/Checkout";
import Adminpannel from "./Components/Adminpanel";
import ContactUs from "./Components/ContactUs";
import CheckoutGuard from "./CheckoutGuard";
import ProductShowcaseCarousel from "./Components/ProductShowcaseCarousel";
import DualMarquee from "./Components/DualMarquee";
import TestimonialsSection from "./Components/TestimonialsSection";
import ProductDetail from "./Components/ProductDetail";

// Styles
import "./style/adminPanel.css";

// Utilities & Contexts
import ScrollToTop from "./ScrollToTop";
import { ProductProvider } from "./contexts/productContext";
import { OrderProvider } from "./contexts/OrderContext";
import { CartProvider } from "./contexts/CartContext";
import { CouponProvider } from "./contexts/CouponContext";
import { ContactProvider } from "./contexts/ContactContext";
import { UserProvider } from "./contexts/UserContext";
import { AdminProvider } from "./contexts/AdminContext";

import { useUser } from "@clerk/clerk-react";
import { db } from "../configs";
import { usersTable } from "../configs/schema";
import { eq } from "drizzle-orm";

// Utilities: Global error reporting
const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
const LOG_ERROR_URL = API_BASE ? `${API_BASE}/api/log-error` : "/api/log-error";

// helper: send error to backend
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

// Global error + unhandled rejection handler
if (typeof window !== "undefined") {
  // Runtime errors
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
    return false; // prevent default browser popup
  };

  // Unhandled Promise rejections
  window.onunhandledrejection = function (event) {
    const details = {
      reason: event.reason?.message || event.reason || "Unknown",
      stack: event.reason?.stack || "N/A",
    };

    console.error("Unhandled Promise Rejection:", details);
    reportError("promiseRejection", details);
  };
}





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

const App = () => {
  const { user } = useUser();
  const [isNavbarVisible, setNavbarVisible] = useState(true);

useEffect(() => {
  const handler = (e) => {
    const btn = e.target.closest("button"); // catch clicks only on <button>
    if (!btn) return;

    // Add .button-hero class to all buttons (for styling)
    btn.classList.add("button-hero");

    const circle = document.createElement("span");
    circle.classList.add("pulse");

    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;

    const rect = btn.getBoundingClientRect();
    const top = e.clientY - rect.top - radius;
    const left = e.clientX - rect.left - radius;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.top = `${top}px`;
    circle.style.left = `${left}px`;

    const oldPulse = btn.querySelector(".pulse");
    if (oldPulse) oldPulse.remove();

    btn.appendChild(circle);

    circle.addEventListener("animationend", () => circle.remove());
  };

  document.addEventListener("click", handler);
  return () => document.removeEventListener("click", handler);
}, []);


  return (
    <UserProvider>
      <ProductProvider>
        <OrderProvider>
          <CartProvider>
            <CouponProvider>
              <ContactProvider>
                <Router>
                  <ScrollToTop />
                  <PostLoginRedirector />
                  <Navbar isVisible={isNavbarVisible} />
                  <MobileBackBar />
                  <Routes>
                    {/* Public: Main pages */}
                    <Route
                      path="/"
                      element={
                        <>
                          <HeroSection />
                          <DualMarquee />
                          <ProductShowcaseCarousel />
                          {/* Products no longer receives props */}
                          <Products />
                          <TestimonialsSection />
                        </>
                      }
                    />

                    {/* Public: Auth & other pages */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/myorder" element={<MyOrder />} />
                    <Route path="/product/:productId" element={<ProductDetail />} />
                    {/* Wishlist no longer receives props */}
                    <Route path="/wishlist" element={<Wishlist />} />
                    {/* Cart no longer receives props */}
                    <Route path="/cart" element={<Cart />} />
                    
                    {/* Admin route now wrapped with AdminProvider */}
                    <Route
                      path="/Admin"
                      element={
                        <AdminProvider>
                          <Adminpannel />
                        </AdminProvider>
                      }
                    />

                    <Route path="/contact" element={<ContactUs />} />

                    {/* Checkout: guarded by intent, never open directly */}
                    <Route element={<CheckoutGuard />}>
                      <Route path="/checkout" element={<Checkout />} />
                    </Route>
                  </Routes>

                  <Footer />
                </Router>
              </ContactProvider>
            </CouponProvider>
          </CartProvider>
        </OrderProvider>
      </ProductProvider>
    </UserProvider>
  );
};

export default App;