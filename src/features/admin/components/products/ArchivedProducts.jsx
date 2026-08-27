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
      className="mt-12 pt-8 border-t border-[var(--border)]/30 font-body"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl sm:text-2xl font-medium text-[var(--text)] tracking-tight flex items-center gap-3.5">
          <Archive className="text-[var(--muted)]" size={24} strokeWidth={1.5} /> Archived Catalog
          <span className="font-body bg-[var(--surface-muted)] border border-[var(--border)]/40 text-[var(--sub)] text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-widest shadow-sm">
            {archivedProducts.length} Items
          </span>
        </h3>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest text-[var(--text)] bg-[var(--surface)] border border-[var(--border)]/50 hover:bg-[var(--surface-muted)] transition-colors shadow-sm"
        >
          {showArchived ? "Hide Archive" : "View Archive"}
        </button>
      </div>

      <AnimatePresence>
        {showArchived && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[var(--surface)] rounded-[1.5rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[var(--border)]/30"
          >
            {loading ? (
              <div className="p-16 text-center text-[var(--muted)] font-body text-xs font-bold uppercase tracking-widest animate-pulse">Retrieving archives...</div>
            ) : (
              <div className="overflow-x-auto smooth-scrollbar">
                <table className="w-full text-left min-w-[600px] border-collapse whitespace-nowrap">
                  <thead className="bg-[var(--surface-muted)]/50 border-b border-[var(--border)]/30 text-[10px] uppercase font-bold text-[var(--muted)] tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Asset</th>
                      <th className="px-6 py-4">Classification</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/20">
                    {archivedProducts.map((product) => (
                      <motion.tr 
                        key={product.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-[var(--surface-muted)]/30 transition-colors duration-300 group cursor-default"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4 opacity-70 group-hover:opacity-100 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[var(--border)]/40 bg-[var(--surface-muted)] shrink-0">
                              <img
                                src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl}
                                alt={product.name}
                                className="w-full h-full object-cover mix-blend-multiply grayscale group-hover:grayscale-0 transition-all duration-500"
                              />
                            </div>
                            <span className="font-bold text-sm text-[var(--text)] tracking-tight line-through decoration-[var(--border)] group-hover:no-underline group-hover:text-[var(--brand)] transition-colors">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[var(--sub)] text-[11px] font-bold uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">{product.category || 'N/A'}</td>
                        <td className="px-6 py-4 text-right">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleProductUnarchive(product.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--success)] bg-[var(--surface)] border border-[var(--border)]/50 rounded-lg hover:border-[var(--success)]/40 hover:bg-[var(--success)]/10 transition-colors shadow-sm"
                          >
                            <RotateCcw size={14} strokeWidth={2.5} /> Restore
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                    {archivedProducts.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center text-[var(--sub)] font-body text-[11px] font-bold uppercase tracking-widest">
                          No archived records found.
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