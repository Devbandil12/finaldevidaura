// src/contexts/CartContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { UserContext } from "./UserContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const { userdetails } = useContext(UserContext);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  const fetchCart = async () => {
    if (!userdetails?.id) return;
    setLoadingCart(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}`);
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error("❌ Error fetching cart:", err);
    } finally {
      setLoadingCart(false);
    }
  };

  const addToCart = async (productId, quantity) => {
    try {
      await fetch(`${BACKEND_URL}/api/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userdetails.id, productId, quantity }),
      });
      fetchCart();
    } catch (err) {
      console.error("❌ Error adding to cart:", err);
    }
  };

  const updateCartItem = async (id, quantity) => {
    try {
      await fetch(`${BACKEND_URL}/api/cart/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      fetchCart();
    } catch (err) {
      console.error("❌ Error updating cart:", err);
    }
  };

  const removeFromCart = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/api/cart/${id}`, { method: "DELETE" });
      fetchCart();
    } catch (err) {
      console.error("❌ Error removing cart item:", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [userdetails]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loadingCart,
        fetchCart,
        addToCart,
        updateCartItem,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
