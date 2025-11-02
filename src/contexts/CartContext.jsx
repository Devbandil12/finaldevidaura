import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { UserContext } from "./UserContext";
import { useUser } from "@clerk/clerk-react";

export const CartContext = createContext();

const LS_CART_KEY = "guestCart";
const LS_WISHLIST_KEY = "guestWishlist";
const LS_BUY_NOW_KEY = "buyNowItem";

// Helper functions (no changes needed)
const readLS = (key) => {
  try {
    const serializedState = localStorage.getItem(key);
    return serializedState ? JSON.parse(serializedState) : (key === LS_BUY_NOW_KEY ? null : []);
  } catch (err) {
    console.error("Error reading from local storage:", err);
    return key === LS_BUY_NOW_KEY ? null : [];
  }
};

const writeLS = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
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
// End of helper functions

export const CartProvider = ({ children }) => {
  const { userdetails, isSignedIn, isUserLoading } = useContext(UserContext);
  const { isLoaded } = useUser(); // Get Clerk's own loaded state
  const [cart, setCart] = useState(() => readLS(LS_CART_KEY));
  const [wishlist, setWishlist] = useState(() => readLS(LS_WISHLIST_KEY));
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isWishlistLoading, setIsWishlistLoading] = useState(true);
  const [buyNow, setBuyNow] = useState(() => readLS(LS_BUY_NOW_KEY));

  const mergeRanForId = useRef(null);

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  const getCartitems = useCallback(async () => {
    if (!userdetails?.id) return;
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
    if (!userdetails?.id) return;
    setIsWishlistLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart/wishlist/${userdetails.id}`);
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


  // --- 
  // --- THIS IS THE CORRECTED LOGIC ---
  // --- 
  useEffect(() => {
    // Wait for BOTH Clerk to be loaded AND our user fetch to be complete.
    if (!isLoaded || isUserLoading) {
      setIsCartLoading(true); // Keep showing loading
      setIsWishlistLoading(true);
      return; // Do nothing, we are waiting for user state
    }

    // --- At this point, auth is STABLE ---

    if (isSignedIn && userdetails?.id) {
      // User IS logged in
      if (userdetails.isNew && mergeRanForId.current !== userdetails.id) {
        mergeRanForId.current = userdetails.id; // Mark merge as complete

        const mergeGuestData = async () => {
          console.log("New user detected, attempting to merge guest data...");
          const guestCart = readLS(LS_CART_KEY);
          const guestWishlist = readLS(LS_WISHLIST_KEY);

          // Merge Cart
          if (guestCart.length > 0) {
            const payload = guestCart.map(item => ({ productId: item.product.id, quantity: item.quantity }));
            await fetch(`${BACKEND_URL}/api/cart/merge`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: userdetails.id, guestCart: payload }),
            });
            removeLS(LS_CART_KEY);
            window.toast.info("Your guest cart has been saved to your new account.");
          }

          // Merge Wishlist
          if (guestWishlist.length > 0) {
            const payload = guestWishlist.map(item => item.product.id);
            await fetch(`${BACKEND_URL}/api/cart/wishlist/merge`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: userdetails.id, guestWishlist: payload })
            });
            removeLS(LS_WISHLIST_KEY);
          }

          // Fetch the final, merged state from the database
          await getCartitems();
          await getwishlist();
        };

        mergeGuestData();
      } else {
        // For existing users, just fetch their data from the database
        getCartitems();
        getwishlist();
      }
    } else {
      // User is NOT signed in (is a guest)
      setIsCartLoading(false);
      setIsWishlistLoading(false);
      setCart(readLS(LS_CART_KEY));
      setWishlist(readLS(LS_WISHLIST_KEY));
      mergeRanForId.current = null; // On logout, reset the merge guard
    }
  }, [
    isLoaded,         // From Clerk
    isUserLoading,    // From UserContext
    isSignedIn,       // From UserContext
    userdetails,      // From UserContext
    getCartitems, 
    getwishlist, 
    BACKEND_URL
  ]);


  // --- All other functions (addToCart, removeFromCart, etc.) are fine ---

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
        // 🟢 REMOVED: await getCartitems();
        window.toast.success(`${product.name} added to cart.`);
        return true;
      } catch (e) {
        console.error("addToCart error:", e);
        window.toast.error(`Failed to add ${product.name} to cart.`);
        await getCartitems(); // 🟢 KEPT: Revert on failure
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
        // 🟢 REMOVED: await getCartitems();
        window.toast.info(`${product.name} removed from cart.`);
      } catch (e) {
        console.error("removeFromCart error:", e);
        window.toast.error(`Failed to remove ${product.name} from cart.`);
        await getCartitems(); // 🟢 KEPT: Revert on failure
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
        // 🟢 REMOVED: await getCartitems();
      } catch (e) {
        console.error("changeCartQuantity error:", e);
        window.toast.error("Failed to update quantity.");
        await getCartitems(); // 🟢 KEPT: Revert on failure
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

    // 🟢 IMPROVED: Optimistic update
    const oldCart = cart; // Save the old cart
    setCart([]); // Optimistically clear it

    try {
      await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}`, {
        method: "DELETE",
      });
      // 🟢 REMOVED: setCart([]);
      window.toast.info("Cart cleared.");
    } catch (e) {
      console.error("clearCart error:", e);
      window.toast.error("Failed to clear cart.");
      setCart(oldCart); // 🟢 Revert to old cart on failure
      // 🟢 REMOVED: await getCartitems();
    }
  }, [cart, isSignedIn, userdetails?.id, BACKEND_URL]); // 🟢 Updated dependencies

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

      // 🟢 IMPROVED: Optimistic update for wishlist
      const optimisticUpdate = [...wishlist, { product, productId: product.id, userId: userdetails.id }];
      setWishlist(optimisticUpdate);

      try {
        await fetch(`${BACKEND_URL}/api/cart/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userdetails.id, productId: product.id }),
        });
        // 🟢 REMOVED: await getwishlist();
        window.toast.success(`${product.name} added to wishlist.`);
        return true;
      } catch (e) {
        console.error("addToWishlist error:", e);
        window.toast.error(`Failed to add ${product.name} to wishlist.`);
        await getwishlist(); // 🟢 KEPT: Revert on failure
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

      // 🟢 IMPROVED: Optimistic update for wishlist
      const optimisticUpdate = wishlist.filter((item) => (item.productId ?? item.product?.id) !== product.id);
      setWishlist(optimisticUpdate);

      try {
        await fetch(`${BACKEND_URL}/api/cart/wishlist/${userdetails.id}/${product.id}`, {
          method: "DELETE",
        });
        // 🟢 REMOVED: await getwishlist();
        window.toast.info(`${product.name} removed from wishlist.`);
      } catch (e) {
        console.error("removeFromWishlist error:", e);
        window.toast.error(`Failed to remove ${product.name} from wishlist.`);
        await getwishlist(); // 🟢 KEPT: Revert on failure
      }
    },
    [wishlist, isSignedIn, userdetails?.id, getwishlist, BACKEND_URL]
  );

  const moveToWishlist = useCallback(
    async (product) => {
      const addedSuccessfully = await addToWishlist(product);
      if (!addedSuccessfully) {
        // This will prevent removing from cart if wishlist add fails (e.g., already exists)
        return false; 
      }
      await removeFromCart(product);
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

    // 🟢 IMPROVED: Optimistic update
    const oldWishlist = wishlist;
    setWishlist([]);

    try {
      await fetch(`${BACKEND_URL}/api/cart/wishlist/${userdetails.id}`, {
        method: "DELETE",
      });
      // 🟢 REMOVED: setWishlist([]);
      window.toast.info("Wishlist cleared.");
    } catch (e) {
      console.error("clearWishlist error:", e);
      window.toast.error("Failed to clear wishlist.");
      setWishlist(oldWishlist); // 🟢 Revert on failure
    }
  }, [wishlist, isSignedIn, userdetails?.id, BACKEND_URL]); // 🟢 Updated dependencies

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
      const addedSuccessfully = await addToCart(product);
      if (!addedSuccessfully) {
        // This will prevent removing from wishlist if cart add fails (e.g., out of stock)
        return false;
      }
      await removeFromWishlist(product);
      window.toast.success(`${product.name} moved to cart.`);
      return true;
    },
    [addToCart, removeFromWishlist]
  );

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