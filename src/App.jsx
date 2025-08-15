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
import { UserProvider, useUserContext } from "./contexts/UserContext"; // Assuming a custom hook exists
import { useCart } from "./contexts/CartContext"; // Assuming custom hooks exist
import { useWishlist } from "./contexts/WishlistContext"; // Assuming this context exists

import { useUser } from "@clerk/clerk-react";
import { db } from "../configs";
import { usersTable } from "../configs/schema";
import { eq } from "drizzle-orm";

/**
 * Handles post-login redirects using session storage.
 * @returns {null}
 */
const PostLoginRedirector = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const target = sessionStorage.getItem("post_login_redirect");
    if (target && location.pathname !== target) {
      sessionStorage.removeItem("post_login_redirect");
      navigate(target, { replace: true });
    }
  }, [isLoaded, isSignedIn, location.pathname, navigate]);

  return null;
};

const App = () => {
  // It's better to manage cart and wishlist state via contexts
  // The state in App.jsx was redundant and could cause issues
  // if other components updated the state directly via context.
  const { cart } = useCart();
  const { wishlist } = useWishlist(); // Assuming a WishlistContext exists

  // Clerk's useUser hook is a good way to get user data
  const { user } = useUser();
  const [isNavbarVisible, setNavbarVisible] = useState(true);

  // This effect is a good practice for synchronizing user data with your database
  // It should be moved inside a UserContext or a dedicated hook to keep App.jsx clean.
  // I've left it here for now, but commented on the improvement.
  //
  // useEffect(() => {
  //   if (user && user.id) {
  //     // Logic to upsert user data into your database
  //     // const upsertUser = async () => { ... }
  //     // upsertUser();
  //   }
  // }, [user]);


  return (
    <UserProvider>
      <ProductProvider>
        <OrderProvider>
          <CartProvider>
            <CouponProvider>
              <ContactProvider>
                {/* It's better to wrap a WishlistProvider around the router
                  to make the wishlist state globally accessible via a hook.
                  <WishlistProvider> 
                */}
                <Router>
                  <ScrollToTop />
                  <PostLoginRedirector />

                  {/* Using custom hooks to get counts directly from context */}
                  <Navbar
                    cartCount={cart.length}
                    wishlistCount={wishlist.length}
                    onVisibilityChange={setNavbarVisible}
                  />

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
                          {/* Passing cart/wishlist state via props is no longer necessary 
                            if components consume the data from context hooks.
                            <Products />
                          */}
                          <Products />
                          <TestimonialsSection />
                        </>
                      }
                    />

                    {/* Public: Auth & other pages */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/myorder" element={<MyOrder />} />
                    <Route path="/product/:productId" element={<ProductDetail />} />
                    
                    {/* With context hooks, you can render components without passing props.
                      <Wishlist />
                    */}
                    <Route path="/wishlist" element={<Wishlist />} />

                    {/* Same for Cart.
                      <Cart />
                    */}
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
                {/* </WishlistProvider> */}
              </ContactProvider>
            </CouponProvider>
          </CartProvider>
        </OrderProvider>
      </ProductProvider>
    </UserProvider>
  );
};

export default App;
