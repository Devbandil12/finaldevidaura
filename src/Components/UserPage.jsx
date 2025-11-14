// src/Components/UserPage.jsx
import React, { useState, useContext, useEffect, useMemo, useCallback, Fragment, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { OrderContext } from "../contexts/OrderContext";
import { CartContext } from "../contexts/CartContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { ReviewContext } from "../contexts/ReviewContext";
import {
  Pencil, MapPin, Package, Star, MessageSquare, ChevronRight, Plus,
  Trash2, CheckCircle, Circle, X, CreditCard,
  ShoppingBag, Bell, Shield, LogOut, User as UserIcon, Camera, ShoppingCart,
  FileText, XCircle, Heart, ChevronLeft, ChevronDown,
} from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { UserProfile } from "@clerk/clerk-react";
import useCloudinary from "../utils/useCloudinary";
import ReactDatePicker from "react-datepicker"; // 👈 ADD THIS
import "react-datepicker/dist/react-datepicker.css"; // 👈 ADD THIS

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
      className={`peer w-full rounded-lg border px-3 pt-5 pb-2 text-sm placeholder-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none ${error ? "border-red-400" : "border-slate-300"}`}
      {...props}
    />
    <label
      className="absolute left-3 -top-2 bg-white px-1 text-slate-500 text-xs transition-all pointer-events-none
      peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-placeholder-shown:text-base
      peer-focus:-top-2 peer-focus:text-xs peer-focus:text-indigo-600"
    >
      {label}
    </label>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
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
        className="peer w-full rounded-lg border border-slate-300 px-3 pt-5 pb-2 text-sm text-left cursor-pointer bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`${!value ? "text-slate-400" : "text-slate-900"}`}>{value || "Select..."}</span>
      </button>
      <label
        className="absolute left-3 -top-2 bg-white px-1 text-slate-500 text-xs"
      >
        {label}
      </label>
      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 w-full bg-white  rounded-xl shadow-lg overflow-hidden"
        >
          {options.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={value === opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer ${value === opt ? "bg-indigo-600 text-white" : "hover:bg-slate-50 text-slate-700"
                }`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


/* ========================================================================
   1. LEFT COLUMN: PROFILE CARD (🟢 REVISED)
   ======================================================================== */
const ProfileCard = ({ user, wishlistCount, cartCount, orderCount, onEditProfile }) => {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [avatarBg, setAvatarBg] = useState("");

  useEffect(() => {
    setAvatarBg(getDeterministicColor(user?.email || "user"));
  }, [user?.email]);

  const initials = (user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // 🟢 Helper component for the stats (REVISED)
  const StatItem = ({ label, count, icon: Icon, path, hoverColor }) => (
    <button
      onClick={() => navigate(path)}
      // 🟢 Added padding, rounded, and hover background
      className="text-center transition-colors duration-200 ease-out py-2 px-8 rounded-2xl hover:bg-slate-100 group"
    >
      <div className="flex justify-center mb-1">
        {/* 🟢 Icon now scales and changes to its unique color on hover */}
        <Icon
          size={20}
          strokeWidth={1.75}
          className={`text-slate-500 mb-2 transition-all duration-200 ease-out group-hover:scale-130 ${hoverColor}`}
        />
      </div>
      <span className="text-xl font-semibold text-slate-900">{count}</span>
      {/* 🟢 Removed hover effect from text */}
      <span className="text-xs text-slate-500 block">{label}</span>
    </button>
  );

  return (
    <div className="bg-white rounded-2xl shadow-[1px_2px_12px_rgba(0,0,0,0.04)]  p-0 h-fit overflow-hidden">
      <div className="h-28 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
      <div className="p-6 pt-4 text-center">
        <div className="relative w-24 h-24 -mt-16 mx-auto rounded-full border-4 border-white shadow-lg">
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className={`w-full h-full rounded-full flex items-center justify-center text-4xl font-semibold ${avatarBg}`}>{initials}</div>
          )}
        </div>
        <button onClick={onEditProfile} className="absolute top-32 right-6 lg:top-4 lg:right-4 flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-medium text-slate-700 bg-white/80 backdrop-blur-sm  hover:bg-white transition-colors cursor-pointer">
          <Pencil size={14} />
          Edit Profile
        </button>

        <h2 className="text-2xl font-bold text-slate-900 m-0 mt-4">{user.name}</h2>
        <div className="text-sm text-slate-500 mt-2 flex flex-col items-center gap-1">
          <span>{user.email}</span>
          <span className="flex items-center gap-2">
            <CreditCard size={14} /> {user.phone || "No phone"}
          </span>
        </div>

        {/* 🟢 MODIFIED STATS SECTION (with new props) */}
        <div className="flex justify-around mt-6 pt-6 border-t border-slate-100">
          <StatItem
            label="Wishlist"
            count={wishlistCount}
            icon={Heart}
            path="/wishlist"
            hoverColor="group-hover:text-pink-600" // 👈 Unique color
          />
          <StatItem
            label="Cart"
            count={cartCount}
            icon={ShoppingCart}
            path="/cart"
            hoverColor="group-hover:text-blue-600" // 👈 Unique color
          />
          <StatItem
            label="Orders"
            count={orderCount}
            icon={Package}
            path="/myorder"
            hoverColor="group-hover:text-amber-600" // 👈 Unique color
          />
        </div>

        <div className="mt-6 flex flex-col space-y-2">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center gap-3 w-full p-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Shield size={16} />
            Security & Settings
          </button>
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex items-center justify-center gap-3 w-full p-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>
    </div>
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
    { label: "At least one address", completed: addressCount > 0 },
  ], [user, addressCount]);

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  const CheckIcon = ({ completed }) => (
    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
      {completed ? <CheckCircle size={14} /> : <Circle size={14} />}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-[1px_2px_12px_rgba(0,0,0,0.04)]  p-6 h-fit">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-slate-900 m-0">Profile Completion</h3>
        <span className="text-sm font-medium text-emerald-600">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-3 text-sm">
            <CheckIcon completed={item.completed} />
            <span className={item.completed ? 'text-slate-500 line-through' : 'text-slate-700'}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ========================================================================
   3. LEFT COLUMN: RECENT ACTIVITY
   ======================================================================== */
const RecentActivity = ({ orders, reviews, addresses, queries }) => {
  const activityItems = useMemo(() => {
    let allItems = [];
    const TIME_THRESHOLD = 60000; // 1 minute threshold to check for updates

    // --- Orders: Placed, Shipped, Delivered, Cancelled ---
    orders.forEach(o => {
      allItems.push({
        type: "order",
        id: `order-placed-${o.id}`,
        label: `Placed order #${o.id}`,
        date: new Date(o.createdAt),
        icon: ShoppingBag
      });
      const createdTime = new Date(o.createdAt).getTime();
      const updatedTime = new Date(o.updatedAt).getTime();

      if (updatedTime > createdTime + TIME_THRESHOLD) {
        if (o.status === 'Order Cancelled') {
          allItems.push({
            type: "cancelled",
            id: `order-cancel-${o.id}`,
            label: `Cancelled order #${o.id}`,
            date: new Date(o.updatedAt),
            icon: XCircle
          });
        } else if (o.status === 'Shipped' || o.status === 'Delivered') {
          allItems.push({
            type: "order",
            id: `order-update-${o.id}`,
            label: `Order #${o.id} is now ${o.status}`,
            date: new Date(o.updatedAt),
            icon: ShoppingBag
          });
        }
      }
    });

    // --- Reviews: Created vs Updated ---
    reviews.forEach(r => {
      const createdTime = new Date(r.createdAt).getTime();
      const updatedTime = new Date(r.updatedAt).getTime();

      if (updatedTime > createdTime + TIME_THRESHOLD) {
        allItems.push({
          type: "review",
          id: `review-updated-${r.id}`,
          label: `You updated a review`,
          date: new Date(r.updatedAt),
          icon: Star
        });
      } else {
        allItems.push({
          type: "review",
          id: `review-created-${r.id}`,
          label: `You wrote a review`,
          date: new Date(r.createdAt),
          icon: Star
        });
      }
    });

    // --- Addresses: Created vs Updated ---
    addresses.forEach(a => {
      const createdTime = new Date(a.createdAt).getTime();
      const updatedTime = new Date(a.updatedAt).getTime();

      if (updatedTime > createdTime + TIME_THRESHOLD) {
        allItems.push({
          type: "address",
          id: `address-updated-${a.id}`,
          label: `Updated ${a.addressType || 'your'} address`,
          date: new Date(a.updatedAt),
          icon: MapPin
        });
      } else {
        allItems.push({
          type: "address",
          id: `address-created-${a.id}`,
          label: `Added ${a.addressType || 'new'} address`,
          date: new Date(a.createdAt),
          icon: MapPin
        });
      }
    });

    // --- Queries: Raised ---
    queries.forEach(q => {
      allItems.push({
        type: "query",
        id: `query-${q.id || q.createdAt}`,
        label: `You raised a new query`,
        date: new Date(q.createdAt),
        icon: FileText
      });
    });

    return allItems
      .sort((a, b) => b.date - a.date)
      .slice(0, 5); // Get top 5 recent

  }, [orders, reviews, addresses, queries]);

  return (
    <div className="bg-white rounded-2xl shadow-[1px_2px_12px_rgba(0,0,0,0.04)]  p-6 h-fit">
      <h3 className="text-base font-semibold text-slate-900 mb-4">Recent Activity</h3>
      <div className="flex flex-col gap-5">
        {activityItems.length === 0 && (
          <p className="text-sm text-gray-500">No recent activity found.</p>
        )}
        {activityItems.map(item => (
          <div key={item.id} className="flex gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${item.type === 'order' && 'bg-indigo-100 text-indigo-600'}
                ${item.type === 'review' && 'bg-amber-100 text-amber-600'}
                ${item.type === 'address' && 'bg-green-100 text-green-600'}
                ${item.type === 'query' && 'bg-blue-100 text-blue-600'}
                ${item.type === 'cancelled' && 'bg-red-100 text-red-600'}
              `}
            >
              <item.icon size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 line-clamp-2">{item.label}</p>
              <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


/* ========================================================================
   4. RIGHT COLUMN: TAB NAVIGATION
   ======================================================================== */
const TABS = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'support', label: 'Support', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const TabNavigation = ({ activeTab, onTabClick }) => (
  <nav className="flex items-center justify-around gap-2 p-1.5 bg-slate-100 rounded-lg mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
    {TABS.map(tab => (
      <button
        key={tab.id}
        onClick={() => onTabClick(tab.id)}
        className={`flex items-center justify-center gap-2 py-2.5 px-2 sm:px-4 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-200 whitespace-nowrap
          ${activeTab === tab.id
            ? 'bg-white text-indigo-600 shadow-[1px_2px_12px_rgba(0,0,0,0.04)]'
            : 'text-slate-600 hover:bg-slate-200'
          }
        `}
        title={tab.label}
      >
        <tab.icon size={16} />
        <span className="hidden sm:inline">{tab.label}</span>
      </button>
    ))}
  </nav>
);

const CustomDropdown = ({ value, options, onChange, buttonClassName, listClassName, wrapperClassName }) => { // 👈 ADDED wrapperClassName
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    // 👇 APPLIED wrapperClassName HERE
    <div className={`relative ${wrapperClassName || ''}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className={buttonClassName}
      >
        <span>{value}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>
      {isOpen && (
        <ul
          // 👇 Ensure w-full so it matches the wrapper's width
          className={`absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-lg bg-white shadow-lg  focus:outline-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${listClassName || ''}`}
        >
          {options.map(option => (
            <li
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className="px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ========================================================================
   NEW: Custom DatePicker Header
   ======================================================================== */
/* ========================================================================
    UPDATED: Custom DatePicker Header
   ======================================================================== */

const CustomDatePickerHeader = ({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    // 👇 REMOVED border-b and pb-3, added pb-2 for spacing
    <div className="flex justify-between items-center p-2 pb-2">
      <button
        type="button"
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        // 👇 Made hover style consistent
        className="p-1 rounded-md hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex gap-1"> {/* Reduced gap slightly */}
        <CustomDropdown
          wrapperClassName="w-32"
          value={months[date.getMonth()]}
          options={months}
          onChange={(month) => changeMonth(months.indexOf(month))}
          // 👇 NEW CLEANER STYLE: No border, no bg, bolder font
          buttonClassName="flex justify-between items-center w-full cursor-pointer rounded-md py-1 px-2 text-base font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none"
          listClassName="max-h-48"
        />
        <CustomDropdown
          wrapperClassName="w-24"
          value={date.getFullYear()}
          options={years}
          onChange={(year) => changeYear(year)}
          // 👇 NEW CLEANER STYLE: No border, no bg, bolder font
          buttonClassName="flex justify-between items-center w-full cursor-pointer rounded-md py-1 px-2 text-base font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none"
          listClassName="max-h-48"
        />
      </div>

      <button
        type="button"
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        // 👇 Made hover style consistent
        className="p-1 rounded-md hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

/* ========================================================================
   5. RIGHT COLUMN: "PROFILE" TAB CONTENT (with Image Upload)
   ======================================================================== */
const ProfileSettings = () => {
  const { userdetails, updateUser } = useContext(UserContext);
  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors, isDirty: isFormDirty } } = useForm();
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
        name: userdetails.name || "",
        phone: userdetails.phone || "",
        dob: userdetails.dob ? new Date(userdetails.dob) : null,
        gender: userdetails.gender || "",
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
        const ok = await updateUser(payload);
        if (ok) {
          message = "Profile updated. ";
          reset({ ...data, dob: data.dob });
        } else {
          throw new Error("Failed to update profile text");
        }
      }

      if (isImageDirty) {
        await updateUser({ profileImage: localUrl });
        setIsImageDirty(false);
        message += "Image updated.";
      }

      window.toast.success(message.trim() || "No changes to save.");

    } catch (e) {
      window.toast.error(e.message || "Error updating profile");
    }
  };

  const handleFileSelect = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setUploading(true);
      const url = await uploadImage(f);
      setLocalUrl(url);
      setIsImageDirty(true);
      window.toast.success("Image ready to be saved");
    } catch (err) {
      window.toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setLocalUrl(null);
    setIsImageDirty(true);
  };

  const avatarBg = getDeterministicColor(userdetails?.email || "user");
  const initials = (userdetails?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Edit Profile</h3>
      </div>

      {/* --- AVATAR UPLOAD SECTION (Unchanged) --- */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative w-24 h-24">
          <div className="relative w-24 h-24 rounded-full border-2 border-slate-100">
            {localUrl ? (
              <img src={localUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className={`w-full h-full rounded-full flex items-center justify-center text-4xl font-semibold ${avatarBg}`}>{initials}</div>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-indigo/40 flex items-center justify-center text-white text-xs">
                Uploading...
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50"
            title="Change photo"
          >
            <Camera size={16} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium cursor-pointer transition-colors hover:bg-indigo-700"
          >
            Change Photo
          </button>
          {localUrl && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium cursor-pointer transition-colors hover:bg-slate-200"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* --- FORM SECTION --- */}
      <form onSubmit={handleSubmit(onProfileSave)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <FloatingInput
            label="Full Name"
            {...register("name", { required: "Name is required" })}
            error={errors.name?.message}
          />
        </div>
        <div>
          <FloatingInput
            label="Phone Number"
            {...register("phone", { minLength: { value: 6, message: "Phone too short" } })}
            error={errors.phone?.message}
          />
        </div>

        <div>
          <Controller
            control={control}
            name="dob"
            render={({ field }) => (
              <ReactDatePicker
                selected={field.value}
                onChange={(date) => field.onChange(date)}

                customInput={<FloatingInput label="Date of Birth" />}

                renderCustomHeader={CustomDatePickerHeader}
                dateFormat="MMMM d, yyyy"
                maxDate={new Date()}
                showPopperArrow={false}
                showWeekDays={false}
              />
            )}
          />
        </div>

        <div className="md:col-span-2">
          <FloatingDropdown
            label="Gender"
            value={watch("gender")}
            onChange={(val) => setValue("gender", val, { shouldDirty: true })}
            options={["Male", "Female", "Other"]}
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium cursor-pointer transition-colors hover:bg-indigo-700 disabled:bg-slate-300"
            disabled={!isDirty}
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

/* ========================================================================
   6. RIGHT COLUMN: "ADDRESSES" TAB CONTENT
   ======================================================================== */
const AddressSettings = ({ onAdd, onEdit }) => {
  const { address, deleteAddress, setDefaultAddress } = useContext(UserContext);

  const onDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      const result = await deleteAddress(id);
      if (result && result.success) {
        window.toast.success("Address deleted");
      } else {
        window.toast.error(result?.message || "Failed to delete address.");
      }
    }
  };

  const onSetDefault = async (id) => {
    await setDefaultAddress(id);
    window.toast.success("Default address set");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Saved Addresses</h3>
        <button onClick={onAdd} className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium cursor-pointer transition-colors hover:bg-indigo-700">
          <Plus size={16} />
          Add New
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {address.length === 0 && (
          <p className="text-sm text-slate-500 md:col-span-2">You have no saved addresses.</p>
        )}
        {address.map(addr => (
          <div key={addr.id} className="border border-slate-100 shadow-[1px_2px_12px_rgba(0,0,0,0.04)] rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex gap-2">
                <span className="text-xs font-medium px-3 py-0.5 rounded-full bg-slate-100 text-slate-700">{addr.addressType || "Home"}</span>
                {addr.isDefault && (
                  <span className="text-xs font-medium px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Default</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(addr)} className="bg-transparent border-none cursor-pointer text-slate-500 p-1 rounded-md hover:bg-slate-100 hover:text-slate-800" title="Edit">
                  <Pencil size={16} />
                </button>
                <button onClick={() => onDelete(addr.id)} className="bg-transparent border-none cursor-pointer text-slate-500 p-1 rounded-md hover:bg-red-50 hover:text-red-600" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="text-sm text-slate-600 line-clamp-3">
              <strong className="font-semibold text-slate-800">{addr.name}</strong>
              <p className="mt-1">
                {addr.address}<br />
                {addr.city}, {addr.state} {addr.postalCode}<br />
                {addr.country}
              </p>
              <p className="mt-2">
                <span className="font-medium">Phone:</span> {addr.phone}
              </p>
            </div>
            {!addr.isDefault && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button onClick={() => onSetDefault(addr.id)} className="bg-transparent border-none text-sm font-medium text-indigo-600 cursor-pointer p-0 hover:text-indigo-800 disabled:text-slate-400 disabled:cursor-not-allowed">
                  Set as Default
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// The form for adding/editing an address
const AddressForm = ({ address, onCancel }) => {
  const { addAddress, editAddress } = useContext(UserContext);
  const isEditing = !!address;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: address || {
      name: "", phone: "", altPhone: "", address: "", city: "", state: "", postalCode: "", country: "India", landmark: "", addressType: "Home"
    }
  });

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await editAddress(address.id, data);
        window.toast.success("Address updated");
      } else {
        await addAddress(data);
        window.toast.success("Address added");
      }
      onCancel(); // Close the form
    } catch (e) {
      window.toast.error("Failed to save address");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900">{isEditing ? "Edit Address" : "Add New Address"}</h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FloatingInput label="Full Name" {...register("name", { required: "Name is required" })} error={errors.name} />
        <FloatingDropdown label="Address Label" {...register("addressType")} options={["Home", "Work", "Other"]} />
        <FloatingInput label="Phone Number" {...register("phone", { required: "Phone is required" })} error={errors.phone} />
        <FloatingInput label="Address Line 1" {...register("address", { required: "Address is required" })} error={errors.address} />
        <FloatingInput label="Address Line 2 (Optional)" {...register("landmark")} />
        <FloatingInput label="City" {...register("city", { required: "City is required" })} error={errors.city} />
        <FloatingInput label="State" {...register("state", { required: "State is required" })} error={errors.state} />
        <FloatingInput label="Postal Code" {...register("postalCode", { required: "Pincode is required" })} error={errors.postalCode} />
        <FloatingInput label="Country" {...register("country", { required: "Country is required" })} error={errors.country} />

        <div className="md:col-span-2 flex justify-end gap-4 mt-4">
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium cursor-pointer transition-colors hover:bg-slate-200">
            Cancel
          </button>
          <button type="submit" className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium cursor-pointer transition-colors hover:bg-indigo-700">
            {isEditing ? "Update Address" : "Save Address"}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ========================================================================
   7. RIGHT COLUMN: "ORDERS" TAB CONTENT (🟢 REVISED)
   ======================================================================== */
const OrderHistory = ({ onOrderClick }) => {
  const { orders, loadingOrders } = useContext(OrderContext);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return "bg-green-100 text-green-700";
      case 'shipped': return "bg-blue-100 text-blue-700";
      case 'processing': return "bg-yellow-100 text-yellow-700";
      case 'order cancelled': return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Order History</h3>
      </div>
      <div className="flex flex-col gap-4">
        {loadingOrders && <p>Loading orders...</p>}
        {!loadingOrders && orders.length === 0 && (
          <p className="text-sm text-slate-500">You have not placed any orders yet.</p>
        )}
        {orders.map(order => (
          <button
            key={order.id}
            onClick={() => onOrderClick(order)}
            /* * 👇 REDESIGNED:
             * - Removed all hover effects (no more lift or shadow change)
             * - Replaced `shadow-md` with a very soft custom shadow
             * - Kept rounded-xl and p-5 for the clean card look
             */
            className="w-full text-left p-5 bg-white rounded-xl 
                       shadow-[0_2px_10px_rgba(0,0,0,0.05)] 
                       flex justify-between items-center"
          >
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900">{order.id}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500 mt-1">
                <span>{formatDate(order.createdAt)}</span>
                <span className="text-gray-300">•</span>
                <span>{order.orderItems?.length || 0} item(s)</span>
                <span className="text-gray-300">•</span>
                <span className="font-bold text-slate-800">₹{order.totalAmount}</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

// Modal for Order Details
const OrderDetailsModal = ({ order, onClose }) => {
  const { products } = useContext(ProductContext);
  const productMap = useMemo(() => {
    const m = new Map();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);
  const findProduct = useCallback((id) => productMap.get(id), [productMap]);

  return (
    /* * 👇 Z-INDEX FIXED: Changed z-50 to z-[99999]
     */
    <div className="fixed inset-0 z-[99999] flex items-start justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-indigo/30 backdrop-blur-sm" aria-hidden="true"></div>
      <div
        className="relative bg-white w-full max-w-md h-full shadow-xl p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Order Details</h3>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* * 👇 REDESIGNED: Removed bg-gray-50, using a clean divider
           */
          }
          <div className="pb-6 border-b border-slate-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium text-slate-800">{order.id}</p>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Order Date: {formatDate(order.createdAt)}</p>
          </div>

          <div>
            <h4 className="font-medium text-slate-800 mb-2">Items</h4>
            {/* * 👇 REDESIGNED: Using divide-y for a cleaner list
             */
            }
            <div className="flex flex-col divide-y divide-slate-100">
              {order.orderItems?.map(item => {
                const product = findProduct(item.productId);
                const img = product?.imageurl?.[0] || item.img;
                return (
                  <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    {/* 👇 BORDER REMOVED from img */}
                    <img src={img} alt={item.productName} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-grow">
                      <p className="font-medium text-sm text-slate-800">{item.productName}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-slate-800">₹{item.totalPrice}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* * 👇 REDESIGNED: Cleaned up totals, using one divider before the final total
           */
          }
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <p className="text-gray-500">Subtotal</p>
              <p className="font-medium text-slate-800">₹{order.totalAmount - (order.deliveryCharge || 0)}</p>
            </div>
            <div className="flex justify-between text-sm">
              <p className="text-gray-500">Shipping</p>
              <p className="font-medium text-slate-800">{order.deliveryCharge ? `₹${order.deliveryCharge}` : "Free"}</p>
            </div>
            <div className="flex justify-between font-bold text-lg pt-4 mt-4 border-t border-slate-100">
              <p className="text-slate-900">Total</p>
              <p className="text-slate-900">₹{order.totalAmount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
/* ========================================================================
   8. RIGHT COLUMN: "REVIEWS" TAB CONTENT (🟢 REVISED)
   ======================================================================== */
const ReviewHistory = () => {
  const { userReviews, loadingReviews } = useContext(ReviewContext);
  const { products } = useContext(ProductContext);
  const navigate = useNavigate();

  const productMap = useMemo(() => {
    const m = new Map();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900">My Reviews</h3>
      </div>

      {/* 👇 Increased gap between cards */}
      <div className="flex flex-col gap-5">
        {loadingReviews && <p>Loading reviews...</p>}
        {!loadingReviews && userReviews.length === 0 && (
          <p className="text-sm text-slate-500">You have not written any reviews yet.</p>
        )}

        {userReviews.map(review => {
          const product = productMap.get(review.productId);
          return (
            /* * 👇 REDESIGNED CARD:
             * - Replaced with the soft shadow you like
             * - Removed all borders
             * - Increased padding to p-5 and using rounded-xl
             */
            <div key={review.id} className="p-5 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
              <div className="flex gap-4">

                {/* 👇 Image: border removed, size slightly smaller */}
                <img
                  src={product?.imageurl?.[0]}
                  alt={product?.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />

                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    {/* Product Name & Stars */}
                    <div>
                      {/* 👇 Typography: Bolder product name */}
                      <h4 className="font-semibold text-slate-900">{product?.name || "Product"}</h4>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < review.rating ? "text-amber-400" : "text-gray-300"}
                            fill={i < review.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => navigate(`/product/${review.productId}`, { state: { editReviewId: review.id } })}
                      className="flex-shrink-0 p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Edit Review"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>

                  {/* 👇 Spacing & Typography: Increased top margin, consistent text color */}
                  <p className="text-sm text-slate-700 mt-3">{review.comment}</p>

                  {/* 👇 Typography: Lighter date text */}
                  <p className="text-xs text-slate-400 mt-2">{formatDate(review.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ========================================================================
   9. RIGHT COLUMN: "SUPPORT" TAB CONTENT
   ======================================================================== */
const SupportQueries = () => {
  const { queries } = useContext(ContactContext);

  const onNewQuery = () => {
    alert("New Query form would open here. (This can be built next!)");
  };

  const getStatusBadge = (reply) => {
    return reply
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-700";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Support Queries</h3>
        <button onClick={onNewQuery} className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium cursor-pointer transition-colors hover:bg-indigo-700">
          <Plus size={16} />
          New Query
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {queries.length === 0 && (
          <p className="text-sm text-slate-500">You have no support queries.</p>
        )}
        {queries.map((query) => (
          <div key={query.id || query.createdAt} className="p-4 bg-white rounded-lg shadow-[1px_2px_12px_rgba(0,0,0,0.04)] border border-gray-200">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-slate-800">
                {query.subject || `Query from ${formatDate(query.createdAt)}`}
              </h4>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadge(query.reply)}`}>
                {query.reply ? "Resolved" : "Pending"}
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-2">{query.message}</p>

            {query.reply && (
              <div className="mt-4 p-3 bg-slate-50 border-l-4 border-indigo-500 rounded-r-lg">
                <p className="text-sm font-medium text-indigo-700">Support Team Reply</p>
                <p className="text-sm text-gray-700 mt-1">{query.reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ========================================================================
   10. RIGHT COLUMN: "NOTIFICATIONS" TAB CONTENT
   ======================================================================== */
const SettingRow = ({ label, description, ...regProps }) => (
  <label
    // 👇 Increased vertical padding and changed hover effect
    className="flex items-center justify-between py-5 px-4 cursor-pointer hover:bg-indigo-50 transition-colors duration-150"
  >

    {/* Text Content */}
    <div>
      {/* 👇 Adjusted font weight and color for a softer look */}
      <span className="font-medium text-slate-800">{label}</span>
      {/* 👇 Lightened description text slightly */}
      <span className="text-sm text-slate-600">{description}</span>
    </div>

    {/* Toggle Switch */}
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        className="sr-only peer"
        {...regProps}
      />
      {/* The track (sleeker: w-10 h-5) */}
      <div
        className="w-10 h-5 bg-slate-200 rounded-full 
                   peer 
                   peer-focus:outline-none 
                   peer-focus:ring-2 
                   peer-focus:ring-offset-2 
                   peer-focus:ring-indigo-500 
                   peer-checked:bg-indigo-600"
      ></div>
      {/* The knob (smaller, borderless, and repositioned) */}
      <div
        className="absolute top-[2px] left-[2px] w-4 h-4 
                   bg-white 
                   rounded-full 
                   shadow-sm 
                   transition-transform 
                   peer-checked:translate-x-5" // 👈 Was translate-x-full
      ></div>
    </div>
  </label>
);

/* ========================================================================
   2. UPDATED: NotificationSettings Component
   ======================================================================== */

const NotificationSettings = () => {
  const { userdetails, updateUser } = useContext(UserContext);
  // The form logic is unchanged
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

  useEffect(() => {
    if (userdetails) {
      reset({
        notify_order_updates: userdetails.notify_order_updates ?? true,
        notify_promos: userdetails.notify_promos ?? true,
        notify_pincode: userdetails.notify_pincode ?? true,
      });
    }
  }, [userdetails, reset]);

  const onSave = async (data) => {
    try {
      const ok = await updateUser(data);
      if (ok) {
        window.toast.success("Preferences updated");
        reset(data); // Resets the "dirty" state
      } else {
        window.toast.error("Failed to update preferences");
      }
    } catch (e) {
      window.toast.error("Error updating preferences");
    }
  };

  // Note: The Checkbox component is replaced by SettingRow defined above

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Notification Preferences</h3>
      </div>

      {/* --- REDESIGNED FORM --- */}
      <form onSubmit={handleSubmit(onSave)} className="max-w-lg">

        {/* We create a "grouped" list for a cleaner, modern look */}
        <div className="overflow-hidden rounded-lg  divide-y divide-slate-200">

          <SettingRow
            label="Order Updates"
            description="Get notified about order confirmation, shipping, and delivery."
            {...register("notify_order_updates")}
          />

          <SettingRow
            label="Promos & New Offers"
            description="Receive notifications about new coupons and special sales."
            {...register("notify_promos")}
          />

          <SettingRow
            label="Pincode & Service Alerts"
            description="Get an alert if we start delivering to your saved pincodes."
            {...register("notify_pincode")}
          />

        </div>

        {/* Save button, with a bit more top margin */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium cursor-pointer transition-colors hover:bg-indigo-700 disabled:bg-slate-300"
            disabled={!isDirty}
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};


/* ========================================================================
   ========================================================================
   MAIN USER PAGE COMPONENT
   ========================================================================
   ======================================================================== */
export default function UserPage() {
  const { userdetails, address, addAddress, editAddress, deleteAddress, setDefaultAddress } = useContext(UserContext);
  const { orders, loadingOrders } = useContext(OrderContext);
  const { cart, wishlist } = useContext(CartContext);
  const { userReviews, loadingReviews } = useContext(ReviewContext);
  const { queries } = useContext(ContactContext);

  const [activeTab, setActiveTab] = useState("profile"); // Default to Profile
  const [editingAddress, setEditingAddress] = useState(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  // Memoized counts for the Profile Card
  const wishlistCount = useMemo(() => wishlist?.length || 0, [wishlist]);
  const cartCount = useMemo(() => cart?.length || 0, [cart]);
  const orderCount = useMemo(() => orders?.length || 0, [orders]);

  if (!userdetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading account details...
      </div>
    );
  }

  // Show the Address Form (Add or Edit)
  const showAddressForm = isAddingAddress || !!editingAddress;

  // This is the "Edit Profile" button handler
  const handleEditProfile = () => {
    setActiveTab("profile");
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsAddingAddress(true);
  };

  const handleEditAddress = (addr) => {
    setIsAddingAddress(false);
    setEditingAddress(addr);
  };

  const handleCancelAddressForm = () => {
    setIsAddingAddress(false);
    setEditingAddress(null);
  };

  return (
    <>
      <title>My Account | Devid Aura</title>
      <div className="min-h-screen bg-slate-50 p-6 md:p-12 pt-[100px]">
        <div className="max-w-7xl mt-2 mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* =======================
              LEFT COLUMN
              ======================= */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <ProfileCard
              user={userdetails}
              wishlistCount={wishlistCount}
              cartCount={cartCount}
              orderCount={orderCount}
              onEditProfile={handleEditProfile}
            />
            <ProfileCompletion
              user={userdetails}
              addressCount={address?.length || 0}
            />
            <RecentActivity
              orders={orders}
              reviews={userReviews}
              addresses={address}
              queries={queries} // 🟢 Pass queries
            />
          </div>

          {/* =======================
              RIGHT COLUMN
              ======================= */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-[1px_2px_12px_rgba(0,0,0,0.04)]  p-0 sm:p-0 h-fit">
              <TabNavigation activeTab={activeTab} onTabClick={setActiveTab} />

              <div className="p-4 sm:p-6">
                {activeTab === 'profile' && (
                  <ProfileSettings />
                )}

                {activeTab === 'addresses' && !showAddressForm && (
                  <AddressSettings
                    onAdd={handleAddAddress}
                    onEdit={handleEditAddress}
                  />
                )}

                {showAddressForm && activeTab === 'addresses' && (
                  <AddressForm
                    address={editingAddress}
                    onCancel={handleCancelAddressForm}
                  />
                )}

                {activeTab === 'orders' && (
                  <OrderHistory onOrderClick={setViewingOrder} />
                )}

                {activeTab === 'reviews' && (
                  <ReviewHistory />
                )}

                {activeTab === 'support' && (
                  <SupportQueries />
                )}

                {/* 🟢 FIXED 'activeToob' TYPO */}
                {activeTab === 'notifications' && (
                  <NotificationSettings />
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =======================
          MODALS (PORTALS)
          ======================= */}
      {viewingOrder && (
        <OrderDetailsModal
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
        />
      )}
    </>
  );
}