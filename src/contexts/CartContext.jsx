import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { UserContext } from "./UserContext";

export const CartContext = createContext();

const LS_CART_KEY = "guestCart";
const LS_WISHLIST_KEY = "guestWishlist";
const LS_BUY_NOW_KEY = "buyNowItem";

const readLS = (key) => {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
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
  const [cart, setCart] = useState(() => readLS(LS_CART_KEY));
  const [wishlist, setWishlist] = useState(() => readLS(LS_WISHLIST_KEY));
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isWishlistLoading, setIsWishlistLoading] = useState(true);
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
      window.toast.error("Failed to load cart.");
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
      window.toast.error("Failed to load wishlist.");
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
        window.toast.success(`${product.name} added to cart.`);
        return true;
      }
      
      if (!userdetails?.id) {
        window.toast.error("Please sign in to add items to your cart.");
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
          await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${product.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: newQty }),
          });
        } else {
          await fetch(`${BACKEND_URL}/api/cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userdetails.id, productId: product.id, quantity: qtyToAdd }),
          });
        }
        await getCartitems();
        window.toast.success(`${product.name} added to cart.`);
        return true;
      } catch (e) {
        console.error("addToCart error:", e);
        window.toast.error(`Failed to add ${product.name} to cart.`);
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
        window.toast.info(`${product.name} removed from cart.`);
        return;
      }

      if (!userdetails?.id) {
        window.toast.error("Please sign in to remove items from your cart.");
        return;
      }

      const optimisticUpdate = cart.filter((item) => item.product?.id !== product.id);
      setCart(optimisticUpdate);

      try {
        await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${product.id}`, {
          method: "DELETE",
        });
        await getCartitems();
        window.toast.info(`${product.name} removed from cart.`);
      } catch (e) {
        console.error("removeFromCart error:", e);
        window.toast.error(`Failed to remove ${product.name} from cart.`);
        await getCartitems();
      }
    },
    [cart, isSignedIn, userdetails?.id, getCartitems, BACKEND_URL]
  );

  const changeCartQuantity = useCallback(
    async (product, nextQty) => {
      if (nextQty <= 0) {
        removeFromCart(product);
        return;
      }
      if (!isSignedIn) {
        const newCart = cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item
        );
        setCart(newCart);
        writeLS(LS_CART_KEY, newCart);
        return;
      }

      if (!userdetails?.id) {
        window.toast.error("Please sign in to update your cart.");
        return;
      }
      
      const optimisticUpdate = cart.map((item) =>
        item.product?.id === product.id ? { ...item, quantity: nextQty } : item
      );
      setCart(optimisticUpdate);
      try {
        await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: nextQty }),
        });
        await getCartitems();
      } catch (e) {
        console.error("changeCartQuantity error:", e);
        window.toast.error("Failed to update quantity.");
        await getCartitems();
      }
    },
    [cart, isSignedIn, userdetails?.id, getCartitems, removeFromCart, BACKEND_URL]
  );

  const clearCart = useCallback(async () => {
    if (!isSignedIn) {
      setCart([]);
      writeLS(LS_CART_KEY, []);
      window.toast.info("Cart cleared.");
      return;
    }

    if (!userdetails?.id) {
      window.toast.error("Please sign in to clear your cart.");
      return;
    }
    try {
      await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}`, {
        method: "DELETE",
      });
      setCart([]);
      window.toast.info("Cart cleared.");
    } catch (e) {
      console.error("clearCart error:", e);
      window.toast.error("Failed to clear cart.");
      await getCartitems();
    }
  }, [isSignedIn, userdetails?.id, getCartitems, BACKEND_URL]);

  const addToWishlist = useCallback(
    async (product) => {
      const existing = wishlist.some((item) => (item.productId ?? item.product?.id) === product.id);
      if (existing) {
        window.toast.info(`${product.name} is already in your wishlist!`);
        return false;
      }

      if (!isSignedIn) {
        const newWishlist = [...wishlist, { product, productId: product.id }];
        setWishlist(newWishlist);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        window.toast.success(`${product.name} added to wishlist.`);
        return true;
      }

      if (!userdetails?.id) {
        window.toast.error("Please sign in to add to your wishlist.");
        return false;
      }
      
      try {
        await fetch(`${BACKEND_URL}/api/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userdetails.id, productId: product.id }),
        });
        await getwishlist();
        window.toast.success(`${product.name} added to wishlist.`);
        return true;
      } catch (e) {
        console.error("addToWishlist error:", e);
        window.toast.error(`Failed to add ${product.name} to wishlist.`);
        await getwishlist();
        return false;
      }
    },
    [wishlist, isSignedIn, userdetails?.id, getwishlist, BACKEND_URL]
  );

  const removeFromWishlist = useCallback(
    async (product) => {
      if (!isSignedIn) {
        const newWishlist = wishlist.filter((item) => (item.productId ?? item.product?.id) !== product.id);
        setWishlist(newWishlist);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        window.toast.info(`${product.name} removed from wishlist.`);
        return;
      }
      
      if (!userdetails?.id) {
        window.toast.error("Please sign in to remove from your wishlist.");
        return;
      }
      
      try {
        await fetch(`${BACKEND_URL}/api/wishlist/${userdetails.id}/${product.id}`, {
          method: "DELETE",
        });
        await getwishlist();
        window.toast.info(`${product.name} removed from wishlist.`);
      } catch (e) {
        console.error("removeFromWishlist error:", e);
        window.toast.error(`Failed to remove ${product.name} from wishlist.`);
        await getwishlist();
      }
    },
    [wishlist, isSignedIn, userdetails?.id, getwishlist, BACKEND_URL]
  );

  const moveToWishlist = useCallback(
    async (product) => {
      const addedSuccessfully = await addToWishlist(product);
      if (!addedSuccessfully) {
        return false;
      }
      // Unlike addToWishlist, removeFromCart does not return a boolean, so we just call it.
      await removeFromCart(product);
      // We override the separate toasts with one clear confirmation message.
      window.toast.success(`${product.name} moved to wishlist.`);
      return true;
    },
    [addToWishlist, removeFromCart]
  );
  
  const clearWishlist = useCallback(async () => {
    if (!isSignedIn) {
      setWishlist([]);
      writeLS(LS_WISHLIST_KEY, []);
      window.toast.info("Wishlist cleared.");
      return;
    }

    if (!userdetails?.id) {
      window.toast.error("Please sign in to clear your wishlist.");
      return;
    }
    try {
      await fetch(`${BACKEND_URL}/api/wishlist/${userdetails.id}`, {
        method: "DELETE",
      });
      setWishlist([]);
      window.toast.info("Wishlist cleared.");
    } catch (e) {
      console.error("clearWishlist error:", e);
      window.toast.error("Failed to clear wishlist.");
      await getwishlist();
    }
  }, [isSignedIn, userdetails?.id, getwishlist, BACKEND_URL]);
  
  const toggleWishlist = useCallback(
    async (product) => {
      const isAlreadyInWishlist = wishlist?.some(
        (item) => (item.productId ?? item.product?.id) === product.id
      );
  
      if (isAlreadyInWishlist) {
        await removeFromWishlist(product);
      } else {
        await addToWishlist(product);
      }
    },
    [wishlist, addToWishlist, removeFromWishlist]
  );

    const moveFromWishlistToCart = useCallback(
  async (product) => {
    // First, try to add the item to the cart.
    const addedSuccessfully = await addToCart(product);

    // If it failed (e.g., user not signed in and an error occurred), stop here.
    // The addToCart function will have already shown an error toast.
    if (!addedSuccessfully) {
      return false;
    }

    // If added successfully, now remove it from the wishlist.
    // We don't need a toast here because the final toast below covers it.
    await removeFromWishlist(product);

    // Finally, show a single, clear confirmation toast.
    window.toast.success(`${product.name} moved to cart.`);
    return true;
  },
  [addToCart, removeFromWishlist]
);
  
  const mergeGuestCartIntoDB = useCallback(async () => {
    const guestCart = readLS(LS_CART_KEY);
    if (guestCart.length === 0) return;
    for (const item of guestCart) {
      await addToCart(item.product, item.quantity);
    }
    removeLS(LS_CART_KEY);
    window.toast.info("Your guest cart has been merged.");
  }, [addToCart]);

  const mergeGuestWishlistIntoDB = useCallback(async () => {
    const guestWishlist = readLS(LS_WISHLIST_KEY);
    if (guestWishlist.length === 0) return;
    for (const item of guestWishlist) {
      await addToWishlist(item.product);
    }
    removeLS(LS_WISHLIST_KEY);
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
      setIsCartLoading(false);
      setIsWishlistLoading(false);
      mergedOnceRef.current = false;
    }
  }, [isSignedIn, userdetails?.id, getCartitems, getwishlist, mergeGuestCartIntoDB, mergeGuestWishlistIntoDB]);

  const startBuyNow = useCallback((product, quantity) => {
    const item = { product, quantity };
    setBuyNow(item);
    writeLS(LS_BUY_NOW_KEY, item);
  }, []);

  const clearBuyNow = useCallback(() => {
    setBuyNow(null);
    removeLS(LS_BUY_NOW_KEY);
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
        clearWishlist, 
        toggleWishlist,
        moveToWishlist,
        moveFromWishlistToCart,
        startBuyNow,
        clearBuyNow,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};