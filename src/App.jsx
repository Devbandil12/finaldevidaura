// src/App.jsx
import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, useNavigate } from "react-router-dom";

// --- Statically Imported Components (for initial load) ---
import Navbar from "./Components/Navbar";
import MobileBackBar from "./Components/MobileBackBar";
import Footer from "./Components/Footer";
import HeroSection from "./Components/HeroSection";
import AboutUs from "./Components/AboutUs";
import Products from "./Components/Products";
import ProductShowcaseCarousel from "./Components/ProductShowcaseCarousel";
import DualMarquee from "./Components/DualMarquee";
import TestimonialsSection from "./Components/TestimonialsSection";
import Loader from "./Components/Loader"; // Your fallback component

// --- Dynamically Imported (Lazy-Loaded) Components ---
const Adminpannel = lazy(() => import("./Components/Adminpanel"));
const ProductDetail = lazy(() => import("./Components/ProductDetail"));
const MyOrder = lazy(() => import("./Components/MyOrder"));
const Wishlist = lazy(() => import("./Components/Wishlist"));
const Cart = lazy(() => import("./Components/Cart"));
const Checkout = lazy(() => import("./Components/Checkout"));
const UserPage = lazy(() => import("./Components/UserPage"));
const ContactUs = lazy(() => import("./Components/ContactUs"));
const PrivacyPolicy = lazy(() => import("./Components/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./Components/TermsAndConditions"));
const Login = lazy(() => import("./Components/CustomAuthModal"));

// Utilities & Contexts
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
import { useUser } from "@clerk/clerk-react";

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

// --- Main Layout Component ---
const MainLayout = () => {
  return (
    <>
      <title>Devid Aura | Exquisite Perfumes & Fragrances</title>
      <meta name="description" content="More than perfume, Devid Aura is an invisible aura of confidence and artistry. Discover masterfully crafted fragrances that leave a memorable impression. Your signature scent awaits." />

      <Navbar isVisible={true} />
      <MobileBackBar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

// --- Home Page Component ---
const HomePage = () => {
  useEffect(() => {
    const target = sessionStorage.getItem("scrollToSection");
    if (target) {
      const el = document.getElementById(target);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 300); // wait a bit for page render
      }
      sessionStorage.removeItem("scrollToSection");
    }
  }, []);

  return (
    <>
      <HeroSection />
      <Suspense fallback={null}> {/* Use null or a minimal loader */}
        <DualMarquee />
        <div id="scents-section">
          <ProductShowcaseCarousel />
        </div>
        <div id="collection-section">
          <Products />
        </div>
        <div id="about-section">
          <AboutUs />
        </div>
        <TestimonialsSection />
      </Suspense>
    </>
  );
};



// --- App Component with Code Splitting ---
const App = () => {
  return (
    <UserProvider>
      <ProductProvider>
        <OrderProvider>
          <CartProvider>
            <CouponProvider>
              <ContactProvider>
                <ReviewProvider>
                  <Router>
                    <ScrollToTop />
                    <PostLoginRedirector />
                    {/* ✅ Wrap all routes in a single Suspense */}
                    <Suspense fallback={<Loader text="Loading Page..." />}>
                      <Routes>
                        <Route element={<MainLayout />}>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/privacy" element={<PrivacyPolicy />} />
                          <Route path="/terms" element={<TermsAndConditions />} />
                          <Route path="/myorder" element={<MyOrder />} />
                          <Route path="/product/:productId" element={<ProductDetail />} />
                          <Route path="/wishlist" element={<Wishlist />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/myaccount" element={<UserPage />} />
                          <Route path="/contact" element={<ContactUs />} />
                          <Route
                            path="/Admin"
                            element={
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
                      </Routes>
                    </Suspense>
                  </Router>
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