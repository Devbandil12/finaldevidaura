// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";

// Layout & pages
import Navbar from "./Components/Navbar";
import MobileBackBar from "./Components/MobileBackBar";
import HeroSection from "./Components/HeroSection";
import Footer from "./Components/Footer";
import Login from "./Components/CustomAuthModal";         // /login page (unchanged)
import Products from "./Components/Products";
import MyOrder from "./Components/MyOrder";
import Wishlist from "./Components/Wishlist";
import Cart from "./Components/Cart";
import Checkout from "./Components/Checkout";
import Adminpannel from "./Components/Adminpanel";
import ContactUs from "./Components/ContactUs";
import CheckoutGuard from "./CheckoutGuard";

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

/**
 * Watches login state while on /login.
 * If a post-login target exists in sessionStorage (e.g. "/cart"),
 * redirect there immediately after Clerk reports the user is signed in.
 * This lets the login page remain unchanged.
 */
function PostLoginRedirector() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
const [heroStart, setHeroStart] = useState(false);


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
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const { user } = useUser();
  const [isNavbarVisible, setNavbarVisible] = useState(true);

  // Upsert new users into your DB
  const isNewUser = useCallback(async () => {
    if (!user) return;

    try {
      const existing = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, user.primaryEmailAddress.emailAddress));

      if (existing.length === 0) {
        await db.insert(usersTable).values({
          name: user.fullName,
          email: user.primaryEmailAddress.emailAddress,
        });
      }
    } catch (err) {
      console.error("Error checking new user:", err);
    }
  }, [user]);

  useEffect(() => {
    isNewUser();
  }, [user, isNewUser]);

  return (
    <UserProvider>
      <ProductProvider>
        <OrderProvider>
          <CartProvider>
            <CouponProvider>
              <ContactProvider>
                <Router>
                  <ScrollToTop />
                  <PostLoginRedirector /> {/* NEW: global watcher */}

                 <Navbar
  cartCount={cart.length}
  wishlistCount={wishlist.length}
  onVisibilityChange={setNavbarVisible}
  onNavAnimationComplete={() => setHeroStart(true)} // ✅ this triggers hero animation
/>


                  <MobileBackBar isNavbarVisible={isNavbarVisible} />

                  <Routes>
                    {/* Public: Home */}
                    <Route
                      path="/"
                      element={
                        <>
                         <HeroSection animate={heroStart} />

                          <Products
                            cart={cart}
                            setCart={setCart}
                            wishlist={wishlist}
                            setWishlist={setWishlist}
                          />
                        </>
                      }
                    />

                    {/* Public: Auth & other pages */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/myorder" element={<MyOrder />} />
                    <Route
                      path="/wishlist"
                      element={
                        <Wishlist
                          wishlist={wishlist}
                          setWishlist={setWishlist}
                          cart={cart}
                          setCart={setCart}
                        />
                      }
                    />
                    <Route
                      path="/cart"
                      element={
                        <Cart
                          cart={cart}
                          setCart={setCart}
                          wishlist={wishlist}
                          setWishlist={setWishlist}
                        />
                      }
                    />
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
