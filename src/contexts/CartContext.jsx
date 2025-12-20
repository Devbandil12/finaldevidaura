// src/contexts/CartContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { UserContext } from "./UserContext";
import { useUser } from "@clerk/clerk-react";

export const CartContext = createContext();

const LS_CART_KEY = "guestCart";
const LS_WISHLIST_KEY = "guestWishlist";
const LS_BUY_NOW_KEY = "buyNowItem";

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

export const CartProvider = ({ children }) => {
  const { userdetails, isSignedIn, isUserLoading } = useContext(UserContext);
  const { isLoaded } = useUser();
  const [cart, setCart] = useState(() => readLS(LS_CART_KEY));
  const [wishlist, setWishlist] = useState(() => readLS(LS_WISHLIST_KEY));
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isWishlistLoading, setIsWishlistLoading] = useState(true);
  const [buyNow, setBuyNow] = useState(() => readLS(LS_BUY_NOW_KEY));

  const [savedItems, setSavedItems] = useState([]);
  const [isSavedLoading, setIsSavedLoading] = useState(false);

  const mergeRanForId = useRef(null);
  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  // 🟢 FIXED: Added showLoader parameter to prevent full reload on background updates
  const getCartitems = useCallback(async (showLoader = true) => {
    if (!userdetails?.id) return []; 
    if (showLoader) setIsCartLoading(true);
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}`);
      if (!res.ok) throw new Error("Failed to fetch cart");
      const rows = await res.json();
      setCart(rows);
      return rows;
    } catch (e) {
      console.error("getCartitems error:", e);
      // Only show error
      //  if it was a user-initiated load
      if (showLoader) window.toast.error("Failed to load cart.");
      // Don't clear cart on error, keep stale data is better than empty
      return []; 
    } finally {
      if (showLoader) setIsCartLoading(false);
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
      // window.toast.error("Failed to load wishlist.");
      setWishlist([]);
    } finally {
      setIsWishlistLoading(false);
    }
  }, [userdetails?.id, BACKEND_URL]);

  const getSavedItems = useCallback(async () => {
    if (!userdetails?.id) return;
    setIsSavedLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart/saved-for-later/${userdetails.id}`);
      if (!res.ok) throw new Error("Failed to fetch saved items");
      const rows = await res.json();
      setSavedItems(rows);
    } catch (e) {
      console.error("getSavedItems error:", e);
    } finally {
      setIsSavedLoading(false);
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
          const guestCart = readLS(LS_CART_KEY);
          const guestWishlist = readLS(LS_WISHLIST_KEY);

          if (guestCart.length > 0) {
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

          if (guestWishlist.length > 0) {
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
          await getSavedItems();
        };

        mergeGuestData();
      } else {
        getCartitems();
        getwishlist();
        getSavedItems();
      }
    } else {
      setIsCartLoading(false);
      setIsWishlistLoading(false);
      setCart(readLS(LS_CART_KEY));
      setWishlist(readLS(LS_WISHLIST_KEY));
      setSavedItems([]);
      mergeRanForId.current = null;
    }
  }, [
    isLoaded,
    isUserLoading,
    isSignedIn,
    userdetails,
    getCartitems,
    getwishlist,
    getSavedItems,
    BACKEND_URL
  ]);

  // 🟢 NEW: Auto-refresh cart when user comes back to the tab (Focus Revalidation)
  // This solves the "lack of live update" issue without sockets.
  useEffect(() => {
    const handleFocus = () => {
      if (isSignedIn && userdetails?.id) {
        // Silent refresh (false argument) so no loading spinner appears
        getCartitems(false);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isSignedIn, userdetails?.id, getCartitems]);


  const addToCart = useCallback(
    async (product, variant, quantity = 1) => {
      if (!variant || !variant.id) {
        window.toast.error("Please select a size/option first.");
        return false;
      }

      const qtyToAdd = Number(quantity || 1);
      
      if (!isSignedIn) {
        const existing = cart.find((i) => i.variant.id === variant.id);
        let newCart;
        if (existing) {
          newCart = cart.map((item) =>
            item.variant.id === variant.id
              ? { ...item, quantity: item.quantity + qtyToAdd }
              : item
          );
        } else {
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

      const existing = cart.find((i) => i.variant?.id === variant.id);

      const optimisticUpdate = existing
        ? cart.map((item) =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        )
        : [...cart, { product, variant, quantity: qtyToAdd }];
      setCart(optimisticUpdate);

      try {
        if (existing) {
          const newQty = Number(existing.quantity || 1) + qtyToAdd;
          await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${variant.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: newQty }),
          });
        } else {
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
        await getCartitems(false); // Silent refresh
        return false;
      }
    },
    [cart, isSignedIn, userdetails?.id, getCartitems, BACKEND_URL]
  );

  const removeFromCart = useCallback(
    async (variant) => {
      if (!isSignedIn) {
        const newCart = cart.filter((item) => item.variant.id !== variant.id);
        setCart(newCart);
        writeLS(LS_CART_KEY, newCart);
        return;
      }

      if (!userdetails?.id) return;

      const optimisticUpdate = cart.filter((item) => item.variant?.id !== variant.id);
      setCart(optimisticUpdate);

      try {
        await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${variant.id}`, {
          method: "DELETE",
        });
      } catch (e) {
        console.error("removeFromCart error:", e);
        window.toast.error(`Failed to remove item from cart.`);
        await getCartitems(false); // Silent refresh
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
        const newCart = cart.map((item) =>
          item.variant.id === variant.id ? { ...item, quantity: nextQty } : item
        );
        setCart(newCart);
        writeLS(LS_CART_KEY, newCart);
        return;
      }

      if (!userdetails?.id) return;

      const optimisticUpdate = cart.map((item) =>
        item.variant?.id === variant.id ? { ...item, quantity: nextQty } : item
      );
      setCart(optimisticUpdate);
      try {
        await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${variant.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: nextQty }),
        });
      } catch (e) {
        console.error("changeCartQuantity error:", e);
        window.toast.error("Failed to update quantity.");
        await getCartitems(false); 
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

  const addToWishlist = useCallback(
    async (product, variant) => {
      if (!variant || !variant.id) {
        window.toast.error("Please select a size/option first.");
        return false;
      }
      const existing = wishlist.some((item) => (item.variantId ?? item.variant?.id) === variant.id);
      if (existing) {
        window.toast.info(`${product.name} (${variant.name}) is already in your wishlist!`);
        return false;
      }

      if (!isSignedIn) {
        const newWishlist = [...wishlist, { product, variant, variantId: variant.id }];
        setWishlist(newWishlist);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        window.toast.success(`${product.name} (${variant.name}) added to wishlist.`);
        return true;
      }

      if (!userdetails?.id) return false;

      const optimisticUpdate = [...wishlist, { product, variant, variantId: variant.id, userId: userdetails.id }];
      setWishlist(optimisticUpdate);

      try {
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
        await getwishlist();
        return false;
      }
    },
    [wishlist, isSignedIn, userdetails?.id, getwishlist, BACKEND_URL]
  );

  const removeFromWishlist = useCallback(
    async (variant) => {
      if (!isSignedIn) {
        const newWishlist = wishlist.filter((item) => (item.variantId ?? item.variant?.id) !== variant.id);
        setWishlist(newWishlist);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        window.toast.info(`Item removed from wishlist.`);
        return;
      }

      if (!userdetails?.id) return;

      const optimisticUpdate = wishlist.filter((item) => (item.variantId ?? item.variant?.id) !== variant.id);
      setWishlist(optimisticUpdate);

      try {
        await fetch(`${BACKEND_URL}/api/cart/wishlist/${userdetails.id}/${variant.id}`, {
          method: "DELETE",
        });
        window.toast.info(`Item removed from wishlist.`);
      } catch (e) {
        console.error("removeFromWishlist error:", e);
        window.toast.error(`Failed to remove item from wishlist.`);
        await getwishlist(); 
      }
    },
    [wishlist, isSignedIn, userdetails?.id, getwishlist, BACKEND_URL]
  );

  const clearWishlist = useCallback(async () => {
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
      await removeFromCart(variant); 
      window.toast.success(`${product.name} (${variant.name}) moved to wishlist.`);
      return true;
    },
    [addToWishlist, removeFromCart]
  );

  const moveFromWishlistToCart = useCallback(
    async (product, variant) => {
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

  const startBuyNow = useCallback((productOrItem, variant, quantity) => {
    let item;
    if (variant && quantity !== undefined) {
      item = { 
        product: productOrItem, 
        variant, 
        quantity, 
        isBundle: false, 
        contents: []
      };
    } else {
      item = productOrItem; 
    }
    setBuyNow(item);
    writeLS(LS_BUY_NOW_KEY, item);
  }, []);

  const clearBuyNow = useCallback(() => {
    const itemToClear = buyNow || readLS(LS_BUY_NOW_KEY); 
    if (itemToClear && itemToClear.variant) {
      removeFromCart(itemToClear.variant);
    }
    setBuyNow(null);
    removeLS(LS_BUY_NOW_KEY);
  }, [buyNow, removeFromCart]); 

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
      
      const newCartItemRow = await res.json(); 
      const refreshedCart = await getCartitems(false); // 🟢 Silent refresh
      
      const fullNewItem = refreshedCart.find(
        (item) => item.variant.id === newCartItemRow.variantId
      );

      if (fullNewItem) {
        window.toast.success("Custom bundle added to cart!");
        return fullNewItem;
      } else {
        console.error("Failed to find new bundle in refreshed cart.");
        window.toast.success("Custom bundle added to cart!");
        return true; 
      }

    } catch (err) {
      console.error("addCustomBundle error:", err);
      window.toast.error(err.message || "Failed to add bundle to cart.");
      return false; 
    }
  }, [userdetails?.id, BACKEND_URL, getCartitems]);

const saveForLater = useCallback(async (item) => {
    if (!userdetails?.id) {
       window.toast.error("Please login to save items.");
       return;
    }

    const variantId = item.variant.id || item.variantId;
    const quantityToSave = item.quantity;

    // 1. Optimistic Update: Remove from Cart
    const newCart = cart.filter(c => c.variant.id !== variantId);
    setCart(newCart);

    // 2. Optimistic Update: Add to Saved (Merge if exists)
    const existingIndex = savedItems.findIndex(s => s.variant.id === variantId);
    let newSaved;

    if (existingIndex > -1) {
      // Item exists: Clone array and update specific item's quantity
      newSaved = [...savedItems];
      const existingItem = newSaved[existingIndex];
      newSaved[existingIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + quantityToSave
      };
    } else {
      // Item does not exist: Add new item
      // We explicitly structure it to match the backend format
      const itemToSave = { 
        ...item, 
        userId: userdetails.id,
        quantity: quantityToSave, // Ensure this is set explicitly
        variant: item.variant,
        product: item.product
      };
      newSaved = [...savedItems, itemToSave];
    }
    
    setSavedItems(newSaved);

    try {
      await fetch(`${BACKEND_URL}/api/cart/save-for-later`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userdetails.id,
          variantId: variantId,
          quantity: quantityToSave
        }),
      });
      window.toast.success("Saved for later");
    } catch (e) {
      console.error("saveForLater error:", e);
      window.toast.error("Failed to save item");
      await getCartitems(false); // Silent Revert
      await getSavedItems(); // Silent Revert
    }
  }, [cart, savedItems, userdetails?.id, BACKEND_URL, getCartitems, getSavedItems]);
  
  // 🟢 FIXED: Optimistic UI Update + Silent Background Refresh
  const moveSavedToCart = useCallback(async (item) => {
    if (!userdetails?.id) return;

    // 1. Optimistic Update: Remove from Saved
    const newSaved = savedItems.filter(s => s.variant.id !== item.variant.id);
    setSavedItems(newSaved);

    // 2. Optimistic Update: Add to Cart (or update qty)
    const existingIndex = cart.findIndex((c) => c.variant.id === item.variant.id);
    let newCart;
    if (existingIndex > -1) {
      newCart = [...cart];
      newCart[existingIndex] = {
        ...newCart[existingIndex],
        quantity: newCart[existingIndex].quantity + item.quantity
      };
    } else {
      // Construct item structure matching getCartitems response
      const newItem = {
        quantity: item.quantity,
        variant: item.variant,
        product: item.product || item.variant.product,
        isBundle: item.isBundle || false,
        contents: item.contents || []
      };
      newCart = [...cart, newItem];
    }
    setCart(newCart);

    try {
      await fetch(`${BACKEND_URL}/api/cart/move-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userdetails.id,
          variantId: item.variant.id,
          quantity: item.quantity
        }),
      });
      window.toast.success("Moved back to cart");
      
      // 3. Silent Refresh to ensure consistency (pass false to skip loader)
      await getCartitems(false); 
    } catch (e) {
      console.error("moveSavedToCart error:", e);
      window.toast.error("Failed to move item");
      // Revert on failure
      await getSavedItems();
      await getCartitems(false);
    }
  }, [savedItems, cart, userdetails?.id, BACKEND_URL, getCartitems, getSavedItems]);

  const removeSavedItem = useCallback(async (variantId) => {
    if (!userdetails?.id) return;

    const newSaved = savedItems.filter(s => s.variant.id !== variantId);
    setSavedItems(newSaved);

    try {
      await fetch(`${BACKEND_URL}/api/cart/saved-for-later/${userdetails.id}/${variantId}`, {
        method: "DELETE",
      });
      window.toast.info("Item removed");
    } catch (e) {
      console.error("removeSavedItem error:", e);
      await getSavedItems(); 
    }
  }, [savedItems, userdetails?.id, BACKEND_URL, getSavedItems]);

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
        addCustomBundle,
        savedItems,
        isSavedLoading,
        saveForLater,
        moveSavedToCart,
        removeSavedItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};