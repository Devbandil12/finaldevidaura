import React, { useState, useContext, useEffect, useMemo, useCallback } from "react";
import { OrderContext } from "../contexts/OrderContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { CouponContext } from "../contexts/CouponContext";
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext";
import { toast, ToastContainer } from "react-toastify";
import ImageUploadModal from "./ImageUploadModal";
import OrderChart from "./OrderChart";
import { FaTachometerAlt, FaBox, FaTicketAlt, FaClipboardList, FaUsers, FaEnvelope, FaShoppingCart, FaHeart, FaBars, FaTimes } from "react-icons/fa";

// Helper function to format currency
const formatCurrency = (amount) => `₹${Number(amount).toFixed(2)}`;

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderStatusTab, setOrderStatusTab] = useState("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [querySearch, setQuerySearch] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  // Auto-collapse sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { products, getProducts, updateProduct, deleteProduct: deleteProductFromContext } = useContext(ProductContext);
  const { orders, getorders, updateOrderStatus, getSingleOrderDetails } = useContext(OrderContext);
  const { queries, getquery, deleteQuery } = useContext(ContactContext);
  const { coupons, refreshCoupons, deleteCoupon, saveCoupon, editingCoupon, setEditingCoupon } = useContext(CouponContext);
  const { userdetails, getallusers, users } = useContext(UserContext);
  const { carts, wishlists, getCarts, getWishlists } = useContext(CartContext);

  // Data Fetching
  useEffect(() => {
    getProducts();
    getorders(true, true);
    getquery();
    getallusers();
    // These functions need to be implemented in CartContext for admin view
    // getCarts(); 
    // getWishlists();
  }, [getProducts, getorders, getquery, getallusers]);

  // --- Analytics Data Calculation ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last7Days = new Date(today);
  last7Days.setDate(today.getDate() - 7);
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const deliveredOrders = useMemo(() => orders.filter(o => o.status === "Delivered"), [orders]);
  const totalRevenue = useMemo(() => deliveredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0), [deliveredOrders]);

  const todayRevenue = useMemo(() => deliveredOrders.filter(o => new Date(o.createdAt) >= today).reduce((sum, order) => sum + (order.totalAmount || 0), 0), [deliveredOrders]);
  const thisWeekRevenue = useMemo(() => deliveredOrders.filter(o => new Date(o.createdAt) >= last7Days).reduce((sum, order) => sum + (order.totalAmount || 0), 0), [deliveredOrders]);
  const thisMonthRevenue = useMemo(() => deliveredOrders.filter(o => new Date(o.createdAt) >= firstDayOfMonth).reduce((sum, order) => sum + (order.totalAmount || 0), 0), [deliveredOrders]);

  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalUsers = users.length;
  const totalQueries = queries.length;

  const newUsersToday = useMemo(() => users.filter(u => new Date(u.createdAt) >= today).length, [users]);
  const newUsersThisWeek = useMemo(() => users.filter(u => new Date(u.createdAt) >= last7Days).length, [users]);

  // Top 5 Selling Products
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
      }).filter(Boolean); // Filter out any null values
  }, [productSalesMap, products]);

  // Most Popular Wishlist Items (Placeholder logic)
  const popularWishlistItems = useMemo(() => {
    // Note: This is a placeholder. A proper implementation would require a backend endpoint
    // to retrieve all users' wishlists, as the current CartContext is user-specific.
    const mockWishlistData = [
      { id: 'mock-prod-1', name: 'Vintage T-shirt', count: 50 },
      { id: 'mock-prod-2', name: 'Leather Wallet', count: 35 },
      { id: 'mock-prod-3', name: 'Designer Scarf', count: 22 },
      { id: 'mock-prod-4', name: 'Smart Watch', count: 18 },
      { id: 'mock-prod-5', name: 'Bluetooth Speaker', count: 15 },
    ];
    return mockWishlistData;
  }, []);

  // Refactored functions
  const handleProductUpdate = useCallback(async (updatedProduct) => {
    await updateProduct(updatedProduct);
    setEditingProduct(null);
  }, [updateProduct]);

  const handleProductDelete = useCallback(async (productId) => {
    if (userdetails?.role !== "admin") return;
    setLoading(true);
    await deleteProductFromContext(productId);
    setLoading(false);
  }, [userdetails?.role, deleteProductFromContext]);

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

      // Mock order timeline for professional look
      const timeline = [
        { status: 'Order Placed', date: new Date(orderDetails.createdAt) },
        ...(orderDetails.status !== 'Order Placed' ? [{ status: 'Processing', date: new Date(new Date(orderDetails.createdAt).getTime() + 1000 * 60 * 60) }] : []),
        ...(orderDetails.status === 'Shipped' || orderDetails.status === 'Delivered' ? [{ status: 'Shipped', date: new Date(new Date(orderDetails.createdAt).getTime() + 1000 * 60 * 60 * 24) }] : []),
        ...(orderDetails.status === 'Delivered' ? [{ status: 'Delivered', date: new Date(new Date(orderDetails.createdAt).getTime() + 1000 * 60 * 60 * 48) }] : []),
        ...(orderDetails.status === 'Order Cancelled' ? [{ status: 'Order Cancelled', date: new Date(new Date(orderDetails.createdAt).getTime() + 1000 * 60 * 10) }] : []),
      ];

      setSelectedOrder({ ...orderDetails, timeline });
    } catch (error) {
      console.error("Error fetching order products:", error);
      toast.error("Failed to load order details.");
    } finally {
      setDetailsLoading(false);
    }
  }, [getSingleOrderDetails]);

  const handleUserSelect = useCallback((user) => {
    const userOrders = (orders || []).filter(order => order.userId === user.id);
    const userQueries = (queries || []).filter(query => query.email === user.email);
    const CLV = userOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    setSelectedUser({
      ...user,
      orders: userOrders,
      queries: userQueries,
      CLV: CLV
    });
  }, [orders, queries]);

  const filteredOrders = useMemo(() => (orders || []).filter(order =>
    (order.orderId?.toLowerCase().includes(orderSearchQuery.toLowerCase()) || orderSearchQuery === "") &&
    (orderStatusTab === "All" || order.status?.toLowerCase() === orderStatusTab.toLowerCase())
  ), [orders, orderSearchQuery, orderStatusTab]);

  const usersWithOrdersAndQueries = useMemo(() => {
    return (users || []).map(user => {
      const userOrders = (orders || []).filter(order => order.userId === user.id);
      const userQueries = (queries || []).filter(query => query.email === user.email);
      return {
        ...user,
        orders: userOrders,
        queries: userQueries,
      };
    });
  }, [users, orders, queries]);

  const filteredUsers = useMemo(() => usersWithOrdersAndQueries.filter(user =>
    user?.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user?.phone?.includes(userSearchQuery)
  ), [usersWithOrdersAndQueries, userSearchQuery]);

  const filteredQueries = useMemo(() => (queries || []).filter(query =>
    query?.name?.toLowerCase().includes(querySearch.toLowerCase()) ||
    query?.email?.toLowerCase().includes(querySearch.toLowerCase())
  ), [queries, querySearch]);
  
  const filteredProducts = useMemo(() => (products || []).filter(product => 
    product.name?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(productSearchQuery.toLowerCase())
  ), [products, productSearchQuery]);

  // Check for admin role
  if (userdetails?.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-2">You do not have the necessary permissions to view this page.</p>
      </div>
    </div>;
  }

  // Calculate coupon performance metrics
  const couponMetrics = useMemo(() => {
    const metrics = {};
    (coupons || []).forEach(coupon => {
      metrics[coupon.id] = {
        usageCount: 0,
        totalRevenue: 0,
      };
    });
    (orders || []).forEach(order => {
      if (order.couponId && metrics[order.couponId]) {
        metrics[order.couponId].usageCount++;
        metrics[order.couponId].totalRevenue += (order.totalAmount || 0);
      }
    });
    return metrics;
  }, [coupons, orders]);

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      
      {/* Sidebar Navigation */}
      <aside className={`bg-gray-800 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} h-screen flex flex-col p-4 shadow-lg relative ${window.innerWidth <= 768 && !isSidebarOpen ? 'fixed top-0 left-0 bottom-0 z-40' : ''} `}>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute -right-4 top-4 p-2 bg-indigo-600 text-white rounded-full shadow-lg transition-transform hover:scale-110 z-50">
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className="flex items-center justify-center mb-6">
          <h1 className={`text-2xl font-bold transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Admin Panel</h1>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>
            <FaTachometerAlt className="text-xl" />
            <span className={`ml-4 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('products')} className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors ${activeTab === 'products' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>
            <FaBox className="text-xl" />
            <span className={`ml-4 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Products</span>
          </button>
          <button onClick={() => setActiveTab('orders')} className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>
            <FaClipboardList className="text-xl" />
            <span className={`ml-4 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Orders</span>
          </button>
          <button onClick={() => setActiveTab('users')} className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>
            <FaUsers className="text-xl" />
            <span className={`ml-4 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Users</span>
          </button>
          <button onClick={() => setActiveTab('coupons')} className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors ${activeTab === 'coupons' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>
            <FaTicketAlt className="text-xl" />
            <span className={`ml-4 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Coupons</span>
          </button>
          <button onClick={() => setActiveTab('queries')} className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors ${activeTab === 'queries' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>
            <FaEnvelope className="text-xl" />
            <span className={`ml-4 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Queries</span>
          </button>
          <button onClick={() => setActiveTab('carts')} className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors ${activeTab === 'carts' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>
            <FaShoppingCart className="text-xl" />
            <span className={`ml-4 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Carts & Wishlists</span>
          </button>
        </nav>
      </aside>

      <div className={`flex-grow p-6 transition-all duration-300 ${isSidebarOpen ? 'ml-0' : 'ml-0'}`}>
        {openModal && <ImageUploadModal isopen={openModal} onClose={() => setOpenModal(false)} />}
        
        {/* Detailed Order Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-2xl font-bold">Order Details - #{selectedOrder.orderId}</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
              </div>
              {detailsLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <div className="space-y-4 text-gray-700">
                  <h4 className="text-lg font-semibold mt-4">Customer Information:</h4>
                  <p><strong>Name:</strong> {selectedOrder.userName}</p>
                  <p><strong>Email:</strong> {users.find(u => u.id === selectedOrder.userId)?.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {users.find(u => u.id === selectedOrder.userId)?.phone || 'N/A'}</p>

                  <h4 className="text-lg font-semibold mt-4">Order Summary:</h4>
                  <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  <p><strong>Total Amount:</strong> {formatCurrency(selectedOrder.totalAmount)}</p>
                  <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          selectedOrder.status === 'Delivered' ? 'bg-green-200 text-green-800' :
                          selectedOrder.status === 'Order Cancelled' ? 'bg-red-200 text-red-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>{selectedOrder.status}</span></p>
                  
                  <h4 className="text-lg font-semibold mt-4">Products:</h4>
                  <ul className="space-y-2">
                    {(selectedOrder.products || []).map(p => (
                      <li key={p.productId} className="flex items-center space-x-4 border-b pb-2 last:border-b-0">
                        <img src={p.imageurl} alt={p.productName} className="w-16 h-16 object-cover rounded-md" />
                        <div>
                          <p className="font-medium">{p.productName}</p>
                          <p className="text-sm text-gray-500">Quantity: {p.quantity}</p>
                          <p className="text-sm text-gray-500">Price: {formatCurrency(p.price)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <h4 className="text-lg font-semibold mt-6">Order Timeline:</h4>
                  <div className="relative pl-4">
                    <div className="absolute top-0 left-0 h-full w-0.5 bg-gray-200"></div>
                    {(selectedOrder.timeline || []).map((step, index) => (
                      <div key={index} className="flex items-center mb-4">
                        <div className="w-3 h-3 bg-indigo-600 rounded-full z-10"></div>
                        <div className="ml-4">
                          <p className="font-semibold text-sm">{step.status}</p>
                          <p className="text-xs text-gray-500">{new Date(step.date).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Placeholder for Refund Management */}
                  <div className="border-t pt-4 mt-6">
                    <h4 className="text-lg font-semibold">Refund Management</h4>
                    <button className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                      Initiate Refund
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      *Note: This is a placeholder. A real implementation would require a backend refund API.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Profile Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-2xl font-bold">{selectedUser.name}</h3>
                <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
              </div>
              <div className="space-y-6 text-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-lg font-semibold">Contact Information</h4>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Activity Metrics</h4>
                    <p><strong>Total Orders:</strong> {selectedUser.orders.length}</p>
                    <p><strong>Total Queries:</strong> {selectedUser.queries.length}</p>
                    <p><strong>Customer Lifetime Value (CLV):</strong> {formatCurrency(selectedUser.CLV)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold">Order History</h4>
                  <ul className="space-y-2 mt-2">
                    {selectedUser.orders.length > 0 ? selectedUser.orders.map(order => (
                      <li key={order.orderId} className="p-4 border rounded-lg hover:bg-gray-50">
                        <p className="font-medium">Order ID: #{order.orderId}</p>
                        <p className="text-sm text-gray-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">Total: {formatCurrency(order.totalAmount)}</p>
                        <p className="text-sm text-gray-500">Status: {order.status}</p>
                      </li>
                    )) : <p className="text-sm text-gray-500">No orders found.</p>}
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold">Submitted Queries</h4>
                  <ul className="space-y-2 mt-2">
                    {selectedUser.queries.length > 0 ? selectedUser.queries.map(query => (
                      <li key={query.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <p className="font-medium">Subject: {query.subject || 'N/A'}</p>
                        <p className="text-sm text-gray-500">Message: {query.message}</p>
                      </li>
                    )) : <p className="text-sm text-gray-500">No queries found.</p>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2">Admin Dashboard</h2>
            
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg flex items-center space-x-4 transform transition-transform hover:scale-105">
                <FaClipboardList className="text-4xl" />
                <div>
                  <h3 className="text-lg font-semibold">Total Revenue</h3>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-xl shadow-lg flex items-center space-x-4 transform transition-transform hover:scale-105">
                <FaBox className="text-4xl" />
                <div>
                  <h3 className="text-lg font-semibold">Total Orders</h3>
                  <p className="text-3xl font-bold mt-1">{totalOrders}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-xl shadow-lg flex items-center space-x-4 transform transition-transform hover:scale-105">
                <FaUsers className="text-4xl" />
                <div>
                  <h3 className="text-lg font-semibold">Total Users</h3>
                  <p className="text-3xl font-bold mt-1">{totalUsers}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-6 rounded-xl shadow-lg flex items-center space-x-4 transform transition-transform hover:scale-105">
                <FaEnvelope className="text-4xl" />
                <div>
                  <h3 className="text-lg font-semibold">Pending Queries</h3>
                  <p className="text-3xl font-bold mt-1">{totalQueries}</p>
                </div>
              </div>
            </div>
            
            {/* New KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-xl font-semibold mb-2">Revenue Overview</h4>
                <p>Today's Revenue: <span className="font-bold">{formatCurrency(todayRevenue)}</span></p>
                <p>This Week's Revenue: <span className="font-bold">{formatCurrency(thisWeekRevenue)}</span></p>
                <p>This Month's Revenue: <span className="font-bold">{formatCurrency(thisMonthRevenue)}</span></p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-xl font-semibold mb-2">User Growth</h4>
                <p>New Users (Last 24h): <span className="font-bold">{newUsersToday}</span></p>
                <p>New Users (Last 7d): <span className="font-bold">{newUsersThisWeek}</span></p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-xl font-semibold mb-2">Top 5 Selling Products</h4>
                <ul className="space-y-2">
                  {topSellingProducts.length > 0 ? topSellingProducts.map((p, index) => (
                    <li key={p.id} className="flex justify-between items-center text-sm text-gray-700">
                      <span>{index + 1}. {p.name}</span>
                      <span className="font-semibold">{p.salesCount} sold</span>
                    </li>
                  )) : <p className="text-sm text-gray-500">No sales data available.</p>}
                </ul>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Orders Status Breakdown</h3>
                <OrderChart delivered={deliveredOrders.length} pending={orders.filter(o => o.status !== "Delivered" && o.status !== "Order Cancelled").length} cancelled={orders.filter(o => o.status === "Order Cancelled").length} />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Revenue Trend (Placeholder)</h3>
                <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed rounded-md">
                  Line chart showing daily/weekly revenue trends.
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Product Sales Breakdown (Placeholder)</h3>
                <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed rounded-md">
                  Bar chart showing sales count by product category.
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Customer Acquisition (Placeholder)</h3>
                <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed rounded-md">
                  Line chart showing new user registrations over time.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Manage Products</h2>
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex space-x-2 w-full sm:w-auto">
                <button className="bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition-colors w-1/2 sm:w-auto" onClick={() => setOpenModal(true)}>Add New Product</button>
                <button className="bg-gray-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-gray-600 transition-colors w-1/2 sm:w-auto">Bulk Actions</button>
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full sm:w-64 p-2 border rounded-lg shadow-sm"
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 border-b border-gray-200">ID</th>
                    <th className="py-3 px-6 border-b border-gray-200">Image</th>
                    <th className="py-3 px-6 border-b border-gray-200">Name</th>
                    <th className="py-3 px-6 border-b border-gray-200">Price</th>
                    <th className="py-3 px-6 border-b border-gray-200">Stock</th>
                    <th className="py-3 px-6 border-b border-gray-200">Sales Count</th>
                    <th className="py-3 px-6 border-b border-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  {(filteredProducts || []).map((product) => (
                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6">{product.id}</td>
                      <td className="py-3 px-6"><img src={product.imageurl} alt={product.name} className="w-12 h-12 object-cover rounded-md" /></td>
                      <td className="py-3 px-6">
                        {editingProduct?.id === product.id ? (
                          <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="border rounded px-2 py-1" />
                        ) : product.name}
                      </td>
                      <td className="py-3 px-6">{formatCurrency(product.price)}</td>
                      <td className="py-3 px-6">
                        {editingProduct?.id === product.id ? (
                          <input type="number" value={editingProduct.stock} onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })} className="border rounded px-2 py-1 w-20" />
                        ) : product.stock}
                      </td>
                      <td className="py-3 px-6">{productSalesMap[product.id] || 0}</td>
                      <td className="py-3 px-6">
                        {editingProduct?.id === product.id ? (
                          <button onClick={() => handleProductUpdate(editingProduct)} className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 mr-2">Save</button>
                        ) : (
                          <button onClick={() => setEditingProduct(product)} className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 mr-2">Edit</button>
                        )}
                        <button onClick={() => handleProductDelete(product.id)} className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600">Delete</button>
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
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Manage Orders</h2>
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              className="w-full p-2 border rounded-lg shadow-sm"
            />
            <div className="flex space-x-2 overflow-x-auto">
              <button className={`py-2 px-4 rounded-lg font-medium ${orderStatusTab === "All" ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} onClick={() => setOrderStatusTab("All")}>All</button>
              <button className={`py-2 px-4 rounded-lg font-medium ${orderStatusTab === "Order Placed" ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} onClick={() => setOrderStatusTab("Order Placed")}>Placed</button>
              <button className={`py-2 px-4 rounded-lg font-medium ${orderStatusTab === "Processing" ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} onClick={() => setOrderStatusTab("Processing")}>Processing</button>
              <button className={`py-2 px-4 rounded-lg font-medium ${orderStatusTab === "Shipped" ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} onClick={() => setOrderStatusTab("Shipped")}>Shipped</button>
              <button className={`py-2 px-4 rounded-lg font-medium ${orderStatusTab === "Delivered" ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} onClick={() => setOrderStatusTab("Delivered")}>Delivered</button>
              <button className={`py-2 px-4 rounded-lg font-medium ${orderStatusTab === "Order Cancelled" ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} onClick={() => setOrderStatusTab("Order Cancelled")}>Cancelled</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6">ID</th>
                    <th className="py-3 px-6">User</th>
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6">Total</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredOrders || []).map(order => (
                    <tr key={order.orderId} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6">{order.orderId}</td>
                      <td className="py-3 px-6">{order.userName}</td>
                      <td className="py-3 px-6">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-6">{formatCurrency(order.totalAmount)}</td>
                      <td className="py-3 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'Delivered' ? 'bg-green-200 text-green-800' :
                          order.status === 'Order Cancelled' ? 'bg-red-200 text-red-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>{order.status}</span>
                      </td>
                      <td className="py-3 px-6 flex space-x-2">
                        <button onClick={() => handleOrderDetails(order.orderId)} className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600">Details</button>
                        <select onChange={(e) => handleOrderStatusUpdate(order.orderId, e.target.value)} value={order.status} className="border rounded-lg p-1">
                          <option value="Order Placed">Order Placed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Order Cancelled">Order Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Manage Users</h2>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full p-2 border rounded-lg shadow-sm"
            />
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6">ID</th>
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">Role</th>
                    <th className="py-3 px-6">Orders Count</th>
                    <th className="py-3 px-6">Customer Lifetime Value</th>
                    <th className="py-3 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  {(filteredUsers || []).map(user => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6">{user.id}</td>
                      <td className="py-3 px-6">{user.name}</td>
                      <td className="py-3 px-6">{user.email}</td>
                      <td className="py-3 px-6">{user.role}</td>
                      <td className="py-3 px-6">{user.orders.length}</td>
                      <td className="py-3 px-6">{formatCurrency(user.CLV)}</td>
                      <td className="py-3 px-6">
                        <button onClick={() => handleUserSelect(user)} className="bg-indigo-500 text-white px-3 py-1 rounded-lg hover:bg-indigo-600">View Profile</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Manage Coupons</h2>
            <button className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-colors" onClick={() => setEditingCoupon({})}>Add New Coupon</button>
            {editingCoupon && (
              <div className="p-6 bg-gray-50 border rounded-lg shadow-inner space-y-4">
                <h3 className="text-xl font-semibold">
                  {editingCoupon.id ? "Edit Coupon" : "Add New Coupon"}
                </h3>
                <input
                  type="text"
                  placeholder="Code"
                  value={editingCoupon.code || ""}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Discount Type (e.g., 'fixed' or 'percent')"
                  value={editingCoupon.discountType || ""}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, discountType: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Discount Value"
                  value={editingCoupon.discountValue || ""}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, discountValue: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <div className="flex justify-end space-x-2">
                  <button onClick={saveCoupon} className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600">Save</button>
                  <button onClick={() => setEditingCoupon(null)} className="bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500">Cancel</button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 border-b border-gray-200">Code</th>
                    <th className="py-3 px-6 border-b border-gray-200">Discount Type</th>
                    <th className="py-3 px-6 border-b border-gray-200">Discount Value</th>
                    <th className="py-3 px-6 border-b border-gray-200">Usage Count</th>
                    <th className="py-3 px-6 border-b border-gray-200">Total Revenue</th>
                    <th className="py-3 px-6 border-b border-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  {(coupons || []).map((coupon) => (
                    <tr key={coupon.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6">{coupon.code}</td>
                      <td className="py-3 px-6">{coupon.discountType}</td>
                      <td className="py-3 px-6">{coupon.discountValue}</td>
                      <td className="py-3 px-6">{couponMetrics[coupon.id]?.usageCount || 0}</td>
                      <td className="py-3 px-6">{formatCurrency(couponMetrics[coupon.id]?.totalRevenue || 0)}</td>
                      <td className="py-3 px-6">
                        <button onClick={() => setEditingCoupon(coupon)} className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 mr-2">Edit</button>
                        <button onClick={() => deleteCoupon(coupon.id)} className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600">Delete</button>
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
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Manage Queries</h2>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={querySearch}
              onChange={(e) => setQuerySearch(e.target.value)}
              className="w-full p-2 border rounded-lg shadow-sm"
            />
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6">ID</th>
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">Message</th>
                    <th className="py-3 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  {(filteredQueries || []).map(query => (
                    <tr key={query.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6">{query.id}</td>
                      <td className="py-3 px-6">{query.name}</td>
                      <td className="py-3 px-6">{query.email}</td>
                      <td className="py-3 px-6">{query.message}</td>
                      <td className="py-3 px-6">
                        <button onClick={() => deleteQuery(query.id)} className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Carts & Wishlists Tab (New) */}
        {activeTab === "carts" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Carts & Wishlists</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Abandoned Carts (Placeholder)</h3>
                <p className="text-gray-500 text-sm">
                  This section would list carts that have not been converted to orders, helping to identify potential issues or for marketing outreach.
                </p>
                <div className="mt-4 p-4 border border-dashed rounded-lg text-gray-400">
                  <p className="text-sm">
                    Note: A function to fetch all abandoned carts for the admin panel needs to be implemented in your `CartContext.jsx`.
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Most Popular Wishlist Items</h3>
                <p className="text-gray-500 text-sm">
                  Displaying the most frequently wishlisted items can inform product promotion and inventory decisions.
                </p>
                <div className="mt-4 p-4 border border-dashed rounded-lg text-gray-400">
                  <ul className="space-y-2">
                    {popularWishlistItems.length > 0 ? popularWishlistItems.map((item, index) => (
                      <li key={item.id}>{index + 1}. {item.name} ({item.count} adds)</li>
                    )) : (
                      <p>No wishlist data available.</p>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
