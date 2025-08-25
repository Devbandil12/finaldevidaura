// File: src/pages/UserPage.jsx
import React, { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import { OrderContext } from "../contexts/OrderContext";
import { CartContext } from "../contexts/CartContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { ReviewContext } from "../contexts/ReviewContext";
import { Pencil, Trash2, Plus, MapPin, Star, User, Check, X } from 'lucide-react';
import { toast } from "react-toastify";

const IconBtn = ({ children, onClick, title = '' }) => (
  <button onClick={onClick} className="p-2 rounded-md hover:bg-gray-100 transition" title={title}>
    {children}
  </button>
);

const ProfileCard = ({ userdetails, onEdit }) => {
  const initials = userdetails?.name?.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase() || 'U';
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 flex flex-col items-center text-center">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-white flex items-center justify-center text-2xl font-semibold text-gray-800 shadow-inner">
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
  <div className="bg-white p-4 rounded-xl shadow-sm flex items-start justify-between gap-4">
    <div>
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-gray-600" />
        <div>
          <div className="font-semibold">{addr.name} {addr.isDefault && <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">Default</span>}</div>
          <div className="text-sm text-gray-600 mt-1">{addr.address}, {addr.city}, {addr.state} - {addr.postalCode}</div>
          <div className="text-sm text-gray-500 mt-1">Phone: {addr.phone}{addr.altPhone ? ` • Alt: ${addr.altPhone}` : ''}</div>
        </div>
      </div>
    </div>

    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {!addr.isDefault && (<button onClick={() => onSetDefault(addr.id)} className="text-sm px-3 py-1 rounded-full border">Set Default</button>)}
        <IconBtn onClick={() => onEdit(addr)} title="Edit"><Pencil className="w-4 h-4"/></IconBtn>
        <IconBtn onClick={() => onDelete(addr.id)} title="Delete"><Trash2 className="w-4 h-4"/></IconBtn>
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

  const [isEditingUser, setIsEditingUser] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: '', phone: '', address: '', city: '', state: '', postalCode: '', landmark: '', altPhone: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [editingAddr, setEditingAddr] = useState(null);

  useEffect(() => {
    if (userdetails) {
      setName(userdetails.name || '');
      setPhone(userdetails.phone || '');
      getorders && getorders();
      getReviewsByUser && getReviewsByUser();
      getQueriesByUser && getQueriesByUser(userdetails.email);
    }
  }, [userdetails]);

  const findProduct = (productId) => products?.find(p => p.id === productId);

  const formatAddress = (addr) => `${addr.address}, ${addr.city}, ${addr.state}, ${addr.postalCode}`;

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
    if (!newAddress.name || !newAddress.address || !newAddress.city || !newAddress.postalCode || !newAddress.phone) return toast.error('Please fill required address fields');
    const created = await addAddress(newAddress);
    if (created) {
      toast.success('Address added');
      setIsAddingAddress(false);
      setNewAddress({ name: '', phone: '', address: '', city: '', state: '', postalCode: '', landmark: '', altPhone: '' });
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
        {/* Left: Profile Card */}
        <div className="lg:col-span-1">
          <ProfileCard userdetails={userdetails} onEdit={() => setIsEditingUser(true)} />

          {/* Quick stats or actions */}
          <div className="mt-6 bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Orders</div>
                <div className="font-semibold">{orders?.length || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Wishlist</div>
                <div className="font-semibold">{wishlist?.length || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tabs and content */}
        <div className="lg:col-span-3">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex flex-wrap gap-2 mb-6">
              {['profile','orders','addresses','reviews','queries','wishlist'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === t ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div>
              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isEditingUser ? (
                    <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input className="p-3 rounded-lg border" value={name} onChange={e => setName(e.target.value)} />
                        <input className="p-3 rounded-lg border" value={phone} onChange={e => setPhone(e.target.value)} />
                        <div className="flex gap-3 mt-2">
                          <button onClick={handleUpdateUser} className="px-4 py-2 rounded-lg bg-black text-white">Save</button>
                          <button onClick={() => setIsEditingUser(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                        </div>
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

              {activeTab === 'addresses' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">My Addresses</h2>
                    <button onClick={() => { setIsAddingAddress(!isAddingAddress); setEditingAddr(null); }} className="px-3 py-2 rounded-full bg-gray-100">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>

                  {isAddingAddress && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} placeholder="Full name" className="p-3 rounded-lg border" />
                      <input value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} placeholder="Phone" className="p-3 rounded-lg border" />
                      <input value={newAddress.address} onChange={e => setNewAddress({...newAddress, address: e.target.value})} placeholder="Address line" className="p-3 rounded-lg border md:col-span-2" />
                      <input value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} placeholder="City" className="p-3 rounded-lg border" />
                      <input value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} placeholder="State" className="p-3 rounded-lg border" />
                      <input value={newAddress.postalCode} onChange={e => setNewAddress({...newAddress, postalCode: e.target.value})} placeholder="Postal code" className="p-3 rounded-lg border" />
                      <input value={newAddress.landmark} onChange={e => setNewAddress({...newAddress, landmark: e.target.value})} placeholder="Landmark (optional)" className="p-3 rounded-lg border" />
                      <div className="md:col-span-2 flex gap-3">
                        <button onClick={handleAddAddress} className="px-4 py-2 rounded-lg bg-black text-white">Save Address</button>
                        <button onClick={() => setIsAddingAddress(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Edit address inline */}
                  {editingAddr && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input value={editingAddr.name} onChange={e => setEditingAddr({...editingAddr, name: e.target.value})} placeholder="Full name" className="p-3 rounded-lg border" />
                      <input value={editingAddr.phone} onChange={e => setEditingAddr({...editingAddr, phone: e.target.value})} placeholder="Phone" className="p-3 rounded-lg border" />
                      <input value={editingAddr.address} onChange={e => setEditingAddr({...editingAddr, address: e.target.value})} placeholder="Address line" className="p-3 rounded-lg border md:col-span-2" />
                      <input value={editingAddr.city} onChange={e => setEditingAddr({...editingAddr, city: e.target.value})} placeholder="City" className="p-3 rounded-lg border" />
                      <input value={editingAddr.state} onChange={e => setEditingAddr({...editingAddr, state: e.target.value})} placeholder="State" className="p-3 rounded-lg border" />
                      <input value={editingAddr.postalCode} onChange={e => setEditingAddr({...editingAddr, postalCode: e.target.value})} placeholder="Postal code" className="p-3 rounded-lg border" />
                      <input value={editingAddr.landmark} onChange={e => setEditingAddr({...editingAddr, landmark: e.target.value})} placeholder="Landmark (optional)" className="p-3 rounded-lg border" />
                      <div className="md:col-span-2 flex gap-3">
                        <button onClick={handleEditAddressSave} className="px-4 py-2 rounded-lg bg-black text-white">Save</button>
                        <button onClick={() => setEditingAddr(null)} className="px-4 py-2 rounded-lg border">Cancel</button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {address.map(addr => (
                      <div key={addr.id}>
                        <AddressCard
                          addr={addr}
                          onDelete={handleDeleteAddress}
                          onEdit={(a) => { setEditingAddr(a); setIsAddingAddress(false); window.scrollTo({top:0, behavior:'smooth'}); }}
                          onSetDefault={handleSetDefault}
                        />
                      </div>
                    ))}
                  </div>
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
                  <h2 className="text-xl font-semibold mb-4">Wishlist</h2>
                  {wishlist.length === 0 ? <p className="text-gray-500">Empty</p> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlist.map(item => {
                        const p = findProduct(item.productId);
                        if (!p) return null;
                        const discountedPrice = Math.floor(p.oprice * (1 - p.discount / 100));
                        return (
                          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm text-center">
                            <img src={Array.isArray(p.imageurl) ? p.imageurl[0] : p.imageurl} alt={p.name} className="h-32 w-full object-contain mb-3" />
                            <div className="font-medium">{p.name}</div>
                            <div className="text-sm text-gray-500">₹{discountedPrice} <span className="line-through text-gray-300">₹{p.oprice}</span></div>
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
    </div>
  );
};

export default UserPage;
