import React, { useMemo } from 'react';
import { 
  ShoppingCart, Heart, Clock, TrendingUp, Package, Send, Loader2, ArrowRight
} from 'lucide-react';
import { useRecoverAbandonedCart } from "../../features/admin/hooks/useAdmin";

const CartsWishlistsTab = ({ flatCarts, stats }) => {
  const { mutateAsync: recoverCart, isPending: isSending } = useRecoverAbandonedCart();
  
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

  const handleRecoverAll = async () => {
    if (abandonedCarts.length === 0) return;
    try {
        const userIds = abandonedCarts.map(c => c.user.id);
        await recoverCart({ userIds });
    } catch (error) {
        console.error("Error sending recovery emails:", error);
    }
  };

  return (
    <div className="space-y-10 p-4 sm:p-8 bg-[var(--bg)] min-h-screen font-body animate-fadeIn transition-colors duration-300 pb-20">
      
      {/* HEADER */}
      <div className="pb-6 border-b border-[var(--border)]">
        <h2 className="font-display text-4xl font-medium text-[var(--text)] flex items-center">
          <TrendingUp className="w-8 h-8 mr-3 text-[var(--accent)]" strokeWidth={1.5} /> 
          Cart & Wishlist Analytics
        </h2>
        <p className="font-display italic text-[var(--sub)] text-lg mt-2 tracking-wide">
          Monitor abandoned checkouts and popular wishlist items.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* LEFT: ABANDONED CARTS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-medium text-[var(--text)] flex items-center gap-3">
              <ShoppingCart className="text-[var(--accent)]" strokeWidth={1.5} size={24} /> 
              Abandoned Carts
              <span className="font-body text-xs px-2.5 py-0.5 rounded-md font-bold bg-[var(--surface-muted)] text-[var(--text)] border border-[var(--border)]">
                {abandonedCarts.length}
              </span>
            </h3>

            {abandonedCarts.length > 0 && (
                <button 
                    onClick={handleRecoverAll}
                    disabled={isSending}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--brand)] text-[var(--surface)] text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-[var(--brand-hover)] transition-all shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] button-hero disabled:opacity-50"
                >
                    {isSending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                    {isSending ? "Sending..." : "Recover All"}
                    {!isSending && <div className="pulse border-[var(--surface)]"></div>}
                </button>
            )}
          </div>

          <div className="space-y-5">
            {abandonedCarts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-[var(--surface)] rounded-2xl border border-[var(--border)] border-dashed shadow-sm">
                <ShoppingCart className="w-12 h-12 text-[var(--muted)] mb-4 opacity-50" strokeWidth={1} />
                <p className="font-display italic text-xl text-[var(--sub)] tracking-wide">No abandoned carts found.</p>
              </div>
            ) : (
              abandonedCarts.map((cart) => (
                <div key={cart.user.id} className="bg-[var(--surface)] rounded-xl shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] border border-[var(--border)] overflow-hidden transition-all duration-300 hover:border-[var(--border)] group">
                  
                  {/* Cart Header */}
                  <div className="p-5 flex justify-between items-start border-b border-[var(--border)] bg-[var(--surface)] group-hover:bg-[var(--surface)] transition-colors duration-300">
                    <div>
                      <h4 className="font-body font-bold text-[var(--text)] text-sm tracking-wide group-hover:text-[var(--brand)] transition-colors">{cart.user.name}</h4>
                      <p className="font-body text-[11px] font-bold text-[var(--sub)] mt-0.5">{cart.user.email}</p>
                      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[var(--muted)] uppercase tracking-widest font-bold">
                        <Clock size={12} strokeWidth={2} /> 
                        <span className="text-[var(--text)]">{cart.lastActivity.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {/* Font body enforced for all numbers */}
                      <p className="font-body text-xl font-bold text-[var(--text)] tracking-tight">₹{cart.totalValue.toLocaleString()}</p>
                      <span className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] bg-[var(--surface-muted)] px-2 py-0.5 rounded border border-[var(--border)] inline-block mt-1">
                        {cart.items.length} Items
                      </span>
                    </div>
                  </div>

                  {/* Cart Items Preview */}
                  <div className="bg-[var(--surface)] p-5 space-y-4">
                    {cart.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[var(--surface)] overflow-hidden flex-shrink-0 border border-[var(--border)]">
                          <img 
                            src={(Array.isArray(item.imageurl) ? item.imageurl[0] : item.imageurl) || "/fallback.png"} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-bold text-[var(--text)] truncate">{item.name}</p>
                          <p className="font-body text-[11px] font-bold text-[var(--sub)] mt-0.5">{item.variantName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-body text-sm font-bold text-[var(--success)]">₹{item.itemValue.toLocaleString()}</p>
                          <p className="font-body text-[11px] font-bold text-[var(--muted)] mt-0.5">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    {cart.items.length > 3 && (
                      <p className="font-body text-[10px] text-center text-[var(--sub)] uppercase tracking-widest font-bold pt-3 border-t border-[var(--border)]">
                        + {cart.items.length - 3} more items in cart
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: WISHLIST STATS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-medium text-[var(--text)] flex items-center gap-3">
              <Heart className="text-[var(--error)]" strokeWidth={1.5} size={24} /> 
              Most Wishlisted
            </h3>
          </div>

          <div className="bg-[var(--surface)] rounded-xl shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] border border-[var(--border)] overflow-hidden transition-all duration-300">
            {stats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Heart className="w-12 h-12 text-[var(--muted)] mb-4 opacity-50" strokeWidth={1.5} />
                <p className="font-display italic text-xl text-[var(--sub)] tracking-wide">No wishlist data available.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {stats.map((item, index) => (
                  <div key={item.variantId} className="p-5 flex items-center gap-5 hover:bg-[var(--surface)] transition-colors duration-300 group cursor-default">
                    {/* Numbers updated to Manrope */}
                    <div className="flex-shrink-0 w-8 text-center font-body text-sm font-bold text-[var(--muted)] group-hover:text-[var(--brand)] transition-colors">
                      {String(index + 1).padStart(2, '0')}.
                    </div>
                    
                    <div className="w-14 h-14 rounded-lg bg-[var(--surface)] overflow-hidden flex-shrink-0 border border-[var(--border)] group-hover:border-[var(--brand)] transition-colors duration-300">
                      <img 
                        src={item.productImage || "/fallback.png"} 
                        alt={item.productName} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-body text-sm font-bold text-[var(--text)] truncate tracking-wide group-hover:text-[var(--brand)] transition-colors">{item.productName}</h4>
                      <p className="font-body text-[11px] font-bold text-[var(--sub)] mt-1">{item.variantName}</p>
                      
                      <div className="mt-3 w-full bg-[var(--surface-muted)] rounded-full h-1 overflow-hidden">
                        <div 
                          className="bg-[var(--error)] h-full rounded-full transition-all duration-700 ease-out" 
                          style={{ width: `${Math.max((item.count / stats[0].count) * 100, 2)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-right">
                      {/* Numbers updated to Manrope */}
                      <span className="block font-body text-xl font-bold text-[var(--text)] tracking-tight">{item.count}</span>
                      <span className="font-body text-[10px] text-[var(--muted)] uppercase font-bold tracking-widest mt-0.5 block">Fans</span>
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