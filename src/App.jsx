// src/App.js

import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Layout & pages
import Navbar from "./Components/Navbar";
import HeroSection from "./Components/HeroSection";
import Footer from "./Components/Footer";
import Login from "./Components/Register";
import Products from "./Components/Products";
import MyOrder from "./Components/MyOrder";
import Wishlist from "./Components/Wishlist";
import Cart from "./Components/Cart";
import Checkout from "./Components/Checkout";
import Adminpannel from "./Components/Adminpanel";
import ContactUs from "./Components/ContactUs";

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

const App = () => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const { user } = useUser();

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
                  <Navbar
                    cartCount={cart.length}
                    wishlistCount={wishlist.length}
                  />
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <>
                          <HeroSection />
                          <Products
                            cart={cart}
                            setCart={setCart}
                            wishlist={wishlist}
                            setWishlist={setWishlist}
                          />
                        </>
                      }
                    />
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
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/Admin" element={<Adminpannel />} />
                    <Route path="/contact" element={<ContactUs />} />
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
