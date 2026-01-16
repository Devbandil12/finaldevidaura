// src/pages/ProductDetail.jsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";
import ReviewComponent from "./ReviewComponent";
import {
  Heart, ShoppingCart, Share2, ChevronLeft, ChevronRight,
  Sparkles, Minus, Plus, ShoppingBag, Star,
  MapPin, Clock, Sprout // New minimal icons
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { optimizeImage } from "../utils/imageOptimizer";

// --- UI Components ---
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

// --- ANIMATION VARIANTS ---
const contentContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.6
    }
  }
};

const textFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

// ⚡ NEW: OLFACTORY PYRAMID (Accordion Style)
// Replaces the old "Note Cards" with a high-end interactive list
const OlfactoryPyramid = ({ product }) => {
  const [activeNote, setActiveNote] = useState('heart'); // Default open 'Heart'

  // Dynamic Content Generation
  const notesData = [
    {
      id: 'top',
      label: 'The Top Notes',
      scent: product.composition || "Bergamot, Citrus",
      origin: "India",
      story: "Harvested in the early morning to preserve the volatile oils. This provides the initial burst of freshness.",
      duration: "0 - 2 hours",
    },
    {
      id: 'heart',
      label: 'The Heart',
      scent: product.fragrance || "Jasmine, Rose",
      origin: "India",
      story: "The soul of the fragrance. Sustainably sourced petals that reveal the true character of the aura.",
      duration: "2 - 4 hours",
    },
    {
      id: 'base',
      label: 'The Foundation',
      scent: product.fragranceNotes || "Oud, Amber",
      origin: "India",
      story: "Deep, resonant woods aged for richness. These notes linger on the skin, creating your lasting signature.",
      duration: "8 hours +",
    }
  ];

  return (
    <div className="w-full mb-12 border-t border-gray-100">
      {notesData.map((note) => {
        const isActive = activeNote === note.id;
        return (
          <div key={note.id} className="border-b border-gray-100 overflow-hidden">
            {/* Header / Trigger */}
            <button
              onClick={() => setActiveNote(isActive ? null : note.id)}
              className="w-full py-5 flex items-center justify-between group text-left transition-colors hover:bg-gray-50/50"
            >
              <div className="flex flex-col">
                <span className={`font-serif text-xl italic transition-colors duration-300 ${isActive ? 'text-[#D4AF37]' : 'text-gray-900'}`}>
                  {note.label}
                </span>
                {!isActive && (
                  <span className="text-xs text-gray-400 font-light mt-1 truncate max-w-[200px]">{note.scent}</span>
                )}
              </div>

              <div className={`transition-transform duration-500 ${isActive ? 'rotate-45' : 'rotate-0'}`}>
                <Plus className="h-4 w-4 text-gray-300" />
              </div>
            </button>

            {/* Expandable Content */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="pb-6 pt-2 pr-4 space-y-4">
                    {/* The Scent */}
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Notes</span>
                      <p className="text-gray-900 font-medium">{note.scent}</p>
                    </div>

                    {/* The Story & Origin */}
                    <div className="flex gap-6 mt-4">
                      <div className="flex-1">
                        <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-1 mb-1">
                          <MapPin size={10} /> Origin
                        </span>
                        <p className="text-sm text-gray-600 font-serif italic">{note.origin}</p>
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1 mb-1">
                          <Clock size={10} /> Longevity
                        </span>
                        <p className="text-sm text-gray-600">{note.duration}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100/50 mt-2">
                      <p className="text-xs leading-relaxed text-gray-500 font-light">
                        <span className="text-gray-900 font-medium">Why we chose this: </span>
                        {note.story}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};


const ProductDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId } = useParams();

  const { userdetails } = useContext(UserContext);
  const { products, loading: productsLoading } = useContext(ProductContext);
  const { cart, wishlist, addToCart, toggleWishlist, startBuyNow } = useContext(CartContext);

  // ⚡ UNBOXING STATE
  const [isUnboxing, setIsUnboxing] = useState(true);

  // Trigger the unboxing sequence on load
  useEffect(() => {
    // Small delay to ensure image is ready, then trigger reveal
    const timer = setTimeout(() => {
      setIsUnboxing(false);
    }, 1200); // 1.2s delay before curtain opens
    return () => clearTimeout(timer);
  }, [productId]);


  // ⚡ INSTANT STATE
  const [product, setProduct] = useState(() => {
    try {
      const cached = localStorage.getItem("all_products_cache");
      if (cached) {
        const list = JSON.parse(cached);
        return list.find((p) => p.id === productId) || null;
      }
    } catch (e) { return null; }
    return null;
  });

  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (product && product.variants?.length > 0) return product.variants[0];
    return null;
  });

  const [quantity, setQuantity] = useState(1);
  const [currentImg, setCurrentImg] = useState(0);
  const editReviewId = location.state?.editReviewId || null;

  // ⚡ SYNC WITH CONTEXT
  useEffect(() => {
    if (products.length > 0) {
      const foundProduct = products.find((p) => p.id === productId);
      if (foundProduct) {
        setProduct((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(foundProduct)) return foundProduct;
          return prev;
        });
        setSelectedVariant((prev) => {
          if (!prev && foundProduct.variants?.length > 0) return foundProduct.variants[0];
          if (prev && foundProduct.variants) {
            const freshVariant = foundProduct.variants.find(v => v.id === prev.id);
            if (freshVariant && JSON.stringify(freshVariant) !== JSON.stringify(prev)) return freshVariant;
          }
          return prev;
        });
      }
    }
  }, [productId, products]);

  // ⚡ IMAGE PRELOAD
  useEffect(() => {
    if (product?.imageurl?.[0]) {
      const img = new Image();
      img.src = optimizeImage(product.imageurl[0], 'hero');
    }
  }, [product]);

  useEffect(() => {
    if (product && !editReviewId) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [productId, editReviewId]);


  // --- LOADING / NOT FOUND ---
  if (!product && productsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDFD]">
        <div className="relative">
          <div className="absolute inset-0 bg-[#D4AF37] blur-xl opacity-20 animate-pulse" />
          <div className="w-16 h-16 border-[1px] border-[#D4AF37]/30 rounded-full animate-spin border-t-[#D4AF37]" />
        </div>
        <p className="mt-6 font-serif italic text-[#D4AF37] tracking-widest">Unboxing...</p>
      </div>
    );
  }

  if (!product || !selectedVariant) {
    if (!productsLoading) return <div className="min-h-screen flex items-center justify-center">Product Not Found</div>;
    return null;
  }

  // --- RENDER CONTENT ---
  const allImages = product.imageurl || [];
  const primaryImageSrc = allImages.length > 0 ? optimizeImage(allImages[0], 'hero') : "/placeholder.svg";

  const isInCart = cart?.some((i) => i.variant?.id === selectedVariant.id);
  const isInWishlist = wishlist?.some((w) => (w.variantId ?? w.variant?.id) === selectedVariant.id);
  const basePrice = Math.floor(Number(selectedVariant.oprice) || 0);
  const discount = Math.floor(Number(selectedVariant.discount) || 0);
  const discountedPrice = Math.floor(basePrice * (1 - discount / 100));

  const changeImage = (newIndex) => setCurrentImg(newIndex);

  const handleAddToCart = async () => {
    if (isInCart) { navigate("/cart"); return; }
    if (selectedVariant.stock <= 0) { window.toast.error("Sold out."); return; }
    await addToCart(product, selectedVariant, quantity);
  };

  const handleBuyNow = async () => {
    if (selectedVariant.stock <= 0) { window.toast.error("Sold out."); return; }
    startBuyNow(product, selectedVariant, quantity);
    navigate("/cart", { replace: true, state: { isBuyNow: true } });
  };

  const handleToggleWishlist = () => toggleWishlist(product, selectedVariant);
  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text: `Discover ${product.name}`, url: window.location.href }); }
      catch (error) { }
    } else {
      navigator.clipboard.writeText(window.location.href);
      window.toast.success("Link copied!");
    }
  };

  const stockStatus = selectedVariant.stock === 0 ? "Sold Out" : selectedVariant.stock <= 10 ? `Only ${selectedVariant.stock} left` : "In Stock";

  // Data for badges
  const avgRating = product.avgRating || 0;
  const soldCount = product.soldCount || 0;

  return (
    <>
      <title>{`${product.name} | Devid Aura`}</title>

      {/* ⚡ UNBOXING CURTAIN OVERLAY */}
      <AnimatePresence>
        {isUnboxing && (
          <motion.div
            key="unboxing-overlay"
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          >
            {/* Left Curtain */}
            <motion.div
              className="absolute inset-y-0 left-0 w-1/2 bg-[#F9F8F6] border-r border-[#D4AF37]/20"
              initial={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Right Curtain */}
            <motion.div
              className="absolute inset-y-0 right-0 w-1/2 bg-[#F9F8F6] border-l border-[#D4AF37]/20"
              initial={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* Center Brand Text (Fades out) */}
            <motion.div
              className="absolute z-10 flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="font-serif italic text-2xl text-[#D4AF37] mb-2">Devid Aura</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Presents</span>
            </motion.div>

            {/* THE HERO BOTTLE (Center Stage) */}
            <motion.div className="relative z-20 w-64 h-64 md:w-96 md:h-96">
              <motion.img
                layoutId={`product-image-${product.id}`}
                src={primaryImageSrc}
                className="w-full h-full object-cover drop-shadow-2xl"
                initial={{ scale: 1.1, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 1 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="min-h-screen bg-[#FDFDFD] text-gray-800 overflow-x-hidden">
        <main className="max-w-7xl mx-auto pt-[80px] pb-20 px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-25">

            {/* --- Left Column: Image Gallery --- */}
            <div className="lg:col-span-6">
              <div className="sticky top-24">
                <div className="relative aspect-[3/3] md:aspect-[1/1] lg:aspect-[5/5] rounded-[2rem] overflow-hidden bg-white border border-gray-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] group">

                  {/* MAIN GALLERY IMAGE */}
                  <AnimatePresence mode="wait">
                    {(!isUnboxing || currentImg !== 0) && (
                      <motion.img
                        layoutId={currentImg === 0 ? `product-image-${product.id}` : undefined}
                        key={currentImg}
                        src={allImages.length > 0 ? optimizeImage(allImages[currentImg], 'hero') : "/placeholder.svg"}
                        alt={product.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }} // Smooth settle
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />
                    )}
                  </AnimatePresence>

                  {/* Navigation Arrows */}
                  {allImages.length > 1 && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button onClick={() => changeImage((currentImg - 1 + allImages.length) % allImages.length)} variant="secondary" size="icon" className="bg-white/80 backdrop-blur-sm">
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button onClick={() => changeImage((currentImg + 1) % allImages.length)} variant="secondary" size="icon" className="bg-white/80 backdrop-blur-sm">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  )}

                  {/* Dots */}
                  {allImages.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                      {allImages.map((_, idx) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentImg ? 'w-5 bg-black' : 'w-1.5 bg-black/20'}`} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="hidden lg:flex mt-6 gap-3 overflow-x-auto py-2 px-1 no-scrollbar"
                  >
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => changeImage(idx)}
                        className={`relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-300 border ${currentImg === idx ? 'border-black ring-1 ring-black/10' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={optimizeImage(img, 'thumbnail')} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {/* --- Right Column: Product Details --- */}
            <div className="lg:col-span-5">
              <motion.div
                variants={contentContainerVariants}
                initial="hidden"
                animate={isUnboxing ? "hidden" : "visible"} // Wait for unboxing
                className="flex flex-col h-full pt-2 px-4 lg:px-0"
              >
                {/* Header */}
                <motion.div variants={textFadeIn} className="mb-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${selectedVariant.stock > 0 ? 'bg-teal-50/30 text-teal-800 border-teal-100/50' : 'bg-red-50/30 text-red-800 border-red-100/50'}`}>
                        <Sparkles className="h-2.5 w-2.5" />
                        {stockStatus}
                      </span>
                      <h1 className="text-3xl md:text-5xl font-medium text-gray-900 leading-tight tracking-tight text-balance">
                        {product.name}
                      </h1>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleToggleWishlist} variant="secondary" size="icon" className="rounded-full">
                        <Heart className={`h-5 w-5 transition-all ${isInWishlist ? 'fill-red-400 text-red-400' : 'text-gray-400'}`} />
                      </Button>
                      <Button onClick={handleShare} variant="secondary" size="icon" className="rounded-full">
                        <Share2 className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>

                  {/* STATS ROW */}
                  <div className="flex items-center gap-4 mt-4">
                    {avgRating >= 1 && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                        <Star size={13} className="fill-[#C5A059]" />
                        <span>{avgRating}</span>
                      </div>
                    )}

                    {avgRating >= 1 && soldCount >= 1 && (
                      <div className="w-[1px] h-3 bg-gray-300"></div>
                    )}

                    {soldCount >= 1 && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <ShoppingBag size={13} />
                        <span>{soldCount} Sold</span>
                      </div>
                    )}
                  </div>


                </motion.div>

                <motion.div variants={textFadeIn} className="w-full h-px bg-gray-100 mb-2" />

                {/* Variants */}
                <motion.div variants={textFadeIn} className="flex flex-col gap-6 mb-8">
                  <div className="flex justify-between items-center gap-6">
                    <div className="mt-6 flex items-center gap-3">
                      <span className="text-3xl font-light text-gray-900">₹{discountedPrice.toLocaleString("en-IN")}</span>
                      {discount > 0 && (
                        <>
                          <span className="text-base text-gray-400 line-through font-light">₹{basePrice.toLocaleString("en-IN")}</span>
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">-{discount}%</span>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap gap-3">
                        {product.variants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => setSelectedVariant(variant)}
                            disabled={variant.stock === 0}
                            className={`relative px-6 py-2.5 rounded-full text-sm transition-all duration-300 ${selectedVariant.id === variant.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-300'} ${variant.stock === 0 ? 'opacity-40 cursor-not-allowed border-dashed' : ''}`}
                          >
                            {variant.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="inline-flex items-center bg-white border border-gray-100 rounded-full p-1 shadow-sm">
                      <Button onClick={() => setQuantity(Math.max(1, quantity - 1))} variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-10 text-center font-medium">{quantity}</span>
                      <Button onClick={() => setQuantity(quantity + 1)} variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div variants={textFadeIn} className="mb-10">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">The Scent</h3>
                  <p className="text-gray-500 leading-7 font-light text-sm md:text-base">{product.description}</p>
                </motion.div>

                {/* ⚡ UPDATED: Integrated Olfactory Pyramid (Replaces Old Cards) */}
                <motion.div variants={textFadeIn}>
                  <OlfactoryPyramid product={product} />
                </motion.div>

                {/* Actions */}
                <motion.div variants={textFadeIn} className="mt-auto flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleAddToCart} disabled={!isInCart && selectedVariant.stock === 0} variant="secondary" className="flex-1">
                    {isInCart ? <><ShoppingBag className="mr-2 h-4 w-4" /> VIEW BAG</> : selectedVariant.stock === 0 ? "SOLD OUT" : <><ShoppingCart className="mr-2 h-4 w-4" /> ADD TO BAG</>}
                  </Button>
                  <Button onClick={handleBuyNow} disabled={selectedVariant.stock === 0} className="flex-1 bg-gray-900 hover:bg-black">
                    {selectedVariant.stock === 0 ? "SOLD OUT" : "BUY NOW"}
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-24 md:mt-32 pt-16 border-t border-gray-100"
          >
            <ReviewComponent productId={product.id} userdetails={userdetails} editReviewId={editReviewId} />
          </motion.div>

        </main>
      </div>
    </>
  );
};

export default ProductDetail;