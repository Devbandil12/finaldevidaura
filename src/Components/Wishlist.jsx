import React from 'react';
import './wishlist.css';

const Wishlist = ({ wishlist, removeFromWishlist, moveToCart }) => {
  return (
    <div className="wishlist-main-container">
      {wishlist.length === 0 ? (
        <div className="empty-wishlist">
          <div className="empty-illust">💔</div>
          <h2>Your wishlist is empty</h2>
          <p>Looks like you haven’t added anything to your wishlist yet.</p>
          <a href="/" className="browse-btn">Browse Products</a>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((item) => (
            <div className="wl-card" key={item.id}>
              <div className="wl-img-wrap">
                <img src={item.image} alt={item.name} />
                {item.tag && <div className="wl-badge">{item.tag}</div>}
                <div className="wl-remove-icon" onClick={() => removeFromWishlist(item.id)}>×</div>
              </div>

              <div className="wl-meta">
                <div className="wl-brand">{item.brand}</div>
                <div className="wl-name">{item.name}</div>
                {item.size && (
                  <div className="wl-size">
                    Size: <span className="wl-size-chip">{item.size}</span>
                  </div>
                )}

                <div className="wl-price-line">
                  <div className="wl-price">₹{item.price}</div>
                  {item.mrp && <div className="wl-mrp">₹{item.mrp}</div>}
                  {item.off && <div className="wl-off">{item.off}% OFF</div>}
                </div>

                <div className="wl-actions">
                  <button className="wl-btn" onClick={() => removeFromWishlist(item.id)}>Remove</button>
                  <button className="wl-btn primary" onClick={() => moveToCart(item.id)}>Move to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
