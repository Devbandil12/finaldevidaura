import React, { useState, useContext, useEffect } from "react";
import "../style/adminPanel.css";
import { OrderContext } from "../contexts/OrderContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { UserContext } from "../contexts/UserContext";
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
  const { orders, setOrders, getorders, updateOrderStatus, getSingleOrderDetails } = useContext(OrderContext);
  const { queries, getquery, deleteQuery } = useContext(ContactContext);
  const { user } = useUser();
  const { userdetails, getallusers } = useContext(UserContext);

  const [editingProduct, setEditingProduct] = useState(null);
  const [orderStatusTab, setOrderStatusTab] = useState("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userkiDetails, setUserkiDetails] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [usersList, setUsersList] = useState([]);

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
    const fetchAllUsers = async () => {
      const allUsers = await getallusers();
      if (allUsers) {
        setUsersList(allUsers);
      }
    };
    fetchAllUsers();
    getquery();
  }, []);

  useEffect(() => {
    if (user && userdetails) {
      if (userdetails.role !== "admin") {
        navigate("/");
      }
    }
  }, [user, userdetails]);

  useEffect(() => {
    getorders(true, true);
  }, []);

  useEffect(() => {
    refreshCoupons();
  }, [refreshCoupons]);

  // --- Analysis Data Calculation ---
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalUsers = usersList.length;
  const totalQueries = queries.length;
  const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
  const cancelledOrders = orders.filter(o => o.status === "Order Cancelled").length;
  const processingOrders = orders.filter(o => o.status === "Processing" || o.status === "Order Placed" || o.status === "Shipped").length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // --- Functions (existing) ---
  const handleProductUpdate = async (updatedProduct) => {
    await updateProduct(updatedProduct);
    setEditingProduct(null);
  };

  const handleProductDelete = async (productId) => {
    if (userdetails?.role !== "admin") return;
    setLoading(true);
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(productId);
    }
    setLoading(false);
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
    await saveCoupon(payload);
  };

  const handleCouponDelete = async id => {
    if (!window.confirm("Delete this coupon?")) return;
    await deleteCoupon(id);
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
    const updatedOrders = orders.map((order) =>
      order.id === orderId
        ? { ...order, status: newStatus }
        : order
    );
    setOrders(updatedOrders);
  };

  const handleorderdetails = async (orderId) => {
    setDetailsLoading(true);
    const orderDetails = await getSingleOrderDetails(orderId);
    if (orderDetails) {
      setSelectedOrder(orderDetails);
    }
    setDetailsLoading(false);
  };

  const handleQueryDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this query?")) return;
    await deleteQuery(id);
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
    user &&
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
          {openModal && (
            <ImageUploadModal isopen={openModal} onClose={() => setOpenModal(false)} />
          )}

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
                  <h3>Total Queries</h3>
                  <p>{totalQueries}</p>
                </div>
                <div className="card">
                  <h3>Average Order Value</h3>
                  <p>₹{averageOrderValue.toFixed(2)}</p>
                </div>
                <div className="card">
                  <h3>Delivered Orders</h3>
                  <p>{deliveredOrders}</p>
                </div>
                <div className="card">
                  <h3>Cancelled Orders</h3>
                  <p>{cancelledOrders}</p>
                </div>
                <div className="card">
                  <h3>Processing Orders</h3>
                  <p>{processingOrders}</p>
                </div>
              </div>
              <OrderChart orders={orders} />
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="products-tab">
              <h2>Products Management</h2>
              <button
                className="add-product-btn"
                onClick={() => setOpenModal(true)}
              >
                Add Product
              </button>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Discount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <img src={product.imageurl} alt={product.name} />
                      </td>
                      <td>{product.name}</td>
                      <td>₹{product.price}</td>
                      <td>{product.discount}%</td>
                      <td>
                        <button
                          className="edit-btn"
                          onClick={() => setEditingProduct(product)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleProductDelete(product.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {editingProduct && (
                <div className="modal">
                  <div className="modal-content">
                    <h3>Edit Product</h3>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleProductUpdate(editingProduct);
                      }}
                    >
                      <input
                        type="text"
                        name="name"
                        value={editingProduct.name || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            name: e.target.value,
                          })
                        }
                        placeholder="Product Name"
                      />
                      <input
                        type="number"
                        name="oprice"
                        value={editingProduct.oprice || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            oprice: Number(e.target.value),
                          })
                        }
                        placeholder="Original Price"
                      />
                      <input
                        type="number"
                        name="discount"
                        value={editingProduct.discount || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            discount: Number(e.target.value),
                          })
                        }
                        placeholder="Discount"
                      />
                      <input
                        type="text"
                        name="size"
                        value={editingProduct.size || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            size: e.target.value,
                          })
                        }
                        placeholder="Size"
                      />
                      <input
                        type="text"
                        name="imageurl"
                        value={editingProduct.imageurl || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            imageurl: e.target.value,
                          })
                        }
                        placeholder="Image URL"
                      />
                      <button type="submit">Save</button>
                      <button onClick={() => setEditingProduct(null)}>
                        Cancel
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === "coupons" && (
            <div className="coupons-tab">
              <h2>Coupon Codes Management</h2>
              <button
                className="add-coupon-btn"
                onClick={() =>
                  setEditingCoupon({
                    code: "",
                    discountType: "percentage",
                    discountValue: 0,
                    minOrderValue: 0,
                    minItemCount: 0,
                    description: "",
                    validFrom: "",
                    validUntil: "",
                  })
                }
              >
                Add New Coupon
              </button>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td>{coupon.code}</td>
                      <td>{coupon.discountType}</td>
                      <td>{coupon.discountValue}</td>
                      <td>{coupon.minOrderValue}</td>
                      <td>
                        <button
                          className="edit-btn"
                          onClick={() => setEditingCoupon(coupon)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleCouponDelete(coupon.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {editingCoupon && (
                <div className="modal">
                  <div className="modal-content">
                    <h3>
                      {editingCoupon.id ? "Edit Coupon" : "Add New Coupon"}
                    </h3>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleCouponSave();
                      }}
                    >
                      <input
                        type="text"
                        name="code"
                        value={editingCoupon.code}
                        onChange={(e) =>
                          setEditingCoupon({
                            ...editingCoupon,
                            code: e.target.value,
                          })
                        }
                        placeholder="Coupon Code"
                        disabled={!!editingCoupon.id}
                      />
                      <select
                        name="discountType"
                        value={editingCoupon.discountType}
                        onChange={(e) =>
                          setEditingCoupon({
                            ...editingCoupon,
                            discountType: e.target.value,
                          })
                        }
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed</option>
                      </select>
                      <input
                        type="number"
                        name="discountValue"
                        value={editingCoupon.discountValue}
                        onChange={(e) =>
                          setEditingCoupon({
                            ...editingCoupon,
                            discountValue: Number(e.target.value),
                          })
                        }
                        placeholder="Discount Value"
                      />
                      <input
                        type="number"
                        name="minOrderValue"
                        value={editingCoupon.minOrderValue}
                        onChange={(e) =>
                          setEditingCoupon({
                            ...editingCoupon,
                            minOrderValue: Number(e.target.value),
                          })
                        }
                        placeholder="Min Order Value"
                      />
                      <input
                        type="number"
                        name="minItemCount"
                        value={editingCoupon.minItemCount}
                        onChange={(e) =>
                          setEditingCoupon({
                            ...editingCoupon,
                            minItemCount: Number(e.target.value),
                          })
                        }
                        placeholder="Min Item Count"
                      />
                      <textarea
                        name="description"
                        value={editingCoupon.description}
                        onChange={(e) =>
                          setEditingCoupon({
                            ...editingCoupon,
                            description: e.target.value,
                          })
                        }
                        placeholder="Description"
                      />
                      <label>
                        Valid From:
                        <input
                          type="date"
                          name="validFrom"
                          value={editingCoupon.validFrom}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              validFrom: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        Valid Until:
                        <input
                          type="date"
                          name="validUntil"
                          value={editingCoupon.validUntil}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              validUntil: e.target.value,
                            })
                          }
                        />
                      </label>
                      <button type="submit">Save</button>
                      <button onClick={() => setEditingCoupon(null)}>
                        Cancel
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="orders-tab">
              <h2>Orders Management</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>User</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.name}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>₹{order.totalAmount}</td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleOrderStatusUpdate(order.id, e.target.value)
                          }
                        >
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Order Cancelled">
                            Order Cancelled
                          </option>
                        </select>
                      </td>
                      <td>
                        <button onClick={() => handleorderdetails(order.id)}>
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedOrder && (
                <div className="order-details-modal">
                  <div className="order-details-content">
                    <h3>Order Details</h3>
                    <button
                      className="close-btn"
                      onClick={() => setSelectedOrder(null)}
                    >
                      &times;
                    </button>
                    <p>
                      <strong>Order ID:</strong> {selectedOrder.id}
                    </p>
                    <p>
                      <strong>User:</strong> {selectedOrder.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedOrder.email}
                    </p>
                    <p>
                      <strong>Payment Mode:</strong>{" "}
                      {selectedOrder.paymentMode}
                    </p>
                    <p>
                      <strong>Payment Status:</strong>{" "}
                      {selectedOrder.paymentStatus}
                    </p>
                    <p>
                      <strong>Total:</strong> ₹{selectedOrder.totalAmount}
                    </p>
                    <p>
                      <strong>Status:</strong> {selectedOrder.status}
                    </p>
                    <p>
                      <strong>Address:</strong> {selectedOrder.address},{" "}
                      {selectedOrder.city}, {selectedOrder.state},{" "}
                      {selectedOrder.zip}, {selectedOrder.country}
                    </p>
                    <p>
                      <strong>Products:</strong>
                    </p>
                    <ul>
                      {(selectedOrder.products || []).map((p) => (
                        <li key={p.productId}>
                          <img
                            src={p.imageurl}
                            alt={p.productName}
                            width="50"
                            height="50"
                          />
                          {p.productName} (x{p.quantity}) - ₹{p.price}
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
            <div className="users-tab">
              <h2>Users Management</h2>
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="search-input"
              />
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Total Orders</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>{user.role}</td>
                      <td>{user.orders.length}</td>
                      <td>
                        ₹{user.orders.reduce((sum, o) => sum + o.totalAmount, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Queries Tab */}
          {activeTab === "queries" && (
            <div className="queries-tab">
              <h2>Contact Queries</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Query</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map((query) => (
                    <tr key={query.id}>
                      <td>{query.name}</td>
                      <td>{query.email}</td>
                      <td>{query.query}</td>
                      <td>{new Date(query.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => handleQueryDelete(query.id)}
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
        </div>
      </div>
    )
  );
};

export default AdminPanel;
