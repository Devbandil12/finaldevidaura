import React, { useMemo, useState } from 'react';
import { 
  ShoppingCart, Heart, Mail, Clock, TrendingUp, AlertCircle, Package, Send, CheckCircle, Loader2
} from 'lucide-react';

// Use backend URL from env
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

const CartsWishlistsTab = ({ flatCarts, stats }) => {
  const [isSending, setIsSending] = useState(false);
  
  // Logic remains unchanged
  const abandonedCarts = useMemo(() => {
    if (!flatCarts) return [];
    const userMap = new Map();
    flatCarts.forEach(item => {
      const { user, product, variant, cartItem } = item;
      if (!user || !product || !variant) return;
      if (!userMap.has(user.id)) {
        userMap.set(user.id, { user: user, items: [], totalValue: 0, lastActivity: new Date(0) });
      }
      const cart = userMap.get(user.id);
      const price = variant?.oprice ?? 0;
      const discount = variant?.discount ?? 0;
      const itemValue = (price * (1 - discount / 100)) * cartItem.quantity;
      cart.items.push({
        ...product, ...variant, id: variant.id, name: product.name,
        variantName: variant.name, imageurl: product.imageurl || [],
        quantity: cartItem.quantity, itemValue,
      });
      cart.totalValue += itemValue;
      const itemDate = new Date(cartItem.addedAt);
      if (itemDate > cart.lastActivity) cart.lastActivity = itemDate;
    });
    return Array.from(userMap.values()).sort((a, b) => b.lastActivity - a.lastActivity);
  }, [flatCarts]);

  // 🟢 NEW: Handle Recover All
  const handleRecoverAll = async () => {
    if (abandonedCarts.length === 0) return;
    setIsSending(true);

    try {
        const userIds = abandonedCarts.map(c => c.user.id);
        
        const res = await fetch(`${BACKEND_URL}/api/notifications/recover-abandoned`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds })
        });

        if (res.ok) {
            window.toast.success(`Recovery sent to ${userIds.length} users! 🚀`);
        } else {
            throw new Error("Failed to send");
        }
    } catch (error) {
        console.error(error);
        window.toast.error("Failed to send notifications");
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-8 bg-gray-50 min-h-screen text-gray-900 font-sans">
      
      {/* --- HEADER --- */}
      <div className="pb-6 border-b border-gray-200">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 flex items-center">
          <TrendingUp className="w-6 h-6 mr-3 text-indigo-600" /> Cart & Wishlist Analytics
        </h2>
        <p className="text-sm text-gray-500 mt-1">Monitor abandoned checkouts and popular wishlist items.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* --- LEFT: ABANDONED CARTS --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="text-amber-500" size={20} /> Abandoned Carts
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{abandonedCarts.length}</span>
            </h3>

            {/* 🟢 NEW: Combined Action Button */}
            {abandonedCarts.length > 0 && (
                <button 
                    onClick={handleRecoverAll}
                    disabled={isSending}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-all shadow-md"
                >
                    {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    {isSending ? "Sending..." : "Send Recovery to All"}
                </button>
            )}
          </div>

          <div className="space-y-4">
            {abandonedCarts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <ShoppingCart className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No abandoned carts found.</p>
              </div>
            ) : (
              abandonedCarts.map((cart) => (
                <div key={cart.user.id} className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] overflow-hidden hover:shadow-md transition-shadow relative">
                  
                  {/* Cart Header */}
                  <div className="p-5 flex justify-between items-start border-b border-gray-50">
                    <div>
                      <h4 className="font-bold text-gray-900">{cart.user.name}</h4>
                      <p className="text-sm text-gray-500">{cart.user.email}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <Clock size={12} /> Active: {cart.lastActivity.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-gray-900">₹{cart.totalValue.toLocaleString()}</p>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {cart.items.length} Items
                      </span>
                    </div>
                  </div>

                  {/* Cart Items Preview */}
                  <div className="bg-gray-50/50 p-4 space-y-3">
                    {cart.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white overflow-hidden flex-shrink-0">
                          <img 
                            src={(Array.isArray(item.imageurl) ? item.imageurl[0] : item.imageurl) || "/fallback.png"} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.variantName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-900">₹{item.itemValue.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">x{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    {cart.items.length > 3 && (
                      <p className="text-xs text-center text-gray-400 font-medium pt-1">
                        + {cart.items.length - 3} more items
                      </p>
                    )}
                  </div>

                  {/* Removed individual button footer */}
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- RIGHT: WISHLIST STATS --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Heart className="text-rose-500" size={20} /> Most Wishlisted
            </h3>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
            {stats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Heart className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No wishlist data available.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.map((item, index) => (
                  <div key={item.variantId} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 w-8 text-center font-bold text-gray-400 text-sm">
                      #{index + 1}
                    </div>
                    
                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                      <img 
                        src={item.productImage || "/fallback.png"} 
                        alt={item.productName} 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{item.productName}</h4>
                      <p className="text-xs text-gray-500">{item.variantName}</p>
                      
                      <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-rose-500 h-1.5 rounded-full" 
                          style={{ width: `${Math.min((item.count / stats[0].count) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="block text-lg font-bold text-gray-900">{item.count}</span>
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Fans</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CartsWishlistsTab;