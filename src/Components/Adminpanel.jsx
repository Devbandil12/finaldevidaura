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
import {CouponContext } from "../contexts/CouponContext";
import { toast, ToastContainer } from "react-toastify";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("products");
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

  const { getquery } = useContext(ContactContext);

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
  // console.log(userkiDetails);
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
    deleteCoupon
  } = useContext(CouponContext);
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
      ? `/api/coupons/${editingCoupon.id}`
      : "/api/coupons";
    const method = editingCoupon.id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingCoupon.id ? "Updated" : "Added");
      const all = await (await fetch("/api/coupons")).json();
      setCoupons(all);
      setEditingCoupon(null);
    } catch {
      toast.error("Save failed");
    }
  };

  const handleCouponDelete = async id => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted");
      setCoupons(coupons.filter(c => c.id !== id));
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
    // for all other statuses
    return sortedOrders.filter(
      o => o.status.trim().toLowerCase() === orderStatusTab.trim().toLowerCase()
    );
  })();

  const searchedOrders = statusFilteredOrders.filter(
    (order) =>
      order.orderId.toString().includes(orderSearchQuery) ||
      order.createdAt.includes(orderSearchQuery)
  );

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



  return (
    user &&
    userkiDetails.role === "admin" && (
      <div className="admin-panel">
        <div className="absolute">
          <ToastContainer />
        </div>
        <h1>Admin Panel</h1>
        <nav className="admin-nav">
          <button onClick={() => setActiveTab("products")}>Products</button>
          <button onClick={() => setActiveTab("coupons")}>Coupon Codes</button>
          <button onClick={() => setActiveTab("orders")}>Orders</button>
          <button onClick={() => setActiveTab("users")}>Users</button>
          <button onClick={() => setActiveTab("queries")}>Queries</button>
        </nav>

        <div className="admin-content">
          {openModal && <ImageUploadModal isopen={openModal} />}

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
                    // no id → new coupon
                    code: "",
                    discountType: "percent",
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

              <table className="coupon-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min ₹</th>
                    <th>Min Items</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Inline form */}
                  {editingCoupon && (
                    <tr>
                      <td>
                        <input
                          placeholder="Code"
                          value={editingCoupon.code}
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
                          value={editingCoupon.discountValue}
                          onChange={e => setEditingCoupon(ec => ({ ...ec, discountValue: +e.target.value }))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="Min ₹"
                          value={editingCoupon.minOrderValue}
                          onChange={e => setEditingCoupon(ec => ({ ...ec, minOrderValue: +e.target.value }))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="Min Items"
                          value={editingCoupon.minItemCount}
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
                        <button className="admin-btn" onClick={saveCoupon}>
                          Save
                        </button>
                        <button className="admin-btn" onClick={() => setEditingCoupon(null)}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  )}

                  {/* Existing coupons */}
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

              {/* Popup is here globally */}
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
                    <p>Phone: {user.phone}</p>
                    <p>Total Orders: {user.orders.length}</p>
                    {user.orders.length > 0 && (
                      <div className="user-orders">
                        <h4>Orders:</h4>
                        {user.orders.map((order) => (
                          <div key={order.orderId} className="user-order">
                            <span>
                              Order #{order.orderId} - ₹{order.totalAmount} -{" "}
                              {order.status}
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
        {order.refundId && (
          <div>
            <h3>Refund Details</h3>
            <p><strong>Refund ID:</strong> {order.refundId}</p>
            <p><strong>Refund Amount:</strong> ₹{order.refundAmount}</p>
            <p><strong>Refund Status:</strong> {order.refundStatus}</p>
            <p><strong>Refund Speed:</strong> {order.refundSpeed}</p>
            <p><strong>Refund Initiated At:</strong> {new Date(order.refundInitiatedAt).toLocaleString()}</p>
            <p><strong>Refund Completed At:</strong> {new Date(order.refundCompletedAt).toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};