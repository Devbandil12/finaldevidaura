import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Plus, Package, Edit3, RefreshCw, List } from 'lucide-react';
import { useUpdateBulkVariants } from '../../features/catalog/hooks/useProducts';
import BulkEditInterface from '../../features/admin/components/products/BulkEditInterface';
import ProductGrid from '../../features/admin/components/products/ProductGrid';
import ArchivedProducts from '../../features/admin/components/products/ArchivedProducts';

const ProductsTab = ({ 
  products, archivedProducts, showArchived, loading, 
  handleProductArchive, handleProductUnarchive, setEditingProduct, 
  downloadCSV, setOpenModal, setShowArchived, refreshProductStock 
}) => {
  const { mutateAsync: updateBulkVariants } = useUpdateBulkVariants();

  const [openCategories, setOpenCategories] = useState({});
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkChanges, setBulkChanges] = useState({});
  const [sizeInputs, setSizeInputs] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const groupedProducts = useMemo(() => {
    if (!products) return {};
    return products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});
  }, [products]);

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

  const uniqueSizes = useMemo(() => {
    const sizes = new Set(flatVariants.map(v => v.size || 'N/A').filter(s => s));
    return Array.from(sizes).sort();
  }, [flatVariants]);

  useEffect(() => {
    if (Object.keys(groupedProducts).length > 0) {
      const initialOpenState = {};
      Object.keys(groupedProducts).forEach(cat => initialOpenState[cat] = true);
      setOpenCategories(prev => ({ ...initialOpenState, ...prev }));
    }
  }, [groupedProducts]);

  const toggleCategory = (category) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleVariantChange = (variantId, field, value) => {
    setBulkChanges(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value === '' ? '' : Number(value)
      }
    }));
  };

  const handleSizeInputChange = (size, field, value) => {
    setSizeInputs(prev => ({
      ...prev,
      [size]: {
        ...prev[size],
        [field]: value
      }
    }));
  };

  const applyToSize = (size) => {
    const inputs = sizeInputs[size];
    if (!inputs) return;

    const hasValue = Object.values(inputs).some(val => val !== '' && val !== undefined);
    if (!hasValue) return;

    const newChanges = { ...bulkChanges };
    let count = 0;
    
    flatVariants.forEach(v => {
      if ((v.size || 'N/A') === size) {
        if (!newChanges[v.id]) newChanges[v.id] = {};
        if (inputs.stock !== undefined && inputs.stock !== '') newChanges[v.id].stock = Number(inputs.stock);
        if (inputs.oprice !== undefined && inputs.oprice !== '') newChanges[v.id].oprice = Number(inputs.oprice);
        if (inputs.discount !== undefined && inputs.discount !== '') newChanges[v.id].discount = Number(inputs.discount);
        if (inputs.weight !== undefined && inputs.weight !== '') newChanges[v.id].weight = Number(inputs.weight);
        if (inputs.length !== undefined && inputs.length !== '') newChanges[v.id].length = Number(inputs.length);
        if (inputs.breadth !== undefined && inputs.breadth !== '') newChanges[v.id].breadth = Number(inputs.breadth);
        if (inputs.height !== undefined && inputs.height !== '') newChanges[v.id].height = Number(inputs.height);
        count++;
      }
    });
    
    setBulkChanges(newChanges);
    window.toast?.success(`Updated ${count} variants of size ${size}`);
  };

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-10 p-4 sm:p-6 lg:p-10 bg-[var(--bg)] min-h-screen font-body transition-colors duration-300 pb-28">

      {/* --- HEADER --- */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-[var(--border)] bg-[var(--surface)] p-8 rounded-3xl shadow-[var(--shadow)]"
      >
        <div>
          <h2 className="font-display text-4xl font-medium text-[var(--text)] flex items-center tracking-tight">
            <Package className="w-9 h-9 mr-3.5 text-[var(--accent)]" strokeWidth={1.5} /> Products
          </h2>
          <p className="font-display italic text-lg text-[var(--sub)] mt-2 tracking-wide">Manage your store's inventory and luxury catalog.</p>
        </div>
        
        <div className="flex flex-wrap gap-3.5 w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsBulkMode(!isBulkMode)}
            className={`flex-1 sm:flex-none flex items-center justify-center px-6 py-3.5 border rounded-xl transition-all font-body font-bold text-sm shadow-[var(--shadow)] tracking-wide
              ${isBulkMode 
                ? 'bg-[var(--brand)] text-[var(--surface)] border-[var(--brand)] shadow-[var(--shadow-strong)]' 
                : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-muted)] hover:border-[var(--border)] hover:text-[var(--brand)]'
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
                className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3.5 bg-[var(--surface)] text-[var(--brand)] border border-[var(--border)] rounded-xl hover:border-[var(--brand)] hover:shadow-sm transition-all font-body font-bold text-sm tracking-wide shadow-[var(--shadow)] disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setOpenModal(true)}
                className="button-hero flex-1 sm:flex-none flex items-center justify-center px-7 py-3.5 bg-[var(--brand)] text-[var(--surface)] border border-[var(--brand)] rounded-xl hover:brightness-110 transition-all font-body font-bold text-sm tracking-wide shadow-[var(--shadow-strong)]"
              >
                <Plus className="w-4 h-4 mr-2" strokeWidth={2.5} /> Add Product
                <div className="pulse border-[var(--surface)]"></div>
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* --- CONTENT AREA --- */}
      {isBulkMode ? (
        <BulkEditInterface 
          uniqueSizes={uniqueSizes}
          sizeInputs={sizeInputs}
          handleSizeInputChange={handleSizeInputChange}
          applyToSize={applyToSize}
          flatVariants={flatVariants}
          bulkChanges={bulkChanges}
          handleVariantChange={handleVariantChange}
          setIsBulkMode={setIsBulkMode}
          setBulkChanges={setBulkChanges}
          saveBulkChanges={saveBulkChanges}
          isSaving={isSaving}
        />
      ) : (
        <ProductGrid 
          products={products}
          groupedProducts={groupedProducts}
          openCategories={openCategories}
          toggleCategory={toggleCategory}
          setEditingProduct={setEditingProduct}
          handleProductArchive={handleProductArchive}
          setOpenModal={setOpenModal}
          containerVariants={containerVariants}
          itemVariants={itemVariants}
        />
      )}

      {/* --- ARCHIVED SECTION --- */}
      {!isBulkMode && archivedProducts.length > 0 && (
        <ArchivedProducts 
          archivedProducts={archivedProducts}
          showArchived={showArchived}
          setShowArchived={setShowArchived}
          loading={loading}
          handleProductUnarchive={handleProductUnarchive}
        />
      )}
    </div>
  );
};

export default ProductsTab;