// File: src/pages/UserPage.jsx
import React, { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from "../contexts/UserContext";
import { OrderContext } from "../contexts/OrderContext";
import { CartContext } from "../contexts/CartContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { ReviewContext } from "../contexts/ReviewContext";
import { Pencil, Trash2, Plus, MapPin, User, Star, HeartOff } from 'lucide-react';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import useCloudinary from '../utils/useCloudinary';

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


const ProfileCard = ({ userdetails, onEdit, onEditDetails, wishlist = [], cart = [], navigate, onProfileImageChange }) => {

 const { products } = useContext(ProductContext);
  const findProduct = id => products.find(p => p.id === id);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const names = userdetails?.name?.split(' ') || ['U'];
  const firstLetter = names[0]?.charAt(0).toUpperCase();
  const lastLetter = names[1]?.charAt(0).toUpperCase() || '';

  const getRandomLightColor = (seed) => {
    const colors = ["#fef3c7", "#dbeafe", "#dcfce7", "#fef2f2", "#ede9fe", "#fff7ed", "#fefce8", "#f0fdfa"];
    const index = seed ? seed.charCodeAt(0) % colors.length : Math.floor(Math.random() * colors.length);
    return colors[index];
  };
  const color1 = getRandomLightColor(firstLetter);
  const color2 = getRandomLightColor(lastLetter || firstLetter);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);

    if (onProfileImageChange) onProfileImageChange(file);
    setDropdownOpen(false);
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    if (onProfileImageChange) onProfileImageChange(null);
    setDropdownOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 flex flex-col items-center text-center relative">
      {/* Profile Image / Initials */}
      <div
        className="w-28 h-28 rounded-full flex items-center justify-center text-2xl font-semibold shadow-inner relative overflow-hidden"
      >
        {previewImage || userdetails?.profileImage ? (
          <img
            src={previewImage || userdetails.profileImage}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center rounded-full">
            <span className="flex w-full h-full">
              <span className="w-1/2 h-full flex items-center justify-center" style={{ backgroundColor: color1 }}>
                {firstLetter}
              </span>
              <span className="w-1/2 h-full flex items-center justify-center" style={{ backgroundColor: color2 }}>
                {lastLetter}
              </span>
            </span>
          </div>
        )}
      </div>

      <h3 className="mt-4 text-xl font-semibold">{userdetails.name}</h3>
      <p className="text-sm text-gray-500">{userdetails.email}</p>
      <p className="mt-2 text-sm text-gray-600">{userdetails.phone || 'Phone not set'}</p>
      {userdetails.dob && <p className="text-sm text-gray-600">DOB: {userdetails.dob}</p>}
{userdetails.gender && <p className="text-sm text-gray-600">Gender: {userdetails.gender}</p>}

      {/* Edit Dropdown */}
      <div className="mt-4 relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="p-2 rounded-md hover:bg-gray-100 transition flex items-center gap-1"
        >
          <Pencil className="w-4 h-4"/>
          <span className="text-sm">Edit</span>
        </button>

        {dropdownOpen && (
          <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
            <button
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition"
              onClick={() => fileInputRef.current.click()}
            >
              Add / Change Profile Picture
            </button>
            <button
  className={`w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100 transition ${
    !previewImage && !userdetails?.profileImage ? "opacity-50 cursor-not-allowed" : ""
  }`}
  onClick={handleRemoveImage}
  disabled={!previewImage && !userdetails?.profileImage}
>
  Remove Profile Picture
</button>
<button
  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition"
  onClick={() => {
    onEditDetails();
    setDropdownOpen(false);
  }}
>
  Edit Details
</button>


          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Wishlist & Cart Summary */}
      <div className="mt-6 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Wishlist */}
        <div className="bg-white p-4 rounded-2xl shadow-soft flex flex-col items-center">
          <div className="flex -space-x-2 mb-2">
            {wishlist.slice(0,3).map(item => {
  const product = findProduct(item.productId); // <-- add here
  if (!product) return null;
  return (
    <img
      key={item.productId}
      src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl}
      className="w-10 h-10 rounded-lg border"
      alt={product.name}
    />
  );
})}

          </div>
          <div className="text-sm text-gray-700">{wishlist.length} items</div>
          <button
            onClick={() => navigate("/wishlist")}
            className="mt-2 px-3 py-1.5 bg-gray-800 text-white rounded-xl text-xs hover:bg-gray-700 transition"
          >
            View Wishlist
          </button>
        </div>

        {/* Cart */}
        <div className="bg-white p-4 rounded-2xl shadow-soft flex flex-col items-center">
          <div className="flex -space-x-2 mb-2">
           {cart.slice(0,3).map(item => {
  const product = findProduct(item.productId);
  if (!product) return null;
  return (
    <img
      key={item.productId}
      src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl}
      className="w-10 h-10 rounded-lg border"
      alt={product.name}
    />
  );
})}

          </div>
          <div className="text-sm text-gray-700">{cart.length} items</div>
          <button
            onClick={() => navigate("/cart")}
            className="mt-2 px-3 py-1.5 bg-gray-800 text-white rounded-xl text-xs hover:bg-gray-700 transition"
          >
            Go to Cart
          </button>
        </div>
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
  const {cart, wishlist, isWishlistLoading } = useContext(CartContext);
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
const { uploadImage, uploading: imageUploading, uploadedUrl, error: uploadError } = useCloudinary();
 
const [showProfileModal, setShowProfileModal] = useState(false);
const [profileForm, setProfileForm] = useState({
  name: '',
  phone: '',
  dob: '',
  gender: '',
});



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


const handleProfileImageChange = async (file) => {
  if (!file) {
  await updateUser({ profileImage: null });
  toast.success("Profile picture removed");
  return;
}

  try {
    const url = await uploadImage(file);       // Upload to Cloudinary
    if (url) {
      await updateUser({ profileImage: url }); // Save to backend
      toast.success("Profile picture updated");
    }
  } catch (err) {
    toast.error("Failed to upload profile image");
    console.error(err);
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


{showProfileModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
      <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>

      <FloatingInput
        label="Name"
        value={profileForm.name}
        onChange={e => setProfileForm({...profileForm, name: e.target.value})}
      />
      <FloatingInput
        label="Phone"
        value={profileForm.phone}
        onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
      />
      <FloatingInput
        label="Date of Birth"
        type="date"
        value={profileForm.dob}
        onChange={e => setProfileForm({...profileForm, dob: e.target.value})}
      />

      <FloatingDropdown
        label="Gender"
        value={profileForm.gender}
        onChange={e => setProfileForm({...profileForm, gender: e.target.value})}
        options={['Male','Female','Other']}
      />

      <div className="flex gap-3 mt-4">
        <button
          className="px-4 py-2 rounded-lg bg-black text-white"
          onClick={async () => {
            const updated = await updateUser(profileForm);
            if (updated) {
              toast.success("Profile updated");
              setShowProfileModal(false);
            } else {
              toast.error("Failed to update profile");
            }
          }}
        >
          Save
        </button>
        <button
          className="px-4 py-2 rounded-lg border"
          onClick={() => setShowProfileModal(false)}
        >
          Cancel
        </button>
      </div>

      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        onClick={() => setShowProfileModal(false)}
      >
        ✕
      </button>
    </div>
  </div>
)}




  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <ProfileCard
  userdetails={userdetails}
  wishlist={wishlist}
  cart={cart}
  navigate={navigate}
  onProfileImageChange={handleProfileImageChange}
  onEditDetails={() => {
    setProfileForm({
      name: userdetails.name || '',
      phone: userdetails.phone || '',
      dob: userdetails.dob || '',
      gender: userdetails.gender || '',
    });
    setShowProfileModal(true);
  }}
/>



        </div>

        {/* Main Tabs */}
        <div className="lg:col-span-3">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex flex-wrap gap-2 mb-6">
              {['orders','addresses','reviews','queries'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === t ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
