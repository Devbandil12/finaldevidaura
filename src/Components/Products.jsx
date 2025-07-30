// src/pages/Products.js
import React, { useContext, useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";

import WishlistImage from "../assets/wishlist-svgrepo-com.svg";
import WishlistFilledImage from "../assets/wishlist-svgrepo-com copy.svg";
import CartImage from "../assets/cart-svgrepo-com copy.svg";

import ProductDetail from "./ProductDetail";
import "../style/products.css"; // <-- NEW: styles for overlay + animations

const Products = () => {
  const [modalProduct, setModalProduct] = useState(null);
  // UI-only: track which products just got added (for success animation)
  const [justAddedIds, setJustAddedIds] = useState(new Set());

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

  // Unified add handler (kept as-is, only UI animation added after success)
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

    // Same logic: add to cart
    await addToCart(product, quantity);

    // UI-only: trigger a small "added" animation on this card
    setJustAddedIds((prev) => {
      const next = new Set(prev);
      next.add(product.id);
      return next;
    });
    // Remove the flag after animation completes (900ms)
    setTimeout(() => {
      setJustAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 900);
  };

  // Keep these memo helpers purely for rendering classNames (no logic change)
  const cartIds = useMemo(
    () => new Set(cart.map((c) => c.product?.id)),
    [cart]
  );
  const wishlistIds = useMemo(
    () => new Set(wishlist.map((w) => (w.productId ?? w.product?.id))),
    [wishlist]
  );

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

            const inCart = cartIds.has(product.id);
            const inWishlist = wishlistIds.has(product.id);
            const justAdded = justAddedIds.has(product.id);

            return (
              <div
                key={index}
                className={`product-card relative flex flex-col items-center gap-2 rounded-xl overflow-hidden bg-white`}
              >
                {/* Image + hover overlay */}
                <div
                  className="product-thumb relative w-full"
                  onClick={() => handleSlideClick(product)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    className="product-img"
                    src={product.imageurl}
                    alt={product.name}
                    loading="lazy"
                  />
                  {/* Hover/Fallback overlay */}
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

                {/* Cart button area */}
                <div className="w-full px-3 pb-3">
                  {/* If it's in the cart, show View Cart (requested change) */}
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
                      className={`cta-btn w-full py-2 text-lg font-semibold flex items-center justify-center gap-2 bg-black text-white ${justAdded ? "btn-added" : ""}`}
                    >
                      {justAdded ? "Added!" : "Add to Cart"}
                      <img src={CartImage} alt="Cart" className="w-7 h-7" />
                    </button>
                  )}

                  {/* Subtle success burst (purely visual) */}
                  {justAdded && (
                    <div className="added-burst" aria-hidden="true">
                      <span></span><span></span><span></span><span></span><span></span>
                    </div>
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
            inCart={cartIds.has(modalProduct.id)}
            onToggleWishlist={() => toggleWishlist(modalProduct)}
            inWishlist={wishlistIds.has(modalProduct.id)}
            quantity={1}
          />
        )}
      </section>
    </>
  );
};

export default Products;
