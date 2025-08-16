import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { UserContext } from "./UserContext";
import { toast } from "react-toastify";

export const CartContext = createContext();

const LS_CART_KEY = "guestCart";
const LS_WISHLIST_KEY = "guestWishlist";
const LS_BUY_NOW_KEY = "buyNowItem"; // New key for the buy now item

const readLS = (key) => {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      // If the key is for buyNow, return null, otherwise return empty array
      return key === LS_BUY_NOW_KEY ? null : [];
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Error reading from local storage:", err);
    return key === LS_BUY_NOW_KEY ? null : [];
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

const removeLS = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error("Error removing from local storage:", err);
  }
};

export const CartProvider = ({ children }) => {
  const { userdetails, isSignedIn } = useContext(UserContext);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isWishlistLoading, setIsWishlistLoading] = useState(true);
  // Initialize buyNow state from local storage
  const [buyNow, setBuyNow] = useState(() => readLS(LS_BUY_NOW_KEY));

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
        toast.success("Added to Cart!");
        return true;
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
        if (!userdetails?.id) {
          throw new Error("User ID is missing.");
        }
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
        toast.success("Added to Cart!");
        return true;
      } catch (e) {
        console.error("addToCart error:", e);
        toast.error(e.message);
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
        toast.info("Item removed from cart.");
        return;
      }

      const optimisticUpdate = cart.filter((item) => item.product?.id !== product.id);
      setCart(optimisticUpdate);

      try {
        if (!userdetails?.id) throw new Error("User ID is missing.");
        const res = await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${product.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to remove cart item");
        await getCartitems();
        toast.info("Item removed from cart.");
      } catch (e) {
        console.error("removeFromCart error:", e);
        toast.error(e.message);
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
          if (!userdetails?.id) throw new Error("User ID is missing.");
          const res = await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${product.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: nextQty }),
          });
          if (!res.ok) throw new Error("Failed to update cart quantity");
          await getCartitems();
        } catch (e) {
          console.error("changeCartQuantity error:", e);
          toast.error(e.message);
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
      toast.info("Cart cleared.");
      return;
    }
    try {
      if (!userdetails?.id) throw new Error("User ID is missing.");
      const res = await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to clear cart");
      setCart([]);
      toast.info("Cart cleared.");
    } catch (e) {
      console.error("clearCart error:", e);
      toast.error(e.message);
      await getCartitems();
    }
  }, [isSignedIn, userdetails?.id, getCartitems, BACKEND_URL]);

  const addToWishlist = useCallback(
    async (product) => {
      if (!isSignedIn) {
        const existing = wishlist.some((item) => item.product?.id === product.id);
        if (existing) {
          toast.info("Item is already in your wishlist!");
          return false;
        }
        const newWishlist = [...wishlist, { product, productId: product.id }];
        setWishlist(newWishlist);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        toast.success("Added to wishlist!");
        return true;
      }

      try {
        if (!userdetails?.id) {
          throw new Error("User ID is missing.");
        }
        
        const existing = wishlist.some((item) => item.product?.id === product.id);
        if(existing) {
          toast.info("Item is already in your wishlist!");
          return false;
        }

        const res = await fetch(`${BACKEND_URL}/api/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userdetails.id, productId: product.id }),
        });
        
        if (!res.ok) throw new Error("Failed to add to wishlist");
        
        await getwishlist();
        toast.success("Added to wishlist!");
        return true;
      } catch (e) {
        console.error("addToWishlist error:", e);
        toast.error(e.message);
        await getwishlist();
        return false;
      }
    },
    [wishlist, isSignedIn, userdetails?.id, getwishlist, BACKEND_URL]
  );

  const removeFromWishlist = useCallback(
    async (product) => {
      if (!isSignedIn) {
        const newWishlist = wishlist.filter((item) => item.product?.id !== product.id);
        setWishlist(newWishlist);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        toast.info("Item removed from wishlist.");
        return;
      }
      
      try {
        if (!userdetails?.id) throw new Error("User ID is missing.");
        await fetch(`${BACKEND_URL}/api/wishlist/${userdetails.id}/${product.id}`, {
          method: "DELETE",
        });
        await getwishlist();
        toast.info("Item removed from wishlist.");
      } catch (e) {
        console.error("removeFromWishlist error:", e);
        toast.error(e.message);
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

  const mergedOnceRef = useRef(false);
  useEffect(() => {
    if (isSignedIn && userdetails?.id) {
      getCartitems();
      getwishlist();

      if (!mergedOnceRef.current) {
        mergedOnceRef.current = true;
        (async () => {
          await mergeGuestCartIntoDB();
          await mergeGuestWishlistIntoDB();
        })();
      }
    } else if (!isSignedIn) {
      setCart(readLS(LS_CART_KEY));
      setWishlist(readLS(LS_WISHLIST_KEY));
      setIsCartLoading(false);
      setIsWishlistLoading(false);
      mergedOnceRef.current = false;
    }
  }, [isSignedIn, userdetails?.id, getCartitems, getwishlist, mergeGuestCartIntoDB, mergeGuestWishlistIntoDB]);

  // Update local storage when buyNow state changes
  useEffect(() => {
    if (buyNow) {
      writeLS(LS_BUY_NOW_KEY, buyNow);
    }
  }, [buyNow]);

  const startBuyNow = useCallback((product, quantity) => {
    const item = { product, quantity };
    setBuyNow(item);
    // The useEffect above will handle writing to local storage
  }, []);

  const clearBuyNow = useCallback(() => {
    setBuyNow(null);
    removeLS(LS_BUY_NOW_KEY); // Clear from local storage
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
