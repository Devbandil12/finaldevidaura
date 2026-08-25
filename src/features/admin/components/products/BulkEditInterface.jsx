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
  const inputBaseClasses = "px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-soft)] outline-none transition-all font-body font-bold text-sm text-[var(--text)] placeholder-[var(--muted)] shadow-[var(--shadow)]";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-32">
      
      {/* 1. Size-Based Controls Bar */}
      <div className="bg-[var(--surface)] rounded-[2rem] p-6 md:p-8 shadow-[var(--shadow)] border border-[var(--border)] overflow-hidden font-body transition-all duration-300">
        <div className="mb-6 flex items-center gap-4 border-b border-[var(--border)] pb-5">
          <div className="w-12 h-12 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex items-center justify-center shadow-[var(--shadow)]">
            <Tag className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Bulk Updates by Size</h3>
            <p className="font-body text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] mt-1.5">Enter values below and click "Apply" to set them for all matching variants.</p>
          </div>
        </div>

        <div className="grid gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {uniqueSizes.map((size) => (
            <div key={size} className="bg-[var(--surface)] p-4 md:p-5 rounded-2xl border border-[var(--border)] flex flex-col xl:flex-row items-center gap-5 transition-colors hover:border-[var(--border)] shadow-[var(--shadow)]">
              
              <div className="w-full xl:w-28 shrink-0 flex items-center justify-center xl:justify-start">
                <span className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text)] min-w-[80px] text-center shadow-[var(--shadow)]">
                  {size}
                </span>
              </div>

              <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-6 gap-3">
                <input type="number" placeholder="Stock" value={sizeInputs[size]?.stock || ''} onChange={(e) => handleSizeInputChange(size, 'stock', e.target.value)} className={`col-span-1 ${inputBaseClasses}`} />
                <input type="number" placeholder="Price" value={sizeInputs[size]?.oprice || ''} onChange={(e) => handleSizeInputChange(size, 'oprice', e.target.value)} className={`col-span-1 ${inputBaseClasses}`} />
                <input type="number" placeholder="Disc %" value={sizeInputs[size]?.discount || ''} onChange={(e) => handleSizeInputChange(size, 'discount', e.target.value)} className={`col-span-1 ${inputBaseClasses}`} />
                <input type="number" step="0.01" placeholder="Wt(kg)" value={sizeInputs[size]?.weight || ''} onChange={(e) => handleSizeInputChange(size, 'weight', e.target.value)} className={`col-span-1 ${inputBaseClasses}`} />
                <div className="col-span-2 grid grid-cols-3 gap-2">
                    <input type="number" placeholder="L" value={sizeInputs[size]?.length || ''} onChange={(e) => handleSizeInputChange(size, 'length', e.target.value)} className={`${inputBaseClasses} text-center px-1`} />
                    <input type="number" placeholder="B" value={sizeInputs[size]?.breadth || ''} onChange={(e) => handleSizeInputChange(size, 'breadth', e.target.value)} className={`${inputBaseClasses} text-center px-1`} />
                    <input type="number" placeholder="H" value={sizeInputs[size]?.height || ''} onChange={(e) => handleSizeInputChange(size, 'height', e.target.value)} className={`${inputBaseClasses} text-center px-1`} />
                </div>
              </div>

              <button 
                onClick={() => applyToSize(size)}
                className="button-hero w-full xl:w-auto px-6 py-3 bg-[var(--brand)] hover:brightness-110 text-[var(--surface)] font-bold text-[11px] uppercase tracking-widest rounded-xl shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Check size={16} strokeWidth={2.5} /> Apply
                <div className="pulse border-[var(--surface)]"></div>
              </button>

            </div>
          ))}
        </div>
      </div>

      {/* 2. Bulk Table */}
      <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-[var(--shadow)] overflow-hidden font-body">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-20 shadow-sm text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 w-[25%]">Product Details</th>
                <th className="px-4 py-4 w-[10%]">Size</th>
                <th className="px-4 py-4 w-[10%]">Stock</th>
                <th className="px-4 py-4 w-[10%]">Price (₹)</th>
                <th className="px-4 py-4 w-[10%]">Disc (%)</th>
                <th className="px-4 py-4 w-[10%]">Weight (kg)</th>
                <th className="px-4 py-4 w-[15%]">L x B x H (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
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
                
                const getCellInputClass = (isMod) => `w-full px-3 py-2 border rounded-xl outline-none transition-all font-body font-bold text-sm text-[var(--text)] shadow-[var(--shadow)] ${isMod ? 'border-[var(--accent)] bg-[var(--surface)] ring-1 ring-[var(--accent-soft)]' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)]'}`;

                return (
                  <tr key={v.id} className={`transition-colors duration-300 ${isModified ? 'bg-[var(--accent-soft)]' : 'bg-[var(--surface)] hover:bg-[var(--surface)]'}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] shrink-0">
                            <img 
                              src={Array.isArray(v.productImage) ? v.productImage[0] : v.productImage} 
                              className="w-full h-full object-cover blend-luxury" 
                              alt="" 
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[var(--text)] tracking-wide truncate">{v.productName}</p>
                            <span className="font-bold text-[10px] uppercase tracking-widest text-[var(--sub)] mt-1 block">{v.category}</span>
                          </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="px-3 py-1.5 bg-[var(--surface-muted)] rounded-xl text-[10px] uppercase tracking-widest font-bold text-[var(--text)] border border-[var(--border)] shadow-[var(--shadow)]">
                        {v.size || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <input type="number" value={stockVal} onChange={(e) => handleVariantChange(v.id, 'stock', e.target.value)} className={getCellInputClass(modified?.stock !== undefined)} />
                    </td>
                    <td className="px-4 py-5">
                      <input type="number" value={priceVal} onChange={(e) => handleVariantChange(v.id, 'oprice', e.target.value)} className={getCellInputClass(modified?.oprice !== undefined)} />
                    </td>
                    <td className="px-4 py-5">
                        <input type="number" value={discVal} onChange={(e) => handleVariantChange(v.id, 'discount', e.target.value)} className={getCellInputClass(modified?.discount !== undefined)} />
                    </td>
                    
                    <td className="px-4 py-5">
                        <input type="number" step="0.01" value={weightVal} onChange={(e) => handleVariantChange(v.id, 'weight', e.target.value)} className={getCellInputClass(modified?.weight !== undefined)} />
                    </td>
                    <td className="px-4 py-5">
                        <div className="flex gap-2">
                            <input type="number" value={lVal} onChange={(e) => handleVariantChange(v.id, 'length', e.target.value)} className={`${getCellInputClass(modified?.length !== undefined)} text-center px-1`} placeholder="L" title="Length" />
                            <input type="number" value={bVal} onChange={(e) => handleVariantChange(v.id, 'breadth', e.target.value)} className={`${getCellInputClass(modified?.breadth !== undefined)} text-center px-1`} placeholder="B" title="Breadth" />
                            <input type="number" value={hVal} onChange={(e) => handleVariantChange(v.id, 'height', e.target.value)} className={`${getCellInputClass(modified?.height !== undefined)} text-center px-1`} placeholder="H" title="Height" />
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
        initial={{ y: 100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[var(--glass-strong)] backdrop-blur-xl p-3 rounded-2xl shadow-[var(--shadow-strong)] border border-[var(--border)] flex gap-3 font-body"
      >
          <button 
            onClick={() => { setIsBulkMode(false); setBulkChanges({}); }}
            className="px-6 py-3 rounded-xl font-bold text-sm text-[var(--sub)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors flex items-center gap-2"
          >
            <X size={18} strokeWidth={2} /> Cancel
          </button>
          
          <button 
            onClick={saveBulkChanges}
            disabled={isSaving || Object.keys(bulkChanges).length === 0}
            className="button-hero px-8 py-3 rounded-xl font-bold text-[var(--surface)] bg-[var(--brand)] hover:brightness-110 transition-all shadow-[var(--shadow-strong)] flex items-center gap-2 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed text-sm"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={18} strokeWidth={2.5} /> : <Save size={18} strokeWidth={2.5} />}
            {isSaving ? 'Saving...' : `Save Changes (${Object.keys(bulkChanges).length})`}
            {!isSaving && Object.keys(bulkChanges).length > 0 && <div className="pulse border-[var(--surface)]"></div>}
          </button>
      </motion.div>

    </motion.div>
  );
};

export default BulkEditInterface;