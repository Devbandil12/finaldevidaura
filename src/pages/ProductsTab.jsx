import React from 'react';
import {
  Download, Archive, RotateCcw, Plus, Search,
  Package, Tag, AlertTriangle, CheckCircle, XCircle, Edit3, RefreshCw
} from 'lucide-react';

const ProductsTab = ({
  products, archivedProducts, showArchived, loading,
  handleProductArchive, handleProductUnarchive, setEditingProduct, downloadCSV, setOpenModal, setShowArchived, refreshProductStock
}) => {

  // Helper: Get Stock Status Badge
  const getStockBadge = (variants) => {
    const totalStock = variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;

    if (totalStock === 0) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-100 uppercase tracking-wide"><XCircle size={10} /> Out of Stock</span>;
    }
    if (totalStock < 10) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide"><AlertTriangle size={10} /> Low Stock</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 uppercase tracking-wide"><CheckCircle size={10} /> In Stock</span>;
  };

  return (
    <div className="space-y-8 p-4 sm:p-8 bg-gray-50 min-h-screen text-gray-900 ">

      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 flex items-center">
            <Package className="w-6 h-6 mr-3 text-indigo-600" /> Products
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage your store's inventory and catalog.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={refreshProductStock}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition text-sm font-semibold shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Stock'}
          </button>
          <button
            onClick={() => downloadCSV(products, 'products.csv')}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white  text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-semibold shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          <button
            onClick={() => setOpenModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm font-semibold shadow-lg shadow-gray-200"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </button>
        </div>
      </div>

      {/* --- PRODUCTS GRID --- */}
      {products?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl  shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-300 group flex flex-col overflow-hidden">

              {/* Image Area */}
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <img
                  src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">                  <button
                  onClick={() => setEditingProduct(product)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] text-gray-700 hover:text-indigo-600 hover:scale-110 transition-all"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                  <button
                    onClick={() => handleProductArchive(product.id)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] text-gray-700 hover:text-red-600 hover:scale-110 transition-all"
                    title="Archive"
                  >
                    <Archive size={16} />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3">
                  {getStockBadge(product.variants)}
                </div>
              </div>

              {/* Details */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600  uppercase tracking-wide">
                    {product.category || 'Uncategorized'}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 mb-1 truncate" title={product.name}>{product.name}</h3>

                {/* Variant Summary */}
                <div className="mt-auto pt-4 border-t border-gray-50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Variants</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.variants?.slice(0, 3).map(v => (
                      <span key={v.id} className="px-2 py-1 bg-gray-50  rounded text-[10px] font-medium text-gray-600">
                        {v.name} (₹{v.oprice})
                      </span>
                    ))}
                    {(product.variants?.length || 0) > 3 && (
                      <span className="px-2 py-1 bg-gray-50  rounded text-[10px] font-medium text-gray-400">
                        +{product.variants.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="p-4 bg-gray-50 rounded-full mb-3"><Package className="w-8 h-8 text-gray-400" /></div>
          <p className="text-gray-500 font-medium">No active products found.</p>
          <button onClick={() => setOpenModal(true)} className="mt-4 text-sm font-bold text-indigo-600 hover:underline">Add your first product</button>
        </div>
      )}

      {/* --- ARCHIVED SECTION --- */}
      {archivedProducts.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Archive className="text-gray-400" size={20} /> Archived Products
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{archivedProducts.length}</span>
            </h3>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              {showArchived ? "Hide Archived" : "Show Archived"}
            </button>
          </div>

          {showArchived && (
            <div className="bg-white rounded-xl  overflow-hidden shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] animate-in slide-in-from-top-2 duration-300">
              {loading ? (
                <div className="p-8 text-center text-gray-500 text-sm">Loading archived items...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500">
                      <tr>
                        <th className="px-6 py-3">Product</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {archivedProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4 opacity-60 group-hover:opacity-100 transition-opacity">
                              <img
                                src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover bg-gray-100  grayscale group-hover:grayscale-0 transition-all"
                              />
                              <span className="font-medium text-gray-900 line-through decoration-gray-400 group-hover:no-underline">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500 opacity-60">{product.category || 'N/A'}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleProductUnarchive(product.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                            >
                              <RotateCcw size={12} /> Unarchive
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsTab;