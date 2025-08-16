import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { UserContext } from "./UserContext";

export const CartContext = createContext();

const LS_CART_KEY = "guestCart";
const LS_WISHLIST_KEY = "guestWishlist";

const readLS = (key) => {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return [];
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Error reading from local storage:", err);
    return [];
  }
};

const writeLS = (key, data) => {
  try {
    const serializedState = JSON.stringify(data);
    localStorage.setItem(key, serializedState);
  } catch (err) {
    console.error("Error writing to local storage:", err);
  }
};

export const CartProvider = ({ children }) => {
  const { userdetails, isSignedIn } = useContext(UserContext);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isWishlistLoading, setIsWishlistLoading] = useState(true);
  const [buyNow, setBuyNow] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const getCartitems = useCallback(async () => {
    setIsCartLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}`);
      if (!res.ok) throw new Error("Failed to fetch cart");
      const rows = await res.json();
      setCart(rows);
    } catch (e) {
      console.error("getCartitems error:", e);
      setCart([]);
    } finally {
      setIsCartLoading(false);
    }
  }, [userdetails?.id, BACKEND_URL]);

  const getwishlist = useCallback(async () => {
    setIsWishlistLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/wishlist/${userdetails.id}`);
      if (!res.ok) throw new Error("Failed to fetch wishlist");
      const rows = await res.json();
      setWishlist(rows);
    } catch (e) {
      console.error("getwishlist error:", e);
      setWishlist([]);
    } finally {
      setIsWishlistLoading(false);
    }
  }, [userdetails?.id, BACKEND_URL]);

  const addToCart = useCallback(
    async (product, quantity = 1) => {
      if (!isSignedIn) {
        const existing = cart.find((i) => i.product.id === product.id);
        const qtyToAdd = Number(quantity || 1);
        let newCart;
        if (existing) {
          newCart = cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + qtyToAdd }
              : item
          );
        } else {
          newCart = [...cart, { product, quantity: qtyToAdd }];
        }
        setCart(newCart);
        writeLS(LS_CART_KEY, newCart);
        return true;
      }
      if (!userdetails?.id) {
        console.error("User not signed in or user ID is missing.");
        return false;
      }

      const existing = cart.find((i) => i.product?.id === product.id);
      const qtyToAdd = Number(quantity || 1);

      const optimisticUpdate = existing
        ? cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + qtyToAdd }
              : item
          )
        : [...cart, { product, quantity: qtyToAdd }];

      setCart(optimisticUpdate);

      try {
        if (existing) {
          const newQty = Number(existing.quantity || 1) + qtyToAdd;
          const res = await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${product.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: newQty }),
          });
          if (!res.ok) throw new Error("Failed to update cart item");
        } else {
          const res = await fetch(`${BACKEND_URL}/api/cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userdetails.id, productId: product.id, quantity: qtyToAdd }),
          });
          if (!res.ok) throw new Error("Failed to add new cart item");
        }
        await getCartitems();
        return true;
      } catch (e) {
        console.error("addToCart error:", e);
        await getCartitems();
        return false;
      }
    },
    [cart, isSignedIn, userdetails?.id, getCartitems, BACKEND_URL]
  );

  const removeFromCart = useCallback(
    async (product) => {
      if (!isSignedIn) {
        const newCart = cart.filter((item) => item.product.id !== product.id);
        setCart(newCart);
        writeLS(LS_CART_KEY, newCart);
        return;
      }

      const optimisticUpdate = cart.filter((item) => item.product?.id !== product.id);
      setCart(optimisticUpdate);

      try {
        const res = await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${product.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to remove cart item");
        await getCartitems();
      } catch (e) {
        console.error("removeFromCart error:", e);
        await getCartitems();
      }
    },
    [cart, isSignedIn, userdetails?.id, getCartitems, BACKEND_URL]
  );

  const changeCartQuantity = useCallback(
    async (product, nextQty) => {
      if (!isSignedIn) {
        if (nextQty <= 0) {
          removeFromCart(product);
        } else {
          const newCart = cart.map((item) =>
            item.product.id === product.id ? { ...item, quantity: nextQty } : item
          );
          setCart(newCart);
          writeLS(LS_CART_KEY, newCart);
        }
        return;
      }

      if (nextQty <= 0) {
        removeFromCart(product);
      } else {
        const optimisticUpdate = cart.map((item) =>
          item.product?.id === product.id ? { ...item, quantity: nextQty } : item
        );
        setCart(optimisticUpdate);
        try {
          const res = await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${product.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: nextQty }),
          });
          if (!res.ok) throw new Error("Failed to update cart quantity");
          await getCartitems();
        } catch (e) {
          console.error("changeCartQuantity error:", e);
          await getCartitems();
        }
      }
    },
    [cart, isSignedIn, userdetails?.id, getCartitems, removeFromCart, BACKEND_URL]
  );

  const clearCart = useCallback(async () => {
    if (!isSignedIn) {
      setCart([]);
      writeLS(LS_CART_KEY, []);
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to clear cart");
      setCart([]);
    } catch (e) {
      console.error("clearCart error:", e);
      await getCartitems();
    }
  }, [isSignedIn, userdetails?.id, getCartitems, BACKEND_URL]);

  const addToWishlist = useCallback(
    async (product) => {
      if (!isSignedIn) {
        const existing = wishlist.some((item) => item.product.id === product.id);
        if (existing) return false;
        const newWishlist = [...wishlist, { product, productId: product.id }];
        setWishlist(newWishlist);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        return true;
      }
      if (!userdetails?.id) return false;
      try {
        const res = await fetch(`${BACKEND_URL}/api/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userdetails.id, productId: product.id }),
        });
        if (res.status === 409) return false; // Already in wishlist
        if (!res.ok) throw new Error("Failed to add to wishlist");
        await getwishlist();
        return true;
      } catch (e) {
        console.error("addToWishlist error:", e);
        await getwishlist();
        return false;
      }
    },
    [wishlist, isSignedIn, userdetails?.id, getwishlist, BACKEND_URL]
  );

  const removeFromWishlist = useCallback(
    async (product) => {
      if (!isSignedIn) {
        const newWishlist = wishlist.filter((item) => item.product.id !== product.id);
        setWishlist(newWishlist);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        return;
      }
      if (!userdetails?.id) return;
      try {
        await fetch(`${BACKEND_URL}/api/wishlist/${userdetails.id}/${product.id}`, {
          method: "DELETE",
        });
        await getwishlist();
      } catch (e) {
        console.error("removeFromWishlist error:", e);
        await getwishlist();
      }
    },
    [wishlist, isSignedIn, userdetails?.id, getwishlist, BACKEND_URL]
  );

const toggleWishlist = useCallback(
    async (product) => {
      if (!isSignedIn) {
        if (wishlist?.some((item) => item.product?.id === product.id)) {
          removeFromWishlist(product);
        } else {
          addToWishlist(product);
        }
        return;
      }
  
      if (!userdetails?.id) {
        toast.error("Please sign in to manage your wishlist.");
        return;
      }
  
      const isAlreadyInWishlist = wishlist?.some(
        (item) => item.product?.id === product.id
      );
  
      if (isAlreadyInWishlist) {
        await removeFromWishlist(product);
      } else {
        await addToWishlist(product);
      }
    },
    [wishlist, isSignedIn, userdetails?.id, addToWishlist, removeFromWishlist]
  );
  



  const mergeGuestCartIntoDB = useCallback(async () => {
    const guestCart = readLS(LS_CART_KEY);
    if (guestCart.length === 0) return;
    for (const item of guestCart) {
      await addToCart(item.product, item.quantity);
    }
    writeLS(LS_CART_KEY, []);
  }, [addToCart]);

  const mergeGuestWishlistIntoDB = useCallback(async () => {
    const guestWishlist = readLS(LS_WISHLIST_KEY);
    if (guestWishlist.length === 0) return;
    for (const item of guestWishlist) {
      await addToWishlist(item.product);
    }
    writeLS(LS_WISHLIST_KEY, []);
  }, [addToWishlist]);

  // Handle guest data loading on first mount
  useEffect(() => {
    if (!isSignedIn) {
      setCart(readLS(LS_CART_KEY));
      setWishlist(readLS(LS_WISHLIST_KEY));
      setIsCartLoading(false);
      setIsWishlistLoading(false);
    }
  }, [isSignedIn]);

  // Handle data fetching for signed-in users
  const mergedOnceRef = useRef(false);
  useEffect(() => {
    if (isSignedIn && userdetails?.id) {
      // Fetch data for signed-in user
      getCartitems();
      getwishlist();

      // Merge guest data only once after sign-in
      if (!mergedOnceRef.current) {
        mergedOnceRef.current = true;
        (async () => {
          await mergeGuestCartIntoDB();
          await mergeGuestWishlistIntoDB();
        })();
      }
    } else if (!isSignedIn) {
      mergedOnceRef.current = false;
    }
  }, [isSignedIn, userdetails?.id, getCartitems, getwishlist, mergeGuestCartIntoDB, mergeGuestWishlistIntoDB]);

  const startBuyNow = useCallback((product, quantity) => {
    setBuyNow({ product, quantity });
  }, []);

  const clearBuyNow = useCallback(() => {
    setBuyNow(null);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        buyNow,
        isCartLoading,
        isWishlistLoading,
        getCartitems,
        addToCart,
        removeFromCart,
        changeCartQuantity,
        clearCart,
        getwishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        startBuyNow,
        clearBuyNow,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};