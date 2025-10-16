// src/components/Adminpanel.jsx
import React, { useState, useContext, useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import { UserContext } from "../contexts/UserContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { AdminContext } from "../contexts/AdminContext";
import { CouponContext } from "../contexts/CouponContext";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ImageUploadModal from "./ImageUploadModal";
import PincodeManager from "./PincodeManager";
import { toast, ToastContainer } from "react-toastify";
import OrderChart from "./OrderChart";
import Reports from "./Reports";
import { FaTachometerAlt, FaBox, FaTicketAlt, FaClipboardList, FaUsers, FaEnvelope, FaShoppingCart, FaMoneyBillWave, FaBars, FaTimes, FaMapMarkerAlt, FaTimesCircle, FaFlagCheckered, FaDownload, FaPercentage, FaUserPlus, FaUserCheck } from 'react-icons/fa'; import { Line, Pie } from 'react-chartjs-2';
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

// --- CSV Export Utility ---
const downloadCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    toast.error("No data available to export.");
    return;
  }
  // Flatten complex objects for better CSV readability
  const flattenedData = data.map(item => {
    const flatItem = {};
    for (const key in item) {
      if (typeof item[key] === 'object' && item[key] !== null) {
        if (Array.isArray(item[key])) {
          flatItem[key] = JSON.stringify(item[key]); // Stringify arrays
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


// Placeholder components for the new UI
const OrderDetailsPopup = ({ order, onClose }) => {
  if (!order) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
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
            <p>
              {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state}, {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}
            </p>
            <p><strong>Landmark:</strong> {order.shippingAddress?.landmark || 'N/A'}</p>
            <p><strong>Contact:</strong> {order.shippingAddress?.phone || 'N/A'}</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-lg">Products</h3>
          <ul className="list-disc list-inside space-y-2">
            {(order.products || []).map(p => (
              <li key={p.productId} className="flex items-center space-x-2">
                <img src={p.imageurl} alt={p.productName} className="w-12 h-12 object-cover rounded" />
                <span>{p.productName} (x{p.quantity}) - ₹{p.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const CartsWishlistsTab = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Carts & Wishlists Analytics</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Abandoned Carts</h3>
        <p className="text-gray-500">This section would list the contents of abandoned carts to help with sales recovery. (Future Feature)</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Most Popular Wishlist Items</h3>
        <p className="text-gray-500">This section would show which products are most frequently added to wishlists. (Future Feature)</p>
      </div>
    </div>
  );
};

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

const NewVsReturningCustomersChart = ({ orders, users }) => {
  // Guard against missing data
  if (!orders || !users || users.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">New vs. Returning Customers</h3>
        <p>Not enough data to display.</p>
      </div>
    );
  }

  // Count how many orders each user has
  const orderCountsByUserId = orders.reduce((acc, order) => {
    acc[order.userId] = (acc[order.userId] || 0) + 1;
    return acc;
  }, {});

  const newCustomerCount = Object.values(orderCountsByUserId).filter(count => count === 1).length;
  const returningCustomerCount = Object.values(orderCountsByUserId).filter(count => count > 1).length;

  const newVsReturningData = {
    labels: ['New Customers', 'Returning Customers'],
    datasets: [
      {
        data: [newCustomerCount, returningCustomerCount],
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


const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for sidebar

  // Contexts
  const { products, updateProduct, deleteProduct } = useContext(ProductContext);
  const { userdetails } = useContext(UserContext);
  const { queries, getquery } = useContext(ContactContext);
  const { coupons, editingCoupon, setEditingCoupon, saveCoupon, deleteCoupon, refreshCoupons } = useContext(CouponContext);
  const { users, orders, getAllUsers, getAllOrders, updateOrderStatus, getSingleOrderDetails, reportOrders, getReportData, cancelOrder, loading: adminLoading } = useContext(AdminContext);

  const { user } = useUser();
  const [editingUser, setEditingUser] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderStatusTab, setOrderStatusTab] = useState("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // --- Data Fetching and Effects ---
  useEffect(() => {
    if (userdetails?.role !== "admin" && userdetails !== null) {
      navigate("/");
    }
  }, [userdetails, navigate]);

  useEffect(() => {
    getAllUsers();
    getAllOrders();
    getquery();
    refreshCoupons();
  }, []);

  // --- Analysis Data Calculation ---
  const successfulOrders = orders?.filter(order => order.status !== "Order Cancelled");
  const totalOrders = orders?.length;
  const totalProducts = products?.length;
  const totalUsers = users?.length;
  const totalQueries = queries?.length;
  const deliveredOrders = orders?.filter(o => o.status === "Delivered")?.length;
  const cancelledOrders = orders?.filter(o => o.status === "Order Cancelled")?.length;
  const cancelledOrdersValue = orders
    ?.filter(order => order.status === "Order Cancelled")
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const processingOrders = orders?.filter(o => o.status === "Processing" || o.status === "Order Placed" || o.status === "Shipped")?.length;
  const totalRevenue = successfulOrders?.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = successfulOrders?.length > 0 ? totalRevenue / successfulOrders.length : 0;
  const conversionRate = totalUsers > 0 ? (successfulOrders.length / totalUsers) * 100 : 0; const newCustomers = users?.filter(u => u.orders?.length === 1).length;
  const returningCustomers = users?.filter(u => u.orders?.length > 1).length;


  // --- Functions (existing) ---
  const handleProductUpdate = async () => {
    setLoading(true);
    try {
      // Create a new object to hold the updated data
      let updatedData = {
        ...editingProduct,
        discount: Number(editingProduct.discount),
        oprice: Number(editingProduct.oprice),
        size: Number(editingProduct.size),
        quantity: Number(editingProduct.quantity),
        stock: Number(editingProduct.stock),
        costPrice: Number(editingProduct.costPrice),
        category: editingProduct.category,
      };

      // Check if imageurl is a string (indicating a single new image from the file input)
      if (typeof updatedData.imageurl === 'string' && updatedData.imageurl.startsWith('blob:')) {
        // Convert the single image URL into an array
        updatedData.imageurl = [updatedData.imageurl];
      }

      await updateProduct(updatedData.id, updatedData);
      setEditingProduct(null);
      toast.success("Product updated successfully!");
    } catch (error) {
      console.error("❌ Error updating product:", error);
      toast.error("Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  const handleProductDelete = async (productId) => {
    const confirmation = window.confirm("Are you sure you want to delete this product?");
    if (confirmation) {
      setLoading(true);
      try {
        await deleteProduct(productId);
        setLoading(false);
        toast.success("Product deleted successfully!");
      } catch (error) {
        console.error("❌ Error deleting product:", error);
        setLoading(false);
        toast.error("Failed to delete product.");
      }
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
      toast.error("Failed to load order details.");
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
      toast.success("User updated successfully!");
      setEditingUser(null);
      getAllUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Failed to update user.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch(`${BASE}/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User deleted successfully!");
      getAllUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user.");
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    // 🟢 Call the update function and get the new order data
    const updatedOrder = await updateOrderStatus(orderId, newStatus);
    if (updatedOrder) {
      // 🟢 Update the local orders state with the new data
      getAllOrders();
    }
  };

  const handleCancelOrder = async (order) => {
    // Check for confirmation (good practice)
    if (!window.confirm(`Are you sure you want to cancel Order #${order.id}?`)) return;

    // Pass the full details to the context, indicating it's an Admin action (true)
    await cancelOrder(order.id, order.paymentMode, order.totalAmount);
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setIsSidebarOpen(false);

    if (tabName === "reports") {
      getReportData();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // --- JSX Rendering ---
  return (
    user && userdetails?.role === "admin" && (
      <div className="flex min-h-screen bg-gray-100 text-gray-800 pt-[60px]">
        <ToastContainer />

        {/* Hamburger Menu Icon for mobile */}
        <div className="md:hidden absolute top-[50px] right-[5px] p-4 z-100">
          <button onClick={toggleSidebar} className="text-gray-800 text-2xl">
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Sidebar */}
        <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
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

          {/* Main content sections */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold">Admin Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* KPI Cards */}
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
                <NewVsReturningCustomersChart users={users} orders={orders} />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <OrderChart orders={orders} />
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <Reports
              products={products}
              users={users}
              orders={reportOrders}
            />
          )}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount (%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size (ml)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products?.map((product) =>
                      editingProduct && editingProduct.id === product.id ? (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{product.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <img src={Array.isArray(editingProduct.imageurl) ? editingProduct.imageurl[0] : editingProduct.imageurl} alt={editingProduct.name} className="w-12 h-12 object-cover rounded-md" />
                            {/* The file input is part of your original code, kept as is */}
                            <input
                              type="file"
                              accept="image/*"
                              // Change the onChange handler here
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files.length > 0) {
                                  const newImageUrl = URL.createObjectURL(files[0]);
                                  setEditingProduct({
                                    ...editingProduct,
                                    imageurl: [newImageUrl], // ALWAYS wrap the new URL in an array
                                  });
                                }
                              }}
                              className="mt-2 text-xs"
                            />
                          </td>
                          <td className="px-6 py-4"><input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="px-6 py-4"><input type="text" value={editingProduct.category || ''} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="px-6 py-4"><input type="number" value={editingProduct.costPrice || ''} onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-24" /></td>
                          <td className="px-6 py-4"><input type="number" value={editingProduct.oprice} onChange={(e) => setEditingProduct({ ...editingProduct, oprice: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-24" /></td>
                          <td className="px-6 py-4"><input type="number" value={editingProduct.discount} onChange={(e) => setEditingProduct({ ...editingProduct, discount: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-16" /></td>
                          <td className="px-6 py-4"><input type="number" value={editingProduct.size} onChange={(e) => setEditingProduct({ ...editingProduct, size: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-16" /></td>
                          <td className="px-6 py-4"><input type="number" value={editingProduct.stock} onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-16" /></td>
                          <td className="px-6 py-4 whitespace-nowrap space-x-2"><button onClick={handleProductUpdate} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Save</button><button onClick={() => setEditingProduct(null)} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button></td>
                        </tr>
                      ) : (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{product.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap"><img src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl} alt={product.name} className="w-12 h-12 object-cover rounded-md" /></td>
                          <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{product.category || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">₹{product.costPrice || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">₹{product.oprice}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{product.discount}%</td>
                          <td className="px-6 py-4 whitespace-nowrap">{product.size}ml</td>
                          <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                          <td className="px-6 py-4 whitespace-nowrap space-x-2"><button onClick={() => setEditingProduct({ ...product, imageurl: Array.isArray(product.imageurl) ? product.imageurl : [product.imageurl] })} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Edit</button><button onClick={() => handleProductDelete(product.id)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">{loading ? "deleting" : "delete"}</button></td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Manage Orders</h2>
                <button onClick={() => downloadCSV(orders, 'orders.csv')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                  <FaDownload className="inline-block mr-2" />Export Orders
                </button>
              </div>              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
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
                      {(order.status !== "Order Cancelled" && order.status !== "Delivered") && (// Check against the standardized status
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

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Manage Users</h2>
                <button onClick={() => downloadCSV(users, 'users.csv')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                  <FaDownload className="inline-block mr-2" />Export Users
                </button>
              </div>
              {/* Search Bar */}
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
                // User Details View
                <div className="max-w-5xl mx-auto space-y-6">

                  {/* Back Button */}
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    &larr; <span>Back to Users</span>
                  </button>

                  {/* User Header */}
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

                  {/* Contact & Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Info */}
                    <div className="bg-white p-6 rounded-xl shadow space-y-3">
                      <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Contact Information</h3>
                      <p><strong>Email:</strong> {editingUser.email}</p>
                      <p><strong>Phone:</strong> {editingUser.phone || 'N/A'}</p>
                      <p><strong>Role:</strong> {editingUser.role}</p>
                    </div>

                    {/* Addresses */}
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

                  {/* Order History */}
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
                // Users Grid/List View
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


          {/* Queries Tab */}
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

          {/* Carts & Wishlists Tab */}
          {activeTab === "carts" && <CartsWishlistsTab />}

          {activeTab === "pincodes" && <PincodeManager />}
        </div>
      </div>
    )
  );
};

export default AdminPanel;