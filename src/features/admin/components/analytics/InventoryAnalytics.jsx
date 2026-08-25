import React, { useState, useMemo } from 'react';
import { Package, AlertTriangle, AlertOctagon, IndianRupee } from 'lucide-react';
import { useInventoryAnalytics } from '../../hooks/useAnalytics';
import { StatCard } from '../dashboard/StatCard';

const InventoryAnalytics = () => {
  const { data, isLoading, error } = useInventoryAnalytics();
  const [searchTerm, setSearchTerm] = useState('');

  const { kpis, tableData } = data || {};

  const filteredData = useMemo(() => {
    if (!tableData) return [];
    if (!searchTerm) return tableData;
    const lowerSearch = searchTerm.toLowerCase();
    return tableData.filter(item => 
      (item.product_name && item.product_name.toLowerCase().includes(lowerSearch)) ||
      (item.variant_name && item.variant_name.toLowerCase().includes(lowerSearch)) ||
      (item.sku && item.sku.toLowerCase().includes(lowerSearch))
    );
  }, [tableData, searchTerm]);

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--sub)] font-body animate-pulse">Scanning Inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-[var(--error)] font-body bg-[var(--error-light)] rounded-xl m-6">
        <h3 className="font-bold mb-2">Error Loading Analytics</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 animate-fadeIn">
      
      {/* ─── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Stock Value" 
          value={`₹${(kpis?.totalValue || 0).toLocaleString()}`} 
          subtext={`Potential revenue in warehouse`}
          icon={IndianRupee} 
          trend={null}
          color="brand"
        />
        <StatCard 
          title="Total Variants" 
          value={(kpis?.totalVariants || 0).toLocaleString()} 
          subtext={`Active SKUs`}
          icon={Package} 
          trend={null}
          color="sub"
        />
        <StatCard 
          title="Low Stock SKUs" 
          value={(kpis?.lowStockCount || 0).toLocaleString()} 
          subtext={`< 10 units remaining`}
          icon={AlertTriangle} 
          trend={null}
          color="amber"
        />
        <StatCard 
          title="Out of Stock SKUs" 
          value={(kpis?.outOfStockCount || 0).toLocaleString()} 
          subtext={`Currently zero inventory`}
          icon={AlertOctagon} 
          trend={null}
          color="error"
        />
      </div>

      {/* ─── INVENTORY TABLE ────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow)] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[var(--border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-display font-medium text-lg text-[var(--text)]">Inventory Status</h3>
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search SKU or Product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm font-body focus:outline-none focus:border-[var(--brand)] transition-colors"
            />
          </div>
        </div>
        <div className="overflow-x-auto smooth-scrollbar max-h-[600px]">
          <table className="w-full text-left font-body text-sm relative">
            <thead className="bg-[var(--surface)] text-[var(--sub)] font-medium text-[11px] uppercase tracking-wider sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-5 py-3">Product / Variant</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3 text-center">In Stock</th>
                <th className="px-5 py-3 text-center">Total Sold</th>
                <th className="px-5 py-3 text-right">Potential Value</th>
                <th className="px-5 py-3 text-right">Turnover Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredData && filteredData.length > 0 ? filteredData.map((item, idx) => (
                <tr key={`${item.sku}-${idx}`} className="hover:bg-[var(--surface)] transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-[var(--text)]">{item.product_name}</p>
                    <p className="text-[11px] text-[var(--sub)]">{item.variant_name}</p>
                  </td>
                  <td className="px-5 py-4 text-[var(--sub)] text-xs font-mono">{item.sku || 'N/A'}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center justify-center min-w-[28px] h-6 rounded-md font-bold text-xs ${
                      item.stock === 0 ? 'bg-[var(--error-light)] text-[var(--error)]' :
                      item.stock < 10 ? 'bg-[var(--accent-light)] text-[var(--accent)]' :
                      'bg-[var(--surface-muted)] text-[var(--sub)]'
                    }`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-medium text-[var(--text)]">
                    {item.sold}
                  </td>
                  <td className="px-5 py-4 font-bold text-[var(--text)] text-right">
                    ₹{Number(item.potential_revenue).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-[var(--brand-light)] text-[var(--brand)] font-bold text-xs">
                      {Number(item.turnover_rate).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-[var(--muted)]">No inventory matches found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default InventoryAnalytics;
