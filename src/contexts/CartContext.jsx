import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { db } from "../../configs";
import {
  addToCartTable,
  productsTable,
  wishlistTable,
} from "../../configs/schema";
import { and, eq } from "drizzle-orm";
import { UserContext } from "./UserContext";

export const CartContext = createContext();

// ---------- LocalStorage keys for guest mode ----------
const LS_CART_KEY = "guest_cart";
const LS_WISHLIST_KEY = "guest_wishlist";

// ---------- Small helpers ----------
const uuid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const readLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
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
  // State shapes match your components’ expectations
  const [cart, setCart] = useState([]); // [{ product, quantity, cartId, userId }]
  const [wishlist, setWishlist] = useState([]); // [{ product, productId, wishlistId, userId }]

  // Loader flags (only for signed-in DB operations)
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Kept for compatibility (your app references these)
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);

  const { userdetails } = useContext(UserContext);
  const isSignedIn = !!userdetails?.id;

  // Guard so merges run once per sign-in (avoid Strict Mode double-run)
  const mergedOnceRef = useRef(false);

  // =========================
  // Fetchers
  // =========================

  // Cart
  const getCartitems = useCallback(async () => {
    if (!isSignedIn) {
      // Guest: hydrate from LS, no loader
      const guest = readLS(LS_CART_KEY, []);
      const normalized = guest.map((i) => ({
        product: i.product,
        quantity: Number(i.quantity || 1),
        cartId: i.cartId || uuid(),
        userId: null,
      }));
      setCart(normalized);
      return;
    }

    // Signed-in: fetch from DB with loader
    setIsCartLoading(true);
    try {
      const rows = await db
        .select({
          product: productsTable,
          userId: addToCartTable.userId,
          cartId: addToCartTable.id,
          quantity: addToCartTable.quantity,
        })
        .from(addToCartTable)
        .innerJoin(
          productsTable,
          eq(addToCartTable.productId, productsTable.id)
        )
        .where(eq(addToCartTable.userId, userdetails.id));

      setCart(rows);
    } catch (e) {
      console.error("getCartitems error:", e);
    } finally {
      setIsCartLoading(false);
    }
  }, [isSignedIn, userdetails?.id]);

  // Wishlist
  const getwishlist = useCallback(async () => {
    if (!isSignedIn) {
      // Guest: hydrate from LS, no loader
      const guest = readLS(LS_WISHLIST_KEY, []);
      const normalized = guest.map((w) => ({
        product: w.product,
        productId: w.productId ?? w.product?.id,
        wishlistId: w.wishlistId || uuid(),
        userId: null,
      }));
      setWishlist(normalized);
      return;
    }

    // Signed-in: fetch from DB with loader
    setIsWishlistLoading(true);
    try {
      const rows = await db
        .select({
          product: productsTable,
          wishlistId: wishlistTable.id,
          userId: wishlistTable.userId,
          productId: wishlistTable.productId,
        })
        .from(wishlistTable)
        .innerJoin(
          productsTable,
          eq(wishlistTable.productId, productsTable.id)
        )
        .where(eq(wishlistTable.userId, userdetails.id));

      setWishlist(rows);
    } catch (e) {
      console.error("getwishlist error:", e);
    } finally {
      setIsWishlistLoading(false);
    }
  }, [isSignedIn, userdetails?.id]);

  // =========================
  // Cart mutations
  // =========================

  const addToCart = useCallback(
    async (product, quantity = 1) => {
      if (!product) return false;
      const qtyToAdd = Number(quantity || 1);

      if (!isSignedIn) {
        // Guest: state + LS
        const existing = cart.find((i) => i.product?.id === product.id);
        const next = existing
          ? cart.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: Number(i.quantity || 1) + qtyToAdd }
                : i
            )
          : [...cart, { product, quantity: qtyToAdd, cartId: uuid(), userId: null }];
        setCart(next);
        writeLS(
          LS_CART_KEY,
          next.map(({ product, quantity, cartId }) => ({
            product,
            quantity,
            cartId,
          }))
        );
        return true;
      }

      // Signed-in: optimistic update + DB
      const existing = cart.find((i) => i.product?.id === product.id);
      const tempId = existing ? null : uuid();

      setCart((prev) =>
        existing
          ? prev.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: Number(i.quantity || 1) + qtyToAdd }
                : i
            )
          : [
              ...prev,
              {
                product,
                quantity: qtyToAdd,
                cartId: tempId,
                userId: userdetails.id,
              },
            ]
      );

      try {
        if (existing) {
          const newQty = Number(existing.quantity || 1) + qtyToAdd;
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
              quantity: qtyToAdd,
            })
            .returning({
              cartId: addToCartTable.id,
              userId: addToCartTable.userId,
              quantity: addToCartTable.quantity,
            });

          setCart((prev) =>
            prev.map((i) =>
              i.cartId === tempId
                ? { ...i, cartId: row.cartId, quantity: Number(row.quantity) }
                : i
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
              i.product.id === product.id
                ? { ...i, quantity: existing.quantity }
                : i
            );
          }
          return prev.filter((i) => i.cartId !== tempId);
        });
        return false;
      }
    },
    [cart, isSignedIn, userdetails?.id]
  );

  const removeFromCart = useCallback(
    async (productId) => {
      if (productId === undefined || productId === null) return false;

      if (!isSignedIn) {
        const next = cart.filter((i) => i.product?.id !== productId);
        setCart(next);
        writeLS(
          LS_CART_KEY,
          next.map(({ product, quantity, cartId }) => ({
            product,
            quantity,
            cartId,
          }))
        );
        return true;
      }

      const backup = cart;
      setCart((prev) => prev.filter((i) => i.product?.id !== productId));
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
    },
    [cart, isSignedIn, userdetails?.id]
  );

  const changeCartQuantity = useCallback(
    async (productId, delta) => {
      if (!delta) return false;
      const existing = cart.find((i) => i.product?.id === productId);
      if (!existing) return false;

      const current = Number(existing.quantity || 1);
      const nextQty = Math.max(0, current + Number(delta));

      if (!isSignedIn) {
        const next =
          nextQty === 0
            ? cart.filter((i) => i.product?.id !== productId)
            : cart.map((i) =>
                i.product?.id === productId ? { ...i, quantity: nextQty } : i
              );
        setCart(next);
        writeLS(
          LS_CART_KEY,
          next.map(({ product, quantity, cartId }) => ({
            product,
            quantity,
            cartId,
          }))
        );
        return true;
      }

      const backup = cart;
      setCart((prev) =>
        nextQty === 0
          ? prev.filter((i) => i.product?.id !== productId)
          : prev.map((i) =>
              i.product?.id === productId ? { ...i, quantity: nextQty } : i
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
    },
    [cart, isSignedIn, userdetails?.id]
  );

  const clearCart = useCallback(async () => {
    if (!isSignedIn) {
      setCart([]);
      writeLS(LS_CART_KEY, []);
      return true;
    }

    const backup = cart;
    setCart([]);
    try {
      await db
        .delete(addToCartTable)
        .where(eq(addToCartTable.userId, userdetails.id));
      return true;
    } catch (e) {
      console.error("clearCart error:", e);
      setCart(backup);
      return false;
    }
  }, [cart, isSignedIn, userdetails?.id]);

  // =========================
  // Wishlist mutations
  // =========================

  const addToWishlist = useCallback(
    async (product) => {
      if (!product) return false;

      if (!isSignedIn) {
        const exists = wishlist.some(
          (w) => (w.productId ?? w.product?.id) === product.id
        );
        if (exists) return true;

        const next = [
          ...wishlist,
          {
            product,
            productId: product.id,
            wishlistId: uuid(),
            userId: null,
          },
        ];
        setWishlist(next);
        writeLS(LS_WISHLIST_KEY, next);
        return true;
      }

      // ✅ Avoid duplicates while signed-in (prevents UI dupes & DB unique errors)
      if (
        wishlist.some(
          (w) => (w.productId ?? w.product?.id) === product.id
        )
      ) {
        return true;
      }

      // Signed-in: optimistic + DB
      const tempId = uuid();
      setWishlist((prev) => [
        ...prev,
        {
          product,
          productId: product.id,
          wishlistId: tempId,
          userId: userdetails.id,
        },
      ]);

      try {
        // Insert only if not exists
        const exists = await db
          .select({ id: wishlistTable.id })
          .from(wishlistTable)
          .where(
            and(
              eq(wishlistTable.userId, userdetails.id),
              eq(wishlistTable.productId, product.id)
            )
          );

        if (exists.length === 0) {
          await db.insert(wishlistTable).values({
            userId: userdetails.id,
            productId: product.id,
          });
        }

        // Refresh from DB to normalize ids
        await getwishlist();
        return true;
      } catch (e) {
        console.error("addToWishlist error:", e);
        setWishlist((prev) => prev.filter((w) => w.wishlistId !== tempId));
        return false;
      }
    },
    [wishlist, isSignedIn, userdetails?.id, getwishlist]
  );

  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!isSignedIn) {
        const next = wishlist.filter(
          (w) => (w.productId ?? w.product?.id) !== productId
        );
        setWishlist(next);
        writeLS(LS_WISHLIST_KEY, next);
        return true;
      }

      const backup = wishlist;
      setWishlist((prev) => prev.filter((w) => (w.productId ?? w.product?.id) !== productId));
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
    },
    [wishlist, isSignedIn, userdetails?.id]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      const exists = wishlist.some(
        (w) => (w.productId ?? w.product?.id) === product.id
      );
      if (exists) return removeFromWishlist(product.id);
      return addToWishlist(product);
    },
    [wishlist, addToWishlist, removeFromWishlist]
  );

  // =========================
  // Buy Now helpers (localStorage)
  // =========================

  const startBuyNow = useCallback(
    (product, quantity = 1) => {
      const temp = {
        product,
        quantity: Number(quantity || 1),
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
    },
    [isSignedIn, userdetails?.id]
  );

  const clearBuyNow = useCallback(() => {
    try {
      localStorage.removeItem("buyNowItem");
      localStorage.removeItem("buyNowActive");
      return true;
    } catch {
      return false;
    }
  }, []);

  // =========================
  // Merge guest ➜ user on login
  // =========================

  /** Merge guest cart (localStorage) into the signed-in user's DB cart. */
  const mergeGuestCartIntoDB = useCallback(async () => {
    if (!isSignedIn) return;

    const guestCart = readLS(LS_CART_KEY, []);
    if (!guestCart.length) return;

    try {
      // Build a quick lookup from current DB-backed cart state
      const existingMap = new Map(
        cart.map((i) => [i.product?.id, i]) // productId -> cart row
      );

      for (const g of guestCart) {
        const productId = g?.product?.id;
        if (!productId) continue;

        const guestQty = Math.max(1, Number(g.quantity || 1));
        const existing = existingMap.get(productId);

        if (existing) {
          const newQty = Math.max(1, Number(existing.quantity || 1) + guestQty);
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
          await db
            .insert(addToCartTable)
            .values({
              userId: userdetails.id,
              productId,
              quantity: guestQty,
            });
        }
      }

      // Clear guest cart now that it's merged
      writeLS(LS_CART_KEY, []);

      // Refresh DB cart state
      await getCartitems();
      return true;
    } catch (e) {
      console.error("mergeGuestCartIntoDB error:", e);
      // Do NOT clear guest LS on failure
      return false;
    }
  }, [isSignedIn, userdetails?.id, cart, getCartitems]);

  /** Merge guest wishlist (localStorage) into the signed-in user's DB wishlist. */
  const mergeGuestWishlistIntoDB = useCallback(async () => {
    if (!isSignedIn) return;

    const guestWish = readLS(LS_WISHLIST_KEY, []);
    if (!guestWish.length) return;

    try {
      const existingIds = new Set(
        wishlist.map((w) => w.productId ?? w.product?.id)
      );

      for (const gw of guestWish) {
        const productId = gw?.productId ?? gw?.product?.id;
        if (!productId) continue;
        if (existingIds.has(productId)) continue; // already in DB

        await db
          .insert(wishlistTable)
          .values({ userId: userdetails.id, productId });
      }

      // Clear guest wishlist after merge
      writeLS(LS_WISHLIST_KEY, []);

      // Refresh DB wishlist state
      await getwishlist();
      return true;
    } catch (e) {
      console.error("mergeGuestWishlistIntoDB error:", e);
      return false;
    }
  }, [isSignedIn, userdetails?.id, wishlist, getwishlist]);

  // =========================
  // Initialize on auth changes (and merge once on login)
  // =========================

  useEffect(() => {
    (async () => {
      if (isSignedIn) {
        // 1) Load user's current DB state first (parallel fetch)
        await Promise.all([getCartitems(), getwishlist()]);

        // 2) Merge guest -> DB ONCE per sign-in (guarded for Strict Mode)
        if (!mergedOnceRef.current) {
          mergedOnceRef.current = true;
          await Promise.all([mergeGuestCartIntoDB(), mergeGuestWishlistIntoDB()]);
        }
      } else {
        // Reset guard when user signs out
        mergedOnceRef.current = false;

        // Guest: hydrate both from LS (no loaders)
        const gCart = readLS(LS_CART_KEY, []);
        setCart(
          gCart.map((i) => ({
            product: i.product,
            quantity: Number(i.quantity || 1),
            cartId: i.cartId || uuid(),
            userId: null,
          }))
        );

        const gWish = readLS(LS_WISHLIST_KEY, []);
        setWishlist(
          gWish.map((w) => ({
            product: w.product,
            productId: w.productId ?? w.product?.id,
            wishlistId: w.wishlistId || uuid(),
            userId: null,
          }))
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, userdetails?.id]);

  // =========================
  // Provider
  // =========================
  return (
    <CartContext.Provider
      value={{
        // state
        cart,
        setCart,
        wishlist,
        setWishlist,

        // loaders
        isCartLoading,
        isWishlistLoading,

        // compatibility fields
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
