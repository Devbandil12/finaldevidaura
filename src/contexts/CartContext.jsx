import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import { db } from "../../configs";
import { addToCartTable, productsTable, wishlistTable } from "../../configs/schema";
import { and, eq } from "drizzle-orm";
import { UserContext } from "./UserContext";

// ==== Storage keys for guest data ====
const GUEST_CART_KEY = "guest_cart_v1";
const GUEST_WISHLIST_KEY = "guest_wishlist_v1";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { userdetails } = useContext(UserContext);

  // Unified state used by both guest & logged-in flows
  const [cart, setCart] = useState([]);         // [{ product, quantity, cartId?, userId? }]
  const [wishlist, setWishlist] = useState([]); // [{ product, productId?, wishlistId?, userId? }]
  const [isCartLoading, setIsCartLoading] = useState(true);

  // Track previous userId to detect transitions guest -> logged-in, and avoid double-merge
  const prevUserIdRef = useRef(null);

  // ---------- Helpers: guest storage ----------
  const readGuestCart = () => {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveGuestCart = (items) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    } catch {}
  };

  const clearGuestCart = () => {
    localStorage.removeItem(GUEST_CART_KEY);
  };

  const readGuestWishlist = () => {
    try {
      const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveGuestWishlist = (items) => {
    try {
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
    } catch {}
  };

  const clearGuestWishlist = () => {
    localStorage.removeItem(GUEST_WISHLIST_KEY);
  };

  // ---------- DB hydration ----------
  const getCartitems = async () => {
    if (!userdetails?.id) {
      // Guest: hydrate from localStorage
      const guest = readGuestCart();
      setCart(guest);
      return;
    }
    // Logged-in: hydrate from DB
    const res = await db
      .select({
        product: productsTable,
        userId: addToCartTable.userId,
        cartId: addToCartTable.id,
        quantity: addToCartTable.quantity,
      })
      .from(addToCartTable)
      .innerJoin(productsTable, eq(addToCartTable.productId, productsTable.id))
      .where(eq(addToCartTable.userId, userdetails.id));

    setCart(res);
  };

  const getwishlist = async () => {
    if (!userdetails?.id) {
      // Guest: hydrate from localStorage
      const guest = readGuestWishlist();
      setWishlist(guest);
      return;
    }

    const res = await db
      .select({
        product: productsTable,
        wishlistId: wishlistTable.id,
        userId: wishlistTable.userId,
        productId: wishlistTable.productId,
      })
      .from(wishlistTable)
      .innerJoin(productsTable, eq(wishlistTable.productId, productsTable.id))
      .where(eq(wishlistTable.userId, userdetails.id));

    setWishlist(res);
  };

  // ---------- Merge guest -> user on first login ----------
  const mergeGuestDataOnLogin = async () => {
    // Only when we have a new logged-in user and there is guest data
    const guestCart = readGuestCart();
    const guestWishlist = readGuestWishlist();

    if ((!guestCart || guestCart.length === 0) && (!guestWishlist || guestWishlist.length === 0)) {
      return;
    }

    // Merge Cart: add quantities for duplicates; insert otherwise
    for (const item of guestCart) {
      const pid = item.product?.id;
      const qty = Number(item.quantity || 1);
      if (!pid || qty <= 0) continue;

      // Check if already in DB
      const existing = await db
        .select({ id: addToCartTable.id, quantity: addToCartTable.quantity })
        .from(addToCartTable)
        .where(and(eq(addToCartTable.userId, userdetails.id), eq(addToCartTable.productId, pid)));

      if (existing.length > 0) {
        const newQty = Number(existing[0].quantity || 0) + qty;
        await db
          .update(addToCartTable)
          .set({ quantity: newQty })
          .where(and(eq(addToCartTable.userId, userdetails.id), eq(addToCartTable.productId, pid)));
      } else {
        await db.insert(addToCartTable).values({
          userId: userdetails.id,
          productId: pid,
          quantity: qty,
        });
      }
    }

    // Merge Wishlist: insert if not exists
    for (const w of guestWishlist) {
      const pid = w.product?.id ?? w.productId;
      if (!pid) continue;

      const exists = await db
        .select({ id: wishlistTable.id })
        .from(wishlistTable)
        .where(and(eq(wishlistTable.userId, userdetails.id), eq(wishlistTable.productId, pid)));

      if (exists.length === 0) {
        await db.insert(wishlistTable).values({
          userId: userdetails.id,
          productId: pid,
        });
      }
    }

    // Clear guest storage after successful merge
    clearGuestCart();
    clearGuestWishlist();
  };

  // ---------- Mutations ----------
  const addToCart = async (product, quantity = 1) => {
    if (!product?.id) return false;

    if (!userdetails?.id) {
      // Guest: keep full product object to avoid extra fetches
      const next = (() => {
        const current = readGuestCart();
        const idx = current.findIndex((i) => i.product?.id === product.id);
        if (idx >= 0) {
          const copy = [...current];
          copy[idx] = {
            ...copy[idx],
            quantity: Number(copy[idx].quantity || 1) + Number(quantity || 1),
          };
          return copy;
        }
        return [
          ...current,
          {
            product,
            quantity: Number(quantity || 1),
            cartId: `g-${product.id}-${Date.now()}`,
          },
        ];
      })();

      saveGuestCart(next);
      setCart(next);
      return true;
    }

    // Logged-in: optimistic update
    const optimistic = [
      ...cart,
      {
        product,
        quantity: Number(quantity || 1),
        cartId: `t-${product.id}-${Date.now()}`,
        userId: userdetails.id,
      },
    ];
    setCart(optimistic);

    try {
      // Upsert: if exists, increase qty; else insert
      const existing = await db
        .select({ id: addToCartTable.id, quantity: addToCartTable.quantity })
        .from(addToCartTable)
        .where(and(eq(addToCartTable.userId, userdetails.id), eq(addToCartTable.productId, product.id)));

      if (existing.length > 0) {
        const newQty = Number(existing[0].quantity || 0) + Number(quantity || 1);
        await db
          .update(addToCartTable)
          .set({ quantity: newQty })
          .where(and(eq(addToCartTable.userId, userdetails.id), eq(addToCartTable.productId, product.id)));
      } else {
        await db.insert(addToCartTable).values({
          userId: userdetails.id,
          productId: product.id,
          quantity: Number(quantity || 1),
        });
      }

      await getCartitems();
      return true;
    } catch (e) {
      // rollback optimistic
      setCart((prev) => prev.filter((i) => !String(i.cartId).startsWith("t-")));
      return false;
    }
  };

  const changeCartQuantity = async (productId, delta) => {
    if (!productId) return;

    if (!userdetails?.id) {
      const next = readGuestCart().map((i) =>
        i.product?.id === productId
          ? { ...i, quantity: Math.max(1, Number(i.quantity || 1) + Number(delta)) }
          : i
      );
      saveGuestCart(next);
      setCart(next);
      return;
    }

    // Logged in
    const row = cart.find((i) => i.product?.id === productId);
    if (!row) return;
    const newQty = Math.max(1, Number(row.quantity || 1) + Number(delta));

    try {
      await db
        .update(addToCartTable)
        .set({ quantity: newQty })
        .where(and(eq(addToCartTable.userId, userdetails.id), eq(addToCartTable.productId, productId)));

      setCart((prev) =>
        prev.map((i) => (i.product?.id === productId ? { ...i, quantity: newQty } : i))
      );
    } catch (e) {
      // noop
    }
  };

  const removeFromCart = async (productId) => {
    if (!productId) return false;

    if (!userdetails?.id) {
      const next = readGuestCart().filter((i) => i.product?.id !== productId);
      saveGuestCart(next);
      setCart(next);
      return true;
    }

    const backup = [...cart];
    setCart((prev) => prev.filter((i) => i.product?.id !== productId));

    try {
      await db
        .delete(addToCartTable)
        .where(and(eq(addToCartTable.userId, userdetails.id), eq(addToCartTable.productId, productId)));
      return true;
    } catch (e) {
      setCart(backup); // rollback
      return false;
    }
  };

  const clearCart = async () => {
    if (!userdetails?.id) {
      clearGuestCart();
      setCart([]);
      return;
    }
    const backup = [...cart];
    setCart([]);
    try {
      await db.delete(addToCartTable).where(eq(addToCartTable.userId, userdetails.id));
    } catch (e) {
      setCart(backup);
    }
  };

  const addToWishlist = async (product) => {
    if (!product?.id) return false;

    if (!userdetails?.id) {
      const current = readGuestWishlist();
      if (current.some((w) => (w.product?.id ?? w.productId) === product.id)) {
        setWishlist(current);
        return true;
      }
      const next = [
        ...current,
        {
          product,
          productId: product.id,
          wishlistId: `g-${product.id}-${Date.now()}`,
        },
      ];
      saveGuestWishlist(next);
      setWishlist(next);
      return true;
    }

    // Logged in: optimistic
    if (wishlist.some((w) => (w.product?.id ?? w.productId) === product.id)) {
      return true;
    }

    const optimistic = [
      ...wishlist,
      {
        product,
        productId: product.id,
        wishlistId: `t-${product.id}-${Date.now()}`,
        userId: userdetails.id,
      },
    ];
    setWishlist(optimistic);

    try {
      // Insert if not exists
      const exists = await db
        .select({ id: wishlistTable.id })
        .from(wishlistTable)
        .where(and(eq(wishlistTable.userId, userdetails.id), eq(wishlistTable.productId, product.id)));
      if (exists.length === 0) {
        await db.insert(wishlistTable).values({
          userId: userdetails.id,
          productId: product.id,
        });
      }
      await getwishlist();
      return true;
    } catch (e) {
      setWishlist((prev) => prev.filter((i) => !String(i.wishlistId).startsWith("t-")));
      return false;
    }
  };

  // ---------- Effects: hydrate & merge flows ----------
  // Hydrate on first mount and whenever auth changes
  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      setIsCartLoading(true);
      try {
        // Detect transition guest -> logged-in
        const prevUserId = prevUserIdRef.current;
        const currentUserId = userdetails?.id ?? null;

        // If just logged in, first merge guest data into DB
        if (!prevUserId && currentUserId) {
          await mergeGuestDataOnLogin();
        }

        // Hydrate from the correct source
        await Promise.all([getCartitems(), getwishlist()]);

        // Update prev ref
        prevUserIdRef.current = currentUserId;
      } finally {
        if (mounted) setIsCartLoading(false);
      }
    };

    hydrate();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userdetails?.id]);

  return (
    <CartContext.Provider
      value={{
        // state
        cart,
        wishlist,
        isCartLoading,
        // mutations
        setCart,          // keep exposed for legacy usage
        setWishlist,      // keep exposed for legacy usage
        addToCart,
        changeCartQuantity,
        removeFromCart,
        clearCart,
        addToWishlist,
        // queries
        getCartitems,
        getwishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
