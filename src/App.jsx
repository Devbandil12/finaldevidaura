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

import { useUser } from "@clerk/clerk-react";
import { db } from "../configs";
import { usersTable } from "../configs/schema";
import { eq } from "drizzle-orm";

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
  // REMOVED: cart and wishlist state are now managed by CartProvider
  // const [cart, setCart] = useState([]);
  // const [wishlist, setWishlist] = useState([]);
  const { user } = useUser();
  const [isNavbarVisible, setNavbarVisible] = useState(true);

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

                  {/* Navbar now gets cart/wishlist from its own context consumer */}
                  <Navbar onVisibilityChange={setNavbarVisible} />
                  
                  <MobileBackBar isNavbarVisible={isNavbarVisible} />

                  <Routes>
                    {/* Public: Home */}
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
                    <Route path="/Admin" element={<Adminpannel />} />
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
