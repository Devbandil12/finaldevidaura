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
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 bg-[var(--bg)] min-h-screen font-body transition-colors duration-500 pb-28 w-full overflow-hidden">

      {/* --- LUXURY HEADER --- */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 px-8 bg-[var(--surface)] border border-[var(--border)]/30 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] gap-6"
      >
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-[var(--text)] flex items-center tracking-tight gap-3.5">
            <div className="p-2.5 rounded-2xl bg-[var(--surface-muted)]/50 border border-[var(--border)]/40 text-[var(--brand)] shadow-sm">
              <Package size={22} strokeWidth={1.5} />
            </div>
            Product Catalog
          </h2>
          <p className="font-body text-sm text-[var(--muted)] mt-2 tracking-wide">Curate and manage your luxury collections and inventory.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsBulkMode(!isBulkMode)}
            className={`flex items-center justify-center px-5 py-2.5 rounded-xl transition-all font-body font-bold text-xs uppercase tracking-widest shrink-0
              ${isBulkMode 
                ? 'bg-[var(--text)] text-[var(--surface)] shadow-[0_4px_16px_rgba(0,0,0,0.1)]' 
                : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]/50 hover:bg-[var(--surface-muted)] shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
              }`}
          >
            {isBulkMode ? <List size={16} className="mr-2" /> : <Edit3 size={16} className="mr-2" />}
            {isBulkMode ? 'Exit Bulk' : 'Bulk Edit'}
          </motion.button>

          {!isBulkMode && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={refreshProductStock}
                disabled={loading}
                className="flex items-center justify-center px-5 py-2.5 bg-[var(--surface)] text-[var(--sub)] border border-[var(--border)]/50 rounded-xl hover:text-[var(--brand)] hover:border-[var(--brand)]/30 transition-all font-body font-bold text-xs uppercase tracking-widest shadow-[0_2px_8px_rgba(0,0,0,0.02)] disabled:opacity-50 shrink-0"
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
                {loading ? 'Syncing...' : 'Sync'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpenModal(true)}
                className="flex items-center justify-center px-6 py-2.5 bg-[var(--brand)] text-[var(--surface)] rounded-xl hover:brightness-110 transition-all font-body font-bold text-xs uppercase tracking-widest shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)] shrink-0"
              >
                <Plus size={16} className="mr-2" strokeWidth={2.5} /> Add Item
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