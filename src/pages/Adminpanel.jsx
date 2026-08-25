import React, { useState, useEffect, useMemo } from "react";
import { useUser, useAuth } from "@clerk/clerk-react"; 
import { useUserDetails } from "../features/users/hooks/useUsers";
import { useProducts, useArchivedProducts, useArchiveProduct, useUnarchiveProduct, useRefreshProductStock } from "../features/catalog/hooks/useProducts";

import { useAllCoupons, useSaveCoupon, useDeleteCoupon } from "../features/coupons/hooks/useCoupons";
import { 
  useAdminUsers, useAdminOrders, useAdminOrderDetails, useAdminReports, 
  useAdminAbandonedCarts, useAdminWishlistStats,
  useUpdateUser, useDeleteUser, useUpdateOrderStatus, useUpdateBulkOrderStatus,
  usePreviewShipOrders, useShipOrders, useCancelOrderAdmin 
} from "../features/admin/hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, BarChart3, Package, Ticket, ShoppingBag, Users,
  MessageSquare, ShoppingCart, MapPin, Menu, X, LogOut, ChevronRight, ChevronDown, Home,
  LineChart, History, Gift, Shield, UserCog, Headphones, Globe
} from 'lucide-react';

// Modals & Components
import ImageUploadModal from "./ImageUploadModal";
import ShippingRulesManager from "../features/admin/components/shipping/ShippingRulesManager";
import Reports from "../Components/admin/Reports";
import DashboardTab from "../Components/admin/DashboardTab";
import MarketIntelligenceTab from "../Components/admin/MarketIntelligenceTab";
import ProductsTab from "../Components/admin/ProductsTab";
import CouponsTab from "../Components/admin/CouponsTab";
import OrdersTab from "../Components/admin/OrdersTab";
import UsersTab from "../Components/admin/UsersTab";
import QueriesTab from "../Components/admin/QueriesTab";
import SupportInbox from "../Components/admin/SupportInbox";
import CartsWishlistsTab from "../Components/admin/CartsWishlistsTab";
import ProductVariantEditor from "../Components/admin/ProductVariantEditor";
import AuditLogsTab from "../Components/admin/audit/AuditLogsTab";
import CmsTab from "../Components/admin/CmsTab";
import ReferralsTab from "../Components/admin/ReferralsTab";
import AdminRewardsTab from '../Components/admin/AdminRewardsTab'; 
import AdminLotteryTab from '../Components/admin/AdminLotteryTab';
import RolesTab from '../Components/admin/RolesTab';
import AdministratorsTab from '../Components/admin/AdministratorsTab';
import SiteControlTab from '../Components/admin/SiteControlTab';
import { ShimmerSweep, AdminStatSkeleton, AdminRowSkeleton } from "../Components/ui/ShimmerSkeleton";
import { ErrorBoundary } from "../Components/ErrorBoundary";
import { usePermissions } from '../features/admin/hooks/usePermissions';
import { useSiteStatus } from '../features/site/useSiteStatus';

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
  const [timeRangeInDays, setTimeRangeInDays] = useState(30);

  // Floating Tooltip State
  const [hoveredItem, setHoveredItem] = useState(null);

  // Image Error State
  const [imgError, setImgError] = useState(false);

  // Contexts
  const { data: userdetails } = useUserDetails();
  const { data: products = [] } = useProducts();
  const { data: archivedProducts = [], refetch: refetchArchivedProducts } = useArchivedProducts();
  const { mutateAsync: deleteProduct } = useArchiveProduct();
  const { mutateAsync: unarchiveProduct } = useUnarchiveProduct();
  const { mutateAsync: refreshProductStock } = useRefreshProductStock();

  const { data: coupons = [] } = useAllCoupons();
  const { mutateAsync: saveCoupon } = useSaveCoupon();
  const { mutateAsync: deleteCoupon } = useDeleteCoupon();
  const [editingCoupon, setEditingCoupon] = useState(null);

  const { data: usersResponse, refetch: refetchUsers } = useAdminUsers(1, 100);
  const users = usersResponse?.data || [];
  
  const { data: ordersResponse, refetch: refetchOrders } = useAdminOrders(1, 100);
  const orders = ordersResponse?.data || [];
  const { data: reportOrders = [] } = useAdminReports();
  const { data: abandonedCarts = [] } = useAdminAbandonedCarts();
  const { data: wishlistStats = [] } = useAdminWishlistStats();

  const { mutateAsync: cancelOrder } = useCancelOrderAdmin();
  const { mutateAsync: updateOrderStatus } = useUpdateOrderStatus();
  const { mutateAsync: updateUserApi } = useUpdateUser();

  const { user, isLoaded, signOut } = useUser();
  const { getToken } = useAuth(); 
  const navigate = useNavigate();

  // Local State
  const [editingUser, setEditingUser] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderStatusTab, setOrderStatusTab] = useState("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const [showArchived, setShowArchived] = useState(false);
  const [couponSubTab, setCouponSubTab] = useState("manual");

  const { data: siteStatus } = useSiteStatus();

  const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // Auth Guard
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getAvatarColor = () => {
    return "bg-[var(--surface-muted)] text-[var(--brand)] ring-1 ring-[var(--border)]/50";
  };

  const handleProductArchive = async (id) => { if (window.confirm("Archive product?")) { setLoading(true); await deleteProduct(id); setLoading(false); } };
  const handleProductUnarchive = async (id) => { if (window.confirm("Unarchive product?")) { setLoading(true); await unarchiveProduct(id); setLoading(false); } };

  const { mutateAsync: updateUser } = useUpdateUser();

  const handleEditUser = (u) => setEditingUser(u);
  const handleSaveUser = async () => { };
  const handleDeleteUser = async (id) => { };
  
  const handleUpdateOrderStatus = async (id, status) => { 
      await updateOrderStatus({ orderId: id, status }); 
  };
  
  const handleCancelOrder = async (order) => { if (window.confirm(`Cancel Order #${order.id}?`)) await cancelOrder({ orderId: order.id, amount: order.totalAmount }); };

  const handleReturnOrder = async (orderId) => {
    if (window.confirm(`Initiate Return for Order #${orderId}? A reverse pickup will be arranged.`)) {
      try {
        const token = await getToken();
        const response = await fetch(`${BASE}/api/orders/${orderId}/return`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
          }
        });
        const data = await response.json();
        
        if (response.ok) {
          window.toast.success(`Return for order ${orderId} initiated successfully.`);
          refetchOrders();
        } else {
          window.toast.error(data.error || "Failed to initiate return.");
        }
      } catch (error) {
        console.error("Error initiating return:", error);
        window.toast.error("Failed to initiate return.");
      }
    }
  };

  const { role, hasPermission, isLoading: permissionsLoading } = usePermissions();

  // --- REFINED & LOGICAL CATEGORIZATION ---
  const allMenuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard }, 
    
    // Commerce
    { id: 'products', label: 'Products', icon: Package, requiredPermission: 'products.view', category: 'Commerce' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, requiredPermission: 'orders.view', category: 'Commerce' },
    { id: 'carts', label: 'Carts & Wishlist', icon: ShoppingCart, requiredPermission: 'carts.view', category: 'Commerce' },
    
    // Marketing & Growth
    { id: 'coupons', label: 'Coupons', icon: Ticket, requiredPermission: 'coupons.view', category: 'Marketing & Growth' },
    { id: 'referrals', label: 'Referrals', icon: Gift, requiredPermission: 'referrals.view', category: 'Marketing & Growth' },
    
    // Customer Experience
    { id: 'users', label: 'Customers', icon: Users, requiredPermission: 'customers.view', category: 'Customer Experience' },
    { id: 'support', label: 'Support', icon: Headphones, requiredPermission: 'support.view', category: 'Customer Experience' },
    { id: 'rewards', label: 'Rewards', icon: Gift, requiredPermission: 'rewards.view', category: 'Customer Experience' },
    { id: 'lottery', label: 'Lottery', icon: Gift, requiredPermission: 'lottery.view', category: 'Customer Experience' },
    
    // Intelligence
    { id: 'reports', label: 'Analytics', icon: BarChart3, requiredPermission: 'analytics.view', category: 'Intelligence' },
    { id: 'insights', label: 'Market & Customer Intelligence', icon: LineChart, requiredPermission: 'marketIntel.view', category: 'Intelligence' },
    
    // Operations
    { id: 'pincodes', label: 'Logistics', icon: MapPin, requiredPermission: 'logistics.view', category: 'Operations' },
    
    // Website
    { id: 'cms', label: 'Site Content', icon: LayoutDashboard, requiredPermission: 'content.view', category: 'Website' },
    { id: 'siteControl', label: 'Site Control', icon: Globe, requiredPermission: 'siteControl.view', category: 'Website' },
    
    // Administration & Security
    { id: 'roles', label: 'Roles', icon: Shield, requiredPermission: 'roles.view', category: 'Administration & Security' },
    { id: 'administrators', label: 'Administrators', icon: UserCog, requiredPermission: 'administrators.view', category: 'Administration & Security' },
    { id: 'logs', label: 'Audit Logs', icon: History, requiredPermission: 'auditLogs.view', category: 'Administration & Security' }, 
  ];

  const menuItems = permissionsLoading ? [] : allMenuItems.filter(item => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  // Segregate dashboard and group the rest by category sequentially
  const dashboardItem = menuItems.find(item => item.id === 'dashboard');
  const groupedItems = menuItems.filter(item => item.id !== 'dashboard').reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // For Navbar active state labeling
  const currentTabItem = menuItems.find(item => item.id === activeTab) || dashboardItem;

  useEffect(() => {
    if (!permissionsLoading && menuItems.length > 0) {
      if (!menuItems.find(m => m.id === activeTab)) {
        setActiveTab(menuItems[0].id);
      }
    }
  }, [permissionsLoading, menuItems, activeTab]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    if (tab === "products") refetchArchivedProducts();
  };

  const handleMouseEnter = (e, label) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const top = rect.top + (rect.height / 2);
    setHoveredItem({ label, top });
  };
  const handleMouseLeave = () => setHoveredItem(null);

  if (!isLoaded || !userdetails) return (
    <div className="flex h-screen w-full bg-[var(--bg)] overflow-hidden fixed inset-0 z-[10000]">
      {/* Premium Sidebar Skeleton */}
      <aside className="hidden lg:flex flex-col bg-[var(--surface)] w-24 z-50 border-r border-[var(--border)]/40">
        <div className="h-20 flex items-center justify-center border-b border-[var(--border)]/30 mb-6">
           <div className="h-10 w-10 bg-[var(--surface-muted)] rounded-[1.25rem] relative overflow-hidden"><ShimmerSweep /></div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-5 px-2">
           {Array.from({length: 6}).map((_, i) => (
             <div key={i} className="h-12 w-12 bg-[var(--surface-muted)] rounded-[1.25rem] relative overflow-hidden"><ShimmerSweep /></div>
           ))}
        </div>
      </aside>
      
      {/* Premium Main Content Skeleton */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[var(--bg)]">
        <div className="h-20 w-full bg-[var(--surface)]/60 backdrop-blur-xl flex items-center justify-between px-8 border-b border-[var(--border)]/30">
          <div className="h-6 w-40 bg-[var(--surface-muted)] rounded-lg relative overflow-hidden"><ShimmerSweep /></div>
          <div className="h-10 w-32 bg-[var(--surface-muted)] rounded-full relative overflow-hidden"><ShimmerSweep /></div>
        </div>
        <div className="p-8 lg:p-10">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <AdminStatSkeleton />
              <AdminStatSkeleton />
              <AdminStatSkeleton />
              <AdminStatSkeleton />
           </div>
           <div className="bg-[var(--surface)] rounded-[2.5rem] p-8 ring-1 ring-[var(--border)]/30 shadow-[0_8px_40px_rgba(0,0,0,0.03)] relative overflow-hidden">
             <div className="h-8 w-56 bg-[var(--surface-muted)] rounded-xl mb-8 relative overflow-hidden"><ShimmerSweep /></div>
             <div className="flex flex-col gap-5">
               <AdminRowSkeleton />
               <AdminRowSkeleton />
               <AdminRowSkeleton />
               <AdminRowSkeleton />
             </div>
           </div>
        </div>
      </main>
    </div>
  );

  const adminName = userdetails?.name || user?.fullName || user?.firstName || "Administrator";
  const adminImage = userdetails?.image || userdetails?.avatar || userdetails?.imageUrl || userdetails?.profileImage || user?.imageUrl || user?.profileImageUrl;

  return (
    <div className="flex h-screen w-full font-body bg-[var(--bg)] text-[var(--text)] overflow-hidden fixed inset-0 z-[10000]">

      {/* --- MOBILE SIDEBAR --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 bg-[var(--bg)]/80 backdrop-blur-sm z-[9999] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 w-[280px] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 z-[10000] lg:hidden shadow-[20px_0_40px_rgba(0,0,0,0.08)] flex flex-col"
            >
              <div className="p-6 h-20 border-b border-[var(--border)]/30 flex justify-between items-center shrink-0">
                <span className="text-3xl font-display font-medium text-[var(--text)] tracking-tight">
                  Devid<span className="text-[var(--accent)] italic">Aura</span>
                </span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2.5 text-[var(--sub)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] rounded-[1rem] transition-colors"><X size={20} strokeWidth={2} /></button>
              </div>
              
              <nav className="flex-1 p-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                
                {/* Pinned Dashboard Item */}
                {dashboardItem && (
                  <div className="mb-6">
                    <button onClick={() => handleTabClick(dashboardItem.id)} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-[1.25rem] text-sm font-bold transition-all duration-300 ease-out ${activeTab === dashboardItem.id ? "bg-[var(--text)] text-[var(--surface)] shadow-[0_8px_16px_rgba(0,0,0,0.1)]" : "text-[var(--sub)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"}`}>
                      <dashboardItem.icon size={18} strokeWidth={activeTab === dashboardItem.id ? 2.5 : 2} className={activeTab === dashboardItem.id ? "" : "text-[var(--accent)] shrink-0"} />
                      <span>{dashboardItem.label}</span>
                    </button>
                  </div>
                )}

                {/* Categorized Menu Items */}
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="mb-6">
                    <span className="px-5 text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2 block">
                      {category}
                    </span>
                    <div className="space-y-1.5">
                      {items.map(item => {
                        const isActive = activeTab === item.id;
                        const btnClass = isActive 
                          ? "bg-[var(--text)] text-[var(--surface)] shadow-[0_8px_16px_rgba(0,0,0,0.1)]" 
                          : "text-[var(--sub)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]";

                        return (
                          <button key={item.id} onClick={() => handleTabClick(item.id)} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-[1.25rem] text-sm font-bold transition-all duration-300 ease-out ${btnClass}`}>
                            <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "" : "text-[var(--accent)] shrink-0"} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="p-5 border-t border-[var(--border)]/30 shrink-0">
                <button onClick={() => signOut()} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-[1.25rem] text-sm font-bold text-[var(--error)] hover:bg-[var(--error)]/10 hover:ring-1 hover:ring-[var(--error)]/20 transition-all duration-300">
                  <LogOut size={18} strokeWidth={2} /> <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col bg-[var(--surface)] border-r border-[var(--border)]/40 w-[100px] z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative">
        <div className="h-20 flex items-center justify-center border-b border-[var(--border)]/30 shrink-0">
          <span className="text-3xl font-display font-medium text-[var(--text)] tracking-tight cursor-pointer hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" onClick={() => navigate('/')}>D<span className="text-[var(--accent)] italic">A</span></span>
        </div>
        
        <nav className="flex-1 py-6 px-1 overflow-y-auto overflow-x-hidden flex flex-col items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* Pinned Dashboard Item */}
          {dashboardItem && (
            <div className="w-full flex justify-center mb-4">
              <button
                onClick={() => handleTabClick(dashboardItem.id)}
                onMouseEnter={(e) => handleMouseEnter(e, dashboardItem.label)}
                onMouseLeave={handleMouseLeave}
                className={`w-14 h-14 flex items-center justify-center rounded-[1.25rem] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative ${activeTab === dashboardItem.id ? "bg-[var(--text)] text-[var(--surface)] shadow-[0_8px_16px_rgba(0,0,0,0.12)] scale-110 p-2" : "text-[var(--sub)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] hover:scale-105 hover:shadow-sm"}`}
              >
                <dashboardItem.icon size={22} strokeWidth={activeTab === dashboardItem.id ? 2.5 : 2} className={activeTab === dashboardItem.id ? "" : "text-[var(--accent)]"} />
              </button>
            </div>
          )}

          {/* Categorized Menu Items separated by subtle dividers */}
          {Object.entries(groupedItems).map(([category, items], idx) => (
            <div key={category} className="w-full flex flex-col items-center">
              
              {/* Elegant group separator line */}
              <div className="w-6 h-[1.5px] bg-[var(--border)]/60 rounded-full my-3" />
              
              <div className="space-y-3 w-full flex flex-col items-center">
                {items.map(item => {
                  const isActive = activeTab === item.id;
                  const btnClass = isActive 
                    ? "bg-[var(--text)] text-[var(--surface)] shadow-[0_8px_16px_rgba(0,0,0,0.12)] scale-110 p-2" 
                    : "text-[var(--sub)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] hover:scale-105 hover:shadow-sm";

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                      onMouseLeave={handleMouseLeave}
                      className={`w-14 h-14 flex items-center justify-center rounded-[1.25rem] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative ${btnClass}`}
                    >
                      <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "" : "text-[var(--accent)]"} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        
        {/* Desktop Scroll Indicator Pill */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none flex justify-center items-center z-50">
          <div className="bg-[var(--surface)]/80 backdrop-blur-md text-[var(--sub)] px-2 py-1 rounded-full shadow-sm ring-1 ring-[var(--border)]/40 text-[10px] flex flex-col items-center opacity-80">
            <ChevronDown size={14} strokeWidth={2.5} />
          </div>
        </div>
        <div className="p-5 border-t border-[var(--border)]/30 flex justify-center relative z-10 bg-[var(--surface)] shrink-0">
          <button onClick={() => signOut()} onMouseEnter={(e) => handleMouseEnter(e, "Sign Out")} onMouseLeave={handleMouseLeave} className="w-14 h-14 flex items-center justify-center rounded-[1.25rem] text-[var(--muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 hover:ring-1 hover:ring-[var(--error)]/20 transition-all duration-300">
            <LogOut size={22} strokeWidth={2} />
          </button>
        </div>
      </aside>

      {/* --- FLOATING TOOLTIP --- */}
      <AnimatePresence>
        {hoveredItem && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.9, y: "-50%" }}
            animate={{ opacity: 1, x: 0, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, x: -10, scale: 0.9, y: "-50%" }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'fixed', left: '115px', top: hoveredItem.top, zIndex: 99999 }}
            className="pointer-events-none flex items-center font-body"
          >
            <div className="w-2.5 h-2.5 bg-[var(--text)] rotate-45 translate-x-1.5 rounded-sm"></div>
            <div className="px-4 py-2.5 bg-[var(--text)] text-[var(--surface)] text-[11px] font-bold tracking-wide uppercase rounded-xl shadow-xl whitespace-nowrap leading-none flex items-center">{hoveredItem.label}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg)] relative">

        {/* Global Admin Maintenance Banner (Premium Design) */}
        {siteStatus?.mode === 'MAINTENANCE' && (
          <div className="bg-[var(--error)]/10 backdrop-blur-xl text-[var(--error)] px-6 py-3 flex items-center justify-between text-sm shrink-0 shadow-sm z-40 relative ring-1 ring-[var(--error)]/20 border-b border-[var(--error)]/10">
            <div className="flex items-center gap-3 font-bold tracking-wide">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--error)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--error)] shadow-[0_0_8px_var(--error)]"></span>
              </span>
              SITE IS CURRENTLY IN MAINTENANCE
            </div>
            <button 
              onClick={() => setActiveTab('siteControl')}
              className="bg-[var(--error)] text-[var(--surface)] hover:bg-[var(--error)]/90 px-4 py-1.5 rounded-full font-bold text-xs transition-colors shadow-sm"
            >
              Reactivate Website
            </button>
          </div>
        )}

        {/* --- TOP NAVBAR (Ultra-Glassmorphism) --- */}
        <div className="h-20 w-full bg-[var(--surface)]/70 backdrop-blur-2xl flex items-center justify-between px-6 sm:px-10 z-30 sticky top-0 border-b border-[var(--border)]/30 shadow-[0_4px_30px_rgba(0,0,0,0.02)] shrink-0">

          <div className="flex items-center gap-5">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 -ml-3 text-[var(--text)] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 hover:bg-[var(--surface-muted)] rounded-[1rem] transition-colors shadow-sm">
              <Menu size={20} strokeWidth={2} />
            </button>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--brand)] transition-colors cursor-pointer group" onClick={() => navigate('/')}>
                <div className="p-2 bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-[0.75rem] group-hover:ring-[var(--brand)]/30 transition-all shadow-sm"><Home size={14} strokeWidth={2} /></div>
                <span className="hidden sm:inline font-bold font-body tracking-wide">Home</span>
              </div>
              <ChevronRight size={14} strokeWidth={3} className="text-[var(--border)]" />
              <div className="flex items-center gap-2">
                <span className="font-bold font-body text-[var(--text)] capitalize text-[13px] sm:text-sm tracking-wide bg-[var(--surface-muted)] px-3 py-1.5 rounded-lg ring-1 ring-[var(--border)]/30 shadow-inner">
                  {currentTabItem?.label || activeTab.replace(/[-_]/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 pl-4 pr-1.5 py-1.5 rounded-[1.5rem] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 hover:ring-[var(--border)] shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group">
              <div className="flex flex-col items-end">
                <span className="text-[13px] font-bold font-body text-[var(--text)] leading-tight group-hover:text-[var(--brand)] transition-colors">{adminName}</span>
                <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest leading-tight mt-0.5">{role?.replace(/_/g, ' ') || 'Admin'}</span>
              </div>

              <div className="w-10 h-10 p-0.5 rounded-full ring-1 ring-[var(--border)]/50 bg-[var(--surface-muted)]">
                {adminImage && !imgError ? (
                  <img src={adminImage} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full rounded-full object-cover bg-[var(--surface)] shadow-sm" onError={() => setImgError(true)} />
                ) : (
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${getAvatarColor()}`}>
                    {adminName ? adminName.charAt(0).toUpperCase() : "A"}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth" data-lenis-prevent>
          <div className="max-w-[1600px] mx-auto min-h-full pb-20">
            {openModal && <ImageUploadModal isopen={openModal} onClose={() => setOpenModal(false)} />}
            {editingProduct && <ProductVariantEditor product={editingProduct} onClose={() => { setEditingProduct(null); refetchArchivedProducts(); }} />}

            <motion.div key={activeTab} initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              <ErrorBoundary key={activeTab}>
                {activeTab === "dashboard" && <DashboardTab setActiveTab={setActiveTab} />}
                {activeTab === "reports" && <Reports products={products} users={users} orders={reportOrders} />}
                {activeTab === "insights" && <MarketIntelligenceTab />}
                {activeTab === "logs" && <AuditLogsTab />}
                {activeTab === "products" && <ProductsTab products={products} archivedProducts={archivedProducts} showArchived={showArchived} loading={loading} handleProductArchive={handleProductArchive} handleProductUnarchive={handleProductUnarchive} setEditingProduct={setEditingProduct} downloadCSV={downloadCSV} setOpenModal={setOpenModal} setShowArchived={setShowArchived} refreshProductStock={refreshProductStock} />}
                {activeTab === "coupons" && <CouponsTab coupons={coupons} users={users} couponSubTab={couponSubTab} setCouponSubTab={setCouponSubTab} editingCoupon={editingCoupon} setEditingCoupon={setEditingCoupon} saveCoupon={saveCoupon} deleteCoupon={deleteCoupon} />}
                {activeTab === "orders" && <OrdersTab orderSearchQuery={orderSearchQuery} setOrderSearchQuery={setOrderSearchQuery} orderStatusTab={orderStatusTab} setOrderStatusTab={setOrderStatusTab} handleUpdateOrderStatus={handleUpdateOrderStatus} handleCancelOrder={handleCancelOrder} handleReturnOrder={handleReturnOrder} downloadCSV={downloadCSV} />}
                {activeTab === "users" && <UsersTab userSearchQuery={userSearchQuery} setUserSearchQuery={setUserSearchQuery} editingUser={editingUser} setEditingUser={setEditingUser} handleEditUser={handleEditUser} handleSaveUser={handleSaveUser} handleDeleteUser={handleDeleteUser} downloadCSV={downloadCSV} />}
                {activeTab === "support" && <SupportInbox />}
                {activeTab === "carts" && <CartsWishlistsTab flatCarts={abandonedCarts} stats={wishlistStats} />}
                {activeTab === "pincodes" && <ShippingRulesManager />}
                {activeTab === "cms" && <CmsTab />}
                {activeTab === "referrals" && <ReferralsTab />}
                {activeTab === "rewards" && <AdminRewardsTab />}
                {activeTab === "lottery" && <AdminLotteryTab />}
                {activeTab === "roles" && <RolesTab />}
                {activeTab === "administrators" && <AdministratorsTab />}
                {activeTab === "siteControl" && <SiteControlTab />}
              </ErrorBoundary>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
