import React from 'react';
import { 
  LayoutDashboard, Coins, Package, Ticket, MapPin, 
  Star, MessageSquare, User as UserIcon, Bell, 
  LogOut, Clock, IndianRupee, Sparkles 
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- Helper for Profile Placeholder ---
const getDeterministicColor = (s) => {
  const colors = [
    "bg-amber-100 text-amber-700", 
    "bg-zinc-100 text-zinc-700", 
    "bg-indigo-100 text-indigo-700",
    "bg-rose-100 text-rose-700"
  ];
  if (!s) return colors[1];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
};

export default function Sidebar({ user, activeTab, setActiveTab, onSignOut }) {
  
  // --- Organized Menu Order ---
  const menu = [
    // 1. Dashboard
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    
    // 2. Commerce & Rewards (High Priority)
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'wallet', label: 'Aura Circle', icon: Sparkles }, // Changed to CreditCard for "Wallet" feel
    { id: 'earncash', label: 'Earn Cash', icon: IndianRupee },   // Changed to Sparkles to highlight "New/Special"
    { id: 'offers', label: 'Coupons', icon: Ticket },
    
    // 3. Personal Data
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'reviews', label: 'My Reviews', icon: Star },
    
    // 4. Support & System
    { id: 'support', label: 'Support Chat', icon: MessageSquare },
    { id: 'activity_log', label: 'Activity Log', icon: Clock }, // ID matches the Overview link
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: UserIcon },
  ];

  const initials = (user?.name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const avatarBg = getDeterministicColor(user?.email || "user");

  return (
    <div className="bg-white lg:rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] border border-zinc-100 overflow-hidden sticky top-24 z-30">
      
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
      <div className="flex lg:flex-col overflow-x-auto scrollbar-hide p-2 lg:p-4 space-x-1 lg:space-x-0 lg:space-y-1.5 bg-white relative">
        {menu.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 w-auto lg:w-full flex items-center gap-2 lg:gap-3 px-4 py-2.5 lg:py-3.5 rounded-full lg:rounded-2xl text-sm font-medium transition-all relative z-10 
              ${isActive ? "text-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-zinc-900 rounded-full lg:rounded-2xl -z-10 shadow-lg shadow-zinc-900/10"
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
      <div className="hidden lg:block p-4 border-t border-zinc-50 bg-zinc-50/30">
        <button onClick={onSignOut} className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-500 bg-white border border-red-50 hover:bg-red-50 transition-all hover:border-red-100 hover:shadow-sm">
          <LogOut size={16} strokeWidth={2} /> 
          <span className="tracking-wide uppercase text-xs">Sign Out</span>
        </button>
      </div>
    </div>
  );
}