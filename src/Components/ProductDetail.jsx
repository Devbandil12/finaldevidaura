// src/pages/ProductDetail.jsx
import React, { useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";
import ReviewComponent from "./ReviewComponent";
import { useUser } from "@clerk/clerk-react";
import { X, ChevronLeft, ChevronRight, Heart, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const ProductDetail = ({
  product,
  userdetails,
  onClose,
  onToggleWishlist,
  inWishlist,
  onAddToCart,
  inCart,
}) => {
  const navigate = useNavigate();
  const { user } = useUser();

  const { products } = useContext(ProductContext);
  const {
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    toggleWishlist,
    startBuyNow,
  } = useContext(CartContext);

  const fullProduct =
    products.find((p) => p.id === product.id) || product;

  const images =
    Array.isArray(fullProduct.images) && fullProduct.images.length > 0
      ? fullProduct.images
      : [fullProduct.imageurl];

  const ctxInCart = useMemo(
    () => cart?.some((i) => i.product?.id === fullProduct.id),
    [cart, fullProduct.id]
  );
  const isInCart = typeof inCart === "boolean" ? inCart : !!ctxInCart;

  const ctxInWishlist = useMemo(
    () => wishlist?.some((w) => (w.productId ?? w.product?.id) === fullProduct.id),
    [wishlist, fullProduct.id]
  );
  const isInWishlist =
    typeof inWishlist === "boolean" ? inWishlist : !!ctxInWishlist;

  const [quantity, setQuantity] = useState(1);
  const [currentImg, setCurrentImg] = useState(0);

  const basePrice = Math.floor(Number(fullProduct.oprice) || 0);
  const discount = Math.floor(Number(fullProduct.discount) || 0);
  const discountedPrice = Math.floor(basePrice * (1 - discount / 100));

  const changeImage = (delta) =>
    setCurrentImg((idx) => (idx + delta + images.length) % images.length);

  const addToCartHandler = async () => {
    if (onAddToCart) {
      return onAddToCart(fullProduct, isInCart ? 0 : quantity, false);
    }

    if (isInCart) {
      await removeFromCart(fullProduct.id);
    } else {
      await addToCart(fullProduct, quantity);
    }
  };

  const handleBuyNow = async () => {
    if (onAddToCart) {
      onAddToCart(fullProduct, quantity, true);
    } else {
      const ok = startBuyNow(fullProduct, quantity);
      if (!ok) return;
    }
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    onClose();
    navigate("/checkout");
  };

  const handleToggleWishlist = async () => {
    if (onToggleWishlist) {
      onToggleWishlist(fullProduct);
    } else {
      toggleWishlist(fullProduct);
    }
  };

  return (
    <div className="product-detail-overlay">
      <div className="product-detail-modal">
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="product-detail-content">
          <div className="product-image-section">
            <div className="image-carousel">
              <AnimatePresence initial={false}>
                <motion.img
                  key={currentImg}
                  src={images[currentImg]}
                  alt={fullProduct.name}
                  className="main-product-image"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              {images.length > 1 && (
                <>
                  <button className="nav-btn left" onClick={() => changeImage(-1)}>
                    <ChevronLeft size={24} />
                  </button>
                  <button className="nav-btn right" onClick={() => changeImage(1)}>
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
            <div className="thumbnail-gallery">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className={`thumbnail ${currentImg === idx ? "active" : ""}`}
                  onClick={() => setCurrentImg(idx)}
                />
              ))}
            </div>
          </div>

          <div className="product-info-section">
            <h1 className="product-title">{fullProduct.name}</h1>
            <p className="product-description">{fullProduct.description}</p>
            <div className="product-price-details">
              <span className="price">₹{discountedPrice}</span>
              {discount > 0 && (
                <>
                  <span className="original-price">₹{basePrice}</span>
                  <span className="discount-badge">{discount}% Off</span>
                </>
              )}
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)}>+</button>
              </div>

              <div className="action-buttons">
                <button
                  className={`cart-btn ${isInCart ? "in-cart" : ""}`}
                  onClick={addToCartHandler}
                >
                  <ShoppingCart size={20} />
                  {isInCart ? "Remove from Cart" : "Add to Cart"}
                </button>
                <button className="buy-now-btn" onClick={handleBuyNow}>
                  Buy Now
                </button>
                <button
                  className="wishlist-btn"
                  onClick={handleToggleWishlist}
                >
                  <Heart
                    size={24}
                    fill={isInWishlist ? 'var(--color-primary)' : 'transparent'}
                    stroke={isInWishlist ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="product-review-section">
          <ReviewComponent productId={fullProduct.id} user={user} userdetails={userdetails} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
