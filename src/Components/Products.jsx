// src/pages/Products.js

import React, { useContext, useEffect, useState } from "react";
import { ProductContext } from "../contexts/productContext";
import WishlistImage from "../assets/wishlist-svgrepo-com.svg";
import WishlistFilledImage from "../assets/wishlist-svgrepo-com copy.svg";
import CartImage from "../assets/cart-svgrepo-com copy.svg";
import { useLocation, useNavigate } from "react-router-dom";
import ProductDetail from "./ProductDetail";

// ✅ Use ONLY CartContext helpers – no DB/schema imports here
import { CartContext } from "../contexts/CartContext";

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
    // Optional loading flag (if you want to disable UI while mutating)
    isCartLoading,
  } = useContext(CartContext);

  const navigate = useNavigate();
  const location = useLocation();

  // Reset scrolling on route change
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }, [location.pathname]);

  // Lock scroll when modal open
  useEffect(() => {
    if (modalProduct) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
  }, [modalProduct]);

  const handleSlideClick = (product) => {
    setModalProduct(product);
  };

  const closeModal = () => {
    setModalProduct(null);
  };

  // Unified add handler used by card button and modal
  const handleAdd = async (product, quantity = 1, isBuyNow = false) => {
    if (isBuyNow) {
      // Buy Now flow uses localStorage (same keys your cart page reads)
      const ok = startBuyNow(product, quantity);
      // Always restore scrolling when leaving modal
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
      if (ok) navigate("/cart", { replace: true });
      return;
    }
    await addToCart(product, quantity);
  };

  return (
    <>
      <section className="py-20 flex flex-col items-center">
        <h1 id="shop-section" className="product-heading">
          Shop The Luxury
        </h1>

        {/* Products Container */}
        <div className="w-full flex flex-wrap justify-center gap-8 px-6">
          {products.map((product, index) => {
            const discountedPrice = Math.trunc(
              product.oprice - (product.oprice * product.discount) / 100
            );
            const inCart = cart.some((item) => item.product.id === product.id);
            const inWishlist = wishlist.some(
              (item) => item.productId === product.id
            );

            return (
              <div
                key={index}
                className="relative w-62 h-86 flex flex-col items-center gap-2 rounded-xl overflow-hidden shadow-lg bg-white"
              >
                <img
                  className="w-72 h-54 object-cover"
                  src={product.imageurl}
                  alt={product.name}
                  onClick={() => handleSlideClick(product)}
                  style={{ cursor: "pointer" }}
                />

                {/* Wishlist toggle */}
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-2 right-2 p-2 rounded-full transition"
                  disabled={isCartLoading}
                >
                  <img
                    src={inWishlist ? WishlistFilledImage : WishlistImage}
                    alt="wishlist"
                    className="w-10 h-10"
                  />
                </button>

                {/* Title & size */}
                <div className="w-9/10 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <span className="text-gray-700 font-medium">
                    {product.size} ml
                  </span>
                </div>

                {/* Pricing */}
                <div className="w-9/10 flex justify-between items-center">
                  <span className="flex justify-between gap-4 items-center">
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

                {/* Cart button */}
                {inCart ? (
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="w-full py-2 text-lg font-semibold flex items-center justify-center gap-2 transition bg-black text-white"
                    disabled={isCartLoading}
                  >
                    remove from cart
                    <img src={CartImage} alt="Cart" className="w-8 h-8" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleAdd(product, 1, false)}
                    className="w-full py-2 text-lg font-semibold flex items-center justify-center gap-2 transition bg-black text-white"
                    disabled={isCartLoading}
                  >
                    add to cart
                    <img src={CartImage} alt="Cart" className="w-8 h-8" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {modalProduct && (
          <ProductDetail
            product={{
              ...modalProduct,
              images: modalProduct.images || [modalProduct.imageurl],
            }}
            onClose={closeModal}
            // When modal clicks "Add" or "Buy Now"
            onAddToCart={(product, quantity, isBuyNow) =>
              handleAdd(product, quantity, isBuyNow)
            }
            inCart={cart.some((item) => item.product.id === modalProduct.id)}
            onToggleWishlist={() => toggleWishlist(modalProduct)}
            inWishlist={wishlist.some(
              (item) => item.productId === modalProduct.id
            )}
            quantity={1}
          />
        )}
      </section>
    </>
  );
};

export default Products;
