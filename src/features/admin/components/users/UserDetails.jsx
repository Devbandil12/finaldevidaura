import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Package, ArrowLeft } from 'lucide-react';

const UserAvatar = ({ user, size = "md", className = "" }) => {
  const [imgError, setImgError] = useState(false);
  const imgSrc = user.image || user.avatar || user.imageUrl || user.profileImage;
  const sizeClasses = { sm: "w-10 h-10 text-sm", md: "w-12 h-12 text-lg", lg: "w-24 h-24 text-3xl" };
  
  const getAvatarColor = () => {
    return "bg-[var(--surface)] text-[var(--brand)] border border-[var(--border)]";
  };

  if (imgSrc && !imgError) {
    return <img src={imgSrc} alt={user.name} onError={() => setImgError(true)} className={`object-cover rounded-full border border-[var(--border)] shadow-[var(--shadow)] bg-[var(--surface)] ${sizeClasses[size]} ${className}`} />;
  }
  return <div className={`rounded-full flex items-center justify-center font-body font-bold shadow-[var(--shadow)] ${getAvatarColor()} ${sizeClasses[size]} ${className}`}>{user.name ? user.name.charAt(0).toUpperCase() : "?"}</div>;
};

const getOrderStatusBadge = (status) => {
  const normalizedStatus = (status || "").toLowerCase();
  
  const styles = {
    "delivered": "bg-[var(--surface)] text-[var(--success)] border-[var(--border)]",
    "shipped": "bg-[var(--accent-soft)] text-[var(--brand)] border-transparent",
    "processing": "bg-[var(--surface)] text-[var(--sub)] border-[var(--border)]",
    "order cancelled": "bg-[var(--surface)] text-[var(--error)] border-[var(--border)]",
    "order placed": "bg-[var(--surface-muted)] text-[var(--muted)] border-transparent",
  };
  
  const styleClass = styles[normalizedStatus] || styles["order placed"];

  return (
    <span className={`inline-flex items-center px-2.5 py-1 font-body text-[9px] font-bold uppercase tracking-widest whitespace-nowrap rounded-md border transition-colors duration-300 ${styleClass}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
};

const UserDetails = ({ editingUser, setEditingUser }) => {
  if (!editingUser) return null;

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn duration-300 pb-20 font-body">
      
      {/* Back Button */}
      <button 
        onClick={() => setEditingUser(null)} 
        className="flex items-center text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--brand)] transition-colors mb-6 group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" strokeWidth={2} /> Back to User List
      </button>

      {/* Main Profile Header Card */}
      <div className="bg-[var(--surface)] rounded-3xl shadow-[var(--shadow)] border border-[var(--border)] p-6 sm:p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          <UserAvatar user={editingUser} size="lg" className="ring-4 ring-[var(--surface)] shadow-sm" />
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-medium text-[var(--text)] tracking-tight">{editingUser.name}</h1>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-2.5 font-body text-xs font-bold text-[var(--sub)] justify-center md:justify-start">
                  <div className="flex items-center gap-1.5"><Mail size={14} strokeWidth={2} className="text-[var(--muted)]" />{editingUser.email}</div>
                </div>
              </div>

              {/* Stats Pills */}
              <div className="flex gap-4 w-full sm:w-auto justify-center">
                <div className="flex-1 sm:flex-none px-5 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-center min-w-[110px] shadow-sm">
                  <p className="font-body text-[10px] text-[var(--muted)] uppercase tracking-widest font-bold mb-1">Joined</p>
                  <p className="font-body text-sm font-bold text-[var(--text)] tracking-tight">{new Date(editingUser.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="flex-1 sm:flex-none px-5 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-center min-w-[110px] shadow-sm">
                  <p className="font-body text-[10px] text-[var(--brand)] uppercase tracking-widest font-bold mb-1">Orders</p>
                  <p className="font-body text-sm font-bold text-[var(--text)] tracking-tight">{editingUser.orders?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Personal Details & Saved Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Personal Details */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-3xl shadow-[var(--shadow)] border border-[var(--border)] h-full flex flex-col">
            <h3 className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-6 flex items-center gap-2">
              <User size={16} strokeWidth={2} /> Personal Details
            </h3>
            <div className="space-y-5 flex-1">
              <div>
                <label className="font-body text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest block mb-1">Email</label>
                <div className="flex items-center gap-2.5 font-body text-sm font-bold text-[var(--text)] break-all">
                  <Mail size={16} strokeWidth={1.5} className="text-[var(--muted)] shrink-0" /> {editingUser.email}
                </div>
              </div>
              <div className="pt-4 border-t border-[var(--border)]">
                <label className="font-body text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest block mb-1">Phone</label>
                <div className="flex items-center gap-2.5 font-body text-sm font-bold text-[var(--text)]">
                  <Phone size={16} strokeWidth={1.5} className="text-[var(--muted)] shrink-0" /> {editingUser.phone || 'Not Provided'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-3xl shadow-[var(--shadow)] border border-[var(--border)] h-full flex flex-col">
            <h3 className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-6 flex items-center gap-2">
              <MapPin size={16} strokeWidth={2} /> Saved Addresses
            </h3>
            {editingUser.addresses?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {editingUser.addresses.map((address) => (
                  <div key={address.id} className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--brand)] mt-0.5 shrink-0 shadow-sm">
                        <MapPin size={16} strokeWidth={1.5} />
                      </div>
                      <div className="font-body text-sm flex-1 min-w-0">
                        <p className="font-bold text-[var(--text)] text-sm tracking-wide mb-1 truncate">{address.city}, {address.state}</p>
                        <p className="text-[var(--sub)] font-bold text-xs leading-relaxed line-clamp-2">{address.address}</p>
                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[var(--border)] font-body text-[11px] font-bold">
                          <span className="text-[var(--muted)] font-mono">{address.zipCode}</span>
                          <span className="text-[9px] uppercase tracking-widest text-[var(--sub)]">{address.country}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)]">
                <MapPin className="w-8 h-8 text-[var(--muted)] mb-3 opacity-50" strokeWidth={1.5} />
                <p className="font-display italic text-lg text-[var(--sub)] tracking-wide">No addresses found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order History Section */}
      <div className="bg-[var(--surface)] rounded-3xl shadow-[var(--shadow)] border border-[var(--border)] overflow-hidden font-body">
        <div className="px-6 md:px-8 py-5 bg-[var(--surface)] border-b border-[var(--border)] flex flex-wrap gap-4 justify-between items-center">
          <h3 className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center gap-2">
            <Package size={16} strokeWidth={2} className="text-[var(--brand)]" /> Order History
          </h3>
          <span className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--text)] bg-[var(--surface)] px-3 py-1 rounded-md border border-[var(--border)] shadow-sm">
            {editingUser.orders?.length || 0} Orders
          </span>
        </div>
        
        {editingUser.orders && editingUser.orders.length > 0 ? (
          <div className="overflow-x-auto smooth-scrollbar">
            <table className="w-full text-left text-sm min-w-[700px] border-collapse">
              <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--muted)] tracking-widest">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4 text-right">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {editingUser.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--surface)] transition-colors duration-300 group cursor-default">
                    <td className="px-6 py-4 font-bold text-[var(--text)] tracking-wide group-hover:text-[var(--brand)] transition-colors">#{order.id}</td>
                    <td className="px-6 py-4 text-[var(--sub)] font-bold text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} strokeWidth={2} className="text-[var(--muted)]" />
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getOrderStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 font-bold text-[var(--text)] tracking-tight">₹{order.totalAmount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-[var(--sub)]">{order.orderItems?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-[var(--surface)] border border-[var(--border)] rounded-full flex items-center justify-center mb-3 text-[var(--muted)] shadow-sm">
              <Package className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <p className="font-display italic text-xl text-[var(--sub)] tracking-wide">No orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { UserDetails, UserAvatar };