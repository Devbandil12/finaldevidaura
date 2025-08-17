import React, { useState, useContext, useEffect } from "react";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement);

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderSearchLoading, setOrderSearchLoading] = useState(false);

  const { products, getProducts, updateProduct, deleteProduct } = useContext(ProductContext);
  const { orders, getorders, updateOrderStatus, getSingleOrderDetails } = useContext(OrderContext);
  const { queries, getquery, deleteQuery } = useContext(ContactContext);
  const { coupons, refreshCoupons, deleteCoupon, saveCoupon, editingCoupon, setEditingCoupon } = useContext(CouponContext);

  const { user } = useUser();
  const navigate = useNavigate();

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const [editingProduct, setEditingProduct] = useState(null);
  const [orderStatusTab, setOrderStatusTab] = useState("All");

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const newProduct = Object.fromEntries(formData.entries());

    try {
      if (editingProduct) {
        await updateProduct(newProduct);
      } else {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProduct),
        });
        toast.success("Product added successfully!");
      }

      setLoading(false);
      setEditingProduct(null);
      getProducts();
      e.target.reset();
    } catch (error) {
      console.error("❌ Failed to save product:", error);
      setLoading(false);
      toast.error("Failed to save product.");
    }
  };

  const handleDelete = async (productId) => {
    await deleteProduct(productId);
  };

  const handleQueryDelete = async (queryId) => {
    await deleteQuery(queryId);
  };

  const handleOrderSearch = async (e) => {
    e.preventDefault();
    setOrderSearchLoading(true);
    const orderDetails = await getSingleOrderDetails(orderSearchQuery);
    setSelectedOrder(orderDetails);
    setOrderSearchLoading(false);
  };

  const handleOrderStatusUpdate = async (orderId, status) => {
    await updateOrderStatus(orderId, status);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = orderStatusTab === "All" || order.status === orderStatusTab;
    const matchesSearch = String(order.id).includes(orderSearchQuery) || order.userEmail?.toLowerCase().includes(orderSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  
  const totalUsers = 100; // Mock data
  const totalProducts = products.length;
  const totalOrders = orders.length;

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    setCouponLoading(true);
    const formData = new FormData(e.target);
    const couponData = Object.fromEntries(formData.entries());
    await saveCoupon(couponData);
    setCouponLoading(false);
    setEditingCoupon(null);
    e.target.reset();
  };

  const handleCouponDelete = async (couponId) => {
    await deleteCoupon(couponId);
  };

  useEffect(() => {
    getorders(true, true);
    getquery();
    refreshCoupons();
  }, [getorders, getquery, refreshCoupons]);

  useEffect(() => {
    if (user && !user.publicMetadata.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || !user.publicMetadata.isAdmin) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <h1 className="text-2xl text-red-500">Access Denied</h1>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <ToastContainer />
      <div className="bg-gray-800 text-white w-64 p-6 space-y-6">
        <h2 className="text-3xl font-bold mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left p-3 rounded-md transition-colors duration-200 ${activeTab === "dashboard" ? "bg-gray-700" : "hover:bg-gray-700"}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`w-full text-left p-3 rounded-md transition-colors duration-200 ${activeTab === "products" ? "bg-gray-700" : "hover:bg-gray-700"}`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full text-left p-3 rounded-md transition-colors duration-200 ${activeTab === "orders" ? "bg-gray-700" : "hover:bg-gray-700"}`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab("queries")}
            className={`w-full text-left p-3 rounded-md transition-colors duration-200 ${activeTab === "queries" ? "bg-gray-700" : "hover:bg-gray-700"}`}
          >
            Customer Queries
          </button>
          <button
            onClick={() => setActiveTab("coupons")}
            className={`w-full text-left p-3 rounded-md transition-colors duration-200 ${activeTab === "coupons" ? "bg-gray-700" : "hover:bg-gray-700"}`}
          >
            Coupons
          </button>
        </nav>
      </div>

      <div className="flex-1 p-10 overflow-y-auto">
        {activeTab === "dashboard" && (
          <div>
            <h1 className="text-4xl font-bold mb-8 text-gray-800">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-700">Total Users</h3>
                <p className="text-4xl font-bold text-indigo-600 mt-2">{totalUsers}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-700">Total Products</h3>
                <p className="text-4xl font-bold text-green-600 mt-2">{totalProducts}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-700">Total Orders</h3>
                <p className="text-4xl font-bold text-red-600 mt-2">{totalOrders}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Orders & Revenue</h2>
              <OrderChart orders={orders} />
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-4xl font-bold text-gray-800">Product Management</h1>
              <button
                onClick={() => setOpenModal(true)}
                className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200"
              >
                Add New Product
              </button>
            </div>
            {openModal && <ImageUploadModal setOpenModal={setOpenModal} />}

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Product List</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border-collapse">
                  <thead>
                    <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">ID</th>
                      <th className="py-3 px-6 text-left">Name</th>
                      <th className="py-3 px-6 text-left">Price</th>
                      <th className="py-3 px-6 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm font-light">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-100">
                        <td className="py-3 px-6 whitespace-nowrap">{product.id}</td>
                        <td className="py-3 px-6">{product.name}</td>
                        <td className="py-3 px-6">₹{product.price}</td>
                        <td className="py-3 px-6">
                          <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                          <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {editingProduct && (
              <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Edit Product</h2>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <input type="hidden" name="id" defaultValue={editingProduct.id} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" name="name" defaultValue={editingProduct.name} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" defaultValue={editingProduct.description} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input type="number" name="price" defaultValue={editingProduct.price} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{loading ? "Saving..." : "Save Changes"}</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h1 className="text-4xl font-bold mb-6 text-gray-800">Order Management</h1>
            <div className="flex items-center mb-6 space-x-4">
              <button
                onClick={() => setOrderStatusTab("All")}
                className={`px-4 py-2 rounded-md ${orderStatusTab === "All" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
              >All</button>
              <button
                onClick={() => setOrderStatusTab("pending")}
                className={`px-4 py-2 rounded-md ${orderStatusTab === "pending" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
              >Pending</button>
              <button
                onClick={() => setOrderStatusTab("shipped")}
                className={`px-4 py-2 rounded-md ${orderStatusTab === "shipped" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
              >Shipped</button>
              <button
                onClick={() => setOrderStatusTab("delivered")}
                className={`px-4 py-2 rounded-md ${orderStatusTab === "delivered" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
              >Delivered</button>
            </div>
            <div className="mb-6">
              <form onSubmit={handleOrderSearch} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search by Order ID or User Email..."
                  value={orderSearchQuery}
                  onChange={(e) => {
                    setOrderSearchQuery(e.target.value);
                    setSelectedOrder(null);
                  }}
                  className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors duration-200">Search</button>
              </form>
            </div>

            {selectedOrder && (
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-2xl font-semibold mb-4">Order Details</h2>
                {detailsLoading ? (
                  <p>Loading details...</p>
                ) : (
                  <div>
                    <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                    <p><strong>User Email:</strong> {selectedOrder.userEmail}</p>
                    <p><strong>Payment Mode:</strong> {selectedOrder.paymentMode}</p>
                    <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus}</p>
                    <p><strong>Total:</strong> ₹{selectedOrder.totalAmount}</p>
                    <p><strong>Status:</strong> {selectedOrder.status}</p>
                    <p><strong>Address:</strong> {selectedOrder.address}, {selectedOrder.city}, {selectedOrder.state}, {selectedOrder.zip}, {selectedOrder.country}</p>
                    <p className="mt-4"><strong>Products:</strong></p>
                    <ul className="list-disc list-inside">
                      {(selectedOrder.products || []).map(p => (
                        <li key={p.productId} className="flex items-center space-x-2 mt-2">
                          <img src={p.imageurl} alt={p.productName} className="w-12 h-12 object-cover rounded" />
                          <span>{p.productName} (x{p.quantity}) - ₹{p.price}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4"><strong>Created At:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Order List</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border-collapse">
                  <thead>
                    <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">Order ID</th>
                      <th className="py-3 px-6 text-left">User Email</th>
                      <th className="py-3 px-6 text-left">Total Amount</th>
                      <th className="py-3 px-6 text-left">Status</th>
                      <th className="py-3 px-6 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm font-light">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-100">
                        <td className="py-3 px-6 whitespace-nowrap">{order.id}</td>
                        <td className="py-3 px-6 whitespace-nowrap">{order.userEmail}</td>
                        <td className="py-3 px-6">₹{order.totalAmount}</td>
                        <td className="py-3 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                            order.status === 'shipped' ? 'bg-blue-200 text-blue-800' :
                            order.status === 'delivered' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
                          }`}>{order.status}</span>
                        </td>
                        <td className="py-3 px-6 space-x-2">
                          <button onClick={() => getSingleOrderDetails(order.id).then(setSelectedOrder)} className="text-blue-600 hover:underline">Details</button>
                          <select
                            onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                            className="p-1 border border-gray-300 rounded-md text-sm"
                            value={order.status}
                          >
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "queries" && (
          <div>
            <h1 className="text-4xl font-bold mb-6 text-gray-800">Customer Queries</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Query List</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border-collapse">
                  <thead>
                    <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">ID</th>
                      <th className="py-3 px-6 text-left">Name</th>
                      <th className="py-3 px-6 text-left">Email</th>
                      <th className="py-3 px-6 text-left">Query</th>
                      <th className="py-3 px-6 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm font-light">
                    {queries.map((query) => (
                      <tr key={query.id} className="border-b border-gray-200 hover:bg-gray-100">
                        <td className="py-3 px-6 whitespace-nowrap">{query.id}</td>
                        <td className="py-3 px-6">{query.name}</td>
                        <td className="py-3 px-6">{query.email}</td>
                        <td className="py-3 px-6 max-w-sm overflow-hidden whitespace-nowrap text-ellipsis">{query.query}</td>
                        <td className="py-3 px-6">
                          <button onClick={() => handleQueryDelete(query.id)} className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "coupons" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-4xl font-bold text-gray-800">Coupon Management</h1>
              <button
                onClick={() => setEditingCoupon({ code: "", discount: 0, maxUsage: 1, maxUsagePerUser: 1, validFrom: "", validUntil: "", firstOrderOnly: false })}
                className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200"
              >
                Create New Coupon
              </button>
            </div>

            {editingCoupon && (
              <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">
                  {editingCoupon.id ? "Edit Coupon" : "Create New Coupon"}
                </h2>
                <form onSubmit={handleCouponSubmit} className="space-y-4">
                  <input type="hidden" name="id" defaultValue={editingCoupon.id} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Code</label>
                    <input type="text" name="code" defaultValue={editingCoupon.code} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
                    <input type="number" name="discount" defaultValue={editingCoupon.discount} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Usage</label>
                    <input type="number" name="maxUsage" defaultValue={editingCoupon.maxUsage} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Usage Per User</label>
                    <input type="number" name="maxUsagePerUser" defaultValue={editingCoupon.maxUsagePerUser} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valid From</label>
                    <input type="date" name="validFrom" defaultValue={editingCoupon.validFrom} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valid Until</label>
                    <input type="date" name="validUntil" defaultValue={editingCoupon.validUntil} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" name="firstOrderOnly" defaultChecked={editingCoupon.firstOrderOnly} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                    <label className="text-sm font-medium text-gray-700">First Order Only</label>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button type="button" onClick={() => setEditingCoupon(null)} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{couponLoading ? "Saving..." : "Save Coupon"}</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Coupon List</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border-collapse">
                  <thead>
                    <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">ID</th>
                      <th className="py-3 px-6 text-left">Code</th>
                      <th className="py-3 px-6 text-left">Discount</th>
                      <th className="py-3 px-6 text-left">Max Usage</th>
                      <th className="py-3 px-6 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm font-light">
                    {coupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b border-gray-200 hover:bg-gray-100">
                        <td className="py-3 px-6">{coupon.id}</td>
                        <td className="py-3 px-6">{coupon.code}</td>
                        <td className="py-3 px-6">{coupon.discount}%</td>
                        <td className="py-3 px-6">{coupon.maxUsage}</td>
                        <td className="py-3 px-6">
                          <button onClick={() => setEditingCoupon(coupon)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                          <button onClick={() => handleCouponDelete(coupon.id)} className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
