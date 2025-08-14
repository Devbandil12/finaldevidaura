// src/pages/ProductDetail.jsx
import React, { useState, useContext, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";
import ReviewComponent from "./ReviewComponent";
import { useUser } from "@clerk/clerk-react";
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Share2 } from "lucide-react";

const ProductDetail = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { userdetails } = useContext(UserContext);
  const { products, loading } = useContext(ProductContext);
  const { cart, wishlist, addToCart, removeFromCart, toggleWishlist, startBuyNow } = useContext(CartContext);
  const { productId } = useParams();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading product details...</p>
      </div>
    );
  }

  const product = useMemo(() => {
    return products.find((p) => p.id === productId);
  }, [products, productId]);

  if (!product) {
    return <div className="text-center p-8">Product not found.</div>;
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.imageurl];

  const isInCart = useMemo(() => cart?.some((i) => i.product?.id === product.id), [cart, product.id]);
  const isInWishlist = useMemo(() => wishlist?.some((w) => (w.productId ?? w.product?.id) === product.id), [wishlist, product.id]);

  const [quantity, setQuantity] = useState(1);
  const [currentImg, setCurrentImg] = useState(0);

  const basePrice = Math.floor(Number(product.oprice) || 0);
  const discount = Math.floor(Number(product.discount) || 0);
  const discountedPrice = Math.floor(basePrice * (1 - discount / 100));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  const changeImage = (delta) =>
    setCurrentImg((idx) => (idx + delta + images.length) % images.length);

  const handleAddToCart = async () => {
    if (isInCart) {
      await removeFromCart(product.id);
    } else {
      await addToCart(product, quantity);
    }
  };

  const handleBuyNow = async () => {
    // Original logic: handle legacy props or use context
    // The `onAddToCart` prop is not used in this version, so the `startBuyNow` logic is always executed
    const ok = startBuyNow(product, quantity);
    if (!ok) return;

    navigate("/cart", { replace: true });
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this product: ${product.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback for browsers that do not support the Web Share API
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert("Product link copied to clipboard!");
      }, (err) => {
        console.error("Could not copy text: ", err);
        alert("Failed to copy link. Please try again.");
      });
    }
  };

  return (
    <div className="product-page-container bg-gray-100 min-h-screen">
      <div className="product-main-content bg-white rounded-lg shadow-lg max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Image Gallery */}
          <div className="lg:w-1/2">
            <div className="relative mb-4">
              <img
                src={images[currentImg]}
                alt={product.name}
                className="w-full h-auto rounded-lg shadow-md max-h-[600px] object-contain"
              />
              {images.length > 1 && (
                <>
                  <button className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/70 p-2 rounded-full shadow-md z-10 hover:bg-white transition-colors" onClick={() => changeImage(-1)}>
                    <ChevronLeft size={24} />
                  </button>
                  <button className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/70 p-2 rounded-full shadow-md z-10 hover:bg-white transition-colors" onClick={() => changeImage(1)}>
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto p-2 justify-center">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 transition-all ${currentImg === idx ? "border-gray-900 scale-105" : "border-transparent opacity-70"}`}
                  onClick={() => setCurrentImg(idx)}
                />
              ))}
            </div>
          </div>

          {/* Product Info & Actions */}
          <div className="lg:w-1/2 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleWishlist}
                    className="p-3 rounded-full border border-gray-300 transition-colors duration-200 hover:bg-gray-200"
                    title="Add to Wishlist"
                  >
                    <Heart size={24} fill={isInWishlist ? 'red' : 'none'} stroke={isInWishlist ? 'red' : 'gray'} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 rounded-full border border-gray-300 transition-colors duration-200 hover:bg-gray-200"
                    title="Share Product"
                  >
                    <Share2 size={24} />
                  </button>
                </div>
              </div>
              
              {/* Product Composition */}
              {product.composition && (
                <p className="text-lg font-semibold text-gray-500 mb-4">{product.composition}</p>
              )}
              
              {/* Price & Discount */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-extrabold text-green-600">₹{discountedPrice}</span>
                {discount > 0 && (
                  <>
                    <span className="text-lg text-gray-500 line-through">₹{basePrice}</span>
                    <span className="text-md font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">{discount}% OFF</span>
                  </>
                )}
              </div>

              {/* Description & Other Notes */}
              <div className="space-y-4 text-gray-800">
                {product.description && (
                  <div>
                    <h3 className="font-bold text-lg">Description</h3>
                    <hr className="border-t border-gray-300 my-1" />
                    <p className="leading-relaxed">{product.description}</p>
                  </div>
                )}
                {product.fragranceNotes && (
                  <div>
                    <h3 className="font-bold text-lg">Fragrance Notes</h3>
                    <hr className="border-t border-gray-300 my-1" />
                    <p>{product.fragranceNotes}</p>
                  </div>
                )}
                {product.fragrance && (
                  <div>
                    <h3 className="font-bold text-lg">Heart Notes</h3>
                    <hr className="border-t border-gray-300 my-1" />
                    <p>{product.fragrance}</p>
                  </div>
                )}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="mt-8 flex items-center gap-4 flex-wrap">
              <div className="flex items-center border border-gray-300 rounded-lg p-2">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-1 font-semibold text-xl">-</button>
                <span className="px-4 text-lg font-semibold">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} className="px-3 py-1 font-semibold text-xl">+</button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-6 font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${isInCart ? "bg-red-600 text-white hover:bg-red-700" : "bg-black text-white hover:bg-gray-800"}`}
              >
                <ShoppingCart size={20} />
                {isInCart ? "Remove from Cart" : "Add to Cart"}
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 py-3 px-6 font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Review Section */}
      <div className="product-reviews-section bg-white rounded-lg shadow-lg max-w-7xl mx-auto mt-8 p-4 md:p-8">
        <ReviewComponent productId={product.id} user={user} userdetails={userdetails} />
      </div>
    </div>
  );
};

export default ProductDetail;
