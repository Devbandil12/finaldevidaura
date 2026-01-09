// src/pages/ProductDetail.jsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";
import ReviewComponent from "./ReviewComponent";
import {
  Heart, ShoppingCart, Share2, ChevronLeft, ChevronRight,
  Sparkles, Wind, Layers, Droplets, Minus, Plus, ArrowRight, Ban, ShoppingBag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- UI Components ---

// Soft, rounded buttons with subtle interactions
const Button = ({ onClick, variant = 'primary', size = 'default', className = '', children, disabled }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50 disabled:pointer-events-none active:scale-95";

  const sizeStyles = {
    default: "h-12 py-2 px-6",
    sm: "h-8 px-3 text-xs",
    lg: "h-14 px-8 text-base",
    icon: "h-10 w-10"
  };

  const variantStyles = {
    primary: "bg-gray-900 text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_25px_-5px_rgba(0,0,0,0.2)] hover:bg-black",
    secondary: "bg-white text-gray-700 border border-gray-100 hover:border-gray-200 hover:bg-gray-50 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]",
    destructive: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
    ghost: "hover:bg-gray-50 text-gray-600 hover:text-gray-900",
    outline: "border border-gray-200 text-gray-900 hover:bg-gray-50"
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

// Animation Variants
const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const ProductDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId } = useParams();

  const { userdetails } = useContext(UserContext);
  const { products, loading: productsLoading } = useContext(ProductContext);
  const { cart, wishlist, addToCart, toggleWishlist, startBuyNow } = useContext(CartContext);

  // ⚡ 1. INSTANT STATE: Initialize from Cache
  const [product, setProduct] = useState(() => {
    try {
      const cached = localStorage.getItem("all_products_cache");
      if (cached) {
        const list = JSON.parse(cached);
        return list.find((p) => p.id === productId) || null;
      }
    } catch (e) {
      return null;
    }
    return null;
  });

  // Initialize selected variant based on the cached product immediately
  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (product && product.variants?.length > 0) return product.variants[0];
    return null;
  });

  const [quantity, setQuantity] = useState(1);
  const [currentImg, setCurrentImg] = useState(0);
  const editReviewId = location.state?.editReviewId || null;

  // ⚡ 2. SYNC WITH CONTEXT
  useEffect(() => {
    if (products.length > 0) {
      const foundProduct = products.find((p) => p.id === productId);

      if (foundProduct) {
        setProduct((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(foundProduct)) {
            return foundProduct;
          }
          return prev;
        });

        setSelectedVariant((prev) => {
          if (!prev && foundProduct.variants?.length > 0) return foundProduct.variants[0];

          if (prev && foundProduct.variants) {
            const freshVariant = foundProduct.variants.find(v => v.id === prev.id);
            if (freshVariant && JSON.stringify(freshVariant) !== JSON.stringify(prev)) {
              return freshVariant;
            }
          }
          return prev;
        });
      }
    }
  }, [productId, products]);

  // ⚡ 3. IMAGE PRELOAD
  useEffect(() => {
    if (product?.imageurl?.[0]) {
      const img = new Image();
      img.src = product.imageurl[0];
    }
  }, [product]);

  // Scroll to top logic
  useEffect(() => {
    if (product && !editReviewId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [productId, editReviewId]);

  // --- LOADING STATE ---
  if (!product && productsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDFD]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 border-[3px] border-gray-100 border-t-gray-800 rounded-full mb-6"
        />
        <p className="text-gray-400 font-light tracking-widest text-sm uppercase">Loading Essence</p>
      </div>
    );
  }

  // --- NOT FOUND STATE ---
  if (!product || !selectedVariant) {
    if (!productsLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDFD] px-6">
          <div className="text-center max-w-md p-10 bg-white rounded-[2rem] border border-gray-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Product Unavailable</h2>
            <p className="text-gray-500 mb-8 font-light">The fragrance you seek is currently beyond reach.</p>
            <Button onClick={() => navigate("/")} variant="outline">Return to Collection</Button>
          </div>
        </div>
      );
    }
    return null;
  }

  // --- RENDER CONTENT ---
  const allImages = product.imageurl || [];
  const isInCart = cart?.some((i) => i.variant?.id === selectedVariant.id);
  const isInWishlist = wishlist?.some((w) => (w.variantId ?? w.variant?.id) === selectedVariant.id);

  const basePrice = Math.floor(Number(selectedVariant.oprice) || 0);
  const discount = Math.floor(Number(selectedVariant.discount) || 0);
  const discountedPrice = Math.floor(basePrice * (1 - discount / 100));

  const changeImage = (newIndex) => setCurrentImg(newIndex);

  const handleAddToCart = async () => {
    // If already in cart, go to cart
    if (isInCart) {
      navigate("/cart");
      return;
    }

    // Strict Stock Check
    if (selectedVariant.stock <= 0) {
      window.toast.error("Sorry, this item is currently sold out.");
      return;
    }
    
    await addToCart(product, selectedVariant, quantity);
  };

  const handleBuyNow = async () => {
    // Strict Stock Check
    if (selectedVariant.stock <= 0) {
      window.toast.error("Sorry, this item is currently sold out.");
      return;
    }
    startBuyNow(product, selectedVariant, quantity);
    navigate("/cart", { replace: true, state: { isBuyNow: true } });
  };

  const handleToggleWishlist = () => toggleWishlist(product, selectedVariant);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `Discover ${product.name}`, url: window.location.href });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      window.toast.success("Link copied to clipboard!");
    }
  };

  // 🟢 REFINED STATUS TEXT
  const stockStatus = selectedVariant.stock === 0
    ? "Sold Out"
    : selectedVariant.stock <= 10
      ? `Only ${selectedVariant.stock} left`
      : "In Stock";

  return (
    <>
      <title>{`${product.name} | Devid Aura`}</title>
      <meta name="description" content={`Discover ${product.name}, a captivating fragrance by Devid Aura.`} />

      <div className="min-h-screen bg-[#FDFDFD] text-gray-800 overflow-x-hidden selection:bg-gray-100 selection:text-black">

        {/* Main Container: pt-[50px] applied here for mobile navbar spacing */}
        <main className="max-w-7xl mx-auto pt-[80px] pb-20 px-4 md:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20">

            {/* --- Left Column: Image Gallery --- */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="sticky "
              >
                <div className="relative aspect-[4/6] md:aspect-[1/1] lg:aspect-[4/3] rounded-[2rem] overflow-hidden bg-white border border-gray-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] group">

                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImg}
                      src={allImages.length > 0 ? allImages[currentImg] : "/placeholder.svg"}
                      alt={product.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      loading="eager"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </AnimatePresence>

                  {/* Soft Navigation Arrows */}
                  {allImages.length > 1 && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-20 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75">
                      <Button onClick={() => changeImage((currentImg - 1 + allImages.length) % allImages.length)} variant="secondary" size="icon" className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                      </Button>
                      <Button onClick={() => changeImage((currentImg + 1) % allImages.length)} variant="secondary" size="icon" className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                      </Button>
                    </div>
                  )}

                  {/* Soft Pagination Dots */}
                  {allImages.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-white/30 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full flex gap-2 shadow-sm">
                        {allImages.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-500 ease-out ${idx === currentImg ? 'w-5 bg-white shadow-sm' : 'w-1.5 bg-white/50'}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Thumbnails (Desktop) */}
                {allImages.length > 1 && (
                  <div className="hidden lg:flex mt-6 gap-3 overflow-x-auto py-2 px-1">
                    {allImages.map((img, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ y: -2 }}
                        onClick={() => changeImage(idx)}
                        className={`relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-300 border ${currentImg === idx ? 'border-gray-300 ring-1 ring-gray-100' : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-200'}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* --- Right Column: Product Details --- */}
            <div className="lg:col-span-5">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-col h-full pt-2 px-4 lg:px-0"
              >
                {/* Header Section */}
                <motion.div variants={fadeIn} className="mb-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      {/* Subtle Stock Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${selectedVariant.stock > 0 ? 'bg-teal-50/30 text-teal-800 border-teal-100/50' : 'bg-red-50/30 text-red-800 border-red-100/50'}`}>
                        <Sparkles className="h-2.5 w-2.5" />
                        {stockStatus}
                      </span>
                      <h1 className="text-3xl md:text-5xl font-medium text-gray-900 leading-tight tracking-tight" style={{ textWrap: 'balance' }}>
                        {product.name}
                      </h1>
                    </div>

                    {/* Floating Action Buttons */}
                    <div className="flex gap-2">
                      <Button onClick={handleToggleWishlist} variant="secondary" size="icon" className="rounded-full h-11 w-11 border-gray-100 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.03)] bg-white hover:bg-white hover:shadow-md">
                        <Heart className={`h-5 w-5 transition-all duration-300 ${isInWishlist ? 'fill-red-400 text-red-400' : 'text-gray-400'}`} />
                      </Button>
                      <Button onClick={handleShare} variant="secondary" size="icon" className="rounded-full h-11 w-11 border-gray-100 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.03)] bg-white hover:bg-white hover:shadow-md">
                        <Share2 className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>

                  {/* Clean Price Display */}
                  <div className="mt-6 flex items-baseline gap-3">
                    <span className="text-3xl font-light text-gray-900">
                      ₹{discountedPrice.toLocaleString("en-IN")}
                    </span>
                    {discount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-base text-gray-400 line-through font-light">
                          ₹{basePrice.toLocaleString("en-IN")}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                          -{discount}%
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mb-8" />

                {/* Variant & Quantity */}
                <motion.div variants={fadeIn} className="space-y-8 mb-8">

                  {/* Variants (Soft Pills) */}
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block">
                      Select Size
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          disabled={variant.stock === 0}
                          className={`
                            relative px-6 py-2.5 rounded-full text-sm transition-all duration-300
                            ${selectedVariant.id === variant.id
                              ? 'bg-gray-900 text-white shadow-[0_8px_16px_-4px_rgba(0,0,0,0.15)] font-medium'
                              : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-300'
                            }
                            ${variant.stock === 0 ? 'opacity-40 cursor-not-allowed border-dashed' : ''}
                          `}
                        >
                          {variant.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity (Minimal) */}
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block">
                      Quantity
                    </span>
                    <div className="inline-flex items-center bg-white border border-gray-100 rounded-full shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] p-1">
                      <Button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={selectedVariant.stock === 0}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-10 text-center font-medium text-gray-900">{quantity}</span>
                      <Button
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={selectedVariant.stock === 0}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>


                {/* Note Cards */}
                <motion.div
                  variants={fadeIn}
                  className="flex gap-3 mb-10 w-full h-[200px] items-stretch group/container"
                >
                  {[
                    { label: 'Top', icon: Wind, data: product.composition, color: "bg-blue-50/40" },
                    { label: 'Heart', icon: Droplets, data: product.fragrance, color: "bg-rose-50/40" },
                    { label: 'Base', icon: Layers, data: product.fragranceNotes, color: "bg-amber-50/40" },
                  ].map((note, index) => {
                    const Icon = note.icon;
                    return (
                      <motion.div
                        key={index}
                        layout
                        transition={{
                          layout: { type: "spring", stiffness: 200, damping: 25 },
                        }}
                        whileHover={{ flexGrow: 10 }}
                        className="group relative flex-[1] min-w-[65px] cursor-pointer bg-white border border-gray-100 rounded-[2.5rem] p-4 flex flex-col items-center justify-start overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] transition-all duration-500"
                      >
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${note.color} -z-10`} />
                        <motion.div layout className="p-3 bg-gray-50 group-hover:bg-white rounded-2xl text-gray-700 shadow-sm mb-3 transition-colors duration-500">
                          <Icon className="h-5 w-5 stroke-[1.5]" />
                        </motion.div>
                        <motion.span layout="position" className="text-[9px] uppercase font-bold text-gray-400 tracking-[0.25em] mb-2 whitespace-nowrap">
                          {note.label}
                        </motion.span>
                        <motion.div layout className="w-full relative opacity-100 group-hover/container:opacity-0 group-hover:!opacity-100 transition-opacity duration-300">
                          <div className="w-full flex justify-center">
                            <motion.p
                              layout="position"
                              className="text-xs font-medium text-gray-800 leading-relaxed text-center px-1 max-w-[200px]"
                              style={{ textWrap: 'balance', hyphens: 'auto' }}
                            >
                              {note.data}
                            </motion.p>
                          </div>
                        </motion.div>
                        <motion.div layout className="mt-auto mb-2 w-1.5 h-1.5 bg-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* Description */}
                <motion.div variants={fadeIn} className="mb-10">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">The Scent</h3>
                  <p className="text-gray-500 leading-7 font-light text-sm md:text-base">
                    {product.description}
                  </p>
                </motion.div>

                {/* Bottom Action Bar */}
                <motion.div
                  variants={fadeIn}
                  className="mt-auto flex flex-col sm:flex-row gap-4"
                >
                  <Button
                    onClick={handleAddToCart}
                    // 🟢 ENABLE "VIEW BAG" even if stock is 0, but DISABLE "ADD" if stock is 0
                    disabled={!isInCart && selectedVariant.stock === 0}
                    variant="secondary"
                    className={`flex-1 text-sm tracking-wide ${isInCart ? "border-gray-200" : ""}`}
                  >
                    {isInCart ? (
                        <>
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            VIEW BAG
                        </>
                    ) : selectedVariant.stock === 0 ? (
                        <>
                            <Ban className="mr-2 h-4 w-4" />
                            SOLD OUT
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            ADD TO BAG
                        </>
                    )}
                  </Button>

                  <Button
                    onClick={handleBuyNow}
                    disabled={selectedVariant.stock === 0}
                    className="flex-1 text-sm tracking-wide bg-gray-900 hover:bg-black"
                  >
                    {selectedVariant.stock === 0 ? "SOLD OUT" : "BUY NOW"}
                  </Button>
                </motion.div>

              </motion.div>
            </div>
          </div>

          {/* --- Reviews Section --- */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-24 md:mt-32 pt-16 border-t border-gray-100"
          >
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-2">Reflections</h2>
                <p className="text-gray-400 text-sm">Customer experiences and stories</p>
              </div>
              <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] border border-gray-50 p-2 md:p-10">
                <ReviewComponent productId={product.id} userdetails={userdetails} editReviewId={editReviewId} />
              </div>
            </div>
          </motion.div>

        </main>
      </div>
    </>
  );
};

export default ProductDetail;