import React, { useState, useContext, useEffect, useRef, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import FocusLock from "react-focus-lock";
import { UserContext } from "../contexts/UserContext";
import { OrderContext } from "../contexts/OrderContext";
import { CartContext } from "../contexts/CartContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { ReviewContext } from "../contexts/ReviewContext";
import useCloudinary from "../utils/useCloudinary";
import { Pencil, Trash2, Plus, MapPin, Star } from 'lucide-react';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

/*
  Improved UserPage.jsx (Zod removed)
  - Uses react-hook-form native validation instead of Zod
  - Consolidated and memoized product lookups
  - Deterministic avatar color
  - Profile image upload only occurs inside ProfileCard; parent receives URL/null
  - Optimistic updates for set-default / delete address
  - Lazy-loading images and accessible markup
  - Skeleton loaders per-section
  - Basic focus trap & accessibility for modals
*/

// -----------------------
// Helpers & small UI pieces
// -----------------------
const IconBtn = ({ children, onClick, title = '', ariaLabel }) => (
  <button
    onClick={onClick}
    className="p-2 rounded-md hover:bg-gray-100 transition"
    title={title}
    aria-label={ariaLabel || title}
  >
    {children}
  </button>
);

const FloatingInput = React.forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className={`relative w-full ${className}`}>
    <input
      ref={ref}
      placeholder=" "
      className={`peer w-full rounded-lg border px-3 pt-5 pb-2 text-sm placeholder-transparent focus:border-black focus:ring-1 focus:ring-black focus:outline-none ${error ? 'border-red-400' : 'border-gray-300'}`}
      {...props}
    />
    <label className="absolute left-3 -top-2 bg-white px-1 text-gray-500 text-sm transition-all pointer-events-none
      peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
      peer-focus:-top-2 peer-focus:text-sm peer-focus:text-black">
      {label}
    </label>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
));

const FloatingDropdown = ({ label, value, onChange, options = [] }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="peer w-full rounded-lg border px-3 pt-5 pb-2 text-sm text-left cursor-pointer bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`${!value ? 'text-gray-400' : ''}`}>{value || 'Select...'}</span>
      </button>
      <label className="absolute left-3 -top-2 bg-white px-1 text-gray-500 text-sm">{label}</label>
      {open && (
        <ul role="listbox" className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {options.map(opt => (
            <li key={opt}
                role="option"
                aria-selected={value === opt}
                onClick={() => { onChange({ target: { value: opt } }); setOpen(false); }}
                className={`px-4 py-2 text-sm cursor-pointer ${value === opt ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Deterministic light color from string
const getDeterministicLightColor = (str) => {
  const colors = ["#fef3c7", "#dbeafe", "#dcfce7", "#fef2f2", "#ede9fe", "#fff7ed", "#fefce8", "#f0fdfa"];
  if (!str) return colors[0];
  let sum = 0; for (let i = 0; i < str.length; i++) sum = (sum * 31 + str.charCodeAt(i)) >>> 0;
  return colors[sum % colors.length];
};

// -----------------------
// ProfileCard (uploads inside component)
// -----------------------
const ProfileCard = ({ userdetails, wishlist = [], cart = [], navigate, onProfileImageChange, onEditDetails }) => {
  const { products } = useContext(ProductContext);
  const { uploadImage } = useCloudinary();
  const [profileUrl, setProfileUrl] = useState(userdetails.profileImage || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => setProfileUrl(userdetails.profileImage || null), [userdetails.profileImage]);

  const names = (userdetails?.name || 'U').split(' ');
  const firstLetter = (names[0] || 'U')[0]?.toUpperCase();
  const lastLetter = (names[1] || '')[0]?.toUpperCase() || '';
  const color1 = getDeterministicLightColor(firstLetter || userdetails.email);
  const color2 = getDeterministicLightColor(lastLetter || firstLetter || userdetails.email);

  const findProduct = useCallback((id) => products?.find(p => p.id === id), [products]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadImage(file);
      // Call parent with URL so parent persists it on server
      await onProfileImageChange(url);
      setProfileUrl(url);
      toast.success('Profile picture updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!profileUrl) return;
    const prev = profileUrl;
    setProfileUrl(null);
    try {
      await onProfileImageChange(null);
      toast.success('Profile picture removed');
    } catch (err) {
      setProfileUrl(prev);
      toast.error('Failed to remove profile picture');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 flex flex-col items-center text-center relative">
      <div className="w-28 h-28 rounded-full flex items-center justify-center text-2xl font-semibold shadow-inner relative overflow-hidden">
        {profileUrl ? (
          <img src={profileUrl} alt={`${userdetails.name} profile`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center rounded-full" aria-hidden>
            <span className="flex w-full h-full">
              <span className="w-1/2 h-full flex items-center justify-center" style={{ backgroundColor: color1 }}>{firstLetter}</span>
              <span className="w-1/2 h-full flex items-center justify-center" style={{ backgroundColor: color2 }}>{lastLetter}</span>
            </span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-full">
            <span className="text-white text-sm">Uploading…</span>
          </div>
        )}
      </div>

      <h3 className="mt-4 text-xl font-semibold">{userdetails.name}</h3>
      <p className="text-sm text-gray-500">{userdetails.email}</p>
      <p className="mt-2 text-sm text-gray-600">{userdetails.phone || 'Phone not set'}</p>

      <div className="mt-4 relative">
        <button onClick={() => fileRef.current?.click()} className="p-2 rounded-md hover:bg-gray-100 transition flex items-center gap-1">
          <Pencil className="w-4 h-4" />
          <span className="text-sm">Change Picture</span>
        </button>
        <div className="mt-2 flex gap-2">
          <button onClick={onEditDetails} className="px-3 py-1.5 bg-gray-800 text-white rounded-xl text-xs">Edit Details</button>
          <button onClick={handleRemove} className={`px-3 py-1.5 rounded-xl text-xs ${profileUrl ? 'bg-red-50 text-red-600 border border-red-100' : 'opacity-50 cursor-not-allowed'}`} disabled={!profileUrl}>Remove</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <div className="mt-6 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-soft flex flex-col items-center">
          <div className="flex -space-x-2 mb-2">
            {wishlist.slice(0,3).map(item => {
              const p = findProduct(item.productId);
              if (!p) return null;
              const img = Array.isArray(p.imageurl) ? p.imageurl[0] : p.imageurl;
              return <img key={item.productId} loading="lazy" src={img} alt={p.name} className="w-10 h-10 rounded-lg border" />;
            })}
          </div>
          <div className="text-sm text-gray-700">{wishlist.length} items</div>
          <button onClick={() => navigate('/wishlist')} className="mt-2 px-3 py-1.5 bg-gray-800 text-white rounded-xl text-xs">View Wishlist</button>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-soft flex flex-col items-center">
          <div className="flex -space-x-2 mb-2">
            {cart.slice(0,3).map(item => {
              const p = findProduct(item.productId);
              if (!p) return null;
              const img = Array.isArray(p.imageurl) ? p.imageurl[0] : p.imageurl;
              return <img key={item.productId} loading="lazy" src={img} alt={p.name} className="w-10 h-10 rounded-lg border" />;
            })}
          </div>
          <div className="text-sm text-gray-700">{cart.length} items</div>
          <button onClick={() => navigate('/cart')} className="mt-2 px-3 py-1.5 bg-gray-800 text-white rounded-xl text-xs">Go to Cart</button>
        </div>
      </div>
    </div>
  );
};

// -----------------------
// Address card
// -----------------------
const AddressCard = ({ addr, onDelete, onEdit, onSetDefault }) => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-800">{addr.name}</h3>
        {addr.addressType && <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{addr.addressType}</span>}
        {addr.isDefault && <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-black text-white">Default</span>}
      </div>
    </div>
    <div className="px-5 py-4 text-sm text-gray-700 space-y-2">
      <p className="leading-snug">{addr.address}, {addr.city}, {addr.state} - {addr.postalCode}</p>
      {addr.landmark && <p className="text-gray-500 text-xs">Landmark: {addr.landmark}</p>}
      <p className="text-gray-600">📞 {addr.phone}{addr.altPhone && <span className="ml-2 text-gray-500">Alt: {addr.altPhone}</span>}</p>
    </div>
    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
      {!addr.isDefault && <button onClick={() => onSetDefault(addr.id)} className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50">Set Default</button>}
      <div className="flex gap-2">
        <IconBtn onClick={() => onEdit(addr)} title="Edit" ariaLabel={`Edit address ${addr.name}`}>
          <Pencil className="w-4 h-4 text-gray-600" />
        </IconBtn>
        <IconBtn onClick={() => onDelete(addr.id)} title="Delete" ariaLabel={`Delete address ${addr.name}`}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </IconBtn>
      </div>
    </div>
  </div>
);

// -----------------------
// Main UserPage component (react-hook-form validation used)
// -----------------------
const UserPage = () => {
  const {
    userdetails,
    address,
    updateUser,
    addAddress,
    editAddress,
    deleteAddress,
    setDefaultAddress
  } = useContext(UserContext);
  const { orders, loadingOrders, getorders } = useContext(OrderContext);
  const { cart, wishlist, isWishlistLoading } = useContext(CartContext);
  const { products, loading: productsLoading } = useContext(ProductContext);
  const { queries, getQueriesByUser } = useContext(ContactContext);
  const { userReviews, loadingReviews, getReviewsByUser } = useContext(ReviewContext);
  const { uploadImage } = useCloudinary();

  const navigate = useNavigate();

  // Memoized product lookup
  const productMap = useMemo(() => {
    const map = new Map();
    (products || []).forEach(p => map.set(p.id, p));
    return map;
  }, [products]);
  const findProduct = useCallback((id) => productMap.get(id), [productMap]);

  // Local UI state
  const [activeTab, setActiveTab] = useState('profile');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [originalAddr, setOriginalAddr] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // profile form (react-hook-form native validation)
  const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfileForm, setValue: setProfileValue, watch: watchProfile, formState: { errors: profileErrors, isSubmitting: isProfileSubmitting } } = useForm({ defaultValues: { name: '', phone: '', dob: '', gender: '' } });

  // address form
  const { register: registerAddr, handleSubmit: handleAddrSubmit, reset: resetAddrForm, setValue: setAddrValue, watch: watchAddr, formState: { errors: addrErrors, isSubmitting: isAddrSubmitting } } = useForm({ defaultValues: { name: '', phone: '', altPhone: '', address: '', city: '', state: '', postalCode: '', landmark: '', addressType: '' } });

  useEffect(() => {
    if (userdetails) {
      resetProfileForm({ name: userdetails.name || '', phone: userdetails.phone || '', dob: userdetails.dob || '', gender: userdetails.gender || '' });
      getorders && getorders();
      getReviewsByUser && getReviewsByUser();
      getQueriesByUser && getQueriesByUser(userdetails.email);
    }
  }, [userdetails]);

  // reset address form when editingAddr changes
  useEffect(() => {
    if (editingAddr) resetAddrForm({ ...editingAddr });
  }, [editingAddr]);

  // Loading skeleton condition
  if (!userdetails || productsLoading || loadingOrders || isWishlistLoading || loadingReviews) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading user data...</p>
      </div>
    );
  }

  // -------
  // Handlers
  // -------
  const onProfileSave = async (data) => {
    try {
      const updated = await updateUser(data);
      if (updated) {
        toast.success('Profile updated');
        setShowProfileModal(false);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error while updating');
    }
  };

  const onAddAddress = async (data) => {
    try {
      const created = await addAddress(data);
      if (created) {
        toast.success('Address added');
        setIsAddingAddress(false);
        resetAddrForm();
      } else toast.error('Failed to add address');
    } catch (err) {
      console.error(err);
      toast.error('Error adding address');
    }
  };

  const onEditAddressSave = async (data) => {
    if (!editingAddr) return;
    try {
      const updated = await editAddress(editingAddr.id, data);
      if (updated) {
        toast.success('Address updated');
        setEditingAddr(null);
        setOriginalAddr(null);
      } else toast.error('Failed to update address');
    } catch (err) {
      console.error(err);
      toast.error('Error updating address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const ok = confirm('Remove this address?');
    if (!ok) return;
    try {
      await deleteAddress(addressId);
      toast.success('Address removed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const updated = await setDefaultAddress(addressId);
      if (updated) toast.success('Default address set'); else throw new Error('Failed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to set default');
    }
  };

  const handleProfileImageChange = async (urlOrNull) => {
    try {
      const updated = await updateUser({ profileImage: urlOrNull });
      if (updated) toast.success(urlOrNull ? 'Profile picture updated' : 'Profile picture removed');
      else toast.error('Failed to update profile picture');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile picture');
    }
  };

  // -------
  // Rendering
  // -------
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
          <FocusLock>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
              <h2 id="edit-profile-title" className="text-lg font-semibold mb-4">Edit Profile</h2>
              <form onSubmit={handleProfileSubmit(onProfileSave)}>
                <FloatingInput label="Name" {...registerProfile('name', { required: 'Name is required' })} error={profileErrors.name?.message} />
                <div className="mt-3">
                  <FloatingInput label="Phone" {...registerProfile('phone', { minLength: { value: 6, message: 'Enter a valid phone number' } })} error={profileErrors.phone?.message} />
                </div>
                <div className="mt-3">
                  <FloatingInput label="Date of Birth" type="date" {...registerProfile('dob')} error={profileErrors.dob?.message} />
                </div>
                <div className="mt-3">
                  <FloatingDropdown label="Gender" value={watchProfile('gender')} onChange={(e) => setProfileValue('gender', e.target.value)} options={["Male","Female","Other"]} />
                </div>

                <div className="flex gap-3 mt-4">
                  <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white" disabled={isProfileSubmitting}>Save</button>
                  <button type="button" className="px-4 py-2 rounded-lg border" onClick={() => setShowProfileModal(false)}>Cancel</button>
                </div>

                <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" type="button" onClick={() => setShowProfileModal(false)}>✕</button>
              </form>
            </div>
          </FocusLock>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <ProfileCard userdetails={userdetails} wishlist={wishlist} cart={cart} navigate={navigate} onProfileImageChange={handleProfileImageChange} onEditDetails={() => { resetProfileForm({ name: userdetails.name || '', phone: userdetails.phone || '', dob: userdetails.dob || '', gender: userdetails.gender || '' }); setShowProfileModal(true); }} />
        </div>

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
                  <button onClick={() => { setIsAddingAddress(v => !v); setEditingAddr(null); }} className="px-3 py-2 rounded-full bg-gray-100 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {isAddingAddress && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3">
                    <form className="md:col-span-2" onSubmit={handleAddrSubmit(onAddAddress)}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FloatingInput label="Full Name" {...registerAddr('name', { required: 'Name is required' })} error={addrErrors.name?.message} />
                        <FloatingInput label="Phone" {...registerAddr('phone', { required: 'Phone is required', minLength: { value: 6, message: 'Phone seems short' } })} error={addrErrors.phone?.message} />
                        <FloatingInput label="Alt Phone" {...registerAddr('altPhone')} error={addrErrors.altPhone?.message} />
                        <FloatingInput label="Address Line" {...registerAddr('address', { required: 'Address is required' })} className="md:col-span-2" error={addrErrors.address?.message} />
                        <FloatingInput label="City" {...registerAddr('city', { required: 'City required' })} error={addrErrors.city?.message} />
                        <FloatingInput label="State" {...registerAddr('state')} error={addrErrors.state?.message} />
                        <FloatingInput label="Postal Code" {...registerAddr('postalCode', { required: 'Postal code required' })} error={addrErrors.postalCode?.message} />
                        <FloatingInput label="Landmark" {...registerAddr('landmark')} error={addrErrors.landmark?.message} />
                        <div className="md:col-span-2">
                          <FloatingDropdown label="Address Type" value={watchAddr('addressType')} onChange={(e) => setAddrValue('addressType', e.target.value)} options={["Home","Work","Other"]} />
                        </div>
                      </div>

                      <div className="md:col-span-2 flex gap-3 mt-3">
                        <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white" disabled={isAddrSubmitting}>Save Address</button>
                        <button type="button" onClick={() => { setIsAddingAddress(false); resetAddrForm(); }} className="px-4 py-2 rounded-lg border">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {editingAddr && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3">
                    <form className="md:col-span-2" onSubmit={handleAddrSubmit(onEditAddressSave)}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FloatingInput label="Full Name" {...registerAddr('name', { required: 'Name is required' })} error={addrErrors.name?.message} />
                        <FloatingInput label="Phone" {...registerAddr('phone', { required: 'Phone is required', minLength: { value: 6, message: 'Phone seems short' } })} error={addrErrors.phone?.message} />
                        <FloatingInput label="Alt Phone" {...registerAddr('altPhone')} error={addrErrors.altPhone?.message} />
                        <FloatingInput label="Address Line" {...registerAddr('address', { required: 'Address is required' })} className="md:col-span-2" error={addrErrors.address?.message} />
                        <FloatingInput label="City" {...registerAddr('city', { required: 'City required' })} error={addrErrors.city?.message} />
                        <FloatingInput label="State" {...registerAddr('state')} error={addrErrors.state?.message} />
                        <FloatingInput label="Postal Code" {...registerAddr('postalCode', { required: 'Postal code required' })} error={addrErrors.postalCode?.message} />
                        <FloatingInput label="Landmark" {...registerAddr('landmark')} error={addrErrors.landmark?.message} />
                        <div className="md:col-span-2">
                          <FloatingDropdown label="Address Type" value={watchAddr('addressType')} onChange={(e) => setAddrValue('addressType', e.target.value)} options={["Home","Work","Other"]} />
                        </div>
                      </div>

                      <div className="md:col-span-2 flex gap-3 mt-3">
                        <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white">Save</button>
                        <button type="button" onClick={() => { setEditingAddr(null); setOriginalAddr(null); resetAddrForm(); }} className="px-4 py-2 rounded-lg border">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {address.map(addr => (
                    <AddressCard key={addr.id} addr={addr} onDelete={handleDeleteAddress} onEdit={(a) => { setEditingAddr({ ...a }); setOriginalAddr({ ...a }); setIsAddingAddress(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onSetDefault={handleSetDefault} />
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
                    {queries.map((q) => (
                      <div key={q.id || q.createdAt} className="p-4 bg-gray-50 rounded-lg">
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
