// File: src/pages/UserPage.jsx
import React, { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import { OrderContext } from "../contexts/OrderContext";
import { CartContext } from "../contexts/CartContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { ReviewContext } from "../contexts/ReviewContext";
import { Pencil, Trash2, Plus, MapPin, User, Star, HeartOff } from 'lucide-react';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";


const IconBtn = ({ children, onClick, title = '' }) => (
  <button onClick={onClick} className="p-2 rounded-md hover:bg-gray-100 transition" title={title}>
    {children}
  </button>
);

// 🔹 Floating Input
const FloatingInput = ({ label, value, onChange, type = "text", id, className = "", ...props }) => (
  <div className={`relative w-full ${className}`}>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder=" "
      className="peer w-full rounded-lg border border-gray-300 px-3 pt-5 pb-2 text-sm text-gray-900 placeholder-transparent focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
      {...props}
    />
    <label
      htmlFor={id}
      className="absolute left-3 -top-2 bg-white px-1 text-gray-500 text-sm transition-all pointer-events-none
        peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
        peer-focus:-top-2 peer-focus:text-sm peer-focus:text-black"
    >
      {label}
    </label>
  </div>
);

// 🔹 Custom Floating Dropdown (modern styled)
const FloatingDropdown = ({ label, value, onChange, options }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      {/* Trigger */}
      <div
        onClick={() => setOpen(!open)}
        className="peer w-full rounded-lg border border-gray-300 px-3 pt-5 pb-2 text-sm text-gray-900 cursor-pointer bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black"
      >
        <span className={`${!value ? "text-gray-400" : ""}`}>
          {value || "Select..."}
        </span>
      </div>

      {/* Floating Label */}
      <label
        className="absolute left-3 -top-2 bg-white px-1 text-gray-500 text-sm transition-all pointer-events-none"
      >
        {label}
      </label>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fadeIn">
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange({ target: { value: opt } }); setOpen(false); }}
              className={`px-4 py-2 text-sm cursor-pointer transition 
                ${value === opt ? "bg-black text-white" : "hover:bg-gray-100 text-gray-700"}`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const ProfileCard = ({ userdetails, onEdit }) => {
  const initials = userdetails?.name?.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase() || 'U';
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 flex flex-col items-center text-center">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-white flex items-center justify-center text-2xl font-semibold text-gray-800 shadow-inner relative">
        <User className="absolute w-10 h-10 text-gray-300" />
        <span className="z-10">{initials}</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold">{userdetails.name}</h3>
      <p className="text-sm text-gray-500">{userdetails.email}</p>
      <p className="mt-2 text-sm text-gray-600">{userdetails.phone || 'Phone not set'}</p>
      <div className="mt-4 flex gap-3">
        <IconBtn onClick={onEdit} title="Edit profile"><Pencil className="w-4 h-4"/></IconBtn>
      </div>
    </div>
  );
};

const AddressCard = ({ addr, onDelete, onEdit, onSetDefault }) => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-800">{addr.name}</h3>
        {addr.addressType && (
          <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {addr.addressType}
          </span>
        )}
        {addr.isDefault && (
          <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-black text-white">
            Default
          </span>
        )}
      </div>
    </div>

    {/* Body */}
    <div className="px-5 py-4 text-sm text-gray-700 space-y-2">
      <p className="leading-snug">
        {addr.address}, {addr.city}, {addr.state} - {addr.postalCode}
      </p>
      {addr.landmark && (
        <p className="text-gray-500 text-xs">Landmark: {addr.landmark}</p>
      )}
      <p className="text-gray-600">
        📞 {addr.phone}
        {addr.altPhone && (
          <span className="ml-2 text-gray-500">Alt: {addr.altPhone}</span>
        )}
      </p>
    </div>

    {/* Footer actions */}
    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
      {!addr.isDefault && (
        <button
          onClick={() => onSetDefault(addr.id)}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
        >
          Set Default
        </button>
      )}
      <div className="flex gap-2">
        <IconBtn onClick={() => onEdit(addr)} title="Edit">
          <Pencil className="w-4 h-4 text-gray-600" />
        </IconBtn>
        <IconBtn onClick={() => onDelete(addr.id)} title="Delete">
          <Trash2 className="w-4 h-4 text-red-500" />
        </IconBtn>
      </div>
    </div>
  </div>
);

const UserPage = () => {
  const {  
    userdetails, address, updateUser, addAddress, editAddress, deleteAddress, setDefaultAddress
  } = useContext(UserContext);

  const { orders, loadingOrders, getorders } = useContext(OrderContext);
  const { wishlist, isWishlistLoading } = useContext(CartContext);
  const { products, loading: productsLoading } = useContext(ProductContext);
  const { queries, getQueriesByUser } = useContext(ContactContext);
  const { userReviews, loadingReviews, getReviewsByUser } = useContext(ReviewContext);

const findProduct = (id) => products.find(p => p.id === id);

  const [isEditingUser, setIsEditingUser] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '', phone: '', altPhone: '',
    address: '', city: '', state: '', postalCode: '',
    landmark: '', addressType: '', lat: null, lng: null
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [editingAddr, setEditingAddr] = useState(null);
const [originalAddr, setOriginalAddr] = useState(null); 


const navigate = useNavigate();


  useEffect(() => {
    if (userdetails) {
      setName(userdetails.name || '');
      setPhone(userdetails.phone || '');
      getorders && getorders();
      getReviewsByUser && getReviewsByUser();
      getQueriesByUser && getQueriesByUser(userdetails.email);
    }
  }, [userdetails]);

  const handleUpdateUser = async () => {
    if (!name) return toast.error('Name is required');
    const updated = await updateUser({ name, phone });
    if (updated) {
      toast.success('Profile updated');
      setIsEditingUser(false);
    } else {
      toast.error('Failed to update profile');
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.address || !newAddress.city || !newAddress.postalCode || !newAddress.phone) 
      return toast.error('Please fill required address fields');
    const created = await addAddress(newAddress);
    if (created) {
      toast.success('Address added');
      setIsAddingAddress(false);
      setNewAddress({ name: '', phone: '', altPhone: '', address: '', city: '', state: '', postalCode: '', landmark: '', addressType: '', lat: null, lng: null });
    } else {
      toast.error('Failed to add address');
    }
  };

  const handleEditAddressSave = async () => {
    if (!editingAddr) return;
    const required = editingAddr.name && editingAddr.address && editingAddr.city && editingAddr.postalCode && editingAddr.phone;
    if (!required) return toast.error('Please fill required address fields');
    const updated = await editAddress(editingAddr.id, editingAddr);
    if (updated) {
      toast.success('Address updated');
      setEditingAddr(null);
    } else {
      toast.error('Failed to update address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Remove this address?')) return;
    const ok = await deleteAddress(addressId);
    if (ok) toast.success('Address removed'); else toast.error('Failed to delete');
  };

  const handleSetDefault = async (addressId) => {
    const updated = await setDefaultAddress(addressId);
    if (updated) toast.success('Default address set'); else toast.error('Failed to set default');
  };

  if (!userdetails || productsLoading || loadingOrders || isWishlistLoading || loadingReviews) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <ProfileCard userdetails={userdetails} onEdit={() => setIsEditingUser(true)} />
        </div>

        {/* Main Tabs */}
        <div className="lg:col-span-3">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex flex-wrap gap-2 mb-6">
              {['profile','orders','addresses','reviews','queries','wishlist'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === t ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isEditingUser ? (
                  <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatingInput label="Name" value={name} onChange={e => setName(e.target.value)} />
                    <FloatingInput label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
                    <div className="flex gap-3 mt-2">
                      <button onClick={handleUpdateUser} className="px-4 py-2 rounded-lg bg-black text-white">Save</button>
                      <button onClick={() => setIsEditingUser(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold">Profile Information</h3>
                    <p className="text-sm text-gray-600 mt-2">Name: {userdetails.name}</p>
                    <p className="text-sm text-gray-600">Email: {userdetails.email}</p>
                    <p className="text-sm text-gray-600">Phone: {userdetails.phone || 'N/A'}</p>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">My Addresses</h2>
                  <button onClick={() => { setIsAddingAddress(!isAddingAddress); setEditingAddr(null); }} className="px-3 py-2 rounded-full bg-gray-100 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {isAddingAddress && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FloatingInput label="Full Name" value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} />
                    <FloatingInput label="Phone" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
                    <FloatingInput label="Alt Phone" value={newAddress.altPhone} onChange={e => setNewAddress({...newAddress, altPhone: e.target.value})} />
                    <FloatingInput label="Address Line" value={newAddress.address} onChange={e => setNewAddress({...newAddress, address: e.target.value})} className="md:col-span-2" />
                    <FloatingInput label="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                    <FloatingInput label="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
                    <FloatingInput label="Postal Code" value={newAddress.postalCode} onChange={e => setNewAddress({...newAddress, postalCode: e.target.value})} />
                    <FloatingInput label="Landmark" value={newAddress.landmark} onChange={e => setNewAddress({...newAddress, landmark: e.target.value})} />
                    <FloatingDropdown label="Address Type" value={newAddress.addressType} onChange={e => setNewAddress({...newAddress, addressType: e.target.value})} options={["Home","Work","Other"]} />
                    <div className="md:col-span-2 flex gap-3">
                      <button onClick={handleAddAddress} className="px-4 py-2 rounded-lg bg-black text-white">Save Address</button>
                      <button 
  onClick={() => {
    setIsAddingAddress(false);
    setNewAddress({
      name: '', phone: '', altPhone: '',
      address: '', city: '', state: '', postalCode: '',
      landmark: '', addressType: '', lat: null, lng: null
    });
  }} 
  className="px-4 py-2 rounded-lg border"
>
  Cancel
</button>

                    </div>
                  </div>
                )}

                {editingAddr && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FloatingInput label="Full Name" value={editingAddr.name} onChange={e => setEditingAddr({...editingAddr, name: e.target.value})} />
                    <FloatingInput label="Phone" value={editingAddr.phone} onChange={e => setEditingAddr({...editingAddr, phone: e.target.value})} />
                    <FloatingInput label="Alt Phone" value={editingAddr.altPhone} onChange={e => setEditingAddr({...editingAddr, altPhone: e.target.value})} />
                    <FloatingInput label="Address Line" value={editingAddr.address} onChange={e => setEditingAddr({...editingAddr, address: e.target.value})} className="md:col-span-2" />
                    <FloatingInput label="City" value={editingAddr.city} onChange={e => setEditingAddr({...editingAddr, city: e.target.value})} />
                    <FloatingInput label="State" value={editingAddr.state} onChange={e => setEditingAddr({...editingAddr, state: e.target.value})} />
                    <FloatingInput label="Postal Code" value={editingAddr.postalCode} onChange={e => setEditingAddr({...editingAddr, postalCode: e.target.value})} />
                    <FloatingInput label="Landmark" value={editingAddr.landmark} onChange={e => setEditingAddr({...editingAddr, landmark: e.target.value})} />
                    <FloatingDropdown label="Address Type" value={editingAddr.addressType} onChange={e => setEditingAddr({...editingAddr, addressType: e.target.value})} options={["Home","Work","Other"]} />
                    <div className="md:col-span-2 flex gap-3">
                      <button onClick={handleEditAddressSave} className="px-4 py-2 rounded-lg bg-black text-white">Save</button>
                      <button 
  onClick={() => {
    setEditingAddr(originalAddr); // restore untouched values
    setEditingAddr(null);         // close form
    setOriginalAddr(null);        // clear backup
  }} 
  className="px-4 py-2 rounded-lg border"
>
  Cancel
</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {address.map(addr => (
                    <AddressCard
                      key={addr.id}
                      addr={addr}
                      onDelete={handleDeleteAddress}
                      onEdit={(a) => {
  setEditingAddr({ ...a });   // copy for editing
  setOriginalAddr({ ...a });  // backup copy
  setIsAddingAddress(false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}}
                      onSetDefault={handleSetDefault}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Order History</h2>
                  {orders.length === 0 ? <p className="text-gray-500">No orders yet</p> : (
                    <div className="space-y-4">
                      {orders.map(o => (
                        <div key={o.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                          <div>
                            <div className="font-medium">Order #{o.id}</div>
                            <div className="text-sm text-gray-500">Placed on {new Date(o.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">₹{o.totalAmount}</div>
                            <div className="text-sm text-gray-500">{o.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
{activeTab === 'reviews' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">My Reviews</h2>
                  {userReviews.length === 0 ? (
                    <p className="text-gray-500">No reviews yet</p>
                  ) : (
                    <div className="space-y-4">
                      {userReviews.map(r => {
                        const product = findProduct(r.productId);
                        return (
                          <div key={r.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-4">
                              <div>
                                <div className="font-semibold">{product?.name || 'Product'}</div>
                                <div className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                              </div>
                              <div className="ml-auto flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (<Star key={i} className={`w-4 h-4 ${i < r.rating ? 'text-yellow-400' : 'text-gray-300'}`} />))}
                              </div>
                            </div>
                            <p className="mt-2 text-gray-700">{r.comment}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'queries' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">My Queries</h2>
                  {queries.length === 0 ? <p className="text-gray-500">No queries submitted</p> : (
                    <div className="space-y-3">
                      {queries.map((q, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg">
                          <div className="font-semibold">Message</div>
                          <div className="text-gray-700 mt-1">{q.message}</div>
                          <div className="text-xs text-gray-500 mt-2">Submitted on {q.createdAt}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              
{activeTab === 'wishlist' && (
  <div>
    {/* Header row with title + button */}
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold">My Wishlist</h2>
      <button
        onClick={() => navigate("/wishlist")}
        className="px-4 py-2 text-sm rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition"
      >
        View All
      </button>
    </div>

    {(!wishlist || wishlist.length === 0) ? (
      <p className="text-gray-500">No items in wishlist</p>
    ) : (
      <div className="flex flex-wrap gap-6">
        {wishlist.map(item => {
          const p = findProduct(item.productId);
          if (!p) return null;

          const discountedPrice = Math.floor(p.oprice * (1 - p.discount / 100));

          return (
            <div
              key={item.id}
              className="w-64 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Product Image */}
              <div className="h-40 bg-gray-100 flex items-center justify-center">
                {p.imageurl ? (
                  <img
                    src={Array.isArray(p.imageurl) ? p.imageurl[0] : p.imageurl}
                    alt={p.name}
                    className="h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400">No Image</div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 flex flex-col gap-3">
                {/* Name + Size */}
                <div className="flex justify-between items-center">
                  <div className="font-medium text-gray-800 truncate">
                    {p.name}
                  </div>
                  {p.size && (
                    <div className="text-sm text-gray-500 ml-2">{p.size}</div>
                  )}
                </div>

                {/* Price + Discount */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    ₹{discountedPrice}
                    <span className="line-through ml-2 text-gray-400">
                      ₹{p.oprice}
                    </span>
                  </div>
                  {p.discount > 0 && (
                    <div className="text-green-600 text-sm font-medium">
                      {p.discount}%
                    </div>
                  )}
                </div>

                {/* View Product Button */}
                <button
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                >
                  View Product
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
