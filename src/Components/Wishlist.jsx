// src/pages/Wishlist.js

import React, { useContext, useEffect, useState } from "react";
import "../style/wishlist.css";
import { CartContext } from "../contexts/CartContext";
import { wishlistTable, addToCartTable } from "../../configs/schema";
import { eq, and } from "drizzle-orm";
import { db } from "../../configs";
import { UserContext } from "../contexts/UserContext";
import { toast, ToastContainer } from "react-toastify";

const Wishlist = () => {
  const [wishlistitems, setWishlistitems] = useState([]);
  const { wishlist, setWishlist, getwishlist, cart, setCart } =
    useContext(CartContext);

  // Fetch the latest wishlist when the component mounts
  useEffect(() => {
    getwishlist(); // Ensure latest data is fetched
  }, []);

  // Sync local state when wishlist updates
  useEffect(() => {
    setWishlistitems(wishlist);
  }, [wishlist]);

  const moveToCart = async (wishlistitem, index) => {
    const item = wishlistitems[index];
    if (!item) return;

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.product.id === item.productId
      );

      return existingItem
        ? prevCart.map((cartItem) =>
            cartItem.product.id === item.productId
              ? {
                  ...cartItem,
                  product: {
                    ...cartItem.product,
                    quantity: (cartItem.product.quantity || 1) + 1,
                  },
                }
              : cartItem
          )
        : [
            ...prevCart,
            {
              product: { ...item.product, quantity: 1 },
              cartId: item.wishlistId,
            },
          ];
    });

    // Remove from local wishlist state immediately
    setWishlistitems((prevWishlist) =>
      prevWishlist.filter((_, i) => i !== index)
    );

    try {
      // 🔹 Check if product is already in the cart
      const existingCartItem = await db
        .select()
        .from(addToCartTable)
        .where(
          and(
            eq(addToCartTable.userId, item.userId),
            eq(addToCartTable.productId, item.productId)
          )
        );
      console.log(existingCartItem);
      if (existingCartItem.length > 0) {
        // 🔹 If exists, update the quantity in DB
        await db
          .update(addToCartTable)
          .set({ quantity: existingCartItem[0].quantity + 1 })
          .where(
            and(
              eq(addToCartTable.userId, item.userId),
              eq(addToCartTable.productId, item.productId)
            )
          );
      } else {
        // 🔹 If doesn't exist, insert into cart
        const res = await db
          .insert(addToCartTable)
          .values({
            productId: item.productId,
            userId: item.userId,
            // Ensure quantity starts from 1
          })
          .returning({ cartId: addToCartTable.id });

        // 🔹 Update cart state with correct `cartId` from DB
        setCart((prevCart) =>
          prevCart.map((cartItem) =>
            cartItem.product.id === item.productId
              ? { ...cartItem, cartId: res[0]?.cartId }
              : cartItem
          )
        );
      }

      // 🔹 Remove from wishlist in DB after successful cart update
      await db
        .delete(wishlistTable)
        .where(
          and(
            eq(wishlistTable.userId, item.userId),
            eq(wishlistTable.productId, item.productId)
          )
        );

      setWishlist((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      // 🔹 Restore wishlist item if DB operation fails
      setWishlistitems((prevWishlist) => [...prevWishlist, item]);

      // 🔹 Remove from cart only if the DB update fails
      setCart((prevCart) =>
        prevCart.filter((cartItem) => cartItem.product.id !== item.productId)
      );
    }
  };

  // Remove an item from wishlist permanently
  const removeWishlistItem = async (wishlistitem, index) => {
    const item = wishlistitems[index];
    if (!item) return;
    try {
      // Delete from database
      await db
        .delete(wishlistTable)
        .where(
          and(
            eq(wishlistTable.userId, item.userId),
            eq(wishlistTable.productId, item.productId)
          )
        );

      // Update state: remove the item from both local and context states
      setWishlist((prev) => prev.filter((_, i) => i !== index));
      setWishlistitems((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
    }
  };

  return (
    <div className="wishlist-main-container">
      <div className="absolute"></div>

      {wishlistitems.length === 0 ? (
        <div id="empty-wishlistitems-message">Your Wishlist is empty.</div>
      ) : (
        <>
          {/* ========= Myntra-style Card Grid (replaces table + mobile list) ========= */}
          <div className="wishlist-grid">
            {wishlistitems.map((wishlisti, index) => {
              const item = wishlisti.product || {};
              const discountedPrice = Math.trunc(
                item.oprice - (item.oprice * item.discount) / 100
              );

              return (
                <article className="wl-card" key={item?.id}>
                  {/* Image with badges + close */}
                  <div className="wl-img-wrap">
                    {item.discount > 0 && (
                      <span className="wl-badge">{item.discount}% OFF</span>
                    )}
                    <button
                      className="wl-remove-icon"
                      aria-label="Remove from wishlist"
                      onClick={() => removeWishlistItem(wishlisti, index)}
                      title="Remove"
                    >
                      ×
                    </button>
                    <img
                      src={item.imageurl}
                      alt={item.name}
                      className="wishlist-product-img"
                      loading="lazy"
                    />
                  </div>

                  {/* Meta */}
                  <div className="wl-meta">
                    <div className="wl-brand">{item.brand || "Brand"}</div>
                    <div className="wl-name" title={item.name}>
                      {item.name}
                    </div>

                    {item.size && (
                      <div className="wl-size">
                        Size: <span className="wl-size-chip">{item.size}ml</span>
                      </div>
                    )}

                    <div className="wl-price-line">
                      <span className="wl-price">₹{discountedPrice}</span>
                      <span className="wl-mrp">₹{item.oprice}</span>
                      {item.discount > 0 && (
                        <span className="wl-off">{item.discount}% OFF</span>
                      )}
                    </div>

                    <div className="wl-actions">
                      <button
                        className="wl-btn primary"
                        onClick={() => moveToCart(wishlisti, index)}
                      >
                        Move to Bag
                      </button>
                      <button
                        className="wl-btn ghost"
                        onClick={() => removeWishlistItem(wishlisti, index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {/* ========= /Myntra-style Card Grid ========= */}
        </>
      )}
    </div>
  );
};

export default Wishlist;
