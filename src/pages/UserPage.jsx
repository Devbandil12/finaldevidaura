// src/pages/UserPage.jsx
import React, { useState, useContext, useEffect, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { OrderContext } from "../contexts/OrderContext";
import { CartContext } from "../contexts/CartContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { ReviewContext } from "../contexts/ReviewContext";
import {
  Pencil, MapPin, Package, Star, MessageSquare, Plus,
  Trash2, CheckCircle, X, ShoppingBag, Bell, LogOut, User as UserIcon,
  Heart, ChevronDown, Loader2, Upload,
  ChevronRight, Send, Lock, RefreshCw, Clock, Headphones, Ticket, Sparkles, Layers,
  LayoutDashboard, ShieldAlert, UserCog, ShoppingCart, Calendar, Copy, Gift, Coins, TrendingUp, Users, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import useCloudinary from "../utils/useCloudinary";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from "framer-motion";
import EarnCashTab from './EarnCashTab'; // 🟢 Import

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

/* ========================================================================
   ANIMATION & UTILS
   ======================================================================== */
const smoothTransition = { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] };
const fadeInUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: smoothTransition } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// Helper: Deterministic Avatar Color (Muted/Pastel for new theme)
const getDeterministicColor = (s) => {
  const colors = ["bg-zinc-100 text-zinc-600", "bg-gray-100 text-gray-600", "bg-stone-100 text-stone-600"];
  if (!s) return colors[0];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
};

/* ========================================================================
   UI COMPONENTS (Matched to Wishlist/MyOrder)
   ======================================================================== */

// Standard Button
const Button = ({ onClick, variant = 'primary', size = 'default', className = '', children, disabled, type = "button" }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50 disabled:pointer-events-none active:scale-95";

  const sizeStyles = {
    default: "h-11 py-2 px-6",
    sm: "h-9 px-4 text-xs",
    icon: "h-10 w-10"
  };

  const variantStyles = {
    primary: "bg-zinc-900 text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_25px_-5px_rgba(0,0,0,0.2)] hover:bg-black",
    secondary: "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 shadow-sm",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
    ghost: "bg-transparent text-zinc-400 hover:text-zinc-900 px-0 h-auto"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const FloatingInput = React.forwardRef(({ label, error, className = "", ...props }, ref) => (
  <div className={`relative w-full ${className}`}>
    <input
      ref={ref} placeholder=" "
      className={`peer w-full rounded-2xl border bg-white px-5 py-4 text-sm font-medium text-zinc-900 outline-none transition-all duration-300 placeholder-transparent
        ${error ? "border-red-300 focus:border-red-500 bg-red-50/10" : "border-zinc-200 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-50"}`}
      {...props}
    />
    <label className="absolute left-5 -top-2.5 bg-white px-2 text-xs font-bold text-zinc-400 transition-all duration-300 pointer-events-none rounded-md
      peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal
      peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-zinc-900 peer-focus:font-bold">
      {label}
    </label>
    {error && <p className="text-xs text-red-500 mt-1.5 ml-2 font-medium">{error}</p>}
  </div>
));

const FloatingDropdown = ({ label, value, onChange, options = [] }) => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative w-full" ref={boxRef}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="peer w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm text-left cursor-pointer outline-none transition-all duration-300 focus:border-zinc-900 flex justify-between items-center">
        <span className={`font-medium ${!value ? "text-zinc-400" : "text-zinc-900"}`}>{value || "Select..."}</span>
        <ChevronDown size={16} className={`text-zinc-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <label className="absolute left-5 -top-2.5 bg-white px-2 text-xs font-bold text-zinc-400 pointer-events-none rounded-md">{label}</label>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-30 mt-2 w-full bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden py-1 max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <li key={opt} onClick={() => { onChange(opt); setOpen(false); }} className={`px-5 py-3 text-sm font-medium cursor-pointer transition-colors ${value === opt ? "bg-zinc-50 text-black font-bold" : "hover:bg-zinc-50 text-zinc-600"}`}>
                {opt}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ========================================================================
   SUB-COMPONENTS
   ======================================================================== */

// 1. Sidebar (Cleaned up)
const Sidebar = ({ user, activeTab, setActiveTab, onSignOut }) => {
  const menu = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'wallet', label: 'Aura Circle', icon: Coins },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'offers', label: 'Coupons', icon: Ticket },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'reviews', label: 'My Reviews', icon: Star },
    { id: 'support', label: 'Support Chat', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: UserIcon },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'earncash', label: 'Earn Cash', icon: Coins }, // 🟢 Add this
  ];

  const initials = (user?.name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const avatarBg = getDeterministicColor(user?.email || "user");

  return (
    <div className="bg-white lg:rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] border border-zinc-100 overflow-hidden sticky top-[80px] z-30">

      {/* Header Section */}
      <div className="p-6 lg:p-8 border-b border-zinc-50 flex flex-row lg:flex-col items-center gap-4 lg:gap-0 lg:text-center transition-all">
        <div className="w-14 h-14 lg:w-24 lg:h-24 lg:mx-auto rounded-full p-1.5 border border-zinc-100 lg:mb-4 overflow-hidden relative shrink-0">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="User" className="w-full h-full rounded-full object-cover bg-zinc-50" />
          ) : (
            <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xl lg:text-2xl ${avatarBg}`}>{initials}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base lg:text-lg font-bold text-zinc-900 truncate">{user?.name}</h2>
          <p className="text-xs text-zinc-400 truncate font-medium">{user?.email}</p>
        </div>
      </div>

      {/* Menu Section */}
      <div className="flex lg:flex-col overflow-x-auto scrollbar-hide p-2 lg:p-4 space-x-1 lg:space-x-0 lg:space-y-1 bg-white relative">
        {menu.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 w-auto lg:w-full flex items-center gap-2 lg:gap-3 px-4 py-2.5 lg:py-3.5 rounded-full lg:rounded-2xl text-sm font-medium transition-colors relative z-10 
              ${isActive ? "text-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-zinc-900 rounded-full lg:rounded-2xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className="relative z-10" />
              <span className="whitespace-nowrap relative z-10">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Desktop Footer */}
      <div className="hidden lg:block p-4 border-t border-zinc-50">
        <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
};

// 2. Profile Strength (Clean)
const ProfileCompletion = ({ user, addressCount }) => {
  const items = useMemo(() => [
    { label: "Profile photo", completed: !!user.profileImage },
    { label: "Phone number", completed: !!user.phone },
    { label: "Date of birth", completed: !!user.dob },
    { label: "Gender", completed: !!user.gender },
    { label: "Delivery address", completed: addressCount > 0 },
  ], [user, addressCount]);
  const percentage = Math.round((items.filter(i => i.completed).length / items.length) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-4">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Completion</p>
          <h4 className="font-medium text-3xl text-zinc-900 tracking-tight">{percentage}%</h4>
        </div>
        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-zinc-50 border border-zinc-100">
          {percentage === 100 ? <CheckCircle className="text-teal-500" size={20} /> : <UserCog className="text-zinc-400" size={20} />}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-50 rounded-full h-1.5 overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${percentage === 100 ? 'bg-teal-500' : 'bg-zinc-900'}`}
        />
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((i, idx) => (
          <div key={idx} className="flex items-center gap-3 group">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${i.completed ? 'bg-teal-50 border-teal-100 text-teal-600' : 'bg-white border-zinc-200 text-zinc-300'}`}>
              {i.completed ? <CheckCircle size={10} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />}
            </div>
            <span className={`text-sm font-light transition-colors ${i.completed ? 'text-zinc-700' : 'text-zinc-400 group-hover:text-zinc-600'}`}>
              {i.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Advanced Activity Log
const AdvancedActivityLog = ({ orders, tickets, reviews, securityLogs, onNavigate, role, title = "Activity Log" }) => {
  const [filter, setFilter] = useState("all");

  const activityItems = useMemo(() => {
    let items = [];
    const UPDATE_THRESHOLD = 60 * 60 * 1000;

    // 1. Process Orders
    (orders || []).forEach(o => {
      items.push({
        id: `ord-cr-${o.id}`, type: 'order_created', date: new Date(o.createdAt),
        title: `Order Placed`, subtitle: `#${o.id.slice(-6).toUpperCase()} • ₹${o.totalAmount}`,
        data: o, icon: ShoppingBag, color: 'text-zinc-600 bg-zinc-50 border-zinc-100', actionable: true
      });

      if (new Date(o.updatedAt) > new Date(o.createdAt).getTime() + UPDATE_THRESHOLD) {
        let statusTitle = `Order ${o.status}`;
        let icon = Package;
        let color = 'text-blue-600 bg-blue-50 border-blue-100';
        if (o.status.toLowerCase() === 'delivered') { statusTitle = "Delivered"; icon = CheckCircle; color = 'text-teal-600 bg-teal-50 border-teal-100'; }
        else if (o.status.toLowerCase().includes('cancel')) { statusTitle = "Cancelled"; icon = X; color = 'text-red-600 bg-red-50 border-red-100'; }
        items.push({
          id: `ord-up-${o.id}`, type: 'order_updated', date: new Date(o.updatedAt),
          title: statusTitle, subtitle: `#${o.id.slice(-6).toUpperCase()}`,
          data: o, icon: icon, color: color, actionable: true
        });
      }
    });

    // 2. Process Tickets
    (tickets || []).forEach(t => {
      items.push({
        id: `tkt-${t.id}`, type: 'ticket', date: new Date(t.createdAt),
        title: `Ticket ${t.status === 'open' ? 'Opened' : 'Updated'}`, subtitle: t.subject,
        data: t, icon: Headphones, color: 'text-amber-600 bg-amber-50 border-amber-100', actionable: true
      });
    });

    // 3. Process Reviews
    (reviews || []).forEach(r => {
      items.push({
        id: `rev-${r.id}`, type: 'review', date: new Date(r.createdAt),
        title: "Review Added", subtitle: "Tap to view",
        data: r, icon: Star, color: 'text-zinc-600 bg-zinc-50 border-zinc-100', actionable: true
      });
    });

    // 4. Logs
    (securityLogs || []).forEach(log => {
      let title = "System Update";
      let icon = UserCog;
      let color = 'text-zinc-400 bg-zinc-50 border-zinc-100';
      switch (log.action) {
        case 'ADMIN_UPDATE': case 'PROFILE_UPDATE': title = "Profile Updated"; icon = ShieldAlert; break;
        case 'ACCOUNT_CREATED': title = "Account Created"; icon = UserIcon; break;
        case 'LOGIN': title = "Logged In"; icon = Lock; break;
        default: title = log.action ? log.action.replace(/_/g, ' ') : "System Log"; break;
      }
      items.push({
        id: log.id || `sys-${Math.random()}`, type: 'security', date: new Date(log.createdAt),
        title: title, subtitle: log.description || "System event", data: log, icon: icon, color: color, actionable: false
      });
    });

    return items.sort((a, b) => b.date - a.date);
  }, [orders, tickets, reviews, securityLogs]);

  const filteredItems = filter === 'all'
    ? activityItems
    : activityItems.filter(i => i.type.includes(filter) || (filter === 'security' && i.type === 'security'));

  const grouped = filteredItems.reduce((acc, item) => {
    const d = item.date;
    const key = d.toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' :
      d.toLocaleDateString() === new Date(Date.now() - 86400000).toLocaleDateString() ? 'Yesterday' :
        d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] border border-zinc-100 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-zinc-900 flex items-center gap-2"><Clock size={16} /> {title}</h3>
        <div className="flex gap-1">
          {['all', 'order', 'ticket', 'security'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`p-1.5 rounded-lg transition-colors ${filter === f ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-400'}`}>
              {f === 'all' && <Clock size={14} />}
              {f === 'order' && <ShoppingBag size={14} />}
              {f === 'ticket' && <Ticket size={14} />}
              {f === 'security' && <UserCog size={14} />}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 pr-2 -mr-2 space-y-6 h-[500px]">
        {Object.keys(grouped).length === 0 && <p className="text-center text-zinc-400 text-sm py-10 font-light">No recent activity.</p>}

        {Object.entries(grouped).map(([label, groupItems]) => (
          <div key={label}>
            <div className="sticky top-0 bg-white z-20 py-1 mb-2 border-b border-zinc-50">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
            </div>
            <div className="space-y-3 relative ml-2">
              <div className="absolute top-2 bottom-2 left-[15px] w-[1px] bg-zinc-100 z-0"></div>
              {groupItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.actionable && onNavigate(item)}
                  className={`relative z-10 flex items-center gap-3 p-2 rounded-xl transition-colors ${item.actionable ? 'group cursor-pointer hover:bg-zinc-50' : 'cursor-default'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0 ${item.color}`}>
                    <item.icon size={12} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-medium text-zinc-800 leading-none transition-colors ${item.actionable ? 'group-hover:text-zinc-900' : ''}`}>{item.title}</p>
                      <span className="text-[9px] text-zinc-400 whitespace-nowrap ml-2">
                        {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 truncate font-light">{item.subtitle}</p>
                  </div>
                  {item.actionable && <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-500" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. Offers Component (Polished)
const UserOffers = ({ userId }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (userId) {
      fetch(`${BASE}/api/coupons/available?userId=${userId}`)
        .then(res => res.json()).then(data => setOffers(Array.isArray(data) ? data : []))
        .catch(err => console.error(err)).finally(() => setLoading(false));
    }
  }, [userId]);

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    if (window.toast) window.toast.success("Code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="text-center py-20"><Loader2 className="animate-spin inline text-zinc-300" /></div>;
  if (offers.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] border border-zinc-100">
      <Ticket className="w-12 h-12 text-zinc-200 mb-4" strokeWidth={1} />
      <p className="text-zinc-400 font-light">No coupons available right now.</p>
    </div>
  );

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {offers.map(offer => {
        const isCopied = copiedId === offer.id;
        return (
          <motion.div variants={fadeInUp} key={offer.id} className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] flex justify-between items-center group hover:border-zinc-200 transition-all">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest">{offer.code}</span>
                {offer.isAutomatic && <span className="text-[10px] text-teal-600 font-medium">Auto-Applied</span>}
              </div>
              <h3 className="text-2xl font-medium text-zinc-900">{offer.discountValue}{offer.discountType === 'percent' ? '%' : '₹'} OFF</h3>
              <p className="text-xs text-zinc-500 mt-1 font-light max-w-[200px]">{offer.description}</p>
            </div>
            <Button onClick={() => handleCopy(offer.code, offer.id)} variant={isCopied ? "primary" : "secondary"} size="sm" className="shrink-0">
              {isCopied ? "Copied" : "Copy"}
            </Button>
          </motion.div>
        )
      })}
    </motion.div>
  );
};

// 5. Notifications Settings
const NotificationSettings = ({ user, onUpdate }) => {
  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      notify_order_updates: user.notify_order_updates ?? true,
      notify_promos: user.notify_promos ?? true,
      notify_pincode: user.notify_pincode ?? true
    }
  });

  const onSubmit = async (data) => {
    const ok = await onUpdate(data);
    if (ok) window.toast.success("Preferences Saved");
  };

  const SettingRow = ({ label, desc, ...props }) => (
    <label className="flex items-center justify-between p-6 bg-white border border-zinc-100 rounded-3xl cursor-pointer hover:border-zinc-300 transition-all gap-4 shadow-sm group">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-zinc-900">{label}</p>
        <p className="text-xs text-zinc-500 mt-1 font-light">{desc}</p>
      </div>
      <div className="relative flex-shrink-0">
        <input type="checkbox" className="sr-only peer" {...props} />
        <div className="w-11 h-6 bg-zinc-200 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
      </div>
    </label>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <h2 className="text-xl font-medium tracking-tight mb-6">Notification Preferences</h2>
      <SettingRow label="Order Updates" desc="Get notified about shipping and delivery status." {...register("notify_order_updates")} />
      <SettingRow label="Promotions & Deals" desc="Receive updates on new coupons and sales." {...register("notify_promos")} />
      <SettingRow label="Service Alerts" desc="Important updates about service availability." {...register("notify_pincode")} />
      <Button type="submit" disabled={!isDirty} variant="primary" className="mt-4">Save Preferences</Button>
    </form>
  );
};

/* ========================================================================
   7. REVIEWS TAB CONTENT
   ======================================================================== */
const ReviewHistory = () => {
  const { userReviews, loadingReviews } = useContext(ReviewContext);
  const { products } = useContext(ProductContext);
  const navigate = useNavigate();
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      {loadingReviews && <p className="text-center text-zinc-400 py-10 font-light">Loading reviews...</p>}
      {!loadingReviews && (!userReviews || userReviews.length === 0) && <p className="text-center text-zinc-400 py-10 font-light">No reviews written yet.</p>}
      {(userReviews || []).map(review => {
        const product = productMap.get(review.productId);
        return (
          <motion.div key={review.id} variants={fadeInUp} className="bg-white p-6 rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] border border-zinc-100 flex gap-6 items-start">
            <img src={product?.imageurl?.[0]} className="w-16 h-16 rounded-2xl object-cover bg-zinc-50 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="min-w-0">
                  <h4 className="font-medium text-zinc-900 text-sm truncate">{product?.name}</h4>
                  <div className="flex gap-0.5 mt-1">{[...Array(5)].map((_, i) => <Star key={i} size={12} className={i < review.rating ? "text-zinc-900 fill-zinc-900" : "text-zinc-200 fill-zinc-200"} />)}</div>
                </div>
                <button onClick={() => navigate(`/product/${review.productId}`, { state: { editReviewId: review.id } })} className="text-zinc-400 hover:text-zinc-900 transition-colors"><Pencil size={14} /></button>
              </div>
              <p className="text-sm text-zinc-600 mt-3 leading-relaxed break-words font-light">{review.comment}</p>
              <p className="text-[10px] text-zinc-400 mt-2">{formatDate(review.createdAt)}</p>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  );
};


/* ========================================================================
   ANIMATION VARIANTS
   ======================================================================== */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

/* ========================================================================
   1. THE GOLDEN REFERRAL CARD (Luxury Dark Mode)
   ======================================================================== */
const ReferralCard = ({ code, onCopy, rewards }) => {
  const refereeBonus = rewards?.REFEREE_BONUS || 100;
  const referrerBonus = rewards?.REFERRER_BONUS || 150;

  const handleShare = () => {
    const text = `✨ Discover Devid Aura. Use my code *${code}* to get ₹${refereeBonus} OFF your first luxury perfume order. Experience it here: https://devidaura.com`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 p-8 md:p-12 text-center text-white shadow-2xl isolate">
      {/* Background Decor (Abstract Gold/Teal Glow) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-50%] left-[-20%] w-[600px] h-[600px] bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-50%] right-[-20%] w-[600px] h-[600px] bg-gradient-to-tl from-indigo-900/40 to-transparent rounded-full blur-[120px] opacity-60" />
      </div>

      <div className="flex flex-col items-center relative z-10">
        {/* Floating Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 rounded-3xl flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(251,191,36,0.4)] mb-8 rotate-3 border border-white/20">
          <Gift size={40} className="text-zinc-900 drop-shadow-sm" strokeWidth={1.5} />
        </div>

        <h2 className="text-4xl md:text-5xl font-serif tracking-tight mb-4 leading-tight">
          Invite Friends. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500">Earn Pure Gold.</span>
        </h2>
        
        <p className="text-zinc-400 font-light max-w-xl mx-auto mb-10 text-sm md:text-base leading-relaxed">
          Gift your circle <span className="text-white font-medium border-b border-white/20">₹{refereeBonus} OFF</span> their first signature scent. 
          You receive <span className="text-amber-400 font-medium border-b border-amber-400/20">₹{referrerBonus} Credits</span> instantly when they purchase.
        </p>

        {/* Action Area */}
        <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full max-w-lg">
          {/* Code Box */}
          <div className="flex-1 flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 p-2 pl-6 rounded-2xl group hover:bg-white/10 transition-colors">
            <div className="flex-1 text-left">
               <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Your Code</p>
               <span className="font-mono text-xl tracking-widest text-amber-100 font-bold uppercase truncate">
                 {code || "..."}
               </span>
            </div>
            <button 
              onClick={() => onCopy(code)} 
              className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg" 
              title="Copy Code"
            >
              <Copy size={20} />
            </button>
          </div>

          {/* Share Button */}
          <button 
            onClick={handleShare} 
            className="px-8 py-4 bg-[#25D366] text-white rounded-2xl font-bold text-sm hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 active:scale-95"
          >
            <Send size={18} /> 
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================
   2. REDEEM CARD (Clean & Minimal)
   ======================================================================== */
const RedeemCard = ({ userId, onRedeemSuccess }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/referrals/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: code.toUpperCase() })
      });
      const data = await res.json();

      if (res.ok) {
        window.toast.success(data.message);
        setCode("");
        if (onRedeemSuccess) onRedeemSuccess();
      } else {
        window.toast.error(data.error || "Invalid Code");
      }
    } catch (err) {
      window.toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] mt-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-bl-[100%] -z-0 transition-transform group-hover:scale-110" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-zinc-900 text-white rounded-lg">
                <Ticket size={18} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Have a Code?</h3>
        </div>
        <p className="text-sm text-zinc-500 font-light mb-6 ml-1">Unlock your <strong className="text-zinc-900">Welcome Bonus</strong> instantly.</p>

        <div className="flex gap-3">
          <div className="relative flex-1">
             <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder=" "
                className="peer w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 uppercase tracking-widest font-bold transition-all pt-6 pb-2"
              />
              <label className="absolute left-5 top-4 text-xs font-bold text-zinc-400 uppercase tracking-wider transition-all peer-focus:top-1.5 peer-focus:text-[9px] peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:text-[9px]">
                  Enter Referral Code
              </label>
          </div>
          <button 
             onClick={handleRedeem} 
             disabled={loading || !code} 
             className="px-8 rounded-2xl bg-zinc-900 text-white font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Redeem"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================
   3. WALLET STATS (Glassy/Premium Look)
   ======================================================================== */
const WalletStats = ({ balance, earnings, friendsCount, pendingCount }) => {
  const StatItem = ({ icon: Icon, label, value, subtext, colorClass, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex flex-col justify-between group hover:border-zinc-300 transition-all hover:shadow-lg relative overflow-hidden"
    >
       <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClass} opacity-[0.08] rounded-bl-[3rem] transition-transform group-hover:scale-125`} />
       
       <div className="flex justify-between items-start relative z-10">
         <div className="p-3 bg-zinc-50 text-zinc-900 rounded-2xl border border-zinc-100 group-hover:bg-white group-hover:shadow-md transition-all">
           <Icon size={24} strokeWidth={1.5} />
         </div>
         {subtext && <span className="px-2 py-1 bg-zinc-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">{subtext}</span>}
       </div>
       
       <div className="mt-6 relative z-10">
         <h4 className="text-4xl font-serif font-medium text-zinc-900 tracking-tight">{value}</h4>
         <p className="text-xs text-zinc-500 mt-1 font-medium uppercase tracking-wide opacity-60">{label}</p>
       </div>
    </motion.div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
      <StatItem 
        icon={Coins} 
        label="Wallet Balance" 
        value={`₹${balance}`} 
        subtext="Available"
        colorClass="from-amber-400 to-yellow-600"
        delay={0.1}
      />
      <StatItem 
        icon={TrendingUp} 
        label="Total Earnings" 
        value={`₹${earnings}`} 
        colorClass="from-emerald-400 to-teal-600"
        delay={0.2}
      />
      <StatItem 
        icon={Users} 
        label="Network" 
        value={
          <div className="flex items-baseline gap-2">
            {friendsCount}
            {pendingCount > 0 && <span className="text-sm font-sans text-amber-500 font-bold">({pendingCount} Pending)</span>}
          </div>
        } 
        colorClass="from-indigo-400 to-purple-600"
        delay={0.3}
      />
    </div>
  );
};

/* ========================================================================
   4. WALLET HISTORY (Clean Table)
   ======================================================================== */
const WalletHistory = ({ transactions }) => {
  return (
    <div className="mt-8 bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl overflow-hidden">
      <div className="p-8 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/30">
        <div>
           <h3 className="font-serif text-xl text-zinc-900">Transaction History</h3>
           <p className="text-xs text-zinc-400 mt-1 font-light">Your recent rewards and usage.</p>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
        {transactions && transactions.length > 0 ? (
          transactions.map((tx, i) => {
            const isPending = tx.type === 'pending_referral';
            let iconBg = tx.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600';
            let Icon = tx.amount > 0 ? ArrowDownLeft : ArrowUpRight;
            let amountColor = tx.amount > 0 ? 'text-emerald-600' : 'text-zinc-900';

            if (isPending) {
              iconBg = 'bg-amber-50 text-amber-600';
              Icon = Clock;
              amountColor = 'text-amber-500';
            }

            return (
              <motion.div 
                key={tx.id} 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-6 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 group"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg} transition-transform group-hover:scale-110`}>
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 text-sm">{tx.description}</p>
                    <p className="text-xs text-zinc-400 mt-1 font-mono">
                      {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {isPending && <span className="ml-2 text-amber-500 font-bold text-[10px] uppercase tracking-wide">• Waiting for Order</span>}
                    </p>
                  </div>
                </div>
                <span className={`font-mono font-bold text-lg ${amountColor}`}>
                  {isPending ? 'Pending' : (tx.amount > 0 ? `+₹${Math.abs(tx.amount)}` : `-₹${Math.abs(tx.amount)}`)}
                </span>
              </motion.div>
            );
          })
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 text-zinc-300">
               <Coins size={24} />
            </div>
            <p className="text-zinc-400 text-sm font-light">No transactions yet. Start referring!</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ========================================================================
   MAIN TAB EXPORT
   ======================================================================== */
const ReferralTab = ({ userId }) => {
  const [data, setData] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      
      const statsPromise = fetch(`${BASE}/api/referrals/stats/${userId}`).then(res => {
        if (!res.ok) throw new Error("Stats Failed");
        return res.json();
      });

      const configPromise = fetch(`${BASE}/api/referrals/config`).then(res => res.json());

      Promise.all([statsPromise, configPromise])
        .then(([statsData, configData]) => {
          setData(statsData);
          setRewards(configData);
          setLoading(false);
        })
        .catch(e => {
          console.error(e);
          setError(true);
          setLoading(false);
        });
    }
  }, [userId]);

  const handleCopy = (txt) => {
    navigator.clipboard.writeText(txt);
    if(window.toast) window.toast.success("Referral Code Copied!");
  };

  if (loading) return <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-zinc-300 w-8 h-8" /></div>;
  if (error) return <div className="py-32 text-center text-red-500 font-light">Failed to load data. Please refresh.</div>;

  const hasBeenReferred = data?.history?.some(t => t.description.toLowerCase().includes("welcome bonus"));

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="max-w-5xl mx-auto pb-10"
    >
      <motion.div variants={itemVariants}>
        <ReferralCard code={data?.referralCode} onCopy={handleCopy} rewards={rewards} />
      </motion.div>

      {!hasBeenReferred && (
        <motion.div variants={itemVariants}>
          <RedeemCard userId={userId} onRedeemSuccess={() => window.location.reload()} />
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <WalletStats
          balance={data?.walletBalance || 0}
          earnings={data?.stats?.totalEarnings || 0}
          friendsCount={data?.stats?.successfulReferrals || 0}
          pendingCount={data?.stats?.pendingReferrals || 0}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <WalletHistory transactions={data?.history} />
      </motion.div>
    </motion.div>
  );
}
/* ========================================================================
   MAIN PAGE
   ======================================================================== */
export default function UserPage() {
  const { userdetails, updateUser, address, deleteAddress, setDefaultAddress, addAddress, editAddress } = useContext(UserContext);
  const { orders, loadingOrders } = useContext(OrderContext);
  const { cart, wishlist } = useContext(CartContext);
  const { tickets, getUserTickets, replyToTicket } = useContext(ContactContext);
  const { userReviews } = useContext(ReviewContext);
  const { products } = useContext(ProductContext);
  const { signOut } = useClerk();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [editingAddress, setEditingAddress] = useState(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [ticketRefreshing, setTicketRefreshing] = useState(false);
  const [personalLogs, setPersonalLogs] = useState([]);

  // Helper Maps
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  useEffect(() => {
    if (userdetails?.email) {
      getUserTickets(userdetails.email);
      if (userdetails.id) {
        fetch(`${BASE}/api/users/${userdetails.id}/logs`)
          .then(res => res.json())
          .then(data => setPersonalLogs(Array.isArray(data) ? data : []))
          .catch(err => console.error("Failed to fetch logs", err));
      }
    }
  }, [userdetails, getUserTickets]);

  const handleNavigateActivity = (item) => {
    if (item.type.includes('order')) {
      setActiveTab('orders');
      setViewOrder(item.data);
    } else if (item.type === 'ticket') {
      setActiveTab('support');
      setSelectedTicket(item.data);
    } else if (item.type === 'review') {
      setActiveTab('reviews');
    }
  };

  const handleAddressSubmit = async (data) => {
    try {
      if (editingAddress) await editAddress(editingAddress.id, data);
      else await addAddress(data);
      setIsAddingAddress(false); setEditingAddress(null);
      window.toast.success("Address saved successfully");
    } catch (e) { window.toast.error("Failed to save address"); }
  };

  const handleTicketReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      await replyToTicket(selectedTicket.id, replyText, 'user');
      setReplyText("");
      setSelectedTicket(prev => ({ ...prev, messages: [...prev.messages, { message: replyText, senderRole: 'user', createdAt: new Date().toISOString() }] }));
      await getUserTickets(userdetails.email);
    } catch (e) { window.toast.error("Message failed to send"); }
  };

  const refreshTickets = async () => {
    setTicketRefreshing(true);
    await getUserTickets(userdetails.email);
    setTimeout(() => setTicketRefreshing(false), 500);
  };

  if (!userdetails) return <div className="h-screen flex items-center justify-center bg-[#FDFDFD]"><Loader2 className="w-8 h-8 animate-spin text-zinc-300" /></div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] pt-14 sm:pt-20 pb-20 px-4 text-zinc-900 selection:bg-zinc-100">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT SIDEBAR (Sticky) */}
        <div className="lg:col-span-3 sticky top-24 z-40">
          <Sidebar user={userdetails} activeTab={activeTab} setActiveTab={setActiveTab} onSignOut={() => signOut({ redirectUrl: "/" })} />
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={smoothTransition}
            >
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                  {/* LEFT COLUMN: Main Dashboard */}
                  <div className="xl:col-span-2 space-y-8">

                    {/* 1. Hero / Welcome Card - Clean Light Version */}
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-8 md:p-10 border border-zinc-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
                      <div className="relative z-10 flex flex-col items-start gap-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-50 border border-zinc-100 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
                          </span>
                          Dashboard
                        </div>

                        <h2 className="text-4xl font-medium text-zinc-900 tracking-tight">
                          Hello, {userdetails.name.split(" ")[0]}
                        </h2>
                        <p className="text-zinc-500 font-light max-w-md">
                          Welcome back to your personal dashboard. Manage your orders, update your preferences, and explore exclusive offers.
                        </p>
                      </div>
                      <div className="mt-8 flex gap-4">
                        <Button onClick={() => setActiveTab('offers')} variant="secondary">View Coupons</Button>
                        <Button onClick={() => navigate('/')} variant="primary">Start Shopping</Button>
                      </div>
                    </div>

                    {/* 2. Stats & Profile Split */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-4 flex flex-col gap-5">
                        <motion.div whileHover={{ y: -2 }} onClick={() => setActiveTab('orders')} className="flex-1 bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] cursor-pointer group">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-50 text-zinc-900 flex items-center justify-center mb-4 border border-zinc-100">
                            <Package size={20} strokeWidth={1.5} />
                          </div>
                          <div>
                            <span className="text-3xl font-medium text-zinc-900 tracking-tight">{orders?.length || 0}</span>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Total Orders</p>
                          </div>
                        </motion.div>

                        <div className="grid grid-cols-2 gap-5">
                          <motion.div whileHover={{ y: -2 }} onClick={() => navigate('/cart')} className="bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] cursor-pointer group">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                              <ShoppingBag size={18} strokeWidth={2} />
                            </div>
                            <span className="text-xl font-medium text-zinc-900">{cart?.length || 0}</span>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5">Cart</p>
                          </motion.div>

                          <motion.div whileHover={{ y: -2 }} onClick={() => navigate('/wishlist')} className="bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] cursor-pointer group">
                            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-3">
                              <Heart size={18} strokeWidth={2} />
                            </div>
                            <span className="text-xl font-medium text-zinc-900">{wishlist?.length || 0}</span>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5">Saved</p>
                          </motion.div>
                        </div>
                      </div>

                      {/* Right: Profile Widget */}
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:col-span-8 bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-8">
                          <div>
                            <h3 className="font-medium text-zinc-900 text-xl tracking-tight mb-1">Profile Health</h3>
                            <p className="text-xs text-zinc-500 font-light">Complete your account to unlock exclusive offers.</p>
                          </div>
                          <Button onClick={() => setActiveTab('settings')} variant="secondary" size="sm">Edit</Button>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <ProfileCompletion user={userdetails} addressCount={address?.length || 0} />
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Activity Feed */}
                  <div className="xl:col-span-1 h-full min-h-[500px]">
                    <AdvancedActivityLog orders={orders} tickets={tickets} reviews={userReviews} securityLogs={personalLogs} onNavigate={handleNavigateActivity} role={userdetails.role} title="Activity" />
                  </div>
                </div>
              )}
              {activeTab === 'wallet' && (
                <ReferralTab userId={userdetails.id} />
              )}

              {activeTab === 'orders' && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
                    <div>
                      <h2 className="text-3xl font-medium text-zinc-900 tracking-tight">Order History</h2>
                      <p className="text-zinc-500 font-light text-sm mt-1">Track and manage your recent purchases.</p>
                    </div>
                  </div>

                  {loadingOrders ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-300" /></div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[2rem] border border-zinc-100 shadow-sm">
                      <ShoppingBag className="mx-auto text-zinc-200 mb-4" size={32} strokeWidth={1} />
                      <h3 className="text-lg font-medium text-zinc-900">No orders yet</h3>
                      <p className="text-zinc-400 font-light text-sm mt-1">Start your collection today.</p>
                    </div>
                  ) : (
                    <div className="grid gap-5">
                      {orders.map((order) => {
                        const previewImages = order.orderItems.slice(0, 4).map((item) => {
                          const prod = productMap.get(item.productId);
                          return prod?.imageurl?.[0] || item.img;
                        });
                        const remaining = order.orderItems.length - 4;
                        const isDelivered = order.status.toLowerCase() === 'delivered';

                        let statusColor = "bg-zinc-100 text-zinc-600";
                        if (isDelivered) statusColor = "bg-teal-50 text-teal-700 border border-teal-100";
                        else if (order.status.toLowerCase().includes('cancel')) statusColor = "bg-red-50 text-red-700 border border-red-100";

                        return (
                          <motion.div key={order.id} layoutId={order.id} variants={fadeInUp} initial="hidden" animate="visible" onClick={() => setViewOrder(order)}
                            className="group relative bg-white rounded-[2rem] p-6 cursor-pointer transition-all duration-300 border border-zinc-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-0.5"
                          >
                            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                              <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusColor}`}>{order.status}</span>
                                  <span className="text-xs text-zinc-400 font-light border-l border-zinc-200 pl-3">{formatDate(order.createdAt)}</span>
                                  <span className="text-xs text-zinc-400 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {previewImages.map((img, idx) => (
                                    <div key={idx} className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 p-1">
                                      <img src={img} className="w-full h-full object-contain mix-blend-multiply" />
                                    </div>
                                  ))}
                                  {remaining > 0 && <div className="w-12 h-12 rounded-xl border border-zinc-100 bg-zinc-50 flex items-center justify-center text-xs font-bold text-zinc-400">+{remaining}</div>}
                                </div>
                              </div>
                              <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 border-zinc-50 pt-4 md:pt-0">
                                <div className="md:text-right">
                                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Total</p>
                                  <p className="text-lg font-medium text-zinc-900">₹{order.totalAmount}</p>
                                </div>
                                <Button variant="secondary" size="sm" className="h-8 text-xs">View Details</Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'addresses' && (
                !isAddingAddress && !editingAddress ?
                  <AddressManager address={address} onAdd={() => setIsAddingAddress(true)} onEdit={setEditingAddress} onDelete={deleteAddress} onSetDefault={setDefaultAddress} />
                  : <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
                    <h3 className="text-xl font-medium mb-6 text-zinc-900">{editingAddress ? "Edit Address" : "New Address"}</h3>
                    <AddressFormWrapper initialData={editingAddress} onCancel={() => { setIsAddingAddress(false); setEditingAddress(null); }} onSubmit={handleAddressSubmit} />
                  </div>
              )}

              {activeTab === 'offers' && <div className="space-y-6"><h2 className="text-3xl font-medium text-zinc-900 tracking-tight">Your Coupons</h2><UserOffers userId={userdetails.id} /></div>}
              {activeTab === 'settings' && <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]"><ProfileSettingsWrapper user={userdetails} onUpdate={updateUser} /></div>}
              {activeTab === 'reviews' && <div className="space-y-6"><h2 className="text-3xl font-medium text-zinc-900 tracking-tight">My Reviews</h2><ReviewHistory /></div>}

              {activeTab === 'support' && (
                <div className="flex h-[600px] bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
                  <div className={`w-full md:w-80 border-r border-zinc-100 flex flex-col bg-white z-10 ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-5 border-b border-zinc-50 flex justify-between items-center">
                      <h3 className="font-bold text-zinc-900">Inbox</h3>
                      <div className="flex gap-1">
                        <button onClick={refreshTickets} className={`p-2 hover:bg-zinc-50 rounded-xl text-zinc-400 ${ticketRefreshing ? 'animate-spin text-zinc-900' : ''}`}><RefreshCw size={14} /></button>
                        <button onClick={() => navigate('/contact')} className="p-2 hover:bg-zinc-50 rounded-xl text-zinc-400 hover:text-zinc-900"><Plus size={16} /></button>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                      {tickets.length === 0 && <p className="text-center text-xs text-zinc-400 mt-10 font-light">No tickets found.</p>}
                      {tickets.map(t => (
                        <div key={t.id} onClick={() => setSelectedTicket(t)} className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedTicket?.id === t.id ? 'bg-zinc-50 border-zinc-200 shadow-sm' : 'border-transparent hover:bg-zinc-50'}`}>
                          <div className="flex justify-between mb-1"><span className="font-bold text-sm text-zinc-900 truncate">{t.subject}</span><span className="text-[10px] text-zinc-400">{new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
                          <p className="text-xs text-zinc-500 truncate font-light opacity-80">{t.messages[t.messages.length - 1]?.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={`flex-1 flex flex-col bg-[#FAFAFA] relative ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                    {selectedTicket ? (
                      <>
                        <div className="h-16 px-6 border-b border-zinc-100 bg-white flex justify-between items-center z-10">
                          <div>
                            <h3 className="font-bold text-zinc-900 text-sm truncate max-w-[200px]">{selectedTicket.subject}</h3>
                            <p className="text-[10px] text-zinc-400 font-mono">ID: {selectedTicket.id}</p>
                          </div>
                          <button onClick={() => setSelectedTicket(null)} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900" title="Close"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          {selectedTicket.messages.map((m, i) => (
                            <div key={i} className={`flex ${m.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${m.senderRole === 'user' ? 'bg-zinc-900 text-white rounded-br-sm' : 'bg-white border border-zinc-100 text-zinc-800 rounded-bl-sm'}`}>
                                {m.message}
                              </div>
                            </div>
                          ))}
                        </div>
                        {selectedTicket.status === 'open' ? (
                          <div className="p-4 bg-white border-t border-zinc-100 flex gap-3">
                            <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTicketReply()} placeholder="Type reply..." className="flex-1 bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-1 focus:ring-zinc-900 transition-all" />
                            <Button onClick={handleTicketReply} disabled={!replyText.trim()} variant="primary" size="icon" className="rounded-2xl"><Send size={18} /></Button>
                          </div>
                        ) : <div className="p-4 text-center text-xs text-zinc-400 bg-zinc-50 border-t border-zinc-100 font-bold flex items-center justify-center gap-2"><Lock size={12} /> Ticket Closed</div>}
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-zinc-300">
                        <MessageSquare className="w-12 h-12 mb-2 opacity-20" strokeWidth={1} />
                        <p className="text-sm font-light">Select a ticket to view conversation</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]"><NotificationSettings user={userdetails} onUpdate={updateUser} /></div>}
              {activeTab === 'earncash' && <EarnCashTab userId={userdetails.id} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {viewOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewOrder(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl max-h-[85vh] overflow-y-auto border border-zinc-100" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium text-zinc-900">Order Details</h3>
                <button onClick={() => setViewOrder(null)} className="p-2 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-6">
                {viewOrder.orderItems.map(item => {
                  const prod = productMap.get(item.productId);
                  return (
                    <div key={item.id} className="flex gap-4 border-b border-zinc-50 pb-4">
                      <img src={prod?.imageurl?.[0] || item.img} className="w-16 h-16 rounded-xl object-contain bg-zinc-50 p-2 mix-blend-multiply" />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-zinc-900 line-clamp-1">{item.productName}</p>
                        <p className="text-xs text-zinc-500 mt-1 font-light">Qty: {item.quantity}</p>
                        <p className="text-sm font-bold mt-1">₹{item.totalPrice}</p>
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-between pt-2 text-lg font-bold border-t border-zinc-100"><span>Total Amount</span><span>₹{viewOrder.totalAmount}</span></div>
                <div className="bg-zinc-50 p-5 rounded-2xl text-xs text-zinc-500 space-y-2 font-mono">
                  <p><span className="font-bold text-zinc-700 font-sans mr-2">Order ID:</span> {viewOrder.id}</p>
                  <p><span className="font-bold text-zinc-700 font-sans mr-2">Date:</span> {formatDate(viewOrder.createdAt)}</p>
                  <p><span className="font-bold text-zinc-700 font-sans mr-2">Status:</span> {viewOrder.status}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-FORMS ---

const ProfileSettingsWrapper = ({ user, onUpdate }) => {
  const { register, handleSubmit, control, formState: { isDirty } } = useForm({
    defaultValues: { name: user.name, phone: user.phone, dob: user.dob ? new Date(user.dob) : null, gender: user.gender }
  });
  const { uploadImage } = useCloudinary();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(user.profileImage);

  const onSubmit = async (data) => {
    try {
      await onUpdate({ ...data, dob: data.dob ? data.dob.toISOString().split('T')[0] : null });
      window.toast.success("Profile Updated");
    } catch (e) { window.toast.error("Update failed"); }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const url = await uploadImage(file);
        await onUpdate({ profileImage: url });
        setImagePreview(url);
        window.toast.success("Profile photo updated!");
      } catch (e) { window.toast.error("Upload failed."); } finally { setLoading(false); }
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-medium text-zinc-900 mb-8 tracking-tight">Profile Settings</h2>
      <div className="flex items-center gap-6 mb-10">
        <div className="relative group w-24 h-24 shrink-0">
          <div className="w-full h-full rounded-full overflow-hidden border border-zinc-200 bg-white relative">
            <img src={imagePreview || `https://ui-avatars.com/api/?name=${user.name}`} className="w-full h-full object-cover" />
            <label className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity ${loading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
              <input type="file" className="hidden" onChange={handleAvatar} disabled={loading} accept="image/*" />
            </label>
          </div>
        </div>
        <div>
          <h3 className="font-medium text-zinc-900">Profile Photo</h3>
          <p className="text-xs text-zinc-500 mb-3 font-light">Update your public avatar.</p>
          {imagePreview && !loading && (
            <button onClick={async () => { if (window.confirm("Remove?")) { await onUpdate({ profileImage: "" }); setImagePreview(null); } }} className="text-xs text-red-500 font-bold hover:underline">Remove Photo</button>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FloatingInput label="Full Name" {...register("name")} />
        <FloatingInput label="Phone" {...register("phone")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller control={control} name="dob" render={({ field }) => (
            <ReactDatePicker selected={field.value} onChange={field.onChange} customInput={<FloatingInput label="Date of Birth" />} showPopperArrow={false} />
          )} />
          <Controller control={control} name="gender" render={({ field }) => (
            <FloatingDropdown label="Gender" value={field.value} onChange={field.onChange} options={["Male", "Female", "Other"]} />
          )} />
        </div>
        <Button type="submit" disabled={!isDirty || loading} variant="primary" className="mt-4">Save Changes</Button>
      </form>
    </div>
  );
};

const AddressManager = ({ address, onAdd, onEdit, onDelete, onSetDefault }) => (
  <motion.div variants={staggerContainer} initial="hidden" animate="visible">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-3xl font-medium text-zinc-900 tracking-tight">Saved Addresses</h2>
        <p className="text-sm text-zinc-500 mt-1 font-light">Manage your shipping destinations.</p>
      </div>
      <Button onClick={onAdd} variant="primary" size="sm" className="gap-2"><Plus size={16} /> Add New</Button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {(address || []).map(addr => (
        <motion.div key={addr.id} variants={fadeInUp} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] relative group hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="px-2.5 py-1 bg-zinc-50 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-zinc-100">{addr.addressType || "Home"}</span>
            {addr.isDefault && <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-teal-100 flex items-center gap-1"><CheckCircle size={10} /> Default</span>}
          </div>
          <h4 className="font-bold text-zinc-900">{addr.name}</h4>
          <p className="text-sm text-zinc-500 mt-1 leading-relaxed font-light">{addr.address}, {addr.city}<br />{addr.state} - {addr.postalCode}</p>
          <p className="text-xs text-zinc-400 mt-3 font-mono">Ph: {addr.phone}</p>
          <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
            <button onClick={() => onEdit(addr)} className="p-2 bg-zinc-50 text-zinc-500 rounded-xl hover:bg-zinc-900 hover:text-white transition-colors"><Pencil size={14} /></button>
            <button onClick={() => onDelete(addr.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
          </div>
          {!addr.isDefault && (
            <button onClick={() => onSetDefault(addr.id)} className="mt-4 text-xs font-bold text-zinc-900 hover:underline">Set as Default</button>
          )}
        </motion.div>
      ))}
      {(address || []).length === 0 && <p className="col-span-2 text-center text-zinc-400 py-10 font-light">No addresses saved yet.</p>}
    </div>
  </motion.div>
);

const AddressFormWrapper = ({ initialData, onCancel, onSubmit }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm({ defaultValues: initialData || {} });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-xl">
      <FloatingInput label="Full Name" {...register("name", { required: "Required" })} error={errors.name?.message} />
      <div className="grid grid-cols-2 gap-4">
        <FloatingInput label="Phone" {...register("phone", { required: "Required" })} error={errors.phone?.message} />
        <Controller control={control} name="addressType" render={({ field }) => (
          <FloatingDropdown label="Type" value={field.value} onChange={field.onChange} options={["Home", "Work", "Other"]} />
        )} />
      </div>
      <FloatingInput label="Address Line 1" {...register("address", { required: "Required" })} error={errors.address?.message} />
      <div className="grid grid-cols-2 gap-4">
        <FloatingInput label="City" {...register("city", { required: "Required" })} error={errors.city?.message} />
        <FloatingInput label="State" {...register("state", { required: "Required" })} error={errors.state?.message} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FloatingInput label="Postal Code" {...register("postalCode", { required: "Required" })} error={errors.postalCode?.message} />
        <FloatingInput label="Country" {...register("country", { required: "Required" })} error={errors.country?.message} />
      </div>
      <div className="flex gap-4 pt-4">
        <Button onClick={onCancel} variant="secondary">Cancel</Button>
        <Button type="submit" variant="primary">Save Address</Button>
      </div>
    </form>
  )
};