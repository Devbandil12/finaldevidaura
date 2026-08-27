import React from 'react';
import { Check, Tag, RefreshCw, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

const BulkEditInterface = ({
  uniqueSizes,
  sizeInputs,
  handleSizeInputChange,
  applyToSize,
  flatVariants,
  bulkChanges,
  handleVariantChange,
  setIsBulkMode,
  setBulkChanges,
  saveBulkChanges,
  isSaving
}) => {
  const inputBaseClasses = "px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]/40 hover:border-[var(--border)] focus:border-[var(--brand)]/50 outline-none transition-all font-body font-bold text-xs text-[var(--text)] placeholder-[var(--muted)] shadow-[0_2px_8px_rgba(0,0,0,0.02)]";

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-28 font-body">
      
      {/* 1. Size-Based Controls Bar */}
      <div className="bg-[var(--surface)] rounded-[1.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-[var(--border)]/30 overflow-hidden transition-all duration-500">
        <div className="mb-6 flex items-center gap-4 border-b border-[var(--border)]/30 pb-5">
          <div className="w-10 h-10 bg-[var(--surface-muted)]/50 border border-[var(--border)]/40 rounded-xl flex items-center justify-center text-[var(--brand)] shadow-sm">
            <Tag size={18} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-medium text-[var(--text)] tracking-tight">Bulk Size Assignment</h3>
            <p className="font-body text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] mt-1">Define master values per size variant.</p>
          </div>
        </div>

        <div className="grid gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {uniqueSizes.map((size) => (
            <div key={size} className="bg-[var(--surface-muted)]/30 p-4 rounded-2xl border border-[var(--border)]/30 flex flex-col xl:flex-row xl:items-center gap-4 transition-colors hover:bg-[var(--surface-muted)]/50">
              
              <div className="w-full xl:w-24 shrink-0 flex items-center justify-start">
                <span className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)]/50 rounded-xl text-xs font-bold text-[var(--text)] w-full text-center shadow-sm">
                  {size}
                </span>
              </div>

              <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-6 gap-3">
                <input type="number" placeholder="Stock" value={sizeInputs[size]?.stock || ''} onChange={(e) => handleSizeInputChange(size, 'stock', e.target.value)} className={`col-span-1 ${inputBaseClasses}`} />
                <input type="number" placeholder="Price" value={sizeInputs[size]?.oprice || ''} onChange={(e) => handleSizeInputChange(size, 'oprice', e.target.value)} className={`col-span-1 ${inputBaseClasses}`} />
                <input type="number" placeholder="Disc %" value={sizeInputs[size]?.discount || ''} onChange={(e) => handleSizeInputChange(size, 'discount', e.target.value)} className={`col-span-1 ${inputBaseClasses}`} />
                <input type="number" step="0.01" placeholder="Wt(kg)" value={sizeInputs[size]?.weight || ''} onChange={(e) => handleSizeInputChange(size, 'weight', e.target.value)} className={`col-span-1 ${inputBaseClasses}`} />
                <div className="col-span-2 grid grid-cols-3 gap-2">
                    <input type="number" placeholder="L" value={sizeInputs[size]?.length || ''} onChange={(e) => handleSizeInputChange(size, 'length', e.target.value)} className={`${inputBaseClasses} text-center px-1`} title="Length" />
                    <input type="number" placeholder="B" value={sizeInputs[size]?.breadth || ''} onChange={(e) => handleSizeInputChange(size, 'breadth', e.target.value)} className={`${inputBaseClasses} text-center px-1`} title="Breadth" />
                    <input type="number" placeholder="H" value={sizeInputs[size]?.height || ''} onChange={(e) => handleSizeInputChange(size, 'height', e.target.value)} className={`${inputBaseClasses} text-center px-1`} title="Height" />
                </div>
              </div>

              <button 
                onClick={() => applyToSize(size)}
                className="w-full xl:w-auto px-5 py-2.5 bg-[var(--text)] hover:bg-[var(--brand)] text-[var(--surface)] font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Check size={14} strokeWidth={3} /> Apply
              </button>

            </div>
          ))}
        </div>
      </div>

      {/* 2. Premium Spreadsheet Table */}
      <div className="bg-[var(--surface)] rounded-[1.5rem] border border-[var(--border)]/30 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden font-body">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px] whitespace-nowrap">
            <thead className="bg-[var(--surface-muted)]/80 border-b border-[var(--border)]/30 sticky top-0 z-20 backdrop-blur-xl text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 w-[25%]">Asset / Name</th>
                <th className="px-4 py-4 w-[10%]">Size</th>
                <th className="px-4 py-4 w-[10%]">Stock</th>
                <th className="px-4 py-4 w-[10%]">Price (₹)</th>
                <th className="px-4 py-4 w-[10%]">Disc (%)</th>
                <th className="px-4 py-4 w-[10%]">Wt (kg)</th>
                <th className="px-4 py-4 w-[15%]">L × B × H (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/20">
              {flatVariants.map((v) => {
                const modified = bulkChanges[v.id];
                const stockVal = modified?.stock !== undefined ? modified.stock : v.stock;
                const priceVal = modified?.oprice !== undefined ? modified.oprice : v.oprice;
                const discVal = modified?.discount !== undefined ? modified.discount : v.discount;
                const weightVal = modified?.weight !== undefined ? modified.weight : v.weight || 0.5;
                const lVal = modified?.length !== undefined ? modified.length : v.length || 10;
                const bVal = modified?.breadth !== undefined ? modified.breadth : v.breadth || 10;
                const hVal = modified?.height !== undefined ? modified.height : v.height || 10;
                
                const isModified = modified !== undefined;
                const getCellInputClass = (isMod) => `w-full px-3 py-2 rounded-lg bg-transparent border border-transparent hover:border-[var(--border)]/50 focus:bg-[var(--surface)] focus:border-[var(--brand)]/50 outline-none transition-all font-body font-bold text-xs text-[var(--text)] ${isMod ? 'bg-[var(--brand)]/5 text-[var(--brand)] border-[var(--brand)]/30 shadow-inner' : 'hover:bg-[var(--surface-muted)]/50'}`;

                return (
                  <tr key={v.id} className={`transition-colors duration-300 ${isModified ? 'bg-[var(--brand)]/5' : 'bg-[var(--surface)] hover:bg-[var(--surface-muted)]/30'}`}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--border)]/40 bg-[var(--surface-muted)] shrink-0">
                            <img 
                              src={Array.isArray(v.productImage) ? v.productImage[0] : v.productImage} 
                              className="w-full h-full object-cover mix-blend-multiply" 
                              alt="" 
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[var(--text)] tracking-tight truncate max-w-[180px]">{v.productName}</p>
                            <span className="font-bold text-[9px] uppercase tracking-widest text-[var(--sub)] mt-0.5 block truncate max-w-[180px]">{v.category}</span>
                          </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 bg-[var(--surface-muted)] rounded-lg text-[10px] uppercase tracking-widest font-bold text-[var(--sub)] border border-[var(--border)]/40">
                        {v.size || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-3"><input type="number" value={stockVal} onChange={(e) => handleVariantChange(v.id, 'stock', e.target.value)} className={getCellInputClass(modified?.stock !== undefined)} /></td>
                    <td className="px-3 py-3"><input type="number" value={priceVal} onChange={(e) => handleVariantChange(v.id, 'oprice', e.target.value)} className={getCellInputClass(modified?.oprice !== undefined)} /></td>
                    <td className="px-3 py-3"><input type="number" value={discVal} onChange={(e) => handleVariantChange(v.id, 'discount', e.target.value)} className={getCellInputClass(modified?.discount !== undefined)} /></td>
                    <td className="px-3 py-3"><input type="number" step="0.01" value={weightVal} onChange={(e) => handleVariantChange(v.id, 'weight', e.target.value)} className={getCellInputClass(modified?.weight !== undefined)} /></td>
                    <td className="px-3 py-3">
                        <div className="flex gap-1.5">
                            <input type="number" value={lVal} onChange={(e) => handleVariantChange(v.id, 'length', e.target.value)} className={`${getCellInputClass(modified?.length !== undefined)} text-center px-1 w-12`} title="L" />
                            <input type="number" value={bVal} onChange={(e) => handleVariantChange(v.id, 'breadth', e.target.value)} className={`${getCellInputClass(modified?.breadth !== undefined)} text-center px-1 w-12`} title="B" />
                            <input type="number" value={hVal} onChange={(e) => handleVariantChange(v.id, 'height', e.target.value)} className={`${getCellInputClass(modified?.height !== undefined)} text-center px-1 w-12`} title="H" />
                        </div>
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
        initial={{ y: 50, opacity: 0, scale: 0.95 }} 
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[var(--surface)]/95 backdrop-blur-xl p-2.5 rounded-[1.25rem] shadow-[0_16px_40px_rgba(0,0,0,0.12)] border border-[var(--border)]/50 flex items-center gap-3 font-body"
      >
          <button 
            onClick={() => { setIsBulkMode(false); setBulkChanges({}); }}
            className="px-5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors flex items-center gap-2"
          >
            <X size={16} strokeWidth={2} /> Cancel
          </button>
          
          <button 
            onClick={saveBulkChanges}
            disabled={isSaving || Object.keys(bulkChanges).length === 0}
            className="px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest text-[var(--surface)] bg-[var(--text)] hover:bg-[var(--brand)] transition-all shadow-[0_4px_16px_rgba(0,0,0,0.1)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={16} strokeWidth={2.5} /> : <Save size={16} strokeWidth={2.5} />}
            {isSaving ? 'Saving...' : `Push Changes (${Object.keys(bulkChanges).length})`}
          </button>
      </motion.div>

    </motion.div>
  );
};

export default BulkEditInterface;