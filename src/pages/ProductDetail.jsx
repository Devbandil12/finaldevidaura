// src/pages/ProductDetail.jsx
import React, { useState, useContext, useEffect, useMemo, memo, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useProducts } from "../features/catalog/hooks/useProducts";
import { ShimmerBlock as ShimmerSkeleton } from "../Components/ui/ShimmerSkeleton";
import { useCart, useAddToCart } from "../features/cart/hooks/useCart";
import { useWishlist, useToggleWishlist } from "../features/cart/hooks/useWishlist";
import { useCheckout } from "../features/checkout/hooks/useCheckout";
import { UserContext } from "../contexts/UserContext";
import ReviewComponent from "./ReviewComponent";
import {
  Heart, ShoppingCart, Share2, ChevronLeft, ChevronRight,
  Sparkles, Minus, Plus, ShoppingBag, Star,
  Clock, ShieldCheck, Truck, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion, useDragControls } from "framer-motion"; // 🟢 Added useDragControls
import { useAuth } from "@clerk/clerk-react"; // 🟢 Import Auth
import { optimizeImage } from "../utils/imageOptimizer";

// --- UTILS & POLYFILLS ---
const rIC = typeof window !== 'undefined' && window.requestIdleCallback
  ? window.requestIdleCallback
  : (cb) => setTimeout(cb, 1);

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

// --- CUSTOM HOOKS ---

const useRecentlyViewed = (product) => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    if (!product) return;

    rIC(() => {
      try {
        let viewed = JSON.parse(sessionStorage.getItem('recently_viewed_products') || '[]');
        viewed = viewed.filter(p => p.id !== product.id);
        
        const newHistory = [
            { id: product.id, name: product.name, imageurl: product.imageurl, variants: product.variants, category: product.category, oprice: product.oprice, price: product.price }, 
            ...viewed
        ].slice(0, 10);
        
        sessionStorage.setItem('recently_viewed_products', JSON.stringify(newHistory));
        setRecentlyViewed(viewed.slice(0, 4));
      } catch (e) {
        console.error("Error setting recently viewed", e);
      }
    });
  }, [product?.id]); 

  return recentlyViewed;
};

// 🟢 SECURE: Added Auth Token to Recommendations
const useProductRecommendations = (product, products, cart, userdetails, BACKEND_URL) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef(new Map());
  const { getToken } = useAuth(); // 🟢 Get Token Helper

  useEffect(() => {
    if (!product) return;

    const cacheKey = `${product.id}-${cart?.length || 0}`;
    
    if (cacheRef.current.has(cacheKey)) {
      setRecommendations(cacheRef.current.get(cacheKey));
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      let suggestions = [];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const cartIds = (cart || []).map(item => item.product?.id || item.productId).filter(Boolean);
        const excludeIds = [...new Set([...cartIds, product.id])];

        try {
          // 🟢 SECURE: Get Token
          const token = await getToken();
          const headers = { "Content-Type": "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch(`${BACKEND_URL}/api/products/recommendations`, {
            method: "POST",
            headers, // 🔒 Attach Headers
            body: JSON.stringify({
              excludeIds,
              userId: userdetails?.id || null,
            }),
            signal: controller.signal
          });
          
          if (res.ok) {
            const apiData = await res.json();
            if (Array.isArray(apiData)) suggestions = [...suggestions, ...apiData];
          }
        } catch (err) {
          if (err.name !== 'AbortError') console.warn("Recs API failed/aborted, using fallback");
        }

        if (products.length > 0 && suggestions.length < 4) {
          const categoryMatches = products
            .filter(p => p.category === product.category && p.id !== product.id && !excludeIds.includes(p.id))
            .slice(0, 4 - suggestions.length);
          suggestions = [...suggestions, ...categoryMatches];
        }

        const uniqueSuggestions = Array.from(
          new Map(suggestions.map(item => [item.id, item])).values()
        ).slice(0, 4);

        cacheRef.current.set(cacheKey, uniqueSuggestions);
        setRecommendations(uniqueSuggestions);
      } catch (err) {
        console.error(err);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    rIC(fetchSuggestions);

  }, [product?.id, products, cart?.length, userdetails?.id, BACKEND_URL, getToken]);

  return { recommendations, isLoading };
};

// --- UI COMPONENTS (Button, SuggestionCard, OlfactoryPyramid, ShippingRefundSection Unchanged) ---
// ... (Keep existing Button, SuggestionCard, OlfactoryPyramid, ShippingRefundSection components here) ...
// (I will omit them for brevity, but they should be included exactly as in the previous optimized version)

const Button = memo(({ onClick, variant = 'primary', size = 'default', className = '', children, disabled }) => {
    const baseStyles = "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50 disabled:pointer-events-none active:scale-95";
    const sizeStyles = {
      default: "h-12 py-2 px-6",
      sm: "h-8 px-3 text-xs",
      lg: "h-14 px-8 text-base",
      icon: "h-10 w-10"
    };
    const variantStyles = {
      primary: "bg-[var(--brand)] text-[var(--brand-contrast)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] hover:bg-[var(--brand-hover)]",
      secondary: "bg-[var(--surface)] text-[var(--sub)] border border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)] shadow-[var(--shadow)]",
      ghost: "hover:bg-[var(--surface-muted)] text-[var(--sub)] hover:text-[var(--text)]",
      outline: "border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-muted)]"
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
});

const SuggestionCard = memo(({ product, className = "" }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    
    // Memoize derived data
    const variant = useMemo(() => product?.variants?.sort((a, b) => a.oprice - b.oprice)[0], [product?.variants]);
    
    const priceData = useMemo(() => {
      if (!variant) return { price: 0, showDiscount: false };
      return {
          price: Math.floor(variant.oprice * (1 - (variant.discount || 0) / 100)),
          showDiscount: variant.discount > 0
      };
    }, [variant]);
  
    const imageSrc = useMemo(() => 
      product.imageurl?.[0] ? optimizeImage(product.imageurl[0], 'card') : "/placeholder.svg", 
    [product.imageurl]);
  
    const handleClick = useCallback(() => {
      window.scrollTo({ top: 0, behavior: 'instant' }); 
      navigate(`/product/${product.id}`);
    }, [navigate, product.id]);
  
    if (!product || !product.variants?.length) return null;
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "50px" }}
        className={`group relative flex flex-col cursor-pointer ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--surface-muted)] mb-4 border border-[var(--border)]">
          <img 
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <div className={`absolute inset-0 bg-[var(--overlay)] transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
          
          {priceData.showDiscount && (
            <div className="absolute top-3 left-3 bg-[var(--surface)]/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              -{variant.discount}%
            </div>
          )}
        </div>
  
        <div className="flex flex-col gap-1 px-1">
          <h3 className="font-serif text-lg text-[var(--text)] group-hover:underline decoration-gray-300 underline-offset-4 decoration-1 truncate">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-[var(--text)]">{formatCurrency(priceData.price)}</span>
            {priceData.showDiscount && (
              <span className="text-[var(--muted)] line-through text-xs">{formatCurrency(variant.oprice)}</span>
            )}
          </div>
        </div>
      </motion.div>
    );
}, (prev, next) => prev.product.id === next.product.id); 

const OlfactoryPyramid = memo(({ product }) => {
    const [activeTab, setActiveTab] = useState('top');
    const shouldReduceMotion = useReducedMotion();
  
    const notesData = useMemo(() => [
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
    ], [product.composition, product.fragrance, product.fragranceNotes]);
  
    const activeNote = notesData.find(n => n.id === activeTab);
  
    return (
      <div className="mb-12">
        <div className="bg-[var(--bg)] rounded-[2rem] p-2 inline-flex mb-8 w-full sm:w-auto">
          {notesData.map((note) => (
            <button
              key={note.id}
              onClick={() => setActiveTab(note.id)}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                activeTab === note.id 
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-md transform scale-105' 
                  : 'text-[var(--muted)] hover:text-[var(--sub)]'
              }`}
            >
              {note.label}
            </button>
          ))}
        </div>
  
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[2.5rem] p-8 md:p-10 shadow-[var(--shadow)]"
          >
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--accent)]">
                  {activeNote.icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest block mb-2">Primary Scent</span>
                  <h4 className="font-serif text-3xl md:text-4xl text-[var(--text)]">{activeNote.scent}</h4>
                </div>
              </div>
              
              <div className="flex-1 md:border-l md:border-[var(--border)] md:pl-8 space-y-4">
                 <div>
                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest block mb-2">Duration</span>
                  <p className="text-lg font-medium text-[var(--text)]">{activeNote.duration}</p>
                 </div>
                 <div>
                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest block mb-2">Experience</span>
                  <p className="text-[var(--muted)] font-light leading-relaxed">{activeNote.story}</p>
                 </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
});

const ShippingRefundSection = memo(() => {
    return (
        <div className="max-w-3xl mx-auto px-4 py-12 border-t border-[var(--border)]">
            <div className="flex flex-col md:flex-row gap-8 justify-between">
                <div className="flex gap-4 flex-1">
                    <div className="shrink-0 mt-1"><Truck className="w-6 h-6 text-[var(--text)]" strokeWidth={1.5} /></div>
                    <div>
                        <h4 className="font-bold text-[var(--text)] mb-2">Shipping & Delivery</h4>
                        <p className="text-sm text-[var(--muted)] leading-relaxed">Dispatched in 24-48 hrs. Delivery takes 3-5 days.</p>
                    </div>
                </div>
                <div className="hidden md:block w-px bg-[var(--surface-muted)]" />
                <div className="flex gap-4 flex-1">
                    <div className="shrink-0 mt-1"><ShieldCheck className="w-6 h-6 text-[var(--text)]" strokeWidth={1.5} /></div>
                    <div>
                        <h4 className="font-bold text-[var(--text)] mb-2">Refund Policy</h4>
                        <p className="text-sm text-[var(--muted)] leading-relaxed mb-2">
                            <span className="font-bold text-[var(--text)]">No Return, Only Refund.</span> Refund only if 'Order Placed'. Status locks after <strong>6 hours</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
});

// --- MAIN COMPONENT ---
const ProductDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId } = useParams();
  const shouldReduceMotion = useReducedMotion();

  const { userdetails } = useContext(UserContext);
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: cart = [] } = useCart();
  const { data: wishlist = [] } = useWishlist();
  const { mutateAsync: addToCart } = useAddToCart();
  const { mutateAsync: toggleWishlist } = useToggleWishlist();
  const { startBuyNow } = useCheckout();

  const [isUnboxing, setIsUnboxing] = useState(!shouldReduceMotion);
  const [quantity, setQuantity] = useState(1);
  const [currentImg, setCurrentImg] = useState(0);
  const editReviewId = location.state?.editReviewId || null;
  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  // 1. Optimized State Initialization using sessionStorage
  const [product, setProduct] = useState(() => {
    try {
      const cached = sessionStorage.getItem("all_products_cache");
      if (cached) {
        const list = JSON.parse(cached);
        return list.find((p) => p.id === productId) || null;
      }
    } catch (e) { return null; }
    return null;
  });

  const [selectedVariant, setSelectedVariant] = useState(() => product?.variants?.[0] || null);

  useEffect(() => {
    if (products.length > 0) {
      const foundProduct = products.find((p) => p.id === productId);
      if (foundProduct && foundProduct.id !== product?.id) {
        setProduct(foundProduct);
        setSelectedVariant(foundProduct.variants?.[0]);
      }
    }
  }, [productId, products, product?.id]);

  const recentlyViewed = useRecentlyViewed(product);
  const { recommendations: youMayAlsoLike } = useProductRecommendations(product, products, cart, userdetails, BACKEND_URL);

  useEffect(() => {
    if (!product?.imageurl?.[0]) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizeImage(product.imageurl[0], 'hero');
    document.head.appendChild(link);

    if (product.imageurl.length > 1) {
        rIC(() => {
            product.imageurl.slice(1).forEach(url => {
                const img = new Image();
                img.src = optimizeImage(url, 'hero');
                img.decoding = 'async';
            });
        });
    }
    return () => { if(link.parentNode) link.parentNode.removeChild(link); }
  }, [product?.imageurl]);

  useEffect(() => {
    if (shouldReduceMotion) { setIsUnboxing(false); return; }
    const timer = setTimeout(() => setIsUnboxing(false), 1200);
    return () => clearTimeout(timer);
  }, [productId, shouldReduceMotion]);

  useEffect(() => {
    if (product && !editReviewId) window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
  }, [productId, editReviewId, shouldReduceMotion, product]);

  const allImages = useMemo(() => product?.imageurl || [], [product?.imageurl]);
  const primaryImageSrc = useMemo(() => allImages.length > 0 ? optimizeImage(allImages[0], 'hero') : "/placeholder.svg", [allImages]);
  
  const isInCart = useMemo(() => cart?.some((i) => i.variant?.id === selectedVariant?.id), [cart, selectedVariant?.id]);
  const isInWishlist = useMemo(() => wishlist?.some((w) => (w.variantId ?? w.variant?.id) === selectedVariant?.id), [wishlist, selectedVariant?.id]);
  
  const priceInfo = useMemo(() => {
    if (!selectedVariant) return { base: 0, discount: 0, final: 0 };
    const base = Math.floor(Number(selectedVariant.oprice) || 0);
    const disc = Math.floor(Number(selectedVariant.discount) || 0);
    const final = Math.floor(base * (1 - disc / 100));
    return { base, discount: disc, final };
  }, [selectedVariant]);

  const stockStatus = useMemo(() => {
    if (!selectedVariant) return "Out of Stock";
    return selectedVariant.stock === 0 ? "Sold Out" : selectedVariant.stock <= 10 ? `Only ${selectedVariant.stock} left` : "In Stock";
  }, [selectedVariant?.stock]);

  // 🟢 NEW: Touch Swipe Handling
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const handleSwipe = useCallback((direction) => {
    if (direction === 'left') {
        const nextIndex = (currentImg + 1) % allImages.length;
        setCurrentImg(nextIndex);
    } else {
        const prevIndex = (currentImg - 1 + allImages.length) % allImages.length;
        setCurrentImg(prevIndex);
    }
  }, [currentImg, allImages.length]);

  const changeImage = useCallback((newIndex) => setCurrentImg(newIndex), []);

  const handleAddToCart = useCallback(async () => {
    if (isInCart) { navigate("/cart"); return; }
    if (selectedVariant.stock <= 0) { window.toast?.error("Sold out."); return; }
    await addToCart({ product, variant: selectedVariant, quantity });
  }, [isInCart, selectedVariant, quantity, product, navigate, addToCart]);

  const handleBuyNow = useCallback(() => {
    if (selectedVariant.stock <= 0) { window.toast?.error("Sold out."); return; }
    startBuyNow(product, selectedVariant, quantity);
    navigate("/cart", { replace: true, state: { isBuyNow: true } });
  }, [selectedVariant, quantity, product, startBuyNow, navigate]);

  const handleToggleWishlist = useCallback(() => toggleWishlist({ product, variant: selectedVariant }), [product, selectedVariant, toggleWishlist]);
  
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text: `Discover ${product.name}`, url: window.location.href }); }
      catch (error) { }
    } else {
      navigator.clipboard.writeText(window.location.href);
      window.toast?.success("Link copied!");
    }
  }, [product?.name]);

  if (!product && productsLoading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-24 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 mb-32">
          <div className="space-y-6">
            <ShimmerSkeleton className="w-full aspect-[4/5] rounded-[2.5rem]" />
            <div className="flex gap-4">
              <ShimmerSkeleton className="w-24 aspect-square rounded-[1rem]" />
              <ShimmerSkeleton className="w-24 aspect-square rounded-[1rem]" />
            </div>
          </div>
          <div className="flex flex-col pt-10">
            <ShimmerSkeleton className="w-24 h-6 mb-8 rounded-full" />
            <ShimmerSkeleton className="w-3/4 h-12 mb-4" />
            <ShimmerSkeleton className="w-1/3 h-6 mb-8" />
            <ShimmerSkeleton className="w-full h-24 mb-12" />
            <div className="flex gap-4 mb-8">
               <ShimmerSkeleton className="w-32 h-14 rounded-full" />
               <ShimmerSkeleton className="w-32 h-14 rounded-full" />
            </div>
            <ShimmerSkeleton className="w-full h-16 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || !selectedVariant) {
    if (!productsLoading) return <div className="min-h-screen flex items-center justify-center">Product Not Found</div>;
    return null;
  }

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.6 } }
  };
  const textVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <>
      <title>{`${product.name} | Devid Aura`}</title>

      <AnimatePresence>
        {isUnboxing && (
          <motion.div
            key="unboxing-overlay"
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          >
            <motion.div
              className="absolute inset-y-0 left-0 w-1/2 bg-[var(--bg)] border-r border-[var(--accent)]/20"
              initial={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="absolute inset-y-0 right-0 w-1/2 bg-[var(--bg)] border-l border-[var(--accent)]/20"
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
              <span className="font-serif italic text-2xl text-[var(--accent)] mb-2">Devid Aura</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted)]">Presents</span>
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

      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] overflow-x-hidden">
        <main className="max-w-7xl mx-auto pt-[80px] pb-20 px-4 md:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-25 mb-20">
            {/* --- Left Column: Images --- */}
            <div className="lg:col-span-6">
              <div className="sticky top-24">
                <div className="relative aspect-[3/3] md:aspect-[1/1] lg:aspect-[5/5] rounded-[2rem] overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow)] group">
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
                        
                        // 🟢 MOBILE SWIPE SUPPORT
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = swipePower(offset.x, velocity.x);
                            if (swipe < -swipeConfidenceThreshold) {
                                handleSwipe('left');
                            } else if (swipe > swipeConfidenceThreshold) {
                                handleSwipe('right');
                            }
                        }}
                      />
                    )}
                  </AnimatePresence>
                  
                  {allImages.length > 1 && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-20 pointer-events-none">
                        {/* Pointer events auto enables buttons but lets swipe happen elsewhere */}
                        <div className="pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button onClick={() => changeImage((currentImg - 1 + allImages.length) % allImages.length)} variant="secondary" size="icon" className="bg-[var(--surface)]/80 backdrop-blur-sm">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button onClick={() => changeImage((currentImg + 1) % allImages.length)} variant="secondary" size="icon" className="bg-[var(--surface)]/80 backdrop-blur-sm">
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                  )}
                  {allImages.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                      {allImages.map((_, idx) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentImg ? 'w-5 bg-[var(--text)]' : 'w-1.5 bg-[var(--text)]/20'}`} />
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
                variants={contentVariants}
                initial="hidden"
                animate={isUnboxing ? "hidden" : "visible"}
                className="flex flex-col h-full pt-2 px-4 lg:px-0"
              >
                {/* Header */}
                <motion.div variants={textVariants} className="mb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${selectedVariant.stock > 0 ? 'bg-teal-50/30 text-teal-800 border-teal-100/50' : 'bg-red-50/30 text-red-800 border-red-100/50'}`}>
                        <Sparkles className="h-2.5 w-2.5" />
                        {stockStatus}
                      </span>
                      <h1 className="text-3xl md:text-5xl font-medium text-[var(--text)] leading-tight tracking-tight text-balance">
                        {product.name}
                      </h1>
                    </div>
                    <div className="flex gap-2">
                     <button onClick={handleToggleWishlist} className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all active:scale-90 ${isInWishlist ? 'bg-red-50 border-red-200 text-red-500' : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-gray-900'}`}>
                            <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                        </button>
                     <button onClick={handleShare} className="w-12 h-12 rounded-full border border-[var(--border)] text-[var(--muted)] flex items-center justify-center transition-all hover:text-[var(--text)] hover:border-gray-900 active:scale-90">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    {product.avgRating >= 1 && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                        <Star size={13} className="fill-[#C5A059]" />
                        <span>{product.avgRating}</span>
                      </div>
                    )}
                    {product.avgRating >= 1 && product.soldCount >= 1 && <div className="w-[1px] h-3 bg-gray-300"></div>}
                    {product.soldCount >= 1 && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                        <ShoppingBag size={13} />
                        <span>{product.soldCount} Sold</span>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Variants & Price */}
                <motion.div variants={textVariants} className="flex flex-col gap-6 mb-8">
                  <div className="flex justify-between items-center gap-6">
                    <div className="mt-6 flex items-center gap-3">
                      <span className="text-3xl font-light text-[var(--text)]">{formatCurrency(priceInfo.final)}</span>
                      {priceInfo.discount > 0 && (
                        <>
                          <span className="text-base text-[var(--muted)] line-through font-light">{formatCurrency(priceInfo.base)}</span>
                          <span className="px-2 py-0.5 rounded-md bg-[var(--surface-muted)] text-green-600 text-xs font-semibold">-{priceInfo.discount}%</span>
                        </>
                      )}
                    </div>
                  </div>
                 <div className="space-y-8">
                    {/* Size Selector */}
                    <div>
                        <div className="flex justify-between mb-4">
                             <span className="text-xs font-bold text-[var(--text)] uppercase tracking-widest">Select Variant</span>
                             {selectedVariant.stock <= 5 && selectedVariant.stock > 0 && <span className="text-[10px] text-red-500 font-bold animate-pulse">Low Stock</span>}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {product.variants.map((v) => (
                                <button key={v.id} onClick={() => setSelectedVariant(v)} disabled={v.stock === 0}
                                    className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${selectedVariant.id === v.id ? 'bg-[var(--brand)] text-[var(--brand-contrast)] shadow-lg shadow-[var(--shadow)] scale-105' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--sub)] hover:border-gray-400'} ${v.stock === 0 ? 'opacity-40 border-dashed bg-[var(--surface-muted)]' : ''}`}
                                >
                                    {v.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity Selector */}
                    <div>
                        <span className="text-xs font-bold text-[var(--text)] uppercase tracking-widest block mb-4">Quantity</span>
                        <div className="inline-flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-full p-1.5 shadow-sm">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--surface-muted)] transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="w-12 text-center font-serif text-xl">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--surface-muted)] transition-colors"><Plus className="w-4 h-4" /></button>
                        </div>
                    </div>
                 </div>
                </motion.div>

                {/* Description */}
                <motion.div variants={textVariants} className="mb-10">
                  <h3 className="text-sm font-bold text-[var(--text)] mb-3 uppercase tracking-wider">The Scent</h3>
                  <p className="text-[var(--muted)] leading-7 font-light text-sm md:text-base">{product.description}</p>
                </motion.div>

                {/* OLFACTORY PYRAMID */}
                <motion.div variants={textVariants}>
                  <OlfactoryPyramid product={product} />
                </motion.div>

                {/* Actions */}
                <motion.div variants={textVariants} className="mt-auto flex flex-col sm:flex-row gap-4 pt-4">
                  <Button onClick={handleAddToCart} disabled={!isInCart && selectedVariant.stock === 0} variant="secondary" className="flex-1">
                    {isInCart ? <><ShoppingBag className="mr-2 h-4 w-4" /> VIEW BAG</> : selectedVariant.stock === 0 ? "SOLD OUT" : <><ShoppingCart className="mr-2 h-4 w-4" /> ADD TO BAG</>}
                  </Button>
                  <Button onClick={handleBuyNow} disabled={selectedVariant.stock === 0} className="flex-1">
                    {selectedVariant.stock === 0 ? "SOLD OUT" : "BUY NOW"}
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
             <ShippingRefundSection />
          </motion.div>

          {/* SECTION 1: YOU MAY ALSO LIKE */}
          {youMayAlsoLike.length > 0 && (
            <div className="pt-20 border-t border-[var(--border)]">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl md:text-3xl font-serif text-[var(--text)]">You May Also Like</h2>
                <button 
                  onClick={() => navigate('/products')}
                  className="group flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors"
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
            className="pt-16 border-t border-[var(--border)]"
          >
            <ReviewComponent productId={product.id} userdetails={userdetails} editReviewId={editReviewId} />
          </motion.div>

          {/* SECTION 2: RECENTLY VIEWED */}
          {recentlyViewed.length > 0 && (
            <div className="pt-20 pb-10 border-t border-[var(--border)] mt-20">
               <div className="flex items-center gap-3 mb-10">
                 <div className="h-px bg-gray-200 flex-1"></div>
                 <h2 className="text-lg uppercase tracking-widest text-[var(--muted)] font-bold">Recently Viewed</h2>
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