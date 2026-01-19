// src/pages/ProductDetail.jsx
import React, { useState, useContext, useEffect, useMemo, memo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";
import ReviewComponent from "./ReviewComponent";
import {
  Heart, ShoppingCart, Share2, ChevronLeft, ChevronRight,
  Sparkles, Minus, Plus, ShoppingBag, Star,
  MapPin, Clock, ShieldCheck, Truck, ArrowRight
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

// --- SUGGESTION CARD COMPONENT (Reused for both sections) ---
const SuggestionCard = memo(({ product, className = "" }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  if (!product || !product.variants?.length) return null;

  const variant = product.variants.sort((a, b) => a.oprice - b.oprice)[0];
  const price = Math.floor(variant.oprice * (1 - (variant.discount || 0) / 100));
  const imageSrc = product.imageurl?.[0] ? optimizeImage(product.imageurl[0], 'card') : "/placeholder.svg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group relative flex flex-col cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        window.scrollTo(0,0);
        navigate(`/product/${product.id}`);
      }}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 mb-4 border border-gray-100">
        <motion.img
          src={imageSrc}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-110"
        />
        {/* Quick View Overlay */}
        <div className={`absolute inset-0 bg-black/10 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
        
        {variant.discount > 0 && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            -{variant.discount}%
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 px-1">
        <h3 className="font-serif text-lg text-gray-900 group-hover:underline decoration-gray-300 underline-offset-4 decoration-1 truncate">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-900">₹{price}</span>
          {variant.discount > 0 && (
            <span className="text-gray-400 line-through text-xs">₹{variant.oprice}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// ⚡ OLFACTORY PYRAMID
const OlfactoryPyramid = ({ product }) => {
  const [activeTab, setActiveTab] = useState('top');

  const notesData = [
    {
      id: 'top',
      label: 'Top Notes',
      scent: product.composition || "Bergamot, Citrus",
      story: "The first impression. Light, volatile scents that burst forth immediately upon application.",
      duration: "0-2h",
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: 'heart',
      label: 'Heart Notes',
      scent: product.fragrance || "Jasmine, Rose",
      story: "The core of the fragrance. These notes emerge just as the top notes dissipate.",
      duration: "2-4h",
      icon: <Heart className="w-4 h-4" />
    },
    {
      id: 'base',
      label: 'Base Notes',
      scent: product.fragranceNotes || "Oud, Amber",
      story: "The foundation. Rich, heavy notes that linger on the skin for hours.",
      duration: "8h+",
      icon: <Clock className="w-4 h-4" />
    }
  ];

  const activeNote = notesData.find(n => n.id === activeTab);

  return (
    <div className="mb-12">
      <div className="bg-[#F9F9F9] rounded-[2rem] p-2 inline-flex mb-8 w-full sm:w-auto">
        {notesData.map((note) => (
          <button
            key={note.id}
            onClick={() => setActiveTab(note.id)}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
              activeTab === note.id 
                ? 'bg-white text-gray-900 shadow-md transform scale-105' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {note.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)]"
        >
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#D4AF37]">
                {activeNote.icon}
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Primary Scent</span>
                <h4 className="font-serif text-3xl md:text-4xl text-gray-900">{activeNote.scent}</h4>
              </div>
            </div>
            
            <div className="flex-1 md:border-l md:border-gray-100 md:pl-8 space-y-4">
               <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Duration</span>
                <p className="text-lg font-medium text-gray-900">{activeNote.duration}</p>
               </div>
               <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Experience</span>
                <p className="text-gray-500 font-light leading-relaxed">{activeNote.story}</p>
               </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const ShippingRefundSection = () => {
    return (
        <div className="max-w-3xl mx-auto px-4 py-12 border-t border-gray-100">
            <div className="flex flex-col md:flex-row gap-8 justify-between">
                {/* Shipping Col */}
                <div className="flex gap-4 flex-1">
                    <div className="shrink-0 mt-1">
                        <Truck className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-2">Shipping & Delivery</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Dispatched in 24-48 hrs. Delivery takes 3-5 days.
                        </p>
                    </div>
                </div>

                {/* Divider for Desktop */}
                <div className="hidden md:block w-px bg-gray-100" />

                {/* Refund Col */}
                <div className="flex gap-4 flex-1">
                    <div className="shrink-0 mt-1">
                        <ShieldCheck className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-2">Strict Refund Policy</h4>
                        <p className="text-sm text-gray-500 leading-relaxed mb-2">
                            <span className="font-bold text-gray-900">No Return, Only Refund.</span> Refund is applicable only when the order status is <strong>'Order Placed'</strong>. Once status changes, no refund is allowed. The order status will not change for <strong>6 hours</strong> after placing the order.
                        </p>
                      
                    </div>
                </div>
            </div>
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

  const [isUnboxing, setIsUnboxing] = useState(true);
  
  // 🟢 NEW STATE FOR COMBINED SECTIONS
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [youMayAlsoLike, setYouMayAlsoLike] = useState([]);

  // Backend URL for fetching API recommendations
  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsUnboxing(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [productId]);

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

  // 🟢 LOGIC: 1. Recently Viewed & 2. "You May Also Like" (Cart Algo + Category)
  useEffect(() => {
    if (!product) return;

    // --- 1. RECENTLY VIEWED (Local Storage) ---
    try {
      let viewed = JSON.parse(localStorage.getItem('recently_viewed_products') || '[]');
      
      // Filter out current product to avoid duplicates
      viewed = viewed.filter(p => p.id !== product.id);
      
      // Update storage: Add current to front
      const newHistory = [product, ...viewed].slice(0, 10);
      localStorage.setItem('recently_viewed_products', JSON.stringify(newHistory));
      
      // Display top 4 recent
      setRecentlyViewed(viewed.slice(0, 4)); 
    } catch (e) {
      console.error("Error setting recently viewed", e);
    }

    // --- 2. YOU MAY ALSO LIKE (API + Category Fallback) ---
    const fetchSuggestions = async () => {
        let suggestions = [];
        
        // A. Fetch Recommendations based on Cart (like CartRecommendations.jsx)
        try {
            // Exclude current product and anything in cart
            const cartIds = (cart || []).map(item => item.product?.id || item.productId).filter(Boolean);
            const excludeIds = [...new Set([...cartIds, product.id])];

            const res = await fetch(`${BACKEND_URL}/api/products/recommendations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    excludeIds,
                    userId: userdetails?.id || null, 
                }),
            });

            if (res.ok) {
                const apiData = await res.json();
                if (Array.isArray(apiData)) suggestions = [...suggestions, ...apiData];
            }
        } catch (err) {
            console.warn("Recommendation API failed, falling back to category match.");
        }

        // B. Fetch Related by Category (Client-side)
        if (products.length > 0) {
            const categoryMatches = products
                .filter(p => p.category === product.category && p.id !== product.id)
                .slice(0, 4); // Take top 4 from category
            
            suggestions = [...suggestions, ...categoryMatches];
        }

        // C. Deduplicate & Limit
        const uniqueSuggestions = Array.from(new Map(suggestions.map(item => [item.id, item])).values());
        
        // Filter out the current product again just in case
        const finalSuggestions = uniqueSuggestions.filter(p => p.id !== product.id).slice(0, 4);

        setYouMayAlsoLike(finalSuggestions);
    };

    fetchSuggestions();

  }, [product, products, cart, userdetails?.id, BACKEND_URL]);


  useEffect(() => {
    if (product?.imageurl?.[0]) {
      const img = new Image();
      img.src = optimizeImage(product.imageurl[0], 'hero');
    }
  }, [product]);

  useEffect(() => {
    if (product && !editReviewId) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [productId, editReviewId]);

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
  const avgRating = product.avgRating || 0;
  const soldCount = product.soldCount || 0;

  return (
    <>
      <title>{`${product.name} | Devid Aura`}</title>

      {/* UNBOXING OVERLAY */}
      <AnimatePresence>
        {isUnboxing && (
          <motion.div
            key="unboxing-overlay"
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          >
            <motion.div
              className="absolute inset-y-0 left-0 w-1/2 bg-[#F9F8F6] border-r border-[#D4AF37]/20"
              initial={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="absolute inset-y-0 right-0 w-1/2 bg-[#F9F8F6] border-l border-[#D4AF37]/20"
              initial={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
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
          
          {/* --- MAIN PRODUCT GRID --- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-25 mb-20">

            {/* --- Left Column: Images --- */}
            <div className="lg:col-span-6">
              <div className="sticky top-24">
                <div className="relative aspect-[3/3] md:aspect-[1/1] lg:aspect-[5/5] rounded-[2rem] overflow-hidden bg-white border border-gray-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] group">
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
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />
                    )}
                  </AnimatePresence>
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
                  {allImages.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                      {allImages.map((_, idx) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentImg ? 'w-5 bg-black' : 'w-1.5 bg-black/20'}`} />
                      ))}
                    </div>
                  )}
                </div>
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

            {/* --- Right Column: Details --- */}
            <div className="lg:col-span-5">
              <motion.div
                variants={contentContainerVariants}
                initial="hidden"
                animate={isUnboxing ? "hidden" : "visible"}
                className="flex flex-col h-full pt-2 px-4 lg:px-0"
              >
                {/* Header */}
                <motion.div variants={textFadeIn} className="mb-2">
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
                     <button onClick={handleToggleWishlist} className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all active:scale-90 ${isInWishlist ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900'}`}>
                            <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                        </button>
                     <button onClick={handleShare} className="w-12 h-12 rounded-full border border-gray-200 text-gray-400 flex items-center justify-center transition-all hover:text-gray-900 hover:border-gray-900 active:scale-90">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    {avgRating >= 1 && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                        <Star size={13} className="fill-[#C5A059]" />
                        <span>{avgRating}</span>
                      </div>
                    )}
                    {avgRating >= 1 && soldCount >= 1 && <div className="w-[1px] h-3 bg-gray-300"></div>}
                    {soldCount >= 1 && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <ShoppingBag size={13} />
                        <span>{soldCount} Sold</span>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Variants */}
                <motion.div variants={textFadeIn} className="flex flex-col gap-6 mb-8">
                  <div className="flex justify-between items-center gap-6">
                    <div className="mt-6 flex items-center gap-3">
                      <span className="text-3xl font-light text-gray-900">₹{discountedPrice.toLocaleString("en-IN")}</span>
                      {discount > 0 && (
                        <>
                          <span className="text-base text-gray-400 line-through font-light">₹{basePrice.toLocaleString("en-IN")}</span>
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-green-600 text-xs font-semibold">-{discount}%</span>
                        </>
                      )}
                    </div>
                  </div>
                 <div className="space-y-8">
                    {/* Size Selector */}
                    <div>
                        <div className="flex justify-between mb-4">
                             <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Select Variant</span>
                             {selectedVariant.stock <= 5 && selectedVariant.stock > 0 && <span className="text-[10px] text-red-500 font-bold animate-pulse">Low Stock</span>}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {product.variants.map((v) => (
                                <button key={v.id} onClick={() => setSelectedVariant(v)} disabled={v.stock === 0}
                                    className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${selectedVariant.id === v.id ? 'bg-[#1A1C20] text-white shadow-lg shadow-black/20 scale-105' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'} ${v.stock === 0 ? 'opacity-40 border-dashed bg-gray-50' : ''}`}
                                >
                                    {v.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity Selector */}
                    <div>
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-widest block mb-4">Quantity</span>
                        <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1.5 shadow-sm">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="w-12 text-center font-serif text-xl">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"><Plus className="w-4 h-4" /></button>
                        </div>
                    </div>
                 </div>
                </motion.div>

                {/* Description */}
                <motion.div variants={textFadeIn} className="mb-10">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">The Scent</h3>
                  <p className="text-gray-500 leading-7 font-light text-sm md:text-base">{product.description}</p>
                </motion.div>

                {/* OLFACTORY PYRAMID (Notes) */}
                <motion.div variants={textFadeIn}>
                  <OlfactoryPyramid product={product} />
                </motion.div>

                {/* Actions */}
                <motion.div variants={textFadeIn} className="mt-auto flex flex-col sm:flex-row gap-4 pt-4">
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
          
          {/* 🟢 SHIPPING & REFUND SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
             <ShippingRefundSection />
          </motion.div>

          {/* 🟢 SECTION 1: YOU MAY ALSO LIKE (Combined API + Category) */}
          {youMayAlsoLike.length > 0 && (
            <div className="pt-20 border-t border-gray-100">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl md:text-3xl font-serif text-gray-900">You May Also Like</h2>
                <button 
                  onClick={() => navigate('/products')}
                  className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  View Collection <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
              <div className="flex md:grid md:grid-cols-4 gap-4 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
                {youMayAlsoLike.map(p => (
                  <SuggestionCard key={p.id} product={p} className="min-w-[160px] w-[45vw] md:w-auto flex-shrink-0 snap-center" />
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="pt-16 border-t border-gray-100"
          >
            <ReviewComponent productId={product.id} userdetails={userdetails} editReviewId={editReviewId} />
          </motion.div>

          {/* 🟢 SECTION 2: RECENTLY VIEWED (LocalStorage) */}
          {recentlyViewed.length > 0 && (
            <div className="pt-20 pb-10 border-t border-gray-100 mt-20">
               <div className="flex items-center gap-3 mb-10">
                 <div className="h-px bg-gray-200 flex-1"></div>
                 <h2 className="text-lg uppercase tracking-widest text-gray-400 font-bold">Recently Viewed</h2>
                 <div className="h-px bg-gray-200 flex-1"></div>
               </div>
              <div className="flex md:grid md:grid-cols-4 gap-4 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 opacity-70 hover:opacity-100 transition-opacity duration-500">
                {recentlyViewed.map(p => (
                  <SuggestionCard key={p.id} product={p} className="min-w-[160px] w-[45vw] md:w-auto flex-shrink-0 snap-center" />
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
};

export default ProductDetail;