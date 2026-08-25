import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, RotateCcw } from 'lucide-react';

const ArchivedProducts = ({
  archivedProducts,
  showArchived,
  setShowArchived,
  loading,
  handleProductUnarchive
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-16 pt-10 border-t border-[var(--border)] font-body"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-display text-3xl font-medium text-[var(--text)] tracking-tight flex items-center gap-4">
          <Archive className="text-[var(--muted)]" size={32} strokeWidth={1.5} /> Archived Products
          <span className="font-body bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-[11px] px-3.5 py-1 rounded-md font-bold shadow-[var(--shadow)]">{archivedProducts.length}</span>
        </h3>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="px-6 py-3 rounded-xl text-sm font-bold text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-muted)] hover:border-[var(--border)] hover:text-[var(--brand)] transition-colors shadow-[var(--shadow)]"
        >
          {showArchived ? "Hide Archived" : "Show Archived"}
        </button>
      </div>

      <AnimatePresence>
        {showArchived && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[var(--surface)] rounded-3xl overflow-hidden shadow-[var(--shadow)] border border-[var(--border)]"
          >
            {loading ? (
              <div className="p-16 text-center text-[var(--muted)] font-display italic text-xl animate-pulse tracking-wide">Loading archived items...</div>
            ) : (
              <div className="overflow-x-auto smooth-scrollbar">
                <table className="w-full text-left min-w-[700px] border-collapse">
                  <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--muted)] tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Product</th>
                      <th className="px-8 py-5">Category</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {archivedProducts.map((product) => (
                      <motion.tr 
                        key={product.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-[var(--surface)] transition-colors duration-300 group cursor-default"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-5 opacity-60 group-hover:opacity-100 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] shrink-0 group-hover:border-[var(--border)] transition-colors">
                              <img
                                src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl}
                                alt={product.name}
                                className="w-full h-full object-cover blend-luxury grayscale group-hover:grayscale-0 transition-all duration-500"
                              />
                            </div>
                            <span className="font-bold text-base text-[var(--text)] tracking-wide line-through decoration-[var(--muted)] decoration-1 group-hover:no-underline group-hover:text-[var(--brand)] transition-colors">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-[var(--sub)] font-bold opacity-70 group-hover:opacity-100 transition-opacity tracking-wide">{product.category || 'N/A'}</td>
                        <td className="px-8 py-5 text-right">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleProductUnarchive(product.id)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[var(--success)] bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--success)] hover:bg-[var(--surface)] transition-colors shadow-[var(--shadow)]"
                          >
                            <RotateCcw size={14} strokeWidth={2} /> Unarchive
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                    {archivedProducts.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-8 py-16 text-center text-[var(--sub)] font-display italic text-xl tracking-wide">
                          No archived products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ArchivedProducts;