// src/Components/UserPage.jsx
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
  Heart, ChevronLeft, ChevronDown, Loader2, Upload,
  ChevronRight, Send, Lock, RefreshCw, Clock, Headphones, Ticket, Sparkles, Copy, Layers,
  LayoutDashboard, ShieldAlert, XCircle, UserCog, Shield, AlertCircle, ShoppingCart, Calendar
} from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import useCloudinary from "../utils/useCloudinary";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from "framer-motion";

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

// Helper: Deterministic Avatar Color
const getDeterministicColor = (s) => {
  const colors = ["bg-indigo-100 text-indigo-600", "bg-amber-100 text-amber-600", "bg-lime-100 text-lime-600", "bg-pink-100 text-pink-600", "bg-blue-100 text-blue-600", "bg-yellow-100 text-yellow-600", "bg-slate-100 text-slate-600"];
  if (!s) return colors[0];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
};

/* ========================================================================
   UI COMPONENTS
   ======================================================================== */
const FloatingInput = React.forwardRef(({ label, error, className = "", ...props }, ref) => (
  <div className={`relative w-full ${className}`}>
    <input
      ref={ref} placeholder=" "
      className={`peer w-full rounded-xl border bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition-all duration-300 placeholder-transparent
        ${error ? "border-red-400 focus:border-red-500 bg-red-50/10" : "border-slate-200 focus:border-black focus:ring-4 focus:ring-slate-50"}`}
      {...props}
    />
    <label className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-bold text-slate-400 transition-all duration-300 pointer-events-none rounded-md
      peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium
      peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-black">
      {label}
    </label>
    {error && <p className="text-xs text-red-500 mt-1 ml-1 font-medium">{error}</p>}
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
      <button type="button" onClick={() => setOpen((v) => !v)} className="peer w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-left cursor-pointer outline-none transition-all duration-300 focus:border-black flex justify-between items-center">
        <span className={`font-semibold ${!value ? "text-slate-400" : "text-slate-900"}`}>{value || "Select..."}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <label className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-bold text-slate-400 pointer-events-none rounded-md">{label}</label>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-30 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-1 max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <li key={opt} onClick={() => { onChange(opt); setOpen(false); }} className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${value === opt ? "bg-slate-50 text-black font-bold" : "hover:bg-slate-50 text-slate-600"}`}>
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

// 1. Sidebar (Responsive)
const Sidebar = ({ user, activeTab, setActiveTab, onSignOut }) => {
  const menu = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'offers', label: 'Coupons', icon: Ticket },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'reviews', label: 'My Reviews', icon: Star },
    { id: 'support', label: 'Support Chat', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: UserIcon },
    { id: 'notifications', label: 'Alerts', icon: Bell },
  ];

  const initials = (user?.name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const avatarBg = getDeterministicColor(user?.email || "user");

  return (
    <div className="bg-white lg:rounded-[2rem] shadow-[0_20px_40px_rgb(0,0,0,0.03)] overflow-hidden sticky top-[60px] lg:top-24 z-30">

      {/* Header Section */}
      <div className="p-5 lg:p-8 lg:pb bg-black-6 border-b border-slate-50 flex flex-row lg:flex-col items-center gap-4 lg:gap-0 lg:text-center transition-all">
        <div className="w-14 h-14 lg:w-24 lg:h-24 lg:mx-auto rounded-full p-1 border-2 border-dashed border-slate-200 lg:mb-4 overflow-hidden relative shrink-0">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="User" className="w-full h-full rounded-full object-cover bg-slate-100" />
          ) : (
            <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xl lg:text-2xl ${avatarBg}`}>{initials}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base lg:text-lg font-bold text-slate-900 truncate">{user?.name}</h2>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Menu Section */}
      <div className="flex lg:flex-col overflow-x-auto scrollbar-hide p-2 lg:p-4 space-x-2 lg:space-x-0 lg:space-y-1 bg-white relative">
        {menu.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 w-auto lg:w-full flex items-center gap-2 lg:gap-3 px-4 py-2 lg:py-3.5 rounded-full lg:rounded-xl text-sm font-semibold transition-colors relative z-10 
              ${isActive ? "text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-black rounded-full lg:rounded-xl shadow-lg shadow-slate-400/50 -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <item.icon size={18} strokeWidth={2} className="relative z-10" />
              <span className="whitespace-nowrap relative z-10">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Desktop Footer */}
      <div className="hidden lg:block p-4 border-t border-slate-50">
        <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
};

// 2. Profile Strength (Gradient Design)
// 2. Profile Strength (Clean Version - No Outer Box)
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
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Completion</p>
          <h4 className="font-black text-3xl text-slate-900">{percentage}%</h4>
        </div>
        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100">
          {percentage === 100 ? <CheckCircle className="text-emerald-500" size={20} /> : <UserCog className="text-slate-400" size={20} />}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-50 rounded-full h-2 overflow-hidden mb-6 border border-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${percentage === 100 ? 'bg-emerald-400' : 'bg-slate-900'}`}
        />
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((i, idx) => (
          <div key={idx} className="flex items-center gap-3 group">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${i.completed ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-200 text-slate-300'}`}>
              {i.completed ? <CheckCircle size={10} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
            </div>
            <span className={`text-sm font-medium transition-colors ${i.completed ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
              {i.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Advanced Activity Log (Restored Security/Admin Logs)
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
        data: o, icon: ShoppingBag, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', actionable: true
      });

      if (new Date(o.updatedAt) > new Date(o.createdAt).getTime() + UPDATE_THRESHOLD) {
        let statusTitle = `Order ${o.status}`;
        let icon = Package;
        let color = 'text-blue-600 bg-blue-50 border-blue-100';
        if (o.status.toLowerCase() === 'delivered') { statusTitle = "Delivered"; icon = CheckCircle; color = 'text-emerald-600 bg-emerald-50 border-emerald-100'; }
        else if (o.status.toLowerCase().includes('cancel')) { statusTitle = "Cancelled"; icon = XCircle; color = 'text-red-600 bg-red-50 border-red-100'; }
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
        data: t, icon: Headphones, color: 'text-rose-600 bg-rose-50 border-rose-100', actionable: true
      });
    });

    // 3. Process Reviews
    (reviews || []).forEach(r => {
      items.push({
        id: `rev-${r.id}`, type: 'review', date: new Date(r.createdAt),
        title: "Wrote a Review", subtitle: "Click to see details",
        data: r, icon: Star, color: 'text-amber-600 bg-amber-50 border-amber-100', actionable: true
      });
    });

    // 4. Process System/Security Logs (Restored from Original Code)
    (securityLogs || []).forEach(log => {
      let title = "System Update";
      let icon = UserCog;
      let color = 'text-slate-600 bg-slate-100 border-slate-200';

      switch (log.action) {
        case 'ADMIN_UPDATE':
        case 'PROFILE_UPDATE':
          title = "Profile Updated";
          icon = ShieldAlert;
          color = 'text-orange-600 bg-orange-50 border-orange-100';
          break;
        case 'ACCOUNT_CREATED':
          title = "Account Created";
          icon = UserIcon;
          color = 'text-emerald-600 bg-emerald-50 border-emerald-100';
          break;
        case 'LOGIN':
          title = "Logged In";
          icon = Lock;
          color = 'text-blue-600 bg-blue-50 border-blue-100';
          break;
        default:
          title = log.action ? log.action.replace(/_/g, ' ') : "System Log";
          break;
      }

      items.push({
        id: log.id || `sys-${Math.random()}`,
        type: 'security', // This maps to the Security filter
        date: new Date(log.createdAt),
        title: title,
        subtitle: log.description || "System event recorded",
        data: log,
        icon: icon,
        color: color,
        actionable: false
      });
    });

    return items.sort((a, b) => b.date - a.date);
  }, [orders, tickets, reviews, securityLogs]);

  const filteredItems = filter === 'all'
    ? activityItems
    : activityItems.filter(i => {
      if (filter === 'order') return i.type.includes('order');
      if (filter === 'ticket') return i.type === 'ticket';
      if (filter === 'review') return i.type === 'review';
      if (filter === 'security') return i.type === 'security';
      return false;
    });

  const grouped = filteredItems.reduce((acc, item) => {
    const d = item.date;
    const key = d.toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' :
      d.toLocaleDateString() === new Date(Date.now() - 86400000).toLocaleDateString() ? 'Yesterday' :
        d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_20px_40px_rgb(0,0,0,0.03)]  p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-900 flex items-center gap-2"><Clock size={16} /> {title}</h3>
        <div className="flex gap-1">
          <button onClick={() => setFilter('all')} className={`p-1.5 rounded-lg transition-colors ${filter === 'all' ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`} title="All"><Clock size={14} /></button>
          <button onClick={() => setFilter('order')} className={`p-1.5 rounded-lg transition-colors ${filter === 'order' ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`} title="Orders"><ShoppingBag size={14} /></button>
          <button onClick={() => setFilter('ticket')} className={`p-1.5 rounded-lg transition-colors ${filter === 'ticket' ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`} title="Tickets"><Ticket size={14} /></button>
          <button onClick={() => setFilter('review')} className={`p-1.5 rounded-lg transition-colors ${filter === 'review' ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`} title="Reviews"><Star size={14} /></button>
          {/* Restored Security Filter Icon */}
          <button onClick={() => setFilter('security')} className={`p-1.5 rounded-lg transition-colors ${filter === 'security' ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`} title="Security Logs"><UserCog size={14} /></button>
        </div>
      </div>

      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-2 -mr-2 space-y-6 h-[500px]">
        {Object.keys(grouped).length === 0 && <p className="text-center text-slate-400 text-sm py-10">No recent activity.</p>}

        {Object.entries(grouped).map(([label, groupItems]) => (
          <div key={label}>
            <div className="sticky top-0 bg-white z-20 py-1 mb-2 border-b border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            </div>
            <div className="space-y-3 relative ml-2">
              <div className="absolute top-2 bottom-2 left-[15px] w-[2px] bg-slate-100 z-0"></div>
              {groupItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.actionable && onNavigate(item)}
                  className={`relative z-10 flex items-center gap-3 p-2 rounded-xl transition-colors ${item.actionable ? 'group cursor-pointer hover:bg-slate-50' : 'cursor-default'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0 ${item.color}`}>
                    <item.icon size={12} />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-bold text-slate-800 leading-none transition-colors ${item.actionable ? 'group-hover:text-indigo-600' : ''}`}>{item.title}</p>
                      <span className="text-[9px] text-slate-400 whitespace-nowrap ml-2">
                        {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">{item.subtitle}</p>
                  </div>
                  {item.actionable && <ChevronRight size={14} className="text-slate-300" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. Offers Component (Polished VoucherCard)
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

  const categorized = useMemo(() => ({
    special: offers.filter(o => o.targetUserId || o.targetCategory),
    automatic: offers.filter(o => !o.targetUserId && !o.targetCategory && o.isAutomatic),
    manual: offers.filter(o => !o.targetUserId && !o.targetCategory && !o.isAutomatic),
  }), [offers]);

  if (loading) return <div className="text-center py-10"><Loader2 className="animate-spin inline text-slate-400" /></div>;

  const VoucherCard = ({ offer, type }) => {
    const isSpecial = type === 'special';
    const isAuto = type === 'automatic';
    const isCopied = copiedId === offer.id;

    // Detailed theme mapping from original code
    const theme = isSpecial
      ? { wrapper: "bg-slate-900 border-slate-800 text-white", left: "bg-gradient-to-br from-indigo-600 to-purple-700 text-white", code: "text-amber-400", dots: "bg-slate-50" }
      : isAuto
        ? { wrapper: "bg-white border-blue-100 text-slate-800", left: "bg-blue-50 text-blue-600", code: "text-blue-700", dots: "bg-slate-50" }
        : { wrapper: "bg-white border-slate-200 text-slate-800", left: "bg-slate-100 text-slate-500", code: "text-slate-900", dots: "bg-slate-50" };

    return (
      <motion.div variants={fadeInUp} className={`relative flex w-full h-28 rounded-xl overflow-hidden border shadow-sm transition-all hover:shadow-md ${theme.wrapper}`}>
        <div className={`w-20 flex flex-col items-center justify-center text-center relative ${theme.left}`}>
          <div className="mb-1">{isSpecial ? <Sparkles size={18} /> : isAuto ? <Layers size={18} /> : <Ticket size={18} />}</div>
          <span className="text-lg font-black leading-none">{offer.discountValue}{offer.discountType === 'percent' ? '%' : '₹'}<br /><span className="text-[9px] font-medium opacity-80">OFF</span></span>
          <div className="absolute -right-1 top-0 bottom-0 flex flex-col justify-between py-1.5">
            {[...Array(5)].map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${theme.dots}`} />)}
          </div>
        </div>
        <div className="flex-1 px-4 py-3 flex flex-col justify-center min-w-0 relative">
          <div className="pl-4">
            <div className="flex items-center gap-2 mb-1">
              {isSpecial && <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400">Exclusive</span>}
              {isAuto && <span className="text-[9px] font-bold uppercase tracking-widest text-blue-500">Auto-Applied</span>}
            </div>
            <h3 className={`text-lg font-black tracking-wider font-mono truncate ${theme.code}`}>{offer.code}</h3>
            <p className="text-[10px] opacity-70 line-clamp-1">{offer.description || "Use code at checkout"}</p>
            {offer.validUntil && <p className="text-[9px] opacity-60 mt-1">Exp: {new Date(offer.validUntil).toLocaleDateString()}</p>}
          </div>
        </div>
        {!isAuto && (
          <div className="hidden sm:flex flex-col justify-center pr-4 pl-2 border-l border-dashed border-gray-200">
            <button onClick={() => handleCopy(offer.code, offer.id)} className={`h-8 px-4 rounded-lg font-bold flex items-center gap-1.5 text-[10px] ${isSpecial ? 'bg-white/10 hover:bg-white/20' : 'bg-black text-white hover:bg-slate-800'}`}>
              {isCopied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
      {categorized.special.length > 0 && <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{categorized.special.map(o => <VoucherCard key={o.id} offer={o} type="special" />)}</div>}
      {categorized.automatic.length > 0 && <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{categorized.automatic.map(o => <VoucherCard key={o.id} offer={o} type="automatic" />)}</div>}
      {categorized.manual.length > 0 && <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{categorized.manual.map(o => <VoucherCard key={o.id} offer={o} type="manual" />)}</div>}
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
    <label className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-slate-300 transition-all gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 mt-1">{desc}</p>
      </div>
      <div className="relative flex-shrink-0">
        <input type="checkbox" className="sr-only peer" {...props} />
        <div className="w-11 h-6 bg-slate-200 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
      </div>
    </label>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <h2 className="text-xl font-bold mb-6">Notification Preferences</h2>
      <SettingRow label="Order Updates" desc="Get notified about shipping and delivery status." {...register("notify_order_updates")} />
      <SettingRow label="Promotions & Deals" desc="Receive updates on new coupons and sales." {...register("notify_promos")} />
      <SettingRow label="Service Alerts" desc="Important updates about service availability." {...register("notify_pincode")} />
      <button type="submit" disabled={!isDirty} className="mt-4 px-8 py-3 bg-black text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 hover:bg-slate-800 transition-colors">Save Preferences</button>
    </form>
  );
};

/* ========================================================================
   7. REVIEWS TAB CONTENT (Restored Editing Logic)
   ======================================================================== */
const ReviewHistory = () => {
  const { userReviews, loadingReviews } = useContext(ReviewContext);
  const { products } = useContext(ProductContext);
  const navigate = useNavigate();
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      {loadingReviews && <p className="text-center text-slate-400 py-10">Loading...</p>}
      {!loadingReviews && (!userReviews || userReviews.length === 0) && <p className="text-center text-slate-400 py-10">No reviews yet.</p>}
      {(userReviews || []).map(review => {
        const product = productMap.get(review.productId);
        return (
          <motion.div key={review.id} variants={fadeInUp} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-5">
            <img src={product?.imageurl?.[0]} className="w-16 h-16 rounded-xl object-cover bg-slate-50 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{product?.name}</h4>
                  <div className="flex gap-0.5 mt-1">{[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />)}</div>
                </div>
                {/* 🟢 Restored Pencil Edit Logic */}
                <button onClick={() => navigate(`/product/${review.productId}`, { state: { editReviewId: review.id } })} className="text-slate-400 hover:text-black flex-shrink-0"><Pencil size={16} /></button>
              </div>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed break-words">{review.comment}</p>
              <p className="text-xs text-slate-400 mt-2">{formatDate(review.createdAt)}</p>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  );
};

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

  // 🟢 NEW: State for logs (System/Security Logs)
  const [personalLogs, setPersonalLogs] = useState([]);

  // Helper Maps
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  // Initial Data Fetch
  useEffect(() => {
    if (userdetails?.email) {
      getUserTickets(userdetails.email);
      // 🟢 Fetch System Logs
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

  // --- Handlers ---
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

  if (!userdetails) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pt-14 sm:pt-20 pb-20 px-2  text-slate-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT SIDEBAR (Sticky) */}
        <div className="lg:col-span-3 sticky top-12 z-40">
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
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 ">

                  {/* LEFT COLUMN: Main Dashboard */}
                  <div className="xl:col-span-2 space-y-8">

                    {/* 1. Hero / Welcome Card - Clean Light Version */}
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-8 md:p-10 border border-slate-100 shadow-[0_20px_40px_rgb(0,0,0,0.03)]">

                      {/* Background Pattern - Subtle Grid */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] z-0"></div>

                      {/* Soft Color Blobs */}
                      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
                      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>

                      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">

                        {/* Text Section */}
                        <div className="space-y-4 max-w-lg">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Welcome Back
                          </div>

                          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                            Hello, <span className="text-indigo-600">{userdetails.name.split(" ")[0]}</span> 👋
                          </h2>

                          <p className="text-slate-500 text-lg">
                            You have <span className="font-bold text-slate-900">
                              {/* Counts orders that are NOT delivered and NOT cancelled */}
                              {orders?.filter(o => {
                                const s = o.status?.toLowerCase() || '';
                                return s !== 'delivered' && !s.includes('cancel');
                              }).length || 0} orders
                            </span> in progress.
                          </p>
                        </div>

                        {/* Buttons Section */}
                        <div className="flex flex-col  gap-4 w-full lg:w-auto">

                          <button
                            onClick={() => setActiveTab('offers')}
                            className="flex-1 sm:flex-none bg-white text-slate-700  px-8 py-5 rounded-2xl font-bold shadow-[0_20px_40px_rgb(0,0,0,0.03)] transition-all flex items-center justify-center gap-2"
                          >
                            <Ticket size={18} className="text-indigo-500" /> Coupons
                          </button>
                        </div>

                      </div>
                    </div>

                    {/* 2. Stats & Profile Split */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                      {/* Left: Stats Column */}
                      <div className="md:col-span-4 flex flex-col gap-5">

                        {/* Orders Stat (Clickable -> Switches Tab) */}
                        <motion.div
                          whileHover={{ y: -4 }}
                          onClick={() => setActiveTab('orders')}
                          className="flex-1 bg-gradient-to-br from-white to-blue-50/50 p-6 rounded-[2rem]  shadow-[0_20px_40px_rgb(0,0,0,0.03)] transition-all cursor-pointer group relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                            <ChevronRight />
                          </div>

                          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                            <Package size={24} strokeWidth={2.5} />
                          </div>

                          <div>
                            <span className="text-4xl font-black text-slate-900 tracking-tight">{orders?.length || 0}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</p>
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            </div>
                          </div>
                        </motion.div>

                        {/* Cart & Wishlist Row */}
                        <div className="grid grid-cols-2 gap-5">

                          {/* Cart Card (Clickable -> Navigates to /cart) */}
                          <motion.div
                            whileHover={{ y: -4 }}
                            onClick={() => navigate('/cart')}
                            className="bg-white p-5 rounded-[2rem] shadow-[0_20px_40px_rgb(0,0,0,0.03)] transition-all cursor-pointer group"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                              <ShoppingBag size={22} strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-black text-slate-900">{cart?.length || 0}</span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 group-hover:text-amber-600 transition-colors">In Cart</p>
                          </motion.div>

                          {/* Wishlist Card (Clickable -> Navigates to /wishlist) */}
                          <motion.div
                            whileHover={{ y: -4 }}
                            onClick={() => navigate('/wishlist')}
                            className="bg-white p-5 rounded-[2rem] shadow-[0_20px_40px_rgb(0,0,0,0.03)] transition-all cursor-pointer group"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-3 group-hover:bg-pink-500 group-hover:text-white transition-colors duration-300">
                              <Heart size={22} strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-black text-slate-900">{wishlist?.length || 0}</span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 group-hover:text-pink-600 transition-colors">Saved</p>
                          </motion.div>
                        </div>
                      </div>

                      {/* Right: Profile Widget */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-8 bg-white p-8 rounded-[2rem] shadow-[0_20px_40px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group"
                      >
                        {/* Decorative BG */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[10rem] -z-0 transition-transform duration-700 group-hover:scale-110"></div>

                        <div className="relative z-10 h-full flex flex-col">
                          <div className="flex items-start justify-between mb-8">
                            <div>
                              <h3 className="font-bold text-slate-900 text-2xl mb-1">Profile Health</h3>
                              <p className="text-sm text-slate-500 font-medium">Complete your account to unlock exclusive offers.</p>
                            </div>

                            <button
                              onClick={() => setActiveTab('settings')}
                              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-600 hover:bg-black hover:text-white transition-all border border-slate-100 hover:border-black"
                            >
                              <UserCog size={14} /> Edit Profile
                            </button>
                          </div>

                          <div className="flex-1 flex flex-col justify-center">
                            <ProfileCompletion user={userdetails} addressCount={address?.length || 0} />
                          </div>

                          {/* Mobile Only Button */}
                          <button
                            onClick={() => setActiveTab('settings')}
                            className="sm:hidden w-full mt-6 py-3.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                          >
                            <UserCog size={14} /> Manage Profile
                          </button>
                        </div>
                      </motion.div>

                    </div>
                  </div>

                  {/* RIGHT COLUMN: Activity Feed */}
                  <div className="xl:col-span-1 h-full min-h-[500px]">
                    <AdvancedActivityLog
                      orders={orders}
                      tickets={tickets}
                      reviews={userReviews}
                      securityLogs={personalLogs}
                      onNavigate={handleNavigateActivity}
                      role={userdetails.role}
                      title="Recent Activity"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-8">
                  {/* Page Header */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4  pb-2">
                    <div>
                      <h2 className="text-2xl pl-3 font-bold text-slate-900 tracking-tight">Order History</h2>
                    </div>
                  </div>

                  {/* Content Area */}
                  {loadingOrders ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                        <ShoppingBag className="text-slate-400" size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">No orders placed yet</h3>
                      <p className="text-slate-500 mt-1 max-w-sm mx-auto">Start shopping to fill your wardrobe with the best trends.</p>
                    </div>
                  ) : (
                    <div className="grid gap-5">
                      {orders.map((order) => {
                        // --- Logic Preparation ---
                        const previewImages = order.orderItems.slice(0, 4).map((item) => {
                          const prod = productMap.get(item.productId);
                          return prod?.imageurl?.[0] || item.img;
                        });
                        const remaining = order.orderItems.length - 4;
                        const isDelivered = order.status.toLowerCase() === 'delivered';
                        const isProcessing = order.status.toLowerCase() === 'processing';

                        // Dynamic Status Colors
                        let statusStyles = "bg-slate-100 text-slate-600 border-slate-200";
                        if (isDelivered) statusStyles = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        else if (isProcessing) statusStyles = "bg-blue-50 text-blue-700 border-blue-200";
                        else statusStyles = "bg-amber-50 text-amber-700 border-amber-200";

                        return (
                          <motion.div
                            key={order.id}
                            layoutId={order.id}
                            variants={fadeInUp}
                            initial="hidden"
                            animate="visible"
                            onClick={() => setViewOrder(order)}
                            className="group relative bg-white rounded-2xl  p-5 cursor-pointer transition-all duration-300 shadow-[0_20px_40px_rgb(0,0,0,0.03)] hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100 hover:-translate-y-1"
                          >
                            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">

                              {/* Left Section: Info & Images */}
                              <div className="flex-1 space-y-4">

                                {/* Metadata Row */}
                                <div className="flex flex-wrap items-center justify-between md:justify-start gap-3 md:gap-6">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${statusStyles}`}>
                                    {order.status}
                                  </span>
                                  <div className="flex items-center text-slate-500 text-sm">
                                    <Calendar size={14} className="mr-1.5" />
                                    {formatDate(order.createdAt)}
                                  </div>
                                  <div className="text-xs font-mono text-slate-400">
                                    ID: #{order.id.toUpperCase()}
                                  </div>
                                </div>

                                {/* Image Strip */}
                                <div className="flex items-center gap-3">
                                  {previewImages.map((img, idx) => (
                                    <div key={idx} className="relative w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                                      <img
                                        src={img}
                                        alt="Product"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                      />
                                    </div>
                                  ))}
                                  {remaining > 0 && (
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-500">
                                      +{remaining}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Section: Price & Action */}
                              <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 gap-1 md:gap-3 min-w-[120px]">

                                <div className="md:text-right">
                                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Total</p>
                                  <p className="text-xl md:text-2xl font-bold text-slate-900">₹{order.totalAmount}</p>
                                </div>

                                <button className="flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                                  View Details
                                  <div className="bg-indigo-50 rounded-full p-1 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                    <ChevronRight size={16} />
                                  </div>
                                </button>

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
                  : <div className="bg-white p-8 rounded-[2rem] border border-slate-100">
                    <h3 className="text-xl font-bold mb-6">{editingAddress ? "Edit Address" : "New Address"}</h3>
                    <AddressFormWrapper initialData={editingAddress} onCancel={() => { setIsAddingAddress(false); setEditingAddress(null); }} onSubmit={handleAddressSubmit} />
                  </div>
              )}

              {activeTab === 'offers' && <UserOffers userId={userdetails.id} />}
              {activeTab === 'settings' && <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm"><ProfileSettingsWrapper user={userdetails} onUpdate={updateUser} /></div>}
              {activeTab === 'reviews' && <ReviewHistory />}

              {activeTab === 'support' && (
                <div className="flex h-[600px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col bg-white z-10 ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900">Inbox</h3>
                      <div className="flex gap-1">
                        <button onClick={refreshTickets} className={`p-2 hover:bg-slate-50 rounded-lg text-slate-400 ${ticketRefreshing ? 'animate-spin text-indigo-500' : ''}`}><RefreshCw size={14} /></button>
                        <button onClick={() => navigate('/contact')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-black"><Plus size={16} /></button>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                      {tickets.length === 0 && <p className="text-center text-xs text-slate-400 mt-10">No tickets found.</p>}
                      {tickets.map(t => (
                        <div key={t.id} onClick={() => setSelectedTicket(t)} className={`p-3 rounded-xl cursor-pointer transition-colors border-l-4 ${selectedTicket?.id === t.id ? 'bg-slate-50 border-indigo-500' : 'border-transparent hover:bg-slate-50'}`}>
                          <div className="flex justify-between"><span className="font-bold text-sm text-slate-800 truncate">{t.subject}</span><span className="text-[10px] text-slate-400">{new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
                          <p className="text-xs text-slate-500 truncate mt-1 opacity-70">{t.messages[t.messages.length - 1]?.message}</p>
                          <span className={`mt-2 inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${t.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{t.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={`flex-1 flex flex-col bg-slate-50/50 relative ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                    {selectedTicket ? (
                      <>
                        <div className="h-16 px-6 border-b border-slate-100 bg-white flex justify-between items-center shadow-sm z-10">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{selectedTicket.subject}</h3>
                            <p className="text-xs text-slate-400">ID: {selectedTicket.id}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedTicket(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors" title="Close View"><X size={20} /></button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {selectedTicket.messages.map((m, i) => (
                            <div key={i} className={`flex ${m.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${m.senderRole === 'user' ? 'bg-black text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                                {m.message}
                              </div>
                            </div>
                          ))}
                        </div>
                        {selectedTicket.status === 'open' ? (
                          <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                            <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTicketReply()} placeholder="Type reply..." className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-black/10 transition-all" />
                            <button onClick={handleTicketReply} disabled={!replyText.trim()} className="p-2.5 bg-black text-white rounded-xl disabled:bg-slate-300 transition-colors"><Send size={16} /></button>
                          </div>
                        ) : <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100 font-bold flex items-center justify-center gap-2"><Lock size={12} /> Ticket Closed</div>}
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                        <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm font-medium">Select a ticket to view conversation</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && <div className="bg-white p-4 rounded-[2rem] border border-slate-100"><NotificationSettings user={userdetails} onUpdate={updateUser} /></div>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {viewOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewOrder(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Order Details</h3>
                <button onClick={() => setViewOrder(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X size={20} /></button>
              </div>
              <div className="space-y-5">
                {viewOrder.orderItems.map(item => {
                  const prod = productMap.get(item.productId);
                  return (
                    <div key={item.id} className="flex gap-4 border-b border-slate-50 pb-4">
                      <img src={prod?.imageurl?.[0] || item.img} className="w-16 h-16 rounded-xl object-cover bg-slate-50" />
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-900 line-clamp-1">{item.productName}</p>
                        <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</p>
                        <p className="text-sm font-bold mt-1">₹{item.totalPrice}</p>
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-between pt-2 text-lg font-bold border-t border-slate-100"><span>Total Amount</span><span>₹{viewOrder.totalAmount}</span></div>
                <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 space-y-1">
                  <p><span className="font-bold">Order ID:</span> {viewOrder.id}</p>
                  <p><span className="font-bold">Date:</span> {formatDate(viewOrder.createdAt)}</p>
                  <p><span className="font-bold">Status:</span> {viewOrder.status}</p>
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
        window.toast.success("Profile photo updated successfully!");
      } catch (e) {
        window.toast.error("Upload failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteAvatar = async () => {
    if (window.confirm("Remove profile photo?")) {
      await onUpdate({ profileImage: "" });
      setImagePreview(null);
      window.toast.success("Photo removed");
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Profile Settings</h2>
      <div className="flex items-start gap-6 mb-8 p-2 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="relative group w-24 h-24 shrink-0">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-sm bg-white relative">
            <img src={imagePreview || `https://ui-avatars.com/api/?name=${user.name}`} className="w-full h-full object-cover" />
            <label className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity ${loading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {loading ? <Loader2 className="animate-spin mb-1" size={20} /> : <Upload size={24} />}
              {loading && <span className="text-[10px] font-bold">Uploading</span>}
              <input type="file" className="hidden" onChange={handleAvatar} disabled={loading} accept="image/*" />
            </label>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">Profile Photo</h3>
          <p className="text-xs text-slate-500 mb-2">Click the image to upload a new one.</p>
          <div className="flex gap-4 items-center">
            {imagePreview && !loading && (
              <button onClick={deleteAvatar} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1"><Trash2 size={12} /> Remove Photo</button>
            )}
          </div>
          {loading && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 animate-pulse">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 font-bold leading-tight">Uploading image...<br /><span className="font-normal text-amber-700">Do not close or reload the page.</span></p>
            </div>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
        <button type="submit" disabled={!isDirty || loading} className="mt-4 px-8 py-3 bg-black text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 transition-all hover:scale-105">Save Changes</button>
      </form>
    </div>
  );
};

const AddressManager = ({ address, onAdd, onEdit, onDelete, onSetDefault }) => (
  <motion.div variants={staggerContainer} initial="hidden" animate="visible">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold text-slate-900">Saved Addresses</h2>
      <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all"><Plus size={16} /> Add New</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {(address || []).map(addr => (
        <motion.div key={addr.id} variants={fadeInUp} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-wide text-slate-600">{addr.addressType || "Home"}</span>
            {addr.isDefault && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><CheckCircle size={10} /> Default</span>}
          </div>
          <h4 className="font-bold text-slate-900">{addr.name}</h4>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{addr.address}, {addr.city}<br />{addr.state} - {addr.postalCode}</p>
          <p className="text-xs text-slate-400 mt-2 font-mono">Ph: {addr.phone}</p>
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
            <button onClick={() => onEdit(addr)} className="p-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-black"><Pencil size={14} /></button>
            <button onClick={() => onDelete(addr.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={14} /></button>
          </div>
          {!addr.isDefault && (
            <button onClick={() => onSetDefault(addr.id)} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">Set as Default</button>
          )}
        </motion.div>
      ))}
      {(address || []).length === 0 && <p className="col-span-2 text-center text-slate-400 py-10">No addresses saved yet.</p>}
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
        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button type="submit" className="px-8 py-3 rounded-xl bg-black text-white font-bold shadow-lg hover:bg-slate-800 transition-colors">Save Address</button>
      </div>
    </form>
  )
};