// src/components/Adminpanel.jsx
import React, { useState, useContext, useEffect, useCallback } from "react";
import "react-toastify/dist/ReactToastify.css";
import { UserContext } from "../contexts/UserContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { AdminContext } from "../contexts/AdminContext";
import { CouponContext } from "../contexts/CouponContext";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ImageUploadModal from "./ImageUploadModal";
import { toast, ToastContainer } from "react-toastify";
import OrderChart from "./OrderChart";
import { FaTachometerAlt, FaBox, FaTicketAlt, FaClipboardList, FaUsers, FaEnvelope, FaShoppingCart, FaHeart, FaBars, FaTimes } from 'react-icons/fa';

const OrderDetailsPopup = ({ order, onClose }) => {
  if (!order) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">×</button>
        [span_0](start_span)<h2 className="text-xl font-bold mb-4">Order Details (#{order.id})[span_0](end_span)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            [span_1](start_span)<h3 className="font-semibold text-lg">Customer & Payment[span_1](end_span)</h3>
            [span_2](start_span)<p><strong>User:</strong> {order.userName}[span_2](end_span)</p>
            <p><strong>Phone:</strong> {order.phone || [span_3](start_span)'N/A'}[span_3](end_span)</p>
            [span_4](start_span)<p><strong>Payment Mode:</strong> {order.paymentMode}[span_4](end_span)</p>
            [span_5](start_span)<p><strong>Payment Status:</strong> {order.paymentStatus}[span_5](end_span)</p>
            [span_6](start_span)<p><strong>Total Amount:</strong> ₹{order.totalAmount}[span_6](end_span)</p>
            [span_7](start_span)<p><strong>Status:</strong> <span className="font-semibold text-green-600">{order.status}</span>[span_7](end_span)</p>
          </div>
          <div className="space-y-2">
            [span_8](start_span)<h3 className="font-semibold text-lg">Shipping Address[span_8](end_span)</h3>
            [span_9](start_span)<p>{order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state}, {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}[span_9](end_span)</p>
            <p><strong>Landmark:</strong> {order.shippingAddress?.landmark || [span_10](start_span)'N/A'}[span_10](end_span)</p>
            <p><strong>Contact:</strong> {order.shippingAddress?.phone || [span_11](start_span)'N/A'}[span_11](end_span)</p>
          </div>
        </div>
        <div className="mt-6">
          [span_12](start_span)<h3 className="font-semibold text-lg">Products[span_12](end_span)</h3>
          <ul className="list-disc list-inside space-y-2">
            {(order.products || []).map(p => (
              <li key={p.productId} className="flex items-center space-x-2">
                <img src={p.imageurl} alt={p.productName} className="w-12 h-12 object-cover rounded" />
                [span_13](start_span)<span>{p.productName} (x{p.quantity}) - ₹{p.price}[span_13](end_span)</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const CartsWishlistsTab = () => {
  return (
    <div className="space-y-6">
      [span_14](start_span)<h2 className="text-3xl font-bold">Carts & Wishlists Analytics[span_14](end_span)</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        [span_15](start_span)<h3 className="text-xl font-semibold mb-4">Abandoned Carts[span_15](end_span)</h3>
        <p className="text-gray-500">This section would list the contents of abandoned carts to help with sales recovery. (Future Feature) [span_16](start_span)</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Most Popular Wishlist Items[span_16](end_span)</h3>
        <p className="text-gray-500">This section would show which products are most frequently added to wishlists. (Future Feature) [span_17](start_span)</p>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");[span_17](end_span)
  [span_18](start_span)const [openModal, setOpenModal] = useState(false);[span_18](end_span)
  [span_19](start_span)const [loading, setLoading] = useState(false);[span_19](end_span)
  [span_20](start_span)const [detailsLoading, setDetailsLoading] = useState(false);[span_20](end_span)
  [span_21](start_span)const [isSidebarOpen, setIsSidebarOpen] = useState(false);[span_21](end_span)

  [span_22](start_span)const { products, updateProduct, deleteProduct } = useContext(ProductContext);[span_22](end_span)
  [span_23](start_span)const { userdetails } = useContext(UserContext);[span_23](end_span)
  [span_24](start_span)const { queries, getquery } = useContext(ContactContext);[span_24](end_span)
  [span_25](start_span)const { coupons, editingCoupon, setEditingCoupon, saveCoupon, deleteCoupon, refreshCoupons } = useContext(CouponContext);[span_25](end_span)
  [span_26](start_span)const { users, orders, getAllUsers, getAllOrders, updateOrderStatus, getSingleOrderDetails, cancelOrder, loading: adminLoading } = useContext(AdminContext);[span_26](end_span)

  [span_27](start_span)const { user } = useUser();[span_27](end_span)
  [span_28](start_span)const [editingUser, setEditingUser] = useState(null);[span_28](end_span)
  [span_29](start_span)const [editingProduct, setEditingProduct] = useState(null);[span_29](end_span)
  [span_30](start_span)const [orderStatusTab, setOrderStatusTab] = useState("All");[span_30](end_span)
  [span_31](start_span)const [orderSearchQuery, setOrderSearchQuery] = useState("");[span_31](end_span)
  [span_32](start_span)const [selectedOrder, setSelectedOrder] = useState(null);[span_32](end_span)
  [span_33](start_span)const [userSearchQuery, setUserSearchQuery] = useState("");[span_33](end_span)
  [span_34](start_span)const [querySearch, setQuerySearch] = useState("");[span_34](end_span)
  [span_35](start_span)[span_36](start_span)const navigate = useNavigate();[span_35](end_span)[span_36](end_span)
  [span_37](start_span)const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");[span_37](end_span)

  useEffect(() => {
    if (userdetails?.role !== "admin" && userdetails !== null) {
      [span_38](start_span)navigate("/");[span_38](end_span)
    }
  }, [userdetails, navigate]);

  useEffect(() => {
    [span_39](start_span)getAllUsers();[span_39](end_span)
  }, [getAllUsers]);

  useEffect(() => {
    [span_40](start_span)getAllOrders();[span_40](end_span)
  }, [getAllOrders]);

  useEffect(() => {
    [span_41](start_span)getquery();[span_41](end_span)
  }, [getquery]);

  useEffect(() => {
    [span_42](start_span)refreshCoupons();[span_42](end_span)
  }, [refreshCoupons]);

  [span_43](start_span)const totalOrders = orders?.length;[span_43](end_span)
  const totalProducts = products?.reduce((sum, p) => sum + p.variations.length, 0);
  [span_44](start_span)const totalUsers = users?.length;[span_44](end_span)
  [span_45](start_span)const totalQueries = queries?.length;[span_45](end_span)
  [span_46](start_span)const deliveredOrders = orders?.filter(o => o.status === "Delivered")?.length;[span_46](end_span)
  [span_47](start_span)const cancelledOrders = orders?.filter(o => o.status === "Order Cancelled")?.length;[span_47](end_span)
  [span_48](start_span)const processingOrders = orders?.filter(o => o.status === "Processing" || o.status === "Order Placed" || o.status === "Shipped")?.length;[span_48](end_span)
  [span_49](start_span)const totalRevenue = orders?.reduce((sum, order) => sum + order.totalAmount, 0);[span_49](end_span)
  [span_50](start_span)const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;[span_50](end_span)

  const handleProductUpdate = async () => {
    [span_51](start_span)setLoading(true);[span_51](end_span)
    try {
      let updatedData = {
        ...editingProduct,
        discount: Number(editingProduct.discount),
        oprice: Number(editingProduct.oprice),
        size: Number(editingProduct.size),
        quantity: Number(editingProduct.quantity),
        stock: Number(editingProduct.stock)
      [span_52](start_span)};[span_52](end_span)
      if (typeof updatedData.imageurl === 'string' && updatedData.imageurl.startsWith('blob:')) {
        [span_53](start_span)updatedData.imageurl = [updatedData.imageurl];[span_53](end_span)
      }
      [span_54](start_span)await updateProduct(updatedData.id, updatedData);[span_54](end_span)
      [span_55](start_span)setEditingProduct(null);[span_55](end_span)
      [span_56](start_span)toast.success("Product updated successfully!");[span_56](end_span)
    } catch (error) {
      [span_57](start_span)console.error("❌ Error updating product:", error);[span_57](end_span)
      [span_58](start_span)toast.error("Failed to update product.");[span_58](end_span)
    } finally {
      [span_59](start_span)setLoading(false);[span_59](end_span)
    }
  };

  const handleProductDelete = async (productId) => {
    [span_60](start_span)const confirmation = window.confirm("Are you sure you want to delete this product?");[span_60](end_span)
    if (confirmation) {
      [span_61](start_span)setLoading(true);[span_61](end_span)
      try {
        [span_62](start_span)await deleteProduct(productId);[span_62](end_span)
        [span_63](start_span)setLoading(false);[span_63](end_span)
        [span_64](start_span)toast.success("Product deleted successfully!");[span_64](end_span)
      } catch (error) {
        [span_65](start_span)console.error("❌ Error deleting product:", error);[span_65](end_span)
        [span_66](start_span)setLoading(false);[span_66](end_span)
        [span_67](start_span)toast.error("Failed to delete product.");[span_67](end_span)
      }
    }
  };

  const handleorderdetails = async (order) => {
    [span_68](start_span)setDetailsLoading(true);[span_68](end_span)
    try {
      [span_69](start_span)const details = await getSingleOrderDetails(order.id);[span_69](end_span)
      if (details) {
        [span_70](start_span)setSelectedOrder(details);[span_70](end_span)
      }
    } catch (error) {
      [span_71](start_span)console.error("Error fetching order products:", error);[span_71](end_span)
      [span_72](start_span)toast.error("Failed to load order details.");[span_72](end_span)
    } finally {
      [span_73](start_span)setDetailsLoading(false);[span_73](end_span)
    }
  };

  const filteredUsers = users?.filter(
    (user) =>
      user?.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user?.phone?.includes(userSearchQuery)
  [span_74](start_span));[span_74](end_span)

  const handleEditUser = (user) => {
    [span_75](start_span)setEditingUser(user);[span_75](end_span)
  };

  const handleSaveUser = async () => {
    try {
      const res = await fetch(`${BASE}/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser),
      [span_76](start_span)});[span_76](end_span)
      [span_77](start_span)if (!res.ok) throw new Error("Failed to update user");[span_77](end_span)
      [span_78](start_span)toast.success("User updated successfully!");[span_78](end_span)
      [span_79](start_span)setEditingUser(null);[span_79](end_span)
      [span_80](start_span)getAllUsers();[span_80](end_span)
    } catch (error) {
      [span_81](start_span)console.error("Failed to update user:", error);[span_81](end_span)
      [span_82](start_span)toast.error("Failed to update user.");[span_82](end_span)
    }
  };

  const handleDeleteUser = async (userId) => {
    [span_83](start_span)if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;[span_83](end_span)
    try {
      const res = await fetch(`${BASE}/api/users/${userId}`, {
        method: "DELETE",
      [span_84](start_span)});[span_84](end_span)
      [span_85](start_span)if (!res.ok) throw new Error("Failed to delete user");[span_85](end_span)
      [span_86](start_span)toast.success("User deleted successfully!");[span_86](end_span)
      [span_87](start_span)getAllUsers();[span_87](end_span)
    } catch (error) {
      [span_88](start_span)console.error("Failed to delete user:", error);[span_88](end_span)
      [span_89](start_span)toast.error("Failed to delete user.");[span_89](end_span)
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    [span_90](start_span)const updatedOrder = await updateOrderStatus(orderId, newStatus);[span_90](end_span)
    if (updatedOrder) {
      [span_91](start_span)setOrders(prevOrders => prevOrders.map(order => order.id === orderId ? updatedOrder.updatedOrder : order));[span_91](end_span)
    }
  };

  const handleCancelOrder = async (orderId) => {
    [span_92](start_span)await cancelOrder(orderId);[span_92](end_span)
  };

  const handleTabClick = (tabName) => {
    [span_93](start_span)setActiveTab(tabName);[span_93](end_span)
    [span_94](start_span)setIsSidebarOpen(false);[span_94](end_span)
  };

  const toggleSidebar = () => {
    [span_95](start_span)setIsSidebarOpen(!isSidebarOpen);[span_95](end_span)
  };

  return (
    user && userdetails?.role === "admin" && (
      <div className="flex min-h-screen bg-gray-100 text-gray-800 pt-[60px]">
        <ToastContainer />
        <div className="md:hidden absolute top-[50px] right-[5px] p-4 z-100">
          <button onClick={toggleSidebar} className="text-gray-800 text-2xl">
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <nav className="flex flex-col p-4 space-y-2">
            [span_96](start_span)<h2 className="text-2xl font-bold mb-4">Admin Panel[span_96](end_span)</h2>
            <button onClick={() => handleTabClick("dashboard")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "dashboard" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
              [span_97](start_span)<FaTachometerAlt /><span>Dashboard</span>[span_97](end_span)
            </button>
            <button onClick={() => handleTabClick("products")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "products" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
              [span_98](start_span)<FaBox /><span>Products</span>[span_98](end_span)
            </button>
            <button onClick={() => handleTabClick("coupons")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "coupons" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
              [span_99](start_span)<FaTicketAlt /><span>Coupons</span>[span_99](end_span)
            </button>
            <button onClick={() => handleTabClick("orders")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "orders" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
              [span_100](start_span)<FaClipboardList /><span>Orders</span>[span_100](end_span)
            </button>
            <button onClick={() => handleTabClick("users")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "users" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
              [span_101](start_span)<FaUsers /><span>Users</span>[span_101](end_span)
            </button>
            <button onClick={() => handleTabClick("queries")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "queries" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
              [span_102](start_span)<FaEnvelope /><span>Queries</span>[span_102](end_span)
            </button>
            <button onClick={() => handleTabClick("carts")} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === "carts" ? "bg-indigo-600 text-white" : "hover:bg-gray-200"}`}>
              [span_103](start_span)<FaShoppingCart /><span>Carts & Wishlists</span>[span_103](end_span)
            </button>
          </nav>
        </div>
        <div className="flex-1 p-8 overflow-y-auto">
          {openModal && <ImageUploadModal isopen={openModal} onClose={() => setOpenModal(false)} />}
          {selectedOrder && <OrderDetailsPopup order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              [span_104](start_span)<h2 className="text-3xl font-bold">Admin Dashboard[span_104](end_span)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                  [span_105](start_span)<div><h3 className="text-lg font-semibold text-gray-500">Total Revenue</h3><p className="text-3xl font-bold">₹{totalRevenue?.toFixed(2)}</p></div>[span_105](end_span)
                  <FaTachometerAlt className="text-4xl text-indigo-400 opacity-50" />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                  [span_106](start_span)<div><h3 className="text-lg font-semibold text-gray-500">Total Orders</h3><p className="text-3xl font-bold">{totalOrders}</p></div>[span_106](end_span)
                  <FaClipboardList className="text-4xl text-green-400 opacity-50" />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                  [span_107](start_span)<div><h3 className="text-lg font-semibold text-gray-500">Total Users</h3><p className="text-3xl font-bold">{totalUsers}</p></div>[span_107](end_span)
                  <FaUsers className="text-4xl text-blue-400 opacity-50" />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                  [span_108](start_span)<div><h3 className="text-lg font-semibold text-gray-500">Total Products</h3><p className="text-3xl font-bold">{totalProducts}</p></div>[span_108](end_span)
                  <FaBox className="text-4xl text-yellow-400 opacity-50" />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                  [span_109](start_span)<div><h3 className="text-lg font-semibold text-gray-500">Average Order Value</h3><p className="text-3xl font-bold">₹{averageOrderValue?.toFixed(2)}</p></div>[span_109](end_span)
                  <FaTicketAlt className="text-4xl text-purple-400 opacity-50" />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                  [span_110](start_span)<div><h3 className="text-lg font-semibold text-gray-500">Pending Queries</h3><p className="text-3xl font-bold">{totalQueries}</p></div>[span_110](end_span)
                  <FaEnvelope className="text-4xl text-red-400 opacity-50" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                [span_111](start_span)<h3 className="text-xl font-semibold mb-4">Orders Status Breakdown</h3>[span_111](end_span)
                <OrderChart
                  delivered={deliveredOrders}
                  pending={processingOrders}
                  cancelled={cancelledOrders}
                [span_112](start_span)/>[span_112](end_span)
              </div>
            </div>
          )}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                [span_113](start_span)<h2 className="text-3xl font-bold">Manage Products[span_113](end_span)</h2>
                [span_114](start_span)<button onClick={() => setOpenModal(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Add New Product</button>[span_114](end_span)
              </div>
              <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      [span_115](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID[span_115](end_span)</th>
                      [span_116](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image[span_116](end_span)</th>
                      [span_117](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name[span_117](end_span)</th>
                      [span_118](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Price[span_118](end_span)</th>
                      [span_119](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount (%)[span_119](end_span)</th>
                      [span_120](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size (ml)[span_120](end_span)</th>
                      [span_121](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock[span_121](end_span)</th>
                      [span_122](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions[span_122](end_span)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Iterate over grouped products and their variations */}
                    {products?.map((productGroup) =>
                      productGroup.variations.map((product) =>
                        editingProduct && editingProduct.id === product.id ? (
                          <tr key={product.id}>
                            [span_123](start_span)<td className="px-6 py-4 whitespace-nowrap">{product.id}[span_123](end_span)</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              [span_124](start_span)<img src={editingProduct.imageurl[0]} alt={editingProduct.name} className="w-12 h-12 object-cover rounded-md" />[span_124](end_span)
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files.length > 0) {
                                    const newImageUrl = URL.createObjectURL(files[0]);
                                    [span_125](start_span)setEditingProduct({ ...editingProduct, imageurl: [newImageUrl], });[span_125](end_span)
                                  }
                                }}
                                className="mt-2 text-xs"
                              [span_126](start_span)/>[span_126](end_span)
                            </td>
                            [span_127](start_span)<td className="px-6 py-4 whitespace-nowrap"><input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="border rounded px-2 py-1 w-full" />[span_127](end_span)</td>
                            [span_128](start_span)<td className="px-6 py-4 whitespace-nowrap"><input type="number" value={editingProduct.oprice} onChange={(e) => setEditingProduct({ ...editingProduct, oprice: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-24" />[span_128](end_span)</td>
                            [span_129](start_span)<td className="px-6 py-4 whitespace-nowrap"><input type="number" value={editingProduct.discount} onChange={(e) => setEditingProduct({ ...editingProduct, discount: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-16" />[span_129](end_span)</td>
                            [span_130](start_span)<td className="px-6 py-4 whitespace-nowrap"><input type="number" value={editingProduct.size} onChange={(e) => setEditingProduct({ ...editingProduct, size: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-16" />[span_130](end_span)</td> 
                            <td className="px-6 py-4 whitespace-nowrap">
                              [span_131](start_span)<input type="number" value={editingProduct.stock} onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseFloat(e.target.value) })} className="border rounded px-2 py-1 w-16" />[span_131](end_span)
                            </td>
                            [span_132](start_span)<td className="px-6 py-4 whitespace-nowrap space-x-2"><button onClick={handleProductUpdate} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Save</button><button onClick={() => setEditingProduct(null)} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button></td>[span_132](end_span)
                          </tr>
                        ) : (
                          <tr key={product.id}>
                            [span_133](start_span)<td className="px-6 py-4 whitespace-nowrap">{product.id}[span_133](end_span)</td>
                            [span_134](start_span)<td className="px-6 py-4 whitespace-nowrap"><img src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl} alt={product.name} className="w-12 h-12 object-cover rounded-md" />[span_134](end_span)</td>
                            [span_135](start_span)<td className="px-6 py-4 whitespace-nowrap">{product.name}[span_135](end_span)</td>
                            [span_136](start_span)<td className="px-6 py-4 whitespace-nowrap">₹{product.oprice}[span_136](end_span)</td>
                            [span_137](start_span)<td className="px-6 py-4 whitespace-nowrap">{product.discount}[span_137](end_span)</td>
                            [span_138](start_span)<td className="px-6 py-4 whitespace-nowrap">{product.size}[span_138](end_span)</td>
                            [span_139](start_span)<td className="px-6 py-4 whitespace-nowrap">{product.stock}[span_139](end_span)</td>
                            <td className="px-6 py-4 whitespace-nowrap space-x-2"><button onClick={() => setEditingProduct({ ...product, imageurl: Array.isArray(product.imageurl) ? product.imageurl : [product.imageurl] })} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Edit</button><button onClick={() => handleProductDelete(product.id)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">{loading ? [span_140](start_span)"deleting" : "delete"}</button></td>[span_140](end_span)
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === "coupons" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                [span_141](start_span)<h2 className="text-3xl font-bold">Manage Coupon Codes[span_141](end_span)</h2>
                [span_142](start_span)<button onClick={() => setEditingCoupon({ code: "", discountType: "percent", discountValue: 0, minOrderValue: 0, minItemCount: 0, description: "", validFrom: "", validUntil: "", firstOrderOnly: false })} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Add New Coupon</button>[span_142](end_span)
              </div>
              <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      [span_143](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code[span_143](end_span)</th>
                      [span_144](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type[span_144](end_span)</th>
                      [span_145](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value[span_145](end_span)</th>
                      [span_146](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min ₹[span_146](end_span)</th>
                      [span_147](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Items[span_147](end_span)</th>
                      [span_148](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description[span_148](end_span)</th>
                      [span_149](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Usage/User[span_149](end_span)</th>
                      [span_150](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Order Only[span_150](end_span)</th>
                      [span_151](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid From[span_151](end_span)</th>
                      [span_152](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until[span_152](end_span)</th>
                      [span_153](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions[span_153](end_span)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {editingCoupon && (
                      <tr>
                        [span_154](start_span)<td className="p-2"><input placeholder="Code" value={editingCoupon.code || ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, code: e.target.value }))} className="border rounded px-2 py-1 w-full" />[span_154](end_span)</td>
                        [span_155](start_span)<td className="p-2"><select value={editingCoupon.discountType} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, discountType: e.target.value }))} className="border rounded px-2 py-1 w-full"><option value="percent">percent</option><option value="flat">flat</option></select>[span_155](end_span)</td>
                        <td className="p-2"><input type="number" placeholder="Value" value={editingCoupon.discountValue ?? [span_156](start_span)0} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, discountValue: +e.target.value }))} className="border rounded px-2 py-1 w-full" />[span_156](end_span)</td>
                        <td className="p-2"><input type="number" placeholder="Min ₹" value={editingCoupon.minOrderValue ?? [span_157](start_span)0} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, minOrderValue: +e.target.value }))} className="border rounded px-2 py-1 w-full" />[span_157](end_span)</td>
                        <td className="p-2"><input type="number" placeholder="Min Items" value={editingCoupon.minItemCount ?? [span_158](start_span)0} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, minItemCount: +e.target.value }))} className="border rounded px-2 py-1 w-full" />[span_158](end_span)</td>
                        [span_159](start_span)<td className="p-2"><input placeholder="Description" value={editingCoupon.description} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, description: e.target.value }))} className="border rounded px-2 py-1 w-full" />[span_159](end_span)</td>
                        <td className="p-2"><input type="number" placeholder="Max usage" value={editingCoupon.maxUsagePerUser ?? [span_160](start_span)""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, maxUsagePerUser: e.target.value === "" ? null : +e.target.value }))} className="border rounded px-2 py-1 w-full" />[span_160](end_span)</td>
                        [span_161](start_span)<td className="p-2 text-center"><input type="checkbox" checked={editingCoupon.firstOrderOnly ?? false} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, firstOrderOnly: e.target.checked }))} />[span_161](end_span)</td>
                        [span_162](start_span)<td className="p-2"><input type="date" value={editingCoupon.validFrom ? new Date(editingCoupon.validFrom).toISOString().split("T")[0] : ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, validFrom: e.target.value }))} className="border rounded px-2 py-1 w-full" />[span_162](end_span)</td>
                        [span_163](start_span)<td className="p-2"><input type="date" value={editingCoupon.validUntil ? new Date(editingCoupon.validUntil).toISOString().split("T")[0] : ""} onChange={(e) => setEditingCoupon((ec) => ({ ...ec, validUntil: e.target.value }))} className="border rounded px-2 py-1 w-full" />[span_163](end_span)</td>
                        [span_164](start_span)<td className="p-2 space-x-2"><button onClick={saveCoupon} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Save</button><button onClick={() => setEditingCoupon(null)} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button></td>[span_164](end_span)
                      </tr>
                    )}
                    {coupons?.map((c) => (
                      <tr key={c.id}>
                        [span_165](start_span)<td className="px-6 py-4 whitespace-nowrap">{c.code}[span_165](end_span)</td>
                        [span_166](start_span)<td className="px-6 py-4 whitespace-nowrap">{c.discountType}[span_166](end_span)</td>
                        <td className="px-6 py-4 whitespace-nowrap">{c.discountType === "percent" ? [span_167](start_span)`${c.discountValue}%` : `₹${c.discountValue}`}[span_167](end_span)</td>
                        [span_168](start_span)<td className="px-6 py-4 whitespace-nowrap">₹{c.minOrderValue}[span_168](end_span)</td>
                        [span_169](start_span)<td className="px-6 py-4 whitespace-nowrap">{c.minItemCount}[span_169](end_span)</td>
                        [span_170](start_span)<td className="px-6 py-4 whitespace-nowrap">{c.description}[span_170](end_span)</td>
                        <td className="px-6 py-4 whitespace-nowrap">{c.maxUsagePerUser ?? [span_171](start_span)"∞"}[span_171](end_span)</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">{c.firstOrderOnly ? [span_172](start_span)"✅" : "❌"}[span_172](end_span)</td>
                        [span_173](start_span)<td className="px-6 py-4 whitespace-nowrap">{new Date(c.validFrom).toLocaleDateString()}[span_173](end_span)</td>
                        [span_174](start_span)<td className="px-6 py-4 whitespace-nowrap">{new Date(c.validUntil).toLocaleDateString()}[span_174](end_span)</td>
                        [span_175](start_span)<td className="px-6 py-4 whitespace-nowrap space-x-2"><button onClick={() => setEditingCoupon({ ...c })} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Edit</button><button onClick={() => deleteCoupon(c.id)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button></td>[span_175](end_span)
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === "orders" && (
            <div className="space-y-6">
              [span_176](start_span)<h2 className="text-3xl font-bold">Manage Orders[span_176](end_span)</h2>
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                [span_177](start_span)<span className="text-lg font-medium">Total Orders: {orders?.length}[span_177](end_span)</span>
                <div className="flex flex-wrap gap-2">
                  {["All", "Order Placed", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
                    [span_178](start_span)<button key={status} onClick={() => setOrderStatusTab(status)} className={`px-4 py-2 rounded-full text-sm font-medium ${orderStatusTab === status ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>{status === "Cancelled" ? "Cancelled Orders" : status}</button>[span_178](end_span)
                  ))}
                </div>
                [span_179](start_span)<input type="text" placeholder="Search orders..." value={orderSearchQuery} onChange={(e) => setOrderSearchQuery(e.target.value)} className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500" />[span_179](end_span)
              </div>
              <div className="space-y-4">
                {orders
                  ?.filter((o) => {
                    if (orderStatusTab === "All") return true;
                    [span_180](start_span)if (orderStatusTab === "Cancelled") return o.status === "Order Cancelled";[span_180](end_span)
                    [span_181](start_span)return o.status === orderStatusTab;[span_181](end_span)
                  })
                  .filter((o) => o.id.toString().includes(orderSearchQuery.trim())).length === 0 && <p className="text-center text-gray-500">No orders found.</p>}
                {orders
                  ?.filter((o) => {
                    [span_182](start_span)if (orderStatusTab === "All") return true;[span_182](end_span)
                    [span_183](start_span)if (orderStatusTab === "Cancelled") return o.status === "Order Cancelled";[span_183](end_span)
                    [span_184](start_span)return o.status === orderStatusTab;[span_184](end_span)
                  })
                  .filter((o) => o.id.toString().includes(orderSearchQuery.trim()))
                  .map((order) => (
                    <div key={order.id} className="bg-white p-6 rounded-lg shadow-md space-y-2">
                      <div className="flex justify-between items-center">
                        [span_185](start_span)<h3 className="text-xl font-bold">Order #{order.id}</h3>[span_185](end_span)
                        <span className={`px-3 py-1 text-xs rounded-full font-semibold ${order.status === "Delivered" ? "bg-green-100 text-green-800" : order.status === "Order Cancelled" ? [span_186](start_span)"bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{order.status}</span>[span_186](end_span)
                      </div>
                      [span_187](start_span)<p><strong>Date:</strong> {order.createdAt}[span_187](end_span)</p>
                      [span_188](start_span)<p><strong>Total:</strong> ₹{order.totalAmount}[span_188](end_span)</p>
                      <div className="flex items-center space-x-2 mt-2">
                        [span_189](start_span)<label className="text-sm font-medium">Update Status:</label>[span_189](end_span)
                        <select value={order.status} onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)} className="border rounded-lg px-2 py-1">
                          <option value="Order Placed">Order Placed</option>
                          [span_190](start_span)<option value="Processing">Processing</option>[span_190](end_span)
                          [span_191](start_span)<option value="Shipped">Shipped</option>[span_191](end_span)
                          <option value="Delivered">Delivered</option>
                        </select>
                        [span_192](start_span)<button onClick={() => handleCancelOrder(order.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Cancel Order</button>[span_192](end_span)
                      </div>
                      [span_193](start_span)<button onClick={() => handleorderdetails(order)} className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">See More Details</button>[span_193](end_span)
                    </div>
                  ))}
              </div>
            </div>
          )}
          {activeTab === "users" && (
            <div className="space-y-6">
              [span_194](start_span)<h2 className="text-3xl font-bold">Manage Users[span_194](end_span)</h2>
              [span_195](start_span)<input type="text" placeholder="Search users by name or phone..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500" />[span_195](end_span)
              {editingUser ? (
                <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                  [span_196](start_span)<button onClick={() => setEditingUser(null)} className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-semibold mb-4">&larr; <span>Back to Users</span></button>[span_196](end_span)
                  [span_197](start_span)<h3 className="text-2xl font-bold">User Details: {editingUser.name}[span_197](end_span)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      [span_198](start_span)<h4 className="font-semibold text-lg">Contact Information[span_198](end_span)</h4>
                      [span_199](start_span)<p><strong>Email:</strong> {editingUser.email}[span_199](end_span)</p>
                      <p><strong>Phone:</strong> {editingUser.phone || [span_200](start_span)'N/A'}[span_200](end_span)</p>
                      [span_201](start_span)<p><strong>Role:</strong> {editingUser.role}[span_201](end_span)</p>
                      [span_202](start_span)<p><strong>Joined:</strong> {new Date(editingUser.createdAt).toLocaleString()}[span_202](end_span)</p>
                    </div>
                    <div>
                      [span_203](start_span)<h4 className="font-semibold text-lg">Addresses[span_203](end_span)</h4>
                      <div className="space-y-2">
                        {editingUser.addresses && editingUser.addresses.length > 0 ? (editingUser.addresses.map((address) [span_204](start_span)=> (<div key={address.id} className="bg-gray-50 p-3 rounded-lg"><p>{address.address}, {address.city}, {address.state}, {address.zipCode}, {address.country}</p></div>))) : (<p className="text-gray-500">No addresses found.</p>)}[span_204](end_span)
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    [span_205](start_span)<h4 className="font-semibold text-lg">Order History ({editingUser.orders ? editingUser.orders.length : 0})[span_205](end_span)</h4>
                    <div className="space-y-4">
                      {editingUser.orders && editingUser.orders.length > 0 ? (editingUser.orders.map((order) [span_206](start_span)=> (<div key={order.id} className="bg-gray-50 p-4 rounded-lg"><p><strong>Order #{order.id}</strong></p><p>Total: ₹{order.totalAmount}</p><p>Status: {order.status}</p></div>))) : (<p className="text-gray-500">No orders found.</p>)}[span_206](end_span)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        [span_207](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID[span_207](end_span)</th>
                        [span_208](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name[span_208](end_span)</th>
                        [span_209](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email[span_209](end_span)</th>
                        [span_210](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined At[span_210](end_span)</th>
                        [span_211](start_span)<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions[span_211](end_span)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers?.map((user) => (
                        <tr key={user.id}>
                          [span_212](start_span)<td>{user.id}[span_212](end_span)</td>
                          [span_213](start_span)<td>{user.name}[span_213](end_span)</td>
                          [span_214](start_span)<td>{user.email}[span_214](end_span)</td>
                          [span_215](start_span)<td>{new Date(user.createdAt).toLocaleString()}[span_215](end_span)</td>
                          <td>
                            [span_216](start_span)<button onClick={() => handleEditUser(user)}>View Details</button>[span_216](end_span)
                            [span_217](start_span)<button onClick={() => handleDeleteUser(user.id)}>Delete</button>[span_217](end_span)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === "queries" && (
            <div className="space-y-6">
              [span_218](start_span)<h2 className="text-3xl font-bold">User Queries[span_218](end_span)</h2>
              [span_219](start_span)<input type="text" placeholder="Search queries by email or phone..." value={querySearch} onChange={(e) => setUserSearchQuery(e.target.value)} className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500" />[span_219](end_span)
              <div className="space-y-4">
                {queries?.length > 0 ? (
                  queries?.filter(q => q.email.toLowerCase().includes(querySearch.toLowerCase()) || q.phone.includes(querySearch) || (q.date && q.date.includes(querySearch))).map((query, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md space-y-1">
                      [span_220](start_span)<p><strong>Email:</strong> {query.email}[span_220](end_span)</p>
                      [span_221](start_span)<p><strong>Phone:</strong> {query.phone}[span_221](end_span)</p>
                      [span_222](start_span){query.date && <p><strong>Date:</strong> {query.date}[span_222](end_span)</p>}
                      [span_223](start_span)<p><strong>Message:</strong> {query.message}[span_223](end_span)</p>
                    </div>
                  ))
                ) : (
                  [span_224](start_span)<p className="text-center text-gray-500">No queries found.</p>[span_224](end_span)
                )}
              </div>
            </div>
          )}
          [span_225](start_span){activeTab === "carts" && <CartsWishlistsTab />}[span_225](end_span)
        </div>
      </div>
    )
  );
};
export default AdminPanel;
