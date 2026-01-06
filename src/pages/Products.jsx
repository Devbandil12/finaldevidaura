import React, { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";

import { Heart, Sparkles } from "lucide-react";
import PageTransition from "./PageTransition";

// --- 1. NEW ANIMATION VARIANTS (Optimized) ---

// Header: Simple fade down, very stable
const headerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

// Section: Controls the flow of children
const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      // Faster stagger on mobile to prevent empty spaces while scrolling
      staggerChildren: typeof window !== 'undefined' && window.innerWidth < 768 ? 0.05 : 0.1,
      delayChildren: 0.1 
    }
  }
};

// Card: THE NEW "BLOOM" ANIMATION
// Instead of moving up (y: 60), it scales gently and unblurs. 
// This prevents the "jumping" glitch completely.
const cardVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.96,        // Starts slightly smaller
    filter: "blur(4px)" // Starts slightly blurry
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: "circOut" } // Snappy, premium feel
  }
};

// --- BLUR IMAGE COMPONENT ---
const BlurImage = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden w-full h-full bg-[#f0eee6] ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        // Image loads with a separate gentle fade
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105 ${isLoaded ? 'blur-0' : 'blur-lg'}`}
      />
    </div>
  );
};

const Products = () => {
  const { products } = useContext(ProductContext);
  const { wishlist, toggleWishlist } = useContext(CartContext);
  const navigate = useNavigate();

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

  // 🟢 GROUPING LOGIC
  const groupedProducts = useMemo(() => {
    const groups = {};
    products.forEach(product => {
      if (!product.category || product.category === "Template") return;
      const catName = product.category.trim();
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(product);
    });
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {});
  }, [products]);

  return (
    <PageTransition>
      <section className="min-h-screen text-stone-800 px-4 md:px-12 pt-24 md:pt-32 pb-40">
        
        {/* --- HEADER --- */}
        <div className="max-w-[1600px] mx-auto mb-20 md:mb-32 text-center">
            <motion.div 
                initial="hidden"
                animate="visible"
                variants={headerVariants}
                className="flex flex-col items-center"
            >
                <div className="mb-4 md:mb-6">
                    <span className="px-4 py-1 md:px-5 md:py-1.5 rounded-full border border-stone-300 bg-white/40 text-[9px] md:text-[10px] font-bold tracking-[0.25em] uppercase text-stone-600">
                        Olfactory Library
                    </span>
                </div>
                
                <h1 className="text-5xl md:text-9xl  text-stone-900 tracking-tighter leading-[0.9]">
                    The <span className="italic font-light text-[#C5A059]">Collection</span>
                </h1>
            </motion.div>
        </div>

        {/* --- CATEGORY SECTIONS --- */}
        {Object.keys(groupedProducts).length > 0 ? (
           Object.entries(groupedProducts).map(([category, categoryProducts], index) => {
            const indexStr = String(index + 1).padStart(2, '0');

            return (
              <motion.div 
                key={category}
                initial="hidden"
                whileInView="visible"
                // Mobile Optimization: Trigger animation slightly earlier so users don't see blank space
                viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                variants={sectionVariants}
                className="max-w-[1600px] mx-auto mb-24 md:mb-40 last:mb-0"
              >
                {/* HEADINGS */}
                <div className="relative mb-12 md:mb-20 pl-2 md:pl-6">
                   <span className="absolute -top-8 -left-2 md:-top-12 md:-left-4 text-[5rem] md:text-[10rem]  text-[#EBE8E0] select-none z-0 leading-none pointer-events-none">
                      {indexStr}
                   </span>
                   <div className="relative z-10 pt-8 md:pt-12 pl-2 md:pl-4">
                      <h2 className="text-3xl md:text-5xl  text-stone-900 tracking-tight">
                        {category}
                      </h2>
                      <div className="flex items-center gap-3 mt-2 md:mt-3">
                          <div className="w-8 h-[1px] bg-[#C5A059]"></div>
                          <span className="text-[10px] md:text-xs font-mono text-stone-500 uppercase tracking-widest">
                             {categoryProducts.length} Selections
                          </span>
                      </div>
                   </div>
                </div>

                {/* GRID - Mobile Gap Optimized */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-20">
                  {categoryProducts.map((product, idx) => {
                    const displayVariant = getDisplayVariant(product);
                    if (!displayVariant) return null;

                    const inWishlist = isProductInWishlist(product);
                    const discountedPrice = Math.floor(displayVariant.oprice * (1 - displayVariant.discount / 100));
                    const imageUrl = product.imageurl?.[0] || "/placeholder.png";
                    const sizeLabel = displayVariant.size ? `${displayVariant.size}ml` : "Std";
                    
                    // Only apply the staggered "step down" look on Desktop (md+)
                    // On mobile, we want a clean vertical stack.
                    const staggerClass = (idx % 2 !== 0) ? "md:translate-y-16" : "";

                    return (
                      <motion.div
                        key={product.id}
                        variants={cardVariants}
                        // 'will-change-transform' helps mobile performance
                        className={`group relative flex flex-col p-2 md:p-3 rounded-[2rem] will-change-transform ${staggerClass}`}
                        onClick={() => handleProductClick(product)}
                      >
                        {/* --- Image Area --- */}
                        <div className="relative w-full aspect-square rounded-[1.5rem] overflow-hidden bg-white shadow-sm transition-shadow duration-300 group-hover:shadow-xl">
                          <BlurImage src={imageUrl} alt={product.name} />

                          {/* Glass Price Pill - Mobile Optimized Size */}
                          <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4 flex justify-between items-center z-20">
                              <div className="bg-white/80 backdrop-blur-md border border-white/50 px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-2 md:gap-3 shadow-lg">
                                  <span className="text-xs font-bold text-stone-900">₹{discountedPrice}</span>
                                  <div className="w-[1px] h-3 bg-stone-400/50"></div>
                                  <span className="text-[10px] font-mono uppercase text-stone-600">{sizeLabel}</span>
                              </div>

                              <button 
                                  onClick={(e) => handleToggleWishlist(e, product)}
                                  className="w-8 h-8 md:w-9 md:h-9 bg-white/80 backdrop-blur-md border border-white/50 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                              >
                                  <Heart size={14} className={inWishlist ? "fill-red-500 text-red-500" : "text-stone-600"} />
                              </button>
                          </div>

                          {/* Badge */}
                          {displayVariant.discount > 0 && (
                            <div className="absolute top-0 left-0 bg-[#C5A059] text-white text-[10px] font-bold px-3 py-1.5 rounded-br-xl shadow-md z-20">
                                -{displayVariant.discount}%
                            </div>
                          )}
                        </div>

                        {/* --- Text Area --- */}
                        <div className="pt-4 md:pt-6 px-2 text-center">
                          <h3 className="text-lg font-medium  md:text-xl  text-stone-900 leading-tight mb-1 md:mb-2">
                             {product.name}
                          </h3>
                          <p className="text-[10px] md:text-[11px] text-stone-500 line-clamp-2 leading-relaxed opacity-70">
                              {product.description || "A signature blend of rare notes."}
                          </p>
                        </div>

                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
           })
        ) : (
            <div className="h-[40vh] w-full flex flex-col items-center justify-center text-stone-400">
                <Sparkles className="mb-4 opacity-20" size={48} />
                <p className="text-sm tracking-widest uppercase">Collection Empty</p>
            </div>
        )}

      </section>
    </PageTransition>
  );
};

export default Products;