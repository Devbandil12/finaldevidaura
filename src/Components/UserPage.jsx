import React, { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import { OrderContext } from "../contexts/OrderContext";
import { CartContext } from "../contexts/CartContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { ReviewContext } from "../contexts/ReviewContext";
import { Pencil, Trash2, Plus, MapPin, Star } from 'lucide-react';
import { toast } from "react-toastify";

const UserPage = () => {
    const { userdetails, address, getUserDetail, getUserAddress } = useContext(UserContext);
    const { orders, loadingOrders, getorders } = useContext(OrderContext);
    const { wishlist, isWishlistLoading } = useContext(CartContext);
    const { products, loading: productsLoading } = useContext(ProductContext);
    const { queries, getQueriesByUser } = useContext(ContactContext);
    const { userReviews, loadingReviews, getReviewsByUser } = useContext(ReviewContext);

    const [isEditingUser, setIsEditingUser] = useState(false);
    const [name, setName] = useState(userdetails?.name || "");
    const [phone, setPhone] = useState(userdetails?.phone || "");
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        name: "", phone: "", address: "", city: "", state: "", postalCode: "", landmark: ""
    });

    useEffect(() => {
        if (userdetails) {
            setName(userdetails.name);
            setPhone(userdetails.phone || "");
        }
        if (userdetails) {
            getorders();
            getReviewsByUser();
            getQueriesByUser(userdetails.email);
        }
    }, [userdetails, getorders, getReviewsByUser, getQueriesByUser]);

    const handleUpdateUser = async () => {
        toast.success("User details updated!");
        setIsEditingUser(false);
    };

    const handleAddAddress = async () => {
        toast.success("Address added!");
        setIsAddingAddress(false);
        setNewAddress({ name: "", phone: "", address: "", city: "", state: "", postalCode: "", landmark: "" });
    };

    const handleDeleteAddress = async (addressId) => {
        if (window.confirm("Are you sure you want to delete this address?")) {
            toast.info("Address deleted!");
        }
    };
    
    const findProduct = (productId) => products.find(p => p.id === productId);

    const formatAddress = (addr) => `${addr.address}, ${addr.city}, ${addr.state}, ${addr.postalCode}`;

    if (!userdetails || productsLoading || loadingOrders || isWishlistLoading || loadingReviews) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading user data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8 pt-[60px] text-gray-900">
            <div className="max-w-7xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold border-b pb-4">My Account</h1>

                {/* Section 1: User Details */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Profile Information</h2>
                        <button onClick={() => setIsEditingUser(!isEditingUser)} className="p-2 rounded-full hover:bg-gray-100 transition">
                            <Pencil className="h-5 w-5" />
                        </button>
                    </div>
                    {isEditingUser ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="p-2 border rounded" />
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="p-2 border rounded" />
                            <button onClick={handleUpdateUser} className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition">Save Changes</button>
                            <button onClick={() => setIsEditingUser(false)} className="bg-gray-200 text-black py-2 px-4 rounded hover:bg-gray-300 transition">Cancel</button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p><strong>Name:</strong> {userdetails.name}</p>
                            <p><strong>Email:</strong> {userdetails.email}</p>
                            <p><strong>Phone:</strong> {userdetails.phone || 'N/A'}</p>
                        </div>
                    )}
                </div>

                {/* Section 2: Order History */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-semibold mb-4">Order History</h2>
                    {orders.length === 0 ? (
                        <p className="text-gray-500">You have no orders yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order.id} className="border p-4 rounded-lg">
                                    <div className="flex justify-between items-center font-medium mb-2">
                                        <span>Order #{order.id}</span>
                                        <span>₹{order.totalAmount}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Status: {order.status}</p>
                                    <p className="text-sm text-gray-600">Placed on: {new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section 3: My Reviews */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-semibold mb-4">My Reviews</h2>
                    {userReviews.length === 0 ? (
                        <p className="text-gray-500">You have not submitted any reviews yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {userReviews.map(review => {
                                const reviewedProduct = findProduct(review.productId);
                                return (
                                    <div key={review.id} className="border p-4 rounded-lg">
                                        <p className="font-semibold mb-1">{reviewedProduct ? reviewedProduct.name : "Product not found"}</p>
                                        <div className="flex items-center mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                        <p className="text-gray-700">{review.comment}</p>
                                        <p className="text-xs text-gray-500 mt-2">Reviewed on {new Date(review.createdAt).toLocaleDateString()}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Section 4: My Queries */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-semibold mb-4">My Queries</h2>
                    {queries.length === 0 ? (
                        <p className="text-gray-500">You have not submitted any queries yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {queries.map((query, index) => (
                                <div key={index} className="border p-4 rounded-lg">
                                    <p className="font-semibold mb-1">Message:</p>
                                    <p className="text-gray-700">{query.message}</p>
                                    <p className="text-xs text-gray-500 mt-2">Submitted on: {query.createdAt}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section 5: Addresses */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">My Addresses</h2>
                        <button onClick={() => setIsAddingAddress(!isAddingAddress)} className="p-2 rounded-full hover:bg-gray-100 transition">
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                    {isAddingAddress && (
                        <div className="p-4 mb-4 border rounded-lg bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" value={newAddress.name} onChange={(e) => setNewAddress({...newAddress, name: e.target.value})} placeholder="Full Name" className="p-2 border rounded" />
                            <input type="tel" value={newAddress.phone} onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})} placeholder="Phone Number" className="p-2 border rounded" />
                            <input type="text" value={newAddress.address} onChange={(e) => setNewAddress({...newAddress, address: e.target.value})} placeholder="Address Line" className="p-2 border rounded col-span-1 md:col-span-2" />
                            <input type="text" value={newAddress.city} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} placeholder="City" className="p-2 border rounded" />
                            <input type="text" value={newAddress.state} onChange={(e) => setNewAddress({...newAddress, state: e.target.value})} placeholder="State" className="p-2 border rounded" />
                            <input type="text" value={newAddress.postalCode} onChange={(e) => setNewAddress({...newAddress, postalCode: e.target.value})} placeholder="Postal Code" className="p-2 border rounded" />
                            <input type="text" value={newAddress.landmark} onChange={(e) => setNewAddress({...newAddress, landmark: e.target.value})} placeholder="Landmark (Optional)" className="p-2 border rounded" />
                            <button onClick={handleAddAddress} className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition col-span-2">Save Address</button>
                        </div>
                    )}
                    {address.length === 0 ? (
                        <p className="text-gray-500">You have no saved addresses.</p>
                    ) : (
                        <div className="space-y-4">
                            {address.map(addr => (
                                <div key={addr.id} className="border p-4 rounded-lg flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <MapPin className="h-5 w-5 text-gray-600" />
                                            <p className="font-semibold">{addr.name}</p>
                                            {addr.isDefault && <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">Default</span>}
                                        </div>
                                        <p className="text-sm mt-1">{formatAddress(addr)}</p>
                                        <p className="text-sm text-gray-600">Phone: {addr.phone}</p>
                                    </div>
                                    <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-600 transition">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section 6: Wishlist */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-semibold mb-4">My Wishlist</h2>
                    {wishlist.length === 0 ? (
                        <p className="text-gray-500">Your wishlist is empty.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {wishlist.map(item => {
                                const product = findProduct(item.productId);
                                if (!product) return null;
                                const discountedPrice = Math.floor(product.oprice * (1 - product.discount / 100));
                                return (
                                    <div key={item.id} className="border rounded-lg overflow-hidden flex flex-col items-center p-4 text-center">
                                        <img src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl} alt={product.name} className="h-32 w-32 object-contain mb-2" />
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-gray-600">₹{discountedPrice} <span className="line-through text-gray-400">₹{product.oprice}</span></p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPage;
