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

      toast.success("Moved to cart");
      setWishlist((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error moving item to cart:", error);
      toast.error("Failed to move item to cart");

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

      toast.success("Item removed from wishlist");
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
      toast.error("Failed to remove item");
    }
  };

  return (
    <div className="wishlist-main-container">
      <div className="absolute">
        <ToastContainer />
      </div>
      <h2 className="w-title">MY WISHLIST</h2>

      {wishlistitems.length === 0 ? (
        <div id="empty-wishlistitems-message">Your Wishlist is empty.</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="wishlist-table-container">
            <table className="wishlist-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {wishlistitems.map((wishlisti, index) => {
                  const item = wishlisti.product || {};
                  const discountedPrice = Math.trunc(
                    item.oprice - (item.oprice * item.discount) / 100
                  );

                  return (
                    <tr key={item?.id}>
                      <td>
                        <img
                          src={item.imageurl}
                          alt={item.name}
                          className="wishlist-product-img"
                        />
                      </td>
                      <td>{item.name}</td>
                      <td>{item.size}ml</td>
                      <td>
                        <strong style={{ color: "green" }}>
                          ₹{discountedPrice}
                        </strong>
                        <br />
                        <del style={{ color: "gray" }}>₹{item.oprice}</del>
                      </td>
                      <td style={{ color: "blue" }}>{item.discount}%</td>
                      <td>
                        <button
                          className="action-btn add"
                          onClick={() => moveToCart(wishlisti, index)}
                        >
                          Add to Cart
                        </button>
                        <button
                          className="action-btn remove"
                          onClick={() => removeWishlistItem(wishlisti, index)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="wishlist-mobile-list">
            {wishlistitems.map((wishlisti, index) => {
              const item = wishlisti.product || {};
              const discountedPrice = Math.trunc(
                item.oprice - (item.oprice * item.discount) / 100
              );

              return (
                <div className="wishlist-mobile-card">
                  <div className="wishlist-mobile-left">
                    <img src={item.imageurl} alt={item.name} />
                    <div className="title">{item.name}</div>
                  </div>
                  <div className="wishlist-mobile-right">
                    <div className="wishlist-price-discount">
                      <strong>₹{discountedPrice}</strong>
                      <span className="discount">{item.discount}% Off</span>
                    </div>
                    <div className="wishlist-mobile-actions">
                      <button
                        className="action-btn add"
                        onClick={() => moveToCart(wishlisti, index)}
                      >
                        Add to Cart
                      </button>
                      <button
                        className="action-btn remove"
                        onClick={() => removeWishlistItem(wishlisti, index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Wishlist;
