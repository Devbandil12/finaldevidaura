import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { UserContext } from "./UserContext";
import { useUser, useAuth } from "@clerk/clerk-react";

export const CartContext = createContext();

const LS_CART_KEY = "guestCart";
const LS_WISHLIST_KEY = "guestWishlist";
const LS_BUY_NOW_KEY = "buyNowItem";

// --- LocalStorage Helpers ---
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
  const { getToken } = useAuth(); // 🟢 Get Token Helper

  const [cart, setCart] = useState(() => readLS(LS_CART_KEY));
  const [wishlist, setWishlist] = useState(() => readLS(LS_WISHLIST_KEY));
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isWishlistLoading, setIsWishlistLoading] = useState(true);
  const [buyNow, setBuyNow] = useState(() => readLS(LS_BUY_NOW_KEY));

  const [savedItems, setSavedItems] = useState([]);
  const [isSavedLoading, setIsSavedLoading] = useState(false);

  const mergeRanForId = useRef(null);
  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  // 🟢 Helper for Auth Headers
  const getAuthHeaders = async () => {
    const token = await getToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
  };

  // --- 1. Fetch Cart (Guest + User) ---
  const getCartitems = useCallback(async (showLoader = true) => {
    // 🟢 GUEST LOGIC
    if (!isSignedIn) {
      setCart(readLS(LS_CART_KEY));
      setIsCartLoading(false);
      return readLS(LS_CART_KEY);
    }

    // 🔒 AUTHENTICATED LOGIC
    if (!userdetails?.id) return []; 
    if (showLoader) setIsCartLoading(true);
    
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch cart");
      const rows = await res.json();
      setCart(rows);
      return rows;
    } catch (e) {
      console.error("getCartitems error:", e);
      if (showLoader) window.toast.error("Failed to load cart.");
      return []; 
    } finally {
      if (showLoader) setIsCartLoading(false);
    }
  }, [isSignedIn, userdetails?.id, BACKEND_URL, getToken]);

  // --- 2. Fetch Wishlist (Guest + User) ---
  const getwishlist = useCallback(async () => {
    // 🟢 GUEST LOGIC
    if (!isSignedIn) {
      setWishlist(readLS(LS_WISHLIST_KEY));
      setIsWishlistLoading(false);
      return;
    }

    // 🔒 AUTHENTICATED LOGIC
    if (!userdetails?.id) return;
    setIsWishlistLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/cart/wishlist/${userdetails.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch wishlist");
      const rows = await res.json();
      setWishlist(rows);
    } catch (e) {
      console.error("getwishlist error:", e);
      setWishlist([]);
    } finally {
      setIsWishlistLoading(false);
    }
  }, [isSignedIn, userdetails?.id, BACKEND_URL, getToken]);

  // --- 3. Fetch Saved Items (User Only) ---
  const getSavedItems = useCallback(async () => {
    if (!userdetails?.id) return;
    setIsSavedLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/cart/saved-for-later/${userdetails.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch saved items");
      const rows = await res.json();
      setSavedItems(rows);
    } catch (e) {
      console.error("getSavedItems error:", e);
    } finally {
      setIsSavedLoading(false);
    }
  }, [userdetails?.id, BACKEND_URL, getToken]);

  // --- 4. Initialization & Merging ---
  useEffect(() => {
    if (!isLoaded || isUserLoading) {
      setIsCartLoading(true);
      setIsWishlistLoading(true);
      return;
    }

    if (isSignedIn && userdetails?.id) {
      const guestCart = readLS(LS_CART_KEY);
      const guestWishlist = readLS(LS_WISHLIST_KEY);
      const hasGuestData = (guestCart && guestCart.length > 0) || (guestWishlist && guestWishlist.length > 0);

      if (hasGuestData && mergeRanForId.current !== userdetails.id) {
        mergeRanForId.current = userdetails.id;

        const mergeGuestData = async () => {
          const headers = await getAuthHeaders();
          const currentGuestCart = readLS(LS_CART_KEY);
          const currentGuestWishlist = readLS(LS_WISHLIST_KEY);

          if (currentGuestCart.length > 0) {
            const payload = currentGuestCart.map(item => ({ 
              productId: item.product.id, 
              variantId: item.variant.id, 
              quantity: item.quantity 
            }));
            await fetch(`${BACKEND_URL}/api/cart/merge`, {
              method: "POST",
              headers,
              body: JSON.stringify({ guestCart: payload }), // userId injected by backend token
            });
            removeLS(LS_CART_KEY);
            window.toast.info("Your guest cart has been merged.");
          }

          if (currentGuestWishlist.length > 0) {
            const payload = currentGuestWishlist.map(item => ({
              productId: item.product.id,
              variantId: item.variant.id
            }));
            await fetch(`${BACKEND_URL}/api/cart/wishlist/merge`, {
              method: "POST",
              headers,
              body: JSON.stringify({ guestWishlist: payload }) // userId injected by backend token
            });
            removeLS(LS_WISHLIST_KEY);
          }

          const freshCart = await getCartitems();
          await getwishlist();
          await getSavedItems();

          try {
            const intentRaw = sessionStorage.getItem("checkout_intent");
            const intent = intentRaw ? JSON.parse(intentRaw) : null;
            const isBuyNow = intent?.source === "buy_now";

            if (!isBuyNow && freshCart && freshCart.length > 0) {
              localStorage.setItem("selectedItems", JSON.stringify(freshCart));
            }
          } catch (e) {
            console.error("Error parsing checkout intent during merge", e);
          }
        };

        mergeGuestData();
      } else {
        getCartitems();
        getwishlist();
        getSavedItems();
      }
    } else {
      // Guest Mode Initialization
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
    BACKEND_URL,
    getToken
  ]);

  // Refetch on focus (Authenticated only)
  useEffect(() => {
    const handleFocus = () => {
      if (isSignedIn && userdetails?.id) {
        getCartitems(false);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isSignedIn, userdetails?.id, getCartitems]);


  // --- 5. Add to Cart ---
  const addToCart = useCallback(
    async (product, variant, quantity = 1) => {
      if (!variant || !variant.id) {
        window.toast.error("Please select a size/option first.");
        return false;
      }

      const qtyToAdd = Number(quantity || 1);
      
      // 🟢 GUEST LOGIC
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

      // 🔒 AUTHENTICATED LOGIC
      if (!userdetails?.id) {
        window.toast.error("Please sign in to add items to your cart.");
        return false;
      }

      const existing = cart.find((i) => i.variant?.id === variant.id);

      // Optimistic Update
      const optimisticUpdate = existing
        ? cart.map((item) =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        )
        : [...cart, { product, variant, quantity: qtyToAdd }];
      setCart(optimisticUpdate);

      try {
        const headers = await getAuthHeaders();
        if (existing) {
          const newQty = Number(existing.quantity || 1) + qtyToAdd;
          await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${variant.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ quantity: newQty }),
          });
        } else {
          await fetch(`${BACKEND_URL}/api/cart`, {
            method: "POST",
            headers,
            body: JSON.stringify({ 
              // userId injected by backend token, but okay to send if backend expects it
              // ideally backend gets it from token
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
        await getCartitems(false); // Revert on error
        return false;
      }
    },
    [cart, isSignedIn, userdetails?.id, getCartitems, BACKEND_URL, getToken]
  );

  // --- 6. Remove from Cart ---
  const removeFromCart = useCallback(
    async (variant) => {
      // 🟢 GUEST LOGIC
      if (!isSignedIn) {
        const newCart = cart.filter((item) => item.variant.id !== variant.id);
        setCart(newCart);
        writeLS(LS_CART_KEY, newCart);
        return;
      }

      // 🔒 AUTHENTICATED LOGIC
      if (!userdetails?.id) return;

      const optimisticUpdate = cart.filter((item) => item.variant?.id !== variant.id);
      setCart(optimisticUpdate);

      try {
        const token = await getToken();
        await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${variant.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        console.error("removeFromCart error:", e);
        window.toast.error(`Failed to remove item from cart.`);
        await getCartitems(false);
      }
    },
    [cart, isSignedIn, userdetails?.id, getCartitems, BACKEND_URL, getToken]
  );

  // --- 7. Change Quantity ---
  const changeCartQuantity = useCallback(
    async (variant, nextQty) => {
      if (nextQty <= 0) {
        removeFromCart(variant);
        return;
      }
      
      // 🟢 GUEST LOGIC
      if (!isSignedIn) {
        const newCart = cart.map((item) =>
          item.variant.id === variant.id ? { ...item, quantity: nextQty } : item
        );
        setCart(newCart);
        writeLS(LS_CART_KEY, newCart);
        return;
      }

      // 🔒 AUTHENTICATED LOGIC
      if (!userdetails?.id) return;

      const optimisticUpdate = cart.map((item) =>
        item.variant?.id === variant.id ? { ...item, quantity: nextQty } : item
      );
      setCart(optimisticUpdate);
      try {
        const headers = await getAuthHeaders();
        await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}/${variant.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ quantity: nextQty }),
        });
      } catch (e) {
        console.error("changeCartQuantity error:", e);
        window.toast.error("Failed to update quantity.");
        await getCartitems(false); 
      }
    },
    [cart, isSignedIn, userdetails?.id, getCartitems, removeFromCart, BACKEND_URL, getToken]
  );

  // --- 8. Clear Cart ---
  const clearCart = useCallback(async () => {
    // 🟢 GUEST LOGIC
    if (!isSignedIn) {
      setCart([]);
      writeLS(LS_CART_KEY, []);
      window.toast.info("Cart cleared.");
      return;
    }
    
    // 🔒 AUTHENTICATED LOGIC
    if (!userdetails?.id) return;
    const oldCart = cart;
    setCart([]);
    try {
      const token = await getToken();
      await fetch(`${BACKEND_URL}/api/cart/${userdetails.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      window.toast.info("Cart cleared.");
    } catch (e) {
      console.error("clearCart error:", e);
      window.toast.error("Failed to clear cart.");
      setCart(oldCart);
    }
  }, [cart, isSignedIn, userdetails?.id, BACKEND_URL, getToken]);

  // --- 9. Add to Wishlist ---
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

      // 🟢 GUEST LOGIC
      if (!isSignedIn) {
        const newWishlist = [...wishlist, { product, variant, variantId: variant.id }];
        setWishlist(newWishlist);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        window.toast.success(`${product.name} (${variant.name}) added to wishlist.`);
        return true;
      }

      // 🔒 AUTHENTICATED LOGIC
      if (!userdetails?.id) return false;

      const optimisticUpdate = [...wishlist, { product, variant, variantId: variant.id, userId: userdetails.id }];
      setWishlist(optimisticUpdate);

      try {
        const headers = await getAuthHeaders();
        await fetch(`${BACKEND_URL}/api/cart/wishlist`, {
          method: "POST",
          headers,
          body: JSON.stringify({ 
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
    [wishlist, isSignedIn, userdetails?.id, getwishlist, BACKEND_URL, getToken]
  );

  // --- 10. Remove from Wishlist ---
  const removeFromWishlist = useCallback(
    async (variant) => {
      // 🟢 GUEST LOGIC
      if (!isSignedIn) {
        const newWishlist = wishlist.filter((item) => (item.variantId ?? item.variant?.id) !== variant.id);
        setWishlist(newWishlist);
        writeLS(LS_WISHLIST_KEY, newWishlist);
        window.toast.info(`Item removed from wishlist.`);
        return;
      }

      // 🔒 AUTHENTICATED LOGIC
      if (!userdetails?.id) return;

      const optimisticUpdate = wishlist.filter((item) => (item.variantId ?? item.variant?.id) !== variant.id);
      setWishlist(optimisticUpdate);

      try {
        const token = await getToken();
        await fetch(`${BACKEND_URL}/api/cart/wishlist/${userdetails.id}/${variant.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        window.toast.info(`Item removed from wishlist.`);
      } catch (e) {
        console.error("removeFromWishlist error:", e);
        window.toast.error(`Failed to remove item from wishlist.`);
        await getwishlist(); 
      }
    },
    [wishlist, isSignedIn, userdetails?.id, getwishlist, BACKEND_URL, getToken]
  );

  // --- 11. Clear Wishlist ---
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
      const token = await getToken();
      await fetch(`${BACKEND_URL}/api/cart/wishlist/${userdetails.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      window.toast.info("Wishlist cleared.");
    } catch (e) {
      console.error("clearWishlist error:", e);
      window.toast.error("Failed to clear wishlist.");
      setWishlist(oldWishlist);
    }
  }, [wishlist, isSignedIn, userdetails?.id, BACKEND_URL, getToken]);

  // --- 12. Toggle Wishlist ---
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

  // --- 13. Move to Wishlist (from Cart) ---
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

  // --- 14. Move to Cart (from Wishlist) ---
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

  // --- 15. Buy Now Logic (Local Only) ---
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

  // --- 16. Custom Bundle (Authenticated Only) ---
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
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/cart/add-custom-bundle`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          templateVariantId: templateVariantId,
          contentVariantIds: contentVariantIds,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create custom bundle");
      }
      
      const newCartItemRow = await res.json(); 
      const refreshedCart = await getCartitems(false); 
      
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
  }, [userdetails?.id, BACKEND_URL, getCartitems, getToken]);

  // --- 17. Save For Later (Authenticated Only) ---
  const saveForLater = useCallback(async (item) => {
    if (!userdetails?.id) {
       window.toast.error("Please login to save items.");
       return;
    }

    const variantId = item.variant.id || item.variantId;
    const quantityToSave = item.quantity;

    const newCart = cart.filter(c => c.variant.id !== variantId);
    setCart(newCart);

    const existingIndex = savedItems.findIndex(s => s.variant.id === variantId);
    let newSaved;

    if (existingIndex > -1) {
      newSaved = [...savedItems];
      const existingItem = newSaved[existingIndex];
      newSaved[existingIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + quantityToSave
      };
    } else {
      const itemToSave = { 
        ...item, 
        userId: userdetails.id,
        quantity: quantityToSave, 
        variant: item.variant,
        product: item.product
      };
      newSaved = [...savedItems, itemToSave];
    }
    
    setSavedItems(newSaved);

    try {
      const headers = await getAuthHeaders();
      await fetch(`${BACKEND_URL}/api/cart/save-for-later`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          variantId: variantId,
          quantity: quantityToSave
        }),
      });
      window.toast.success("Saved for later");
    } catch (e) {
      console.error("saveForLater error:", e);
      window.toast.error("Failed to save item");
      await getCartitems(false); 
      await getSavedItems(); 
    }
  }, [cart, savedItems, userdetails?.id, BACKEND_URL, getCartitems, getSavedItems, getToken]);
  
  const moveSavedToCart = useCallback(async (item) => {
    if (!userdetails?.id) return;

    const newSaved = savedItems.filter(s => s.variant.id !== item.variant.id);
    setSavedItems(newSaved);

    const existingIndex = cart.findIndex((c) => c.variant.id === item.variant.id);
    let newCart;
    if (existingIndex > -1) {
      newCart = [...cart];
      newCart[existingIndex] = {
        ...newCart[existingIndex],
        quantity: newCart[existingIndex].quantity + item.quantity
      };
    } else {
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
      const headers = await getAuthHeaders();
      await fetch(`${BACKEND_URL}/api/cart/move-to-cart`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          variantId: item.variant.id,
          quantity: item.quantity
        }),
      });
      window.toast.success("Moved back to cart");
      
      await getCartitems(false); 
    } catch (e) {
      console.error("moveSavedToCart error:", e);
      window.toast.error("Failed to move item");
      await getSavedItems();
      await getCartitems(false);
    }
  }, [savedItems, cart, userdetails?.id, BACKEND_URL, getCartitems, getSavedItems, getToken]);

  const removeSavedItem = useCallback(async (variantId) => {
    if (!userdetails?.id) return;

    const newSaved = savedItems.filter(s => s.variant.id !== variantId);
    setSavedItems(newSaved);

    try {
      const token = await getToken();
      await fetch(`${BACKEND_URL}/api/cart/saved-for-later/${userdetails.id}/${variantId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      window.toast.info("Item removed");
    } catch (e) {
      console.error("removeSavedItem error:", e);
      await getSavedItems(); 
    }
  }, [savedItems, userdetails?.id, BACKEND_URL, getSavedItems, getToken]);

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