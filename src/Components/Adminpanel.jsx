// src/components/Adminpanel.jsx

import React, { useState, useContext, useEffect, useMemo, useCallback } from "react";
import { OrderContext } from "../contexts/OrderContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ImageUploadModal from "./ImageUploadModal";
import { CouponContext } from "../contexts/CouponContext";
import { toast, ToastContainer } from "react-toastify";
import OrderChart from "./OrderChart";
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement } from 'chart.js';
import 'chart.js/auto';
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement);

const AdminPanel = () => {
    // Existing context and state variables
    const [activeTab, setActiveTab] = useState("dashboard");
    const [openModal, setOpenModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [orderStatusTab, setOrderStatusTab] = useState("All");
    const [orderSearchQuery, setOrderSearchQuery] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [querySearch, setQuerySearch] = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);
    
    const navigate = useNavigate();
    const { user, isLoaded } = useUser();
    
    // CONTEXTS
    const { products, getProducts, updateProduct, deleteProduct, loading: productsLoading, addProduct } = useContext(ProductContext);
    const { orders, getorders, updateOrderStatus, getSingleOrderDetails } = useContext(OrderContext);
    const { queries, getquery, deleteQuery } = useContext(ContactContext);
    const { userdetails, users, getallusers } = useContext(UserContext);
    const { cart, wishlist } = useContext(CartContext);
    
    // Coupon state management
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [couponForm, setCouponForm] = useState({ code: "", discount: "", expiryDate: "" });
    const { coupons, refreshCoupons, saveCoupon, deleteCoupon } = useContext(CouponContext);

    // --- Data Fetching and Effects ---
    useEffect(() => {
        if (isLoaded && userdetails && userdetails.role === "admin") {
            getallusers();
            getquery();
            getorders(false, true); // Fetch all orders for admin
            getProducts();
            refreshCoupons(); // Fetch coupons on load
        }
    }, [isLoaded, userdetails, getallusers, getquery, getorders, getProducts, refreshCoupons]);

    // Check for admin role
    useEffect(() => {
        if (isLoaded && userdetails && userdetails.role !== "admin") {
            navigate("/");
        } else if (isLoaded && !user) {
            navigate("/login");
        }
    }, [isLoaded, userdetails, user, navigate]);

    // --- Coupon Functions ---
    const handleCouponChange = (e) => {
        const { name, value } = e.target;
        setCouponForm({ ...couponForm, [name]: value });
    };

    const handleSaveCoupon = async (e) => {
        e.preventDefault();
        try {
            await saveCoupon({
                ...couponForm,
                discount: parseFloat(couponForm.discount),
                id: editingCoupon ? editingCoupon._id : null
            });
            setCouponForm({ code: "", discount: "", expiryDate: "" });
            setEditingCoupon(null);
            toast.success("Coupon saved successfully!");
        } catch (error) {
            toast.error("Failed to save coupon.");
        }
    };

    const handleEditCoupon = (coupon) => {
        setEditingCoupon(coupon);
        setCouponForm({
            code: coupon.code,
            discount: coupon.discount,
            expiryDate: coupon.expiryDate.split("T")[0] // Format date for input
        });
    };

    // --- Product Functions ---
    const handleOpenProductModal = (product = null) => {
        setEditingProduct(product);
        setOpenModal(true);
    };

    // --- The rest of the functions (handleProductUpdate, handleProductDelete, etc.) are here as per your original file ---
    const handleProductUpdate = useCallback(async (updatedProduct) => {
      await updateProduct(updatedProduct);
      setEditingProduct(null);
    }, [updateProduct]);
    
    const handleProductDelete = useCallback(async (productId) => {
      await deleteProduct(productId);
    }, [deleteProduct]);

    const handleBulkDelete = async () => {
        if (window.confirm("Are you sure you want to delete the selected products?")) {
          setLoading(true);
        try {
            await Promise.all(selectedProducts.map(id => deleteProduct(id)));
            toast.success("Selected products deleted successfully.");
        } catch (error) {
            console.error("Error during bulk delete:", error);
            toast.error("Failed to delete products.");
        } finally {
            setLoading(false);
            setSelectedProducts([]);
        }
        }
    };

    const handleOrderStatusUpdate = useCallback(async (orderId, newStatus) => {
        await updateOrderStatus(orderId, newStatus);
    }, [updateOrderStatus]);

    const handleOrderDetails = useCallback(async (orderId) => {
        setDetailsLoading(true);
        try {
            const orderDetails = await getSingleOrderDetails(orderId);
            if (!orderDetails) {
                toast.error("Order details not found.");
                return;
            }
            setSelectedOrder(orderDetails);
        } catch (error) {
            console.error("Error fetching order products:", error);
            toast.error("Failed to load order details.");
        } finally {
            setDetailsLoading(false);
        }
    }, [getSingleOrderDetails]);

    const handleProductSelection = (productId) => {
        if (selectedProducts.includes(productId)) {
            setSelectedProducts(selectedProducts.filter(id => id !== productId));
        } else {
            setSelectedProducts([...selectedProducts, productId]);
        }
    };

    // Memoized data (unchanged)
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const totalUsers = users.length;
    const totalQueries = queries.length;
    const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
    const cancelledOrders = orders.filter(o => o.status === "Order Cancelled").length;
    const processingOrders = orders.filter(o => o.status !== "Delivered" && o.status !== "Order Cancelled").length;
    const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0), [orders]);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const productSalesMap = useMemo(() => {
      const sales = {};
      (orders || []).forEach(order => {
        if (order.products) {
          order.products.forEach(p => {
            sales[p.productId] = (sales[p.productId] || 0) + (p.quantity || 0);
          });
        }
      });
      return sales;
    }, [orders]);
    const topSellingProducts = useMemo(() => {
      return Object.entries(productSalesMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id, count]) => {
          const product = products.find(p => p.id === id);
          return product ? { ...product, salesCount: count } : null;
        }).filter(Boolean);
    }, [productSalesMap, products]);
    const dailyRevenueData = useMemo(() => {
      const salesByDay = {};
      orders.forEach(order => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        salesByDay[date] = (salesByDay[date] || 0) + (order.totalAmount || 0);
      });
      return Object.keys(salesByDay).map(date => ({ date, revenue: salesByDay[date] }));
    }, [orders]);
    const newUsersThisMonth = useMemo(() => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return (users || []).filter(user => new Date(user.createdAt) > thirtyDaysAgo).length;
    }, [users]);
    const usersWithOrdersAndQueries = useMemo(() => {
      return (users || []).map((user) => ({
        ...user,
        orders: orders.filter((order) => order.userId === user.id),
        queries: queries.filter((query) => query.email === user.email),
      }));
    }, [users, orders, queries]);
    const filteredUsers = useMemo(() => usersWithOrdersAndQueries.filter(
      (user) =>
        user?.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user?.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
    ), [usersWithOrdersAndQueries, userSearchQuery]);
    const filteredQueries = useMemo(() => queries.filter(query =>
      query.name.toLowerCase().includes(querySearch.toLowerCase()) ||
      query.email.toLowerCase().includes(querySearch.toLowerCase())
    ), [queries, querySearch]);
    const filteredOrders = useMemo(() => orders
      .filter(order => orderStatusTab === "All" || order.status === orderStatusTab)
      .filter(order => String(order.orderId).toLowerCase().includes(orderSearchQuery.toLowerCase()))
      , [orders, orderStatusTab, orderSearchQuery]);

    // Guard clause for non-admin users or if user details are not yet loaded
    if (!isLoaded || !userdetails || userdetails.role !== "admin") {
        return <div className="p-4 text-center text-xl font-bold text-gray-800">Access Denied</div>;
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 text-white">
            <ToastContainer />
            
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-gray-800 p-4 space-y-4 md:space-y-6">
                <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
                <nav className="space-y-2 flex flex-col md:block">
                    {["dashboard", "products", "orders", "users", "coupons", "queries", "carts"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full text-left py-2 px-4 rounded transition duration-200 ${activeTab === tab ? "bg-gray-700 font-semibold" : "hover:bg-gray-700"}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 p-6 overflow-auto">
                {/* Dashboard Tab */}
                {activeTab === "dashboard" && (
                  <div className="space-y-8">
                      <h2 className="text-3xl font-bold text-white mb-6">Admin Dashboard</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                          <h3 className="text-lg font-medium text-gray-400">Total Revenue</h3>
                          <p className="mt-1 text-3xl font-bold text-white">₹{totalRevenue.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                          <h3 className="text-lg font-medium text-gray-400">Total Orders</h3>
                          <p className="mt-1 text-3xl font-bold text-white">{totalOrders}</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                          <h3 className="text-lg font-medium text-gray-400">Total Products</h3>
                          <p className="mt-1 text-3xl font-bold text-white">{totalProducts}</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                          <h3 className="text-lg font-medium text-gray-400">Total Users</h3>
                          <p className="mt-1 text-3xl font-bold text-white">{totalUsers}</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                          <h3 className="text-lg font-medium text-gray-400">Average Order Value</h3>
                          <p className="mt-1 text-3xl font-bold text-white">₹{averageOrderValue.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                          <h3 className="text-lg font-medium text-gray-400">Pending Queries</h3>
                          <p className="mt-1 text-3xl font-bold text-white">{totalQueries}</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                          <h3 className="text-lg font-medium text-gray-400">New Users (30 Days)</h3>
                          <p className="mt-1 text-3xl font-bold text-white">{newUsersThisMonth}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                          <h3 className="text-xl font-semibold mb-4 text-white">Orders Status Breakdown</h3>
                          <OrderChart
                            delivered={deliveredOrders}
                            pending={processingOrders}
                            cancelled={cancelledOrders}
                          />
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                          <h3 className="text-xl font-semibold mb-4 text-white">Revenue Trend (Last 30 Days)</h3>
                          <Line data={{
                            labels: dailyRevenueData.map(d => d.date),
                            datasets: [{
                              label: 'Daily Revenue',
                              data: dailyRevenueData.map(d => d.revenue),
                              backgroundColor: 'rgba(75, 192, 192, 0.2)',
                              borderColor: 'rgba(75, 192, 192, 1)',
                              tension: 0.1
                            }]
                          }} />
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md col-span-1 lg:col-span-2">
                          <h3 className="text-xl font-semibold mb-4 text-white">Top 5 Selling Products</h3>
                          <Bar data={{
                            labels: topSellingProducts.map(p => p.name),
                            datasets: [{
                              label: 'Total Sales',
                              data: topSellingProducts.map(p => p.salesCount),
                              backgroundColor: 'rgba(153, 102, 255, 0.6)'
                            }]
                          }} />
                        </div>
                      </div>
                  </div>
                )}
                
                {/* Products Tab */}
                {activeTab === "products" && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold">Manage Products</h2>
                        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                            <button
                                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                                onClick={() => handleOpenProductModal()}
                            >
                                Add New Product
                            </button>
                            <button
                                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleBulkDelete}
                                disabled={selectedProducts.length === 0 || loading}
                            >
                                {loading ? "Deleting..." : `Delete Selected (${selectedProducts.length})`}
                            </button>
                        </div>
                        
                        {/* The ImageUploadModal component is now correctly integrated here */}
                        {openModal && (
                            <ImageUploadModal
                                isopen={openModal}
                                onClose={() => setOpenModal(false)}
                                editingProduct={editingProduct} // Pass the editing product
                            />
                        )}
                        
                        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            <input type="checkbox" onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedProducts(products.map(p => p.id));
                                                } else {
                                                    setSelectedProducts([]);
                                                }
                                            }} />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Image</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Original Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Discount (%)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Size (ml)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {products?.map((product) => editingProduct && editingProduct.id === product.id ? (
                                        <tr key={product.id}>
                                            <td className="px-6 py-4 whitespace-nowrap"></td>
                                            <td className="px-6 py-4 whitespace-nowrap">{product.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <img src={Array.isArray(editingProduct.images) ? editingProduct.images[0] : editingProduct.images} alt={editingProduct.name} className="w-12 h-12 object-cover rounded-md" />
                                                <br />
                                                <input type="file" accept="image/*" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const imageUrl = URL.createObjectURL(file);
                                                        setEditingProduct({ ...editingProduct, images: [imageUrl] });
                                                    }
                                                }} className="mt-2 text-sm" />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap"><input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="border rounded px-2 py-1 bg-gray-700" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><input type="number" value={editingProduct.oprice} onChange={(e) => setEditingProduct({ ...editingProduct, oprice: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-24 bg-gray-700" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><input type="number" value={editingProduct.discount} onChange={(e) => setEditingProduct({ ...editingProduct, discount: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-24 bg-gray-700" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><input type="number" value={editingProduct.size} onChange={(e) => setEditingProduct({ ...editingProduct, size: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-24 bg-gray-700" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button className="bg-green-500 text-white px-3 py-1 rounded-md mr-2" onClick={() => handleProductUpdate(editingProduct)}>Save</button>
                                                <button className="bg-gray-500 text-white px-3 py-1 rounded-md" onClick={() => setEditingProduct(null)}>Cancel</button>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={product.id}>
                                            <td className="px-6 py-4 whitespace-nowrap"><input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => handleProductSelection(product.id)} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap">{product.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <img src={Array.isArray(product.images) ? product.images[0] : product.images} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">₹{product.oprice}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{product.discount}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{product.size}</td>
                                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                <button className="bg-yellow-500 text-white px-3 py-1 rounded-md" onClick={() => handleOpenProductModal(product)}>Edit</button>
                                                <button className="bg-red-500 text-white px-3 py-1 rounded-md" onClick={() => handleProductDelete(product.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === "orders" && (
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold">Manage Orders</h2>
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
                            <input
                                type="text"
                                placeholder="Search by Order ID..."
                                value={orderSearchQuery}
                                onChange={(e) => setOrderSearchQuery(e.target.value)}
                                className="w-full md:w-auto p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex space-x-2">
                                {["All", "Processing", "Shipped", "Delivered", "Order Cancelled"].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setOrderStatusTab(status)}
                                        className={`px-4 py-2 rounded-lg transition-colors duration-200 ${orderStatusTab === status ? "bg-blue-500 text-white" : "bg-gray-700 text-white hover:bg-blue-500"}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.orderId}>
                                            <td className="px-6 py-4 whitespace-nowrap">{order.orderId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{order.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">₹{order.totalAmount?.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value)}
                                                    className="bg-gray-700 text-white rounded p-1"
                                                >
                                                    {["Processing", "Shipped", "Delivered", "Order Cancelled"].map(status => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleOrderDetails(order.orderId)}
                                                    className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {detailsLoading && <p>Loading order details...</p>}
                        {selectedOrder && (
                            <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
                                <h3 className="text-xl font-bold mb-2">Order Details for {selectedOrder.orderId}</h3>
                                {/* Display order products, shipping info, etc. here */}
                                <pre className="whitespace-pre-wrap">{JSON.stringify(selectedOrder, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold">Manage Users</h2>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Orders</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Queries</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.orders.length}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.queries.length}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Coupons Tab */}
                {activeTab === "coupons" && (
                    <div className="space-y-6 p-6 bg-gray-800 rounded-lg shadow-lg">
                        <h2 className="text-3xl font-bold mb-4">{editingCoupon ? "Edit Coupon" : "Add New Coupon"}</h2>
                        <form onSubmit={handleSaveCoupon} className="space-y-4">
                            <input
                                type="text"
                                name="code"
                                value={couponForm.code}
                                onChange={handleCouponChange}
                                placeholder="Coupon Code"
                                required
                                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="number"
                                name="discount"
                                value={couponForm.discount}
                                onChange={handleCouponChange}
                                placeholder="Discount (%)"
                                required
                                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="date"
                                name="expiryDate"
                                value={couponForm.expiryDate}
                                onChange={handleCouponChange}
                                required
                                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex space-x-2">
                                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded transition hover:bg-blue-600">
                                    {editingCoupon ? "Update Coupon" : "Add Coupon"}
                                </button>
                                {editingCoupon && (
                                    <button type="button" onClick={() => { setEditingCoupon(null); setCouponForm({ code: "", discount: "", expiryDate: "" }); }} className="bg-gray-500 text-white px-4 py-2 rounded transition hover:bg-gray-600">
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </form>
                        <h3 className="text-2xl font-bold mt-8 mb-4">Existing Coupons</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Discount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expires</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {coupons.map((coupon) => (
                                        <tr key={coupon._id} className="hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">{coupon.code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{coupon.discount}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                <button onClick={() => handleEditCoupon(coupon)} className="bg-yellow-500 text-white px-3 py-1 rounded transition hover:bg-yellow-600">Edit</button>
                                                <button onClick={() => deleteCoupon(coupon._id)} className="bg-red-500 text-white px-3 py-1 rounded transition hover:bg-red-600">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Queries Tab */}
                {activeTab === "queries" && (
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold">Manage Queries</h2>
                        <input
                            type="text"
                            placeholder="Search queries..."
                            value={querySearch}
                            onChange={(e) => setQuerySearch(e.target.value)}
                            className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Message</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {filteredQueries.map((query) => (
                                        <tr key={query.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{query.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{query.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{query.subject}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{query.message}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(query.createdAt).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600" onClick={() => deleteQuery(query.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {/* Carts & Wishlists Tab */}
                {activeTab === "carts" && (
                    <div className="space-y-4 p-6 bg-gray-800 rounded-lg shadow">
                        <h2 className="text-2xl font-bold">Carts & Wishlists (Admin View)</h2>
                        <p className="text-gray-400">This section is for future implementation to show all user carts and wishlists. </p>
                        <p className="text-gray-400">You can use the existing `CartContext` to fetch and manage this data.</p>
                        <p className="text-white font-semibold">Current cart count: {cart.length}</p>
                        <p className="text-white font-semibold">Current wishlist count: {wishlist.length}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
