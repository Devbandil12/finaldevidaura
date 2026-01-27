import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Archive, RotateCcw, Plus,
  Package, AlertTriangle, CheckCircle, XCircle, 
  Edit3, RefreshCw, ChevronDown, Layers
} from 'lucide-react';

const ProductsTab = ({
  products, archivedProducts, showArchived, loading,
  handleProductArchive, handleProductUnarchive, setEditingProduct, downloadCSV, setOpenModal, setShowArchived, refreshProductStock
}) => {

  // State to manage which categories are expanded
  const [openCategories, setOpenCategories] = useState({});

  // Group products by category
  const groupedProducts = useMemo(() => {
    if (!products) return {};
    
    return products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});
  }, [products]);

  // Initialize all categories to "open" when products load
  useEffect(() => {
    if (Object.keys(groupedProducts).length > 0) {
      const initialOpenState = {};
      Object.keys(groupedProducts).forEach(cat => {
        initialOpenState[cat] = true; 
      });
      setOpenCategories(prev => ({ ...initialOpenState, ...prev }));
    }
  }, [groupedProducts]);

  const toggleCategory = (category) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Helper: Get Stock Status Badge
  const getStockBadge = (variants) => {
    const totalStock = variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;

    if (totalStock === 0) {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100/50 uppercase tracking-wide shadow-sm"><XCircle size={10} /> Out of Stock</span>;
    }
    if (totalStock < 10) {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100/50 uppercase tracking-wide shadow-sm"><AlertTriangle size={10} /> Low Stock</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-100/50 uppercase tracking-wide shadow-sm"><CheckCircle size={10} /> In Stock</span>;
  };

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="space-y-10 p-6 sm:p-10 bg-[#FAFAFA] min-h-screen text-gray-900 font-sans">

      {/* --- HEADER --- */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-gray-100"
      >
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center">
            <Package className="w-8 h-8 mr-3 text-indigo-500" strokeWidth={1.5} /> Products
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-medium">Manage your store's inventory and catalog.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={refreshProductStock}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center px-5 py-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 hover:shadow-md hover:shadow-indigo-100/50 transition-all text-sm font-semibold shadow-sm disabled:opacity-50 disabled:shadow-none"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Stock'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => downloadCSV(products, 'products.csv')}
            className="flex-1 sm:flex-none flex items-center justify-center px-5 py-2.5 bg-white text-gray-600 border border-gray-100 rounded-xl hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:shadow-gray-100 transition-all text-sm font-semibold shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpenModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white border border-gray-900 rounded-xl hover:bg-gray-800 transition-all text-sm font-semibold shadow-lg shadow-gray-200"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </motion.button>
        </div>
      </motion.div>

      {/* --- CATEGORIZED PRODUCTS GRID --- */}
      {products?.length > 0 ? (
        <motion.div 
          className="space-y-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          
          {Object.entries(groupedProducts).sort().map(([category, items]) => (
            <motion.div key={category} layout className="group/category">
              
              {/* Category Header / Dropdown Toggle */}
              <motion.button 
                layout
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-indigo-100 transition-all duration-300 mb-6 group relative z-10"
              >
                <div className="flex items-center gap-4">
                  <span className="p-2.5 bg-indigo-50/50 text-indigo-500 rounded-xl group-hover:bg-indigo-100 transition-colors duration-300">
                    <Layers size={20} strokeWidth={1.5} />
                  </span>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{category}</h3>
                    <p className="text-xs font-medium text-gray-400 mt-0.5">{items.length} product{items.length !== 1 && 's'}</p>
                  </div>
                </div>
                <motion.div 
                  animate={{ rotate: openCategories[category] ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="text-gray-300 group-hover:text-indigo-500"
                >
                  <ChevronDown size={24} strokeWidth={1.5} />
                </motion.div>
              </motion.button>

              {/* Grid Content with AnimatePresence for smooth unmounting */}
              <AnimatePresence>
                {openCategories[category] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <motion.div 
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-4"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {items.map((product) => (
                        <motion.div 
                          layout
                          variants={itemVariants}
                          key={product.id} 
                          whileHover={{ y: -8, scale: 1.01, transition: { duration: 0.2 } }}
                          className="bg-white rounded-3xl border border-gray-100/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-4px_rgba(0,0,0,0.06)] hover:border-indigo-100/50 transition-all duration-300 group flex flex-col overflow-hidden relative cursor-default"
                        >

                          {/* Image Area */}
                          <div className="aspect-square bg-gray-50 relative overflow-hidden p-4">
                            <div className="w-full h-full rounded-2xl overflow-hidden relative">
                                <img
                                  src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                />
                            </div>
                            
                            {/* Action Buttons Overlay */}
                            <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out z-10">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); setEditingProduct(product); }}
                                className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg text-gray-500 hover:text-indigo-600"
                                title="Edit"
                              >
                                <Edit3 size={18} strokeWidth={2} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); handleProductArchive(product.id); }}
                                className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg text-gray-500 hover:text-red-500"
                                title="Archive"
                              >
                                <Archive size={18} strokeWidth={2} />
                              </motion.button>
                            </div>
                            
                            <div className="absolute bottom-6 left-6 z-10">
                              {getStockBadge(product.variants)}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="p-6 flex flex-col flex-1">
                            <div className="flex justify-between items-start mb-3">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-100 uppercase tracking-widest">
                                {product.category || 'Uncategorized'}
                              </span>
                            </div>

                            <h3 className="font-bold text-gray-800 text-lg mb-1 truncate leading-tight group-hover:text-indigo-600 transition-colors" title={product.name}>
                              {product.name}
                            </h3>

                            {/* Variant Summary */}
                            <div className="mt-auto pt-5 border-t border-dashed border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Variants</p>
                              <div className="flex flex-wrap gap-2">
                                {product.variants?.slice(0, 3).map(v => (
                                  <span key={v.id} className="px-2.5 py-1.5 bg-gray-50/80 rounded-lg text-[11px] font-medium text-gray-600 border border-gray-100">
                                    {v.name} <span className="text-gray-400">|</span> ₹{v.oprice}
                                  </span>
                                ))}
                                {(product.variants?.length || 0) > 3 && (
                                  <span className="px-2.5 py-1.5 bg-indigo-50/50 rounded-lg text-[10px] font-bold text-indigo-500 border border-indigo-100/50">
                                    +{product.variants.length - 3}
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
          ))}

        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm"
        >
          <div className="p-6 bg-gray-50 rounded-full mb-4 shadow-inner"><Package className="w-10 h-10 text-gray-300" /></div>
          <p className="text-gray-500 font-medium text-lg">No active products found.</p>
          <button onClick={() => setOpenModal(true)} className="mt-6 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-all">
            Add your first product
          </button>
        </motion.div>
      )}

      {/* --- ARCHIVED SECTION --- */}
      {archivedProducts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-16 pt-10 border-t border-gray-200"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Archive className="text-gray-300" size={24} /> Archived Products
              <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full font-bold">{archivedProducts.length}</span>
            </h3>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="px-4 py-2 rounded-lg text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
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
                className="bg-white rounded-3xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-gray-100"
              >
                {loading ? (
                  <div className="p-10 text-center text-gray-400 text-sm font-medium animate-pulse">Loading archived items...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase font-bold text-gray-400 tracking-wider">
                        <tr>
                          <th className="px-8 py-5">Product</th>
                          <th className="px-8 py-5">Category</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {archivedProducts.map((product) => (
                          <motion.tr 
                            key={product.id} 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-gray-50/80 transition-colors duration-200 group"
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-5 opacity-50 group-hover:opacity-100 transition-all duration-300">
                                <img
                                  src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl}
                                  alt={product.name}
                                  className="w-12 h-12 rounded-xl object-cover bg-gray-100 shadow-sm grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                                <span className="font-bold text-gray-900 line-through decoration-gray-300 decoration-2 group-hover:no-underline">{product.name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-gray-400 font-medium opacity-60">{product.category || 'N/A'}</td>
                            <td className="px-8 py-5 text-right">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleProductUnarchive(product.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-green-700 bg-green-50/50 border border-green-100 rounded-xl hover:bg-green-100 shadow-sm"
                              >
                                <RotateCcw size={14} /> Unarchive
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default ProductsTab;