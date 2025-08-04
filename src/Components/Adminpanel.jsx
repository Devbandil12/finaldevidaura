
// src/Components/Adminpanel.js
import React, { useState, useContext, useEffect } from "react";
import "../style/adminPanel.css";
import { OrderContext } from "../contexts/OrderContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { db } from "../../configs/index";
import { useUser } from "@clerk/clerk-react";
import { eq } from "drizzle-orm";
import { useNavigate } from "react-router-dom";
import {
  addToCartTable,
  orderItemsTable,
  ordersTable,
  productsTable,
  usersTable,
} from "../../configs/schema";
import ImageUploadModal from "./ImageUploadModal";
import { UserContext } from "../contexts/UserContext";
import { CouponContext } from "../contexts/CouponContext";
import { toast, ToastContainer } from "react-toastify";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { products, setProducts } = useContext(ProductContext);
  const [editingProduct, setEditingProduct] = useState(null);
  const navigate = useNavigate();
  const { orders, setOrders, getorders } = useContext(OrderContext);
  const { queries } = useContext(ContactContext);
  const { user } = useUser();
  const [orderStatusTab, setOrderStatusTab] = useState("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userkiDetails, setUserkiDetails] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [refundProcessing, setRefundProcessing] = useState({});

  const { getquery } = useContext(ContactContext);

  const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    topProducts: [],
    ordersByMonth: [],
    revenueByMonth: [],
    orderStatusBreakdown: {},
    refundStats: { total: 0, amount: 0, rate: 0 }
  });

  // Instead of dummy users, fetch users from the database
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await db.select().from(usersTable);
        setUsersList(res);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
    getquery();
  }, []);

  // Calculate analytics data
  useEffect(() => {
    if (orders.length > 0 && products.length > 0 && usersList.length > 0) {
      calculateAnalytics();
    }
  }, [orders, products, usersList]);

  const calculateAnalytics = () => {
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid' || o.paymentStatus === 'refunded');
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const totalUsers = usersList.length;
    const totalProducts = products.length;
    const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    // Order status breakdown
    const orderStatusBreakdown = orders.reduce((acc, order) => {
      const status = order.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Top products by quantity sold
    const productSales = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName || products.find(p => p.id === item.productId)?.name || 'Unknown',
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.totalPrice || (item.price * item.quantity);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Monthly data
    const monthlyData = {};
    paidOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { orders: 0, revenue: 0 };
      }
      monthlyData[monthKey].orders += 1;
      monthlyData[monthKey].revenue += order.totalAmount;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const ordersByMonth = sortedMonths.map(month => ({
      month,
      orders: monthlyData[month].orders
    }));
    const revenueByMonth = sortedMonths.map(month => ({
      month,
      revenue: monthlyData[month].revenue
    }));

    // Refund statistics
    const refundedOrders = orders.filter(o => o.refund?.id);
    const refundStats = {
      total: refundedOrders.length,
      amount: refundedOrders.reduce((sum, order) => sum + (order.refund?.amount || 0) / 100, 0),
      rate: orders.length > 0 ? (refundedOrders.length / orders.length * 100) : 0
    };

    setAnalyticsData({
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      averageOrderValue,
      topProducts,
      ordersByMonth,
      revenueByMonth,
      orderStatusBreakdown,
      refundStats
    });
  };

  // Enrich users with orders from context
  const usersWithOrders = usersList.map((user) => ({
    ...user,
    orders: orders.filter((order) => order.userId === user.id),
  }));

  const filteredUsers = usersWithOrders.filter(
    (user) =>
      user?.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user?.phone?.includes(userSearchQuery)
  );

  const generateNewId = (list) =>
    list.length > 0 ? Math.max(...list.map((item) => item.id)) + 1 : 1;

  const userdetails = async () => {
    try {
      const res = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, user?.primaryEmailAddress?.emailAddress));
      setUserkiDetails(res[0]);
      if (res[0].role !== "admin") {
        navigate("/");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user) {
      userdetails();
    }
  }, [user]);

  useEffect(() => {
    getorders();
  }, []);

  const {
    coupons,
    editingCoupon,
    setEditingCoupon,
    saveCoupon,
    deleteCoupon,
    refreshCoupons
  } = useContext(CouponContext);

  useEffect(() => {
    refreshCoupons();
  }, [refreshCoupons]);

  // --- Product Functions ---
  const handleProductUpdate = async (updatedProduct) => {
    console.log(updatedProduct);
    try {
      const res = await db
        .update(productsTable)
        .set({
          ...updatedProduct,
          name: updatedProduct.name,
          size: updatedProduct.size,
          discount: updatedProduct.discount,
          price: updatedProduct.oprice,
          imageurl: updatedProduct.imageurl,
        })
        .where(eq(productsTable.id, updatedProduct.id))
        .returning(productsTable);
      toast.success("Product updated successfully");
    } catch (error) {
      const { message } = error;
      toast.error(message);
    }

    setProducts((prevProducts) => {
      const exists = prevProducts.find((p) => p.id === updatedProduct.id);
      return exists
        ? prevProducts.map((p) =>
          p.id === updatedProduct.id ? updatedProduct : p
        )
        : [...prevProducts, updatedProduct];
    });
    setEditingProduct(null);
  };

  const handleProductDelete = async (productId) => {
    if (userkiDetails?.role !== "admin") return;
    setLoading(true);
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts((prevProducts) =>
        prevProducts.filter((p) => p.id !== productId)
      );
      try {
        await db
          .delete(orderItemsTable)
          .where(eq(orderItemsTable.productId, productId));
        await db
          .delete(addToCartTable)
          .where(eq(addToCartTable.productId, productId));
        await db.delete(productsTable).where(eq(productsTable.id, productId));
        console.log("Product and related cart entries deleted successfully");
      } catch (error) {
        console.error("Error deleting product:", error);
      }
      setLoading(false);
    }
  };

  // Save the editingCoupon to the DB (insert if new, update if existing)
  const handleCouponSave = async () => {
    const payload = {
      code: editingCoupon.code.toUpperCase(),
      discountType: editingCoupon.discountType,
      discountValue: editingCoupon.discountValue,
      minOrderValue: editingCoupon.minOrderValue,
      minItemCount: editingCoupon.minItemCount,
      description: editingCoupon.description || "",
      validFrom: editingCoupon.validFrom || null,
      validUntil: editingCoupon.validUntil || null,
    };

    const url = editingCoupon.id
      ? `${BASE}/api/coupons/${editingCoupon.id}`
      : `${BASE}/api/coupons`;
    const method = editingCoupon.id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingCoupon.id ? "Updated" : "Added");
      await refreshCoupons();
      setEditingCoupon(null);
    } catch {
      toast.error("Save failed");
    }
  };

  const handleCouponDelete = async id => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      const res = await fetch(`${BASE}/api/coupons/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success("Deleted");
      await refreshCoupons();
    } catch {
      toast.error("Delete failed");
    }
  };

  const updateorderstatus = async (orderId, newStatus, newProgressStep) => {
    try {
      await db
        .update(ordersTable)
        .set({ status: newStatus, progressStep: newProgressStep })
        .where(eq(ordersTable.id, orderId));
      console.log("updated");
    } catch (error) {
      console.log(error);
    }
  };

  // --- Order Functions ---
  const sortedOrders = orders
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const statusFilteredOrders = (() => {
    if (orderStatusTab === "All") return sortedOrders;
    if (orderStatusTab === "Cancelled") {
      return sortedOrders.filter(o => o.status === "Order Cancelled");
    }
    return sortedOrders.filter(
      o => o.status?.trim().toLowerCase() === orderStatusTab.trim().toLowerCase()
    );
  })();

  const searchedOrders = statusFilteredOrders.filter(
    (order) =>
      order.orderId?.toString().includes(orderSearchQuery) ||
      order.createdAt?.includes(orderSearchQuery)
  );

  const handleOrderStatusUpdate = (orderId, newStatus, newProgressStep) => {
    updateorderstatus(orderId, newStatus, newProgressStep);
    const updatedOrders = orders.map((order) =>
      order.orderId === orderId
        ? { ...order, status: newStatus, progressStep: newProgressStep }
        : order
    );
    setOrders(updatedOrders);
  };

  const handleorderdetails = async (order) => {
    setDetailsLoading(true);
    try {
      const items = await db
        .select({
          productId: orderItemsTable.productId,
          quantity: orderItemsTable.quantity,
          price: orderItemsTable.price,
          totalPrice: orderItemsTable.totalPrice,
          productName: orderItemsTable.productName,
          img: orderItemsTable.img,
          size: orderItemsTable.size
        })
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.orderId));

      setSelectedOrder({
        ...order,
        products: items
      });
    } catch (error) {
      console.error("Error fetching order products:", error);
      toast.error("Failed to load order details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  // Refund handling
  const handleRefund = async (order) => {
    if (!window.confirm(`Are you sure you want to refund Order #${order.orderId}? This will refund â‚¹${order.totalAmount} with a 5% processing fee.`)) {
      return;
    }

    setRefundProcessing(prev => ({ ...prev, [order.orderId]: true }));

    try {
      const response = await fetch(`${BASE}/api/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.orderId,
          amount: order.totalAmount
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Refund initiated successfully');
        getorders(); // Refresh orders to show refund status
      } else {
        toast.error(data.error || 'Refund failed');
      }
    } catch (error) {
      console.error('Refund error:', error);
      toast.error('Failed to process refund');
    } finally {
      setRefundProcessing(prev => ({ ...prev, [order.orderId]: false }));
    }
  };

  const getRefundStatusColor = (status) => {
    switch (status) {
      case 'processed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'pending':
      case 'created':
      case 'queued':
      case 'in_progress': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const formatRefundStatus = (status) => {
    switch (status) {
      case 'processed': return 'Completed';
      case 'failed': return 'Failed';
      case 'pending': return 'Pending';
      case 'created': return 'Created';
      case 'queued': return 'Queued';
      case 'in_progress': return 'Processing';
      default: return status;
    }
  };

  return (
    user &&
    userkiDetails.role === "admin" && (
      <div className="admin-panel">
        <div className="absolute">
          <ToastContainer />
        </div>
        
        <nav className="admin-nav">
          <button 
            className={activeTab === "analytics" ? "active" : ""}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </button>
          <button 
            className={activeTab === "products" ? "active" : ""}
            onClick={() => setActiveTab("products")}
          >
            Products
          </button>
          <button 
            className={activeTab === "coupons" ? "active" : ""}
            onClick={() => setActiveTab("coupons")}
          >
            Coupon Codes
          </button>
          <button 
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </button>
          <button 
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
          <button 
            className={activeTab === "queries" ? "active" : ""}
            onClick={() => setActiveTab("queries")}
          >
            Queries
          </button>
        </nav>

        <div className="admin-content">
          {openModal && <ImageUploadModal isopen={openModal} />}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="analytics-tab">
              <h2>Business Analytics</h2>
              
              {/* Key Metrics */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <h3>Total Revenue</h3>
                  <p className="metric-value">â‚¹{analyticsData.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="metric-card">
                  <h3>Total Orders</h3>
                  <p className="metric-value">{analyticsData.totalOrders}</p>
                </div>
                <div className="metric-card">
                  <h3>Total Users</h3>
                  <p className="metric-value">{analyticsData.totalUsers}</p>
                </div>
                <div className="metric-card">
                  <h3>Total Products</h3>
                  <p className="metric-value">{analyticsData.totalProducts}</p>
                </div>
                <div className="metric-card">
                  <h3>Avg Order Value</h3>
                  <p className="metric-value">â‚¹{analyticsData.averageOrderValue.toFixed(2)}</p>
                </div>
                <div className="metric-card">
                  <h3>Refund Rate</h3>
                  <p className="metric-value">{analyticsData.refundStats.rate.toFixed(1)}%</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="charts-section">
                {/* Order Status Breakdown */}
                <div className="chart-container">
                  <h3>Order Status Breakdown</h3>
                  <div className="status-chart">
                    {Object.entries(analyticsData.orderStatusBreakdown).map(([status, count]) => (
                      <div key={status} className="status-bar">
                        <span className="status-label">{status}</span>
                        <div className="status-progress">
                          <div 
                            className="status-fill" 
                            style={{ 
                              width: `${(count / analyticsData.totalOrders) * 100}%`,
                              backgroundColor: status === 'Order Cancelled' ? '#ef4444' : 
                                             status === 'Delivered' ? '#10b981' : 
                                             status === 'Shipped' ? '#3b82f6' : '#f59e0b'
                            }}
                          ></div>
                        </div>
                        <span className="status-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Products */}
                <div className="chart-container">
                  <h3>Top Selling Products</h3>
                  <div className="top-products">
                    {analyticsData.topProducts.map((product, index) => (
                      <div key={index} className="product-item">
                        <span className="product-rank">#{index + 1}</span>
                        <span className="product-name">{product.name}</span>
                        <span className="product-quantity">{product.quantity} sold</span>
                        <span className="product-revenue">â‚¹{product.revenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Revenue Chart */}
                <div className="chart-container">
                  <h3>Monthly Revenue Trend</h3>
                  <div className="revenue-chart">
                    {analyticsData.revenueByMonth.map((month, index) => (
                      <div key={month.month} className="month-bar">
                        <div 
                          className="revenue-bar" 
                          style={{ 
                            height: `${(month.revenue / Math.max(...analyticsData.revenueByMonth.map(m => m.revenue))) * 100}%` 
                          }}
                        ></div>
                        <span className="month-label">{month.month}</span>
                        <span className="revenue-value">â‚¹{month.revenue.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Orders Chart */}
                <div className="chart-container">
                  <h3>Monthly Orders Trend</h3>
                  <div className="orders-chart">
                    {analyticsData.ordersByMonth.map((month, index) => (
                      <div key={month.month} className="month-bar">
                        <div 
                          className="orders-bar" 
                          style={{ 
                            height: `${(month.orders / Math.max(...analyticsData.ordersByMonth.map(m => m.orders))) * 100}%` 
                          }}
                        ></div>
                        <span className="month-label">{month.month}</span>
                        <span className="orders-value">{month.orders}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refund Statistics */}
                <div className="chart-container">
                  <h3>Refund Statistics</h3>
                  <div className="refund-stats">
                    <div className="refund-item">
                      <span>Total Refunds</span>
                      <span>{analyticsData.refundStats.total}</span>
                    </div>
                    <div className="refund-item">
                      <span>Refund Amount</span>
                      <span>â‚¹{analyticsData.refundStats.amount.toFixed(2)}</span>
                    </div>
                    <div className="refund-item">
                      <span>Refund Rate</span>
                      <span>{analyticsData.refundStats.rate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="products-tab">
              <h2>Manage Products</h2>
              <button
                className="admin-btn add-btn"
                onClick={() => setOpenModal(true)}
              >
                Add New Product
              </button>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Original Price</th>
                    <th>Discount (%)</th>
                    <th>Size (ml)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products?.map((product) =>
                    editingProduct && editingProduct.id === product.id ? (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>
                          <img
                            src={product?.imageurl}
                            alt={editingProduct.name}
                            width="50"
                            height="50"
                          />
                          <br />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const imageUrl = URL.createObjectURL(file);
                                setEditingProduct({
                                  ...editingProduct,
                                  imageurl: imageUrl,
                                });
                              }
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingProduct.name}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                name: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editingProduct.oprice}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                oprice: parseFloat(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editingProduct.discount}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                discount: parseFloat(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editingProduct.size}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                size: parseFloat(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td>
                          <button
                            className="admin-btn"
                            onClick={() => handleProductUpdate(editingProduct)}
                          >
                            Save
                          </button>
                          <button
                            className="admin-btn"
                            onClick={() => setEditingProduct(null)}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>
                          <img
                            src={product.imageurl}
                            alt={product.name}
                            width="50"
                            height="50"
                          />
                        </td>
                        <td>{product.name}</td>
                        <td>â‚¹{product.oprice}</td>
                        <td>{product.discount}</td>
                        <td>{product.size}</td>
                        <td>
                          <button
                            className="admin-btn"
                            onClick={() => setEditingProduct(product)}
                          >
                            Edit
                          </button>
                          <button
                            className="admin-btn delete-btn"
                            onClick={() => handleProductDelete(product.id)}
                          >
                            {loading ? "deleting" : "delete"}
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === "coupons" && (
            <div className="coupons-tab">
              <h2>Manage Coupon Codes</h2>
              <button
                className="admin-btn add-btn"
                onClick={() =>
                  setEditingCoupon({
                    code: "",
                    discountType: "percent",
                    discountValue: 0,
                    minOrderValue: 0,
                    minItemCount: 0,
                    description: "",
                    validFrom: "",
                    validUntil: "",
                    firstOrderOnly: false,
                    maxUsagePerUser: 1
                  })
                }
              >
                Add New Coupon
              </button>

              <table className="coupon-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min â‚¹</th>
                    <th>Min Items</th>
                    <th>Description</th>
                    <th>Max Usage/User</th>
                    <th>First Order Only</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {editingCoupon && (
                    <tr>
                      <td>
                        <input
                          placeholder="Code"
                          value={editingCoupon.code || ""}
                          onChange={e => setEditingCoupon(ec => ({ ...ec, code: e.target.value }))}
                        />
                      </td>
                      <td>
                        <select
                          value={editingCoupon.discountType}
                          onChange={e => setEditingCoupon(ec => ({ ...ec, discountType: e.target.value }))}
                        >
                          <option value="percent">percent</option>
                          <option value="flat">flat</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="Value"
                          value={editingCoupon.discountValue ?? 0}
                          onChange={e => setEditingCoupon(ec => ({ ...ec, discountValue: +e.target.value }))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="Min â‚¹"
                          value={editingCoupon.minOrderValue ?? 0}
                          onChange={e => setEditingCoupon(ec => ({ ...ec, minOrderValue: +e.target.value }))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="Min Items"
                          value={editingCoupon.minItemCount ?? 0}
                          onChange={e => setEditingCoupon(ec => ({ ...ec, minItemCount: +e.target.value }))}
                        />
                      </td>
                      <td>
                        <input
                          placeholder="Description"
                          value={editingCoupon.description}
                          onChange={e => setEditingCoupon(ec => ({ ...ec, description: e.target.value }))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="Max usage per user"
                          value={editingCoupon.maxUsagePerUser ?? ""}
                          onChange={e => setEditingCoupon(ec => ({
                            ...ec,
                            maxUsagePerUser: e.target.value === "" ? null : +e.target.value
                          }))}
                        />
                      </td>
                      <td>
                        <label>
                          First Order Only:
                          <input
                            type="checkbox"
                            checked={editingCoupon.firstOrderOnly ?? false}
                            onChange={e =>
                              setEditingCoupon(ec => ({ ...ec, firstOrderOnly: e.target.checked }))
                            }
                          />
                        </label>
                      </td>
                      <td>
                        <button className="admin-btn" onClick={saveCoupon}>
                          Save
                        </button>
                        <button className="admin-btn" onClick={() => setEditingCoupon(null)}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  )}

                  {coupons.map(c => (
                    <tr key={c.id}>
                      <td>{c.code}</td>
                      <td>{c.discountType}</td>
                      <td>
                        {c.discountType === "percent"
                          ? `${c.discountValue}%`
                          : `â‚¹${c.discountValue}`}
                      </td>
                      <td>â‚¹{c.minOrderValue}</td>
                      <td>{c.minItemCount}</td>
                      <td>{c.description}</td>
                      <td>{c.maxUsagePerUser ?? "âˆž"}</td>
                      <td>{c.firstOrderOnly ? "âœ…" : "âŒ"}</td>
                      <td>
                        <button className="admin-btn" onClick={() => setEditingCoupon({ ...c })}>
                          Edit
                        </button>
                        <button className="admin-btn delete-btn" onClick={() => deleteCoupon(c.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="orders-tab">
              <h2>Manage Orders</h2>

              <div className="orders-header">
                <span>Total Orders: {orders.length}</span>

                <div className="order-tabs">
                  {["All", "Order Placed", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setOrderStatusTab(status)}
                      className={orderStatusTab === status ? "active" : ""}
                    >
                      {status === "Cancelled" ? "Cancelled Orders" : status}
                    </button>
                  ))}
                </div>

                <div className="order-search">
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="orders-list">
                {searchedOrders.length === 0 ? (
                  <p>No orders found.</p>
                ) : (
                  searchedOrders.map((order) => (
                    <div key={order.orderId} className="order-card-admin">
                      <div className="order-header">
                        <h3>Order #{order.orderId}</h3>
                        <span className={`order-status status-${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="order-details">
                        <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                        <p><strong>Customer:</strong> {order.userName} ({order.phone})</p>
                        <p><strong>Total:</strong> â‚¹{order.totalAmount}</p>
                        <p><strong>Payment:</strong> {order.paymentMode} - {order.paymentStatus}</p>
                        <p><strong>Items:</strong> {order.items?.length || 0} items</p>
                      </div>

                      {/* Refund Information */}
                      {order.refund?.id && (
                        <div className="refund-info">
                          <h4>Refund Details</h4>
                          <p><strong>Refund ID:</strong> {order.refund.id}</p>
                          <p><strong>Amount:</strong> â‚¹{(order.refund.amount / 100).toFixed(2)}</p>
                          <p>
                            <strong>Status:</strong> 
                            <span 
                              className="refund-status" 
                              style={{ color: getRefundStatusColor(order.refund.status) }}
                            >
                              {formatRefundStatus(order.refund.status)}
                            </span>
                          </p>
                          <p><strong>Speed:</strong> {order.refund.speedProcessed || order.refund.speed}</p>
                        </div>
                      )}

                      <div className="order-actions">
                        {order.status !== "Order Cancelled" && (
                          <div className="status-update">
                            <label>
                              Update Status:
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleOrderStatusUpdate(
                                    order.orderId,
                                    e.target.value,
                                    order.progressStep
                                  )
                                }
                              >
                                <option value="Order Placed">Order Placed</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                              </select>
                            </label>
                          </div>
                        )}

                        <button
                          className="admin-btn view-details-btn"
                          onClick={() => handleorderdetails(order)}
                          disabled={detailsLoading}
                        >
                          {detailsLoading ? "Loading..." : "View Details"}
                        </button>

                        {/* Refund Button */}
                        {order.paymentStatus === 'paid' && !order.refund?.id && order.status !== "Order Cancelled" && (
                          <button
                            className="admin-btn refund-btn"
                            onClick={() => handleRefund(order)}
                            disabled={refundProcessing[order.orderId]}
                          >
                            {refundProcessing[order.orderId] ? "Processing..." : "Issue Refund"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Details Modal */}
              {selectedOrder && (
                <OrderDetailsPopup
                  order={selectedOrder}
                  onClose={() => setSelectedOrder(null)}
                />
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="users-tab">
              <h2>User Details</h2>
              <div className="user-search">
                <input
                  type="text"
                  placeholder="Search users by name or phone..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
              </div>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div key={user.id} className="user-card">
                    <h3>{user.name}</h3>
                    <p>Email: {user.email}</p>
                    <p>Phone: {user.phone}</p>
                    <p>Total Orders: {user.orders.length}</p>
                    <p>Total Spent: â‚¹{user.orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}</p>
                    {user.orders.length > 0 && (
                      <div className="user-orders">
                        <h4>Recent Orders:</h4>
                        {user.orders.slice(0, 3).map((order) => (
                          <div key={order.orderId} className="user-order">
                            <span>
                              Order #{order.orderId} - â‚¹{order.totalAmount} - {order.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>No users found.</p>
              )}
            </div>
          )}

          {/* Queries Tab */}
          {activeTab === "queries" && (
            <div className="queries-tab">
              <h2>User Queries</h2>
              <div className="query-search">
                <input
                  type="text"
                  placeholder="Search queries by email, phone or date..."
                  value={querySearch}
                  onChange={(e) => setQuerySearch(e.target.value)}
                />
              </div>
              {(() => {
                const filteredQueries = queries.filter(
                  (q) =>
                    q.email?.toLowerCase().includes(querySearch.toLowerCase()) ||
                    q.phone?.includes(querySearch) ||
                    (q.createdAt && q.createdAt.includes(querySearch))
                );
                return filteredQueries.length > 0 ? (
                  filteredQueries.map((query, index) => (
                    <div key={index} className="query-card">
                      <p><strong>Name:</strong> {query.name}</p>
                      <p><strong>Email:</strong> {query.email}</p>
                      <p><strong>Phone:</strong> {query.phone}</p>
                      {query.createdAt && (
                        <p><strong>Date:</strong> {new Date(query.createdAt).toLocaleDateString()}</p>
                      )}
                      <p><strong>Message:</strong> {query.message}</p>
                    </div>
                  ))
                ) : (
                  <p>No queries found.</p>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default AdminPanel;

const OrderDetailsPopup = ({ order, onClose }) => {
  return (
    <div className="modal-overlay-chamkila">
      <div className="modal-content-badshah">
        <button onClick={onClose} className="close-btn-tata">Ã—</button>
        <h2>Order Details (#{order.orderId})</h2>
        
        <div className="order-info-section">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> {order.userName}</p>
          <p><strong>Phone:</strong> {order.phone}</p>
          <p><strong>Email:</strong> {order.userEmail}</p>
        </div>

        <div className="order-info-section">
          <h3>Order Information</h3>
          <p><strong>Order ID:</strong> {order.orderId}</p>
          <p><strong>Payment Mode:</strong> {order.paymentMode}</p>
          <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
          <p><strong>Total Amount:</strong> â‚¹{order.totalAmount}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        </div>

        <div className="order-info-section">
          <h3>Shipping Address</h3>
          <p>{order.address}, {order.city}, {order.state}, {order.zip}, {order.country}</p>
        </div>

        <div className="order-info-section">
          <h3>Products Ordered</h3>
          <div className="products-list">
            {(order.products || []).map(p => (
              <div key={p.productId} className="product-item">
                <img src={p.img} alt={p.productName} width="60" height="60" />
                <div className="product-details">
                  <p><strong>{p.productName}</strong></p>
                  <p>Size: {p.size}ml</p>
                  <p>Quantity: {p.quantity}</p>
                  <p>Price: â‚¹{p.price} each</p>
                  <p>Total: â‚¹{p.totalPrice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {order.refund?.id && (
          <div className="order-info-section">
            <h3>Refund Information</h3>
            <p><strong>Refund ID:</strong> {order.refund.id}</p>
            <p><strong>Amount:</strong> â‚¹{(order.refund.amount / 100).toFixed(2)}</p>
            <p><strong>Status:</strong> {order.refund.status}</p>
            <p><strong>Speed:</strong> {order.refund.speedProcessed || order.refund.speed}</p>
            {order.refund.created_at && (
              <p><strong>Initiated:</strong> {new Date(order.refund.created_at * 1000).toLocaleString()}</p>
            )}
            {order.refund.processed_at && (
              <p><strong>Completed:</strong> {new Date(order.refund.processed_at * 1000).toLocaleString()}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};