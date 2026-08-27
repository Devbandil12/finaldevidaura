import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Edit3, Archive, Package, Layers } from 'lucide-react';

// --- Sub-component for individual cards to handle isolated hover & slideshow states ---
const ProductCard = ({ product, itemVariants, setEditingProduct, handleProductArchive, getStockBadge }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  // Safely extract images into an array
  const images = Array.isArray(product.imageurl) 
    ? product.imageurl 
    : (product.imageurl ? [product.imageurl] : ["/fallback.png"]);

  // Automatic slideshow logic on hover
  useEffect(() => {
    let interval;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % images.length);
      }, 1500); // Transitions every 1.5 seconds while hovered
    } else {
      setCurrentImage(0); // Reset to primary image when mouse leaves
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  return (
    <motion.div 
      variants={itemVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col bg-[var(--surface)] rounded-[1rem] sm:rounded-[1.25rem] border border-[var(--border)]/30 dark:border-[var(--border)]/60 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 overflow-hidden cursor-pointer"
      onClick={() => setEditingProduct(product)}
    >
      {/* 
        Premium Aspect Ratio (5/4) — Reduces height by ~30% 
        bg-transparent with subtle tint frames the 'contain' image perfectly 
      */}
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-[var(--surface-muted)]/20 p-2">
        
        {/* Seamless Crossfading Image Carousel using Object-Contain */}
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-contain p-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              idx === currentImage ? 'opacity-100 group-hover:scale-105' : 'opacity-0 scale-95'
            }`}
            loading="lazy"
          />
        ))}
        
        {/* Theme-Aware Shadow Gradient for Overlay Visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
        
        {/* Floating Action Buttons */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-2 translate-x-8 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingProduct(product); }}
            className="p-1.5 sm:p-2 bg-[var(--surface)]/90 backdrop-blur-md rounded-lg text-[var(--text)] hover:text-[var(--brand)] shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors border border-[var(--border)]/30 dark:border-[var(--border)]/50"
            title="Edit"
          >
            <Edit3 size={14} strokeWidth={2} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleProductArchive(product.id); }}
            className="p-1.5 sm:p-2 bg-[var(--surface)]/90 backdrop-blur-md rounded-lg text-[var(--muted)] hover:text-[var(--error)] shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors border border-[var(--border)]/30 dark:border-[var(--border)]/50"
            title="Archive"
          >
            <Archive size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Stock Badge Overlay */}
        <div className="absolute bottom-2.5 left-2.5 z-20 bg-[var(--surface)]/90 backdrop-blur-md px-2 py-1 rounded-md shadow-sm border border-[var(--border)]/30 dark:border-[var(--border)]/50">
          {getStockBadge(product.variants)}
        </div>

        {/* Carousel Indicators (Visible on Hover if Multiple Images Exist) */}
        {images.length > 1 && (
          <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            {images.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1 rounded-full transition-all duration-500 ${idx === currentImage ? 'w-3 bg-[var(--brand)] shadow-[0_0_8px_var(--brand)]' : 'w-1.5 bg-[var(--border)]'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Details Area */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 bg-[var(--surface)] z-10 border-t border-[var(--border)]/20 dark:border-[var(--border)]/40">
        <h3 className="font-display font-medium text-[var(--text)] text-sm sm:text-base truncate leading-tight group-hover:text-[var(--brand)] transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between mt-1.5 sm:mt-2">
          <span className="font-body text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">
            {product.variants?.length || 0} Vars
          </span>
          {product.variants?.[0] && (
            <span className="font-body font-bold text-xs sm:text-sm text-[var(--text)] tracking-tight">
              ₹{product.variants[0].oprice}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN GRID COMPONENT ---
const ProductGrid = ({
  products,
  groupedProducts,
  openCategories,
  toggleCategory,
  setEditingProduct,
  handleProductArchive,
  setOpenModal,
  containerVariants,
  itemVariants
}) => {
  // Helper for elegant, scaled-down stock badging
  const getStockBadge = (variants) => {
    if (!variants || variants.length === 0) {
      return <span className="text-[var(--muted)] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest">No Vars</span>;
    }
    const totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    if (totalStock === 0) {
      return <span className="text-[var(--error)] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[var(--error)] shadow-[0_0_6px_var(--error)]"></span>Out</span>;
    }
    if (totalStock < 10) {
      return <span className="text-[var(--warning)] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[var(--warning)] shadow-[0_0_6px_var(--warning)]"></span>Low ({totalStock})</span>;
    }
    return <span className="text-[var(--success)] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[var(--success)] shadow-[0_0_6px_var(--success)]"></span>Stock ({totalStock})</span>;
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 sm:space-y-8 font-body">
      {Object.keys(groupedProducts).length > 0 ? (
        Object.keys(groupedProducts).map((category) => (
          <motion.div 
            key={category}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--surface)] rounded-[1.5rem] sm:rounded-[2rem] border border-[var(--border)]/30 dark:border-[var(--border)]/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-500"
          >
            {/* Elegant Category Header */}
            <div 
              className="px-6 py-5 sm:px-8 sm:py-6 flex justify-between items-center cursor-pointer hover:bg-[var(--surface-muted)]/30 transition-colors group"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 ${openCategories[category] ? 'bg-[var(--text)] text-[var(--surface)] shadow-md' : 'bg-[var(--surface-muted)] border border-[var(--border)]/40 dark:border-[var(--border)]/60 text-[var(--muted)] group-hover:text-[var(--brand)] group-hover:border-[var(--brand)]/30'}`}>
                  <Layers size={18} className="sm:w-5 sm:h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-display font-medium text-[var(--text)] tracking-tight leading-none">{category}</h3>
                  <p className="text-[9px] sm:text-[11px] font-body font-bold uppercase tracking-widest text-[var(--sub)] mt-1.5 sm:mt-2 leading-none">{groupedProducts[category].length} Pieces</p>
                </div>
              </div>
              <motion.div animate={{ rotate: openCategories[category] ? 180 : 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <ChevronDown className="text-[var(--muted)] w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
              </motion.div>
            </div>

            <AnimatePresence>
              {openCategories[category] && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: "auto", opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="border-t border-[var(--border)]/20 dark:border-[var(--border)]/40 bg-[var(--bg)]"
                >
                  {/* High-Density Grid for the Sub-component Cards */}
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 sm:p-6 lg:p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5">
                    {groupedProducts[category].map((product) => (
                      <ProductCard 
                        key={product.id}
                        product={product}
                        itemVariants={itemVariants}
                        setEditingProduct={setEditingProduct}
                        handleProductArchive={handleProductArchive}
                        getStockBadge={getStockBadge}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 sm:py-32 bg-[var(--surface)] rounded-[2rem] border border-[var(--border)]/30 dark:border-[var(--border)]/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
        >
          <div className="p-3 sm:p-4 bg-[var(--surface-muted)] rounded-2xl mb-3 sm:mb-4 shadow-sm border border-[var(--border)]/40 dark:border-[var(--border)]/60 text-[var(--muted)]">
            <Package size={28} className="sm:w-8 sm:h-8" strokeWidth={1.5} />
          </div>
          <p className="text-[var(--text)] font-display font-medium text-lg sm:text-xl tracking-tight">Your catalog is empty.</p>
          <button onClick={() => setOpenModal(true)} className="mt-3 sm:mt-4 text-[10px] sm:text-xs font-body font-bold uppercase tracking-widest text-[var(--brand)] hover:text-[var(--accent)] transition-colors">
            Add your first item
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProductGrid;