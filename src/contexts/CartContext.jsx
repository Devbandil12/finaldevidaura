// src/contexts/CartContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { UserContext } from "./UserContext";
import { useUser } from "@clerk/clerk-react";

export const CartContext = createContext();

// ... (LS_CART_KEY and helper functions are unchanged) ...
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
  const { isLoaded } = useUser();
  const [cart, setCart] = useState(() => readLS(LS_CART_KEY));
  const [wishlist, setWishlist] = useState(() => readLS(LS_WISHLIST_KEY));
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isWishlistLoading, setIsWishlistLoading] = useState(true);
  const [buyNow, setBuyNow] = useState(() => readLS(LS_BUY_NOW_KEY));

  const mergeRanForId = useRef(null);
  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  // 🟢 MODIFIED: getCartitems now returns the fetched rows
  const getCartitems = useCallback(async () => {
    if (!userdetails?.id) return []; // Return empty array if no user
    setIsCartLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}`);
      if (!res.ok) throw new Error("Failed to fetch cart");
      const rows = await res.json();
      setCart(rows);
      return rows; // 👈 RETURN THE ROWS
    } catch (e) {
      console.error("getCartitems error:", e);
      window.toast.error("Failed to load cart.");
      setCart([]);
      return []; // Return empty array on failure
    } finally {
      setIsCartLoading(false);
    }
  }, [userdetails?.id, BACKEND_URL]);

  // ... (getwishlist and useEffect logic are unchanged) ...
  const getwishlist = useCallback(async () => {
    if (!userdetails?.id) return;
    setIsWishlistLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart/wishlist/${userdetails.id}`);
      if (!res.ok) throw new Error("Failed to fetch wishlist");
      const rows = await res.json();
      // rows is now an array of:
      // { wishlistId, variant: {...}, product: {...} }
      setWishlist(rows);
    } catch (e) {
      console.error("getwishlist error:", e);
      window.toast.error("Failed to load wishlist.");
      setWishlist([]);
    } finally {
      setIsWishlistLoading(false);
    }
  }, [userdetails?.id, BACKEND_URL]);

  useEffect(() => {
    if (!isLoaded || isUserLoading) {
      setIsCartLoading(true);
      setIsWishlistLoading(true);
      return;
    }

    if (isSignedIn && userdetails?.id) {
      if (userdetails.isNew && mergeRanForId.current !== userdetails.id) {
        mergeRanForId.current = userdetails.id;

        const mergeGuestData = async () => {
          console.log("New user detected, attempting to merge guest data...");
          const guestCart = readLS(LS_CART_KEY);
          const guestWishlist = readLS(LS_WISHLIST_KEY);

          // 🟢 MODIFIED: Merge Cart
          if (guestCart.length > 0) {
            // 🟢 Send the new required shape
            const payload = guestCart.map(item => ({ 
              productId: item.product.id, 
              variantId: item.variant.id, 
              quantity: item.quantity 
            }));
            await fetch(`${BACKEND_URL}/api/cart/merge`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: userdetails.id, guestCart: payload }),
            });
            removeLS(LS_CART_KEY);
            window.toast.info("Your guest cart has been saved to your new account.");
          }

          // 🟢 MODIFIED: Merge Wishlist
          if (guestWishlist.length > 0) {
            // 🟢 Send the new required shape
            const payload = guestWishlist.map(item => ({
              productId: item.product.id,
              variantId: item.variant.id
            }));
            await fetch(`${BACKEND_URL}/api/cart/wishlist/merge`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: userdetails.id, guestWishlist: payload })
            });
            removeLS(LS_WISHLIST_KEY);
          }

          await getCartitems();
          await getwishlist();
        };

        mergeGuestData();
      } else {
        getCartitems();
        getwishlist();
      }
    } else {
      setIsCartLoading(false);
      setIsWishlistLoading(false);
      setCart(readLS(LS_CART_KEY));
      setWishlist(readLS(LS_WISHLIST_KEY));
      mergeRanForId.current = null;
    }
  }, [
    isLoaded,
    isUserLoading,
    isSignedIn,
    userdetails,
    getCartitems,
    getwishlist,
    BACKEND_URL
  ]);

  // ... (addToCart is unchanged) ...
  const addToCart = useCallback(
    async (product, variant, quantity = 1) => {
      if (!variant || !variant.id) {
        console.error("addToCart called without a variant.", product, variant);
        window.toast.error("Please select a size/option first.");
        return false;
      }

      const qtyToAdd = Number(quantity || 1);
      
      if (!isSignedIn) {
        // 🟢 MODIFIED: Check by variant.id
        const existing = cart.find((i) => i.variant.id === variant.id);
        let newCart;
        if (existing) {
          newCart = cart.map((item) =>
            item.variant.id === variant.id
              ? { ...item, quantity: item.quantity + qtyToAdd }
              : item
          );
        } else {
          // 🟢 MODIFIED: Store the new shape
          newCart = [...cart, { product, variant, quantity: qtyToAdd }];
        }
        setCart(newCart);
        writeLS(LS_CART_KEY, newCart);
        window.toast.success(`${product.name} (${variant.name}) added to cart.`);
        return true;
      }

      if (!userdetails?.id) {
        window.toast.error("Please sign in to add items to your cart.");
        return false;
      }

      // 🟢 MODIFIED: Check by variant.id
      const existing = cart.find((i) => i.variant?.id === variant.id);

      const optimisticUpdate = existing
        ? cart.map((item) =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        )
        // 🟢 MODIFIED: Store the new shape
        : [...cart, { product, variant, quantity: qtyToAdd }];
      setCart(optimisticUpdate);

      try {
        if (existing) {
          const newQty = Number(existing.quantity || 1) + qtyToAdd;
          // 🟢 MODIFIED: API endpoint uses variantId
          await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${variant.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: newQty }),
          });
        } else {
          // 🟢 MODIFIED: Send all required IDs
          await fetch(`${BACKEND_URL}/api/cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              userId: userdetails.id, 
              productId: product.id, 
              variantId: variant.id, 
              quantity: qtyToAdd 
            }),
          });
        }
        window.toast.success(`${product.name} (${variant.name}) added to cart.`);
        return true;
      } catch (e) {
        console.error("addToCart error:", e);
        window.toast.error(`Failed to add ${product.name} to cart.`);
        await getCartitems(); // Revert on failure
        return false;
      }
    },
    [cart, isSignedIn, userdetails?.id, getCartitems, BACKEND_URL]
  );

  const removeFromCart = useCallback(
    async (variant) => {
      if (!isSignedIn) {
        // 🟢 MODIFIED: Filter by variant.id
        const newCart = cart.filter((item) => item.variant.id !== variant.id);
        setCart(newCart);
        writeLS(LS_CART_KEY, newCart);
        // Don't toast for buy now clearing
        // window.toast.info(`Item removed from cart.`); 
        return;
      }

      if (!userdetails?.id) return;

      // 🟢 MODIFIED: Filter by variant.id
      const optimisticUpdate = cart.filter((item) => item.variant?.id !== variant.id);
      setCart(optimisticUpdate);

      try {
        // 🟢 MODIFIED: API endpoint uses variantId
        await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${variant.id}`, {
          method: "DELETE",
        });
        // Don't toast for buy now clearing
        // window.toast.info(`Item removed from cart.`);
      } catch (e) {
        console.error("removeFromCart error:", e);
        window.toast.error(`Failed to remove item from cart.`);
        await getCartitems(); // Revert on failure
      }
    },
    [cart, isSignedIn, userdetails?.id, getCartitems, BACKEND_URL]
  );

  const changeCartQuantity = useCallback(
    async (variant, nextQty) => {
      if (nextQty <= 0) {
        removeFromCart(variant);
        return;
      }
      if (!isSignedIn) {
        // 🟢 MODIFIED: Map by variant.id
        const newCart = cart.map((item) =>
          item.variant.id === variant.id ? { ...item, quantity: nextQty } : item
        );
        setCart(newCart);
        writeLS(LS_CART_KEY, newCart);
        return;
      }

      if (!userdetails?.id) return;

      // 🟢 MODIFIED: Map by variant.id
      const optimisticUpdate = cart.map((item) =>
        item.variant?.id === variant.id ? { ...item, quantity: nextQty } : item
      );
      setCart(optimisticUpdate);
      try {
        // 🟢 MODIFIED: API endpoint uses variantId
        await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${variant.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: nextQty }),
        });
      } catch (e) {
        console.error("changeCartQuantity error:", e);
        window.toast.error("Failed to update quantity.");
        await getCartitems(); // Revert on failure
      }
    },
    [cart, isSignedIn, userdetails?.id, getCartitems, removeFromCart, BACKEND_URL]
  );

  const clearCart = useCallback(async () => {
    // ... (no changes needed, this logic is user-based)
    if (!isSignedIn) {
      setCart([]);
      writeLS(LS_CART_KEY, []);
      window.toast.info("Cart cleared.");
      return;
    }
    if (!userdetails?.id) return;
    const oldCart = cart;
    setCart([]);
    try {
      await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}`, {
        method: "DELETE",
      });
      window.toast.info("Cart cleared.");
    } catch (e) {
      console.error("clearCart error:", e);
      window.toast.error("Failed to clear cart.");
      setCart(oldCart);
    }
  }, [cart, isSignedIn, userdetails?.id, BACKEND_URL]);

  // ... (wishlist functions are unchanged) ...
  const addToWishlist = useCallback(
    async (product, variant) => {
      if (!variant || !variant.id) {
        console.error("addToWishlist called without a variant.", product, variant);
        window.toast.error("Please select a size/option first.");
        return false;
      }
      // 🟢 MODIFIED: Check by variant.id
      const existing = wishlist.some((item) => (item.variantId ?? item.variant?.id) === variant.id);
      if (existing) {
        window.toast.info(`${product.name} (${variant.name}) is already in your wishlist!`);
        return false;
      }

      if (!isSignedIn) {
        // 🟢 MODIFIED: Store the new shape
        const newWishlist = [...wishlist, { product, variant, variantId: variant.id }];
        setWishlist(newWishlist);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        window.toast.success(`${product.name} (${variant.name}) added to wishlist.`);
        return true;
      }

      if (!userdetails?.id) return false;

      // 🟢 MODIFIED: Optimistic update with new shape
      const optimisticUpdate = [...wishlist, { product, variant, variantId: variant.id, userId: userdetails.id }];
      setWishlist(optimisticUpdate);

      try {
        // 🟢 MODIFIED: Send all required IDs
        await fetch(`${BACKEND_URL}/api/cart/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: userdetails.id, 
            productId: product.id, 
            variantId: variant.id 
          }),
        });
        window.toast.success(`${product.name} (${variant.name}) added to wishlist.`);
        return true;
      } catch (e) {
        console.error("addToWishlist error:", e);
        window.toast.error(`Failed to add ${product.name} to wishlist.`);
        await getwishlist(); // Revert on failure
        return false;
      }
    },
    [wishlist, isSignedIn, userdetails?.id, getwishlist, BACKEND_URL]
  );

  const removeFromWishlist = useCallback(
    async (variant) => {
      if (!isSignedIn) {
        // 🟢 MODIFIED: Filter by variant.id
        const newWishlist = wishlist.filter((item) => (item.variantId ?? item.variant?.id) !== variant.id);
        setWishlist(newWishlist);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        window.toast.info(`Item removed from wishlist.`);
        return;
      }

      if (!userdetails?.id) return;

      // 🟢 MODIFIED: Optimistic update
      const optimisticUpdate = wishlist.filter((item) => (item.variantId ?? item.variant?.id) !== variant.id);
      setWishlist(optimisticUpdate);

      try {
        // 🟢 MODIFIED: API endpoint uses variantId
        await fetch(`${BACKEND_URL}/api/cart/wishlist/${userdetails.id}/${variant.id}`, {
          method: "DELETE",
        });
        window.toast.info(`Item removed from wishlist.`);
      } catch (e) {
        console.error("removeFromWishlist error:", e);
        window.toast.error(`Failed to remove item from wishlist.`);
        await getwishlist(); // Revert on failure
      }
    },
    [wishlist, isSignedIn, userdetails?.id, getwishlist, BACKEND_URL]
  );

  const clearWishlist = useCallback(async () => {
    // ... (no changes needed, this logic is user-based)
    if (!isSignedIn) {
      setWishlist([]);
      writeLS(LS_WISHLIST_KEY, []);
      window.toast.info("Wishlist cleared.");
      return;
    }
    if (!userdetails?.id) return;
    const oldWishlist = wishlist;
    setWishlist([]);
    try {
      await fetch(`${BACKEND_URL}/api/cart/wishlist/${userdetails.id}`, {
        method: "DELETE",
      });
      window.toast.info("Wishlist cleared.");
    } catch (e) {
      console.error("clearWishlist error:", e);
      window.toast.error("Failed to clear wishlist.");
      setWishlist(oldWishlist);
    }
  }, [wishlist, isSignedIn, userdetails?.id, BACKEND_URL]);

  const toggleWishlist = useCallback(
    async (product, variant) => {
      const isAlreadyInWishlist = wishlist?.some(
        (item) => (item.variantId ?? item.variant?.id) === variant.id
      );

      if (isAlreadyInWishlist) {
        await removeFromWishlist(variant);
      } else {
        await addToWishlist(product, variant);
      }
    },
    [wishlist, addToWishlist, removeFromWishlist]
  );

  const moveToWishlist = useCallback(
    async (product, variant) => {
      const addedSuccessfully = await addToWishlist(product, variant);
      if (!addedSuccessfully) {
        return false;
      }
      await removeFromCart(variant); // This correctly removes it from the main cart
      window.toast.success(`${product.name} (${variant.name}) moved to wishlist.`);
      return true;
    },
    [addToWishlist, removeFromCart]
  );

  const moveFromWishlistToCart = useCallback(
    async (product, variant) => {
      // 🟢 Pass all params to addToCart
      const addedSuccessfully = await addToCart(product, variant, 1);
      if (!addedSuccessfully) {
        return false;
      }
      await removeFromWishlist(variant);
      window.toast.success(`${product.name} (${variant.name}) moved to cart.`);
      return true;
    },
    [addToCart, removeFromWishlist]
  );

  // 🟢 --- FIX 1 ---
  // Updated startBuyNow to handle both simple products and full combo objects
  const startBuyNow = useCallback((productOrItem, variant, quantity) => {
    let item;
    if (variant && quantity !== undefined) {
      // This is the old call: startBuyNow(product, variant, quantity)
      // This is for simple products. We assume it's not a bundle.
      item = { 
        product: productOrItem, 
        variant, 
        quantity, 
        isBundle: false, // Default to false for simple products
        contents: []      // Default to empty for simple products
      };
    } else {
      // This is the new call: startBuyNow(fullItem)
      // This is for our custom bundle, which already has isBundle and contents.
      item = productOrItem; // productOrItem is the full newItem object
    }
    setBuyNow(item);
    writeLS(LS_BUY_NOW_KEY, item);
  }, []);

  // 🟢 --- FIX 2 ---
  // Updated clearBuyNow to also remove the item from the main cart
  const clearBuyNow = useCallback(() => {
    const itemToClear = buyNow || readLS(LS_BUY_NOW_KEY); // Get from state or LS
    if (itemToClear && itemToClear.variant) {
      // If a buyNow item exists, call removeFromCart with its variant.
      // This removes it from the database AND the local 'cart' state.
      removeFromCart(itemToClear.variant);
    }
    // Then, clear the buyNow state and local storage as before.
    setBuyNow(null);
    removeLS(LS_BUY_NOW_KEY);
  }, [buyNow, removeFromCart]); // 👈 Add 'buyNow' and 'removeFromCart' dependencies
  // 🟢 --- END FIXES ---

  // 🟢 MODIFIED: addCustomBundle now returns the new item
  const addCustomBundle = useCallback(async (templateVariantId, contentVariantIds) => {
    if (!userdetails?.id) {
      window.toast.error("Please log in to build a bundle.");
      return false;
    }

    if (!templateVariantId || !Array.isArray(contentVariantIds) || contentVariantIds.length === 0) {
      window.toast.error("Invalid bundle configuration.");
      return false;
    }

    try {
      // 1. Call the API to create the bundle
      const res = await fetch(`${BACKEND_URL}/api/cart/add-custom-bundle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userdetails.id,
          templateVariantId: templateVariantId,
          contentVariantIds: contentVariantIds,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create custom bundle");
      }
      
      // 2. Get the new cart item row (e.g., { id, variantId, ... })
      const newCartItemRow = await res.json(); 

      // 3. CRITICAL: Refresh the entire cart. This function now returns the refreshed cart.
      const refreshedCart = await getCartitems(); 
      
      // 4. Find the full, joined item in the refreshed cart
      const fullNewItem = refreshedCart.find(
        (item) => item.variant.id === newCartItemRow.variantId
      );

      if (fullNewItem) {
        window.toast.success("Custom bundle added to cart!");
        return fullNewItem; // 👈 RETURN THE FULL ITEM
      } else {
        // This is a fallback in case the item isn't found,
        // which shouldn't happen but protects against errors.
        console.error("Failed to find new bundle in refreshed cart.");
        window.toast.success("Custom bundle added to cart!");
        return true; // 👈 Return true as a fallback
      }

    } catch (err) {
      console.error("addCustomBundle error:", err);
      window.toast.error(err.message || "Failed to add bundle to cart.");
      return false; // 👈 Return false on failure
    }
  }, [userdetails?.id, BACKEND_URL, getCartitems]);

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
        startBuyNow,      // Updated
        clearBuyNow,      // Updated
        addCustomBundle,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};