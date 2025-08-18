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
  
  // Using states and functions from UserContext
  const { users, getallusers, userdetails, getUserDetail } = useContext(UserContext);
  
  // Using states and functions from OrderContext
  const { orders, getorders, updateOrderStatus, getSingleOrderDetails, cancelOrder, loadingOrders } = useContext(OrderContext);
  
  const { queries, getquery } = useContext(ContactContext);
  const { user } = useUser();
  const [editingUser, setEditingUser] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderStatusTab, setOrderStatusTab] = useState("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
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
    refreshCoupons,
  } = useContext(CouponContext);

  // --- Data Fetching and Effects ---
  useEffect(() => {
    getallusers();
  }, [getallusers]);
  
  useEffect(() => {
    getquery();
  }, [getquery]);
  
  useEffect(() => {
    if (user) {
      getUserDetail();
    }
  }, [user, getUserDetail]);

  useEffect(() => {
    if (userdetails && userdetails.role !== "admin") {
      navigate("/");
    }
  }, [userdetails, navigate]);
  
  useEffect(() => {
    getorders(true, true);
  }, [getorders]);

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
  const averageOrderValue = totalOrders > 0 ?
  totalRevenue / totalOrders : 0;

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user?.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user?.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );
  
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
  
  // Replaced direct DB call with context function
  const handleorderdetails = async (order) => {
    setDetailsLoading(true);
    try {
      const orderDetails = await getSingleOrderDetails(order.orderId);
      if (orderDetails) {
        setSelectedOrder(orderDetails);
      }
    } catch (error) {
      console.error("Error fetching order products:", error);
      toast.error("Failed to load order details.");
    } finally {
      setDetailsLoading(false);
    }
  };
  
  // Functions to handle user management
  const handleEditUser = (user) => {
    setEditingUser(user);
  };
  
  // Replaced direct DB call with context function
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
  
  // Replaced direct DB call with context function
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
  
  // Functions to handle order management (these use the new functions from OrderContext)
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
  };
  
  const handleCancelOrder = async (orderId) => {
    await cancelOrder(orderId);
  };
  // --- JSX Rendering ---
  return (
    userdetails?.role === "admin" && (
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
                  {editingProduct && !products.find((p) => p.id === editingProduct.id) && (
                    <tr key="new-product">
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
                onClick={() => setEditingCoupon({ code: "", discountType: "percent", discountValue: 0, minOrderValue: 0, minItemCount: 0, description: "", validFrom: "", validUntil: "", firstOrderOnly: false, }) }
              >
                Add New Coupon
              </button>
              <table className="coupon-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Min. Order</th>
                    <th>Min. Items</th>
                    <th>Valid Until</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) =>
                    editingCoupon && editingCoupon.id === coupon.id ? (
                      <tr key={coupon.id}>
                        <td>
                          <input
                            type="text"
                            value={editingCoupon.code}
                            onChange={(e) =>
                              setEditingCoupon({
                                ...editingCoupon,
                                code: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editingCoupon.discountValue}
                            onChange={(e) =>
                              setEditingCoupon({
                                ...editingCoupon,
                                discountValue: parseFloat(e.target.value),
                              })
                            }
                          />
                          <select
                            value={editingCoupon.discountType}
                            onChange={(e) =>
                              setEditingCoupon({
                                ...editingCoupon,
                                discountType: e.target.value,
                              })
                            }
                          >
                            <option value="percent">%</option>
                            <option value="fixed">₹</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editingCoupon.minOrderValue}
                            onChange={(e) =>
                              setEditingCoupon({
                                ...editingCoupon,
                                minOrderValue: parseFloat(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editingCoupon.minItemCount}
                            onChange={(e) =>
                              setEditingCoupon({
                                ...editingCoupon,
                                minItemCount: parseInt(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            value={editingCoupon.validUntil?.split("T")[0] || ""}
                            onChange={(e) =>
                              setEditingCoupon({
                                ...editingCoupon,
                                validUntil: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <button className="admin-btn" onClick={() => saveCoupon(editingCoupon)}>
                            Save
                          </button>
                          <button
                            className="admin-btn"
                            onClick={() => setEditingCoupon(null)}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={coupon.id}>
                        <td>{coupon.code}</td>
                        <td>
                          {coupon.discountValue}
                          {coupon.discountType === "percent" ? "%" : "₹"}
                        </td>
                        <td>₹{coupon.minOrderValue}</td>
                        <td>{coupon.minItemCount}</td>
                        <td>
                          {coupon.validUntil
                            ? new Date(coupon.validUntil).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td>
                          <button
                            className="admin-btn"
                            onClick={() => setEditingCoupon(coupon)}
                          >
                            Edit
                          </button>
                          <button
                            className="admin-btn delete-btn"
                            onClick={() => deleteCoupon(coupon.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                  {editingCoupon && !coupons.find((c) => c.id === editingCoupon.id) && (
                    <tr key="new-coupon">
                      <td>
                        <input
                          type="text"
                          value={editingCoupon.code}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              code: e.target.value,
                            })
                          }
                          placeholder="Code"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingCoupon.discountValue}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              discountValue: parseFloat(e.target.value),
                            })
                          }
                          placeholder="Value"
                        />
                        <select
                          value={editingCoupon.discountType}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              discountType: e.target.value,
                            })
                          }
                        >
                          <option value="percent">%</option>
                          <option value="fixed">₹</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingCoupon.minOrderValue}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              minOrderValue: parseFloat(e.target.value),
                            })
                          }
                          placeholder="Min. Order"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingCoupon.minItemCount}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              minItemCount: parseInt(e.target.value),
                            })
                          }
                          placeholder="Min. Items"
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={editingCoupon.validUntil}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              validUntil: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <button className="admin-btn" onClick={() => saveCoupon(editingCoupon)}>
                          Add
                        </button>
                        <button
                          className="admin-btn"
                          onClick={() => setEditingCoupon(null)}
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
          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="tab-content orders-tab">
              <h2>Manage Orders</h2>
              <div className="filter-options">
                <input
                  type="text"
                  placeholder="Search by Order ID or User ID"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                />
                <select
                  value={orderStatusTab}
                  onChange={(e) => setOrderStatusTab(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Order Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="order-list-container">
                {loadingOrders ? (
                  <p>Loading orders...</p>
                ) : (
                  (orders.filter(order =>
                    (orderStatusTab === "All" || order.status === orderStatusTab) &&
                    (order.orderId?.includes(orderSearchQuery) || order.userId?.includes(orderSearchQuery))
                  ).length > 0) ? (
                    orders.filter(order =>
                      (orderStatusTab === "All" || order.status === orderStatusTab) &&
                      (order.orderId?.includes(orderSearchQuery) || order.userId?.includes(orderSearchQuery))
                    ).map((order) => (
                      <div key={order.orderId} className="order-card">
                        <h3>Order #{order.orderId}</h3>
                        <p>
                          <strong>User:</strong> {order.userId}
                        </p>
                        <p>
                          <strong>Total:</strong> ₹{order.totalAmount}
                        </p>
                        <p>
                          <strong>Status:</strong> {order.status}
                        </p>
                        <div className="order-actions">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(order.orderId, e.target.value)
                            }
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Order Cancelled">Cancelled</option>
                          </select>
                          <button
                            onClick={() => handleorderdetails(order)}
                            className="details-btn"
                          >
                            {detailsLoading ? "Loading..." : "View Details"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No orders found matching the criteria.</p>
                  )
                )}
              </div>
              {selectedOrder && (
                <div className="order-details-modal">
                  <div className="modal-content">
                    <button className="close-btn" onClick={() => setSelectedOrder(null)}>
                      &times;
                    </button>
                    <h3>Order #{selectedOrder.orderId} Details</h3>
                    <p>
                      <strong>User ID:</strong> {selectedOrder.userId}
                    </p>
                    <p>
                      <strong>Total Amount:</strong> ₹{selectedOrder.totalAmount}
                    </p>
                    <p>
                      <strong>Status:</strong> {selectedOrder.status}
                    </p>
                    <p>
                      <strong>Ordered On:</strong>{" "}
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                    <p>
                      <strong>Payment Mode:</strong> {selectedOrder.paymentMode}
                    </p>
                    <p>
                      <strong>Payment Status:</strong> {selectedOrder.paymentStatus}
                    </p>
                    <p>
                      <strong>Address:</strong> {selectedOrder.address}, {selectedOrder.city}, {selectedOrder.state}, {selectedOrder.zip}, {selectedOrder.country}
                    </p>
                    <h4>Products</h4>
                    <ul>
                      {(selectedOrder.products || []).map((product) => (
                        <li key={product.productId}>
                          <img src={product.imageurl} alt={product.productName} width="50" height="50" />
                          {product.productName} (x{product.quantity}) - ₹{product.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Users Tab */}
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
                            <p><strong>Street:</strong> {address.street}</p>
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
                        <div key={order.orderId} className="order-card-details">
                          <div className="order-summary">
                            <h5>Order #{order.orderId}</h5>
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
              <h2>Customer Queries</h2>
              <input
                type="text"
                placeholder="Search queries..."
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
                className="admin-search-input"
              />
              <div className="query-list-container">
                {queries
                  .filter(
                    (query) =>
                      query.name
                        .toLowerCase()
                        .includes(querySearch.toLowerCase()) ||
                      query.email
                        .toLowerCase()
                        .includes(querySearch.toLowerCase())
                  )
                  .map((query) => (
                    <div className="query-card" key={query.id}>
                      <h3>{query.name}</h3>
                      <p>
                        <strong>Email:</strong> {query.email}
                      </p>
                      <p>
                        <strong>Phone:</strong> {query.phone}
                      </p>
                      <p>
                        <strong>Message:</strong> {query.message}
                      </p>
                      <p>
                        <strong>Received:</strong>{" "}
                        {new Date(query.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default AdminPanel;