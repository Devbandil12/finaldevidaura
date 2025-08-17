import React, { useState, useContext, useEffect, useMemo } from "react";
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
  
  const { products, setProducts } = useContext(ProductContext);
  const { orders, setOrders, getorders } = useContext(OrderContext);
  const { queries, getquery } = useContext(ContactContext);
  const { user } = useUser();
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderStatusTab, setOrderStatusTab] = useState("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userkiDetails, setUserkiDetails] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [usersList, setUsersList] = useState([]);
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // NEW STATE VARIABLES
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [dailyRevenueData, setDailyRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [newUsersThisMonth, setNewUsersThisMonth] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState([]); // For bulk actions
  const { cart, wishlist } = useContext(CartContext);
  const { users, setUsers, getallusers } = useContext(UserContext);

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
    // The previous implementation used both local state and context. Let's use the context correctly.
    getallusers();
    getquery();
  }, [getallusers, getquery]);

  const userdetails = async () => {
    try {
      const res = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, user?.primaryEmailAddress?.emailAddress));
      setUserkiDetails(res[0]);
      if (res[0]?.role !== "admin") {
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

  useEffect(() => {
    refreshCoupons();
  }, [refreshCoupons]);
  
  // NEW useEffect to calculate advanced metrics
  useEffect(() => {
    const totalRev = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    setTotalRevenue(totalRev);

    const salesByDay = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      salesByDay[date] = (salesByDay[date] || 0) + (order.totalAmount || 0);
    });
    setDailyRevenueData(Object.keys(salesByDay).map(date => ({ date, revenue: salesByDay[date] })));

    const productSales = {};
    orders.forEach(order => {
      if (order.products) {
        order.products.forEach(product => {
          productSales[product.productId] = (productSales[product.productId] || 0) + product.quantity;
        });
      }
    });
    const sortedProducts = Object.keys(productSales).sort((a, b) => productSales[b] - productSales[a]);
    setTopProducts(sortedProducts.slice(0, 5).map(id => {
      const product = products.find(p => p.id === id);
      return product ? { name: product.name, sales: productSales[id] } : null;
    }).filter(p => p));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = users.filter(user => new Date(user.createdAt) > thirtyDaysAgo).length;
    setNewUsersThisMonth(newUsers);

  }, [orders, products, users]);

  // --- Analysis Data Calculation ---
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalUsers = users.length;
  const totalQueries = queries.length;

  const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
  const cancelledOrders = orders.filter(o => o.status === "Order Cancelled").length;
  const processingOrders = orders.filter(o => o.status === "Processing" || o.status === "Order Placed" || o.status === "Shipped").length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const usersWithOrdersAndQueries = useMemo(() => {
    return users.map((user) => ({
      ...user,
      orders: orders.filter((order) => order.userId === user.id),
      queries: queries.filter((query) => query.email === user.email),
    }));
  }, [users, orders, queries]);

  const filteredUsers = usersWithOrdersAndQueries.filter(
    (user) =>
      user?.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user?.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );


  // NEW FUNCTIONS
  const handleProductSelection = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const handleBulkDelete = async () => {
    if (userkiDetails?.role !== "admin") return;
    if (window.confirm("Are you sure you want to delete the selected products?")) {
      setLoading(true);
      try {
        await fetch(`${BASE}/api/products/bulk-delete`, { method: 'POST', body: JSON.stringify({ ids: selectedProducts }) });
        setProducts(products.filter(p => !selectedProducts.includes(p.id)));
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


  // --- Functions (existing) ---
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
      toast.success("Product added Successfully");
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

  const handleCouponSave = async () => {
    const payload = {
      code: editingCoupon.code.toUpperCase(),
      discountType: editingCoupon.discountType,
      discountValue: editingCoupon.discountValue,
      minOrderValue: editingCoupon.minOrderValue,
      minItemCount: editingCoupon.minItemCount,
      description: editingCoupon.description,
      validFrom: editingCoupon.validFrom,
      validUntil: editingCoupon.validUntil,
      usageLimit: editingCoupon.usageLimit,
      isForNewUsers: editingCoupon.isForNewUsers,
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

  const handleOrderStatusUpdate = (orderId, newStatus, newProgressStep) => {
    updateorderstatus(orderId, newStatus, newProgressStep);
    const updatedOrders = orders.map((order) =>
      order.id === orderId
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
          productName: productsTable.name,
          imageurl: productsTable.imageurl
        })
        .from(orderItemsTable)
        .innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
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

  // --- JSX Rendering ---
  return (
    user && userkiDetails.role === "admin" && (
      <div className="admin-panel-container">
        <ToastContainer />
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Admin Dashboard</h2>
          </div>
          <ul className="sidebar-nav">
            <li onClick={() => setActiveTab("dashboard")} className={activeTab === "dashboard" ? "active" : ""}>Dashboard</li>
            <li onClick={() => setActiveTab("products")} className={activeTab === "products" ? "active" : ""}>Products</li>
            <li onClick={() => setActiveTab("orders")} className={activeTab === "orders" ? "active" : ""}>Orders</li>
            <li onClick={() => setActiveTab("users")} className={activeTab === "users" ? "active" : ""}>Users</li>
            <li onClick={() => setActiveTab("coupons")} className={activeTab === "coupons" ? "active" : ""}>Coupons</li>
            <li onClick={() => setActiveTab("queries")} className={activeTab === "queries" ? "active" : ""}>Queries</li>
            <li onClick={() => setActiveTab("carts")} className={activeTab === "carts" ? "active" : ""}>Carts & Wishlists</li>
          </ul>
        </div>

        <div className="main-content">
          {openModal && <ImageUploadModal isopen={openModal} onClose={() => setOpenModal(false)} />}
          
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="dashboard-tab">
              <h2>Admin Dashboard</h2>
              <div className="dashboard-cards">
                <div className="card">
                  <h3>Total Revenue</h3>
                  <p>₹{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="card">
                  <h3>Total Orders</h3>
                  <p>{totalOrders}</p>
                </div>
                <div className="card">
                  <h3>Total Products</h3>
                  <p>{totalProducts}</p>
                </div>
                <div className="card">
                  <h3>Total Users</h3>
                  <p>{totalUsers}</p>
                </div>
                <div className="card">
                  <h3>Average Order Value</h3>
                  <p>₹{averageOrderValue.toFixed(2)}</p>
                </div>
                <div className="card">
                  <h3>Pending Queries</h3>
                  <p>{totalQueries}</p>
                </div>
                <div className="card">
                  <h3>New Users (30 Days)</h3>
                  <p>{newUsersThisMonth}</p>
                </div>
              </div>
              
              <div className="dashboard-charts">
                <div className="chart-container">
                  <h3>Orders Status Breakdown</h3>
                  <OrderChart
                    delivered={deliveredOrders}
                    pending={processingOrders}
                    cancelled={cancelledOrders}
                  />
                </div>
                <div className="chart-container">
                  <h3>Revenue Trend (Last 30 Days)</h3>
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
                <div className="chart-container">
                  <h3>Top 5 Selling Products</h3>
                  <Bar data={{
                      labels: topProducts.map(p => p.name),
                      datasets: [{
                          label: 'Total Sales',
                          data: topProducts.map(p => p.sales),
                          backgroundColor: 'rgba(153, 102, 255, 0.6)'
                      }]
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="products-tab">
              <h2>Manage Products</h2>
              <div className="products-actions">
                <button
                  className="admin-btn add-btn"
                  onClick={() => setOpenModal(true)}
                >
                  Add New Product
                </button>
                <button
                  className="admin-btn delete-btn"
                  onClick={handleBulkDelete}
                  disabled={selectedProducts.length === 0 || loading}
                >
                  {loading ? "Deleting..." : `Delete Selected (${selectedProducts.length})`}
                </button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(products.map(p => p.id));
                      } else {
                        setSelectedProducts([]);
                      }
                    }} /></th>
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
                        <td></td>
                        <td>{product.id}</td>
                        <td>
                          <img
                            src={editingProduct.imageurl}
                            alt={editingProduct.name}
                            width="50"
                            height="50"
                          />
                          <br />
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const imageUrl = URL.createObjectURL(file);
                              setEditingProduct({
                                ...editingProduct,
                                imageurl: imageUrl,
                              });
                            }
                          }} />
                        </td>
                        <td>
                          <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value, }) } />
                        </td>
                        <td>
                          <input type="number" value={editingProduct.oprice} onChange={(e) => setEditingProduct({ ...editingProduct, oprice: parseFloat(e.target.value), }) } />
                        </td>
                        <td>
                          <input type="number" value={editingProduct.discount} onChange={(e) => setEditingProduct({ ...editingProduct, discount: parseFloat(e.target.value), }) } />
                        </td>
                        <td>
                          <input type="number" value={editingProduct.size} onChange={(e) => setEditingProduct({ ...editingProduct, size: parseFloat(e.target.value), }) } />
                        </td>
                        <td>
                          <button className="admin-btn" onClick={() => handleProductUpdate(editingProduct)} > Save </button>
                          <button className="admin-btn" onClick={() => setEditingProduct(null)} > Cancel </button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={product.id}>
                        <td>
                          <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => handleProductSelection(product.id)} />
                        </td>
                        <td>{product.id}</td>
                        <td>
                          <img src={product.imageurl} alt={product.name} width="50" height="50" />
                        </td>
                        <td>{product.name}</td>
                        <td>₹{product.oprice}</td>
                        <td>{product.discount}</td>
                        <td>{product.size}</td>
                        <td>
                          <button className="admin-btn" onClick={() => setEditingProduct(product)} > Edit </button>
                          <button className="admin-btn delete-btn" onClick={() => handleProductDelete(product.id)} > {loading ? "deleting" : "delete"} </button>
                        </td>
                      </tr>
                    )
                  )}
                  {editingProduct && !products.find((p) => p.id === editingProduct.id) && (
                    <tr key={editingProduct.id}>
                      <td></td>
                      <td>{editingProduct.id}</td>
                      <td>
                        <img src={editingProduct.imageurl} alt={editingProduct.name} width="50" height="50" />
                        <br />
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const imageUrl = URL.createObjectURL(file);
                            setEditingProduct({
                              ...editingProduct,
                              imageurl: imageUrl,
                            });
                          }
                        }} />
                      </td>
                      <td>
                        <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value, }) } />
                      </td>
                      <td>
                        <input type="number" value={editingProduct.oprice} onChange={(e) => setEditingProduct({ ...editingProduct, oprice: parseFloat(e.target.value), }) } />
                      </td>
                      <td>
                        <input type="number" value={editingProduct.discount} onChange={(e) => setEditingProduct({ ...editingProduct, discount: parseFloat(e.target.value), }) } />
                      </td>
                      <td>
                        <input type="number" value={editingProduct.size} onChange={(e) => setEditingProduct({ ...editingProduct, size: parseFloat(e.target.value), }) } />
                      </td>
                      <td>
                        <button className="admin-btn" onClick={() => handleProductUpdate(editingProduct)} > Save </button>
                        <button className="admin-btn" onClick={() => setEditingProduct(null)} > Cancel </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === "coupons" && (
            <div className="coupons-tab">
              <h2>Manage Coupon Codes</h2>
              <button className="admin-btn add-btn" onClick={() => setEditingCoupon({ code: "", discountType: "percent", discountValue: 0, minOrderValue: 0, minItemCount: 0, description: "", validFrom: "", validUntil: "", usageLimit: 0, isForNewUsers: false, }) } > Add New Coupon </button>
              <table className="coupon-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min ₹</th>
                    <th>Min Items</th>
                    <th>Description</th>
                    <th>Valid From</th>
                    <th>Valid Until</th>
                    <th>Usage Limit</th>
                    <th>For New Users</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {editingCoupon && (
                    <tr>
                      <td> <input placeholder="Code" value={editingCoupon.code || ""} onChange={e => setEditingCoupon(ec => ({ ...ec, code: e.target.value }))} /> </td>
                      <td> <select value={editingCoupon.discountType} onChange={e => setEditingCoupon(ec => ({ ...ec, discountType: e.target.value }))} > <option value="percent">percent</option> <option value="flat">flat</option> </select> </td>
                      <td> <input type="number" placeholder="Value" value={editingCoupon.discountValue ?? 0} onChange={e => setEditingCoupon(ec => ({ ...ec, discountValue: parseFloat(e.target.value) }))} /> </td>
                      <td> <input type="number" placeholder="Min Order" value={editingCoupon.minOrderValue ?? 0} onChange={e => setEditingCoupon(ec => ({ ...ec, minOrderValue: parseFloat(e.target.value) }))} /> </td>
                      <td> <input type="number" placeholder="Min Items" value={editingCoupon.minItemCount ?? 0} onChange={e => setEditingCoupon(ec => ({ ...ec, minItemCount: parseFloat(e.target.value) }))} /> </td>
                      <td> <input placeholder="Description" value={editingCoupon.description || ""} onChange={e => setEditingCoupon(ec => ({ ...ec, description: e.target.value }))} /> </td>
                      <td> <input type="date" value={editingCoupon.validFrom || ""} onChange={e => setEditingCoupon(ec => ({ ...ec, validFrom: e.target.value }))} /> </td>
                      <td> <input type="date" value={editingCoupon.validUntil || ""} onChange={e => setEditingCoupon(ec => ({ ...ec, validUntil: e.target.value }))} /> </td>
                      <td> <input type="number" placeholder="Usage Limit" value={editingCoupon.usageLimit ?? 0} onChange={e => setEditingCoupon(ec => ({ ...ec, usageLimit: parseFloat(e.target.value) }))} /> </td>
                      <td> <input type="checkbox" checked={editingCoupon.isForNewUsers || false} onChange={e => setEditingCoupon(ec => ({ ...ec, isForNewUsers: e.target.checked }))} /> </td>
                      <td> <button className="admin-btn" onClick={handleCouponSave} >Save</button> <button className="admin-btn delete-btn" onClick={() => setEditingCoupon(null)} >Cancel</button> </td>
                    </tr>
                  )}
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td>{coupon.code}</td>
                      <td>{coupon.discountType}</td>
                      <td>{coupon.discountValue}</td>
                      <td>{coupon.minOrderValue}</td>
                      <td>{coupon.minItemCount}</td>
                      <td>{coupon.description}</td>
                      <td>{coupon.validFrom ? new Date(coupon.validFrom).toLocaleDateString() : 'N/A'}</td>
                      <td>{coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : 'N/A'}</td>
                      <td>{coupon.usageLimit}</td>
                      <td>{coupon.isForNewUsers ? "Yes" : "No"}</td>
                      <td>
                        <button className="admin-btn" onClick={() => setEditingCoupon(coupon)} >Edit</button>
                        <button className="admin-btn delete-btn" onClick={() => handleCouponDelete(coupon.id)} >Delete</button>
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
              <div className="order-actions">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="admin-search-input"
                />
                <select onChange={(e) => setOrderStatusTab(e.target.value)} value={orderStatusTab} className="admin-filter-select">
                  <option value="All">All</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Order Cancelled">Cancelled</option>
                </select>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>User ID</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter(order =>
                      orderStatusTab === "All" || order.status === orderStatusTab
                    )
                    .filter(order =>
                      String(order.orderId).toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                      String(order.userId).toLowerCase().includes(orderSearchQuery.toLowerCase())
                    )
                    .map((order) => (
                      <tr key={order.orderId}>
                        <td>{order.orderId}</td>
                        <td>{order.userId}</td>
                        <td>₹{order.totalAmount}</td>
                        <td>{order.status}</td>
                        <td>{order.paymentMode} ({order.paymentStatus})</td>
                        <td>{new Date(order.createdAt).toLocaleString()}</td>
                        <td>
                          <button
                            className="admin-btn"
                            onClick={() => handleorderdetails(order)}
                            disabled={detailsLoading}
                          >
                            Details
                          </button>
                          <select onChange={(e) => handleOrderStatusUpdate(order.orderId, e.target.value, e.target.selectedIndex)}>
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
              {selectedOrder && (
                <div className="order-details-modal">
                  <div className="order-details-content">
                    <h3>Order Details for #{selectedOrder.orderId}</h3>
                    <p><strong>User ID:</strong> {selectedOrder.userId}</p>
                    <p><strong>Payment Mode:</strong> {selectedOrder.paymentMode}</p>
                    <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus}</p>
                    <p><strong>Total:</strong> ₹{selectedOrder.totalAmount}</p>
                    <p><strong>Status:</strong> {selectedOrder.status}</p>
                    <p><strong>Address:</strong> {selectedOrder.address}, {selectedOrder.city}, {selectedOrder.state}, {selectedOrder.zip}, {selectedOrder.country}</p>
                    <p><strong>Products:</strong></p>
                    <ul>
                      {(selectedOrder.products || []).map(p => (
                        <li key={p.productId}>
                          <img src={p.imageurl} alt={p.productName} width="50" height="50" />
                          {p.productName} (x{p.quantity}) - ₹{p.price}
                        </li>
                      ))}
                    </ul>
                    <p><strong>Created At:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    {selectedOrder.refund?.id && (
                      <div>
                        <h3>Refund Details</h3>
                        <p><strong>Refund ID:</strong> {selectedOrder.refund.id}</p>
                        <p><strong>Refund Amount:</strong> ₹{(selectedOrder.refund.amount / 100).toFixed(2)}</p>
                        <p><strong>Refund Status:</strong> {selectedOrder.refund.status}</p>
                        <p><strong>Refund Speed:</strong> {selectedOrder.refund.speedProcessed}</p>
                        <p><strong>Refund Initiated At:</strong> {new Date(selectedOrder.refund.created_at * 1000).toLocaleString()}</p>
                        {selectedOrder.refund.processed_at && (
                          <p><strong>Refund Processed At:</strong> {new Date(selectedOrder.refund.processed_at * 1000).toLocaleString()}</p>
                        )}
                      </div>
                    )}
                    <button className="admin-btn" onClick={() => setSelectedOrder(null)}>Close</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="users-tab">
              <h2>Manage Users</h2>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="admin-search-input"
              />
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Registered At</th>
                    <th>Total Orders</th>
                    <th>Total Queries</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>{user.orders.length}</td>
                      <td>{user.queries.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Queries Tab */}
          {activeTab === "queries" && (
            <div className="queries-tab">
              <h2>User Queries</h2>
              <input
                type="text"
                placeholder="Search queries by name or email..."
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
                className="admin-search-input"
              />
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queries
                    .filter(query =>
                      query.name.toLowerCase().includes(querySearch.toLowerCase()) ||
                      query.email.toLowerCase().includes(querySearch.toLowerCase())
                    )
                    .map((query) => (
                      <tr key={query.id}>
                        <td>{query.name}</td>
                        <td>{query.email}</td>
                        <td>{query.subject}</td>
                        <td>{query.message}</td>
                        <td>{new Date(query.createdAt).toLocaleString()}</td>
                        <td>
                          {/* Add a delete button or other actions here */}
                          <button className="admin-btn delete-btn">Delete</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Carts & Wishlists Tab */}
          {activeTab === "carts" && (
            <div className="carts-tab">
              <h2>Carts & Wishlists (Admin View)</h2>
              <p>This section is for future implementation to show all user carts and wishlists. </p>
              <p>You can use the existing `CartContext` to fetch and manage this data.</p>
              <p>Current cart count: {cart.length}</p>
              <p>Current wishlist count: {wishlist.length}</p>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default AdminPanel;

