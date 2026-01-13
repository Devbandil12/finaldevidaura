import React, { lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// --- Components ---
import MainLayout from "./MainLayout"; // Import the isolated layout

// --- Static Components (Home) ---
import HeroSection from "./HeroSection";
import AboutUs from "./AboutUs";
import Products from "./Products";
import ProductShowcaseCarousel from "./ProductShowcaseCarousel";
import DualMarquee from "./DualMarquee";
import TestimonialsSection from "./TestimonialsSection";
import CustomComboBuillder from "./CustomComboBuilder";

// --- Lazy Loaded Components ---
const Adminpannel = lazy(() => import("./Adminpanel"));
const ProductDetail = lazy(() => import("./ProductDetail"));
const MyOrder = lazy(() => import("./MyOrder"));
const Wishlist = lazy(() => import("./Wishlist"));
const Cart = lazy(() => import("./Cart"));
const Checkout = lazy(() => import("./Checkout"));
const UserPage = lazy(() => import("./UserPage"));
const ContactUs = lazy(() => import("./ContactUs"));
const PrivacyPolicy = lazy(() => import("./PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./TermsAndConditions"));
const Login = lazy(() => import("./CustomAuthModal"));

// --- Utilities ---
import CheckoutGuard from "../CheckoutGuard";
import { AdminProvider } from "../contexts/AdminContext";

// Helper for Home Page Composition
const HomePage = () => (
<>
    <HeroSection />
    <DualMarquee />
    <div id="scents-section"><ProductShowcaseCarousel /></div>
    <div id="collection-section"><Products /></div>
    <div id="custom-combo-section"><CustomComboBuillder /></div>
    <div id="about-section"><AboutUs /></div>
    <TestimonialsSection />
  </>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Routes>
      {/* ✅ CORRECT USAGE: 
          MainLayout is the PARENT route. It stays mounted.
          The animations happen ONLY in the child element.
      */}
      <Route element={<MainLayout />}>
        <Route
          path="*"
          element={
           
              <Routes location={location} key={location.pathname}>
                
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

                <Route path="/Admin" element={
                  <AdminProvider>
                    <Adminpannel />
                  </AdminProvider>
                } />

                <Route element={<CheckoutGuard />}>
                  <Route path="/checkout" element={<Checkout />} />
                </Route>

              </Routes>
      
          }
        />
      </Route>

      {/* Login is outside the MainLayout */}
      <Route path="/login" element={<Login />} />

    </Routes>
  );
};

export default AnimatedRoutes;