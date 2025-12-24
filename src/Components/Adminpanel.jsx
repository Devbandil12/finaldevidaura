import React, { useState, useContext, useEffect, useMemo } from "react";
import { UserContext } from "../contexts/UserContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { AdminContext } from "../contexts/AdminContext";
import { CouponContext } from "../contexts/CouponContext";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, BarChart3, Package, Ticket, ShoppingBag, Users,
  MessageSquare, ShoppingCart, MapPin, Menu, X, LogOut, ChevronRight, Home,
  LineChart, History // 1. Added Icon for Insights
} from 'lucide-react';

// Modals & Components
import ImageUploadModal from "./ImageUploadModal";
import PincodeManager from "./PincodeManager";
import Reports from "./Reports";
import DashboardTab from "./DashboardTab";
import InsightsTab from "./InsightsTab"; // 2. Imported InsightsTab
import ProductsTab from "./ProductsTab";
import CouponsTab from "./CouponsTab";
import OrdersTab from "./OrdersTab";
import UsersTab from "./UsersTab";
import QueriesTab from "./QueriesTab";
import CartsWishlistsTab from "./CartsWishlistsTab";
import ProductVariantEditor from "./ProductVariantEditor";
import ActivityLogsTab from "./ActivityLogsTab"; // 2. Import the new component
import CmsTab from "./CmsTab";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// ✅ REGISTER THEM HERE
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// --- CSV Export Utility ---
const downloadCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) { window.toast.error("No data available to export."); return; }
  const flattenedData = data.map(item => {
    const flatItem = {};
    for (const key in item) {
      if (typeof item[key] === 'object' && item[key] !== null) {
        if (Array.isArray(item[key])) { flatItem[key] = JSON.stringify(item[key]); } else { for (const subKey in item[key]) { flatItem[`${key}_${subKey}`] = item[key][subKey]; } }
      } else { flatItem[key] = item[key]; }
    }
    return flatItem;
  });
  const headers = Object.keys(flattenedData[0]);
  const csvContent = [headers.join(','), ...flattenedData.map(row => headers.map(header => JSON.stringify(row[header])).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', filename);
    link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [timeRangeInDays, setTimeRangeInDays] = useState(30);

  // Floating Tooltip State
  const [hoveredItem, setHoveredItem] = useState(null);

  // Image Error State
  const [imgError, setImgError] = useState(false);

  // Contexts
  const { products, deleteProduct, unarchiveProduct, archivedProducts, getArchivedProducts, refreshProductStock } = useContext(ProductContext);
  const { userdetails } = useContext(UserContext);

  const { tickets: queries, getAllTickets: getquery } = useContext(ContactContext);

  const { coupons, editingCoupon, setEditingCoupon, saveCoupon, deleteCoupon, refreshCoupons } = useContext(CouponContext);

  const {
    users, orders, getAllUsers, getAllOrders, updateOrderStatus, getSingleOrderDetails,
    reportOrders, getReportData, cancelOrder, abandonedCarts, wishlistStats
  } = useContext(AdminContext);

  const { user, isLoaded, signOut } = useUser();
  const navigate = useNavigate();

  // Local State
  const [editingUser, setEditingUser] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderStatusTab, setOrderStatusTab] = useState("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [couponSubTab, setCouponSubTab] = useState("manual");

  const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // Auth Guard
  useEffect(() => {
    if (isLoaded && (!user || userdetails?.role !== "admin")) {
      // navigate("/"); 
    }
  }, [userdetails, navigate, isLoaded, user]);

  useEffect(() => {
    if (isLoaded && user && userdetails?.role === "admin") {
      getAllUsers(); getAllOrders(); getquery(); refreshCoupons(); getArchivedProducts();
    }
  }, [isLoaded, user, userdetails, getAllUsers, getAllOrders, getquery, refreshCoupons, getArchivedProducts]);

  // --- Logic from UsersTab.jsx for Avatar Colors ---
  const getAvatarColor = (name) => {
    const colors = [
      "bg-red-100 text-red-600", "bg-orange-100 text-orange-600",
      "bg-amber-100 text-amber-600", "bg-green-100 text-green-600",
      "bg-teal-100 text-teal-600", "bg-blue-100 text-blue-600",
      "bg-indigo-100 text-indigo-600", "bg-purple-100 text-purple-600",
      "bg-pink-100 text-pink-600"
    ];
    return colors[(name ? name.length : 0) % colors.length];
  };

  // 🟢 FIX: Filter successful orders to exclude Pending Payments
  const successfulOrders = useMemo(() => {
    return orders?.filter(order => {
      // 1. Must not be Cancelled
      if (order.status === "Order Cancelled") return false;

      // 2. Must not be explicitly 'pending_payment' (Backend status for unpaid online)
      if (order.status === "pending_payment" || order.status === "pending payment") return false;

      // 3. Strict Check: If Online and Payment is Pending -> Exclude
      const pMode = (order.paymentMode || "").toLowerCase();
      const pStatus = (order.paymentStatus || "").toLowerCase();
      if (pMode === 'online' && (pStatus === 'pending' || pStatus === 'pending_payment')) {
        return false;
      }

      return true;
    }) || [];
  }, [orders]);

  const totalOrders = orders?.length;
  const totalQueries = queries?.length;
  const cancelledOrdersValue = orders?.filter(order => order.status === "Order Cancelled").reduce((sum, order) => sum + order.totalAmount, 0);
  const totalRevenue = successfulOrders?.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = successfulOrders?.length > 0 ? totalRevenue / successfulOrders.length : 0;
  const conversionRate = users?.length > 0 ? (successfulOrders?.length / users?.length) * 100 : 0;

  const { newCustomers, returningCustomers } = useMemo(() => {
    if (!orders?.length || !users?.length) return { newCustomers: 0, returningCustomers: 0 };
    const now = new Date(); const thresholdDate = new Date(); thresholdDate.setDate(now.getDate() - timeRangeInDays);
    const ordersInPeriod = orders.filter(o => o.createdAt && new Date(o.createdAt) >= thresholdDate && new Date(o.createdAt) <= now);
    const userIdsInPeriod = [...new Set(ordersInPeriod.map(o => o.userId))];
    let newCount = 0; let returningCount = 0; const usersMap = new Map(users.map(u => [u.id, u]));
    for (const userId of userIdsInPeriod) {
      const user = usersMap.get(userId); if (!user || !user.orders?.length) continue;
      const firstOrder = user.orders.reduce((earliest, current) => (!current.createdAt ? earliest : (!earliest.createdAt ? current : (new Date(current.createdAt) < new Date(earliest.createdAt) ? current : earliest))), user.orders[0]);
      if (!firstOrder?.createdAt) continue;
      if (new Date(firstOrder.createdAt) >= thresholdDate) newCount++; else returningCount++;
    }
    return { newCustomers: newCount, returningCustomers: returningCount };
  }, [orders, users, timeRangeInDays]);

  const handleProductArchive = async (id) => { if (window.confirm("Archive product?")) { setLoading(true); await deleteProduct(id); setLoading(false); } };
  const handleProductUnarchive = async (id) => { if (window.confirm("Unarchive product?")) { setLoading(true); await unarchiveProduct(id); setLoading(false); } };

  const filteredUsers = users?.filter((u) =>
    u?.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u?.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u?.phone?.includes(userSearchQuery)
  );

  // 🟢 NEW: Handle Role Update from Backend (Includes Actor ID)
  const handleUpdateUserRole = async (userId, newRole) => {
    // Confirm before changing sensitive permissions
    if (!window.confirm(`Are you sure you want to change this user's role to "${newRole}"?`)) return;

    try {
      setLoading(true);

      // 🟢 Get Current Admin ID (Actor)
      const currentAdminId = userdetails?.id;

      const response = await fetch(`${BASE}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: newRole,
          actorId: currentAdminId // 🟢 SEND ACTOR ID
        }),
      });
      const data = await response.json();

      if (response.ok) {
        window.toast.success(`Role updated to ${newRole}`);
        // Update local editing state instantly
        setEditingUser(prev => ({ ...prev, role: newRole }));
        // Refresh full user list
        getAllUsers();
      } else {
        window.toast.error(data.message || "Failed to update role");
      }
    } catch (error) {
      console.error("Update Error:", error);
      window.toast.error("Error updating role");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (u) => setEditingUser(u);
  const handleSaveUser = async () => { };
  const handleDeleteUser = async (id) => { };
  const handleUpdateOrderStatus = async (id, status) => { await updateOrderStatus(id, status); getAllOrders(); };
  const handleCancelOrder = async (order) => { if (window.confirm(`Cancel Order #${order.id}?`)) await cancelOrder(order.id, order.paymentMode, order.totalAmount); };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    if (tab === "reports") getReportData();
    if (tab === "products") getArchivedProducts();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'reports', label: 'Analytics', icon: BarChart3 },
    { id: 'insights', label: 'Market Intel', icon: LineChart },
    { id: 'logs', label: 'Audit Logs', icon: History }, 
    { id: 'products', label: 'Products', icon: Package },
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'users', label: 'Customers', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'carts', label: 'Carts & Wish', icon: ShoppingCart },
    { id: 'queries', label: 'Messages', icon: MessageSquare },
    { id: 'pincodes', label: 'Logistics', icon: MapPin },
    { id: 'cms', label: 'Site Content', icon: LayoutDashboard },
  ];

  // Tooltip Logic
  const handleMouseEnter = (e, label) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const top = rect.top + (rect.height / 2);
    setHoveredItem({ label, top });
  };
  const handleMouseLeave = () => setHoveredItem(null);

  if (!isLoaded || !userdetails) return <div className="h-screen w-full flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  const adminName = userdetails?.name || user?.fullName || user?.firstName || "Administrator";
  const adminImage =
    userdetails?.image ||
    userdetails?.avatar ||
    userdetails?.imageUrl ||
    userdetails?.profileImage ||
    user?.imageUrl ||
    user?.profileImageUrl;

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans fixed inset-0 z-[10000]">

      {/* --- MOBILE SIDEBAR --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* BACKDROP: Increased z-index to 9999 to cover all cards */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] lg:hidden"
            />
            {/* SIDEBAR: Increased z-index to 10000 to sit above backdrop */}
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-[10000] lg:hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xl font-extrabold text-gray-900 tracking-tight">Devid<span className="text-indigo-600">Aura</span></span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map(item => (
                  <button key={item.id} onClick={() => handleTabClick(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? "bg-indigo-50 text-indigo-700 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                    <item.icon size={18} /> {item.label}
                  </button>
                ))}
              </nav>
              <div className="p-4 border-t border-gray-100">
                <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={18} /> Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col bg-white w-20 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative">
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <span className="text-xl font-extrabold text-indigo-600 tracking-tight cursor-pointer" onClick={() => navigate('/')}>DA</span>
        </div>
        <nav className="flex-1 p-3 space-y-3 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col items-center">
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                onMouseLeave={handleMouseLeave}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 relative ${isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105" : "text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"}`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 flex justify-center">
          <button onClick={() => signOut()} onMouseEnter={(e) => handleMouseEnter(e, "Sign Out")} onMouseLeave={handleMouseLeave} className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* --- FLOATING TOOLTIP --- */}
      <AnimatePresence>
        {hoveredItem && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95, y: "-50%" }}
            animate={{ opacity: 1, x: 0, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, x: -10, scale: 0.95, y: "-50%" }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ position: 'fixed', left: '70px', top: hoveredItem.top, zIndex: 99999 }}
            className="pointer-events-none flex items-center"
          >
            <div className="w-2 h-2 bg-gray-900 rotate-45 translate-x-1"></div>
            <div className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap leading-none flex items-center">{hoveredItem.label}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 relative">

        {/* --- TOP NAVBAR --- */}
        <div className="h-16 w-full bg-white/90 backdrop-blur-md  flex items-center justify-between px-4 sm:px-8 z-30 sticky top-0">

          {/* Left: Mobile Menu & Breadcrumb */}
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate('/')}>
                <div className="p-1.5 bg-gray-100 rounded-md"><Home size={14} /></div>
                <span className="hidden sm:inline font-medium">Home</span>
              </div>
              <ChevronRight size={14} className="text-gray-300" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800 capitalize text-sm tracking-wide">{activeTab.replace('-', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Right: User Profile */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all cursor-pointer group">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">{adminName}</span>
                <span className="text-[10px] text-gray-400 font-medium leading-tight">Super Admin</span>
              </div>

              <div className="w-9 h-9">
                {adminImage && !imgError ? (
                  <img src={adminImage} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full rounded-full object-cover  shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] bg-white" onError={() => setImgError(true)} />
                ) : (
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-sm font-bold shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] ${getAvatarColor(adminName)}`}>
                    {adminName ? adminName.charAt(0).toUpperCase() : "A"}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-[1600px] mx-auto min-h-full pb-20">
            {openModal && <ImageUploadModal isopen={openModal} onClose={() => setOpenModal(false)} />}
            {editingProduct && <ProductVariantEditor product={editingProduct} onClose={() => { setEditingProduct(null); getArchivedProducts(); }} />}

            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {activeTab === "dashboard" && <DashboardTab orders={orders} successfulOrders={successfulOrders} totalRevenue={totalRevenue} totalOrders={totalOrders} conversionRate={conversionRate} averageOrderValue={averageOrderValue} newCustomers={newCustomers} returningCustomers={returningCustomers} cancelledOrdersValue={cancelledOrdersValue} totalQueries={totalQueries} />}
              {activeTab === "reports" && <Reports products={products} users={users} orders={reportOrders} />}

              {/* 4. Render InsightsTab when active */}
              {activeTab === "insights" && <InsightsTab />}
              {activeTab === "logs" && <ActivityLogsTab />}
              {activeTab === "products" && <ProductsTab products={products} archivedProducts={archivedProducts} showArchived={showArchived} loading={loading} handleProductArchive={handleProductArchive} handleProductUnarchive={handleProductUnarchive} setEditingProduct={setEditingProduct} downloadCSV={downloadCSV} setOpenModal={setOpenModal} setShowArchived={setShowArchived} refreshProductStock={refreshProductStock} />}
              {activeTab === "coupons" && <CouponsTab coupons={coupons} users={users} couponSubTab={couponSubTab} setCouponSubTab={setCouponSubTab} editingCoupon={editingCoupon} setEditingCoupon={setEditingCoupon} saveCoupon={saveCoupon} deleteCoupon={deleteCoupon} />}
              {activeTab === "orders" && <OrdersTab orders={orders} orderSearchQuery={orderSearchQuery} setOrderSearchQuery={setOrderSearchQuery} orderStatusTab={orderStatusTab} setOrderStatusTab={setOrderStatusTab} handleUpdateOrderStatus={handleUpdateOrderStatus} handleCancelOrder={handleCancelOrder} getSingleOrderDetails={getSingleOrderDetails} downloadCSV={downloadCSV} />}
              {activeTab === "users" && <UsersTab users={users} filteredUsers={filteredUsers} userSearchQuery={userSearchQuery} setUserSearchQuery={setUserSearchQuery} editingUser={editingUser} setEditingUser={setEditingUser} handleEditUser={handleEditUser} handleSaveUser={handleSaveUser} handleDeleteUser={handleDeleteUser} handleUpdateUserRole={handleUpdateUserRole} downloadCSV={downloadCSV} />}
              {activeTab === "queries" && <QueriesTab queries={queries} querySearch={querySearch} setQuerySearch={setQuerySearch} />}
              {activeTab === "carts" && <CartsWishlistsTab flatCarts={abandonedCarts} stats={wishlistStats} />}
              {activeTab === "pincodes" && <PincodeManager />}
              {activeTab === "cms" && <CmsTab />}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;