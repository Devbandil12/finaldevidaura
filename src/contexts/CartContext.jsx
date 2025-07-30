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

const uuid = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const CartProvider = ({ children }) => {
  // ---- State ----
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Kept for compatibility with your current app
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);

  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const { userdetails } = useContext(UserContext);

  // ---- Fetchers (authoritative from DB) ----
  const getCartitems = async () => {
    if (!userdetails?.id) return;
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
    } catch (error) {
      console.error("getCartitems error:", error);
    } finally {
      setIsCartLoading(false);
    }
  };

  const getwishlist = async () => {
    if (!userdetails?.id) return;
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
    } catch (error) {
      console.error("getwishlist error:", error);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // ---- Cart mutations ----

  /**
   * Add product to cart.
   * - If already there, merges by increasing quantity.
   * - Optimistic UI then persists to DB.
   * - Replaces temporary cartId with DB row id after insert.
   * @returns true if attempted, false if user not signed in
   */
  const addToCart = async (product, quantity = 1) => {
    if (!userdetails?.id) {
      console.warn("addToCart: user not signed in");
      return false;
    }

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
      return [
        ...prev,
        {
          product,
          quantity,
          cartId: tempId,
          userId: userdetails.id,
        },
      ];
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

        // Replace temp with DB row id so future updates use correct id
        setCart((prev) =>
          prev.map((i) =>
            i.cartId === tempId
              ? { ...i, cartId: row.cartId, quantity: row.quantity }
              : i
          )
        );
      }
      return true;
    } catch (error) {
      console.error("addToCart error:", error);
      // Roll back optimistic change
      setCart((prev) => {
        if (existing) {
          // Revert to existing qty
          return prev.map((i) =>
            i.product.id === product.id ? { ...i, quantity: existing.quantity } : i
          );
        }
        return prev.filter((i) => i.cartId !== tempId);
      });
      return false;
    }
  };

  /**
   * Remove a product from cart.
   */
  const removeFromCart = async (productId) => {
    if (!userdetails?.id) {
      console.warn("removeFromCart: user not signed in");
      return false;
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
    } catch (error) {
      console.error("removeFromCart error:", error);
      setCart(backup); // rollback optimistic removal
      return false;
    }
  };

  /**
   * Change quantity by delta (+1 / -1).
   * If quantity becomes 0, item is removed.
   */
  const changeCartQuantity = async (productId, delta) => {
    if (!userdetails?.id || !delta) {
      console.warn("changeCartQuantity: missing user or delta");
      return false;
    }
    const existing = cart.find((i) => i.product.id === productId);
    if (!existing) return false;

    const currentQty = existing.quantity || 1;
    const nextQty = Math.max(0, currentQty + delta);

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
    } catch (error) {
      console.error("changeCartQuantity error:", error);
      setCart(backup); // rollback
      return false;
    }
  };

  /**
   * Clear the entire cart.
   */
  const clearCart = async () => {
    if (!userdetails?.id) {
      console.warn("clearCart: user not signed in");
      return false;
    }
    const backup = cart;
    setCart([]); // optimistic
    try {
      await db.delete(addToCartTable).where(eq(addToCartTable.userId, userdetails.id));
      return true;
    } catch (error) {
      console.error("clearCart error:", error);
      setCart(backup);
      return false;
    }
  };

  // ---- Wishlist mutations ----
  const toggleWishlist = async (product) => {
    if (!userdetails?.id) {
      console.warn("toggleWishlist: user not signed in");
      return false;
    }
    const existing = wishlist.find((w) => w.productId === product.id);
    if (existing) {
      return removeFromWishlist(product.id);
    }
    return addToWishlist(product);
  };

  const addToWishlist = async (product) => {
    if (!userdetails?.id) return false;
    const tempId = uuid();

    // Optimistic
    setWishlist((prev) => [
      ...prev,
      { productId: product.id, wishlistId: tempId, userId: userdetails.id, product },
    ]);

    try {
      const [row] = await db
        .insert(wishlistTable)
        .values({
          userId: userdetails.id,
          productId: product.id,
        })
        .returning({
          wishlistId: wishlistTable.id,
          productId: wishlistTable.productId,
          userId: wishlistTable.userId,
        });

      // Replace temp with DB id
      setWishlist((prev) =>
        prev.map((w) =>
          w.wishlistId === tempId
            ? { ...w, wishlistId: row.wishlistId }
            : w
        )
      );
      return true;
    } catch (error) {
      console.error("addToWishlist error:", error);
      // Rollback
      setWishlist((prev) => prev.filter((w) => w.wishlistId !== tempId));
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!userdetails?.id) return false;

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
    } catch (error) {
      console.error("removeFromWishlist error:", error);
      setWishlist(backup);
      return false;
    }
  };

  // ---- Buy Now helpers (aligns with your ShoppingCart usage) ----
  const startBuyNow = (product, quantity = 1) => {
    // Same payload your ShoppingCart expects
    const temp = {
      product,
      quantity,
      cartId: uuid(),
      userId: userdetails?.id ?? null,
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

  // ---- Totals utility (optional helper for UI) ----
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

  // ---- Effects ----
  useEffect(() => {
    if (userdetails?.id) {
      getCartitems();
      getwishlist();
    } else {
      // Reset when user logs out
      setCart([]);
      setWishlist([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userdetails?.id]);

  // ---- Provider ----
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

        // expose setters if you really need them elsewhere
        setCart,
        setWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
