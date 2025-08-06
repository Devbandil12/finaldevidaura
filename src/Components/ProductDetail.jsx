// src/pages/ProductDetail.jsx
import React, { useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";

import WishlistImage from "../assets/wishlist-svgrepo-com.svg";        // outline
import WishlistFilledImage from "../assets/wishlist-svgrepo-com copy.svg"; // filled
import ReviewComponent from "./ReviewComponent";

import { useUser } from "@clerk/clerk-react";

const ProductDetail = ({
  product,
  userdetails,
  onClose,

  // Optional legacy props (component works without them):
  onToggleWishlist,
  inWishlist,
  onAddToCart,
  inCart,
}) => {
  const navigate = useNavigate();
  const { user } = useUser();

  // Contexts
  const { products } = useContext(ProductContext);
  const {
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    toggleWishlist,
    startBuyNow,
    // If you want to disable buttons during a mutation, expose isCartLoading from context
    // isCartLoading,
  } = useContext(CartContext);

  // Resolve full product (prefer global product for latest data)
  const fullProduct =
    products.find((p) => p.id === product.id) || product;

  // Images
  const images =
    Array.isArray(fullProduct.images) && fullProduct.images.length > 0
      ? fullProduct.images
      : [fullProduct.imageurl];

  // Derived inCart / inWishlist (fallback to context if props not provided)
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

  // Local UI state
  const [quantity, setQuantity] = useState(1);
  const [currentImg, setCurrentImg] = useState(0);

  // Pricing
  const basePrice = Math.floor(Number(fullProduct.oprice) || 0);
  const discount = Math.floor(Number(fullProduct.discount) || 0);
  const discountedPrice = Math.floor(basePrice * (1 - discount / 100));

  const changeImage = (delta) =>
    setCurrentImg((idx) => (idx + delta + images.length) % images.length);

  // Handlers (prefer legacy props if provided; otherwise use context)
  const addToCartHandler = async () => {
    if (onAddToCart) {
      // Keep legacy contract: quantity === 0 means "remove from cart"
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

    // Always unlock scroll and close modal before navigating
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    onClose?.();
    navigate("/cart", { replace: true });
  };

  const handleToggleWishlist = async () => {
    if (onToggleWishlist) return onToggleWishlist();
    await toggleWishlist(fullProduct);
  };

  const handleShare = async () => {
    const shareData = {
      title: fullProduct.name,
      text: `${fullProduct.name} – ₹${discountedPrice}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard");
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-hidden">
      <div className="bg-white max-w-4xl w-full max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-y-auto scrollbar-hide">
<div className="flex flex-col md:flex-row">
        {/* Left Image Section */}
        <div className="w-full md:w-1/2 bg-gray-100 p-4 relative flex flex-col items-center">
          <button
            onClick={() => changeImage(-1)}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-200"
          >
            &lt;
          </button>

            <img
              src={images[currentImg]}
              alt={`${fullProduct.name} ${currentImg + 1}`}
              className="object-cover w-full h-96 rounded-lg"
            />

          <button
            onClick={() => changeImage(1)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-200"
          >
            &gt;
          </button>

          <div className="flex space-x-2 mt-4 overflow-x-auto">
            {images.slice(0, 5).map((img, idx) => (
              <img
                key={idx}
                src={img}
                onClick={() => setCurrentImg(idx)}
                className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                  idx === currentImg ? "border-indigo-500" : "border-transparent"
                }`}
                alt={`thumb-${idx}`}
              />
            ))}
          </div>
        </div>

        {/* Right Product Section */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-2xl text-gray-500 hover:text-gray-800 font-bold"
          >
            ×
          </button>

          <div>
            <div className="w-full flex justify-between items-start mt-6">
              {/* Product Name */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {fullProduct.name}
              </h2>

              {/* Icons */}
              <div className="flex items-center gap-[15px]">
                {/* Wishlist */}
                <button
                  onClick={handleToggleWishlist}
                  className="hover:scale-110 transition"
                >
                  <img
                    src={isInWishlist ? WishlistFilledImage : WishlistImage}
                    alt="Wishlist"
                    className="w-8 h-8"
                  />
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="hover:scale-110 transition"
                  title="Share"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="26.703" height="25.928">
                    <path d="M1.056 21.928c0-6.531 5.661-9.034 10.018-9.375V18.1L22.7 9.044 11.073 0v4.836a10.5 10.5 0 0 0-7.344 3.352C-.618 12.946-.008 21 .076 21.928z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-baseline mt-2 flex-wrap gap-2">
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                ₹{discountedPrice}
              </span>
              {discount > 0 && (
                <span className="text-sm line-through text-gray-500">
                  ₹{basePrice}
                </span>
              )}
              <span className="ml-auto text-sm text-gray-700">
                {fullProduct.size} ml
              </span>
            </div>

            <div className="mt-4 flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Qty:</span>
              <div className="flex items-center border rounded">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1"
                >
                  –
                </button>
                <span className="px-4">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-1"
                >
                  +
                </button>
              </div>
            </div>

            {fullProduct.description && (
              <div className="mt-6 text-gray-700 space-y-2">
                <h3 className="font-medium">Description</h3>
                <p>{fullProduct.description}</p>
              </div>
            )}

            {/* Notes (if available) */}
            <div className="mt-6 text-gray-700 space-y-4">
              {fullProduct.composition && (
                <div>
                  <h3 className="font-medium">Top Notes</h3>
                  <hr className="border-t border-gray-300 my-1" />
                  <p>{fullProduct.composition}</p>
                </div>
              )}
              {fullProduct.fragranceNotes && (
                <div>
                  <h3 className="font-medium">Base Notes</h3>
                  <hr className="border-t border-gray-300 my-1" />
                  <p>{fullProduct.fragranceNotes}</p>
                </div>
              )}
              {fullProduct.fragrance && (
                <div>
                  <h3 className="font-medium">Heart Notes</h3>
                  <hr className="border-t border-gray-300 my-1" />
                  <p>{fullProduct.fragrance}</p>
                </div>
              )}
            </div>
          </div>

          {/* CTA buttons */}
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-4">
            <button
              onClick={addToCartHandler}
              className={`flex-1 py-3 px-6 font-semibold rounded-lg border ${
                isInCart
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-white text-black border-black hover:bg-gray-100"
              }`}
            >
              {isInCart ? "Remove from Cart" : `Add to Cart (${quantity})`}
            </button>

            <button
              onClick={handleBuyNow}
              className="flex-1 py-3 px-6 font-semibold rounded-lg bg-black text-white border border-black hover:bg-white hover:text-black transition-colors duration-200"
            >
              Buy Now
            </button>
          </div>
        </div>
</div>
 <div className="p-6 border-t mt-4">
    <ReviewComponent productId={product.id} user={user} userdetails={userdetails} />
  </div>
      </div>
  
    </div>
  );
};

export default ProductDetail;
