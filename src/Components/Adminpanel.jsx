import React, { useState, useContext, useEffect, useMemo, useCallback, useRef } from "react";
import { UserContext } from "../contexts/UserContext";
// 🟢 1. IMPORT ALL THE CORRECT FUNCTIONS from ProductContext
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { AdminContext } from "../contexts/AdminContext";
import { CouponContext } from "../contexts/CouponContext";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ImageUploadModal from "./ImageUploadModal";
import PincodeManager from "./PincodeManager";
import OrderChart from "./OrderChart";
import Reports from "./Reports";
import useCloudinary from "../utils/useCloudinary";
// 🟢 2. IMPORT NEW ICONS
import { Plus, X, Trash2, UploadCloud, ArrowRight, ArrowLeft, Save, Archive, Undo } from 'lucide-react';
import { FaTachometerAlt, FaBox, FaTicketAlt, FaClipboardList, FaUsers, FaEnvelope, FaShoppingCart, FaMoneyBillWave, FaBars, FaTimes, FaMapMarkerAlt, FaTimesCircle, FaFlagCheckered, FaDownload, FaPercentage, FaUserPlus, FaUserCheck, FaHeart, FaSave, FaPlus, FaTrash, FaArchive, FaUndo } from 'react-icons/fa'; // Added Archive/Undo
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
// 🟢 NEW: Import motion
import { motion, AnimatePresence } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// --- CSV Export Utility (Unchanged) ---
const downloadCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    window.toast.error("No data available to export.");
    return;
  }
  const flattenedData = data.map(item => {
    const flatItem = {};
    for (const key in item) {
      if (typeof item[key] === 'object' && item[key] !== null) {
        if (Array.isArray(item[key])) {
          flatItem[key] = JSON.stringify(item[key]);
        } else {
          for (const subKey in item[key]) {
            flatItem[`${key}_${subKey}`] = item[key][subKey];
          }
        }
      } else {
        flatItem[key] = item[key];
      }
    }
    return flatItem;
  });
  const headers = Object.keys(flattenedData[0]);
  const csvContent = [
    headers.join(','),
    ...flattenedData.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};


// --- OrderDetailsPopup (Unchanged) ---
const OrderDetailsPopup = ({ order, onClose }) => {
  if (!order) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[60] bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">×</button>
        <h2 className="text-xl font-bold mb-4">Order Details (#{order.id})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Customer & Payment</h3>
            <p><strong>User:</strong> {order.userName}</p>
            <p><strong>Phone:</strong> {order.phone || 'N/A'}</p>
            <p><strong>Payment Mode:</strong> {order.paymentMode}</p>
            <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
            <p><strong>Total Amount:</strong> ₹{order.totalAmount}</p>
            <p><strong>Status:</strong> <span className="font-semibold text-green-600">{order.status}</span></p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Shipping Address</h3>
            <p>{order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state}, {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}</p>
            <p><strong>Landmark:</strong> {order.shippingAddress?.landmark || 'N/A'}</p>
            <p><strong>Contact:</strong> {order.shippingAddress?.phone || 'N/A'}</p>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-semibold text-lg">Products</h3>
          <ul className="list-disc list-inside space-y-2">
            {(order.products || []).map(p => (
              <li key={p.id || p.variantId} className="flex items-center space-x-2">
                <img src={(Array.isArray(p.imageurl) ? p.imageurl[0] : p.imageurl) || "/fallback.png"} alt={p.productName} className="w-12 h-12 object-cover rounded" />
                <span>{p.productName} ({p.variantName}) (x{p.quantity}) - ₹{p.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// --- CartsWishlistsTab (Unchanged) ---
const CartsWishlistsTab = ({ flatCarts, stats }) => {
  const abandonedCarts = useMemo(() => {
    if (!flatCarts) return [];
    const userMap = new Map();
    flatCarts.forEach(item => {
      const { user, product, variant, cartItem } = item;
      if (!user || !product || !variant) return;
      if (!userMap.has(user.id)) {
        userMap.set(user.id, { user: user, items: [], totalValue: 0, lastActivity: new Date(0) });
      }
      const cart = userMap.get(user.id);
      const price = variant?.oprice ?? 0;
      const discount = variant?.discount ?? 0;
      const itemValue = (price * (1 - discount / 100)) * cartItem.quantity;
      cart.items.push({
        ...product, ...variant, id: variant.id, name: product.name,
        variantName: variant.name, imageurl: product.imageurl || [],
        quantity: cartItem.quantity, itemValue,
      });
      cart.totalValue += itemValue;
      const itemDate = new Date(cartItem.addedAt);
      if (itemDate > cart.lastActivity) cart.lastActivity = itemDate;
    });
    return Array.from(userMap.values()).sort((a, b) => b.lastActivity - a.lastActivity);
  }, [flatCarts]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Carts & Wishlists Analytics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Abandoned Carts Section */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold flex items-center gap-3">
            <FaShoppingCart className="text-red-500" />
            Abandoned Carts
          </h3>
          <div className="bg-white p-6 rounded-lg shadow-md space-y-4 max-h-[800px] overflow-y-auto">
            {abandonedCarts.length === 0 && <p className="text-gray-500">No abandoned carts found.</p>}
            {abandonedCarts.map(cart => (
              <div key={cart.user.id} className="border border-gray-200 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{cart.user.name}</p>
                    <p className="text-sm text-gray-600">{cart.user.email}</p>
                    <p className="text-xs text-gray-500">
                      Last Activity: {cart.lastActivity.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">₹{cart.totalValue.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{cart.items.length} items</p>
                  </div>
                </div>

                <div className="space-y-3 mt-3 pt-3 border-t border-gray-100">
                  {cart.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={(Array.isArray(item.imageurl) ? item.imageurl[0] : item.imageurl) || "/fallback.png"}
                        alt={item.name}
                        className="w-10 h-10 rounded object-cover bg-gray-100"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name} ({item.variantName})</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-800 ml-auto">
                        ₹{item.itemValue.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <button className="mt-4 px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-700">
                  Send Recovery Email
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Wishlist Stats Section */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold flex items-center gap-3">
            <FaHeart className="text-pink-500" />
            Most Wishlisted Items
          </h3>
          <div className="bg-white p-6 rounded-lg shadow-md max-h-[800px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Times Added</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.length === 0 && (
                  <tr><td colSpan="2" className="py-4 text-center text-gray-500">No wishlist data found.</td></tr>
                )}
                {stats.map(item => (
                  <tr key={item.variantId}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-md object-cover"
                            src={item.productImage || "/fallback.png"}
                            alt={item.productName}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                          <div className="text-xs text-gray-500">{item.variantName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold">{item.count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SalesChart (Unchanged) ---
const SalesChart = ({ orders }) => {
  const salesData = {
    labels: orders.map(o => new Date(o.createdAt).toLocaleDateString()),
    datasets: [
      {
        label: 'Sales Over Time',
        data: orders.map(o => o.totalAmount),
        fill: false,
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Sales Performance</h3>
      <Line data={salesData} />
    </div>
  );
};

// --- NewVsReturningCustomersChart (Corrected for new schema) ---
const NewVsReturningCustomersChart = ({ newCustomers, returningCustomers }) => {
  if (newCustomers === 0 && returningCustomers === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">New vs. Returning Customers</h3>
        <p>Not enough data to display.</p>
      </div>
    );
  }

  const newVsReturningData = {
    labels: ['New Customers', 'Returning Customers'],
    datasets: [
      {
        data: [newCustomers, returningCustomers],
        backgroundColor: ['#FF6384', '#36A2EB'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB'],
      },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">New vs. Returning Customers</h3>
      <Pie data={newVsReturningData} />
    </div>
  );
};


// 🟢 3. HELPER COMPONENTS FOR THE MODAL (with labels/placeholders)
const InputField = React.forwardRef(({ label, name, value, onChange, placeholder, type = "text", span = "col-span-1", ...props }, ref) => (
  <div className={span}>
    <label htmlFor={name} className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <input
      id={name}
      ref={ref}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="border rounded px-2 py-2 w-full text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
      {...props}
    />
  </div>
));

const TextAreaField = ({ label, name, value, onChange, placeholder, span = "col-span-1" }) => (
  <div className={span}>
    <label htmlFor={name} className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={3}
      className="border rounded px-2 py-2 w-full text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
    />
  </div>
);

// GREEN 4. MODIFIED: ProductVariantEditor (Stuck Zero & Auto-scroll Fix)
const ProductVariantEditor = ({ product, onClose }) => {
  const {
    updateProduct,
    addVariant,
    updateVariant,
    deleteVariant,
    unarchiveVariant,
  } = useContext(ProductContext);

  const { uploadImage, uploading } = useCloudinary();

  // --- DATA STATES ---
  const [parentData, setParentData] = useState({
    name: product.name,
    category: product.category,
    description: product.description,
    composition: product.composition,
    fragrance: product.fragrance,
    fragranceNotes: product.fragranceNotes,
  });

  const [existingImages, setExistingImages] = useState(
    Array.isArray(product.imageurl) ? product.imageurl : (product.imageurl ? [product.imageurl] : [])
  );
  
  const [newFiles, setNewFiles] = useState([]); 
  const [previews, setPreviews] = useState([]);
  const [variants, setVariants] = useState(product.variants || []);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [newVariantIndex, setNewVariantIndex] = useState(-1);
  const newVariantCardRef = useRef(null);

  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  const handleParentChange = (e) => {
    const { name, value } = e.target;
    setParentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length + newFiles.length + files.length > 10) return window.toast.error("Max 10 images.");
    setNewFiles(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
  };

  const removeExistingImage = (index) => setExistingImages(prev => prev.filter((_, i) => i !== index));
  const removeNewFile = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveParent = async (shouldClose = false) => {
    setIsSaving(true);
    try {
      let finalNewUrls = [];
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          finalNewUrls.push(await uploadImage(file));
        }
      }
      const finalImageArray = [...existingImages, ...finalNewUrls];
      await updateProduct(product.id, { ...parentData, imageurl: finalImageArray });
      
      setNewFiles([]);
      setPreviews([]);
      setExistingImages(finalImageArray);
      window.toast.success("Details updated!");
      if (shouldClose) onClose();
    } catch (error) {
      console.error(error);
      window.toast.error("Update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;
    const newVariants = [...variants];
    if (["oprice", "costPrice", "discount", "size", "stock"].includes(name)) {
        newVariants[index][name] = value === "" ? "" : Number(value);
    } else {
        newVariants[index][name] = value;
    }
    setVariants(newVariants);
  };

  const handleAddNewVariant = () => {
    setNewVariantIndex(variants.length);
    setVariants([...variants, { productId: product.id, name: "New Variant", size: 0, oprice: 0, costPrice: 0, discount: 0, stock: 0, isArchived: false }]);
  };

  const handleSaveVariant = async (index) => {
    const variant = variants[index];
    setIsSaving(true);
    try {
        if (variant.id) await updateVariant(variant.id, variant);
        else {
            const newVariant = await addVariant(variant);
            if (newVariant) {
                const newVariants = [...variants];
                newVariants[index] = newVariant;
                setVariants(newVariants);
            }
        }
        window.toast.success(`Variant saved!`);
    } catch (e) { window.toast.error("Failed to save."); } finally { setIsSaving(false); }
  };

  const handleArchiveToggle = async (index) => {
    const variant = variants[index];
    if (!variant.id) { setVariants(variants.filter((_, i) => i !== index)); return; }
    if (variant.isArchived) {
        if (window.confirm(`Unarchive?`)) {
            setIsSaving(true);
            await unarchiveVariant(variant.id);
            const newVariants = [...variants];
            newVariants[index].isArchived = false;
            setVariants(newVariants);
            setIsSaving(false);
        }
    } else {
        const activeVariants = variants.filter((v) => !v.isArchived);
        if (activeVariants.length <= 1) return window.toast.error("Keep at least one active variant.");
        if (window.confirm(`Archive?`)) {
            setIsSaving(true);
            await deleteVariant(variant.id);
            const newVariants = [...variants];
            newVariants[index].isArchived = true;
            setVariants(newVariants);
            setIsSaving(false);
        }
    }
  };

  useEffect(() => {
    if (newVariantCardRef.current) {
        newVariantCardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        setNewVariantIndex(-1);
    }
  }, [newVariantIndex]);

  // Modern Input Helper with Light Border
  const ModernInput = ({ label, name, value, onChange, type="text", span="col-span-1" }) => (
    <div className={span}>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">{label}</label>
      <input 
        name={name} 
        type={type} 
        placeholder={label} 
        value={value} 
        onChange={onChange} 
        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300" 
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 transition-all duration-300">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20">
        
        {/* Header */}
        <div className="px-8 py-6 bg-white flex justify-between items-center z-10 border-b border-gray-100">
          <div><h2 className="text-xl font-bold text-gray-800 tracking-tight">Edit Product</h2><p className="text-sm text-gray-400 mt-0.5 font-medium">{parentData.name}</p></div>
          <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all"><X size={22} /></button>
        </div>

        {/* Soft Tabs */}
        <div className="flex px-8 gap-8 border-b border-gray-50">
          <button onClick={() => setActiveTab("general")} className={`py-4 text-sm font-bold tracking-wide border-b-2 transition-all ${activeTab === "general" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>General & Images</button>
          <button onClick={() => setActiveTab("variants")} className={`py-4 text-sm font-bold tracking-wide border-b-2 transition-all ${activeTab === "variants" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>Variants ({variants.length})</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white/50">
          {activeTab === "general" && (
            <div className="space-y-8">
              {/* Image Grid */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 ml-1">Product Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <label className="flex flex-col items-center justify-center aspect-square rounded-3xl cursor-pointer bg-gray-50 hover:bg-indigo-50/50 transition-all group border-2 border-dashed border-gray-200 hover:border-indigo-200">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform text-indigo-500 mb-4"><Plus size={24} /></div>
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-500 uppercase tracking-wider">Add New</span>
                        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    {existingImages.map((url, idx) => (
                        <div key={`exist-${idx}`} className="relative aspect-square group rounded-3xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 bg-white">
                            <img src={url} alt="Product" className="w-full h-full object-cover" />
                            <button onClick={() => removeExistingImage(idx)} className="absolute top-3 right-3 bg-white/90 text-red-500 border border-gray-100 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    {previews.map((url, idx) => (
                        <div key={`new-${idx}`} className="relative aspect-square group rounded-3xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 bg-white">
                            <img src={url} alt="New" className="w-full h-full object-cover border-4 border-indigo-50" />
                            <div className="absolute inset-x-0 bottom-0 bg-indigo-600 text-white text-[9px] font-bold text-center py-1 tracking-wider">NEW UPLOAD</div>
                            <button onClick={() => removeNewFile(idx)} className="absolute top-3 right-3 bg-white/90 text-red-500 border border-gray-100 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white"><X size={16} /></button>
                        </div>
                    ))}
                </div>
              </div>

              {/* Text Fields */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ModernInput label="Product Name" name="name" value={parentData.name} onChange={handleParentChange} />
                 <ModernInput label="Category" name="category" value={parentData.category} onChange={handleParentChange} />
                 <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Description</label>
                    <textarea name="description" rows={3} value={parentData.description} onChange={handleParentChange} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none placeholder:text-gray-300" />
                 </div>
                 <ModernInput label="Top Notes" name="composition" value={parentData.composition} onChange={handleParentChange} />
                 <ModernInput label="Base Notes" name="fragranceNotes" value={parentData.fragranceNotes} onChange={handleParentChange} />
                 <ModernInput label="Heart Notes" name="fragrance" value={parentData.fragrance} onChange={handleParentChange} />
              </div>

              {/* Navigation Footer */}
              <div className="flex gap-4">
                  <button onClick={() => handleSaveParent(false)} disabled={isSaving || uploading} className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2">
                     {uploading ? <span className="animate-pulse">Uploading...</span> : isSaving ? "Saving..." : <><UploadCloud size={20} /> Save Details</>}
                  </button>
                  <button onClick={() => setActiveTab("variants")} className="w-1/3 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                     Next <ArrowRight size={18} />
                  </button>
              </div>
            </div>
          )}

          {activeTab === "variants" && (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 ml-2">Manage Variants</h3>
                    <button onClick={handleAddNewVariant} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition flex items-center gap-2"><Plus size={16} /> Add Variant</button>
                </div>
                
                <div className="space-y-4">
                    {variants.map((variant, index) => (
                        <div key={variant.id || `new-${index}`} ref={index === newVariantIndex ? newVariantCardRef : null} className={`p-6 rounded-3xl border transition-all ${variant.isArchived ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div><h4 className="font-bold text-gray-800 text-sm">{variant.name || "Untitled"} {variant.isArchived && <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-500 text-[10px] rounded-lg uppercase tracking-wide">Archived</span>}</h4></div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleSaveVariant(index)} disabled={isSaving} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"><Save size={18} /></button>
                                    <button onClick={() => handleArchiveToggle(index)} disabled={isSaving} className={`p-2.5 rounded-xl transition-colors ${variant.isArchived ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>{variant.isArchived ? <Undo size={18} /> : <Archive size={18} />}</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                                <ModernInput label="Name" name="name" value={variant.name} onChange={(e) => handleVariantChange(index, e)} />
                                <ModernInput label="Size" name="size" type="number" value={variant.size} onChange={(e) => handleVariantChange(index, e)} />
                                <ModernInput label="Stock" name="stock" type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, e)} />
                                <ModernInput label="Price" name="oprice" type="number" value={variant.oprice} onChange={(e) => handleVariantChange(index, e)} />
                                <ModernInput label="Cost" name="costPrice" type="number" value={variant.costPrice} onChange={(e) => handleVariantChange(index, e)} />
                                <ModernInput label="Disc %" name="discount" type="number" value={variant.discount} onChange={(e) => handleVariantChange(index, e)} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Navigation */}
                <div className="flex gap-4 pt-4 mt-6 border-t border-gray-100">
                   <button onClick={() => setActiveTab("general")} className="w-1/3 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                      <ArrowLeft size={18} /> Back
                   </button>
                   <button onClick={onClose} className="w-2/3 bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-gray-200 transition-all">
                      Finish Editing
                   </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [timeRangeInDays, setTimeRangeInDays] = useState(30);

  // 🟢 5. GET ALL NEW CONTEXT VALUES
  const {
    products,
    deleteProduct, // This is archiveProduct
    unarchiveProduct,
    archivedProducts,
    getArchivedProducts,
  } = useContext(ProductContext);

  const { userdetails } = useContext(UserContext);
  const { queries, getquery } = useContext(ContactContext);
  const { coupons, editingCoupon, setEditingCoupon, saveCoupon, deleteCoupon, refreshCoupons } = useContext(CouponContext);
  const { users, orders, getAllUsers, getAllOrders, updateOrderStatus, getSingleOrderDetails, reportOrders, getReportData, cancelOrder, loading: adminLoading, abandonedCarts, wishlistStats } = useContext(AdminContext);

  const { user, isLoaded } = useUser();

  const [editingUser, setEditingUser] = useState(null);

  const [editingProduct, setEditingProduct] = useState(null);

  const [orderStatusTab, setOrderStatusTab] = useState("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [querySearch, setQuerySearch] = useState("");

  // 🟢 6. NEW STATE FOR ARCHIVED TOGGLE
  const [showArchived, setShowArchived] = useState(false);

  // 🟢 7. NEW STATE FOR COUPON SUB-TABS
  const [couponSubTab, setCouponSubTab] = useState("manual");

  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // --- Data Fetching and Effects ---
  useEffect(() => {
    if (userdetails?.role !== "admin" && userdetails !== null) {
      navigate("/");
    }
  }, [userdetails, navigate]);

  useEffect(() => {
    // Wait for BOTH Clerk to be loaded AND the user to be an admin
    if (isLoaded && user && userdetails?.role === "admin") {
      getAllUsers();
      getAllOrders();
      getquery();
      refreshCoupons();
      getArchivedProducts();
    }
  }, [isLoaded, user, userdetails, getAllUsers, getAllOrders, getquery, refreshCoupons, getArchivedProducts]);

  // --- Analysis Data Calculation (Unchanged) ---
  const successfulOrders = orders?.filter(order => order.status !== "Order Cancelled");
  const totalOrders = orders?.length;
  const totalProducts = products?.length;
  const totalUsers = users?.length;
  const totalQueries = queries?.length;
  const cancelledOrdersValue = orders
    ?.filter(order => order.status === "Order Cancelled")
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const totalRevenue = successfulOrders?.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = successfulOrders?.length > 0 ? totalRevenue / successfulOrders.length : 0;
  const conversionRate = totalUsers > 0 ? (successfulOrders.length / totalUsers) * 100 : 0;

  const { newCustomers, returningCustomers } = useMemo(() => {
    if (!orders || orders.length === 0 || !users || users.length === 0) {
      return { newCustomers: 0, returningCustomers: 0 };
    }
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() - timeRangeInDays);
    const ordersInPeriod = orders.filter(o => {
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      return orderDate >= thresholdDate && orderDate <= now;
    });
    const userIdsInPeriod = [...new Set(ordersInPeriod.map(o => o.userId))];
    let newCount = 0;
    let returningCount = 0;
    const usersMap = new Map(users.map(u => [u.id, u]));
    for (const userId of userIdsInPeriod) {
      const user = usersMap.get(userId);
      if (!user || !user.orders || user.orders.length === 0) continue;
      const firstOrder = user.orders.reduce((earliest, current) => {
        if (!current.createdAt) return earliest;
        if (!earliest.createdAt) return current;
        return new Date(current.createdAt) < new Date(earliest.createdAt) ? current : earliest;
      }, user.orders[0]);
      if (!firstOrder || !firstOrder.createdAt) continue;
      const firstOrderDate = new Date(firstOrder.createdAt);
      if (firstOrderDate >= thresholdDate && firstOrderDate <= now) {
        newCount++;
      } else {
        returningCount++;
      }
    }
    return { newCustomers: newCount, returningCustomers: returningCount };
  }, [orders, users, timeRangeInDays]);


  // --- Functions ---
  const handleProductArchive = async (productId) => {
    const confirmation = window.confirm("Are you sure you want to ARCHIVE this product? It will be hidden from your store.");
    if (confirmation) {
      setLoading(true);
      try {
        await deleteProduct(productId);
        window.toast.success("Product archived successfully!");
      } catch (error) {
        console.error("❌ Error archiving product:", error);
        window.toast.error("Failed to archive product.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProductUnarchive = async (productId) => {
    if (!window.confirm("Are you sure you want to unarchive this product? It will become visible on your store.")) return;
    setLoading(true);
    try {
      await unarchiveProduct(productId);
    } catch (error) {
      console.error("❌ Error unarchiving product:", error);
      window.toast.error("Failed to unarchive product.");
    } finally {
      setLoading(false);
    }
  };

  const handleorderdetails = async (order) => {
    setDetailsLoading(true);
    try {
      const details = await getSingleOrderDetails(order.id);
      if (details) {
        setSelectedOrder(details);
      }
    } catch (error) {
      console.error("Error fetching order products:", error);
      window.toast.error("Failed to load order details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredUsers = users?.filter(
    (user) =>
      user?.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user?.phone?.includes(userSearchQuery)
  );

  const handleEditUser = (user) => {
    setEditingUser(user);
  };

  const handleSaveUser = async () => {
    try {
      const res = await fetch(`${BASE}/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser),
      });
      if (!res.ok) throw new Error("Failed to update user");
      window.toast.success("User updated successfully!");
      setEditingUser(null);
      getAllUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      window.toast.error("Failed to update user.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch(`${BASE}/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete user");
      }
      window.toast.success("User deleted successfully!");
      getAllUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      window.toast.error(error.message || "Failed to delete user.");
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const updatedOrder = await updateOrderStatus(orderId, newStatus);
    if (updatedOrder) {
      getAllOrders();
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${order.id}?`)) return;
    await cancelOrder(order.id, order.paymentMode, order.totalAmount);
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setIsSidebarOpen(false);
    if (tabName === "reports") {
      getReportData();
    }
    if (tabName === "products") {
      getArchivedProducts();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const dynamicTitle = () => {
    const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    return `${tabName} | Admin Panel`;
  };


  if (!isLoaded || !userdetails) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-[60px]">
        Loading admin portal...
      </div>
    );
  }

  return (
    user && userdetails?.role === "admin" && (
      <>
        <title>{dynamicTitle()}</title>
        <meta name="description" content={`Manage ${activeTab} for Devid Aura. Access all administrative tools and analytics.`} />
        <div className="flex min-h-screen bg-gray-100 text-gray-800 pt-[60px]">

          {/* Hamburger Menu Icon for mobile */}
          <div className="md:hidden absolute top-[50px] right-[5px] p-4 z-50">
            <button onClick={toggleSidebar} className="text-gray-800 text-2xl">
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

          {/* Sidebar */}
          <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md z-40 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <nav className="flex flex-col p-4 space-y-2">
              <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
              <button onClick={() => handleTabClick("dashboard")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "dashboard" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
                <FaTachometerAlt /><span>Dashboard</span>
              </button>
              <button onClick={() => handleTabClick("reports")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "reports" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
                <FaFlagCheckered /><span>Reports</span>
              </button>
              <button onClick={() => handleTabClick("products")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "products" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
                <FaBox /><span>Products</span>
              </button>
              <button onClick={() => handleTabClick("coupons")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "coupons" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
                <FaTicketAlt /><span>Coupons</span>
              </button>
              <button onClick={() => handleTabClick("orders")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "orders" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
                <FaClipboardList /><span>Orders</span>
              </button>
              <button onClick={() => handleTabClick("users")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "users" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
                <FaUsers /><span>Users</span>
              </button>
              <button onClick={() => handleTabClick("queries")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "queries" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
                <FaEnvelope /><span>Queries</span>
              </button>
              <button onClick={() => handleTabClick("carts")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "carts" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
                <FaShoppingCart /><span>Carts & Wishlists</span>
              </button>
              <button onClick={() => handleTabClick("pincodes")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "pincodes" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
                <FaMapMarkerAlt /><span>Pincodes</span>
              </button>
            </nav>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {openModal && <ImageUploadModal isopen={openModal} onClose={() => setOpenModal(false)} />}
            {selectedOrder && <OrderDetailsPopup order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

            {editingProduct && (
              <ProductVariantEditor
                product={editingProduct}
                onClose={() => {
                  setEditingProduct(null);
                  getArchivedProducts();
                }}
              />
            )}

            {/* --- Dashboard Tab (Unchanged) --- */}
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold">Admin Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                    <div><h3 className="text-lg font-semibold text-gray-500">Total Revenue</h3><p className="text-3xl font-bold">₹{totalRevenue?.toFixed(2)}</p></div>
                    <FaMoneyBillWave className="text-4xl text-green-400 opacity-50" />
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                    <div><h3 className="text-lg font-semibold text-gray-500">Total Orders</h3><p className="text-3xl font-bold">{totalOrders}</p></div>
                    <FaClipboardList className="text-4xl text-blue-400 opacity-50" />
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                    <div><h3 className="text-lg font-semibold text-gray-500">Conversion Rate</h3><p className="text-3xl font-bold">{conversionRate.toFixed(2)}%</p></div>
                    <FaPercentage className="text-4xl text-yellow-400 opacity-50" />
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                    <div><h3 className="text-lg font-semibold text-gray-500">Avg. Order Value</h3><p className="text-3xl font-bold">₹{averageOrderValue?.toFixed(2)}</p></div>
                    <FaTicketAlt className="text-4xl text-purple-400 opacity-50" />
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                    <div><h3 className="text-lg font-semibold text-gray-500">New Customers</h3><p className="text-3xl font-bold">{newCustomers}</p></div>
                    <FaUserPlus className="text-4xl text-indigo-400 opacity-50" />
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                    <div><h3 className="text-lg font-semibold text-gray-500">Returning Customers</h3><p className="text-3xl font-bold">{returningCustomers}</p></div>
                    <FaUserCheck className="text-4xl text-teal-400 opacity-50" />
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                    <div><h3 className="text-lg font-semibold text-gray-500">Cancelled Orders Value</h3><p className="text-3xl font-bold">₹{cancelledOrdersValue?.toFixed(2)}</p></div>
                    <FaTimesCircle className="text-4xl text-red-400 opacity-50" />
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                    <div><h3 className="text-lg font-semibold text-gray-500">Pending Queries</h3><p className="text-3xl font-bold">{totalQueries}</p></div>
                    <FaEnvelope className="text-4xl text-red-400 opacity-50" />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SalesChart orders={successfulOrders} />
                  <NewVsReturningCustomersChart newCustomers={newCustomers} returningCustomers={returningCustomers} />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <OrderChart orders={orders} />
                </div>
              </div>
            )}

            {/* --- Reports Tab (Unchanged) --- */}
            {activeTab === "reports" && (
              <Reports
                products={products}
                users={users}
                orders={reportOrders}
              />
            )}

            {/* --- Products Tab (Unchanged) --- */}
            {activeTab === "products" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold">Manage Products</h2>
                  <div>
                    <button onClick={() => downloadCSV(products, 'products.csv')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition mr-4">
                      <FaDownload className="inline-block mr-2" />Export CSV
                    </button>
                    <button onClick={() => setOpenModal(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                      Add New Product
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variants (Stock)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products?.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <img src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{product.category || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.variants?.map(v => (
                              <span key={v.id} className={`mr-2 my-1 inline-block px-2 py-0.5 rounded-full text-xs ${v.stock > 10 ? 'bg-green-100 text-green-800' : (v.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')}`}>
                                {v.name} (₹{v.oprice}) - {v.stock} left
                              </span>
                            ))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap space-x-2">
                            <button onClick={() => setEditingProduct(product)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Edit</button>
                            <button onClick={() => handleProductArchive(product.id)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1">
                              <FaArchive className="w-3 h-3" /> {loading ? "Archiving..." : "Archive"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-12">
                  <h3 className="text-2xl font-bold mb-4">Archived Products</h3>
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                  >
                    <FaArchive /> {showArchived ? "Hide" : "Show"} Archived Products ({archivedProducts.length})
                  </button>
                  {showArchived && (
                    <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                      {loading ? <p className="p-4">Loading archived products...</p> :
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {archivedProducts.length === 0 && (
                              <tr><td colSpan="4" className="text-center py-4 text-gray-500">No archived products found.</td></tr>
                            )}
                            {archivedProducts.map((product) => (
                              <tr key={product.id} className="opacity-70">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <img src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl} alt={product.name} className="w-12 h-12 object-cover rounded-md opacity-60" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-500 line-through">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{product.category || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                    onClick={() => handleProductUnarchive(product.id)}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
                                  >
                                    <FaUndo className="w-3 h-3" /> Unarchive
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      }
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🟢 --- START: NEW COUPONS TAB --- 🟢 */}
            {activeTab === "coupons" && (
              <div className="space-y-6">

                {/* --- 1. Sub-Tab Navigation --- */}
                <div className="flex w-full max-w-md p-1 bg-gray-100 rounded-lg space-x-1">
                  <button
                    onClick={() => { setCouponSubTab("manual"); setEditingCoupon(null); }}
                    className={`w-1/2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${couponSubTab === "manual"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    Manual Coupons
                  </button>
                  <button
                    onClick={() => { setCouponSubTab("auto"); setEditingCoupon(null); }}
                    className={`w-1/2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${couponSubTab === "auto"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    Automatic Promotions
                  </button>
                </div>

                {/* --- 2. Add/Edit Form (with Per-Field Instructions) --- */}
                <AnimatePresence>
                  {editingCoupon && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -20, height: 0 }}
                      className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <h3 className="text-xl font-bold mb-6">
                        {editingCoupon.id ? "Edit" : "Create"}
                        {editingCoupon.isAutomatic ? " Promotion" : " Manual Coupon"}
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">

                        {/* --- Column 1: Details & Action --- */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Details</h4>
                          {/* Field: Code */}
                          <div>
                            <InputField
                              label={editingCoupon.isAutomatic ? "Promotion Name (e.g., FREE30ML)" : "Coupon Code *"}
                              name="code"
                              value={editingCoupon.code || ""}
                              onChange={(e) => setEditingCoupon((ec) => ({ ...ec, code: e.target.value.toUpperCase() }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              <b>Manual:</b> The code customers enter (e.g., `SAVE10`). <b>Auto:</b> A display name for the cart (e.g., `BOGO_OFFER`).
                            </p>
                          </div>
                          {/* Field: Description */}
                          <div>
                            <TextAreaField
                              label="Description"
                              name="description"
                              value={editingCoupon.description || ""}
                              onChange={(e) => setEditingCoupon((ec) => ({ ...ec, description: e.target.value }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">Internal note for your reference (e.g., "Diwali Promo"). Not shown to customers.</p>
                          </div>

                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pt-4">Action</h4>
                          {/* Field: Discount Type */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Discount Type *</label>
                            <select
                              value={editingCoupon.discountType || "percent"}
                              onChange={(e) => setEditingCoupon((ec) => ({ ...ec, discountType: e.target.value }))}
                              className="border rounded px-2 py-2 w-full text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                            >
                              <option value="percent">Percent (%)</option>
                              <option value="flat">Flat (₹)</option>
                              <option value="free_item">Free Item</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">The type of discount to apply.</p>
                          </div>
                          {/* Field: Discount Value */}
                          <div>
                            <InputField
                              label={editingCoupon.discountType === 'percent' ? "Percentage (e.g., 10)" : (editingCoupon.discountType === 'free_item' ? "Discount Value (usually 0)" : "Value (e.g., 100)")}
                              name="discountValue"
                              type="number"
                              value={editingCoupon.discountValue ?? 0}
                              onChange={(e) => setEditingCoupon((ec) => ({ ...ec, discountValue: +e.target.value }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">The numeric value (e.g., `10` for 10% or `100` for ₹100). Use `0` for Free Item promos.</p>
                          </div>
                          {/* Field: Max Discount Amount */}
                          {editingCoupon.discountType === 'percent' && (
                            <div>
                              <InputField
                                label="Max Discount Amount (₹)"
                                name="maxDiscountAmount"
                                type="number"
                                placeholder="e.g., 300 (0 for no cap)"
                                value={editingCoupon.maxDiscountAmount ?? ""}
                                onChange={(e) => setEditingCoupon((ec) => ({ ...ec, maxDiscountAmount: e.target.value === "" ? null : +e.target.value }))}
                              />
                              <p className="text-xs text-gray-500 mt-1">The maximum discount in ₹. (e.g., 10% off, max ₹300). Leave empty or `0` for no cap.</p>
                            </div>
                          )}
                        </div>

                        {/* --- Column 2: Rules & Validity --- */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Basic Rules</h4>
                          {/* Field: Min Order Value */}
                          <div>
                            <InputField
                              label="Min. Order Value (₹)"
                              name="minOrderValue"
                              type="number"
                              value={editingCoupon.minOrderValue ?? 0}
                              onChange={(e) => setEditingCoupon((ec) => ({ ...ec, minOrderValue: +e.target.value }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">Cart subtotal must be at least this much. Set `0` for no minimum.</p>
                          </div>
                          {/* Field: Min Item Count */}
                          <div>
                            <InputField
                              label="Min. Item Count"
                              name="minItemCount"
                              type="number"
                              value={editingCoupon.minItemCount ?? 0}
                              onChange={(e) => setEditingCoupon((ec) => ({ ...ec, minItemCount: +e.target.value }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">Cart must have at least this many items. Set `0` for no minimum.</p>
                          </div>
                          {/* Field: Max Usage Per User */}
                          <div>
                            <InputField
                              label="Max Usage Per User"
                              name="maxUsagePerUser"
                              type="number"
                              placeholder="1 (Leave empty for no limit)"
                              value={editingCoupon.maxUsagePerUser ?? ""}
                              onChange={(e) => setEditingCoupon((ec) => ({ ...ec, maxUsagePerUser: e.target.value === "" ? null : +e.target.value }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">Max times one logged-in customer can use this. Leave empty for unlimited.</p>
                          </div>
                          {/* Field: First Order Only */}
                          <div>
                            <label className="flex items-start gap-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                              <input
                                type="checkbox"
                                className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                                checked={editingCoupon.firstOrderOnly ?? false}
                                onChange={(e) => setEditingCoupon((ec) => ({ ...ec, firstOrderOnly: e.target.checked }))}
                              />
                              <span>
                                Apply to First Order Only
                                <span className="block text-xs text-gray-500">If checked, this will not work for returning customers.</span>
                              </span>
                            </label>
                          </div>

                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pt-4">Validity</h4>
                          {/* Field: Valid From */}
                          <div>
                            <InputField
                              label="Valid From"
                              name="validFrom"
                              type="date"
                              value={editingCoupon.validFrom ? new Date(editingCoupon.validFrom).toISOString().split("T")[0] : ""}
                              onChange={(e) => setEditingCoupon((ec) => ({ ...ec, validFrom: e.target.value }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">Optional: Date the coupon becomes active.</p>
                          </div>
                          {/* Field: Valid Until */}
                          <div>
                            <InputField
                              label="Valid Until"
                              name="validUntil"
                              type="date"
                              value={editingCoupon.validUntil ? new Date(editingCoupon.validUntil).toISOString().split("T")[0] : ""}
                              onChange={(e) => setEditingCoupon((ec) => ({ ...ec, validUntil: e.target.value }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">Optional: Date the coupon expires (at the end of this day).</p>
                          </div>
                        </div>

                        {/* --- Row 2: Automatic Rules (with Per-Field Instructions) --- */}
                        {editingCoupon.isAutomatic && (
                          <div className="lg:col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3">Automatic Promotion Rules</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                              {/* Field: Req. Category */}
                              <div>
                                <InputField
                                  label="Req. Category (e.g., Template)"
                                  name="cond_requiredCategory"
                                  value={editingCoupon.cond_requiredCategory || ""}
                                  onChange={(e) => setEditingCoupon((ec) => ({ ...ec, cond_requiredCategory: e.target.value }))}
                                />
                                <p className="text-xs text-gray-500 mt-1">Cart must contain an item from this category.</p>
                              </div>
                              {/* Field: Req. Size */}
                              <div>
                                <InputField
                                  label="Req. 'Buy' Size (e.g., 100)"
                                  name="cond_requiredSize"
                                  type="number"
                                  value={editingCoupon.cond_requiredSize ?? ""}
                                  onChange={(e) => setEditingCoupon((ec) => ({ ...ec, cond_requiredSize: e.target.value === "" ? null : +e.target.value }))}
                                />
                                <p className="text-xs text-gray-500 mt-1">The size of the "Buy" item (e.g., 100ml).</p>
                              </div>
                              {/* Field: Tgt. Size */}
                              <div>
                                <InputField
                                  label="Tgt. 'Get' Size (e.g., 30)"
                                  name="action_targetSize"
                                  type="number"
                                  value={editingCoupon.action_targetSize ?? ""}
                                  onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_targetSize: e.target.value === "" ? null : +e.target.value }))}
                                />
                                <p className="text-xs text-gray-500 mt-1">The size of the "Get" item (e.g., 30ml).</p>
                              </div>
                              {/* Field: Tgt. Max Price */}
                              <div>
                                <InputField
                                  label="Tgt. Item Max Price (e.g., 600)"
                                  name="action_targetMaxPrice"
                                  type="number"
                                  value={editingCoupon.action_targetMaxPrice ?? ""}
                                  onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_targetMaxPrice: e.target.value === "" ? null : +e.target.value }))}
                                />
                                <p className="text-xs text-gray-500 mt-1">Safety cap price for the "Get" item.</p>
                              </div>
                              {/* Field: Buy X / Get Y */}
                              <div>
                                <div className="flex gap-2">
                                  <InputField
                                    label="Buy X"
                                    name="action_buyX"
                                    type="number"
                                    value={editingCoupon.action_buyX ?? ""}
                                    onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_buyX: e.target.value === "" ? null : +e.target.value }))}
                                  />
                                  <InputField
                                    label="Get Y"
                                    name="action_getY"
                                    type="number"
                                    value={editingCoupon.action_getY ?? ""}
                                    onChange={(e) => setEditingCoupon((ec) => ({ ...ec, action_getY: e.target.value === "" ? null : +e.target.value }))}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">For "Buy X, Get Y" offers (e.g., Buy 2, Get 1).</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* --- Row 3: Form Actions --- */}
                        <div className="lg:col-span-2 flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-4">
                          <button onClick={() => setEditingCoupon(null)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors">Cancel</button>
                          <button onClick={saveCoupon} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors">Save</button>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* --- 3. Manual Coupons Table --- */}
                {couponSubTab === 'manual' && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Manage Manual Coupons</h2>
                        <p className="text-sm text-gray-500">These codes must be manually entered by the customer at checkout.</p>
                      </div>
                      <button
                        onClick={() => setEditingCoupon({
                          code: "", discountType: "percent", discountValue: 10, isAutomatic: false,
                          minOrderValue: 0, minItemCount: 0, maxDiscountAmount: null, firstOrderOnly: false, maxUsagePerUser: 1
                        })}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors whitespace-nowrap"
                      >
                        Add New Coupon
                      </button>
                    </div>

                    {/* --- Instructions Box (General Examples) --- */}
                    <div className="p-4 bg-blue-50 border border-blue-200 text-sm text-blue-900 rounded-lg">
                      <h4 className="font-bold">How Manual Coupons Work:</h4>
                      <ul className="list-disc list-inside pl-2 mt-2 space-y-1">
                        <li>Customers must **manually enter the "Coupon Code"** at checkout.</li>
                        <li>**`Discount Type`**: Choose `Percent` (e.g., 10% off), `Flat` (e.g., ₹100 off), or `Free Item`.</li>
                        <li>**`Max Discount`**: Only applies to `Percent` types. Set `0` or leave empty for no cap.</li>
                        <li>**`Basic Rules`**: Use `Min. Order Value` or `Min. Item Count` to set requirements.</li>
                        <li>**`Max Usage Per User`**: Set how many times one customer can use the code (e.g., `1` for a welcome discount).</li>
                      </ul>
                    </div>

                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code / Desc</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rules</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {coupons.filter(c => !c.isAutomatic).map((c) => (
                            <tr key={c.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-semibold">{c.code}</div>
                                <div className="text-xs text-gray-500 truncate max-w-xs">{c.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div><span className="font-medium capitalize">{c.discountType}</span></div>
                                <div className="text-sm">{c.discountType === "percent" ? `${c.discountValue}%` : `₹${c.discountValue}`}</div>
                                {c.discountType === 'percent' && c.maxDiscountAmount > 0 && (
                                  <div className="text-xs text-red-600">(Max: ₹{c.maxDiscountAmount})</div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm whitespace-nowrap">
                                <div>Min: <strong>₹{c.minOrderValue}</strong></div>
                                <div>Min Items: <strong>{c.minItemCount}</strong></div>
                                <div>Usage: <strong>{c.maxUsagePerUser ?? "∞"}</strong> / user</div>
                                <div>{c.firstOrderOnly ? <span className="text-xs font-medium text-indigo-600">First Order Only</span> : ""}</div>
                              </td>
                              <td className="px-6 py-4 text-xs whitespace-nowrap">
                                <div>From: {c.validFrom ? new Date(c.validFrom).toLocaleDateString() : 'N/A'}</div>
                                <div>Until: {c.validUntil ? new Date(c.validUntil).toLocaleDateString() : 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                <button
                                  onClick={() => setEditingCoupon({ ...c })}
                                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteCoupon(c.id)}
                                  className="px-4 py-2 bg-white text-red-600 border border-red-400 rounded-lg text-sm font-medium hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* --- 4. Automatic Promotions Table --- */}
                {couponSubTab === 'auto' && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Manage Automatic Promotions</h2>
                        <p className="text-sm text-gray-500">These offers apply automatically in the cart if their rules are met.</p>
                      </div>
                      <button
                        onClick={() => setEditingCoupon({
                          code: "NEW_OFFER", discountType: "free_item", discountValue: 0, isAutomatic: true,
                          minOrderValue: 0, minItemCount: 0, maxDiscountAmount: null, cond_requiredCategory: "Template",
                          action_targetSize: 30, action_targetMaxPrice: 600
                        })}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors whitespace-nowrap"
                      >
                        Add New Promotion
                      </button>
                    </div>

                    {/* Instructions Box (General Examples) */}
                    <div className="p-4 bg-blue-50 border border-blue-200 text-sm text-blue-900 rounded-lg">
                      <h4 className="font-bold">How Promotions Work:</h4>
                      <ul className="list-disc list-inside pl-2 mt-2 space-y-1">
                        <li>The "Code" is just a **display name** for the cart (e.g., "FREE_30ML").</li>
                        <li>**Example (Free 30ml with Combo):** Type: `free_item`, Req. Category: `Template`, Tgt. Size: `30`, Tgt. Max Price: `600`.</li>
                        <li>**Example (Buy 2 100ml, Get 1 20ml Free):** Type: `free_item`, Req. Size: `100`, Tgt. Size: `20`, Buy X: `2`, Get Y: `1`.</li>
                        <li>**Example (20% Off):** Type: `percent`, Value: `20`, Max Discount: `300` (0 for no cap).</li>
                      </ul>
                    </div>

                    {/* Auto-Promotions Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Desc</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Rules</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Automatic Rules</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {coupons.filter(c => c.isAutomatic).map((c) => (
                            <tr key={c.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-semibold">{c.code}</div>
                                <div className="text-xs text-gray-500 truncate max-w-xs">{c.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div><span className="font-medium capitalize">{c.discountType.replace('_', ' ')}</span></div>
                                <div className="text-sm">{c.discountType === "percent" ? `${c.discountValue}%` : (c.discountType === 'free_item' ? 'Free Item' : `₹${c.discountValue}`)}</div>
                                {c.discountType === 'percent' && c.maxDiscountAmount > 0 && (
                                  <div className="text-xs text-red-600">(Max: ₹{c.maxDiscountAmount})</div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm whitespace-nowrap">
                                <div>Min: <strong>₹{c.minOrderValue}</strong></div>
                                <div>Min Items: <strong>{c.minItemCount}</strong></div>
                                <div>Usage: <strong>{c.maxUsagePerUser ?? "∞"}</strong> / user</div>
                                <div>{c.firstOrderOnly ? <span className="text-xs font-medium text-indigo-600">First Order Only</span> : ""}</div>
                              </td>
                              <td className="px-6 py-4 text-sm whitespace-nowrap">
                                {c.cond_requiredCategory && <div>Req. Category: <strong>{c.cond_requiredCategory}</strong></div>}
                                {c.cond_requiredSize && <div>Req. Size: <strong>{c.cond_requiredSize}ml</strong></div>}
                                {c.action_targetSize && <div>Tgt. Size: <strong>{c.action_targetSize}ml</strong> (Max ₹{c.action_targetMaxPrice})</div>}
                                {c.action_buyX && <div>BOGO: <strong>Buy {c.action_buyX} Get {c.action_getY}</strong></div>}
                              </td>
                              <td className="px-6 py-4 text-xs whitespace-nowrap">
                                <div>From: {c.validFrom ? new Date(c.validFrom).toLocaleDateString() : 'N/A'}</div>
                                <div>Until: {c.validUntil ? new Date(c.validUntil).toLocaleDateString() : 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                <button
                                  onClick={() => setEditingCoupon({ ...c })}
                                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteCoupon(c.id)}
                                  className="px-4 py-2 bg-white text-red-600 border border-red-400 rounded-lg text-sm font-medium hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* --- Orders Tab (Unchanged) --- */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold">Manage Orders</h2>
                  <button onClick={() => downloadCSV(orders, 'orders.csv')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                    <FaDownload className="inline-block mr-2" />Export Orders
                  </button>
                </div>
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                  <span className="text-lg font-medium">Total Orders: {orders?.length}</span>
                  <div className="flex flex-wrap gap-2">
                    {["All", "Order Placed", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
                      <button key={status} onClick={() => setOrderStatusTab(status)} className={`px-4 py-2 rounded-full text-sm font-medium ${orderStatusTab === status ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>{status === "Cancelled" ? "Cancelled Orders" : status}</button>
                    ))}
                  </div>
                  <input type="text" placeholder="Search orders..." value={orderSearchQuery} onChange={(e) => setOrderSearchQuery(e.target.value)} className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-4">
                  {orders
                    ?.filter((o) => {
                      if (orderStatusTab === "All") return true;
                      if (orderStatusTab === "Cancelled") return o.status === "Order Cancelled";
                      return o.status === orderStatusTab;
                    })
                    .filter((o) => o.id.toString().includes(orderSearchQuery.trim())).length === 0 && <p className="text-center text-gray-500">No orders found.</p>}
                  {orders
                    ?.filter((o) => {
                      if (orderStatusTab === "All") return true;
                      if (orderStatusTab === "Cancelled") return o.status === "Order Cancelled";
                      return o.status === orderStatusTab;
                    })
                    .filter((o) => o.id.toString().includes(orderSearchQuery.trim()))
                    .map((order) => (
                      <div key={order.id} className="bg-white p-6 rounded-lg shadow-md space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-bold">Order #{order.id}</h3>
                          <span className={`px-3 py-1 text-xs rounded-full font-semibold ${order.status === "Delivered" ? "bg-green-100 text-green-800" : order.status === "Order Cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{order.status}</span>
                        </div>
                        <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                        <p><strong>Total:</strong> ₹{order.totalAmount}</p>
                        {(order.status !== "Order Cancelled" && order.status !== "Delivered") && (
                          <div className="flex items-center space-x-2 mt-2">
                            <label className="text-sm font-medium">Update Status:</label>
                            <select value={order.status} onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)} className="border rounded-lg px-2 py-1">
                              <option value="Order Placed">Order Placed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                            <button
                              onClick={() => handleCancelOrder(order)}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                              Cancel Order
                            </button>
                          </div>
                        )}
                        <button onClick={() => handleorderdetails(order)} className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">See More Details</button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* --- Users Tab (Unchanged) --- */}
            {activeTab === "users" && (
              <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold">Manage Users</h2>
                  <button onClick={() => downloadCSV(users, 'users.csv')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                    <FaDownload className="inline-block mr-2" />Export Users
                  </button>
                </div>
                <div className="relative w-full max-w-md">
                  <input
                    type="text"
                    placeholder="Search users by name or phone..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {editingUser ? (
                  <div className="max-w-5xl mx-auto space-y-6">
                    <button
                      onClick={() => setEditingUser(null)}
                      className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      &larr; <span>Back to Users</span>
                    </button>
                    <div className="bg-white p-6 rounded-xl shadow flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                        {editingUser.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{editingUser.name}</h2>
                        <p className="text-gray-500">{editingUser.email}</p>
                        <p className="text-gray-500">Role: <span className="font-medium">{editingUser.role}</span></p>
                        <p className="text-gray-500">Joined: {new Date(editingUser.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-xl shadow space-y-3">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Contact Information</h3>
                        <p><strong>Email:</strong> {editingUser.email}</p>
                        <p><strong>Phone:</strong> {editingUser.phone || 'N/A'}</p>
                        <p><strong>Role:</strong> {editingUser.role}</p>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow space-y-3">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Addresses</h3>
                        {editingUser.addresses?.length > 0 ? (
                          <div className="space-y-2">
                            {editingUser.addresses.map((address) => (
                              <div key={address.id} className="bg-gray-50 p-3 rounded-lg border flex flex-col">
                                <p>{address.address}</p>
                                <p>{address.city}, {address.state}, {address.zipCode}</p>
                                <p>{address.country}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No addresses found.</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow space-y-4">
                      <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Order History ({editingUser.orders?.length || 0})</h3>
                      {editingUser.orders?.length > 0 ? (
                        <div className="space-y-3">
                          {editingUser.orders.map((order) => (
                            <div key={order.id} className="bg-gray-50 p-4 rounded-xl border flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-gray-800">Order #{order.id}</p>
                                <p className="text-gray-600">Total: ₹{order.totalAmount}</p>
                                <p>Status:
                                  <span className={`ml-1 font-medium ${order.status === 'Delivered' ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {order.status}
                                  </span>
                                </p>
                              </div>
                              <div>
                                <button className="px-3 py-1 rounded-full bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition">
                                  View
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No orders found.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers?.map((user) => (
                      <div key={user.id} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                        <p className="text-gray-600 text-sm">{user.email}</p>
                        <p className="text-gray-500 text-xs mt-1">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="flex-1 px-3 py-1 rounded-full bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="flex-1 px-3 py-1 rounded-full bg-red-600 text-white text-sm hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* --- Queries Tab (Unchanged) --- */}
            {activeTab === "queries" && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">User Queries</h2>
                <input type="text" placeholder="Search queries by email or phone..." value={querySearch} onChange={(e) => setQuerySearch(e.target.value)} className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="space-y-4">
                  {queries?.length > 0 ? (
                    queries?.filter(q => q.email.toLowerCase().includes(querySearch.toLowerCase()) || q.phone.includes(querySearch) || (q.date && q.date.includes(querySearch)))
                      ?.map((query, index) => (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-md space-y-1">
                          <p><strong>Email:</strong> {query.email}</p>
                          <p><strong>Phone:</strong> {query.phone}</p>
                          {query.date && <p><strong>Date:</strong> {query.date}</p>}
                          <p><strong>Message:</strong> {query.message}</p>
                        </div>
                      ))
                  ) : (
                    <p className="text-center text-gray-500">No queries found.</p>
                  )}
                </div>
              </div>
            )}

            {/* --- Carts & Wishlists Tab (Unchanged) --- */}
            {activeTab === "carts" && (
              <CartsWishlistsTab
                flatCarts={abandonedCarts}
                stats={wishlistStats}
              />
            )}

            {/* --- Pincodes Tab (Unchanged) --- */}
            {activeTab === "pincodes" && <PincodeManager />}

          </div>
        </div>
      </>
    )
  );
};

export default AdminPanel;