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
  Trash2, CheckCircle, Circle, X, CreditCard,
  ShoppingBag, Bell, Shield, LogOut, User as UserIcon, Camera, ShoppingCart,
  FileText, XCircle, Heart, ChevronLeft, ChevronDown, Check, Loader2, Upload,
  ChevronRight, Send, AlertCircle, Lock, RefreshCw, Clock, Headphones, Filter,
  Truck, CheckSquare, ShieldAlert, UserCog, History, Ticket
} from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import useCloudinary from "../utils/useCloudinary";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

// 🟢 Luxury Animations
const luxuryEase = [0.25, 0.1, 0.25, 1];
const smoothTransition = { duration: 0.5, ease: luxuryEase };

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: smoothTransition }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

// Helper: Deterministic Avatar Color
const getDeterministicColor = (s) => {
  const colors = ["bg-indigo-100 text-indigo-600", "bg-amber-100 text-amber-600", "bg-lime-100 text-lime-600", "bg-pink-100 text-pink-600", "bg-blue-100 text-blue-600", "bg-yellow-100 text-yellow-600", "bg-slate-100 text-slate-600"];
  if (!s) return colors[0];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
};

// Helper: Format Date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/* ========================================================================
   Floating Input Components
   ======================================================================== */
const FloatingInput = React.forwardRef(({ label, error, className = "", ...props }, ref) => (
  <div className={`relative w-full ${className}`}>
    <input
      ref={ref}
      placeholder=" "
      className={`peer w-full rounded-xl border bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all duration-300 placeholder-transparent
        ${error ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-black focus:ring-1 focus:ring-black/5"}`}
      {...props}
    />
    <label
      className="absolute left-3 -top-2 bg-white px-1 text-xs text-slate-500 transition-all duration-300 pointer-events-none rounded-sm
      peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
      peer-focus:-top-2 peer-focus:text-xs peer-focus:text-black peer-focus:font-semibold"
    >
      {label}
    </label>
    {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
  </div>
));

const FloatingDropdown = ({ label, value, onChange, options = [] }) => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative w-full" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="peer w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-left cursor-pointer outline-none transition-all duration-300 focus:border-black focus:ring-1 focus:ring-black/5 flex justify-between items-center"
      >
        <span className={`font-medium ${!value ? "text-slate-400" : "text-slate-900"}`}>{value || "Select..."}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <label className="absolute left-3 -top-2 bg-white px-1 text-xs text-slate-500 transition-all duration-300 pointer-events-none rounded-sm">
        {label}
      </label>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-30 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-1 max-h-60 overflow-y-auto"
          >
            {options.map((opt) => (
              <li
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === opt ? "bg-slate-50 text-black font-semibold" : "hover:bg-slate-50 text-slate-600"}`}
              >
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
   1. LEFT COLUMN: PROFILE CARD
   ======================================================================== */
const ProfileCard = ({ user, wishlistCount, cartCount, orderCount, onEditProfile }) => {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [avatarBg, setAvatarBg] = useState("");

  useEffect(() => {
    setAvatarBg(getDeterministicColor(user?.email || "user"));
  }, [user?.email]);

  const initials = (user?.name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const StatItem = ({ label, count, icon: Icon, path, hoverColor }) => (
    <div
      onClick={() => navigate(path)}
      className="group flex-1 flex flex-col items-center py-3 cursor-pointer rounded-2xl transition-all duration-300 ease-in-out hover:bg-slate-50 hover:scale-105"
    >
      <div className={`mb-1 p-2 rounded-full bg-slate-50 transition-colors duration-300 group-hover:bg-white`}>
        <Icon
          size={20}
          strokeWidth={1.5}
          className={`text-slate-400 transition-colors duration-300 ${hoverColor}`}
        />
      </div>
      <span className="text-lg font-bold text-slate-800 transition-colors duration-300">{count}</span>
      <span className={`text-[10px] uppercase tracking-wider font-bold text-slate-400 transition-colors duration-300 ${hoverColor}`}>{label}</span>
    </div>
  );

  return (
    <motion.div variants={fadeInUp} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
      <div className="h-32 bg-gradient-to-br from-slate-800 to-black"></div>
      <div className="pt-0 px-6 pb-8 text-center relative z-10">

        <div className="relative mx-auto w-24 h-24 -mt-12 mb-4 group cursor-pointer" onClick={onEditProfile}>
          <div className="w-full h-full bg-white border-[4px] border-white shadow-lg overflow-hidden rounded-full">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-3xl font-bold ${avatarBg} transition-all duration-500`}>{initials}</div>
            )}
          </div>

          <div className="absolute bottom-0 right-0 p-2 bg-black text-white rounded-full shadow-md border-2 border-white transition-all duration-300 group-hover:scale-110">
            <Pencil size={12} />
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 break-words">{user.name}</h2>
        <p className="text-sm text-slate-500 font-medium mt-1 break-all">{user.email}</p>

        <div className="flex justify-between mt-6 border-t border-slate-100 pt-6">
          <StatItem label="Wishlist" count={wishlistCount} icon={Heart} path="/wishlist" hoverColor="text-pink-500 group-hover:text-pink-600" />
          <div className="w-[1px] bg-slate-100 my-2" />
          <StatItem label="Cart" count={cartCount} icon={ShoppingCart} path="/cart" hoverColor="text-indigo-500 group-hover:text-indigo-600" />
          <div className="w-[1px] bg-slate-100 my-2" />
          <StatItem label="Orders" count={orderCount} icon={Package} path="/myorder" hoverColor="text-amber-500 group-hover:text-amber-600" />
        </div>

        <div className="mt-6 space-y-3">
          <button onClick={() => navigate('/settings')} className="w-full py-3 rounded-xl bg-slate-50 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
            <Shield size={16} /> Security & Settings
          </button>
          <button onClick={() => signOut({ redirectUrl: "/" })} className="w-full py-3 rounded-xl border border-red-50 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ========================================================================
   2. LEFT COLUMN: PROFILE COMPLETION
   ======================================================================== */
const ProfileCompletion = ({ user, addressCount }) => {
  const items = useMemo(() => [
    { label: "Profile photo", completed: !!user.profileImage },
    { label: "Phone number", completed: !!user.phone },
    { label: "Date of birth", completed: !!user.dob },
    { label: "Gender", completed: !!user.gender },
    { label: "Delivery address", completed: addressCount > 0 },
  ], [user, addressCount]);

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  return (
    <motion.div variants={fadeInUp} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Profile Strength</h3>
        <span className="text-xl font-bold text-slate-900">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, ease: "circOut" }}
          className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
        />
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${item.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
              {item.completed ? <Check size={12} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
            </div>
            <span className={`text-sm font-medium truncate ${item.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/* ========================================================================
   3. LEFT COLUMN: ADVANCED ACTIVITY LOG (REPLACES RECENT ACTIVITY)
   ======================================================================== */
// 🟢 MODIFIED: Added isAdminLog prop to display Actor Name for global logs
const AdvancedActivityLog = ({ orders, reviews, addresses, tickets, securityLogs, onNavigate, title = "Activity Log", isAdminLog = false }) => {
  const [filter, setFilter] = useState("all");

  const activityItems = useMemo(() => {
    let items = [];
    const UPDATE_THRESHOLD = 60 * 60 * 1000;

    // 🟢 Condition: Process User-Specific Data only if NOT a global admin log
    if (!isAdminLog) {
      // 1. Process Orders
      (orders || []).forEach(o => {
        items.push({
          id: `ord-cr-${o.id}`,
          type: 'order_created',
          date: new Date(o.createdAt),
          title: `Order Placed`,
          subtitle: `#${o.id.slice(-6).toUpperCase()} • ₹${o.totalAmount}`,
          data: o,
          icon: ShoppingBag,
          color: 'text-indigo-600 bg-indigo-50 border-indigo-100'
        });

        if (new Date(o.updatedAt) > new Date(o.createdAt).getTime() + UPDATE_THRESHOLD) {
          let statusTitle = `Order ${o.status}`;
          let icon = Package;
          let color = 'text-blue-600 bg-blue-50 border-blue-100';

          if (o.status.toLowerCase() === 'delivered') {
            statusTitle = "Delivered";
            icon = Truck;
            color = 'text-emerald-600 bg-emerald-50 border-emerald-100';
          }

          items.push({
            id: `ord-up-${o.id}`,
            type: 'order_updated',
            date: new Date(o.updatedAt),
            title: statusTitle,
            subtitle: `#${o.id.slice(-6).toUpperCase()}`,
            data: o,
            icon: icon,
            color: color
          });
        }
      });

      // 2. Process Support Tickets
      (tickets || []).forEach(t => {
        items.push({
          id: `tkt-${t.id}`,
          type: 'ticket',
          date: new Date(t.createdAt),
          title: `Ticket ${t.status === 'open' ? 'Opened' : 'Updated'}`,
          subtitle: t.subject,
          data: t,
          icon: Headphones,
          color: 'text-rose-600 bg-rose-50 border-rose-100'
        });
      });

      // 3. Process Reviews
      (reviews || []).forEach(r => {
        items.push({
          id: `rev-${r.id}`,
          type: 'review',
          date: new Date(r.createdAt),
          title: "Wrote a Review",
          subtitle: "Click to see details",
          data: r,
          icon: Star,
          color: 'text-amber-600 bg-amber-50 border-amber-100'
        });
      });
    }

    // 4. Process Security/Profile Logs
    (securityLogs || []).forEach(log => {
      const isAdminAction = log.performedBy === 'admin';

      // 1. Extract Actor and Target Names
      const actorName = log.actor?.name || 'Admin';
      const targetName = log.target?.name;

      // 2. Default Styling
      let title = "Profile Updated";
      let icon = UserCog;
      let color = isAdminAction ? 'text-red-600 bg-red-50 border-red-100' : 'text-slate-600 bg-slate-100 border-slate-200';

      // 3. Determine Base Title & Icon based on Action
      switch (log.action) {
        case 'ADMIN_UPDATE':
        case 'PROFILE_UPDATE':
          title = "Profile Update";
          icon = ShieldAlert;
          break;
        case 'ACCOUNT_CREATED':
          title = "Account Created";
          icon = UserIcon;
          break;
        case 'ORDER_CANCEL':
          title = "Order Cancelled";
          icon = XCircle;
          break;
        case 'ORDER_STATUS_UPDATE':
          title = "Status Update";
          icon = Truck;
          break;
        case 'PRODUCT_CREATE':
          title = "Product Created";
          icon = Package;
          color = 'text-purple-600 bg-purple-50 border-purple-100';
          break;
        case 'PRODUCT_UPDATE':
          title = "Product Updated";
          icon = Package;
          color = 'text-blue-600 bg-blue-50 border-blue-100';
          break;
        case 'COUPON_CREATE':
          title = "Coupon Created";
          icon = Ticket;
          color = 'text-pink-600 bg-pink-50 border-pink-100';
          break;
        case 'COUPON_UPDATE':
          title = "Coupon Updated";
          icon = Ticket;
          color = 'text-pink-600 bg-pink-50 border-pink-100';
          break;
        default:
          title = log.action.replace(/_/g, ' ');
          break;
      }

      // 4. Construct Final Display Title
      let displayTitle = title;

      if (isAdminLog) {
        if (targetName) {
          // Scenario: Admin changed a specific user (e.g., "Devid ➝ John Doe")
          displayTitle = `${actorName} ➝ ${targetName}`;
        } else {
          // Scenario: Global action (e.g., "Devid • Coupon Created")
          displayTitle = `${actorName} • ${title}`;
        }
      }

      items.push({
        id: log.id,
        type: 'security',
        date: new Date(log.createdAt),
        title: displayTitle, // 🟢 Use the dynamically formatted title
        subtitle: log.description,
        data: log,
        icon: icon,
        color: color
      });
    });

    return items.sort((a, b) => b.date - a.date);
  }, [orders, tickets, reviews, securityLogs, isAdminLog]);

  const filteredItems = filter === 'all'
    ? activityItems
    : activityItems.filter(i => i.type.includes(filter) || (filter === 'support' && i.type === 'ticket') || (filter === 'security' && i.type === 'security'));

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
    <motion.div variants={fadeInUp} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 max-h-[600px] flex flex-col mb-8">
      <div className="flex items-center justify-between mb-6">
        {/* 🟢 MODIFIED: Use Title prop */}
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">{title}</h3>

        {/* 🟢 MODIFIED: Hide non-security filters for Global Admin Log */}
        {!isAdminLog && (
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`p-1.5 rounded-lg transition-colors ${filter === 'all' ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`} title="All"><Clock size={14} /></button>
            <button onClick={() => setFilter('order')} className={`p-1.5 rounded-lg transition-colors ${filter === 'order' ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`} title="Orders"><ShoppingBag size={14} /></button>
            <button onClick={() => setFilter('support')} className={`p-1.5 rounded-lg transition-colors ${filter === 'support' ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`} title="Support"><Headphones size={14} /></button>
            <button onClick={() => setFilter('security')} className={`p-1.5 rounded-lg transition-colors ${filter === 'security' ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`} title="Security"><UserCog size={14} /></button>
          </div>
        )}
      </div>

      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-2 -mr-2 space-y-8">
        {Object.keys(grouped).length === 0 && <p className="text-center text-slate-400 text-sm py-4">No recent activity found.</p>}

        {Object.entries(grouped).map(([label, groupItems]) => (
          <div key={label}>
            <div className="sticky top-0 bg-white z-20 py-1 mb-4 border-b border-slate-50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            </div>
            <div className="space-y-0 relative">
              <div className="absolute top-2 bottom-2 left-[15px] w-[2px] bg-slate-100 z-0"></div>
              {groupItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate && !isAdminLog && onNavigate(item)}
                  className={`relative z-10 flex items-center gap-4 p-2 rounded-xl transition-colors mb-2 ${!isAdminLog ? 'group cursor-pointer hover:bg-slate-50' : ''}`}
                >
                  {/* Icon Container */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0 ${item.color}`}>
                    <item.icon size={12} />
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-800 leading-none group-hover:text-indigo-600 transition-colors">{item.title}</p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                        {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">{item.subtitle}</p>
                  </div>

                  {/* Navigation Chevron (Only for User) */}
                  {!isAdminLog && (
                    <div className="text-slate-300 group-hover:text-black transition-colors pl-2">
                      <ChevronRight size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/* ========================================================================
   TAB NAVIGATION
   ======================================================================== */
const TABS = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'support', label: 'Support', icon: MessageSquare },
  { id: 'notifications', label: 'Alerts', icon: Bell },
];

const TabNavigation = ({ activeTab, onTabClick }) => (
  <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl mb-8 overflow-x-auto [&::-webkit-scrollbar]:hidden">
    {TABS.map(tab => {
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex-shrink-0 ${isActive ? "text-white shadow-md" : "text-slate-500 hover:text-slate-800"
            }`}
        >
          {isActive && (
            <motion.div
              layoutId="activeTabBg"
              className="absolute inset-0 bg-black rounded-xl"
              transition={smoothTransition}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <tab.icon size={16} />
            {tab.label}
          </span>
        </button>
      );
    })}
  </div>
);

const CustomDropdown = ({ value, options, onChange, wrapperClassName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${wrapperClassName || ''}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="flex justify-between items-center w-full cursor-pointer rounded-lg py-1 px-2 text-base font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
      >
        <span>{value}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ml-2 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg bg-white shadow-lg border border-slate-100 py-1"
          >
            {options.map(option => (
              <li
                key={option}
                onClick={() => { onChange(option); setIsOpen(false); }}
                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {option}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

const CustomDatePickerHeader = ({ date, changeYear, changeMonth, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="flex justify-between items-center p-2">
      <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="p-1 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-30">
        <ChevronLeft size={16} />
      </button>
      <div className="flex gap-1">
        <CustomDropdown wrapperClassName="w-32" value={months[date.getMonth()]} options={months} onChange={(month) => changeMonth(months.indexOf(month))} />
        <CustomDropdown wrapperClassName="w-24" value={date.getFullYear()} options={years} onChange={(year) => changeYear(year)} />
      </div>
      <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="p-1 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-30">
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

/* ========================================================================
   4. TAB CONTENT: PROFILE SETTINGS
   ======================================================================== */
const ProfileSettings = () => {
  const { userdetails, updateUser } = useContext(UserContext);
  const { register, handleSubmit, reset, setValue, watch, control, formState: { isDirty: isFormDirty } } = useForm();
  const { uploadImage } = useCloudinary();
  const fileRef = useRef(null);
  const [localUrl, setLocalUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isImageDirty, setIsImageDirty] = useState(false);
  const isDirty = isFormDirty || isImageDirty;

  useEffect(() => {
    if (userdetails) {
      setLocalUrl(userdetails.profileImage || null);
      reset({
        name: userdetails.name || "", phone: userdetails.phone || "",
        dob: userdetails.dob ? new Date(userdetails.dob) : null, gender: userdetails.gender || "",
      });
      setIsImageDirty(false);
    }
  }, [userdetails, reset]);

  const onProfileSave = async (data) => {
    try {
      let message = "";
      let payload = {};
      if (isFormDirty) {
        payload = { ...data, dob: data.dob ? data.dob.toISOString().split('T')[0] : null };
        await updateUser(payload);
        message = "Profile updated. ";
        reset({ ...data, dob: data.dob });
      }
      if (isImageDirty) {
        await updateUser({ profileImage: localUrl });
        setIsImageDirty(false);
        message += "Image updated.";
      }
      window.toast.success(message.trim() || "No changes.");
    } catch (e) { window.toast.error(e.message || "Error"); }
  };

  const handleFileSelect = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setUploading(true);
      const url = await uploadImage(f);
      setLocalUrl(url);
      setIsImageDirty(true);
      window.toast.success("Image ready");
    } catch (err) { window.toast.error("Upload failed"); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleRemoveImage = () => {
    setLocalUrl(null);
    setIsImageDirty(true);
  };

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="max-w-2xl">
      <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          <div className="w-24 h-24 rounded-full border-[4px] border-white shadow-lg overflow-hidden bg-white">
            {localUrl ? (
              <img src={localUrl} alt="Profile" className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-3xl font-bold bg-slate-100`}>U</div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={() => fileRef.current?.click()} className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-200 flex items-center gap-2">
            <Upload size={16} /> Change Photo
          </button>
          {localUrl && (
            <button type="button" onClick={handleRemoveImage} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors" title="Remove Photo">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onProfileSave)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <FloatingInput label="Full Name" {...register("name", { required: true })} />
        </div>

        <div>
          <FloatingInput label="Phone Number" {...register("phone", { minLength: 6 })} />
        </div>

        <div className="relative">
          <Controller control={control} name="dob" render={({ field }) => (
            <ReactDatePicker selected={field.value} onChange={(date) => field.onChange(date)} customInput={<FloatingInput label="Date of Birth" />} renderCustomHeader={CustomDatePickerHeader} dateFormat="MMMM d, yyyy" maxDate={new Date()} showPopperArrow={false} />
          )} />
        </div>

        <div className="md:col-span-2">
          <Controller control={control} name="gender" render={({ field }) => (
            <FloatingDropdown label="Gender" value={field.value} onChange={field.onChange} options={["Male", "Female", "Other"]} />
          )} />
        </div>

        <div className="md:col-span-2 flex justify-end mt-4">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={!isDirty} className="px-8 py-3 bg-black text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-300 disabled:opacity-50 disabled:shadow-none w-full sm:w-auto">
            Save Changes
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

/* ========================================================================
   5. TAB CONTENT: ADDRESSES
   ======================================================================== */
const AddressSettings = ({ onAdd, onEdit }) => {
  const { address, deleteAddress, setDefaultAddress } = useContext(UserContext);

  const onDelete = async (id) => { if (window.confirm("Delete address?")) { const r = await deleteAddress(id); r?.success ? window.toast.success("Deleted") : window.toast.error("Failed"); } };
  const onSetDefault = async (id) => { await setDefaultAddress(id); window.toast.success("Default set"); };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-bold text-slate-900">Addresses</h3>
        <button onClick={onAdd} className="flex items-center gap-2 py-2 px-4 rounded-xl bg-black text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
          <Plus size={16} /> Add New
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(!address || address.length === 0) && <p className="text-sm text-slate-500 col-span-2">No addresses saved.</p>}
        {(address || []).map(addr => (
          <motion.div key={addr.id} variants={fadeInUp} className="group bg-white border border-slate-100 shadow-sm rounded-2xl p-6 hover:shadow-md transition-shadow relative">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-slate-100 text-slate-600">{addr.addressType || "Home"}</span>
                {addr.isDefault && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-emerald-50 text-emerald-600">Default</span>}
              </div>
              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(addr)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-black"><Pencil size={14} /></button>
                <button onClick={() => onDelete(addr.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
            {/* Added break-words and min-w-0 to handle overflow */}
            <div className="text-sm text-slate-600 leading-relaxed min-w-0">
              <strong className="text-slate-900 block mb-1 break-words">{addr.name}</strong>
              <p className="break-words">{addr.address}, {addr.city}</p>
              <p className="break-words">{addr.state} - {addr.postalCode}</p>
              <p className="mt-2 text-xs font-medium text-slate-400">Phone: {addr.phone}</p>
            </div>
            {!addr.isDefault && (
              <button onClick={() => onSetDefault(addr.id)} className="mt-4 text-xs font-bold text-slate-400 hover:text-black transition-colors">Set as Default</button>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const AddressForm = ({ address, onCancel }) => {
  const { addAddress, editAddress } = useContext(UserContext);
  const isEditing = !!address;
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: address || { name: "", phone: "", altPhone: "", address: "", city: "", state: "", postalCode: "", country: "India", landmark: "", addressType: "Home" }
  });

  const onSubmit = async (data) => {
    try { isEditing ? await editAddress(address.id, data) : await addAddress(data); window.toast.success("Saved"); onCancel(); }
    catch (e) { window.toast.error("Failed"); }
  };

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-bold text-slate-900">{isEditing ? "Edit Address" : "New Address"}</h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <FloatingInput label="Full Name" {...register("name", { required: "Required" })} error={errors.name?.message} />

        <Controller
          control={control}
          name="addressType"
          render={({ field }) => (
            <FloatingDropdown label="Type" value={field.value} onChange={field.onChange} options={["Home", "Work", "Other"]} />
          )}
        />

        <FloatingInput label="Phone" {...register("phone", { required: "Required" })} error={errors.phone?.message} />
        <FloatingInput label="Address Line 1" {...register("address", { required: "Required" })} error={errors.address?.message} />
        <FloatingInput label="Address Line 2" {...register("landmark")} />
        <FloatingInput label="City" {...register("city", { required: "Required" })} error={errors.city?.message} />
        <FloatingInput label="State" {...register("state", { required: "Required" })} error={errors.state?.message} />
        <FloatingInput label="Postal Code" {...register("postalCode", { required: "Required" })} error={errors.postalCode?.message} />
        <FloatingInput label="Country" {...register("country", { required: "Required" })} error={errors.country?.message} />

        <div className="md:col-span-2 flex justify-end gap-4 mt-6">
          <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="px-8 py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">Save Address</button>
        </div>
      </form>
    </motion.div>
  );
};

/* ========================================================================
   6. TAB CONTENT: ORDERS
   ======================================================================== */
const OrderHistory = ({ onOrderClick }) => {
  const { orders, loadingOrders } = useContext(OrderContext);
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return "text-emerald-600 bg-emerald-50";
      case 'shipped': return "text-blue-600 bg-blue-50";
      case 'processing': return "text-amber-600 bg-amber-50";
      case 'cancelled': return "text-red-600 bg-red-50";
      default: return "text-slate-600 bg-slate-50";
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      {loadingOrders && <p className="text-slate-400 text-center py-10">Loading...</p>}
      {!loadingOrders && (!orders || orders.length === 0) && <p className="text-slate-400 text-center py-10">No orders placed yet.</p>}
      {(orders || []).map(order => (
        <motion.button
          key={order.id}
          variants={fadeInUp}
          onClick={() => onOrderClick(order)}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          // Changed to flex-col on mobile, flex-row on desktop for better fit
          className="w-full text-left p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 group"
        >
          <div className="flex gap-4 items-center w-full sm:w-auto">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-black group-hover:text-white transition-colors flex-shrink-0">
              <Package size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-900 text-sm whitespace-nowrap">Order #{order.id.slice(-8)}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">{formatDate(order.createdAt)} • {order.orderItems?.length || 0} Items</p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pl-16 sm:pl-0">
            <span className="font-bold text-slate-900">₹{order.totalAmount}</span>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-black transition-colors" />
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
};

const OrderDetailsModal = ({ order, onClose }) => {
  const { products } = useContext(ProductContext);
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm flex items-center justify-end" onClick={onClose}>
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.3 }} className="bg-white w-full max-w-md h-full shadow-2xl p-6 sm:p-8 overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-900">Order Details</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-50"><X size={20} /></button>
          </div>
          <div className="space-y-6">
            <div className="pb-6 border-b border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Order ID</p>
              {/* Added break-all for long IDs */}
              <p className="text-lg font-mono text-slate-800 break-all">{order.id}</p>
              <p className="text-sm text-slate-500 mt-2">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Items</h4>
              <div className="space-y-4">
                {order.orderItems?.map(item => {
                  const prod = productMap.get(item.productId);
                  return (
                    <div key={item.id} className="flex gap-4">
                      <img src={prod?.imageurl?.[0] || item.img} className="w-16 h-16 rounded-lg object-cover bg-slate-50 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.productName}</p>
                        <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">₹{item.totalPrice}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between text-base font-bold text-slate-900">
                <span>Total</span><span>₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ========================================================================
   7. TAB CONTENT: REVIEWS & NOTIFICATIONS
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

const NotificationSettings = () => {
  const { userdetails, updateUser } = useContext(UserContext);
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

  useEffect(() => {
    if (userdetails) reset({ notify_order_updates: userdetails.notify_order_updates ?? true, notify_promos: userdetails.notify_promos ?? true, notify_pincode: userdetails.notify_pincode ?? true });
  }, [userdetails, reset]);

  const onSave = async (data) => { const ok = await updateUser(data); ok ? window.toast.success("Updated") : window.toast.error("Failed"); reset(data); };

  const SettingRow = ({ label, desc, ...props }) => (
    <label className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-slate-300 transition-all gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 mt-1 break-words">{desc}</p>
      </div>
      <div className="relative flex-shrink-0">
        <input type="checkbox" className="sr-only peer" {...props} />
        <div className="w-11 h-6 bg-slate-200 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
      </div>
    </label>
  );

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Notifications</h3>
      <form onSubmit={handleSubmit(onSave)} className="space-y-4 max-w-xl">
        <SettingRow label="Orders" desc="Updates on shipping and delivery." {...register("notify_order_updates")} />
        <SettingRow label="Promotions" desc="New coupons and sales." {...register("notify_promos")} />
        <SettingRow label="Service Alerts" desc="Pincode service updates." {...register("notify_pincode")} />
        <div className="flex justify-end mt-6">
          <button type="submit" disabled={!isDirty} className="px-8 py-3 bg-black text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50">Save Preferences</button>
        </div>
      </form>
    </motion.div>
  );
};

/* ========================================================================
   8. TAB CONTENT: SUPPORT QUERIES
   ======================================================================== */
const SupportQueries = ({ selectedTicket, setSelectedTicket }) => {
  const { tickets, getUserTickets, replyToTicket } = useContext(ContactContext);
  const { userdetails } = useContext(UserContext);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (userdetails?.email) getUserTickets(userdetails.email);
  }, [userdetails, getUserTickets]);

  useEffect(() => {
    if (selectedTicket && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.messages, selectedTicket?.id]);

  const handleRefresh = async () => {
    if (userdetails?.email) {
      setIsRefreshing(true);
      await getUserTickets(userdetails.email);
      setTimeout(() => setIsRefreshing(false), 800);
      window.toast.success("Inbox updated");
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setLoading(true);
    try {
      await replyToTicket(selectedTicket.id, replyText, 'user');
      const newMsg = {
        senderRole: 'user',
        message: replyText,
        createdAt: new Date().toISOString()
      };
      setSelectedTicket(prev => ({ ...prev, messages: [...prev.messages, newMsg] }));
      await getUserTickets(userdetails.email);
      setReplyText("");
    } catch (error) {
      window.toast.error(error.message || "Message failed");
      await getUserTickets(userdetails.email);
    } finally {
      setLoading(false);
    }
  };

  if (!tickets || tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <MessageSquare className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No support tickets</h3>
        <p className="text-slate-500 mb-6">You haven't reached out to us yet.</p>
        <button onClick={() => window.location.href = '/contact'} className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-black text-white font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
          <Plus size={18} /> Create Ticket
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[650px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-100 bg-white ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-slate-100 bg-white z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Inbox</h3>
            <div className="flex gap-1">
              <button onClick={handleRefresh} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              </button>
              <button onClick={() => window.location.href = '/contact'} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-black transition-colors" title="New Ticket">
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          {tickets.map(ticket => {
            const isSelected = selectedTicket?.id === ticket.id;
            const isOpen = ticket.status?.toLowerCase() === 'open';
            return (
              <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className={`p-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50/80 ${isSelected ? 'bg-indigo-50/30 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-bold truncate pr-2 ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>{ticket.subject}</h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(ticket.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
                <p className="text-xs text-slate-500 truncate mb-2.5 opacity-80">{ticket.messages[ticket.messages.length - 1]?.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">#{ticket.id.slice(0, 6)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{ticket.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-slate-50/50 relative ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
        {selectedTicket ? (
          <>
            <div className="h-16 px-6 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${selectedTicket.status === 'open' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}><Headphones size={16} /></div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{selectedTicket.subject}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">Ticket ID: <span className="font-mono">{selectedTicket.id}</span></p>
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors" title="Close Chat"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="flex justify-center"><span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{new Date(selectedTicket.createdAt).toLocaleDateString()}</span></div>
              {selectedTicket.messages.map((msg, i) => {
                const isUser = msg.senderRole === 'user';
                return (
                  <div key={i} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[85%] sm:max-w-[70%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-1 ${isUser ? 'bg-slate-900 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{isUser ? <UserIcon size={12} /> : <Headphones size={12} />}</div>
                      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${isUser ? 'bg-black text-white rounded-2xl rounded-br-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-sm'}`}><p className="whitespace-pre-wrap">{msg.message}</p></div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            {selectedTicket.status === 'open' ? (
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-400 transition-all">
                  <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReply()} placeholder="Type your reply here..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 py-2 min-h-[44px]" />
                  <button onClick={handleReply} disabled={loading || !replyText.trim()} className="p-3 bg-black hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl transition-all shadow-sm mb-[1px] mr-[1px]">{loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}</button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200"><Lock size={12} /> Ticket Closed</div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100"><MessageSquare className="w-8 h-8 text-indigo-200" /></div>
            <h3 className="text-slate-900 font-semibold mb-1">Support Chat</h3>
            <p className="text-sm text-slate-500">Select a ticket from the left to view details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ========================================================================
   MAIN PAGE LAYOUT
   ======================================================================== */
export default function UserPage() {
  const { userdetails, address } = useContext(UserContext);
  const { orders, loadingOrders } = useContext(OrderContext);
  const { cart, wishlist } = useContext(CartContext);
  const { userReviews } = useContext(ReviewContext);
  const { tickets, getUserTickets } = useContext(ContactContext);

  // State
  const [activeTab, setActiveTab] = useState("profile");
  const [editingAddress, setEditingAddress] = useState(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);

  // 🟢 NEW: State for logs
  const [personalLogs, setPersonalLogs] = useState([]);
  const [globalAdminLogs, setGlobalAdminLogs] = useState([]);

  // Fetch tickets and Logs
  useEffect(() => {
    if (userdetails?.email && userdetails?.id) {
      getUserTickets(userdetails.email);

      // 🟢 1. Fetch Personal Logs (My actions + Actions on me)
      fetch(`${BASE}/api/users/${userdetails.id}/logs`)
        .then(res => res.json())
        .then(data => setPersonalLogs(Array.isArray(data) ? data : []))
        .catch(err => console.error("Failed to fetch user logs", err));

      // 🟢 2. If Admin, Fetch GLOBAL Admin Logs (Combined view of all admins)
      if (userdetails.role === 'admin') {
        fetch(`${BASE}/api/users/admin/all-activity-logs`)
          .then(res => res.json())
          .then(data => setGlobalAdminLogs(Array.isArray(data) ? data : []))
          .catch(err => console.error("Failed to fetch global logs", err));
      }
    }
  }, [userdetails, getUserTickets]);

  const handleNavigateActivity = (item) => {
    if (item.type.includes('order')) {
      setViewingOrder(item.data);
    } else if (item.type === 'ticket') {
      setActiveTab('support');
      setActiveTicket(item.data);
    } else if (item.type === 'review') {
      setActiveTab('reviews');
    }
  };

  if (!userdetails) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  const showAddressForm = isAddingAddress || !!editingAddress;

  return (
    <>
      <div className="min-h-screen bg-slate-50 pt-18 pb-20 px-4 sm:px-8 font-sans text-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDEBAR (Sticky) */}
          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-28">
            <ProfileCard
              user={userdetails}
              wishlistCount={wishlist?.length || 0} cartCount={cart?.length || 0} orderCount={orders?.length || 0}
              onEditProfile={() => setActiveTab('profile')}
            />
            <ProfileCompletion user={userdetails} addressCount={address?.length || 0} />

            {/* 🟢 Log 1: User Activity (Personal) */}
            <AdvancedActivityLog
              orders={orders}
              reviews={userReviews}
              addresses={address}
              tickets={tickets}
              securityLogs={personalLogs} // Pass Personal Logs state
              onNavigate={handleNavigateActivity}
              title="Your Activity"
            />

            {/* 🟢 Log 2: Global Admin History (Visible only to Admin) */}
            {userdetails.role === 'admin' && globalAdminLogs.length > 0 && (
              <AdvancedActivityLog
                orders={[]}
                reviews={[]}
                tickets={[]}
                securityLogs={globalAdminLogs} // Pass Global Logs state
                title="Global Admin History"
                isAdminLog={true}
              />
            )}
          </div>

          {/* RIGHT CONTENT */}
          <div className="lg:col-span-8">
            <TabNavigation activeTab={activeTab} onTabClick={setActiveTab} />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={smoothTransition}
                className="bg-white rounded-[2.5rem] p-4 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[600px]"
              >
                {activeTab === 'profile' && <ProfileSettings />}

                {activeTab === 'addresses' && !showAddressForm && (
                  <AddressSettings onAdd={() => { setEditingAddress(null); setIsAddingAddress(true); }} onEdit={(addr) => { setIsAddingAddress(false); setEditingAddress(addr); }} />
                )}
                {activeTab === 'addresses' && showAddressForm && (
                  <AddressForm address={editingAddress} onCancel={() => { setIsAddingAddress(false); setEditingAddress(null); }} />
                )}

                {activeTab === 'orders' && <OrderHistory onOrderClick={setViewingOrder} />}
                {activeTab === 'reviews' && <ReviewHistory />}
                {activeTab === 'support' && <SupportQueries selectedTicket={activeTicket} setSelectedTicket={setActiveTicket} />}
                {activeTab === 'notifications' && <NotificationSettings />}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>

      {viewingOrder && <OrderDetailsModal order={viewingOrder} onClose={() => setViewingOrder(null)} />}
    </>
  );
}