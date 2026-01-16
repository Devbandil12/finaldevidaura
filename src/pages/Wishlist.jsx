import React, { useContext } from "react";
import { ShoppingCart, X, Trash2, ArrowRight, Sparkles, Star, ShoppingBag } from "lucide-react";
import { CartContext } from "../contexts/CartContext";
import Loader from "../Components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// --- UI Button (Matched with ProductDetail) ---
const Button = ({ onClick, variant = 'primary', size = 'default', className = '', children, disabled }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50 disabled:pointer-events-none active:scale-95";

  const sizeStyles = {
    default: "h-12 py-2 px-6",
    sm: "h-9 px-4 text-xs",
    icon: "h-10 w-10"
  };

  const variantStyles = {
    primary: "bg-gray-900 text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_25px_-5px_rgba(0,0,0,0.2)] hover:bg-black",
    secondary: "bg-white text-gray-700 border border-gray-100 hover:border-gray-200 hover:bg-gray-50 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]",
    text: "bg-transparent text-gray-400 hover:text-gray-900 px-0 h-auto"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Wishlist = () => {
  const navigate = useNavigate();
  const {
    wishlist,
    isWishlistLoading,
    removeFromWishlist,
    clearWishlist,
    moveFromWishlistToCart,
  } = useContext(CartContext);

  if (isWishlistLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFD]">
        <Loader text="Loading collection..." />
      </div>
    );
  }

  return (
    <>
      <title>My Wishlist | Devid Aura</title>

      <div className="min-h-screen text-gray-800 bg-[#FDFDFD] selection:bg-gray-100 selection:text-black">
        <main className="max-w-7xl mx-auto px-4 md:px-8 w-full pt-[80px] pb-32">

          {/* --- Header --- */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-medium text-gray-900 mb-2 tracking-tight">
                Wishlist
              </h1>
              <p className="text-gray-400 text-sm font-light tracking-wide">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} curated in your collection
              </p>
            </div>

            {wishlist.length > 0 && (
              <Button
                onClick={clearWishlist}
                variant="text"
                className="gap-2 text-xs font-bold uppercase tracking-widest"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear All
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {wishlist.length === 0 ? (
              // --- Empty State ---
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center text-center py-24 bg-white rounded-[2rem] border border-gray-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="h-6 w-6 text-gray-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-light text-gray-900 mb-3">Your collection is empty</h2>
                <p className="text-gray-500 mb-8 max-w-sm font-light">
                  Discover our captivating fragrances and curate your personal olfactory signature.
                </p>
                <Button onClick={() => navigate("/")} variant="primary" className="gap-3">
                  Discover Collection <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              // --- Grid Layout ---
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              >
                <AnimatePresence>
                  {wishlist.map((wishlistItem) => {
                    const { product, variant, wishlistId } = wishlistItem;
                    if (!product || !variant) return null;

                    const price = Math.floor(variant.oprice * (1 - variant.discount / 100));
                    const isOutOfStock = variant.stock === 0;
                    const img = Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl;

                    // Data from Backend
                    const avgRating = product.avgRating || 0;
                    const soldCount = product.soldCount || 0;

                    return (
                      <motion.div
                        key={wishlistId}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group relative bg-white rounded-[2rem] p-4 flex flex-col transition-all duration-500 border border-gray-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
                      >
                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWishlist(variant);
                          }}
                          className="absolute top-6 right-6 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-gray-100"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        {/* Image Area */}
                        <div
                          className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden mb-6 cursor-pointer bg-gray-50/30"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          <img
                            src={img}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
                            loading="lazy"
                          />
                          
                          {/* ⚡ STATS OVERLAY (TOP RIGHT) */}
                          <div className="absolute top-3 left-3 flex  gap-1.5 z-20 mr-10">
                              {/* Review Badge */}
                              {avgRating >= 1 && (
                                  <div className="bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center gap-1.5 border border-white/40">
                                      <Star size={10} className="text-[#C5A059] fill-[#C5A059]" />
                                      <span className="text-[10px] font-bold text-stone-700 leading-none pt-[1px]">{avgRating}</span>
                                  </div>
                              )}
                              
                              {/* Sold Badge */}
                              {soldCount >= 1 && (
                                  <div className="bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center gap-1.5 border border-white/10">
                                      <ShoppingBag size={10} className="text-[#F2F0EB]" />
                                      <span className="text-[9px] font-bold text-[#F2F0EB] uppercase tracking-wider leading-none pt-[1px]">{soldCount} Sold</span>
                                  </div>
                              )}
                          </div>

                          {/* Badges (Matched teal/red style from ProductDetail) */}
                          <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {isOutOfStock ? (
                              <span className="bg-red-50 text-red-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-red-100/50">
                                Out of Stock
                              </span>
                            ) : (
                              variant.discount > 0 && (
                                <span className="bg-teal-50 text-teal-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-teal-100/50">
                                  -{variant.discount}% OFF
                                </span>
                              )
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col flex-grow px-2">
                          <h3
                            onClick={() => navigate(`/product/${product.id}`)}
                            className="text-xl font-medium text-gray-900 cursor-pointer hover:text-gray-600 transition-colors mb-1"
                          >
                            {product.name}
                          </h3>

                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4">
                            {variant.name || `${variant.size}ML`}
                          </p>

                          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                              <span className="text-lg font-light text-gray-900">
                                ₹{price.toLocaleString("en-IN")}
                              </span>
                              {variant.discount > 0 && (
                                <span className="text-xs line-through text-gray-400 font-light">
                                  ₹{variant.oprice.toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>

                            <Button
                              onClick={() => {
                                if (isOutOfStock) {
                                  // Navigate to product page if out of stock
                                  navigate(`/product/${product.id}`);
                                } else {
                                  // Add to cart if in stock
                                  moveFromWishlistToCart(product, variant);
                                }
                              }}
                              variant={isOutOfStock ? "secondary" : "primary"}
                              size="sm"
                            >
                              {isOutOfStock ? (
                                <>
                                  <ArrowRight className="h-3.5 w-3.5 mr-2" />
                                  Detail
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="h-3.5 w-3.5 mr-2" />
                                  Add
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
};

export default Wishlist;