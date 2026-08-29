import React, { useContext, useEffect, useState, useMemo, memo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useProducts } from "../features/catalog/hooks/useProducts";
import { ProductCardSkeleton } from "../Components/ui/ShimmerSkeleton";
import { useWishlist, useToggleWishlist } from "../features/cart/hooks/useWishlist";
import { useAddToCart } from "../features/cart/hooks/useCart";
import { Heart, Sparkles, Bell, Star, ShoppingBag, ChevronLeft, ChevronRight, ChevronDown, ArrowUpDown, Tag } from "lucide-react";
import { optimizeImage } from "../utils/imageOptimizer";

// --- METADATA ---
const categoryMetadata = {
  "Best Sellers": {
    title: "Fan Favorites",
    description: "Our most loved and frequently purchased fragrances.",
    tagline: "Trending Now"
  },
  "New Arrivals": {
    title: "Latest Creations",
    description: "Freshly crafted scents added to our collection.",
    tagline: "Just Dropped"
  },
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

const ITEMS_PER_PAGE = 12;
const TABS = ["All", "Best Sellers", "New Arrivals", "Him", "Her", "Unisex"];
const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
  { id: "rating", label: "Top Rated" }
];

// --- ANIMATION VARIANTS ---
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

  const handleLoad = useCallback(() => requestAnimationFrame(() => setIsLoaded(true)), []);
  const handleError = useCallback(() => requestAnimationFrame(() => { setIsLoaded(true); setHasError(true); }), []);

  if (hasError) {
    return (
      <div className={`relative w-full h-full bg-[var(--surface-muted)] flex items-center justify-center ${className}`}>
        <span className="text-6xl font-bold opacity-10">{alt?.[0] || '?'}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden w-full h-full bg-[var(--surface-muted)] ${className}`}>
      {!isLoaded && <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 animate-pulse" />}
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

// --- MEMOIZED SMART PRODUCT CARD ---
const ProductCard = memo(
  ({
    product,
    wishlistSet,
    onProductClick,
    onToggleWishlist,
    onAddToCart,
    isPriority,
    staggerClass,
    cardVariants,
  }) => {
    const sortedVariants = useMemo(() => {
      return [...(product.variants || [])].sort(
        (a, b) => a.oprice - b.oprice
      );
    }, [product.variants]);

    const [selectedVariantId, setSelectedVariantId] = useState(
      sortedVariants[0]?.id
    );

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const dropdownRef = useRef(null);

    useEffect(() => {
      if (
        !sortedVariants.find((v) => v.id === selectedVariantId)
      ) {
        setSelectedVariantId(sortedVariants[0]?.id);
      }
    }, [sortedVariants, selectedVariantId]);

    useEffect(() => {
      function handleClickOutside(event) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsDropdownOpen(false);
        }
      }

      if (isDropdownOpen) {
        document.addEventListener(
          "mousedown",
          handleClickOutside
        );
      }

      return () =>
        document.removeEventListener(
          "mousedown",
          handleClickOutside
        );
    }, [isDropdownOpen]);

    const selectedVariant = useMemo(() => {
      return (
        sortedVariants.find(
          (v) => v.id === selectedVariantId
        ) || sortedVariants[0]
      );
    }, [sortedVariants, selectedVariantId]);

    if (!selectedVariant) return null;

    const discountedPrice = Math.floor(
      selectedVariant.oprice *
      (1 - selectedVariant.discount / 100)
    );

    const imageUrl =
      product.imageurl?.[0] || "/placeholder.png";

    const isOutOfStock =
      (selectedVariant.stock || 0) <= 0;

    const inWishlist = wishlistSet.has(
      selectedVariant.id
    );

    const avgRating = product.avgRating || 0;

    const soldCount = product.soldCount || 0;

    return (
      <motion.div
        variants={cardVariants}
        whileHover={{
          y: -6,
        }}
        transition={{
          duration: 0.45,
          ease: "easeOut",
        }}
        className={`group relative flex flex-col p-2 md:p-3 rounded-[1.6rem] md:rounded-[2rem] cursor-pointer ${staggerClass}`}
        onClick={() => onProductClick(product)}
      >

        {/* AMBIENT GLOW */}
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-[#C5A059]/0 via-[#C5A059]/[0.03] to-[#C5A059]/[0.06] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

        {/* IMAGE */}
        <div className="relative w-full aspect-square rounded-[1.2rem] md:rounded-[1rem] overflow-hidden bg-white shadow-[0_10px_40px_rgba(0,0,0,0.05)] transition-all duration-700 group-hover:shadow-[0_35px_100px_rgba(0,0,0,0.12)]">

          {/* IMAGE */}
          <motion.div
            className="absolute inset-0"
            whileHover={{
              scale: 1.08,
            }}
            transition={{
              duration: 1.2,
              ease: [0.22, 1, 0.36, 1],
            }}
          >

            <BlurImage
              src={imageUrl}
              alt={product.name}
              priority={isPriority}
              className={`transition-transform duration-1000 ${isOutOfStock
                  ? "grayscale-[0.8] opacity-85"
                  : ""
                } group-hover:scale-[1.08]`}
            />

          </motion.div>

          {/* ATMOSPHERIC OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/[0.10] via-transparent to-white/[0.03] pointer-events-none"></div>

          {/* LIGHT SWEEP */}
          <motion.div
            initial={{
              opacity: 0,
              x: "-120%",
            }}
            whileHover={{
              opacity: 1,
              x: "120%",
            }}
            transition={{
              duration: 1.4,
              ease: "easeInOut",
            }}
            className="absolute inset-y-0 w-[40%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-18deg] pointer-events-none"
          />

          {/* BADGE */}
          {selectedVariant.discount > 0 && (
            <div className="absolute top-0 left-5 z-20 flex flex-col items-center">

              <div className="w-[1px] h-4 bg-stone-400/60"></div>

              <div className="bg-white/92 backdrop-blur-xl shadow-xl border border-stone-200/70 px-2 py-1 flex items-center gap-1 rounded-sm rotate-[3deg]">

                <div className="w-1 h-1 rounded-full bg-stone-200 border border-stone-300"></div>

                <Tag
                  size={9}
                  className="text-[#C5A059]"
                />

                <span className="font-bold text-[8px] uppercase tracking-[0.14em] text-stone-900">
                  {selectedVariant.discount}% OFF
                </span>

              </div>

            </div>
          )}

          {/* FLOATING ACTIONS */}
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between z-30">

            {/* PRICE */}
            <div className="relative bg-white/82 backdrop-blur-2xl before:absolute before:inset-0 before:rounded-full before:bg-white/20 before:pointer-events-none px-3 py-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-white/70 overflow-hidden">

              <div className="relative flex items-center gap-2">

                <span className="text-[13px] font-semibold text-stone-900">
                  ₹{discountedPrice}
                </span>

                <div className="w-[1px] h-3 bg-stone-300"></div>

                <span className="text-[9px] uppercase tracking-[0.18em] text-stone-500">
                  {selectedVariant.size}ml
                </span>

              </div>

            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-3 mt-6">

              {/* WISHLIST */}
              <motion.div
                className="relative flex items-center justify-end"
                initial="initial"
                whileHover="hover"
              >

                {/* SLIDING TEXT */}
                <motion.span
                  variants={{
                    initial: {
                      opacity: 0,
                      x: 10,
                    },
                    hover: {
                      opacity: 1,
                      x: 0,
                    },
                  }}
                  transition={{
                    duration: 0.25,
                  }}
                  className="absolute right-12 mr-2 bg-stone-900 text-white px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.18em] whitespace-nowrap shadow-lg"
                >
                  {inWishlist
                    ? "Saved"
                    : "Wishlist"}
                </motion.span>

                {/* BUTTON */}
                <motion.button
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                  transition={{
                    duration: 0.25,
                  }}
                  onClick={(e) =>
                    onToggleWishlist({ product, variant: selectedVariant })
                  }
                  className={`relative z-10 w-11 h-11 rounded-full border transition-all duration-300 flex items-center justify-center shadow-sm ${inWishlist
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-700 border-stone-300 hover:border-stone-900"
                    }`}
                >

                  <Heart
                    className={`w-4 h-4 transition-all duration-300 ${inWishlist
                        ? "fill-white text-white"
                        : ""
                      }`}
                  />

                </motion.button>

              </motion.div>

              {/* ADD TO CART */}
              {!isOutOfStock && (
                <motion.div
                  className="relative flex items-center justify-end"
                  initial="initial"
                  whileHover="hover"
                >

                  {/* SLIDING TEXT */}
                  <motion.span
                    variants={{
                      initial: {
                        opacity: 0,
                        x: 10,
                      },
                      hover: {
                        opacity: 1,
                        x: 0,
                      },
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                    className="absolute right-22  mr-2 bg-stone-900 text-white px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.18em] whitespace-nowrap shadow-lg"
                  >
                    Add To Cart
                  </motion.span>

                  {/* BUTTON */}
                  <motion.button
                    whileHover={{
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.92,
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                    onClick={(e) =>
                      onAddToCart(
                        e,
                        product,
                        selectedVariant
                      )
                    }
                    className="relative z-10 w-11 h-11 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-sm"
                  >

                    <ShoppingBag className="w-4 h-4" />

                  </motion.button>

                </motion.div>
              )}

            </div>

          </div>

          {/* SOLD OUT */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">

              <div className="px-5 py-3 rounded-full bg-stone-900/90 text-white text-[10px] font-bold tracking-[0.25em] uppercase flex items-center gap-2">

                <Bell className="w-3 h-3 text-[#C5A059]" />

                Sold Out

              </div>

            </div>
          )}

        </div>

        {/* CONTENT */}
        <div className="pt-6 px-4 flex flex-col">

          {/* TITLE + SIZE */}
          <div className="w-full flex items-start justify-between gap-4">

            {/* TITLE */}
            <h3 className="text-left text-[15px] md:text-[20px] leading-[1.15] font-[450] text-stone-900 flex-1">
              {product.name}
            </h3>

            {/* SIZE SELECTOR */}
            {sortedVariants.length > 1 && (
              <div
                className="relative shrink-0"
                ref={dropdownRef}
              >

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className="flex items-center gap-2 bg-stone-100/80 hover:bg-stone-200 border border-stone-200/70 rounded-full pl-3 pr-3 py-1.5 text-[10px] tracking-[0.18em] uppercase text-stone-600 transition-all duration-300"
                >

                  {selectedVariant.size}ml

                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-300 ${isDropdownOpen
                        ? "rotate-180"
                        : ""
                      }`}
                  />

                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 6,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: 6,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                      className="absolute right-0 top-full mt-2 w-32 bg-white/95 backdrop-blur-md border border-stone-100 shadow-2xl rounded-2xl py-2 z-50 overflow-hidden"
                    >

                      {sortedVariants.map((v) => (
                        <button
                          key={v.id}
                          onClick={(e) => {
                            e.stopPropagation();

                            setSelectedVariantId(v.id);

                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-[10px] tracking-[0.12em] uppercase transition-colors ${v.id === selectedVariantId
                              ? "text-[#C5A059] bg-stone-50"
                              : "text-stone-600 hover:bg-stone-50"
                            }`}
                        >

                          {v.size}ml

                        </button>
                      ))}

                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            )}

          </div>

          {/* DESCRIPTION */}
          <p className="text-[11.5px] text-stone-500 leading-[1.7] opacity-70 font-light mt-2 mb-5 line-clamp-2 text-left">
            {product.description}
          </p>

          {/* STATS */}
          {(avgRating >= 1 || soldCount >= 1) && (
            <div className="flex items-center gap-4 pt-1">

              {avgRating >= 1 && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-stone-500 tracking-wide">

                  <Star className="w-3 h-3 text-[#C5A059] fill-[#C5A059]" />

                  <span>{avgRating}</span>

                </div>
              )}

              {avgRating >= 1 &&
                soldCount >= 1 && (
                  <div className="w-[1px] h-3 bg-stone-200"></div>
                )}

              {soldCount >= 1 && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-stone-500 tracking-wide">

                  <ShoppingBag className="w-3 h-3 text-stone-400" />

                  <span>{soldCount} Sold</span>

                </div>
              )}

            </div>
          )}

        </div>

      </motion.div>
    );
  }
);


ProductCard.displayName = "ProductCard";

const Products = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: wishlist = [] } = useWishlist();
  const { mutateAsync: toggleWishlist } = useToggleWishlist();
  const { mutateAsync: addToCart } = useAddToCart();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const sortRef = useRef(null);

  const [activeCategory, setActiveCategory] = useState("All");
  const [pageStates, setPageStates] = useState({});
  const [sortBy, setSortBy] = useState("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) setIsSortOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortRef]);

  // Provide simple set of wishlist items for fast lookup in ProductCard
  const wishlistSet = useMemo(() => new Set(wishlist?.map(item => item.variantId ?? item.variant?.id) || []), [wishlist]);

  const headerVariants = useMemo(() => createHeaderVariants(shouldReduceMotion), [shouldReduceMotion]);
  const sectionVariants = useMemo(() => createSectionVariants(shouldReduceMotion), [shouldReduceMotion]);
  const cardVariants = useMemo(() => createCardVariants(shouldReduceMotion), [shouldReduceMotion]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  const handleProductClick = useCallback((product) => navigate(`/product/${product.id}`), [navigate]);

  const handleToggleWishlist = useCallback((e, product, selectedVariant) => {
    e.stopPropagation();
    if (selectedVariant) toggleWishlist({ product, variant: selectedVariant });
  }, [toggleWishlist]);

  const handleAddToCart = useCallback((e, product, selectedVariant) => {
    e.stopPropagation();
    if (selectedVariant) addToCart({ product, variant: selectedVariant, quantity: 1 });
  }, [addToCart]);

  const handlePageChange = useCallback((category, direction) => {
    setPageStates((prev) => {
      const currentPage = prev[category] || 1;
      const newPage = direction === "next" ? currentPage + 1 : Math.max(currentPage - 1, 1);
      window.scrollTo({ top: 400, behavior: 'smooth' });
      return { ...prev, [category]: newPage };
    });
  }, []);

  // DATA PROCESSING
  const groupedProducts = useMemo(() => {
    let validProducts = (products || []).filter(p => p.category && p.category !== "Template");
    if (inStockOnly) validProducts = validProducts.filter(p => p.variants?.some(v => v.stock > 0));

    const sortItems = (items) => [...items].sort((a, b) => {
      const getPrice = (prod) => prod.variants?.sort((x, y) => x.oprice - y.oprice)[0]?.oprice || 0;
      if (sortBy === "price_asc") return getPrice(a) - getPrice(b);
      if (sortBy === "price_desc") return getPrice(b) - getPrice(a);
      if (sortBy === "rating") return (b.avgRating || 0) - (a.avgRating || 0);
      return 0;
    });

    const groups = {};

    const bestSellers = [...validProducts].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 8);
    if (bestSellers.length > 0) groups["Best Sellers"] = bestSellers;

    const newArrivals = [...validProducts].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
      return dateB > dateA ? 1 : -1;
    }).slice(0, 8);
    if (newArrivals.length > 0) groups["New Arrivals"] = newArrivals;

    validProducts.forEach(product => {
      const catName = product.category.trim();
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(product);
    });

    const customOrder = ["Best Sellers", "New Arrivals", "Him", "Her", "Unisex"];
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      return (customOrder.indexOf(a) === -1 ? 999 : customOrder.indexOf(a)) - (customOrder.indexOf(b) === -1 ? 999 : customOrder.indexOf(b));
    });

    return sortedKeys.reduce((acc, key) => {
      acc[key] = sortItems(groups[key]);
      return acc;
    }, {});
  }, [products, sortBy, inStockOnly]);

  const filteredEntries = useMemo(() => {
    const entries = Object.entries(groupedProducts);
    if (activeCategory === "All") {
      return entries.filter(([key]) => key !== "New Arrivals");
    }
    return entries.filter(([key]) => key === activeCategory);
  }, [groupedProducts, activeCategory]);

  return (
    <section className="min-h-screen bg-[var(--bg)] text-stone-800 pb-20">

      {/* 1. TOP HEADER (Grand & Center) */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-12 pt-28 md:pt-20 pb-8 md:pb-16 text-center">
        <motion.div initial="hidden" animate="visible" variants={headerVariants} className="flex flex-col items-center">
          <span className="mb-4 md:mb-6 px-6 py-2 rounded-full border border-stone-200/50 bg-stone-50 text-[10px] font-bold tracking-[0.3em] uppercase text-stone-500">
            Olfactory Library
          </span>
          <h1 className="text-5xl md:text-8xl text-stone-900 font-serif tracking-tight leading-[0.9] mb-4 md:mb-6">
            The <span className="italic font-light text-[#C5A059]">Collection</span>
          </h1>
          <p className="text-stone-500 text-sm md:text-base font-light max-w-2xl mx-auto leading-relaxed">
            Discover a symphony of scents meticulously crafted to evoke emotion, memory, and profound beauty.
          </p>
        </motion.div>
      </div>

      {/* 2. MAIN LAYOUT (Left Sidebar + Right Grid) */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-12 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] gap-6 md:gap-12 relative">

        {/* ======================================= */}
        {/* EDITORIAL LUXURY SIDEBAR */}
        {/* ======================================= */}

        <aside className="hidden lg:block">

          <div className="sticky top-8 max-h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar pr-4 pt-[30px]">

            <div className="relative">

              {/* Vertical Luxury Line */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-[#C5A059]/40 via-stone-200 to-transparent"></div>

              <div className="pl-6">

                {/* ======================================= */}
                {/* SIDEBAR HEADING */}
                {/* ======================================= */}

                <div className="mb-10">

                  <div className="mb-4">

                    <span className="block text-[9px] font-bold tracking-[0.35em] uppercase text-[#C5A059] mb-3">
                      Devid Aura
                    </span>

                    <h3 className="text-[24px] leading-[1.05] text-stone-900">
                      Fragrance
                      <br />

                      <span className="italic font-light text-stone-500">
                        Library
                      </span>
                    </h3>

                  </div>

                  <div className="w-10 h-[1px] bg-[#C5A059]/50"></div>

                </div>

                {/* ======================================= */}
                {/* COLLECTIONS */}
                {/* ======================================= */}

                <div className="mb-12">

                  <div className="mb-6">
                    <span className="text-[9px] font-bold tracking-[0.32em] uppercase text-stone-400">
                      Collections
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">

                    {TABS.map((tab, index) => {

                      const active = activeCategory === tab;

                      return (
                        <button
                          key={tab}
                          onClick={() => {
                            setActiveCategory(tab);
                            setPageStates({});
                          }}
                          className="group w-full text-left"
                        >

                          <div className="flex items-center gap-3">

                            {/* Small Number */}
                            <span
                              className={`text-[9px] font-mono tracking-[0.2em] transition-colors duration-300 ${active
                                ? "text-[#C5A059]"
                                : "text-stone-300 group-hover:text-stone-500"
                                }`}
                            >
                              {String(index + 1).padStart(2, "0")}
                            </span>

                            {/* Tiny Line */}
                            <div
                              className={`h-[1px] transition-all duration-300 ${active
                                ? "w-6 bg-[#C5A059]"
                                : "w-3 bg-stone-300 group-hover:w-5 group-hover:bg-stone-500"
                                }`}
                            />

                            {/* Text */}
                            <span
                              className={`text-[15px] transition-colors duration-300 ${active
                                ? "text-stone-900"
                                : "text-stone-400 group-hover:text-stone-700"
                                }`}
                            >
                              {tab === "Him"
                                ? "For Him"
                                : tab === "Her"
                                  ? "For Her"
                                  : tab}
                            </span>

                          </div>

                        </button>
                      );
                    })}

                  </div>

                </div>

                {/* ======================================= */}
                {/* FILTERS */}
                {/* ======================================= */}

                <div className="mb-12">

                  <div className="mb-6">

                    <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-stone-400">
                      Refine Selection
                    </span>

                  </div>

                  <div className="space-y-7">

                    {/* STOCK FILTER */}

                    <button
                      onClick={() => setInStockOnly(!inStockOnly)}
                      className="group flex items-center gap-4"
                    >

                      <div className="relative">

                        <div
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${inStockOnly
                            ? "bg-[#C5A059] scale-110"
                            : "bg-stone-300 group-hover:bg-stone-500"
                            }`}
                        />

                        {inStockOnly && (
                          <div className="absolute inset-0 rounded-full bg-[#C5A059]/30 scale-[2.4] blur-sm"></div>
                        )}

                      </div>

                      <div className="flex flex-col text-left">

                        <span className="text-[13px] text-stone-800 tracking-wide">
                          Available Only
                        </span>

                        <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 mt-1">
                          In Stock
                        </span>

                      </div>

                    </button>

                    {/* SORT SECTION */}

                    <div>

                      <div className="mb-5">

                        <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold">
                          Sort By
                        </span>

                      </div>

                      <div className="flex flex-col gap-3">

                        {SORT_OPTIONS.map((opt) => {

                          const active = sortBy === opt.id;

                          return (
                            <button
                              key={opt.id}
                              onClick={() => setSortBy(opt.id)}
                              className="group text-left"
                            >

                              <div className="flex items-center gap-4">

                                {/* Decorative Dot */}
                                <div
                                  className={`transition-all duration-500 rounded-full ${active
                                    ? "w-2 h-2 bg-[#C5A059]"
                                    : "w-1.5 h-1.5 bg-stone-300 group-hover:bg-stone-500"
                                    }`}
                                />

                                {/* Label */}
                                <span
                                  className={`text-[13px] transition-all duration-300 ${active
                                    ? "text-[#C5A059] translate-x-1"
                                    : "text-stone-500 group-hover:text-stone-800 group-hover:translate-x-1"
                                    }`}
                                >
                                  {opt.label}
                                </span>

                              </div>

                            </button>
                          );
                        })}

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* ======================================= */}
            {/* SCROLL INDICATOR */}
            {/* ======================================= */}

            <div className="sticky bottom-0 left-0 pt-6 pb-2 bg-gradient-to-t from-[#f8f6f1] via-[#f8f6f1]/95 to-transparent flex justify-center pointer-events-none">

              <motion.div
                animate={{
                  y: [0, 6, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex flex-col items-center gap-2"
              >

                <span className="text-[8px] uppercase tracking-[0.3em] text-stone-400">
                  Scroll
                </span>

                <div className="flex flex-col items-center gap-[3px]">

                  <div className="w-[1px] h-3 bg-stone-300"></div>

                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></div>

                </div>

              </motion.div>

            </div>
          </div>

        </aside>
        {/* ======================================= */}
        {/* MOBILE TOP BAR */}
        {/* ======================================= */}
        <div className="lg:hidden sticky top-[70px] z-40 bg-[var(--bg)]/95 backdrop-blur-xl border-b border-stone-100 py-3 mb-4 overflow-x-auto no-scrollbar">

          <div className="flex items-center justify-between gap-4 min-w-max">

            {/* Tabs */}
            <div className="flex gap-6 shrink-0 pr-4">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveCategory(tab);
                    setPageStates({});
                  }}
                  className={`relative py-1 text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors duration-300 ${activeCategory === tab
                    ? "text-stone-900"
                    : "text-stone-400 hover:text-stone-700"
                    }`}
                >
                  {tab === "Him" ? "For Him" : tab === "Her" ? "For Her" : tab}

                  {activeCategory === tab && (
                    <motion.div
                      layoutId="activeTabMobile"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-stone-900"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center gap-4 pl-4 border-l border-stone-200 shrink-0">

              <button
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${inStockOnly ? "text-stone-900" : "text-stone-400"
                  }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${inStockOnly
                    ? "bg-stone-900 border-stone-900"
                    : "border-stone-300"
                    }`}
                >
                  {inStockOnly && (
                    <Sparkles size={10} className="text-white" />
                  )}
                </div>
              </button>

              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-700"
                >
                  <ArrowUpDown size={14} className="text-stone-400" />
                </button>

                <AnimatePresence>
                  {isSortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 top-full mt-4 w-48 bg-white border border-stone-100 shadow-xl rounded-xl py-2 z-50"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSortBy(opt.id);
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest ${sortBy === opt.id
                            ? "text-[#C5A059] bg-stone-50"
                            : "text-stone-500"
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>

        {/* ======================================= */}
        {/* RIGHT CONTENT AREA */}
        {/* ======================================= */}
        <main className="min-w-0">
          {filteredEntries.length > 0 ? (
            filteredEntries.map(([category, categoryProducts], groupIndex) => {
              const meta = categoryMetadata[category] || { title: category, description: "Explore our exclusive selection.", tagline: "Collection" };
              const currentPage = pageStates[category] || 1;
              const totalPages = Math.ceil(categoryProducts.length / ITEMS_PER_PAGE);
              const paginatedProducts = categoryProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

              return (
                <motion.div
                  key={category}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "0px 0px -100px 0px", amount: 0.1 }}
                  variants={sectionVariants}
                  className="max-w-[1600px] mx-auto mb-32 md:mb-40 last:mb-0"                >
                  {/* Category Inner Header */}
                  {/* Category Inner Header */}
                  <div className="relative mb-12 pl-2 md:pl-6">
                    <span className="absolute -top-10 -left-2 text-[6rem] md:text-[9rem] text-[var(--bg)] leading-none select-none z-0">
                      {String(groupIndex + 1).padStart(2, "0")}
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
                          {categoryProducts.length} Selections
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grid */}
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-5 md:gap-x-6 xl:gap-x-8 gap-y-10 md:gap-y-12 xl:gap-y-16">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="group relative flex flex-col p-2 md:p-3 rounded-[1.6rem] md:rounded-[2rem]">
                          <ProductCardSkeleton />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-5 md:gap-x-6 xl:gap-x-8 gap-y-10 md:gap-y-12 xl:gap-y-16">
                      {paginatedProducts.map((product, idx) => {
                        return (
                          <ProductCard
                            key={product.id}
                            product={product}
                            wishlistSet={wishlistSet}
                            onProductClick={handleProductClick}
                            onToggleWishlist={handleToggleWishlist}
                            onAddToCart={handleAddToCart}
                            isPriority={groupIndex === 0 && idx < 4}
                            staggerClass={idx % 2 !== 0 ? "md:translate-y-6" : ""}
                            cardVariants={cardVariants}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-6 mt-16 md:mt-24">
                      <button onClick={() => handlePageChange(category, "prev")} disabled={currentPage === 1} className="p-3 rounded-full border border-stone-200 text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors">
                        <ChevronLeft size={20} />
                      </button>
                      <span className="text-xs font-bold tracking-[0.2em] uppercase text-stone-400">
                        Page {currentPage} / {totalPages}
                      </span>
                      <button onClick={() => handlePageChange(category, "next")} disabled={currentPage === totalPages} className="p-3 rounded-full border border-stone-200 text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="h-[40vh] w-full flex flex-col items-center justify-center text-stone-400 bg-stone-50/50 rounded-3xl border border-stone-100">
              <Sparkles className="mb-4 opacity-30 text-[#C5A059]" size={40} />
              <p className="text-xs font-bold tracking-[0.2em] uppercase">No products match your criteria</p>
              <button onClick={() => { setInStockOnly(false); setSortBy('featured'); }} className="mt-6 text-[10px] uppercase font-bold text-stone-600 border-b border-stone-400 pb-1">Reset Filters</button>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
        .no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
      `}</style>
    </section>
  );
};

export default Products;