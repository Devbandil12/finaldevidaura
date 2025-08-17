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
import { CouponContext } from "../contexts/CouponContext";
import { toast, ToastContainer } from "react-toastify";
import OrderChart from "./OrderChart";
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement } from 'chart.js';
import 'chart.js/auto';
import { UserContext } from "../contexts/UserContext"; // NEW IMPORT
import { CartContext } from "../contexts/CartContext"; // NEW IMPORT

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
  const { cart, wishlist } = useContext(CartContext); // Use Cart & Wishlist context
  const { users, setUsers, getusers } = useContext(UserContext); // Use UserContext

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
    getusers(); // Fetch all users using the updated context
  }, []);

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
  const totalUsers = usersList.length;
  const totalQueries = queries.length;

  const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
  const cancelledOrders = orders.filter(o => o.status === "Order Cancelled").length;
  const processingOrders = orders.filter(o => o.status === "Processing" || o.status === "Order Placed" || o.status === "Shipped").length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
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
        // You would call your backend API here to delete multiple products
        // e.g. await fetch(`${BASE}/api/products/bulk-delete`, { method: 'POST', body: JSON.stringify({ ids: selectedProducts }) });
        
        // Simulating the deletion for front-end state
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
  
  const usersWithOrders = usersList.map((user) => ({
    ...user,
    orders: orders.filter((order) => order.userId === user.id),
  }));
  
  const filteredUsers = usersWithOrders.filter(
    (user) =>
      user?.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user?.phone?.includes(userSearchQuery)
  );

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
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleProductSelection(product.id)}
                          />
                        </td>
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
                        <td>₹{product.oprice}</td>
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
                  {editingProduct &&
                    !products.find((p) => p.id === editingProduct.id) && (
                      <tr key={editingProduct.id}>
                        <td></td>
                        <td>{editingProduct.id}</td>
                        <td>
                          <img
                            src={editingProduct.imageurl}
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
                    <th>Min ₹</th>
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
                          placeholder="Min ₹"
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
                        <button className="admin-btn" onClick={handleCouponSave}>
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
                          : `₹${c.discountValue}`}
                      </td>
                      <td>₹{c.minOrderValue}</td>
                      <td>{c.minItemCount}</td>
                      <td>{c.description}</td>
                      <td>{c.maxUsagePerUser ?? "∞"}</td>
                      <td>{c.firstOrderOnly ? "✅" : "❌"}</td>
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
              <h2>
                {orderStatusTab === "Cancelled" ? "Cancelled Orders" : "Manage Orders"}
              </h2>
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
              {orders
                .filter((o) => {
                  if (orderStatusTab === "All") return true;
                  if (orderStatusTab === "Cancelled") return o.status === "Order Cancelled";
                  return o.status === orderStatusTab;
                })
                .filter((o) =>
                  o.orderId.toString().includes(orderSearchQuery.trim())
                )
                .map((order) => (
                  <div key={order.orderId} className="order-card-admin">
                    <h3>Order #{order.orderId}</h3>
                    <p><strong>Date:</strong> {order.createdAt}</p>
                    <p><strong>Total:</strong> ₹{order.totalAmount}</p>
                    <p><strong>Current Status:</strong></p>
                    {order.status === "Order Cancelled" ? (
                      <span className="status-badge status-ordercancelled">
                        Order Cancelled
                      </span>
                    ) : (
                      <div>
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
                      className="view-details-btn-dhamaal"
                      onClick={() => handleorderdetails(order)}
                    >
                      See More Details
                    </button>
                  </div>
                ))}
              {orders
                .filter((o) => {
                  if (orderStatusTab === "All") return true;
                  if (orderStatusTab === "Cancelled") return o.status === "Order Cancelled";
                  return o.status === orderStatusTab;
                })
                .filter((o) =>
                  o.orderId.toString().includes(orderSearchQuery.trim())
                ).length === 0 && <p>No orders found.</p>}
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
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Total Orders</th>
                      <th>Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const userOrders = orders.filter(order => order.userId === user.id);
                      const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                      return (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{userOrders.length}</td>
                          <td>₹{totalSpent.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p>No users found.</p>
              )}
            </div>
          )}

          {/* New Carts & Wishlists Tab */}
          {activeTab === "carts" && (
            <div className="carts-tab">
              <h2>Carts & Wishlists</h2>
              
              <div className="section-container">
                <h4>Abandoned Carts</h4>
                {/* Note: This is a simple view. Your backend needs to differentiate between active and abandoned carts. */}
                {cart && cart.length > 0 ? (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName || 'N/A'}</td>
                          <td>{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No abandoned carts found.</p>
                )}
              </div>

              <div className="section-container">
                <h4>Popular Wishlist Items</h4>
                {/* Tally the items across all wishlists. This logic might be better in the backend. */}
                {wishlist && wishlist.length > 0 ? (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Placeholder for actual logic to aggregate items from all wishlists */}
                      <tr>
                        <td>Example Product A</td>
                        <td>5</td>
                      </tr>
                      <tr>
                        <td>Example Product B</td>
                        <td>3</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p>No items in wishlists.</p>
                )}
              </div>
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
                    q.email.toLowerCase().includes(querySearch.toLowerCase()) ||
                    q.phone.includes(querySearch) ||
                    (q.date && q.date.includes(querySearch))
                );
                return filteredQueries.length > 0 ? (
                  filteredQueries.map((query, index) => (
                    <div key={index} className="query-card">
                      <p>
                        <strong>Email:</strong> {query.email}
                      </p>
                      <p>
                        <strong>Phone:</strong> {query.phone}
                      </p>
                      {query.date && (
                        <p>
                          <strong>Date:</strong> {query.date}
                        </p>
                      )}
                      <p>
                        <strong>Message:</strong> {query.message}
                      </p>
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

// The OrderDetailsPopup and ImageUploadModal components need to be imported
// or defined in this file if they are not separate files.
const OrderDetailsPopup = ({ order, onClose }) => {
  return (
    <div className="modal-overlay-chamkila">
      <div className="modal-content-badshah">
        <button onClick={onClose} className="close-btn-tata">×</button>
        <h2>Order Details (#{order.orderId})</h2>
        <p><strong>User Name:</strong> {order.userName}</p>
        <p><strong>Phone:</strong> {order.phone}</p>
        <p><strong>Payment Mode:</strong> {order.paymentMode}</p>
        <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
        <p><strong>Total:</strong> ₹{order.totalAmount}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Address:</strong> {order.address}, {order.city}, {order.state}, {order.zip}, {order.country}</p>
        <p><strong>Products:</strong></p>
        <ul>
          {(order.products || []).map(p => (
            <li key={p.productId}>
              <img src={p.imageurl} alt={p.productName} width="50" height="50" />
              {p.productName} (x{p.quantity}) - ₹{p.price}
            </li>
          ))}
        </ul>
        <p><strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        {order.refund?.id && (
          <div>
            <h3>Refund Details</h3>
            <p><strong>Refund ID:</strong> {order.refund.id}</p>
            <p><strong>Refund Amount:</strong> ₹{(order.refund.amount / 100).toFixed(2)}</p>
            <p><strong>Refund Status:</strong> {order.refund.status}</p>
            <p><strong>Refund Speed:</strong> {order.refund.speedProcessed}</p>
            <p><strong>Refund Initiated At:</strong> {new Date(order.refund.created_at * 1000).toLocaleString()}</p>
            {order.refund.processed_at && (
              <p><strong>Refund Completed At:</strong> {new Date(order.refund.processed_at * 1000).toLocaleString()}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
