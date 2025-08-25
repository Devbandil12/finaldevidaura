import React, { useContext } from "react";
import "../style/wishlist.css";
import { CartContext } from "../contexts/CartContext";
import { CartContext } from "../contexts/productContext";
import { UserContext } from "../contexts/UserContext";
import Loader from "./Loader";

const Wishlist = () => {
  const {
    wishlist, // The single source of truth for the wishlist
    isWishlistLoading, // The loading state
    addToCart, // The function that handles both cart state and DB updates
    removeFromWishlist, // The function that handles both wishlist state and DB updates
  } = useContext(CartContext);
  
  // The move to cart logic is now a simple, single function call.
  const handleMoveToCart = async (wishlistitem) => {
    await addToCart(wishlistitem.product);
    await removeFromWishlist(wishlistitem.product);
  };
  
  // The remove item logic is now a single function call.
  const handleRemoveItem = async (wishlistitem) => {
    await removeFromWishlist(wishlistitem.product);
  };

  // Conditionally render a loader if the wishlist is loading
  if (isWishlistLoading) {
    return <Loader text="Loading wishlist..." />;
  }

  return (
    <>
      <div className="wishlist-main-container">
        {wishlist.length === 0 ? (
          <div className="empty-wishlist">
            <div className="empty-illust">♡</div>
            <h2>Your Wishlist is Empty</h2>
            <p>Browse products and add your favorites here!</p>
            <a href="/" className="browse-btn">Continue Shopping</a>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((wishlisti, index) => {
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
  src={Array.isArray(item.product.imageurl) ? item.product.imageurl[0] : item.product.imageurl}
  alt={item.product.name}
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
                  <p className="text-sm font-normal text-red-700 mt-1">
  {product.stockStatus}
</p>
                    <div className="wl-actions">
                      <button
                        className="wl-btn primary"
                        onClick={() => handleMoveToCart(wishlisti)}
                      >
                        Move to Bag
                      </button>
                      <button
                        className="wl-btn ghost"
                        onClick={() => handleRemoveItem(wishlisti)}
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
    </>
  );
};

export default Wishlist;
