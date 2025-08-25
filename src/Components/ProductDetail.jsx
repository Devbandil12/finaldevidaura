import React, { useState, useContext, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";
import ReviewComponent from "./ReviewComponent";
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Share2 } from "lucide-react";
import { motion } from "framer-motion";



const ProductDetail = () => {
  const navigate = useNavigate();
  const { userdetails } = useContext(UserContext);
  const { products, loading: productsLoading } = useContext(ProductContext);
  const { 
    cart, 
    wishlist, 
    addToCart, 
    removeFromCart, 
    toggleWishlist, 
    startBuyNow 
  } = useContext(CartContext);
  
  const { productId } = useParams();
  
  const product = products.find((p) => p.id === productId);

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center p-8">Product not found.</div>;
  }

  // =========================================================
  // ===  BULLETPROOF IMAGE LOGIC ===
  // =========================================================
  let allImages = [];
  if (product.imageurl) {
    try {
      // Attempt to parse the imageurl if it's a string
      allImages = typeof product.imageurl === 'string' ? JSON.parse(product.imageurl) : product.imageurl;
    } catch (e) {
      console.error("Failed to parse imageurl string:", e);
      allImages = [];
    }
  }
  
  // =========================================================

  const isInCart = cart?.some((i) => i.product?.id === product.id);
  const isInWishlist = wishlist?.some((w) => (w.productId ?? w.product?.id) === product.id);

  const [quantity, setQuantity] = useState(1);
  const [currentImg, setCurrentImg] = useState(0);

  const basePrice = Math.floor(Number(product.oprice) || 0);
  const discount = Math.floor(Number(product.discount) || 0);
  const discountedPrice = Math.floor(basePrice * (1 - discount / 100));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  const changeImage = (delta) =>
    setCurrentImg((idx) => (idx + delta + allImages.length) % allImages.length);

  const handleAddToCart = async () => {
    if (isInCart) {
      await removeFromCart(product);
    } else {
      await addToCart(product, quantity);
    }
  };

  const handleBuyNow = async () => {
    startBuyNow(product, quantity);
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
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert("Product link copied to clipboard!");
      }, (err) => {
        console.error("Could not copy text: ", err);
        alert("Failed to copy link. Please try again.");
      });
    }
  };

  return (
    <div className="product-page-container bg-white min-h-screen">
      <div className="product-main-content bg-white rounded-lg max-w-7xl mx-auto p-4 md:p-8 mt-[50px]">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Image Gallery */}
          <div className="lg:w-1/2">
            <div className="relative mb-4">
              {allImages.length > 0 && (
                <img
                  src={allImages[currentImg]}
                  alt={product.name}
                  className="w-full h-[350px] md:h-[450px] lg:h-[600px] object-cover md:object-contain rounded-lg shadow-md"
                />
              )}
              {allImages.length > 1 && (
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
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-2 justify-center">
                {allImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 transition-all ${currentImg === idx ? "border-gray-900 scale-105" : "border-transparent opacity-70"}`}
                    onClick={() => setCurrentImg(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Actions */}
          <div className="lg:w-1/2 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleWishlist}
                    className="p-3 transition-colors duration-200"
                    title="Add to Wishlist"
                  >
                    <Heart size={24} fill={isInWishlist ? 'red' : 'none'} stroke={isInWishlist ? 'red' : 'gray'} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 transition-colors duration-200 "
                    title="Share Product"
                  >
                    <Share2 size={24} />
                  </button>
                </div>
              </div>
             
                                <p className="text-sm font-normal text-red-700 mt-1">
  {product.stockStatus}
</p>

              {/* Price & Discount */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-2xl font-extrabold text-green-600">₹{discountedPrice}</span>
                {discount > 0 && (
                  <>
                    <span className="text-lg text-gray-500 line-through">₹{basePrice}</span>
                    <span className="text-md font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">{discount}% OFF</span>
                  </>
                )}
              </div>

<div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
  {/* Decrease */}
  <button
    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
    className="w-10 h-10 flex items-center justify-center text-xl font-bold hover:bg-gray-100"
  >
    −
  </button>

  {/* Quantity display */}
  <span className="w-12 text-center text-lg font-semibold select-none">
    {quantity}
  </span>

  {/* Increase */}
  <button
    onClick={() => setQuantity((q) => q + 1)}
    className="w-10 h-10 flex items-center justify-center text-xl font-bold hover:bg-gray-100"
  >
    +
  </button>
</div>

              {/* Description & Other Notes */}
              <div className="space-y-4 text-gray-800 mt-[30px]">
                {product.description && (
                  <div>
                    <h3 className="font-bold text-lg">Description</h3>
                    
                    <p className="leading-relaxed">{product.description}</p>
                  </div>
                )}

                {product.composition && (
                  <div>
                    <h3 className="font-bold text-lg">Top Notes</h3>
                    <p>{product.composition}</p>
                  </div>
                )}

                {product.fragrance && (
                  <div>
                    <h3 className="font-bold text-lg">Heart Notes</h3>
                   
                    <p>{product.fragrance}</p>
                  </div>
                )}
{product.fragranceNotes && (
                  <div>
                    <h3 className="font-bold text-lg">Base Notes</h3>
                    <p>{product.fragranceNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* CTA buttons */}
            

    <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full">
      {/* Add / Remove from Cart */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        onClick={handleAddToCart}
        className={`w-full sm:flex-1 py-3 px-6 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
          isInCart
            ? "bg-red-800 text-neutral-100 hover:bg-redd-900"
            : "bg-gray-100 text-neutral-900 hover:bg-gray-200"
        }`}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
        >
          <ShoppingCart size={20} />
        </motion.div>
        {isInCart ? "Remove from Cart" : "Add to Cart"}
      </motion.button>

      {/* Buy Now */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        onClick={handleBuyNow}
        className="w-full sm:flex-1 py-3 px-6 font-medium rounded-xl bg-neutral-900 text-gray-100 hover:bg-neutral-950 transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
      >
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
        >
          <ShoppingCart size={20} />
        </motion.div>
        Buy Now
      </motion.button>
    </div>
  

          </div>
        </div>
      </div>
      
      {/* Review Section */}
      <div className="product-reviews-section bg-white rounded-lg max-w-7xl mx-auto mt-8">
        <ReviewComponent productId={product.id} userdetails={userdetails} />
      </div>
    </div>
  );
};

export default ProductDetail;
