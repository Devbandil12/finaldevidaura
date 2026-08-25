import React, { useState } from 'react';
import { Search, Package } from 'lucide-react';

const InventoryTab = ({ inventoryData = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const totalInventoryValue = inventoryData.reduce((a, b) => a + (b.value || 0), 0);
  const filteredInventory = inventoryData.filter(
    i => (i.name || '').toLowerCase().includes(searchTerm) || (i.sku || '').toLowerCase().includes(searchTerm)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-[var(--bg)] min-h-screen font-body animate-fadeIn transition-colors duration-300 pb-20">
      
      {/* Top Filter & Summary Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-5 bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
         
         {/* Search Input */}
         <div className="relative flex-1 max-w-lg group">
           <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--brand)] transition-colors" size={18} strokeWidth={1.5} />
           <input 
             type="text" 
             placeholder="Search SKU or Product..." 
             className="w-full pl-11 pr-4 py-3.5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none transition-all placeholder-[var(--muted)] shadow-sm"
             onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
           />
         </div>

         {/* Total Inventory Value Pill */}
         <div className="bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[var(--brand)] px-6 py-3.5 rounded-xl flex items-center justify-between lg:justify-center gap-3 shadow-sm">
           <span className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)]">Inventory Value:</span>
           <span className="font-body text-base font-bold text-[var(--text)] tracking-tight">₹{totalInventoryValue.toLocaleString()}</span>
         </div>
      </div>

      {/* Inventory Table Section */}
      <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-[var(--shadow)] overflow-hidden">
        <div className="px-6 md:px-8 py-5 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
          <h4 className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-2">
            <Package size={16} strokeWidth={2} className="text-[var(--brand)]" /> Stock Management List
          </h4>
          <span className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--text)] bg-[var(--surface)] px-3 py-1 rounded-md border border-[var(--border)] shadow-sm">
            {filteredInventory.length} Items Found
          </span>
        </div>

        <div className="overflow-x-auto smooth-scrollbar">
          <table className="w-full text-left text-sm min-w-[850px] border-collapse">
            <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--muted)] tracking-widest">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Variant</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4">Turnover Rate</th>
                <th className="px-6 py-4 text-right">Potential Rev (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredInventory.map((item, i) => {
                const isLowStock = item.stock < 10;

                return (
                  <tr key={i} className="hover:bg-[var(--surface)] transition-colors duration-300 group cursor-default">
                    <td className="px-6 py-4 font-body font-bold text-[var(--text)] text-sm tracking-wide group-hover:text-[var(--brand)] transition-colors">{item.name}</td>
                    <td className="px-6 py-4 font-body text-xs font-bold text-[var(--sub)]">{item.variant || 'Standard'}</td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-[var(--muted)]">{item.sku}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-body text-[9px] uppercase tracking-widest font-bold border shadow-sm ${
                        isLowStock 
                          ? 'bg-[var(--surface)] text-[var(--error)] border-[var(--border)]' 
                          : 'bg-[var(--surface)] text-[var(--success)] border-[var(--border)]'
                      }`}>
                        {item.stock} Units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-24 h-2 bg-[var(--surface)] border border-[var(--border)] rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-[var(--brand)] rounded-full transition-all duration-500" style={{ width: `${Math.min(item.turnoverRate || 0, 100)}%` }}></div>
                         </div>
                         <span className="font-body text-xs font-bold text-[var(--sub)]">{item.turnoverRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-body font-bold text-[var(--text)] text-sm tracking-tight">₹{item.value.toLocaleString()}</td>
                  </tr>
                );
              })}

              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center font-display italic text-xl text-[var(--sub)] tracking-wide">
                    No inventory items match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryTab;