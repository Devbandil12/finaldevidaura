// src/pages/Wishlist.js

import React, { useContext, useEffect, useState } from "react";
import "../style/wishlist.css";
import { CartContext } from "../contexts/CartContext";
import { wishlistTable, addToCartTable } from "../../configs/schema";
import { eq, and } from "drizzle-orm";
import { db } from "../../configs";
import { UserContext } from "../contexts/UserContext";
import { toast } from "react-toastify";

const Wishlist = () => {
  const [wishlistitems, setWishlistitems] = useState([]);
  const { wishlist, setWishlist, getwishlist, cart, setCart } = useContext(CartContext);

  useEffect(() => {
    getwishlist();
  }, []);

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

    setWishlistitems((prevWishlist) =>
      prevWishlist.filter((_, i) => i !== index)
    );

    try {
      const existingCartItem = await db
        .select()
        .from(addToCartTable)
        .where(
          and(
            eq(addToCartTable.userId, item.userId),
            eq(addToCartTable.productId, item.productId)
          )
        );

      if (existingCartItem.length > 0) {
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
        const res = await db
          .insert(addToCartTable)
          .values({
            productId: item.productId,
            userId: item.userId,
          })
          .returning({ cartId: addToCartTable.id });

        setCart((prevCart) =>
          prevCart.map((cartItem) =>
            cartItem.product.id === item.productId
              ? { ...cartItem, cartId: res[0]?.cartId }
              : cartItem
          )
        );
      }

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
      console.error("Error moving to cart:", error);
      setWishlistitems((prevWishlist) => [...prevWishlist, item]);
      setCart((prevCart) =>
        prevCart.filter((cartItem) => cartItem.product.id !== item.productId)
      );
    }
  };

  const removeWishlistItem = async (wishlistitem, index) => {
    const item = wishlistitems[index];
    if (!item) return;

    try {
      await db
        .delete(wishlistTable)
        .where(
          and(
            eq(wishlistTable.userId, item.userId),
            eq(wishlistTable.productId, item.productId)
          )
        );

      setWishlist((prev) => prev.filter((_, i) => i !== index));
      setWishlistitems((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  return (
    <div className="wishlist-main-container">
      {wishlistitems.length === 0 ? (
        <div className="empty-wishlist">
          <div className="empty-illust">♡</div>
          <h2>Your Wishlist is Empty</h2>
          <p>Browse products and add your favorites here!</p>
          <a href="/" className="browse-btn">Continue Shopping</a>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlistitems.map((wishlisti, index) => {
            const item = wishlisti.product || {};
            const discountedPrice = Math.trunc(
              item.oprice - (item.oprice * item.discount) / 100
            );

            return (
              <article className="wl-card" key={item?.id}>
                <div className="wl-img-wrap">
                  {item.discount > 0 && (
                    <span className="wl-badge">{item.discount}% OFF</span>
                  )}
                  <img
                    src={item.imageurl}
                    alt={item.name}
                    className="wishlist-product-img"
                    loading="lazy"
                  />
                </div>

                <div className="wl-meta">
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
      )}
    </div>
  );
};

export default Wishlist;
