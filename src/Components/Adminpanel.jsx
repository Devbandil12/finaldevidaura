// src/components/Adminpanel.jsx
import React, { useState, useContext, useEffect, useCallback } from "react";
import "../style/adminPanel.css";
import { OrderContext } from "../contexts/OrderContext";
import { UserContext } from "../contexts/UserContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ImageUploadModal from "./ImageUploadModal";
import { CouponContext } from "../contexts/CouponContext";
import { toast, ToastContainer } from "react-toastify";
import OrderChart from "./OrderChart";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { products, updateProduct, deleteProduct } = useContext(ProductContext);
  const { users, getallusers, userdetails } = useContext(UserContext);
  const { orders, getorders, updateOrderStatus, getSingleOrderDetails, cancelOrder } = useContext(OrderContext);
  const { queries, getquery } = useContext(ContactContext);
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
    if (userdetails?.role !== "admin" && userdetails !== null) {
      navigate("/");
    }
  }, [userdetails, navigate]);

  useEffect(() => {
    getallusers();
  }, [getallusers]);

  useEffect(() => {
    getorders(true, true);
  }, [getorders]);

  useEffect(() => {
    getquery();
  }, [getquery]);

  useEffect(() => {
    refreshCoupons();
  }, [refreshCoupons]);

  // --- Analysis Data Calculation ---
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalUsers = users.length;
  const totalQueries = queries.length;

  const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
  const cancelledOrders = orders.filter(o => o.status === "Order Cancelled").length;
  const processingOrders = orders.filter(o => o.status === "Processing" || o.status === "Order Placed" || o.status === "Shipped").length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // --- Functions (existing) ---
  const handleProductUpdate = async () => {
    setLoading(true);
    try {
      await updateProduct(editingProduct.id, {
        ...editingProduct,
        discount: Number(editingProduct.discount),
        oprice: Number(editingProduct.oprice),
        size: Number(editingProduct.size),
        quantity: Number(editingProduct.quantity),
      });
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
      const details = await getSingleOrderDetails(order.orderId);
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

  const filteredUsers = users.filter(
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
      getallusers();
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
      getallusers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user.");
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
  };

  const handleCancelOrder = async (orderId) => {
    await cancelOrder(orderId);
  };

  // --- JSX Rendering ---
  return (
    user && userdetails?.role === "admin" && (
      <div className="admin-panel">
        <div className="absolute">
          <ToastContainer />
        </div>
        
        <nav className="admin-nav">
          <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
          <button onClick={() => setActiveTab("products")}>Products</button>
          <button onClick={() => setActiveTab("coupons")}>Coupon Codes</button>
          <button onClick={() => setActiveTab("orders")}>Orders</button>
          <button onClick={() => setActiveTab("users")}>Users</button>
          <button onClick={() => setActiveTab("queries")}>Queries</button>
        </nav>

        <div className="admin-content">
          {openModal && <ImageUploadModal isopen={openModal} onClose={() => setOpenModal(false)} />}

          {/* New Dashboard Tab */}
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
                    <th>Valid From</th>
                    <th>Valid Until</th>
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
                          onChange={(e) =>
                            setEditingCoupon((ec) => ({ ...ec, code: e.target.value }))
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={editingCoupon.discountType}
                          onChange={(e) =>
                            setEditingCoupon((ec) => ({
                              ...ec,
                              discountType: e.target.value,
                            }))
                          }
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
                          onChange={(e) =>
                            setEditingCoupon((ec) => ({
                              ...ec,
                              discountValue: +e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="Min ₹"
                          value={editingCoupon.minOrderValue ?? 0}
                          onChange={(e) =>
                            setEditingCoupon((ec) => ({
                              ...ec,
                              minOrderValue: +e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="Min Items"
                          value={editingCoupon.minItemCount ?? 0}
                          onChange={(e) =>
                            setEditingCoupon((ec) => ({
                              ...ec,
                              minItemCount: +e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          placeholder="Description"
                          value={editingCoupon.description}
                          onChange={(e) =>
                            setEditingCoupon((ec) => ({
                              ...ec,
                              description: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="Max usage per user"
                          value={editingCoupon.maxUsagePerUser ?? ""}
                          onChange={(e) =>
                            setEditingCoupon((ec) => ({
                              ...ec,
                              maxUsagePerUser: e.target.value === "" ? null : +e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td>
                        <label>
                          <input
                            type="checkbox"
                            checked={editingCoupon.firstOrderOnly ?? false}
                            onChange={(e) =>
                              setEditingCoupon((ec) => ({
                                ...ec,
                                firstOrderOnly: e.target.checked,
                              }))
                            }
                          />
                        </label>
                      </td>
                      <td>
                        <input
                          type="date"
                          value={
                            editingCoupon.validFrom
                              ? new Date(editingCoupon.validFrom).toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setEditingCoupon((ec) => ({
                              ...ec,
                              validFrom: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={
                            editingCoupon.validUntil
                              ? new Date(editingCoupon.validUntil).toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setEditingCoupon((ec) => ({
                              ...ec,
                              validUntil: e.target.value,
                            }))
                          }
                        />
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
                  {coupons.map((c) => (
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
                      <td>{new Date(c.validFrom).toLocaleDateString()}</td>
                      <td>{new Date(c.validUntil).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="admin-btn"
                          onClick={() => setEditingCoupon({ ...c })}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn delete-btn"
                          onClick={() => deleteCoupon(c.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
                  o.id.toString().includes(orderSearchQuery.trim())
                )
                .map((order) => (
                  <div key={order.id} className="order-card-admin">
                    <h3>Order #{order.id}</h3>
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
                              handleUpdateOrderStatus(order.orderId, e.target.value)
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

          {activeTab === "users" && (
  <div className="tab-content users-tab">
    <h2>Manage Users</h2>
    <input
      type="text"
      placeholder="Search users..."
      value={userSearchQuery}
      onChange={(e) => setUserSearchQuery(e.target.value)}
      className="admin-search-input"
    />

    {editingUser ? (
      <div className="user-edit-form">
        <button onClick={() => setEditingUser(null)} className="back-button">
          &larr; Back to Users
        </button>
        <h3>User Details: {editingUser.name}</h3>

        <div className="user-details-section">
          <div className="user-info">
            <p><strong>Name:</strong> {editingUser.name}</p>
            <p><strong>Email:</strong> {editingUser.email}</p>
            <p><strong>Phone:</strong> {editingUser.phone || 'N/A'}</p>
            <p><strong>Role:</strong> {editingUser.role}</p>
            <p><strong>Joined At:</strong> {new Date(editingUser.createdAt).toLocaleString()}</p>
          </div>

          <div className="addresses-list">
            <h4>User Addresses</h4>
            {editingUser.addresses && editingUser.addresses.length > 0 ? (
              editingUser.addresses.map((address) => (
                <div key={address.id} className="address-card">
                  <p><strong>Street:</strong> {address.address}</p>
                  <p><strong>City:</strong> {address.city}</p>
                  <p><strong>State:</strong> {address.state}</p>
                  <p><strong>Zip:</strong> {address.zipCode}</p>
                  <p><strong>Country:</strong> {address.country}</p>
                </div>
              ))
            ) : (
              <p>No addresses found for this user.</p>
            )}
          </div>
        </div>

        <div className="user-orders-section">
          <h4>User Orders ({editingUser.orders ? editingUser.orders.length : 0})</h4>
          {editingUser.orders && editingUser.orders.length > 0 ? (
            editingUser.orders.map((order) => (
              <div key={order.id} className="order-card-details">
                <div className="order-summary">
                  <h5>Order #{order.id}</h5>
                  <p><strong>Total:</strong> ₹{order.totalAmount}</p>
                  <p><strong>Status:</strong> {order.status}</p>
                  <p><strong>Ordered On:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="order-details-actions">
                  <p><strong>Change Status:</strong></p>
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateOrderStatus(order.orderId, e.target.value)}
                  >
                    {["Pending", "Processing", "Shipped", "Delivered", "Canceled"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {order.status !== "Canceled" && (
                    <button onClick={() => handleCancelOrder(order.orderId)}>Cancel Order</button>
                  )}
                </div>
                <div className="order-products-list">
                  <h6>Products:</h6>
                  <ul>
                    {(order.orderItems || []).map(item => (
                      <li key={item.id}>
                        {item.productName} (x{item.quantity}) - ₹{item.price}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          ) : (
            <p>No orders found for this user.</p>
          )}
        </div>
      </div>
    ) : (
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Joined At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{new Date(user.createdAt).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleEditUser(user)}>View Details</button>
                  <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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