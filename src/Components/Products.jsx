// src/pages/Products.js
import React, { useContext, useEffect, useState, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";
import { Heart, ShoppingCart } from "lucide-react";

import ProductDetail from "./ProductDetail";
import "../style/products.css";
import { gsap } from "gsap";

const Products = memo(() => {
  const [modalProduct, setModalProduct] = useState(null);

  const { products } = useContext(ProductContext);
  const {
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    toggleWishlist,
    startBuyNow,
  } = useContext(CartContext);
  const { userdetails } = useContext(UserContext);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }, [location.pathname]);

  useEffect(() => {
    if (modalProduct) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
  }, [modalProduct]);

  const handleSlideClick = (product) => setModalProduct(product);
  const closeModal = () => setModalProduct(null);

  const handleAdd = async (product, quantity = 1, isBuyNow = false) => {
    if (isBuyNow) {
      const ok = startBuyNow(product, quantity);
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
      if (ok) navigate("/cart", { replace: true });
      return;
    }

    if (quantity === 0) {
      await removeFromCart(product.id);
      return;
    }

    await addToCart(product, quantity);
    
    try {
      const productImg = document.querySelector(
        `img[data-product-id="${product.id}"]`
      );
      const cartBtn = document.getElementById("cart-icon");
      if (!productImg || !cartBtn) return;

      const imgRect = productImg.getBoundingClientRect();
      const cartRect = cartBtn.getBoundingClientRect();
      const startX = imgRect.left + imgRect.width / 2;
      const startY = imgRect.top + imgRect.height / 2;
      const endX = cartRect.left + cartRect.width / 2;
      const endY = cartRect.top + cartRect.height / 2;

      const flyImg = productImg.cloneNode(true);
      flyImg.style.position = "fixed";
      flyImg.style.top = `${startY}px`;
      flyImg.style.left = `${startX}px`;
      flyImg.style.width = "50px";
      flyImg.style.height = "50px";
      flyImg.style.borderRadius = "50%";
      flyImg.style.objectFit = "cover";
      flyImg.style.zIndex = "1000";
      document.body.appendChild(flyImg);

      gsap.to(flyImg, {
        x: endX - startX,
        y: endY - startY,
        scale: 0.2,
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          flyImg.remove();
        },
      });
    } catch (error) {
      console.error("GSAP animation failed:", error);
    }
  };

  const handleToggleWishlist = (product) => {
    toggleWishlist(product);
  };

  const isProductInCart = (productId) =>
    cart?.some((item) => item.product?.id === productId);

  const isProductInWishlist = (productId) =>
    wishlist?.some((item) => (item.productId ?? item.product?.id) === productId);

  return (
    <>
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-thumb" onClick={() => handleSlideClick(product)}>
              <img
                src={product.imageurl}
                alt={product.name}
                className="product-img"
                data-product-id={product.id}
              />
              <div className="img-overlay">
                <span className="overlay-text">Quick View</span>
              </div>
            </div>
            <div className="product-info">
              <h3 className="product-name" onClick={() => handleSlideClick(product)}>
                {product.name}
              </h3>
              <p className="product-price">
                ₹{product.oprice}
                <span className="product-discount">{product.discount}% Off</span>
              </p>
            </div>
            <div className="product-actions">
              <button
                className="wishlist-btn"
                onClick={() => handleToggleWishlist(product)}
              >
                <Heart
                  size={24}
                  fill={isProductInWishlist(product.id) ? 'var(--color-primary)' : 'transparent'}
                  stroke={isProductInWishlist(product.id) ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                />
              </button>
              <button
                className="add-to-cart-btn"
                onClick={() => handleAdd(product, 1)}
              >
                <ShoppingCart size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {modalProduct && (
        <ProductDetail
          product={modalProduct}
          onClose={closeModal}
          onAddToCart={handleAdd}
          onToggleWishlist={handleToggleWishlist}
          inCart={isProductInCart(modalProduct.id)}
          inWishlist={isProductInWishlist(modalProduct.id)}
          userdetails={userdetails}
        />
      )}
    </>
  );
});

export default Products;
