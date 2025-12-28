import React, { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";

import { Heart, Sparkles } from "lucide-react";
import PageTransition from "./PageTransition";

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } 
  }
};

// --- 🟢 NEW HELPER COMPONENT: BLUR IMAGE ---
const BlurImage = ({ src, alt, className }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <motion.img
      src={src}
      alt={alt}
      // Start hidden and blurred
      initial={{ opacity: 0, filter: "blur(15px)" }} 
      // Animate to visible and sharp once loaded
      animate={{ 
        opacity: isLoading ? 0 : 0.85, // 0.85 matches your original opacity-85 class
        filter: isLoading ? "blur(15px)" : "blur(0px)"
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onLoad={() => setIsLoading(false)}
      loading="lazy"
      decoding="async"
      // We pass the classes down so hover effects still work
      className={className} 
    />
  );
};

const Products = () => {
  const { products } = useContext(ProductContext);
  const { wishlist, toggleWishlist } = useContext(CartContext);
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // --- Helpers ---
  const handleProductClick = (product) => navigate(`/product/${product.id}`);

  const handleToggleWishlist = (e, product) => {
    e.stopPropagation();
    if (product.variants?.length) {
      const variant = product.variants.sort((a, b) => a.oprice - b.oprice)[0];
      toggleWishlist(product, variant);
    }
  };

  const isProductInWishlist = (product) => {
    if (!product.variants) return false;
    const variantIds = product.variants.map(v => v.id);
    return wishlist?.some(item => variantIds.includes(item.variantId ?? item.variant?.id));
  };

  const getDisplayVariant = (product) => {
    if (!product.variants?.length) return null;
    return product.variants.sort((a, b) => a.oprice - b.oprice)[0];
  };

  // 🟢 1. DYNAMIC CATEGORY GENERATION
  const categories = useMemo(() => {
      const uniqueCategories = new Set(
          products
            .filter(p => p.category && p.category !== "Template")
            .map(p => p.category.trim()) 
      );
      return ["All", ...Array.from(uniqueCategories).sort()];
  }, [products]);

  // 🟢 2. ROBUST FILTERING LOGIC
  const displayProducts = useMemo(() => {
      return products
        .filter(p => p.category !== "Template")
        .filter(p => {
            if (activeCategory === "All") return true;
            return p.category && p.category.toLowerCase() === activeCategory.toLowerCase();
        });
  }, [products, activeCategory]);


  return (
    <PageTransition>
      <section className="min-h-screen text-[#1a1a1a] py-12 px-6 md:px-12">
        
        {/* --- HEADER --- */}
        <div className="max-w-[1600px] mx-auto mb-20 text-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-xs font-bold tracking-widest uppercase mb-6">
                    <Sparkles size={12} className="text-yellow-600" />
                    Olfactory Library
                </span>
                <h1 className="text-5xl md:text-7xl  font-medium mb-8 text-[#1a1a1a]">
                    The Collection
                </h1>
            </motion.div>

            {/* TABS */}
            <motion.div 
                className="flex flex-wrap justify-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 
                        ${activeCategory === cat 
                            ? "bg-[#1a1a1a] text-white shadow-lg transform scale-105" 
                            : "bg-white text-gray-500 hover:bg-gray-100 border border-transparent hover:border-gray-200"}`}
                    >
                        {cat}
                    </button>
                ))}
            </motion.div>
        </div>

        {/* --- STAGGERED GRID (4 COLUMNS) --- */}
        {displayProducts.length > 0 ? (
            <motion.div
              key={activeCategory} 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16 max-w-[1600px] mx-auto"
            >
              <AnimatePresence>
                {displayProducts.map((product, index) => {
                  const displayVariant = getDisplayVariant(product);
                  if (!displayVariant) return null;

                  const inWishlist = isProductInWishlist(product);
                  const discountedPrice = Math.floor(displayVariant.oprice * (1 - displayVariant.discount / 100));
                  const imageUrl = product.imageurl?.[0] || "/placeholder.png";
                  
                  // 🟢 INFO LOGIC
                  const variantCount = product.variants?.length || 0;
                  const hasMoreVariants = variantCount > 1;
                  
                  // 🟢 UPDATED: Add "ml" to the size if it exists
                  const sizeLabel = displayVariant.size 
                      ? `${displayVariant.size} ml` 
                      : (displayVariant.name || "Standard");

                  const staggerClass = (index % 4 === 1 || index % 4 === 3) ? "lg:translate-y-12" : "";

                  return (
                    <motion.div
                      key={product.id}
                      layout
                      variants={cardVariants}
                      className={`group relative flex flex-col rounded-[2rem] overflow-hidden bg-[#121212] text-white shadow-xl hover:shadow-2xl hover:shadow-black/50 transition-all duration-300 ${staggerClass}`}
                      onClick={() => handleProductClick(product)}
                    >
                      {/* --- Image Area --- */}
                      <div className="relative w-full h-70 overflow-hidden bg-[#0a0a0a]">
                        
                        {/* 🟢 REPLACED <img /> WITH <BlurImage /> */}
                        <BlurImage
                          src={imageUrl}
                          alt={product.name}
                          // Note: removed opacity-85 from here because it is handled inside the component logic for smoother transition
                          className="w-full h-full object-cover group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                        />
                        
                        {/* Discount Badge */}
                        {displayVariant.discount > 0 && (
                          <span className="absolute top-4 left-4 bg-[#C5A059] text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">
                             {displayVariant.discount}% OFF
                          </span>
                        )}
                      </div>

                      {/* --- Content Area --- */}
                      <div className="p-5 relative flex-1 flex flex-col">
                        
                        {/* Wishlist Button */}
                        <button 
                          onClick={(e) => handleToggleWishlist(e, product)}
                          className="absolute -top-5 right-5 w-10 h-10 bg-[#1a1a1a] border-[4px] border-[#121212] rounded-full flex items-center justify-center shadow-lg group-hover:bg-[#C5A059] group-hover:text-black transition-colors z-10"
                        >
                          <Heart 
                              size={16} 
                              className={`transition-colors ${inWishlist ? "fill-current text-current" : "text-white group-hover:text-black"}`} 
                          />
                        </button>

                        {/* Header with Size Only (Category Removed) */}
                        <div className="mb-2">
                           <div className="flex items-center justify-start gap-2 mb-2">
                                {/* 🟢 SIZE INDICATOR */}
                                <span className="text-[10px] font-mono text-[#C5A059] border border-[#C5A059]/30 px-2 py-0.5 rounded uppercase tracking-wider">
                                    {sizeLabel}
                                </span>
                                
                                {/* 🟢 VARIANT INDICATOR */}
                                {hasMoreVariants && (
                                    <span className="text-[9px] text-gray-500 flex items-center gap-1">
                                        + {variantCount - 1} Sizes
                                    </span>
                                )}
                           </div>

                           <h3 className="text-lg font-medium leading-tight text-white group-hover:text-[#C5A059] transition-colors">
                               {product.name}
                           </h3>
                        </div>

                        {/* Description */}
                        <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-2 mb-4">
                           {product.description || "A signature fragrance featuring notes of rare woods and exotic spices."}
                        </p>

                        {/* Footer */}
                        <div className="mt-auto pt-3 border-t border-white/10 flex items-end justify-between">
                            <div className="flex flex-col leading-none">
                                <span className="text-[10px] text-gray-500 mb-0.5">
                                    Starting from
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-medium text-white">₹{discountedPrice}</span>
                                    {displayVariant.discount > 0 && (
                                        <span className="text-[10px] text-gray-500 line-through">₹{displayVariant.oprice}</span>
                                    )}
                                </div>
                            </div>
                            
                            {/* View Icon */}
                            <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#C5A059] group-hover:text-[#C5A059] transition-colors">
                               <Sparkles size={12} />
                            </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
        ) : (
            // EMPTY STATE
            <div className="h-[40vh] w-full flex flex-col items-center justify-center text-gray-400">
                <p className="text-sm tracking-widest uppercase">No products found in "{activeCategory}"</p>
                <button 
                    onClick={() => setActiveCategory("All")}
                    className="mt-4 text-xs border-b border-gray-400 text-gray-500 hover:text-black pb-1"
                >
                    View All Products
                </button>
            </div>
        )}

      </section>
    </PageTransition>
  );
};

export default Products;