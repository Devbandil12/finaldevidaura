import React, { useContext, useEffect, useState, useMemo, memo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";
import { Heart, Sparkles, Bell, Star, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { optimizeImage } from "../utils/imageOptimizer";

// --- METADATA ---
const categoryMetadata = {
  "Him": {
    title: "The Masculine Signature",
    description: "Bold intensity meets sophisticated depth.",
    tagline: "For Him"
  },
  "Her": {
    title: "Radiant Femininity",
    description: "A graceful symphony of florals and soft amber.",
    tagline: "For Her"
  },
  "Unisex": {
    title: "Universal Harmonies",
    description: "Boundless scents that defy definition.",
    tagline: "For All"
  }
};

const ITEMS_PER_PAGE = 8;

// --- ANIMATION VARIANTS (Memoized outside to prevent recreation) ---
const createHeaderVariants = (shouldReduce) => ({
  hidden: { opacity: shouldReduce ? 1 : 0, y: shouldReduce ? 0 : 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: shouldReduce ? 0.01 : 0.8, ease: "easeOut" } 
  }
});

const createSectionVariants = (shouldReduce) => ({
  hidden: { opacity: shouldReduce ? 1 : 0 },
  visible: {
    opacity: 1,
    transition: shouldReduce ? {} : { staggerChildren: 0.05, delayChildren: 0.1 }
  }
});

const createCardVariants = (shouldReduce) => ({
  hidden: { opacity: shouldReduce ? 1 : 0, scale: 1 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: shouldReduce ? 0.01 : 0.4, ease: "circOut" } 
  }
});

// --- OPTIMIZED IMAGE COMPONENT ---
const BlurImage = memo(({ src, alt, className, priority = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const optimizedSrc = useMemo(() => optimizeImage(src, 'card'), [src]);

  const handleLoad = useCallback(() => {
    // Use rAF to avoid state updates during render phase
    requestAnimationFrame(() => setIsLoaded(true));
  }, []);

  const handleError = useCallback(() => {
    requestAnimationFrame(() => {
      setIsLoaded(true);
      setHasError(true);
    });
  }, []);

  if (hasError) {
    return (
      <div className={`relative w-full h-full bg-[#f0eee6] flex items-center justify-center ${className}`}>
        <span className="text-6xl font-bold opacity-10">{alt?.[0] || '?'}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden w-full h-full bg-[#f0eee6] ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 animate-pulse" />
      )}
      <motion.img
        src={optimizedSrc}
        alt={alt}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
      />
    </div>
  );
});

BlurImage.displayName = "BlurImage";

// --- MEMOIZED PRODUCT CARD ---
const ProductCard = memo(({ 
  product, 
  displayVariant, 
  isOutOfStock, 
  inWishlist, 
  onProductClick, 
  onToggleWishlist, 
  isPriority,
  staggerClass,
  cardVariants 
}) => {
  const discountedPrice = Math.floor(displayVariant.oprice * (1 - displayVariant.discount / 100));
  const imageUrl = product.imageurl?.[0] || "/placeholder.png";
  const sizeLabel = displayVariant.size ? `${displayVariant.size}ml` : "Std";
  const avgRating = product.avgRating || 0;
  const soldCount = product.soldCount || 0;

  return (
    <motion.div
      variants={cardVariants}
      className={`group relative flex flex-col p-3 rounded-[2rem] cursor-pointer ${staggerClass} ${isOutOfStock ? "opacity-90" : ""}`}
      onClick={() => onProductClick(product)}
    >
      <div className="relative w-full aspect-square rounded-[1.5rem] overflow-hidden bg-white shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
        <BlurImage 
          src={imageUrl} 
          alt={product.name} 
          priority={isPriority} 
          className={isOutOfStock ? "grayscale-[0.8] opacity-85" : ""}
        />

        {/* CARD ACTIONS */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          {!isOutOfStock ? (
            <div className="flex justify-between items-center">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-3 shadow-sm">
                <span className="text-xs font-bold text-stone-900">₹{discountedPrice}</span>
                <div className="w-[1px] h-3 bg-stone-300"></div>
                <span className="text-[10px] font-mono uppercase text-stone-500">{sizeLabel}</span>
              </div>
              <button 
                onClick={(e) => onToggleWishlist(e, product)} 
                className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={14} className={inWishlist ? "fill-red-500 text-red-500" : "text-stone-600"} />
              </button>
            </div>
          ) : (
            <button 
              className="w-full px-4 py-3 rounded-full flex items-center justify-center gap-2 shadow-lg bg-stone-900/90 backdrop-blur-md text-[#F2F0EB]"
              aria-label="Product sold out"
            >
              <Bell size={12} className="text-[#C5A059]" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Sold Out</span>
            </button>
          )}
        </div>

        {/* BADGES */}
        {!isOutOfStock && displayVariant.discount > 0 && (
          <div className="absolute top-0 left-0 bg-[#C5A059] text-white text-[12px] px-4 py-1.5 rounded-br-xl shadow-md z-20">
            {displayVariant.discount}%
          </div>
        )}
      </div>

      <div className="pt-5 px-2 text-center">
        <h3 className={`text-xl leading-tight mb-2 ${isOutOfStock ? "text-stone-400" : "text-stone-900"}`}>
          {product.name}
        </h3>
        <p className="text-[11px] text-stone-500 line-clamp-2 opacity-70 font-light mb-3">
          {product.description}
        </p>
        
        {/* STATS SECTION */}
        {(avgRating >= 1 || soldCount >= 1) && (
          <div className="flex items-center justify-center gap-4">
            {avgRating >= 1 && (
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-stone-500 uppercase tracking-wider">
                <Star size={11} className="text-[#C5A059] fill-[#C5A059]" />
                <span>{avgRating} Reviews</span>
              </div>
            )}
            {avgRating >= 1 && soldCount >= 1 && (
              <div className="w-[1px] h-2.5 bg-stone-200"></div>
            )}
            {soldCount >= 1 && (
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-stone-500 uppercase tracking-wider">
                <ShoppingBag size={11} className="text-stone-400" />
                <span>{soldCount} Sold</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}, (prev, next) => {
  return (
    prev.product.id === next.product.id &&
    prev.inWishlist === next.inWishlist &&
    prev.displayVariant?.stock === next.displayVariant?.stock
  );
});

ProductCard.displayName = "ProductCard";

const Products = () => {
  // 1. DIRECT CONTEXT USAGE (Removed local sessionStorage cache)
  const { products } = useContext(ProductContext);
  const { wishlist, toggleWishlist } = useContext(CartContext);
  
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const observerRef = useRef(null);
  const [visibleSections, setVisibleSections] = useState(new Set());
  
  // State to track pagination for each category: { "Him": 1, "Her": 2 }
  const [pageStates, setPageStates] = useState({});

  // 2. OPTIMIZED WISHLIST LOOKUP (O(1) Set)
  const wishlistSet = useMemo(() => {
    return new Set(wishlist?.map(item => item.variantId ?? item.variant?.id) || []);
  }, [wishlist]);

  const headerVariants = useMemo(() => createHeaderVariants(shouldReduceMotion), [shouldReduceMotion]);
  const sectionVariants = useMemo(() => createSectionVariants(shouldReduceMotion), [shouldReduceMotion]);
  const cardVariants = useMemo(() => createCardVariants(shouldReduceMotion), [shouldReduceMotion]);

  useEffect(() => { 
    window.scrollTo({ top: 0, behavior: 'instant' }); 
  }, []);

  const handleProductClick = useCallback((product) => {
    navigate(`/product/${product.id}`);
  }, [navigate]);

  const handleToggleWishlist = useCallback((e, product) => {
    e.stopPropagation();
    if (product.variants?.length) {
      const variant = product.variants.sort((a, b) => a.oprice - b.oprice)[0];
      toggleWishlist(product, variant);
    }
  }, [toggleWishlist]);

  const handlePageChange = useCallback((category, direction) => {
    setPageStates((prev) => {
      const currentPage = prev[category] || 1;
      const newPage = direction === "next" ? currentPage + 1 : Math.max(currentPage - 1, 1);
      return { ...prev, [category]: newPage };
    });
  }, []);

  const isProductInWishlist = useCallback((product) => {
    if (!product.variants) return false;
    // Check if ANY variant is in the wishlist set
    return product.variants.some(v => wishlistSet.has(v.id));
  }, [wishlistSet]);

  const getDisplayVariant = useCallback((product) => {
    if (!product.variants?.length) return null;
    return product.variants.sort((a, b) => a.oprice - b.oprice)[0];
  }, []);

  const groupedProducts = useMemo(() => {
    const groups = {};
    // Ensure Products exist before filtering
    const validProducts = (products || []).filter(p => p.category && p.category !== "Template");
    
    validProducts.forEach(product => {
      const catName = product.category.trim();
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(product);
    });

    const customOrder = ["Him", "Her", "Unisex"];
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const indexA = customOrder.indexOf(a);
      const indexB = customOrder.indexOf(b);
      const valA = indexA === -1 ? 999 : indexA;
      const valB = indexB === -1 ? 999 : indexB;
      return valA - valB;
    });

    return sortedKeys.reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {});
  }, [products]);

  useEffect(() => {
    if (shouldReduceMotion || !('IntersectionObserver' in window)) {
      const allSections = Object.keys(groupedProducts);
      setVisibleSections(new Set(allSections));
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const category = entry.target.dataset.category;
            setVisibleSections(prev => new Set([...prev, category]));
          }
        });
      },
      { rootMargin: '200px 0px' }
    );

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [groupedProducts, shouldReduceMotion]);

  const groupedEntries = useMemo(() => Object.entries(groupedProducts), [groupedProducts]);

  return (
    <section className="min-h-screen text-stone-800 px-4 md:px-12 pt-24 md:pt-32 ">
      
      {/* HEADER */}
      <div className="max-w-[1600px] mx-auto mb-20 md:mb-28 text-center">
        <motion.div initial="hidden" animate="visible" variants={headerVariants} className="flex flex-col items-center">
          <span className="mb-6 px-6 py-2 rounded-full border border-[#D4AF37]/30 bg-white text-xs font-bold tracking-[0.3em] uppercase text-[#D4AF37]">
            Olfactory Library
          </span>
          <h1 className="text-6xl md:text-8xl text-stone-900 tracking-tight leading-[0.9]">
            The <span className="italic font-light text-[#C5A059]">Collection</span>
          </h1>
        </motion.div>
      </div>

      {/* SECTIONS */}
      {groupedEntries.length > 0 ? (
        groupedEntries.map(([category, categoryProducts], groupIndex) => {
          const indexStr = String(groupIndex + 1).padStart(2, '0');
          const meta = categoryMetadata[category] || { 
            title: category, 
            description: "Explore our exclusive selection.", 
            tagline: "Collection" 
          };

          // Pagination Calculations
          const currentPage = pageStates[category] || 1;
          const totalItems = categoryProducts.length;
          const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          const paginatedProducts = categoryProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

          return (
            <motion.div 
              key={category}
              data-category={category}
              ref={(el) => {
                if (el && observerRef.current && !shouldReduceMotion) {
                  observerRef.current.observe(el);
                }
              }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "0px 0px -100px 0px", amount: 0.1 }}
              variants={sectionVariants}
              className="max-w-[1600px] mx-auto mb-32 md:mb-40 last:mb-0"
            >
              <div className="relative mb-12 pl-2 md:pl-6">
                <span className="absolute -top-10 -left-2 text-[6rem] md:text-[9rem] text-[#F2F0EB] leading-none select-none z-0">
                  {indexStr}
                </span>
                <div className="relative z-10 pt-6 pl-4">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[#C5A059] uppercase mb-1">
                    {meta.tagline}
                  </span>
                  <h2 className="text-4xl md:text-6xl text-stone-900 leading-none mb-3">
                    {meta.title}
                  </h2>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                    <p className="text-sm md:text-base text-stone-500 italic">
                      {meta.description}
                    </p>
                    <div className="hidden md:block w-8 h-[1px] bg-stone-300"></div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                      {totalItems} Selections
                    </span>
                  </div>
                </div>
              </div>

              {/* GRID */}
              {/* Added pb-12 to handle the translation offset */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 pb-12">
                {paginatedProducts.map((product, idx) => {
                  const displayVariant = getDisplayVariant(product);
                  if (!displayVariant) return null;
                  
                  const isOutOfStock = (displayVariant.stock || 0) <= 0;
                  const inWishlist = isProductInWishlist(product);
                  const staggerClass = (idx % 2 !== 0) ? "md:translate-y-12" : "";
                  const isPriority = groupIndex === 0 && idx < 4;

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      displayVariant={displayVariant}
                      isOutOfStock={isOutOfStock}
                      inWishlist={inWishlist}
                      onProductClick={handleProductClick}
                      onToggleWishlist={handleToggleWishlist}
                      isPriority={isPriority}
                      staggerClass={staggerClass}
                      cardVariants={cardVariants}
                    />
                  );
                })}
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 mt-12">
                  <button
                    onClick={() => handlePageChange(category, "prev")}
                    disabled={currentPage === 1}
                    className="p-3 rounded-full border border-stone-200 text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-100 transition-colors"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <span className="text-xs font-mono font-medium text-stone-400 tracking-[0.2em] uppercase">
                    Page {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(category, "next")}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-full border border-stone-200 text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-100 transition-colors"
                    aria-label="Next Page"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })
      ) : (
        <div className="h-[40vh] w-full flex flex-col items-center justify-center text-stone-400">
          <Sparkles className="mb-4 opacity-20" size={48} />
          <p className="text-sm tracking-widest uppercase">Collection Empty</p>
        </div>
      )}

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
};

export default Products;