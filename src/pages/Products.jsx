import React, { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";

import { Heart, Sparkles, Bell, Check } from "lucide-react"; // Added 'Check' icon
import PageTransition from "./PageTransition";

// --- CONTENT MAPPING ---
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

// --- ANIMATION VARIANTS ---
const headerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.96, filter: "blur(4px)" },
  visible: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.5, ease: "circOut" } }
};

// --- BLUR IMAGE COMPONENT ---
const BlurImage = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden w-full h-full bg-[#f0eee6] ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        className={`w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105 ${isLoaded ? 'blur-0' : 'blur-lg'}`}
      />
    </div>
  );
};

const Products = () => {
  const { products } = useContext(ProductContext);
  const { wishlist, toggleWishlist } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // --- Helpers ---
  const handleProductClick = (product) => navigate(`/product/${product.id}`);

  const handleToggleWishlist = (e, product) => {
    e.stopPropagation();
    if (product.variants?.length) {
      const variant = product.variants.sort((a, b) => a.oprice - b.oprice)[0];
      toggleWishlist(product, variant);
    }
  };

  // 🟢 FIXED: Use handleToggleWishlist directly
  // This ensures the item is added to your existing Wishlist state
  const handleJoinWaitlist = (e, product) => {
    handleToggleWishlist(e, product);
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

  // Grouping Logic
  const groupedProducts = useMemo(() => {
    const groups = {};
    products.forEach(product => {
      if (!product.category || product.category === "Template") return;
      const catName = product.category.trim();
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(product);
    });

    const customOrder = ["Him", "Her", "Unisex"];
    return Object.keys(groups)
      .sort((a, b) => {
        const indexA = customOrder.indexOf(a);
        const indexB = customOrder.indexOf(b);
        const valA = indexA === -1 ? 999 : indexA;
        const valB = indexB === -1 ? 999 : indexB;
        return valA - valB;
      })
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [products]);

  return (
    <PageTransition>
      <section className="min-h-screen text-stone-800 px-4 md:px-12 pt-24 md:pt-32 pb-40 ">
        
        {/* --- HEADER --- */}
        <div className="max-w-[1600px] mx-auto mb-20 md:mb-28 text-center">
            <motion.div initial="hidden" animate="visible" variants={headerVariants} className="flex flex-col items-center">
                <span className="mb-6 px-6 py-2 rounded-full border border-[#D4AF37]/30 bg-white text-xs font-bold tracking-[0.3em] uppercase text-[#D4AF37]">
                    Olfactory Library
                </span>
                <h1 className="text-6xl md:text-8xl text-stone-900 tracking-tight leading-[0.9] font-serif">
                    The <span className="italic font-light text-[#C5A059]">Collection</span>
                </h1>
            </motion.div>
        </div>

        {/* --- SECTIONS --- */}
        {Object.keys(groupedProducts).length > 0 ? (
           Object.entries(groupedProducts).map(([category, categoryProducts], index) => {
            const indexStr = String(index + 1).padStart(2, '0');
            const meta = categoryMetadata[category] || { 
                title: category, 
                description: "Explore our exclusive selection.", 
                tagline: "Collection" 
            };

            return (
              <motion.div 
                key={category}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                variants={sectionVariants}
                className="max-w-[1600px] mx-auto mb-32 md:mb-40 last:mb-0"
              >
                {/* --- HEADING --- */}
                <div className="relative mb-12 pl-2 md:pl-6">
                    <span className="absolute -top-10 -left-2 text-[6rem] md:text-[9rem] font-serif text-[#F2F0EB] leading-none select-none z-0">
                       {indexStr}
                    </span>
                    <div className="relative z-10 pt-6 pl-4">
                       <span className="block text-[10px] font-bold tracking-[0.2em] text-[#C5A059] uppercase mb-1">
                          {meta.tagline}
                       </span>
                       <h2 className="text-4xl md:text-6xl font-serif text-stone-900 leading-none mb-3">
                         {meta.title}
                       </h2>
                       <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                           <p className="text-sm md:text-base text-stone-500 italic font-serif">
                             {meta.description}
                           </p>
                           <div className="hidden md:block w-8 h-[1px] bg-stone-300"></div>
                           <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                              {categoryProducts.length} Selections
                           </span>
                       </div>
                    </div>
                </div>

                {/* --- GRID --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                  {categoryProducts.map((product, idx) => {
                    const displayVariant = getDisplayVariant(product);
                    if (!displayVariant) return null;
                    
                    const isOutOfStock = (displayVariant.stock || 0) <= 0;
                    const inWishlist = isProductInWishlist(product);
                    const discountedPrice = Math.floor(displayVariant.oprice * (1 - displayVariant.discount / 100));
                    const imageUrl = product.imageurl?.[0] || "/placeholder.png";
                    const sizeLabel = displayVariant.size ? `${displayVariant.size}ml` : "Std";
                    const staggerClass = (idx % 2 !== 0) ? "md:translate-y-12" : "";

                    return (
                      <motion.div
                        key={product.id}
                        variants={cardVariants}
                        className={`group relative flex flex-col p-3 rounded-[2rem] ${staggerClass} ${isOutOfStock ? "opacity-90" : ""}`}
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="relative w-full aspect-square rounded-[1.5rem] overflow-hidden bg-white shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
                          
                          <BlurImage 
                              src={imageUrl} 
                              alt={product.name} 
                              className={isOutOfStock ? "grayscale-[0.8] opacity-85" : ""}
                          />

                          {/* CONTROLS */}
                          <div className="absolute bottom-4 left-4 right-4 z-20">
                             {!isOutOfStock ? (
                                // --- IN STOCK ---
                                <div className="flex justify-between items-center">
                                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-3 shadow-sm">
                                        <span className="text-xs font-bold text-stone-900">₹{discountedPrice}</span>
                                        <div className="w-[1px] h-3 bg-stone-300"></div>
                                        <span className="text-[10px] font-mono uppercase text-stone-500">{sizeLabel}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => handleToggleWishlist(e, product)} 
                                        className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                                    >
                                        <Heart size={14} className={inWishlist ? "fill-red-500 text-red-500" : "text-stone-600"} />
                                    </button>
                                </div>
                             ) : (
                                // --- OUT OF STOCK: FUNCTIONAL BUTTON ---
                                <button 
                                    onClick={(e) => handleJoinWaitlist(e, product)}
                                    // Change color based on 'inWishlist' status
                                    className={`w-full px-4 py-3 rounded-full flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                                        inWishlist 
                                            ? "bg-[#C5A059] text-white" 
                                            : "bg-stone-900/90 backdrop-blur-md text-[#F2F0EB] hover:bg-black"
                                    }`}
                                >
                                    {inWishlist ? <Check size={12} /> : <Bell size={12} className={inWishlist ? "text-white" : "text-[#C5A059]"} />}
                                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                                        {inWishlist ? "Waitlist Joined" : "Join Waitlist"}
                                    </span>
                                </button>
                             )}
                          </div>

                          {/* BADGES */}
                          {isOutOfStock ? (
                             <div className="absolute top-0 left-0 bg-stone-200 text-stone-500 text-[10px] font-bold px-3 py-1.5 rounded-br-xl z-20 tracking-wider">
                                SOLD OUT
                             </div>
                          ) : (
                             displayVariant.discount > 0 && (
                                <div className="absolute top-0 left-0 bg-[#C5A059] text-white text-[10px] font-bold px-3 py-1.5 rounded-br-xl shadow-md z-20">
                                    -{displayVariant.discount}%
                                </div>
                             )
                          )}
                        </div>

                        {/* TEXT */}
                        <div className="pt-5 px-2 text-center">
                          <h3 className={`text-xl font-serif leading-tight mb-2 ${isOutOfStock ? "text-stone-400" : "text-stone-900"}`}>
                              {product.name}
                          </h3>
                          <p className="text-[11px] text-stone-500 line-clamp-2 opacity-70 font-light">
                              {product.description}
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