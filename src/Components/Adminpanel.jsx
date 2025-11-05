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
// 🟢 2. IMPORT NEW ICONS
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
    deleteVariant, // This is archiveVariant
    unarchiveVariant,
  } = useContext(ProductContext);

  const [parentData, setParentData] = useState({
    name: product.name,
    category: product.category,
    description: product.description,
    composition: product.composition,
    fragrance: product.fragrance,
    fragranceNotes: product.fragranceNotes,
  });

  const [variants, setVariants] = useState(product.variants || []);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // 🔽 1. ADD STATE AND REF FOR AUTO-SCROLL
  const [newVariantIndex, setNewVariantIndex] = useState(-1);
  const newVariantCardRef = useRef(null);

  // --- (Handler functions) ---
  const handleParentChange = (e) => {
    const { name, value } = e.target;
    setParentData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔽 2. FIX "STUCK ZERO" BUG
  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;
    const newVariants = [...variants];

    if (["oprice", "costPrice", "discount", "size", "stock"].includes(name)) {
      // If value is empty string, keep it. Otherwise, convert to Number.
      newVariants[index][name] = value === "" ? "" : Number(value);
    } else {
      // This is a text field
      newVariants[index][name] = value;
    }

    setVariants(newVariants);
  };

  // 🔽 3. MODIFY FOR AUTO-SCROLL
  const handleAddNewVariant = () => {
    // Set the index of the item we're about to add
    setNewVariantIndex(variants.length);

    setVariants([
      ...variants,
      {
        productId: product.id,
        name: "New Variant",
        size: 0,
        oprice: 0,
        costPrice: 0,
        discount: 0,
        stock: 0,
        isArchived: false,
      },
    ]);
  };

  const handleSaveParent = async () => {
    setIsSaving(true);
    await updateProduct(product.id, parentData);
    setIsSaving(false);
    window.toast.success("Parent product updated!");
  };

  const handleSaveVariant = async (index) => {
    const variant = variants[index];
    setIsSaving(true);
    try {
      if (variant.id) {
        await updateVariant(variant.id, variant);
      } else {
        const newVariant = await addVariant(variant);
        if (newVariant) {
          const newVariants = [...variants];
          newVariants[index] = newVariant;
          setVariants(newVariants);
        } else {
          throw new Error("Failed to get new variant data from server");
        }
      }
      window.toast.success(`Variant "${variant.name}" saved!`);
    } catch (e) {
      window.toast.error("Failed to save variant.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveVariant = async (index) => {
    const variant = variants[index];
    const activeVariants = variants.filter((v) => !v.isArchived);
    if (activeVariants.length <= 1 && !variant.isArchived) {
      window.toast.error("A product must have at least one active variant.");
      return;
    }
    if (!variant.id) {
      setVariants(variants.filter((_, i) => i !== index));
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to ARCHIVE the "${variant.name}" variant?`
      )
    ) {
      setIsSaving(true);
      await deleteVariant(variant.id);
      const newVariants = [...variants];
      newVariants[index].isArchived = true;
      setVariants(newVariants);
      setIsSaving(false);
      window.toast.success("Variant archived!");
    }
  };

  const handleUnarchiveVariant = async (index) => {
    const variant = variants[index];
    if (
      window.confirm(
        `Are you sure you want to UNARCHIVE the "${variant.name}" variant?`
      )
    ) {
      setIsSaving(true);
      await unarchiveVariant(variant.id);
      const newVariants = [...variants];
      newVariants[index].isArchived = false;
      setVariants(newVariants);
      setIsSaving(false);
      window.toast.success("Variant unarchived!");
    }
  };

  // 🔽 4. ADD EFFECT FOR AUTO-SCROLL
  useEffect(() => {
    if (newVariantCardRef.current) {
      // If the ref is attached, scroll to it
      newVariantCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      // Reset the index so it doesn't fire again
      setNewVariantIndex(-1);
    }
  }, [newVariantIndex]); // Runs only when newVariantIndex changes

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[60] bg-black bg-opacity-50">
      <div className="bg-gray-100 p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] relative flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl z-10"
        >
          &times;
        </button>
        <h2 className="text-xl sm:text-2xl font-bold mb-4 pr-8">
          Edit Product: {parentData.name}
        </h2>

        {/* --- Tab Navigation (Unchanged) --- */}
        <div className="flex border-b border-gray-300">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "general"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("variants")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "variants"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Variants ({variants.length})
          </button>
        </div>

        {/* --- Scrollable Content Area (Unchanged) --- */}
        <div className="overflow-y-auto mt-4 pr-2 flex-1">
          {/* --- TAB 1: GENERAL (Unchanged) --- */}
          {activeTab === "general" && (
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Product Name"
                  name="name"
                  value={parentData.name}
                  onChange={handleParentChange}
                  placeholder="Product Name"
                />
                <InputField
                  label="Category"
                  name="category"
                  value={parentData.category}
                  onChange={handleParentChange}
                  placeholder="Category"
                />
                <TextAreaField
                  label="Description"
                  name="description"
                  value={parentData.description}
                  onChange={handleParentChange}
                  placeholder="Description"
                  span="md:col-span-2"
                />
                <InputField
                  label="Top Notes"
                  name="composition"
                  value={parentData.composition}
                  onChange={handleParentChange}
                  placeholder="Top Notes"
                />
                <InputField
                  label="Base Notes"
                  name="fragranceNotes"
                  value={parentData.fragranceNotes}
                  onChange={handleParentChange}
                  placeholder="Base Notes"
                />
                <InputField
                  label="Heart Notes"
                  name="fragrance"
                  value={parentData.fragrance}
                  onChange={handleParentChange}
                  placeholder="Heart Notes"
                />
              </div>
              <button
                onClick={handleSaveParent}
                disabled={isSaving}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                <FaSave className="inline-block mr-2" /> Save General Details
              </button>
            </div>
          )}

          {/* --- TAB 2: VARIANTS (Unchanged) --- */}
          {activeTab === "variants" && (
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Product Variants
                </h3>
                <button
                  onClick={handleAddNewVariant}
                  className="px-4 py-1.5 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 flex items-center gap-2"
                >
                  <FaPlus className="w-3 h-3" /> Add New
                </button>
              </div>

              {/* Variant Card List */}
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div
                    // 🔽 5. ATTACH THE REF
                    ref={index === newVariantIndex ? newVariantCardRef : null}
                    key={variant.id || `new-${index}`}
                    className={`rounded-lg relative ${
                      variant.isArchived
                        ? "bg-gray-200 opacity-70"
                        : "bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    }`}
                  >
                    {/* --- DEDICATED HEADER (Unchanged) --- */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                      <div>
                        {variant.isArchived && (
                          <span className="text-xs font-bold text-gray-700 bg-gray-300 px-2 py-0.5 rounded-full">
                            ARCHIVED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleSaveVariant(index)}
                          disabled={isSaving}
                          className="px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-green-300 text-xs flex items-center justify-center gap-1"
                        >
                          <FaSave /> Save
                        </button>
                        {variant.isArchived ? (
                          <button
                            onClick={() => handleUnarchiveVariant(index)}
                            disabled={isSaving}
                            title="Unarchive"
                            className="p-2 w-7 h-7 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-blue-300"
                          >
                            <FaUndo size={12} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchiveVariant(index)}
                            disabled={isSaving}
                            title="Archive"
                            className="p-2 w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-red-300"
                          >
                            <FaArchive size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* --- END HEADER --- */}

                    {/* --- INPUT GRID (CARD BODY) (Unchanged) --- */}
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-3">
                      <InputField
                        label="Variant Name"
                        name="name"
                        value={variant.name}
                        onChange={(e) => handleVariantChange(index, e)}
                        placeholder="e.g., 20ml"
                        span="col-span-2 md:col-span-2"
                      />

                      <InputField
                        label="Size (ml)"
                        name="size"
                        type="number"
                        value={variant.size}
                        onChange={(e) => handleVariantChange(index, e)}
                        placeholder="20"
                        span="col-span-1 md:col-span-1"
                      />

                      <InputField
                        label="Stock"
                        name="stock"
                        type="number"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(index, e)}
                        placeholder="100"
                        span="col-span-1 md:col-span-1"
                      />

                      <InputField
                        label="Orig. Price (₹)"
                        name="oprice"
                        type="number"
                        value={variant.oprice}
                        onChange={(e) => handleVariantChange(index, e)}
                        placeholder="1500"
                        span="col-span-1 md:col-span-1"
                      />

                      <InputField
                        label="Cost Price (₹)"
                        name="costPrice"
                        type="number"
                        value={variant.costPrice}
                        onChange={(e) => handleVariantChange(index, e)}
                        placeholder="500"
                        span="col-span-1 md:col-span-1"
                      />

                      <InputField
                        label="Discount (%)"
                        name="discount"
                        type="number"
                        value={variant.discount}
                        onChange={(e) => handleVariantChange(index, e)}
                        placeholder="10"
                        span="col-span-2 sm:col-span-1 md:col-span-2"
                      />
                    </div>
                  </div>
                ))}
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
  // We can use the main 'loading' from ProductContext

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
  // ... (all other calculations are correct) ...
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

  // 🟢 7. RENAME/UPDATE FUNCTION AND TEXT
  const handleProductArchive = async (productId) => {
    const confirmation = window.confirm("Are you sure you want to ARCHIVE this product? It will be hidden from your store.");
    if (confirmation) {
      setLoading(true);
      try {
        await deleteProduct(productId); // This calls the context's archive function
        window.toast.success("Product archived successfully!");
      } catch (error) {
        console.error("❌ Error archiving product:", error);
        window.toast.error("Failed to archive product.");
      } finally {
        setLoading(false);
      }
    }
  };

  // 🟢 8. NEW HANDLER for unarchiving
  const handleProductUnarchive = async (productId) => {
    if (!window.confirm("Are you sure you want to unarchive this product? It will become visible on your store.")) return;
    setLoading(true);
    try {
      await unarchiveProduct(productId);
      // Both lists are refreshed by the context
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

  // 🟢 9. UPDATE TABS
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setIsSidebarOpen(false);
    if (tabName === "reports") {
      getReportData();
    }
    // 🟢 Fetch archived list when clicking "products" tab
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
                  getArchivedProducts(); // Also refresh archived list on close
                }}
              />
            )}

            {/* --- Dashboard Tab (Correct & Unchanged) --- */}
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

            {/* 🟢 10. MODIFIED: Products Tab */}
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

                {/* --- Main Active Products Table --- */}
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
                            {/* 🟢 MODIFIED: Button text and function */}
                            <button onClick={() => handleProductArchive(product.id)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1">
                              <FaArchive className="w-3 h-3" /> {loading ? "Archiving..." : "Archive"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 🟢 11. NEW: Archived Products Section */}
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
                      {/* 🟢 Use the main 'loading' from ProductContext */}
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
            {/* --- Coupons Tab (Correct & Unchanged) --- */}
            {activeTab === "coupons" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold">Manage Coupon Codes</h2>
                  <button onClick={() => setEditingCoupon({ code: "", discountType: "percent", discountValue: 0, minOrderValue: 0, minItemCount: 0, description: "", validFrom: "", validUntil: "", firstOrderOnly: false })} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Add New Coupon</button>
                </div>
                <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min ₹</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Usage/User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Order Only</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid From</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {editingCoupon && (
                        <tr>
                          <td className="p-2"><input placeholder="Code" value={editingCoupon.code || ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, code: e.target.value }))} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="p-2"><select value={editingCoupon.discountType} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, discountType: e.target.value }))} className="border rounded px-2 py-1 w-full"><option value="percent">percent</option><option value="flat">flat</option></select></td>
                          <td className="p-2"><input type="number" placeholder="Value" value={editingCoupon.discountValue ?? 0} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, discountValue: +e.target.value }))} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="p-2"><input type="number" placeholder="Min ₹" value={editingCoupon.minOrderValue ?? 0} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, minOrderValue: +e.target.value }))} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="p-2"><input type="number" placeholder="Min Items" value={editingCoupon.minItemCount ?? 0} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, minItemCount: +e.target.value }))} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="p-2"><input placeholder="Description" value={editingCoupon.description} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, description: e.target.value }))} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="p-2"><input type="number" placeholder="Max usage" value={editingCoupon.maxUsagePerUser ?? ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, maxUsagePerUser: e.target.value === "" ? null : +e.target.value }))} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="p-2 text-center"><input type="checkbox" checked={editingCoupon.firstOrderOnly ?? false} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, firstOrderOnly: e.target.checked }))} /></td>
                          <td className="p-2"><input type="date" value={editingCoupon.validFrom ? new Date(editingCoupon.validFrom).toISOString().split("T")[0] : ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, validFrom: e.target.value }))} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="p-2"><input type="date" value={editingCoupon.validUntil ? new Date(editingCoupon.validUntil).toISOString().split("T")[0] : ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, validUntil: e.target.value }))} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="p-2 space-x-2"><button onClick={saveCoupon} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Save</button><button onClick={() => setEditingCoupon(null)} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button></td>
                        </tr>
                      )}
                      {coupons?.map((c) => (
                        <tr key={c.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{c.code}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{c.discountType}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{c.discountType === "percent" ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                          <td className="px-6 py-4 whitespace-nowrap">₹{c.minOrderValue}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{c.minItemCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{c.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{c.maxUsagePerUser ?? "∞"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">{c.firstOrderOnly ? "✅" : "❌"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{new Date(c.validFrom).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{new Date(c.validUntil).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap space-x-2"><button onClick={() => setEditingCoupon({ ...c })} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Edit</button><button onClick={() => deleteCoupon(c.id)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- Orders Tab (Correct & Unchanged) --- */}
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

            {/* --- Users Tab (Correct & Unchanged) --- */}
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


            {/* --- Queries Tab (Correct & Unchanged) --- */}
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

            {/* --- Carts & Wishlists Tab (Correct & Unchanged) --- */}
            {activeTab === "carts" && (
              <CartsWishlistsTab
                flatCarts={abandonedCarts}
                stats={wishlistStats}
              />
            )}

            {/* --- Pincodes Tab (Correct & Unchanged) --- */}
            {activeTab === "pincodes" && <PincodeManager />}

          </div>
        </div>
      </>
    )
  );
};

export default AdminPanel;