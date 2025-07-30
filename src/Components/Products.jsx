// src/pages/Products.js
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";

import WishlistImage from "../assets/wishlist-svgrepo-com.svg";
import WishlistFilledImage from "../assets/wishlist-svgrepo-com copy.svg";
import CartImage from "../assets/cart-svgrepo-com copy.svg";

import ProductDetail from "./ProductDetail";

// Styles for overlay/card polish (keep your existing file)
import "../style/products.css";

// NEW: GSAP for smooth animation
import { gsap } from "gsap";

const Products = () => {
  const [modalProduct, setModalProduct] = useState(null);

  const { products } = useContext(ProductContext);
  const {
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    toggleWishlist,
    startBuyNow,
    // Optional: isCartLoading,
  } = useContext(CartContext);

  const navigate = useNavigate();
  const location = useLocation();

  // Reset scrolling on route change
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }, [location.pathname]);

  // Lock/unlock scroll when modal toggles
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

  // Unified add handler (logic unchanged; GSAP animation added after success)
  const handleAdd = async (product, quantity = 1, isBuyNow = false) => {
    if (isBuyNow) {
      const ok = startBuyNow(product, quantity); // context handles guest/user
      // Always restore scroll before navigation
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
      if (ok) navigate("/cart", { replace: true });
      return;
    }

    // Legacy ProductDetail passes quantity === 0 to mean "remove"
    if (quantity === 0) {
      await removeFromCart(product.id);
      return;
    }

    // Add to cart (original logic)
    await addToCart(product, quantity);

    // ===== UI-only: Fly-to-cart with GSAP (curved path + easing + bounce) =====
    try {
      // Product image on this card
      const productImg = document.querySelector(
        `img[data-product-id="${product.id}"]`
      );
      // Navbar cart button (has id="cart-icon" in your Navbar.js)
      const cartBtn = document.getElementById("cart-icon");
      if (!productImg || !cartBtn) return;

      const imgRect = productImg.getBoundingClientRect();
      const cartRect = cartBtn.getBoundingClientRect();

      // Use centers for smoother travel
      const startX = imgRect.left + imgRect.width / 2;
      const startY = imgRect.top + imgRect.height / 2;
      const endX = cartRect.left + cartRect.width / 2;
      const endY = cartRect.top + cartRect.height / 2;

      // Smaller starting visual size so it doesn't look huge
      const MAX_W = 120;
      const scaleStart = Math.min(1, MAX_W / imgRect.width);
      const startW = imgRect.width * scaleStart;
      const startH = imgRect.height * scaleStart;

      // Create a visual clone (outside React tree)
      const clone = productImg.cloneNode(true);
      Object.assign(clone.style, {
        position: "fixed",
        left: `${startX - startW / 2}px`,
        top: `${startY - startH / 2}px`,
        width: `${startW}px`,
        height: `${startH}px`,
        pointerEvents: "none",
        zIndex: 9999,
        borderRadius: "12px",
      });
      document.body.appendChild(clone);

      // Compute deltas (we’ll animate with transforms only — GPU friendly)
      const dx = endX - startX;
      const dy = endY - startY;

      // Build GSAP timeline for a nice arc
      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          // Clean up clone
          try {
            document.body.removeChild(clone);
          } catch (e) {}
          // Bounce the cart icon to confirm
          gsap.fromTo(
            cartBtn,
            { scale: 1 },
            { scale: 1.18, duration: 0.18, ease: "back.out(3)" }
          ).then(() =>
            gsap.to(cartBtn, {
              scale: 1,
              duration: 0.18,
              ease: "back.out(3)",
            })
          );
        },
      });

      // Set initial transform state
      gsap.set(clone, {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        willChange: "transform",
        filter: "drop-shadow(0 6px 16px rgba(0,0,0,.12))",
      });

      // Flight: two segments to create a light arc
      tl.to(clone, {
        duration: 0.32,
        x: dx * 0.6,
        y: dy * 0.6 - 80, // lift for the arc
        scale: 0.85,
        opacity: 0.95,
        ease: "power2.out",
      }).to(
        clone,
        {
          duration: 0.23,
          x: dx,
          y: dy,
          scale: 0.25,
          opacity: 0,
          ease: "power2.in",
          filter: "drop-shadow(0 0 0 rgba(0,0,0,0))",
        },
        ">-0.02" // slight overlap for snappier feel
      );
    } catch {
      // Cosmetic only; ignore failures
    }
    // ===== end GSAP fly-to-cart effect =====
  };

  return (
    <>
      <section className="py-20 flex flex-col items-center">
        <h1 id="shop-section" className="product-heading">Shop The Luxury</h1>

        {/* Products Container */}
        <div className="w-full flex flex-wrap justify-center gap-8 px-6">
          {products.map((product, index) => {
            const discountedPrice = Math.trunc(
              product.oprice - (product.oprice * product.discount) / 100
            );

            const inCart = cart.some((item) => item.product?.id === product.id);
            const inWishlist = wishlist.some(
              (item) => (item.productId ?? item.product?.id) === product.id
            );

            return (
              <div
                key={index}
                className="product-card relative flex flex-col items-center gap-2 rounded-xl overflow-hidden bg-white"
              >
                {/* Image + hover overlay (click opens modal) */}
                <div
                  className="product-thumb relative w-full"
                  onClick={() => handleSlideClick(product)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    className="product-img"
                    data-product-id={product.id}   // <-- used by animation
                    src={product.imageurl}
                    alt={product.name}
                    loading="lazy"
                  />
                  <div
                    className="img-overlay"
                    role="button"
                    aria-label="View Description"
                    title="View Description"
                  >
                    View Description
                  </div>
                </div>

                {/* Wishlist toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                  className="wishlist-toggle absolute top-2 right-2 p-2 rounded-full transition"
                >
                  <img
                    src={inWishlist ? WishlistFilledImage : WishlistImage}
                    alt="wishlist"
                    className="w-10 h-10"
                  />
                </button>

                {/* Title & size */}
                <div className="w-9/10 flex justify-between items-center px-3">
                  <h3 className="text-lg font-semibold truncate max-w-[70%]">
                    {product.name}
                  </h3>
                  <span className="text-gray-700 font-medium whitespace-nowrap">
                    {product.size} ml
                  </span>
                </div>

                {/* Pricing */}
                <div className="w-9/10 flex justify-between items-center px-3">
                  <span className="flex gap-3 items-center">
                    <span className="text-lg font-bold text-black">
                      ₹{discountedPrice}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      (₹{product.oprice})
                    </span>
                  </span>
                  <span className="text-blue-700 font-semibold">
                    {product.discount}% Off
                  </span>
                </div>

                {/* Cart button: show "View Cart" when already in cart */}
                <div className="w-full px-3 pb-3">
                  {inCart ? (
                    <button
                      onClick={() => navigate("/cart")}
                      className="cta-btn w-full py-2 text-lg font-semibold flex items-center justify-center gap-2 bg-black text-white"
                    >
                      View Cart
                      <img src={CartImage} alt="Cart" className="w-7 h-7" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAdd(product, 1, false)}
                      className="cta-btn w-full py-2 text-lg font-semibold flex items-center justify-center gap-2 bg-black text-white"
                    >
                      Add to Cart
                      <img src={CartImage} alt="Cart" className="w-7 h-7" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Product modal */}
        {modalProduct && (
          <ProductDetail
            product={{
              ...modalProduct,
              images: modalProduct.images || [modalProduct.imageurl],
            }}
            onClose={closeModal}
            // Keep backward-compatible props:
            onAddToCart={(product, quantity, isBuyNow) =>
              handleAdd(product, quantity, isBuyNow)
            }
            inCart={cart.some((item) => item.product?.id === modalProduct.id)}
            onToggleWishlist={() => toggleWishlist(modalProduct)}
            inWishlist={wishlist.some(
              (item) => (item.productId ?? item.product?.id) === modalProduct.id
            )}
            quantity={1}
          />
        )}
      </section>
    </>
  );
};

export default Products;
