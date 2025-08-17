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
  const { isLoaded: isClerkLoaded } = useUser();

  // CONTEXTS
  const { products, getProducts, updateProduct, deleteProduct, loading: productsLoading } = useContext(ProductContext);
  const { orders, getorders, updateOrderStatus, getSingleOrderDetails } = useContext(OrderContext);
  const { queries, getquery, deleteQuery } = useContext(ContactContext);
  const { userdetails, users, getallusers } = useContext(UserContext);
  const { cart, wishlist } = useContext(CartContext);
  const {
    coupons,
    editingCoupon,
    setEditingCoupon,
    saveCoupon,
    deleteCoupon,
    refreshCoupons
  } = useContext(CouponContext);

  // --- Data Fetching and Effects ---
  useEffect(() => {
    // Only fetch data if Clerk user details are loaded and the user is an admin
    if (isClerkLoaded && userdetails && userdetails.role === "admin") {
      getallusers();
      getquery();
      getorders(true, true);
      getProducts();
    }
  }, [isClerkLoaded, userdetails, getallusers, getquery, getorders, getProducts]);

  // Check for admin role
  useEffect(() => {
    if (isClerkLoaded && userdetails && userdetails.role !== "admin") {
      navigate("/");
    }
  }, [isClerkLoaded, userdetails, navigate]);

  // --- Analysis Data Calculation ---
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

  // --- Functions ---
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
  
  // Guard clause for non-admin users or if user details are not yet loaded
  if (!isClerkLoaded || (userdetails && userdetails.role !== "admin")) {
    return <div className="p-4 text-center text-xl font-bold">Access Denied</div>;
  }
  
  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <ToastContainer />
      <div className="w-64 bg-gray-800 text-white flex flex-col h-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        </div>
        <ul className="flex flex-col flex-1">
          <li onClick={() => setActiveTab("dashboard")} className={`py-3 px-6 cursor-pointer hover:bg-gray-700 ${activeTab === "dashboard" ? "bg-gray-700 font-semibold" : ""}`}>Dashboard</li>
          <li onClick={() => setActiveTab("products")} className={`py-3 px-6 cursor-pointer hover:bg-gray-700 ${activeTab === "products" ? "bg-gray-700 font-semibold" : ""}`}>Products</li>
          <li onClick={() => setActiveTab("orders")} className={`py-3 px-6 cursor-pointer hover:bg-gray-700 ${activeTab === "orders" ? "bg-gray-700 font-semibold" : ""}`}>Orders</li>
          <li onClick={() => setActiveTab("users")} className={`py-3 px-6 cursor-pointer hover:bg-gray-700 ${activeTab === "users" ? "bg-gray-700 font-semibold" : ""}`}>Users</li>
          <li onClick={() => setActiveTab("coupons")} className={`py-3 px-6 cursor-pointer hover:bg-gray-700 ${activeTab === "coupons" ? "bg-gray-700 font-semibold" : ""}`}>Coupons</li>
          <li onClick={() => setActiveTab("queries")} className={`py-3 px-6 cursor-pointer hover:bg-gray-700 ${activeTab === "queries" ? "bg-gray-700 font-semibold" : ""}`}>Queries</li>
          <li onClick={() => setActiveTab("carts")} className={`py-3 px-6 cursor-pointer hover:bg-gray-700 ${activeTab === "carts" ? "bg-gray-700 font-semibold" : ""}`}>Carts & Wishlists</li>
        </ul>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {openModal && <ImageUploadModal isopen={openModal} onClose={() => setOpenModal(false)} />}
        
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-500">Total Revenue</h3>
                <p className="mt-1 text-3xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-500">Total Orders</h3>
                <p className="mt-1 text-3xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-500">Total Products</h3>
                <p className="mt-1 text-3xl font-bold text-gray-900">{totalProducts}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-500">Total Users</h3>
                <p className="mt-1 text-3xl font-bold text-gray-900">{totalUsers}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-500">Average Order Value</h3>
                <p className="mt-1 text-3xl font-bold text-gray-900">₹{averageOrderValue.toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-500">Pending Queries</h3>
                <p className="mt-1 text-3xl font-bold text-gray-900">{totalQueries}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-500">New Users (30 Days)</h3>
                <p className="mt-1 text-3xl font-bold text-gray-900">{newUsersThisMonth}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Orders Status Breakdown</h3>
                <OrderChart
                  delivered={deliveredOrders}
                  pending={processingOrders}
                  cancelled={cancelledOrders}
                />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Revenue Trend (Last 30 Days)</h3>
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
              <div className="bg-white p-6 rounded-lg shadow-md col-span-1 lg:col-span-2">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Top 5 Selling Products</h3>
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
            <h2 className="text-3xl font-bold text-gray-800">Manage Products</h2>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <button
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                onClick={() => setOpenModal(true)}
              >
                Add New Product
              </button>
              <button
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleBulkDelete}
                disabled={selectedProducts.length === 0 || loading}
              >
                {loading ? "Deleting..." : `Delete Selected (${selectedProducts.length})`}
              </button>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><input type="checkbox" onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(products.map(p => p.id));
                      } else {
                        setSelectedProducts([]);
                      }
                    }} /></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size (ml)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products?.map((product) =>
                    editingProduct && editingProduct.id === product.id ? (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap"></td>
                        <td className="px-6 py-4 whitespace-nowrap">{product.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img src={Array.isArray(editingProduct.imageurl) ? editingProduct.imageurl[0] : editingProduct.imageurl} alt={editingProduct.name} className="w-12 h-12 object-cover rounded-md" />
                          <br />
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const imageUrl = URL.createObjectURL(file);
                              setEditingProduct({ ...editingProduct, imageurl: imageUrl });
                            }
                          }} className="mt-2 text-sm" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="border rounded px-2 py-1" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><input type="number" value={editingProduct.oprice} onChange={(e) => setEditingProduct({ ...editingProduct, oprice: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-24" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><input type="number" value={editingProduct.discount} onChange={(e) => setEditingProduct({ ...editingProduct, discount: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-24" /></td>
                        <td className="px-6 py-4 whitespace-nowrap"><input type="number" value={editingProduct.size} onChange={(e) => setEditingProduct({ ...editingProduct, size: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-24" /></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="bg-green-500 text-white px-3 py-1 rounded-md mr-2" onClick={() => handleProductUpdate(editingProduct)}>Save</button>
                          <button className="bg-gray-500 text-white px-3 py-1 rounded-md" onClick={() => setEditingProduct(null)}>Cancel</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap"><input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => handleProductSelection(product.id)} /></td>
                        <td className="px-6 py-4 whitespace-nowrap">{product.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><img src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl} alt={product.name} className="w-12 h-12 object-cover rounded-md" /></td>
                        <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">₹{product.oprice}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{product.discount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{product.size}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="bg-blue-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-blue-600" onClick={() => setEditingProduct(product)}>Edit</button>
                          <button className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600" onClick={() => handleProductDelete(product.id)}>{loading ? "deleting" : "delete"}</button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Manage Coupon Codes</h2>
            <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200" onClick={() => setEditingCoupon({ code: "", discountType: "percent", discountValue: 0, minOrderValue: 0, minItemCount: 0, description: "", validFrom: "", validUntil: "", usageLimit: 0, isForNewUsers: false })}>
              Add New Coupon
            </button>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min ₹</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Limit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">For New Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {editingCoupon && (
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap"><input className="border rounded px-2 py-1 w-24" placeholder="Code" value={editingCoupon.code || ""} onChange={e => setEditingCoupon(ec => ({ ...ec, code: e.target.value }))} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><select className="border rounded px-2 py-1" value={editingCoupon.discountType} onChange={e => setEditingCoupon(ec => ({ ...ec, discountType: e.target.value }))}><option value="percent">percent</option><option value="flat">flat</option></select></td>
                      <td className="px-6 py-4 whitespace-nowrap"><input className="border rounded px-2 py-1 w-20" type="number" placeholder="Value" value={editingCoupon.discountValue ?? 0} onChange={e => setEditingCoupon(ec => ({ ...ec, discountValue: parseFloat(e.target.value) }))} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><input className="border rounded px-2 py-1 w-20" type="number" placeholder="Min Order" value={editingCoupon.minOrderValue ?? 0} onChange={e => setEditingCoupon(ec => ({ ...ec, minOrderValue: parseFloat(e.target.value) }))} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><input className="border rounded px-2 py-1 w-20" type="number" placeholder="Min Items" value={editingCoupon.minItemCount ?? 0} onChange={e => setEditingCoupon(ec => ({ ...ec, minItemCount: parseFloat(e.target.value) }))} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><input className="border rounded px-2 py-1" placeholder="Description" value={editingCoupon.description || ""} onChange={e => setEditingCoupon(ec => ({ ...ec, description: e.target.value }))} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><input className="border rounded px-2 py-1" type="date" value={editingCoupon.validFrom || ""} onChange={e => setEditingCoupon(ec => ({ ...ec, validFrom: e.target.value }))} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><input className="border rounded px-2 py-1" type="date" value={editingCoupon.validUntil || ""} onChange={e => setEditingCoupon(ec => ({ ...ec, validUntil: e.target.value }))} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><input className="border rounded px-2 py-1 w-20" type="number" placeholder="Usage Limit" value={editingCoupon.usageLimit ?? 0} onChange={e => setEditingCoupon(ec => ({ ...ec, usageLimit: parseFloat(e.target.value) }))} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><input className="form-checkbox" type="checkbox" checked={editingCoupon.isForNewUsers || false} onChange={e => setEditingCoupon(ec => ({ ...ec, isForNewUsers: e.target.checked }))} /></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="bg-green-500 text-white px-3 py-1 rounded-md mr-2" onClick={saveCoupon}>Save</button>
                        <button className="bg-gray-500 text-white px-3 py-1 rounded-md" onClick={() => setEditingCoupon(null)}>Cancel</button>
                      </td>
                    </tr>
                  )}
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{coupon.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{coupon.discountType}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{coupon.discountValue}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{coupon.minOrderValue}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{coupon.minItemCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{coupon.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{coupon.validFrom ? new Date(coupon.validFrom).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{coupon.usageLimit}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{coupon.isForNewUsers ? "Yes" : "No"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="bg-blue-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-blue-600" onClick={() => setEditingCoupon(coupon)}>Edit</button>
                        <button className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600" onClick={() => deleteCoupon(coupon.id)}>Delete</button>
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
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <input type="text" placeholder="Search orders..." value={orderSearchQuery} onChange={(e) => setOrderSearchQuery(e.target.value)} className="border rounded-lg p-2 flex-1" />
              <select onChange={(e) => setOrderStatusTab(e.target.value)} value={orderStatusTab} className="border rounded-lg p-2">
                <option value="All">All</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Order Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.orderId}>
                      <td className="px-6 py-4 whitespace-nowrap">{order.orderId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{order.userId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">₹{order.totalAmount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : order.status === 'Order Cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(order.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        <button className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600" onClick={() => handleOrderDetails(order.orderId)} disabled={detailsLoading}>Details</button>
                        <select onChange={(e) => handleOrderStatusUpdate(order.orderId, e.target.value)} value={order.status} className="border rounded-md px-2 py-1">
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
            {selectedOrder && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
                <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-lg mx-4">
                  <h3 className="text-xl font-bold mb-4">Order Details for #{selectedOrder.orderId}</h3>
                  <div className="space-y-2">
                    <p><strong>User ID:</strong> {selectedOrder.userId}</p>
                    <p><strong>Payment Mode:</strong> {selectedOrder.paymentMode}</p>
                    <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus}</p>
                    <p><strong>Total:</strong> ₹{selectedOrder.totalAmount}</p>
                    <p><strong>Status:</strong> {selectedOrder.status}</p>
                    <p><strong>Address:</strong> {selectedOrder.address}, {selectedOrder.city}, {selectedOrder.state}, {selectedOrder.zip}, {selectedOrder.country}</p>
                    <p className="font-semibold mt-4">Products:</p>
                    <ul className="space-y-2">
                      {(selectedOrder.products || []).map(p => (
                        <li key={p.productId} className="flex items-center space-x-3">
                          <img src={Array.isArray(p.imageurl) ? p.imageurl[0] : p.imageurl} alt={p.productName} className="w-12 h-12 object-cover rounded-md" />
                          <span>{p.productName} (x{p.quantity}) - ₹{p.price}</span>
                        </li>
                      ))}
                    </ul>
                    <p><strong>Created At:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <button className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600" onClick={() => setSelectedOrder(null)}>Close</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Manage Users</h2>
            <input type="text" placeholder="Search users by name or email..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="w-full border rounded-lg p-2" />
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Queries</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.orders.length}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.queries.length}</td>
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
            <h2 className="text-3xl font-bold text-gray-800">User Queries</h2>
            <input type="text" placeholder="Search queries by name or email..." value={querySearch} onChange={(e) => setQuerySearch(e.target.value)} className="w-full border rounded-lg p-2" />
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
          <div className="space-y-4 p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold">Carts & Wishlists (Admin View)</h2>
            <p className="text-gray-600">This section is for future implementation to show all user carts and wishlists. </p>
            <p className="text-gray-600">You can use the existing `CartContext` to fetch and manage this data.</p>
            <p className="text-gray-800 font-semibold">Current cart count: {cart.length}</p>
            <p className="text-gray-800 font-semibold">Current wishlist count: {wishlist.length}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

