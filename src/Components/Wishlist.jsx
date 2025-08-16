// src/pages/Wishlist.js
import React, { useContext, useEffect } from "react";
import "../style/wishlist.css";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";

const Wishlist = () => {
  // We no longer need the local wishlistitems state.
  // const [wishlistitems, setWishlistitems] = useState([]);

  // Destructure the needed functions and state directly from the context.
  const {
    wishlist, // The single source of truth for the wishlist
    getwishlist, // Function to fetch wishlist from the backend
    addToCart, // The function that handles both cart state and DB updates
    removeFromWishlist, // The function that handles both wishlist state and DB updates
  } = useContext(CartContext);

  // We only need to call getwishlist once when the component mounts.
  useEffect(() => {
    getwishlist();
  }, [getwishlist]); // Depend on getwishlist to avoid stale closures

  // The move to cart logic is now a simple, single function call.
  const handleMoveToCart = async (wishlistitem) => {
    // Call the addToCart function from the context
    await addToCart(wishlistitem.product);
    
    // Call the removeFromWishlist function from the context
    await removeFromWishlist(wishlistitem.product);
  };
  
  // The remove item logic is now a single function call.
  const handleRemoveItem = async (wishlistitem) => {
    // Call the removeFromWishlist function from the context
    await removeFromWishlist(wishlistitem.product);
  };

  return (
<>
<div style={{ padding: '10px', backgroundColor: 'lightblue', border: '1px solid blue', margin: '100px 10px' }}>
          <h4>Wishlist Debugging Info:</h4>
          <p>Is Wishlist Loading: <strong>{isWishlistLoading ? 'True' : 'False'}</strong></p>
          <p>Wishlist Item Count: <strong>{wishlist.length}</strong></p>
      </div>
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
