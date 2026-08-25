import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Edit3, Archive, Package } from 'lucide-react';

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
  // Helper to determine stock status with quiet luxury styling
  const getStockBadge = (variants) => {
    if (!variants || variants.length === 0) {
      return (
        <span className="bg-[var(--surface)] text-[var(--muted)] text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest border border-[var(--border)] shadow-[var(--shadow)]">
          No Variants
        </span>
      );
    }
    const totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    if (totalStock === 0) {
      return (
        <span className="bg-[var(--surface)] text-[var(--error)] text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest border border-[var(--border)] shadow-[var(--shadow)]">
          Out of Stock
        </span>
      );
    }
    if (totalStock < 10) {
      return (
        <span className="bg-[var(--surface)] text-[var(--accent)] text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest border border-[var(--border)] shadow-[var(--shadow)]">
          Low Stock ({totalStock})
        </span>
      );
    }
    return (
      <span className="bg-[var(--surface)] text-[var(--success)] text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest border border-[var(--border)] shadow-[var(--shadow)]">
        In Stock ({totalStock})
      </span>
    );
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 font-body">
      {Object.keys(groupedProducts).length > 0 ? (
        Object.keys(groupedProducts).map((category) => (
          <motion.div 
            key={category}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-[var(--shadow)] overflow-hidden transition-all duration-300"
          >
            <div 
              className="px-6 py-6 sm:px-8 sm:py-7 flex justify-between items-center cursor-pointer hover:bg-[var(--surface)] transition-colors group"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl transition-all shadow-[var(--shadow)] ${openCategories[category] ? 'bg-[var(--brand)] text-[var(--surface)]' : 'bg-[var(--surface-muted)] text-[var(--muted)] group-hover:text-[var(--text)]'}`}>
                  <Package size={22} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-medium text-[var(--text)] tracking-tight">{category}</h3>
                  <p className="text-xs font-body font-bold uppercase tracking-wider text-[var(--sub)] mt-1">{groupedProducts[category].length} Products</p>
                </div>
              </div>
              <motion.div animate={{ rotate: openCategories[category] ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <ChevronDown className="text-[var(--muted)]" size={20} />
              </motion.div>
            </div>

            <AnimatePresence>
              {openCategories[category] && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: "auto", opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[var(--border)] bg-[var(--bg)]"
                >
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {groupedProducts[category].map((product) => (
                      <motion.div 
                        key={product.id} 
                        variants={itemVariants}
                        className="group bg-[var(--surface)] rounded-3xl border border-[var(--border)] hover:border-[var(--accent)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] transition-all duration-500 overflow-hidden flex flex-col cursor-pointer"
                        onClick={() => setEditingProduct(product)}
                      >
                        <div className="relative aspect-square overflow-hidden bg-[var(--surface)]">
                          <img
                            src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl}
                            alt={product.name}
                            className="w-full h-full object-cover blend-luxury group-hover:scale-105 transition-transform duration-700 ease-out"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          <div className="absolute top-4 right-4 flex flex-col gap-2.5 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={(e) => { e.stopPropagation(); setEditingProduct(product); }}
                              className="p-3 bg-[var(--surface)]/90 backdrop-blur-md rounded-2xl shadow-[var(--shadow-strong)] text-[var(--text)] hover:text-[var(--accent)] transition-colors border border-[var(--border)]"
                              title="Edit"
                            >
                              <Edit3 size={16} strokeWidth={2} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={(e) => { e.stopPropagation(); handleProductArchive(product.id); }}
                              className="p-3 bg-[var(--surface)]/90 backdrop-blur-md rounded-2xl shadow-[var(--shadow-strong)] text-[var(--muted)] hover:text-[var(--error)] transition-colors border border-[var(--border)]"
                              title="Archive"
                            >
                              <Archive size={16} strokeWidth={2} />
                            </motion.button>
                          </div>
                          <div className="absolute bottom-5 left-5 z-10">
                            {getStockBadge(product.variants)}
                          </div>
                        </div>

                        <div className="p-6 flex flex-col flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[var(--surface)] text-[var(--sub)] border border-[var(--border)] uppercase tracking-widest shadow-[var(--shadow)]">
                              {product.category || 'Uncategorized'}
                            </span>
                          </div>
                          
                          <h3 className="font-display font-medium text-[var(--text)] text-xl mb-3 truncate leading-snug group-hover:text-[var(--accent)] transition-colors" title={product.name}>
                            {product.name}
                          </h3>

                          <div className="mt-auto pt-4 border-t border-dashed border-[var(--border)]">
                            <p className="font-body text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2.5">Variants</p>
                            <div className="flex flex-wrap gap-2">
                              {product.variants?.slice(0, 3).map(v => (
                                <span key={v.id} className="font-body px-3 py-1.5 bg-[var(--surface)] rounded-xl text-[11px] font-bold text-[var(--text)] border border-[var(--border)] shadow-[var(--shadow)]">
                                  {v.name} <span className="text-[var(--muted)] mx-1">|</span> ₹{v.oprice}
                                </span>
                              ))}
                              {(product.variants?.length || 0) > 3 && (
                                <span className="font-body px-3 py-1.5 bg-[var(--accent-soft)] rounded-xl text-[10px] font-bold text-[var(--accent)] border border-[var(--border)] shadow-[var(--shadow)]">
                                  +{(product.variants?.length || 0) - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
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
          className="flex flex-col items-center justify-center py-28 bg-[var(--surface)] rounded-3xl border border-dashed border-[var(--border)] shadow-[var(--shadow)]"
        >
          <div className="p-6 bg-[var(--surface)] rounded-full mb-4 shadow-[var(--shadow)] border border-[var(--border)]">
            <Package className="w-10 h-10 text-[var(--muted)]" strokeWidth={1.5} />
          </div>
          <p className="text-[var(--sub)] font-body font-bold text-base tracking-wide">No active products found.</p>
          <button onClick={() => setOpenModal(true)} className="mt-6 text-sm font-body font-bold text-[var(--brand)] hover:text-[var(--accent)] transition-colors underline underline-offset-4">
            Add your first product
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProductGrid;