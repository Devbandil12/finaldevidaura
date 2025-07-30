import React, { createContext, useState, useEffect, useContext } from "react";
import { db } from "../../configs";
import {
  addToCartTable,
  productsTable,
  wishlistTable,
} from "../../configs/schema";
import { and, eq } from "drizzle-orm";
import { UserContext } from "./UserContext";

export const CartContext = createContext();

const LS_CART_KEY = "guest_cart";
const LS_WISHLIST_KEY = "guest_wishlist";

const uuid = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};
const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]); // [{ product, quantity, cartId?, userId? }]
  const [wishlist, setWishlist] = useState([]); // [{ product, productId, wishlistId?, userId? }]

  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Kept for compatibility with your app
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);

  const { userdetails } = useContext(UserContext);
  const isSignedIn = !!userdetails?.id;

  // ------------ FETCHERS ------------
  const getCartitems = async () => {
    if (!isSignedIn) {
      // Guest mode: hydrate from localStorage
      const guest = readLS(LS_CART_KEY, []);
      // Normalize: ensure each item has a cartId for React lists
      const normalized = guest.map((i) => ({
        ...i,
        cartId: i.cartId || uuid(),
      }));
      setCart(normalized);
      return;
    }

    try {
      setIsCartLoading(true);
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
    } catch (e) {
      console.error("getCartitems error:", e);
    } finally {
      setIsCartLoading(false);
    }
  };

  const getwishlist = async () => {
    if (!isSignedIn) {
      const guest = readLS(LS_WISHLIST_KEY, []);
      setWishlist(guest);
      return;
    }

    try {
      setIsWishlistLoading(true);
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
    } catch (e) {
      console.error("getwishlist error:", e);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // ------------ GUEST <-> DB MERGE ON SIGN-IN ------------
  const mergeGuestCartIntoDB = async () => {
    const guest = readLS(LS_CART_KEY, []);
    if (!guest.length) return;

    try {
      // For each guest item, upsert into DB (sum quantities)
      for (const g of guest) {
        const productId = g.product.id;
        const quantity = g.quantity || 1;

        // Find if product exists in current DB cart (may not yet be fetched)
        const existing = cart.find((i) => i.product.id === productId);
        if (existing) {
          const newQty = (existing.quantity || 1) + quantity;
          await db
            .update(addToCartTable)
            .set({ quantity: newQty })
            .where(
              and(
                eq(addToCartTable.userId, userdetails.id),
                eq(addToCartTable.productId, productId)
              )
            );
        } else {
          await db.insert(addToCartTable).values({
            userId: userdetails.id,
            productId,
            quantity,
          });
        }
      }
      // Clear guest storage and rehydrate from DB
      writeLS(LS_CART_KEY, []);
      await getCartitems();
    } catch (e) {
      console.error("mergeGuestCartIntoDB error:", e);
    }
  };

  const mergeGuestWishlistIntoDB = async () => {
    const guest = readLS(LS_WISHLIST_KEY, []);
    if (!guest.length) return;

    try {
      const dbProducts = new Set(wishlist.map((w) => w.productId));
      for (const g of guest) {
        const pid = g.productId || g.product?.id;
        if (!pid || dbProducts.has(pid)) continue;
        await db.insert(wishlistTable).values({
          userId: userdetails.id,
          productId: pid,
        });
      }
      writeLS(LS_WISHLIST_KEY, []);
      await getwishlist();
    } catch (e) {
      console.error("mergeGuestWishlistIntoDB error:", e);
    }
  };

  // ------------ CART MUTATIONS ------------
  const addToCart = async (product, quantity = 1) => {
    if (!product) return false;

    if (!isSignedIn) {
      // Guest mode: merge & persist to localStorage
      const existing = cart.find((i) => i.product.id === product.id);
      let next;
      if (existing) {
        next = cart.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: (i.quantity || 1) + quantity }
            : i
        );
      } else {
        next = [
          ...cart,
          { product, quantity, cartId: uuid(), userId: null },
        ];
      }
      setCart(next);
      // Save a simplified copy for guests
      writeLS(
        LS_CART_KEY,
        next.map(({ product, quantity, cartId }) => ({ product, quantity, cartId }))
      );
      return true;
    }

    // Signed-in: DB-backed
    const existing = cart.find((i) => i.product.id === product.id);
    const tempId = existing ? null : uuid();

    // Optimistic UI
    setCart((prev) => {
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: (i.quantity || 1) + quantity }
            : i
        );
      }
      return [...prev, { product, quantity, cartId: tempId, userId: userdetails.id }];
    });

    try {
      if (existing) {
        const newQty = (existing.quantity || 1) + quantity;
        await db
          .update(addToCartTable)
          .set({ quantity: newQty })
          .where(
            and(
              eq(addToCartTable.userId, userdetails.id),
              eq(addToCartTable.productId, product.id)
            )
          );
      } else {
        const [row] = await db
          .insert(addToCartTable)
          .values({
            productId: product.id,
            userId: userdetails.id,
            quantity,
          })
          .returning({
            cartId: addToCartTable.id,
            userId: addToCartTable.userId,
            quantity: addToCartTable.quantity,
          });

        setCart((prev) =>
          prev.map((i) =>
            i.cartId === tempId ? { ...i, cartId: row.cartId, quantity: row.quantity } : i
          )
        );
      }
      return true;
    } catch (e) {
      console.error("addToCart error:", e);
      // rollback
      setCart((prev) => {
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id ? { ...i, quantity: existing.quantity } : i
          );
        }
        return prev.filter((i) => i.cartId !== tempId);
      });
      return false;
    }
  };

  const removeFromCart = async (productId) => {
    if (!productId && productId !== 0) return false;

    if (!isSignedIn) {
      const next = cart.filter((i) => i.product.id !== productId);
      setCart(next);
      writeLS(
        LS_CART_KEY,
        next.map(({ product, quantity, cartId }) => ({ product, quantity, cartId }))
      );
      return true;
    }

    const backup = cart;
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
    try {
      await db
        .delete(addToCartTable)
        .where(
          and(
            eq(addToCartTable.userId, userdetails.id),
            eq(addToCartTable.productId, productId)
          )
        );
      return true;
    } catch (e) {
      console.error("removeFromCart error:", e);
      setCart(backup);
      return false;
    }
  };

  const changeCartQuantity = async (productId, delta) => {
    if (!delta) return false;
    const existing = cart.find((i) => i.product.id === productId);
    if (!existing) return false;

    const current = existing.quantity || 1;
    const nextQty = Math.max(0, current + delta);

    if (!isSignedIn) {
      // Guest
      let next;
      if (nextQty === 0) {
        next = cart.filter((i) => i.product.id !== productId);
      } else {
        next = cart.map((i) =>
          i.product.id === productId ? { ...i, quantity: nextQty } : i
        );
      }
      setCart(next);
      writeLS(
        LS_CART_KEY,
        next.map(({ product, quantity, cartId }) => ({ product, quantity, cartId }))
      );
      return true;
    }

    // Signed in
    const backup = cart;
    setCart((prev) =>
      nextQty === 0
        ? prev.filter((i) => i.product.id !== productId)
        : prev.map((i) =>
            i.product.id === productId ? { ...i, quantity: nextQty } : i
          )
    );

    try {
      if (nextQty === 0) {
        await db
          .delete(addToCartTable)
          .where(
            and(
              eq(addToCartTable.userId, userdetails.id),
              eq(addToCartTable.productId, productId)
            )
          );
      } else {
        await db
          .update(addToCartTable)
          .set({ quantity: nextQty })
          .where(
            and(
              eq(addToCartTable.userId, userdetails.id),
              eq(addToCartTable.productId, productId)
            )
          );
      }
      return true;
    } catch (e) {
      console.error("changeCartQuantity error:", e);
      setCart(backup);
      return false;
    }
  };

  const clearCart = async () => {
    if (!isSignedIn) {
      setCart([]);
      writeLS(LS_CART_KEY, []);
      return true;
    }
    const backup = cart;
    setCart([]);
    try {
      await db.delete(addToCartTable).where(eq(addToCartTable.userId, userdetails.id));
      return true;
    } catch (e) {
      console.error("clearCart error:", e);
      setCart(backup);
      return false;
    }
  };

  // ------------ WISHLIST MUTATIONS ------------
  const toggleWishlist = async (product) => {
    const exists = wishlist.some((w) => (w.productId ?? w.product?.id) === product.id);
    if (exists) return removeFromWishlist(product.id);
    return addToWishlist(product);
  };

  const addToWishlist = async (product) => {
    if (!product) return false;

    if (!isSignedIn) {
      const exists = wishlist.some((w) => (w.productId ?? w.product?.id) === product.id);
      if (exists) return true;
      const next = [
        ...wishlist,
        { productId: product.id, wishlistId: uuid(), userId: null, product },
      ];
      setWishlist(next);
      writeLS(LS_WISHLIST_KEY, next);
      return true;
    }

    // Signed in
    const tempId = uuid();
    setWishlist((prev) => [
      ...prev,
      { productId: product.id, wishlistId: tempId, userId: userdetails.id, product },
    ]);

    try {
      const [row] = await db
        .insert(wishlistTable)
        .values({ userId: userdetails.id, productId: product.id })
        .returning({
          wishlistId: wishlistTable.id,
          productId: wishlistTable.productId,
          userId: wishlistTable.userId,
        });

      setWishlist((prev) =>
        prev.map((w) =>
          w.wishlistId === tempId ? { ...w, wishlistId: row.wishlistId } : w
        )
      );
      return true;
    } catch (e) {
      console.error("addToWishlist error:", e);
      setWishlist((prev) => prev.filter((w) => w.wishlistId !== tempId));
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!isSignedIn) {
      const next = wishlist.filter((w) => (w.productId ?? w.product?.id) !== productId);
      setWishlist(next);
      writeLS(LS_WISHLIST_KEY, next);
      return true;
    }

    const backup = wishlist;
    setWishlist((prev) => prev.filter((w) => w.productId !== productId));

    try {
      await db
        .delete(wishlistTable)
        .where(
          and(
            eq(wishlistTable.userId, userdetails.id),
            eq(wishlistTable.productId, productId)
          )
        );
      return true;
    } catch (e) {
      console.error("removeFromWishlist error:", e);
      setWishlist(backup);
      return false;
    }
  };

  // ------------ BUY NOW HELPERS ------------
  const startBuyNow = (product, quantity = 1) => {
    const temp = {
      product,
      quantity,
      cartId: uuid(),
      userId: isSignedIn ? userdetails.id : null,
    };
    try {
      localStorage.setItem("buyNowItem", JSON.stringify(temp));
      localStorage.setItem("buyNowActive", "true");
      return true;
    } catch (e) {
      console.error("startBuyNow error:", e);
      return false;
    }
  };

  const clearBuyNow = () => {
    try {
      localStorage.removeItem("buyNowItem");
      localStorage.removeItem("buyNowActive");
      return true;
    } catch (e) {
      console.error("clearBuyNow error:", e);
      return false;
    }
  };

  // ------------ TOTALS UTILITY ------------
  const computeTotals = (items = cart) => {
    const totalOriginal = items.reduce(
      (sum, i) => sum + (i.product?.oprice || 0) * (i.quantity || 1),
      0
    );
    const totalDiscounted = items.reduce((sum, i) => {
      const price = Math.floor(
        (i.product?.oprice || 0) * (1 - (i.product?.discount || 0) / 100)
      );
      return sum + price * (i.quantity || 1);
    }, 0);
    return { totalOriginal, totalDiscounted };
  };

  // ------------ EFFECTS ------------
  // When auth status changes: switch sources and merge guest -> DB
  useEffect(() => {
    (async () => {
      if (isSignedIn) {
        await getCartitems();
        await getwishlist();
        // Try to merge any guest data if present
        await mergeGuestCartIntoDB();
        await mergeGuestWishlistIntoDB();
      } else {
        // Guest mode: load from LS
        const gCart = readLS(LS_CART_KEY, []);
        setCart(gCart.map((i) => ({ ...i, cartId: i.cartId || uuid() })));
        const gWish = readLS(LS_WISHLIST_KEY, []);
        setWishlist(gWish);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userdetails?.id]);

  return (
    <CartContext.Provider
      value={{
        // state
        cart,
        wishlist,
        isCartLoading,
        isWishlistLoading,

        // compatibility state
        selectedCoupon,
        setSelectedCoupon,
        couponDiscount,
        setCouponDiscount,
        selectedItems,
        setSelectedItems,

        // fetchers
        getCartitems,
        getwishlist,

        // cart ops
        addToCart,
        removeFromCart,
        changeCartQuantity,
        clearCart,

        // wishlist ops
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,

        // buy now
        startBuyNow,
        clearBuyNow,

        // utilities
        computeTotals,

        // expose setters if ever needed
        setCart,
        setWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
