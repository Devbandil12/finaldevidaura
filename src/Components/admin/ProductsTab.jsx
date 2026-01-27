import React, { useState, useEffect, useMemo, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Archive, RotateCcw, Plus,
  Package, AlertTriangle, CheckCircle, XCircle, 
  Edit3, RefreshCw, ChevronDown, Layers,
  List, Grid, Save, X, ArrowDown, Tag, Check
} from 'lucide-react';
import { ProductContext } from '../../contexts/productContext'; 

const ProductsTab = ({
  products, archivedProducts, showArchived, loading,
  handleProductArchive, handleProductUnarchive, setEditingProduct, downloadCSV, setOpenModal, setShowArchived, refreshProductStock
}) => {
  // 🟢 Use ProductContext for bulk actions
  const { updateBulkVariants } = useContext(ProductContext);

  // --- STATE ---
  const [openCategories, setOpenCategories] = useState({});
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkChanges, setBulkChanges] = useState({}); // { variantId: { stock, oprice, discount } }
  
  // State for Size-Based Global Inputs
  const [sizeInputs, setSizeInputs] = useState({}); // { "50ml": { stock: '', oprice: '', discount: '' } }
  
  const [isSaving, setIsSaving] = useState(false);

  // Group products by category
  const groupedProducts = useMemo(() => {
    if (!products) return {};
    return products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});
  }, [products]);

  // Flatten products for Bulk Table
  const flatVariants = useMemo(() => {
    if (!products) return [];
    return products.flatMap(p => 
      (p.variants || []).map(v => ({
        ...v,
        productName: p.name,
        productImage: p.imageurl,
        category: p.category
      }))
    );
  }, [products]);

  // Get Unique Sizes for Headers
  const uniqueSizes = useMemo(() => {
    const sizes = new Set(flatVariants.map(v => v.size || 'N/A').filter(s => s));
    return Array.from(sizes).sort();
  }, [flatVariants]);

  // Initialize categories
  useEffect(() => {
    if (Object.keys(groupedProducts).length > 0) {
      const initialOpenState = {};
      Object.keys(groupedProducts).forEach(cat => initialOpenState[cat] = true);
      setOpenCategories(prev => ({ ...initialOpenState, ...prev }));
    }
  }, [groupedProducts]);

  // --- HANDLERS ---

  const toggleCategory = (category) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // 1. Handle Individual Input Change (Table Row)
  const handleVariantChange = (variantId, field, value) => {
    setBulkChanges(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value === '' ? '' : Number(value)
      }
    }));
  };

  // 2. Handle Size Input Change (Header Inputs)
  const handleSizeInputChange = (size, field, value) => {
    setSizeInputs(prev => ({
      ...prev,
      [size]: {
        ...prev[size],
        [field]: value
      }
    }));
  };

  // 3. Apply All Fields for Specific Size
  const applyToSize = (size) => {
    const inputs = sizeInputs[size];
    if (!inputs) return;

    // Check if at least one field has a value
    const hasValue = 
      (inputs.stock !== '' && inputs.stock !== undefined) || 
      (inputs.oprice !== '' && inputs.oprice !== undefined) || 
      (inputs.discount !== '' && inputs.discount !== undefined);

    if (!hasValue) return;

    const newChanges = { ...bulkChanges };
    
    // Find all variants matching this size
    let count = 0;
    flatVariants.forEach(v => {
      if ((v.size || 'N/A') === size) {
        if (!newChanges[v.id]) newChanges[v.id] = {};
        
        // Apply only fields that have values entered
        if (inputs.stock !== '' && inputs.stock !== undefined) newChanges[v.id].stock = Number(inputs.stock);
        if (inputs.oprice !== '' && inputs.oprice !== undefined) newChanges[v.id].oprice = Number(inputs.oprice);
        if (inputs.discount !== '' && inputs.discount !== undefined) newChanges[v.id].discount = Number(inputs.discount);
        
        count++;
      }
    });
    
    setBulkChanges(newChanges);
    window.toast.success(`Updated ${count} variants of size ${size}`);
  };

  // 4. Save Bulk Changes
  const saveBulkChanges = async () => {
    setIsSaving(true);
    const updates = Object.entries(bulkChanges).map(([id, fields]) => ({
      id,
      ...fields
    }));

    if (updates.length === 0) {
      setIsSaving(false);
      return;
    }

    const success = await updateBulkVariants(updates);
    if (success) {
      setBulkChanges({});
      setSizeInputs({});
      setIsBulkMode(false);
    }
    setIsSaving(false);
  };

  // Helper: Get Stock Status Badge
  const getStockBadge = (variants) => {
    const totalStock = variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
    if (totalStock === 0) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100/50 uppercase tracking-wide shadow-sm"><XCircle size={10} /> Out of Stock</span>;
    if (totalStock < 10) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100/50 uppercase tracking-wide shadow-sm"><AlertTriangle size={10} /> Low Stock</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-100/50 uppercase tracking-wide shadow-sm"><CheckCircle size={10} /> In Stock</span>;
  };

  // --- VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-10 p-6 sm:p-10 bg-[#FAFAFA] min-h-screen text-gray-900 font-sans">

      {/* --- HEADER --- */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-gray-100"
      >
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center">
            <Package className="w-8 h-8 mr-3 text-indigo-500" strokeWidth={1.5} /> Products
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-medium">Manage your store's inventory and catalog.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {/* Bulk Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsBulkMode(!isBulkMode)}
            className={`flex-1 sm:flex-none flex items-center justify-center px-5 py-2.5 border rounded-xl transition-all text-sm font-semibold shadow-sm
              ${isBulkMode 
                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' 
                : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
              }`}
          >
            {isBulkMode ? <List className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
            {isBulkMode ? 'Exit Bulk Edit' : 'Bulk Edit'}
          </motion.button>

          {!isBulkMode && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={refreshProductStock}
                disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center px-5 py-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 hover:shadow-md transition-all text-sm font-semibold shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpenModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white border border-gray-900 rounded-xl hover:bg-gray-800 transition-all text-sm font-semibold shadow-lg shadow-gray-200"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* --- BULK EDIT INTERFACE --- */}
      {isBulkMode ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          {/* 1. Size-Based Controls Bar */}
          <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200/50 overflow-hidden">
            <div className="mb-4 flex items-center gap-3 border-b border-indigo-700 pb-4">
              <div className="p-2 bg-indigo-800 rounded-lg"><Tag className="w-5 h-5 text-indigo-300" /></div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Bulk Updates by Size</h3>
                <p className="text-indigo-300 text-xs">Enter values below and click "Apply" to set them for all matching variants.</p>
              </div>
            </div>

            <div className="grid gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {uniqueSizes.map((size) => (
                <div key={size} className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700/50 flex flex-col md:flex-row items-center gap-4">
                  
                  {/* Size Label */}
                  <div className="w-full md:w-24 shrink-0 flex items-center justify-center md:justify-start">
                    <span className="px-3 py-1.5 bg-white/10 rounded-lg text-sm font-bold text-white border border-white/10 min-w-[80px] text-center">
                      {size}
                    </span>
                  </div>

                  {/* Inputs Container */}
                  <div className="flex-1 w-full grid grid-cols-3 gap-3">
                    <input 
                      type="number" 
                      placeholder="Stock" 
                      value={sizeInputs[size]?.stock || ''}
                      onChange={(e) => handleSizeInputChange(size, 'stock', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-indigo-900/80 border border-indigo-600 text-white text-sm placeholder-indigo-400 focus:outline-none focus:border-indigo-400 focus:bg-indigo-900 transition-all"
                    />
                    <input 
                      type="number" 
                      placeholder="Price (₹)" 
                      value={sizeInputs[size]?.oprice || ''}
                      onChange={(e) => handleSizeInputChange(size, 'oprice', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-indigo-900/80 border border-indigo-600 text-white text-sm placeholder-indigo-400 focus:outline-none focus:border-indigo-400 focus:bg-indigo-900 transition-all"
                    />
                    <input 
                      type="number" 
                      placeholder="Disc (%)" 
                      value={sizeInputs[size]?.discount || ''}
                      onChange={(e) => handleSizeInputChange(size, 'discount', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-indigo-900/80 border border-indigo-600 text-white text-sm placeholder-indigo-400 focus:outline-none focus:border-indigo-400 focus:bg-indigo-900 transition-all"
                    />
                  </div>

                  {/* Apply Button */}
                  <button 
                    onClick={() => applyToSize(size)}
                    className="w-full md:w-auto px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs uppercase tracking-wide rounded-lg shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 border border-indigo-400/50 active:scale-95"
                  >
                    <Check size={14} strokeWidth={3} /> Apply
                  </button>

                </div>
              ))}
            </div>
          </div>

          {/* 2. Bulk Table */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 font-bold text-gray-500 w-[30%]">Product Details</th>
                    <th className="px-6 py-4 font-bold text-gray-500 w-[15%]">Size</th>
                    <th className="px-6 py-4 font-bold text-gray-500 w-[15%]">Stock</th>
                    <th className="px-6 py-4 font-bold text-gray-500 w-[15%]">Price (₹)</th>
                    <th className="px-6 py-4 font-bold text-gray-500 w-[15%]">Discount (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {flatVariants.map((v) => {
                    // Check if modified
                    const modified = bulkChanges[v.id];
                    const stockVal = modified?.stock !== undefined ? modified.stock : v.stock;
                    const priceVal = modified?.oprice !== undefined ? modified.oprice : v.oprice;
                    const discVal = modified?.discount !== undefined ? modified.discount : v.discount;
                    
                    const isModified = modified !== undefined;

                    return (
                      <tr key={v.id} className={`hover:bg-gray-50/80 transition-colors ${isModified ? 'bg-indigo-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                             <img 
                               src={Array.isArray(v.productImage) ? v.productImage[0] : v.productImage} 
                               className="w-10 h-10 rounded-lg object-cover bg-gray-100" 
                               alt="" 
                             />
                             <div>
                               <p className="font-bold text-gray-900 line-clamp-1">{v.productName}</p>
                               <span className="text-xs text-gray-400">{v.category}</span>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-bold text-gray-700 border border-gray-200">
                            {v.size || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number"
                            value={stockVal}
                            onChange={(e) => handleVariantChange(v.id, 'stock', e.target.value)}
                            className={`w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none transition-all ${modified?.stock !== undefined ? 'border-indigo-400 bg-white shadow-sm' : 'border-gray-200 bg-gray-50/50'}`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number"
                            value={priceVal}
                            onChange={(e) => handleVariantChange(v.id, 'oprice', e.target.value)}
                            className={`w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none transition-all ${modified?.oprice !== undefined ? 'border-indigo-400 bg-white shadow-sm' : 'border-gray-200 bg-gray-50/50'}`}
                          />
                        </td>
                        <td className="px-6 py-4">
                           <input 
                            type="number"
                            value={discVal}
                            onChange={(e) => handleVariantChange(v.id, 'discount', e.target.value)}
                            className={`w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none transition-all ${modified?.discount !== undefined ? 'border-indigo-400 bg-white shadow-sm' : 'border-gray-200 bg-gray-50/50'}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Floating Action Bar */}
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white p-2 rounded-2xl shadow-2xl shadow-indigo-200 border border-gray-100 flex gap-2"
          >
             <button 
               onClick={() => { setIsBulkMode(false); setBulkChanges({}); }}
               className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
             >
               <X size={18} /> Cancel
             </button>
             <button 
               onClick={saveBulkChanges}
               disabled={isSaving || Object.keys(bulkChanges).length === 0}
               className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
             >
               {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
               {isSaving ? 'Saving...' : `Save Changes (${Object.keys(bulkChanges).length})`}
             </button>
          </motion.div>

        </motion.div>
      ) : (
        /* --- NORMAL VIEW (Existing Grid) --- */
        <motion.div 
          className="space-y-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {products?.length > 0 ? (
            Object.entries(groupedProducts).sort().map(([category, items]) => (
              <motion.div key={category} layout className="group/category">
                
                {/* Category Header */}
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

                {/* Grid Content */}
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
                            {/* Product Card Content */}
                            <div className="aspect-square bg-gray-50 relative overflow-hidden p-4">
                              <div className="w-full h-full rounded-2xl overflow-hidden relative">
                                  <img
                                    src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                  />
                              </div>
                              {/* 🟢 MODIFIED: Buttons visible on mobile, hover only on large screens */}
                              <div className="absolute top-6 right-6 flex flex-col gap-2 z-10 opacity-100 translate-x-0 lg:opacity-0 lg:translate-x-4 lg:group-hover:opacity-100 lg:group-hover:translate-x-0 transition-all duration-300 ease-out">
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
                            <div className="p-6 flex flex-col flex-1">
                              <div className="flex justify-between items-start mb-3">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-100 uppercase tracking-widest">
                                  {product.category || 'Uncategorized'}
                                </span>
                              </div>
                              <h3 className="font-bold text-gray-800 text-lg mb-1 truncate leading-tight group-hover:text-indigo-600 transition-colors" title={product.name}>
                                {product.name}
                              </h3>
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
            ))
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
        </motion.div>
      )}

      {/* --- ARCHIVED SECTION --- */}
      {!isBulkMode && archivedProducts.length > 0 && (
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