import React, { lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// --- Components ---
import MainLayout from "./MainLayout"; // Import the isolated layout
import PageTransition from "./PageTransition";

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
  <PageTransition>
    <HeroSection />
    <DualMarquee />
    <div id="scents-section"><ProductShowcaseCarousel /></div>
    <div id="collection-section"><Products /></div>
    <div id="custom-combo-section"><CustomComboBuillder /></div>
    <div id="about-section"><AboutUs /></div>
    <TestimonialsSection />
  </PageTransition>
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
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                
                <Route path="/" element={<HomePage />} />

                <Route path="/products" element={<PageTransition><Products /></PageTransition>} />
                <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
                <Route path="/terms" element={<PageTransition><TermsAndConditions /></PageTransition>} />
                <Route path="/myorder" element={<PageTransition><MyOrder /></PageTransition>} />
                <Route path="/product/:productId" element={<PageTransition><ProductDetail /></PageTransition>} />
                <Route path="/wishlist" element={<PageTransition><Wishlist /></PageTransition>} />
                <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
                <Route path="/myaccount" element={<PageTransition><UserPage /></PageTransition>} />
                <Route path="/contact" element={<PageTransition><ContactUs /></PageTransition>} />

                <Route path="/Admin" element={
                  <AdminProvider>
                    <PageTransition><Adminpannel /></PageTransition>
                  </AdminProvider>
                } />

                <Route element={<CheckoutGuard />}>
                  <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
                </Route>

              </Routes>
            </AnimatePresence>
          }
        />
      </Route>

      {/* Login is outside the MainLayout */}
      <Route path="/login" element={<PageTransition><Login /></PageTransition>} />

    </Routes>
  );
};

export default AnimatedRoutes;