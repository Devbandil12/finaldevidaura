import React, { useMemo, useState } from 'react';
import { 
  ShoppingCart, Heart, Clock, TrendingUp, Send, Loader2, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { useRecoverAbandonedCart } from "../../features/admin/hooks/useAdmin";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const CartsWishlistsTab = ({ flatCarts, stats }) => {
  const { mutateAsync: recoverCart, isPending: isSending } = useRecoverAbandonedCart();
  const [expandedCartId, setExpandedCartId] = useState(null);
  
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

  const toggleExpand = (id) => {
    setExpandedCartId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 bg-[var(--bg)] min-h-screen font-body transition-colors duration-500 pb-24 w-full">
      
      {/* ── HEADER ── */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center py-5 px-6 bg-[var(--surface)] border border-[var(--border)]/30 dark:border-[var(--border)]/60 rounded-[1.5rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] gap-4"
      >
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-medium text-[var(--text)] tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)]/40 dark:border-[var(--border)]/60 text-[var(--brand)] shadow-sm">
              <TrendingUp size={18} strokeWidth={1.5} />
            </div>
            Conversion Analytics
          </h2>
          <p className="font-body text-xs text-[var(--muted)] mt-1.5 tracking-wide">
            Track abandoned checkouts and measure product desirability.
          </p>
        </div>
        
        {abandonedCarts.length > 0 && (
          <button 
            onClick={handleRecoverAll}
            disabled={isSending}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--text)] text-[var(--surface)] text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition-all disabled:opacity-50 shrink-0"
          >
            {isSending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} strokeWidth={2} />}
            {isSending ? "Sending Campaigns..." : "Recover All Carts"}
          </button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
        
        {/* ── LEFT: ABANDONED CARTS (Floating Glass Design) ── */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-3 px-2">
            <ShoppingCart size={16} strokeWidth={2} className="text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text)] tracking-tight">Active Abandoned Carts</h3>
            <span className="px-2 py-0.5 rounded-full font-body text-[9px] uppercase tracking-widest font-bold bg-[var(--surface-muted)] text-[var(--sub)] border border-[var(--border)]/40 dark:border-[var(--border)]/60">
              {abandonedCarts.length} Pending
            </span>
          </div>

          <div className="flex-1">
            {abandonedCarts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-[var(--surface)]/50 border border-[var(--border)]/20 dark:border-[var(--border)]/40 rounded-[1.5rem]">
                <ShoppingCart size={24} strokeWidth={1} className="text-[var(--muted)] mb-3" />
                <h3 className="font-display text-sm font-medium text-[var(--text)]">No abandoned carts</h3>
                <p className="font-body text-xs text-[var(--sub)] mt-1">Check back later for recovery opportunities.</p>
              </div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                {abandonedCarts.map((cart) => {
                  const isExpanded = expandedCartId === cart.user.id;

                  return (
                    <motion.div 
                      variants={itemVariants}
                      key={cart.user.id} 
                      className={`p-3.5 sm:p-4 bg-[var(--surface)] rounded-[1.25rem] border transition-all duration-500 ease-out group 
                        ${isExpanded ? 'border-[var(--border)]/60 dark:border-[var(--border)]/80 shadow-[0_12px_40px_rgba(0,0,0,0.06)]' : 'border-[var(--border)]/30 dark:border-[var(--border)]/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5'}`}
                    >
                      {/* Clickable Header */}
                      <div className="cursor-pointer" onClick={() => toggleExpand(cart.user.id)}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            {/* User Name matching font-display text-[13px] */}
                            <h4 className="font-display font-medium text-[var(--text)] text-[13px] tracking-tight group-hover:text-[var(--brand)] transition-colors line-clamp-1">
                              {cart.user.name}
                            </h4>
                            <p className="font-body text-[10px] font-medium text-[var(--sub)] mt-0.5 line-clamp-1">{cart.user.email}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-body text-sm font-bold text-[var(--text)] tracking-tight">₹{cart.totalValue.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]/20 dark:border-[var(--border)]/40">
                          {/* Creative Stacked Items UI */}
                          <div className="flex items-center">
                            <div className="flex -space-x-2.5">
                              {cart.items.slice(0, 4).map((item, idx) => (
                                <div 
                                  key={idx} 
                                  className="w-7 h-7 rounded-full border-[1.5px] border-[var(--surface)] bg-[var(--surface-muted)] overflow-hidden shadow-sm relative z-10 group-hover:scale-105 transition-transform duration-300"
                                  style={{ zIndex: 10 - idx }}
                                  title={item.name}
                                >
                                  <img 
                                    src={(Array.isArray(item.imageurl) ? item.imageurl[0] : item.imageurl) || "/fallback.png"} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                            {cart.items.length > 4 && (
                              <span className="font-body text-[9px] font-medium text-[var(--muted)] ml-2">
                                +{cart.items.length - 4} more
                              </span>
                            )}
                            {cart.items.length <= 4 && (
                              <span className="font-body text-[9px] font-medium text-[var(--muted)] ml-2">
                                {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-1.5 text-[9px] text-[var(--sub)] font-medium">
                              <Clock size={10} strokeWidth={2} /> 
                              <span>{cart.lastActivity.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <ChevronDown 
                              size={14} 
                              strokeWidth={2} 
                              className={`text-[var(--muted)] transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[var(--brand)]' : ''}`} 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Expanded Items List */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 mt-3 border-t border-[var(--border)]/20 dark:border-[var(--border)]/40 space-y-1">
                              {/* Cart Contents matched to User Name style */}
                              <h5 className="font-display font-medium text-[var(--muted)] text-[13px] tracking-tight mb-2 px-1 capitalize">Cart contents</h5>
                              
                              {cart.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface-muted)]/40 transition-colors duration-200">
                                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-muted)] overflow-hidden flex-shrink-0 border border-[var(--border)]/40 dark:border-[var(--border)]/60">
                                    <img 
                                      src={(Array.isArray(item.imageurl) ? item.imageurl[0] : item.imageurl) || "/fallback.png"} 
                                      alt={item.name} 
                                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-out"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0 pr-2">
                                    <p className="font-body text-[11px] font-bold text-[var(--text)] truncate">{item.name}</p>
                                    <p className="font-body text-[9px] font-medium text-[var(--sub)] mt-0.5 capitalize truncate">{item.variantName}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="font-body text-[11px] font-bold text-[var(--text)] tracking-tight">₹{item.itemValue.toLocaleString()}</p>
                                    <p className="font-body text-[9px] font-medium text-[var(--muted)] mt-0.5">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>

        {/* ── RIGHT: WISHLIST STATS (Soft Minimalist List) ── */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-3 px-2">
            <Heart size={16} strokeWidth={2} className="text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text)] tracking-tight">Most Wishlisted Items</h3>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)]/30 dark:border-[var(--border)]/60 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden flex-1">
            {stats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Heart size={24} strokeWidth={1} className="text-[var(--muted)] mb-3" />
                <h3 className="font-display text-sm font-medium text-[var(--text)]">No wishlist data</h3>
                <p className="font-body text-xs text-[var(--sub)] mt-1">Customer favorites will appear here.</p>
              </div>
            ) : (
              <div className="p-2 sm:p-3">
                {stats.map((item, index) => (
                  <div key={item.variantId} className="flex items-center gap-4 p-3 sm:p-4 hover:bg-[var(--surface-muted)]/40 rounded-xl transition-all duration-300 group cursor-default">
                    
                    <div className="flex-shrink-0 w-4 text-left font-body text-[10px] font-bold text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
                      {index + 1}.
                    </div>
                    
                    <div className="w-10 h-10 rounded-[0.65rem] bg-[var(--surface-muted)] overflow-hidden flex-shrink-0 border border-[var(--border)]/40 dark:border-[var(--border)]/60 group-hover:shadow-sm transition-all duration-300">
                      <img 
                        src={item.productImage || "/fallback.png"} 
                        alt={item.productName} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-end mb-1.5">
                        <div className="min-w-0 pr-3">
                          <h4 className="font-body text-xs font-bold text-[var(--text)] truncate group-hover:text-[var(--brand)] transition-colors">{item.productName}</h4>
                          <p className="font-body text-[9px] font-bold uppercase tracking-widest text-[var(--sub)] mt-0.5 truncate">{item.variantName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block font-body text-sm font-bold text-[var(--text)] tracking-tight leading-none">{item.count}</span>
                          <span className="font-body text-[8px] text-[var(--muted)] uppercase font-bold tracking-widest mt-1 block">Saves</span>
                        </div>
                      </div>
                      
                      {/* Premium Gradient Progress Bar */}
                      <div className="w-full bg-[var(--surface-muted)] rounded-full h-1 overflow-hidden relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.max((item.count / stats[0].count) * 100, 2)}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--accent)]" 
                        />
                      </div>
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