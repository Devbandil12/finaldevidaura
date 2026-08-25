import React from 'react';
import { useProductAnalytics } from '../../hooks/useAnalytics';

const ProductAnalytics = ({ timeRange, startDate, endDate }) => {
  const { data, isLoading, error } = useProductAnalytics(timeRange, startDate, endDate);

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--sub)] font-body animate-pulse">Aggregating Product Performance...</p>
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

  const { products, comparisonLabel } = data || {};

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 animate-fadeIn">
      
      {/* ─── TOP PRODUCTS TABLE ────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow)] overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
          <h3 className="font-display font-medium text-lg text-[var(--text)]">Top Performing Products</h3>
          <span className="text-xs font-body font-medium bg-[var(--surface-muted)] text-[var(--sub)] px-3 py-1 rounded-full">
            {comparisonLabel || 'All Data'}
          </span>
        </div>
        <div className="overflow-x-auto smooth-scrollbar">
          <table className="w-full text-left font-body text-sm">
            <thead className="bg-[var(--surface)] text-[var(--sub)] font-medium text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3 text-center">Units Sold</th>
                <th className="px-5 py-3 text-right">Gross Revenue</th>
                <th className="px-5 py-3 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {products && products.length > 0 ? products.map((product) => (
                <tr key={product.product_id} className="hover:bg-[var(--surface)] transition-colors">
                  <td className="px-5 py-4 font-medium text-[var(--text)]">{product.product_name || 'Unknown Product'}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded-md bg-[var(--brand-light)] text-[var(--brand)] font-bold text-xs">
                      {product.units_sold}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-[var(--text)] text-right">
                    ₹{Number(product.revenue).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 font-bold text-[var(--success)] text-right">
                    ₹{Number(product.profit).toLocaleString()}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-[var(--muted)]">No product sales found in this period</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ProductAnalytics;
