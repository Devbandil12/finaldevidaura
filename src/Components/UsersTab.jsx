import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Download, Search, User, Mail, Phone, MapPin, Calendar, 
  Shield, Trash2, ExternalLink, ArrowLeft, Package, CheckCircle, 
  ArrowUpDown, ChevronDown, Check
} from 'lucide-react';

// --- CUSTOM SORT DROPDOWN ---
const SortDropdown = ({ currentSort, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { label: "Sort: Newest Joined", value: "newest" },
    { label: "Sort: Most Delivered", value: "most-delivered" }
  ];

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value) => {
    onSortChange(value);
    setIsOpen(false);
  };

  const currentLabel = options.find(o => o.value === currentSort)?.label;

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full sm:w-56 flex items-center justify-between px-4 py-3 bg-white border rounded-xl shadow-sm text-sm font-medium transition-all ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
      >
        <div className="flex items-center gap-2 truncate">
          <ArrowUpDown size={16} className="text-gray-400" />
          <span>{currentLabel}</span>
        </div>
        <ChevronDown size={16} className={`ml-2 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-full sm:w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-75">
          <div className="p-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-3 py-2.5 text-sm font-medium flex items-center justify-between rounded-lg transition-colors ${currentSort === option.value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {option.label}
                {currentSort === option.value && <Check size={16} className="text-indigo-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
const UsersTab = ({ 
  users, filteredUsers, userSearchQuery, setUserSearchQuery, 
  editingUser, setEditingUser, handleEditUser, handleDeleteUser, downloadCSV 
}) => {

  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'most-delivered'

  // --- SORTING LOGIC ---
  const sortedUsers = useMemo(() => {
    if (!filteredUsers) return [];
    const sorted = [...filteredUsers];
    const getDeliveredCount = (user) => user.orders?.filter(o => o.status === 'Delivered').length || 0;

    if (sortBy === 'most-delivered') {
      return sorted.sort((a, b) => getDeliveredCount(b) - getDeliveredCount(a));
    } else {
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [filteredUsers, sortBy]);

  const getAvatarColor = (name) => {
    const colors = ["bg-red-100 text-red-600", "bg-orange-100 text-orange-600", "bg-amber-100 text-amber-600", "bg-green-100 text-green-600", "bg-teal-100 text-teal-600", "bg-blue-100 text-blue-600", "bg-indigo-100 text-indigo-600", "bg-purple-100 text-purple-600", "bg-pink-100 text-pink-600"];
    return colors[(name ? name.length : 0) % colors.length];
  };

  const getOrderStatusBadge = (status) => {
    const styles = {
      "Delivered": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Shipped": "bg-blue-100 text-blue-700 border-blue-200",
      "Processing": "bg-amber-100 text-amber-700 border-amber-200",
      "Order Cancelled": "bg-red-100 text-red-700 border-red-200",
      "Order Placed": "bg-gray-100 text-gray-700 border-gray-200",
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[status] || styles["Order Placed"]}`}>{status}</span>;
  };

  const UserAvatar = ({ user, size = "md", className = "" }) => {
    const [imgError, setImgError] = useState(false);
    const imgSrc = user.image || user.avatar || user.imageUrl || user.profileImage;
    const sizeClasses = { sm: "w-10 h-10 text-sm", md: "w-12 h-12 text-lg", lg: "w-24 h-24 text-3xl" };

    if (imgSrc && !imgError) {
      return <img src={imgSrc} alt={user.name} onError={() => setImgError(true)} className={`object-cover rounded-full border border-gray-100 shadow-sm bg-white ${sizeClasses[size]} ${className}`} />;
    }
    return <div className={`rounded-full flex items-center justify-center font-bold shadow-sm ${getAvatarColor(user.name)} ${sizeClasses[size]} ${className}`}>{user.name ? user.name.charAt(0).toUpperCase() : "?"}</div>;
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 bg-gray-50 min-h-screen text-gray-900 font-sans">
      
      {/* --- HEADER (List View Only) --- */}
      {!editingUser && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 flex items-center">
              <User className="w-6 h-6 mr-3 text-indigo-600" /> User Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage customer accounts and details.</p>
          </div>
          <button onClick={() => downloadCSV(users, 'users.csv')} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-black hover:text-white hover:border-black transition text-sm font-semibold shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </button>
        </div>
      )}

      {/* --- CONTENT --- */}
      {editingUser ? (
        
        /* ---------------- DETAILS VIEW ---------------- */
        <div className="max-w-5xl mx-auto animate-in slide-in-from-right-4 duration-300 pb-10">
          
          <button onClick={() => setEditingUser(null)} className="flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to User List
          </button>

          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
              <UserAvatar user={editingUser} size="lg" className="ring-4 ring-gray-50" />
              <div className="flex-1 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{editingUser.name}</h1>
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500 justify-center md:justify-start">
                      <div className="flex items-center gap-1.5"><Mail size={16} className="text-gray-400"/>{editingUser.email}</div>
                      <span className="hidden sm:inline text-gray-300">|</span>
                      <div className="flex items-center gap-1.5"><Shield size={16} className="text-gray-400"/><span className="capitalize">{editingUser.role}</span></div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex gap-4 w-full sm:w-auto justify-center">
                    <div className="flex-1 sm:flex-none px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-center min-w-[100px]">
                        <p className="text-xs text-gray-500 font-bold uppercase">Joined</p>
                        <p className="text-sm font-semibold text-gray-900">{new Date(editingUser.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100 text-center min-w-[100px]">
                        <p className="text-xs text-indigo-500 font-bold uppercase">Orders</p>
                        <p className="text-sm font-semibold text-indigo-900">{editingUser.orders?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={14}/> Personal Details</h3>
                <div className="space-y-4">
                  <div><label className="text-xs text-gray-500 font-medium">Email</label><div className="flex items-center gap-2 mt-1 text-sm font-medium text-gray-900 break-all"><Mail size={16} className="text-gray-400 flex-shrink-0"/> {editingUser.email}</div></div>
                  <div><label className="text-xs text-gray-500 font-medium">Phone</label><div className="flex items-center gap-2 mt-1 text-sm font-medium text-gray-900"><Phone size={16} className="text-gray-400 flex-shrink-0"/> {editingUser.phone || 'Not Provided'}</div></div>
                  <div><label className="text-xs text-gray-500 font-medium">Role</label><div className="flex items-center gap-2 mt-1 text-sm font-medium text-gray-900"><Shield size={16} className="text-gray-400 flex-shrink-0"/> <span className="capitalize">{editingUser.role}</span></div></div>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin size={14}/> Saved Addresses</h3>
                {editingUser.addresses?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {editingUser.addresses.map((address) => (
                      <div key={address.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 hover:border-indigo-200 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600 mt-1 flex-shrink-0"><MapPin size={16} /></div>
                          <div className="text-sm flex-1">
                            <p className="font-bold text-gray-900 mb-1">{address.city}, {address.state}</p>
                            <p className="text-gray-600 leading-relaxed text-xs line-clamp-2">{address.address}</p>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200"><p className="text-gray-500 text-xs font-mono">{address.zipCode}</p><p className="text-[10px] font-bold text-gray-400 uppercase">{address.country}</p></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <MapPin className="w-8 h-8 text-gray-300 mb-2" /><p className="text-sm text-gray-500 font-medium">No addresses found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-2 justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Package size={16} className="text-indigo-600"/> Order History</h3>
                <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">{editingUser.orders?.length || 0} Orders</span>
            </div>
            {editingUser.orders && editingUser.orders.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-white text-gray-500 border-b border-gray-100 text-xs uppercase font-semibold">
                            <tr><th className="px-6 py-3">Order ID</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Total Amount</th><th className="px-6 py-3 text-right">Items</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {editingUser.orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">#{order.id}</td>
                                    <td className="px-6 py-4 text-gray-500"><div className="flex items-center gap-2"><Calendar size={14}/>{new Date(order.createdAt).toLocaleDateString()}</div></td>
                                    <td className="px-6 py-4">{getOrderStatusBadge(order.status)}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">₹{order.totalAmount}</td>
                                    <td className="px-6 py-4 text-right text-gray-500">{order.orderItems?.length || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3"><Package className="w-6 h-6 text-gray-300" /></div>
                    <p className="text-gray-500 font-medium">No orders found.</p>
                </div>
            )}
          </div>
        </div>

      ) : (
        
        /* ---------------- LIST VIEW ---------------- */
        <div className="space-y-6 animate-in fade-in duration-500">
          
          {/* Search & Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <input 
                type="text" 
                placeholder="Search by name, email or phone..." 
                value={userSearchQuery} 
                onChange={(e) => setUserSearchQuery(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm text-sm transition-all" 
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {/* Custom Sort Dropdown */}
            <SortDropdown currentSort={sortBy} onSortChange={setSortBy} />
          </div>

          {/* User Grid */}
          {sortedUsers?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedUsers.map((user) => {
                const deliveredCount = user.orders?.filter(o => o.status === 'Delivered').length || 0;
                
                return (
                  <div key={user.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col">
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="relative">
                         <UserAvatar user={user} size="md" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wide">
                        {user.role}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{user.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                        <Calendar size={12} /> Joined {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      
                      {/* Delivered Orders Badge */}
                      {deliveredCount > 0 && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-md border border-green-100 text-[10px] font-bold">
                          <CheckCircle size={10} /> {deliveredCount} Delivered
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-50 flex gap-2">
                      <button onClick={() => handleEditUser(user)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                        <ExternalLink size={14} /> Profile
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} className="flex-none flex items-center justify-center p-2 text-gray-400 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" title="Delete User">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="p-4 bg-gray-50 rounded-full mb-3"><Search className="w-6 h-6 text-gray-400" /></div>
              <p className="text-gray-500 font-medium">No users found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsersTab;