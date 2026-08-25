import React, { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

// --- Minimal Imports (Load these immediately for LCP) ---
import Home from "../pages/Home";
import MainLayout from "../pages/MainLayout";
import SsoCallbackLoader from "../Components/SsoCallbackLoader";

// --- Lazy Load the Heavy Stuff ---
const Products = lazy(() => import("../pages/Products"));
const ProductDetail = lazy(() => import("../pages/ProductDetail"));
const Cart = lazy(() => import("../pages/Cart"));
const Login = lazy(() => import("../pages/CustomAuthModal"));
const Adminpannel = lazy(() => import("../pages/Adminpanel"));
const MyOrder = lazy(() => import("../pages/MyOrder"));
const Wishlist = lazy(() => import("../pages/Wishlist"));
const Checkout = lazy(() => import("../pages/Checkout"));
const Confirmation = lazy(() => import("../pages/Confirmation"));
const UserPage = lazy(() => import("../pages/UserPage"));
const ContactUs = lazy(() => import("../pages/ContactUs"));
const PrivacyPolicy = lazy(() => import("../pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("../pages/TermsAndConditions"));
const CustomComboBuilder = lazy(() => import("../pages/CustomComboBuilder"));
const AboutUs = lazy(() => import("../pages/AboutUs"));

import CheckoutGuard from "./guards/CheckoutGuard";
import AdminGuard from "./guards/AdminGuard";

const AppRouter = () => {
  return (
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
        <Route path="/myaccount/:tab" element={<UserPage />} />
        <Route path="/contact" element={<ContactUs />} />

        <Route element={<CheckoutGuard />}>
          <Route path="/checkout" element={<Checkout />} />
        </Route>
        <Route path="/order-confirmation" element={<Confirmation />} />
      </Route>
      <Route element={<AdminGuard />}>
        <Route path="/Admin" element={<Adminpannel />} />
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
  );
};

export default AppRouter;
