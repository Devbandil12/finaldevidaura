// ✅ file: src/pages/Cart.jsx
import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { UserContext } from "../contexts/UserContext";
import { useCart, useAddToCart, useUpdateCartQuantity, useRemoveFromCart, useClearCart, useSavedItems, useSaveForLater, useMoveSavedToCart, useRemoveSavedItem, usePricePreview } from "../features/cart/hooks/useCart";
import { useAvailableCoupons, useAutoOfferInstructions, useValidateCoupon } from "../features/coupons/hooks/useCoupons";
import { useCheckout } from "../features/checkout/hooks/useCheckout";

import { CartItemSkeleton } from "../components/ui/ShimmerSkeleton";
import HeroButton from "../Components/HeroButton";
import CartRecommendations from "./CartRecommendations"; 
import { FaShoppingCart, FaTrashAlt } from "react-icons/fa";
import { FiGift, FiCheckCircle, FiX, FiBell, FiChevronRight, FiSearch,FiMinus, FiTag, FiClock, FiHeart } from "react-icons/fi";

// ==========================================
// 1. CONSTANTS & ANIMATIONS
// ==========================================

const gpuStyle = {
  backfaceVisibility: "hidden",
  perspective: 1000,
  willChange: "transform, opacity",
};

const rigidTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.35,
};

const itemVariants = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: rigidTransition },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2, ease: "easeIn" } }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: rigidTransition },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: "easeIn" } }
};

// ==========================================
// 2. HELPER COMPONENTS
// ==========================================

const BundleItemsList = ({ items }) => {
  if (!items || !Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {items.map((subItem, index) => (
        <div 
          key={index} 
          className="flex flex-col justify-center px-3 py-2 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--surface-muted)] transition-colors duration-200"
        >
          <p className="font-bold text-[var(--text)] text-[11px] truncate w-full">
            {subItem.product?.name || subItem.name}
          </p>
          <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider mt-0.5">
            {subItem.variant?.size || subItem.variantName || "30ml"}
          </p>
        </div>
      ))}
    </div>
  );
};

const OfferInstructionCard = ({ offer, minimalist = false }) => {
  const generateInstruction = () => {
    const { discountType, discountValue, minOrderValue, cond_requiredCategory, cond_requiredSize, action_targetSize, action_targetMaxPrice, action_buyX, action_getY } = offer;

    if (discountType === "free_item" && cond_requiredCategory && action_targetSize && !action_buyX) {
      let text = `Add any item from the "${cond_requiredCategory}" category and a ${action_targetSize}ml perfume`;
      if (action_targetMaxPrice) text += ` (up to ₹${action_targetMaxPrice})`;
      return text + " to your cart to get the perfume for free!";
    }
    if (discountType === "free_item" && action_buyX && action_getY && cond_requiredSize && action_targetSize) {
      let text = `Buy ${action_buyX} perfume(s) of ${cond_requiredSize}ml, and get ${action_getY} perfume(s) of ${action_targetSize}ml for free`;
      if (action_targetMaxPrice) text += ` (up to ₹${action_targetMaxPrice} value)`;
      return text + ". Add all items to your cart to apply.";
    }
    if (discountType === "free_item" && action_buyX && action_getY && action_targetSize && !cond_requiredSize) {
      return `Buy ${action_buyX} ${action_targetSize}ml perfume(s), get ${action_getY} free! Add all ${action_buyX + action_getY} items to your cart to apply.`;
    }
    if (discountType === "percent") {
      let text = `Get ${discountValue}% off your order`;
      if (minOrderValue > 0) text += ` when you spend ₹${minOrderValue} or more`;
      return text + ". Applied automatically at checkout.";
    }
    if (discountType === "flat") {
      let text = `Get ₹${discountValue} off your order`;
      if (minOrderValue > 0) text += ` when you spend ₹${minOrderValue} or more`;
      return text + ". Applied automatically at checkout.";
    }
    return offer.description || "Special offer available.";
  };

  return (
    <div className={`p-4 bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg ${minimalist ? "py-3 px-3 text-sm" : ""}`}>
      <div className="flex items-start gap-3">
        <FiTag className={`mt-1 text-[var(--text)] ${minimalist ? "w-3 h-3" : ""}`} />
        <div>
          {!minimalist && <p className="font-bold text-[var(--text)]">{offer.code}</p>}
          <p className={`${minimalist ? "text-[var(--sub)]" : "text-sm text-[var(--sub)] mt-1"}`}>{generateInstruction()}</p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. SUB-COMPONENTS (PRESENTATIONAL)
// ==========================================

const AutoOfferModal = ({ isOpen, onClose, instructions }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }} style={{ willChange: "opacity" }}
        className="fixed inset-0 bg-[var(--overlay-strong)] backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants} initial="hidden" animate="visible" exit="exit"
          style={gpuStyle} onClick={(e) => e.stopPropagation()}
          className="bg-[var(--surface)] rounded-xl shadow-[var(--shadow-strong)] w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="bg-[var(--brand)] p-5 flex justify-between items-center text-[var(--brand-contrast)] sticky top-0 z-10">
            <h3 className="text-lg font-bold flex items-center gap-2"><FiGift className="text-[var(--brand-contrast)]" /> Automatic Offers & Help</h3>
            <button onClick={onClose} className="text-[var(--brand-contrast)]/70 hover:text-[var(--brand-contrast)] transition-colors"><FiX size={24} /></button>
          </div>
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="space-y-4">
              <h4 className="font-bold text-[var(--text)] border-b pb-2">How Automatic Coupons Work</h4>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--brand-contrast)] text-[var(--brand)] flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-[var(--text)] mb-1">Add Items to Cart</h4>
                  <p className="text-sm text-[var(--sub)] leading-relaxed">Simply browse our collection and add the products you love to your cart.</p>
                </div>
              </div>
            </div>
            <div className="border-t border-[var(--border)]"></div>
            <div>
              <h4 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Current Active Offers</h4>
              <div className="space-y-3">
                {instructions.length > 0 ? (
                  instructions.map((offer) => <OfferInstructionCard key={offer.id} offer={offer} />)
                ) : (
                  <p className="text-sm text-[var(--muted)] italic">No automatic offers are currently active.</p>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-muted)] text-center">
            <button onClick={onClose} className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--sub)] font-semibold py-3 rounded-xl hover:bg-[var(--surface-muted)] transition-colors">Got it</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const CouponSelectionModal = ({ isOpen, onClose, coupons, search, onSearchChange, onApply, cartSubtotal, cartItemCount }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }} style={{ willChange: "opacity" }}
        onClick={onClose}
        className="fixed inset-0 bg-[var(--overlay-strong)] backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      >
        <motion.div
          variants={modalVariants} initial="hidden" animate="visible" exit="exit"
          style={gpuStyle} onClick={(e) => e.stopPropagation()}
          className="bg-[var(--surface)] w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)] sticky top-0 z-10">
            <div>
              <h3 className="text-xl font-bold text-[var(--text)] tracking-tight">Select Coupon</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Maximize your savings</p>
            </div>
            <button onClick={onClose} className="p-2 bg-[var(--surface-muted)] rounded-full text-[var(--muted)] hover:bg-[var(--brand)] hover:text-[var(--brand-contrast)] transition-all duration-200"><FiX size={20} /></button>
          </div>
          <div className="px-5 pt-4 pb-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text" placeholder="Search coupons..." value={search} onChange={onSearchChange}
                className="w-full bg-[var(--surface-muted)] border border-[var(--border)] pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>
          </div>
          <div className="p-5 overflow-y-auto space-y-4 bg-[var(--surface)] flex-grow">
            {coupons.length > 0 ? (
              coupons.map((coupon) => {
                const shortfall = (coupon.minOrderValue || 0) - cartSubtotal;
                const itemShortfall = (coupon.minItemCount || 0) - cartItemCount;
                
                let isDisabled = false;
                let requirementMsg = null;

                if (shortfall > 0) {
                    isDisabled = true;
                    requirementMsg = `Add items worth ₹${shortfall} more to apply`;
                } else if (itemShortfall > 0) {
                    isDisabled = true;
                    requirementMsg = `Add ${itemShortfall} more item${itemShortfall > 1 ? 's' : ''} to apply`;
                }

                return (
                  <motion.div
                    key={coupon.id} layout whileHover={{ scale: 1.01, borderColor: isDisabled ? "#e5e7eb" : "#000000" }}
                    transition={{ duration: 0.2, ease: "easeInOut" }} style={{ willChange: "transform" }}
                    className={`group relative flex w-full bg-[var(--bg)] border-2 border-dashed rounded-xl overflow-hidden cursor-default min-h-[80px] transition-colors duration-300 ${isDisabled ? 'border-[var(--border)] opacity-70' : 'border-[var(--border)]'}`}
                  >
                    <div className="flex flex-col justify-center px-4 py-3 bg-[var(--surface-muted)]/30 border-r border-dashed border-[var(--border)] w-[100px] flex-shrink-0 items-center">
                      <div className="flex items-center gap-1.5 text-[var(--brand)] mb-1">
                        <FiTag className={`transition-colors ${isDisabled ? 'text-[var(--muted)]' : 'text-[var(--muted)] group-hover:text-[var(--brand)]'}`} size={16} />
                        <span className={`font-bold text-lg tracking-wide uppercase ${isDisabled ? 'text-[var(--muted)]' : 'text-[var(--text)]'}`}>{coupon.code}</span>
                      </div>
                      <span className="text-xs text-[var(--muted)] leading-relaxed">{coupon.description}</span>
                      
                      {requirementMsg && (
                        <div className="mt-2 inline-block">
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                                {requirementMsg}
                            </span>
                        </div>
                      )}
                    </div>
                    <div className="w-[28%] flex items-center justify-center p-3 bg-[var(--surface-muted)]/30">
                      <button 
                        onClick={() => onApply(coupon)} 
                        disabled={isDisabled}
                        className={`text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm w-full ${isDisabled ? 'bg-[var(--surface-muted)] text-[var(--muted)] cursor-not-allowed' : 'bg-[var(--brand)] text-[var(--brand-contrast)] hover:bg-[var(--brand-hover)]'}`}
                      >
                        APPLY
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center text-[var(--muted)]">
                <FiSearch size={40} className="mb-3 opacity-20" />
                <p className="font-medium text-[var(--text)]">No coupons found</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const CartItemCard = ({ item, breakdown, isBuyNowActive, onQuantityChange, onRemove, onSaveForLater }) => {
  if (!item || !item.product || !item.variant) return null;

  const itemImageUrl = Array.isArray(item.product.imageurl) && item.product.imageurl.length > 0 ? item.product.imageurl[0] : "/placeholder.png";
  const isFree = (breakdown.appliedOffers || []).some((offer) => offer.appliesToVariantId === item.variant.id);
  const isOutOfStock = Number(item.variant.stock || 0) <= 0;
  const sellingPrice = Math.floor(Number(item.variant.oprice || 0) * (1 - (Number(item.variant.discount || 0) / 100)));
  const showLineThrough = Number(item.variant.oprice || 0) > Number(sellingPrice) && Number(item.variant.discount || 0) > 0;

  return (
    <motion.div
      layout
      transition={rigidTransition}
      variants={itemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={gpuStyle}
      className="relative group mb-0"
    >
      <div className="flex flex-row gap-5 max-[400px]:gap-3 bg-[var(--surface)] p-5 max-[400px]:p-1 rounded-[2rem] shadow-[var(--shadow)] transition-all duration-300 border border-transparent hover:border-[var(--border)]">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 max-[400px]:w-24 max-[400px]:h-24 flex-shrink-0 bg-[var(--surface-muted)] rounded-[1.5rem] overflow-hidden p-2">
          <img 
            src={itemImageUrl} 
            alt={item.product.name} 
            className={`w-full h-full object-cover rounded-[1rem] transition-opacity duration-300 ${isOutOfStock ? "opacity-50 grayscale" : "opacity-100"}`} 
            loading="eager" 
          />
          
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-[var(--surface)]/90 backdrop-blur text-[10px] max-[400px]:text-[8px] font-bold text-[var(--error)] px-3 max-[400px]:px-2 py-1 rounded-full shadow-sm border border-[var(--error)]/20 text-center leading-none">OUT OF STOCK</span>
            </div>
          )}

          {Number(item.variant.discount) > 0 && !isFree && (
            <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
              <span className="bg-[var(--overlay-strong)] backdrop-blur-sm text-[var(--surface)] text-[9px] max-[400px]:text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm mb-1">
                {item.variant.discount}% OFF
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div className="flex justify-between items-start gap-4 max-[400px]:gap-2">
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="font-bold text-[var(--text)] text-lg max-[400px]:text-base leading-snug truncate pr-2">{item.product.name}</h3>
              
              {item.isBundle ? (
                <div className="opacity-70 origin-left scale-95 -ml-1"><BundleItemsList items={item.contents} /></div>
              ) : (
                <p className="text-xs max-[400px]:text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">{item.variant.size} ml</p>
              )}
            </div>

            <div className="text-right flex flex-col items-end flex-shrink-0">
              {isFree ? (
                <span className="text-xs max-[400px]:text-[10px] font-bold text-green-700 bg-green-50 px-3 max-[400px]:px-2 py-1 rounded-full tracking-wide">FREE GIFT</span>
              ) : (
                <span className="text-lg max-[400px]:text-base font-bold text-[var(--text)]">₹{sellingPrice}</span>
              )}
              {showLineThrough && <span className="text-xs max-[400px]:text-[10px] text-[var(--muted)] line-through mt-0.5">₹{item.variant.oprice}</span>}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 max-[400px]:gap-2">
            <div className={`flex items-center bg-[var(--surface-muted)] rounded-full p-1.5 max-[400px]:p-1 flex-shrink-0 ${isOutOfStock ? "opacity-50 pointer-events-none" : ""}`}>
              <button 
                onClick={() => onQuantityChange(item, -1)} 
                disabled={item.quantity <= 1} 
                className="w-8 h-8 max-[400px]:w-6 max-[400px]:h-6 flex items-center justify-center bg-[var(--surface)] rounded-full shadow-sm text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-30 disabled:shadow-none transition-all active:scale-90 max-[400px]:text-sm"
              >
                <FiMinus size={14} strokeWidth={3} />
              </button>
              <span className="w-10 max-[400px]:w-6 text-center text-sm max-[400px]:text-xs font-bold text-[var(--text)]">{item.quantity}</span>
              <button 
                onClick={() => onQuantityChange(item, 1)} 
                className="w-8 h-8 max-[400px]:w-6 max-[400px]:h-6 flex items-center justify-center bg-[var(--surface)] rounded-full shadow-sm text-[var(--muted)] hover:text-[var(--text)] transition-all active:scale-90 max-[400px]:text-sm"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-2 max-[400px]:gap-1 flex-shrink-0">
              {!isBuyNowActive && (
                <button 
                  onClick={() => onSaveForLater(item)} 
                  className="w-10 h-10 max-[400px]:w-8 max-[400px]:h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] rounded-full transition-all" 
                  title="Save for later"
                >
                  <FiClock className="w-5 h-5 max-[400px]:w-4 max-[400px]:h-4" />
                </button>
              )}
              <button 
                onClick={() => onRemove(item)} 
                className="w-10 h-10 max-[400px]:w-8 max-[400px]:h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--error)] hover:bg-red-50 rounded-full transition-all" 
                title="Remove item"
              >
                <FaTrashAlt className="w-[18px] h-[18px] max-[400px]:w-3.5 max-[400px]:h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SavedForLaterSection = ({ items, onRemove, onMoveToCart }) => {
  if (items.length === 0) {
    return (
      <motion.div layout="position" transition={rigidTransition} className="mt-16 pt-8">
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-[2rem] bg-[var(--surface-muted)]/80">
          <div className="w-20 h-20 bg-[var(--surface)] rounded-full flex items-center justify-center shadow-[var(--shadow)] mb-6 text-[var(--muted)]">
            <FiHeart size={28} />
          </div>
          <h3 className="text-[var(--text)] font-bold text-xl tracking-tight">Your wishlist is quiet</h3>
          <p className="text-[var(--muted)] text-sm mt-2 max-w-xs leading-relaxed">
            Items you want to save for later will appear here, ready when you are.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div layout="position" transition={rigidTransition} className="mt-16 pt-8">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--surface-muted)] rounded-full flex items-center justify-center text-[var(--text)]">
             <FiHeart size={18} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">Saved for Later</h2>
        </div>
        <span className="px-4 py-1.5 bg-[var(--surface-muted)] rounded-full text-xs font-bold text-[var(--sub)]">
          {items.length} ITEMS
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            const variant = item.variant;
            const product = item.product || item.variant.product;
            const itemImageUrl = Array.isArray(product.imageurl) && product.imageurl.length > 0 ? product.imageurl[0] : "/placeholder.png";
            
            const originalPrice = Number(variant.oprice || 0);
            const discount = Number(variant.discount || 0);
            const price = Math.floor(originalPrice * (1 - discount / 100));
            const showLineThrough = originalPrice > price && discount > 0;

            return (
              <motion.div
                key={item.variant.id}
                layout
                transition={{ ...rigidTransition, layout: rigidTransition }}
                variants={itemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="group relative bg-[var(--surface)] p-4 rounded-[2rem] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] transition-shadow duration-300"
              >
                <button
                  onClick={() => onRemove(variant.id)}
                  className="absolute z-10 top-5 right-5 w-8 h-8 flex items-center justify-center bg-[var(--surface)]/80 backdrop-blur hover:bg-red-50 text-[var(--muted)] hover:text-[var(--error)] rounded-full transition-colors duration-200 shadow-sm"
                >
                  <FiX size={14} />
                </button>

                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 flex-shrink-0 bg-[var(--surface-muted)] rounded-[1.5rem] overflow-hidden p-2">
                    <img 
                      src={itemImageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover rounded-[1rem] group-hover:scale-105 transition-transform duration-500" 
                    />
                    
                    {discount > 0 && (
                      <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
                        <span className="bg-[var(--overlay-strong)] backdrop-blur-sm text-[var(--surface)] text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm mb-1">
                          {discount}% OFF
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-bold text-base text-[var(--text)] leading-snug truncate">{product.name}</h3>
                    
                    {(item.isBundle || (item.contents && item.contents.length > 0)) ? (
                      <div className="mt-1 opacity-60 scale-90 origin-left"><BundleItemsList items={item.contents} isCompact={true} /></div>
                    ) : (
                      <p className="text-xs font-medium text-[var(--muted)] mt-1 uppercase tracking-wide">{variant.size} ml</p>
                    )}

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-[var(--text)] font-bold">₹{price}</span>
                      {showLineThrough && (
                        <span className="text-xs text-[var(--muted)] line-through decoration-gray-300">
                          ₹{originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    onClick={() => onMoveToCart(item)}
                    className="w-full py-3.5 text-xs font-bold uppercase tracking-widest text-[var(--brand-contrast)] bg-[var(--brand)] rounded-full hover:bg-[var(--brand-hover)] active:scale-95 transition-all duration-300"
                  >
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const OrderSummary = ({ breakdown, loadingPrices, appliedCoupon, onRemoveCoupon, manualCouponCode, setManualCouponCode, onManualApply, availableCouponsCount, onOpenCouponModal, checkoutError, onCheckout, isBuyNowActive, couponMessage }) => {
  const productDiscount = Number(breakdown.originalTotal || 0) - Number(breakdown.productTotal || 0);
  const finalPrice = typeof breakdown.totalExcludingDelivery !== "undefined" ? breakdown.totalExcludingDelivery : breakdown.total;

  return (
    <div className="sticky top-8">
      <div className="bg-[var(--surface)] rounded-[2.5rem] p-5 max-[400px]:p-1 shadow-[var(--shadow)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--surface-muted)] rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <h2 className="text-2xl font-bold text-[var(--text)] mb-8 relative z-10">Order Summary</h2>

        {loadingPrices ? (
          <div className="space-y-6 animate-pulse px-2">
            <div className="flex justify-between"><div className="h-4 bg-[var(--surface-muted)] rounded-full w-1/3"></div><div className="h-4 bg-[var(--surface-muted)] rounded-full w-1/4"></div></div>
            <div className="flex justify-between"><div className="h-4 bg-[var(--surface-muted)] rounded-full w-1/2"></div><div className="h-4 bg-[var(--surface-muted)] rounded-full w-1/5"></div></div>
            <div className="h-16 bg-[var(--surface-muted)] rounded-3xl w-full mt-6"></div>
          </div>
        ) : (
          <>
            <div className="space-y-4 px-1">
              <div className="flex justify-between text-[var(--muted)] text-sm font-medium">
                <span>Subtotal</span>
                <span className="text-[var(--text)]">₹{Number(breakdown.originalTotal || 0).toFixed(2)}</span>
              </div>

              {productDiscount > 0 && (
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-[var(--muted)]">Discount</span>
                  <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md">-₹{productDiscount.toFixed(2)}</span>
                </div>
              )}

              {breakdown.appliedOffers && Array.isArray(breakdown.appliedOffers) && breakdown.appliedOffers.map((offer, index) => (
                <div key={index} className="flex justify-between text-sm font-medium">
                  <span className="text-green-600 truncate pr-4">{offer.title}</span>
                  <span className="text-green-600">-₹{Number(offer.amount || 0).toFixed(2)}</span>
                </div>
              ))}
              
              <div className="h-px w-full bg-[var(--surface-muted)] my-6"></div>

              <div className="mb-6">
                <AnimatePresence mode="wait">
                  {appliedCoupon ? (
                    <motion.div 
                      key="applied"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-green-50/50 rounded-3xl p-4 flex items-center justify-between border border-green-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[var(--surface)] p-2 rounded-full text-[var(--success)] shadow-sm"><FiTag size={16} /></div>
                        <div>
                          <p className="text-sm font-bold text-[var(--success)]">{appliedCoupon.code}</p>
                          <p className="text-xs text-[var(--success)]/80 mt-0.5">{appliedCoupon.description}</p>
                        </div>
                      </div>
                      <button onClick={onRemoveCoupon} className="w-8 h-8 flex items-center justify-center bg-[var(--surface)] text-[var(--muted)] rounded-full shadow-sm hover:text-[var(--error)] transition-colors">
                        <FiX size={14} />
                      </button>
                    </motion.div>
                  ) : (
                    <div className="bg-[var(--surface-muted)] p-1.5 rounded-[1.5rem] flex relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                         <FiTag className="text-[var(--muted)]" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Promo Code" 
                        value={manualCouponCode} 
                        onChange={(e) => setManualCouponCode(e.target.value.toUpperCase())} 
                        onKeyDown={(e) => e.key === "Enter" && onManualApply()}
                        className="bg-transparent border-none text-[var(--text)] text-sm font-medium w-full pl-10 pr-20 py-3 focus:ring-0 placeholder:text-[var(--muted)]" 
                      />
                      <button 
                        onClick={onManualApply} 
                        className="absolute right-1.5 top-1.5 bottom-1.5 bg-[var(--bg)] shadow-sm text-[var(--text)] text-xs font-bold px-4 rounded-[1.2rem] hover:bg-[var(--brand)] hover:text-[var(--brand-contrast)] transition-all disabled:opacity-50 disabled:hover:bg-[var(--bg)] disabled:hover:text-[var(--text)]"
                        disabled={!manualCouponCode}
                      >
                        APPLY
                      </button>
                    </div>
                  )}
                </AnimatePresence>
                
                {couponMessage && (
                  <p className="text-xs font-medium text-blue-600 mt-2 px-2">{couponMessage}</p>
                )}
                
                {availableCouponsCount > 0 && !appliedCoupon && (
                   <button onClick={onOpenCouponModal} className="mt-3 ml-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 transition-colors">
                      See {availableCouponsCount} available offers <FiChevronRight />
                   </button>
                )}
              </div>

              <div className="flex justify-between items-center pb-2">
                <span className="text-lg text-[var(--text)]">Total</span>
                <span className="text-2xl text-[var(--text)] tracking-tighter">₹{Number(finalPrice || 0).toFixed(2)}</span>
              </div>
            </div>
          </>
        )}

        <AnimatePresence>
          {checkoutError && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4">
              <div className="bg-red-50 text-red-500 rounded-2xl p-4 text-center text-xs font-bold tracking-wide">
                {checkoutError}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8">
          <HeroButton 
            className="w-full py-5 text-sm uppercase tracking-[0.15em] font-bold bg-[var(--brand)] text-[var(--brand-contrast)] rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-[var(--shadow-strong)] transition-all duration-300 ease-out" 
            onClick={onCheckout}
          >
            {isBuyNowActive ? "Pay Now" : "Checkout"}
          </HeroButton>
        </div>
        
        <div className="mt-6 flex justify-center gap-2">
           <span className="w-1.5 h-1.5 bg-[var(--border)] rounded-full"></span>
           <span className="w-1.5 h-1.5 bg-[var(--border)] rounded-full"></span>
           <span className="w-1.5 h-1.5 bg-[var(--border)] rounded-full"></span>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 4. MAIN COMPONENT (CONTAINER)
// ==========================================

const ShoppingCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useUser();
  const [checkoutError, setCheckoutError] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);

  const { userdetails } = useContext(UserContext);
  const { buyNow, startBuyNow, clearBuyNow } = useCheckout();
  
  const { data: cart = [], isLoading: isCartLoading } = useCart();
  const { data: savedItems = [] } = useSavedItems();
  const { mutateAsync: changeCartQuantity } = useUpdateCartQuantity();
  const { mutateAsync: removeFromCart } = useRemoveFromCart();
  const { mutateAsync: clearCart } = useClearCart();
  const { mutateAsync: addToCart } = useAddToCart();
  const { mutateAsync: saveForLater } = useSaveForLater();
  const { mutateAsync: moveSavedToCart } = useMoveSavedToCart();
  const { mutateAsync: removeSavedItem } = useRemoveSavedItem();

  const { data: availableCoupons = [] } = useAvailableCoupons();
  const { data: autoOfferInstructions = [] } = useAutoOfferInstructions();
  const { mutateAsync: validateCoupon } = useValidateCoupon();

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [manualCouponCode, setManualCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState(""); 
  const [showOffers, setShowOffers] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponSearch, setCouponSearch] = useState("");

  const isBuyNowFromNavigation = location.state?.isBuyNow;
  const isBuyNowActive = isBuyNowFromNavigation || !!buyNow;

  // --- SCROLL LOCK ---
  useEffect(() => {
    if (isCouponModalOpen || showOffers) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      Object.assign(document.body.style, { overflow: "hidden", height: "100vh", touchAction: "none", paddingRight: `${scrollbarWidth}px` });
      document.documentElement.style.overflow = "hidden";
    } else {
      Object.assign(document.body.style, { overflow: "", height: "", touchAction: "", paddingRight: "" });
      document.documentElement.style.overflow = "";
    }
    return () => {
      Object.assign(document.body.style, { overflow: "", height: "", touchAction: "", paddingRight: "" });
      document.documentElement.style.overflow = "";
    };
  }, [isCouponModalOpen, showOffers]);

  const manualCoupons = useMemo(() => {
    const activeAutoCodes = new Set(autoOfferInstructions.map((o) => o.code));
    
    return availableCoupons.filter((c) => {
      if (activeAutoCodes.has(c.code)) return false;
      if (c.type === "auto" || c.isAutomatic) return false;
      if (c.code.toUpperCase().startsWith("AUTO")) return false;
      return true;
    });
  }, [availableCoupons, autoOfferInstructions]);

  const filteredCoupons = useMemo(() => {
    if (!couponSearch) return manualCoupons;
    
    const lowerSearch = couponSearch.toLowerCase();
    return manualCoupons.filter(c => 
      c.code.toLowerCase().includes(lowerSearch) || 
      (c.description && c.description.toLowerCase().includes(lowerSearch))
    );
  }, [manualCoupons, couponSearch]);

  const normalizeBuyNow = useCallback((bn) => {
    if (!bn) return null;
    return {
      product: bn.product ?? (bn.productId ? { id: bn.productId, name: bn.productName, imageurl: bn.productImageUrl } : undefined),
      variant: bn.variant ?? (bn.variantId ? { id: bn.variantId, oprice: bn.oprice ?? bn.listPrice, discount: bn.discount ?? 0, name: bn.variantName, size: bn.size, stock: bn.stock ?? 999 } : undefined),
      quantity: typeof bn.quantity === "number" ? bn.quantity : 1,
      isBundle: bn.isBundle ?? false,
      contents: bn.contents ?? [],
    };
  }, []);

  const buyNowItemArray = useMemo(() => buyNow ? [normalizeBuyNow(buyNow)] : [], [buyNow, normalizeBuyNow]);
  const itemsToRender = isBuyNowActive && buyNow ? buyNowItemArray : cart;
  const visibleSavedItems = savedItems;
  const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  // 🟢 CALCULATE SUBTOTALS FOR THE MODAL
  const cartSubtotal = useMemo(() => {
    return itemsToRender.reduce((acc, item) => {
      const price = Math.floor((item.variant?.oprice || 0) * (1 - (item.variant?.discount || 0) / 100));
      return acc + (price * (item.quantity || 1));
    }, 0);
  }, [itemsToRender]);

  const cartItemCount = useMemo(() => {
    return itemsToRender.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [itemsToRender]);

  const [breakdown, setBreakdown] = useState({ productTotal: 0, deliveryCharge: 0, discountAmount: 0, total: 0, originalTotal: 0, codAvailable: false, offerDiscount: 0, appliedOffers: [] });
  
  const requestBody = useMemo(() => {
    if (itemsToRender.length === 0) return null;
    return {
      cartItems: itemsToRender.map((i) => ({ variantId: i.variant?.id ?? i.variantId, quantity: i.quantity, productId: i.product?.id ?? i.productId })),
      couponCode: appliedCoupon?.code || null,
      pincode: null,
      userId: userdetails?.id || null
    };
  }, [itemsToRender, appliedCoupon?.code, userdetails?.id]);

  const { data: priceData, isLoading: loadingPricesHook, isError: isPricePreviewError } = usePricePreview(requestBody);
  const loadingPrices = isCartLoading || loadingPricesHook;

  useEffect(() => {
    if (!requestBody) {
      setBreakdown({ productTotal: 0, deliveryCharge: 0, discountAmount: 0, total: 0, originalTotal: 0, codAvailable: false, offerDiscount: 0, appliedOffers: [] });
      return;
    }
    if (priceData && !priceData.error) {
        setBreakdown(priceData.breakdown ?? priceData);
        setCouponMessage(priceData.message || ""); 
    } else if ((priceData && priceData.error) || isPricePreviewError) {
        if (priceData?.error) {
            window.toast?.error(priceData.message);
            setAppliedCoupon(null);
            setCouponMessage("");
        }
        // Fallback calculation for Order Summary
        const original = itemsToRender.reduce((acc, i) => acc + (i.variant?.oprice || 0) * (i.quantity || 1), 0);
        const total = itemsToRender.reduce((acc, i) => acc + Math.floor((i.variant?.oprice || 0) * (1 - (i.variant?.discount || 0)/100)) * (i.quantity || 1), 0);
        setBreakdown({
            originalTotal: original,
            productTotal: total,
            total: total,
            discountAmount: original - total,
            deliveryCharge: 0,
            appliedOffers: []
        });
    }
  }, [priceData, requestBody, isPricePreviewError, itemsToRender]);



  useEffect(() => {
    if (isBuyNowActive && !buyNow) { navigate("/cart", { replace: true, state: {} }); return; }
    if (!itemsToRender.some((item) => item.variant && item.variant.stock <= 0)) setCheckoutError("");
  }, [itemsToRender, isBuyNowActive, buyNow, navigate]);

  const handleCheckout = () => {
    setCheckoutError("");
    if (!itemsToRender.length) return window.toast.error("Your cart is empty.");
    const outOfStockItem = itemsToRender.find((item) => item.variant.stock <= 0);
    if (outOfStockItem) return setCheckoutError(`Sorry, "${outOfStockItem.product.name} (${outOfStockItem.variant.name})" is out of stock. Please remove it.`);

    const fullCartItems = itemsToRender.map((item) => {
      const price = Math.floor(item.variant.oprice * (1 - item.variant.discount / 100));
      return {
        product: { id: item.product.id, name: item.product.name, imageurl: item.product.imageurl?.[0] || null },
        variant: { ...item.variant, price },
        quantity: item.quantity || 1, totalPrice: price * (item.quantity || 1), isBundle: item.isBundle || false, contents: item.contents || []
      };
    });
    localStorage.setItem("selectedItems", JSON.stringify(fullCartItems));
    localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
    sessionStorage.setItem("checkout_intent", JSON.stringify({ ts: Date.now(), source: isBuyNowActive ? "buy_now" : "cart" }));
    
    if (!isSignedIn) { sessionStorage.setItem("post_login_redirect", "/checkout"); navigate("/login", { replace: true }); return; }
    navigate("/checkout");
  };

  const callStartBuyNow = useCallback((itemLike) => startBuyNow(normalizeBuyNow(itemLike)), [normalizeBuyNow, startBuyNow]);
  const handleQuantityChange = (item, delta) => {
    const nextQty = Math.max(1, (item.quantity || 1) + delta);
    isBuyNowActive ? callStartBuyNow({ ...item, quantity: nextQty }) : changeCartQuantity({ variant: item.variant, quantity: nextQty });
  };
  const handleRemove = (item) => isBuyNowActive ? clearBuyNow() : removeFromCart(item.variant);
  const handleSaveForLater = (item) => !isBuyNowActive && saveForLater(item);
  const handleMoveToCart = (item) => moveSavedToCart(item);
  const handleRemoveSavedItem = (variantId) => removeSavedItem(variantId);
  
  const handleApplyCoupon = useCallback(async (couponObj) => {
    if (!userdetails?.id) {
      window.toast.error("Please log in to apply coupons.");
      return;
    }

    const validatedCoupon = await validateCoupon(couponObj.code);

    if (validatedCoupon) {
      setAppliedCoupon(validatedCoupon);
      setCouponMessage("");
      window.toast.success(`Coupon ${validatedCoupon.code} applied successfully!`);
    } else {
      setAppliedCoupon(null);
    }
  }, [userdetails?.id, validateCoupon]);

  const handleManualApply = () => {
    if (!manualCouponCode) return window.toast.error("Please enter a coupon code");
    handleApplyCoupon({ code: manualCouponCode });
  };

  const handleAddToCart = (variant, product) => {
    if (addingProductId) return;
    setAddingProductId(variant.id); addToCart({ product, variant, quantity: 1 });
    setTimeout(() => setAddingProductId(null), 1500);
  };

  const handleExitBuyNow = () => { clearBuyNow(); navigate("/cart", { replace: true, state: {} }); };

  const isLoading = !isBuyNowActive && isCartLoading;

  return (
    <>
      <title>{isLoading ? "Loading Cart... | Devid Aura" : isBuyNowActive ? "Buy Now | Devid Aura" : "Shopping Cart | Devid Aura"}</title>
      <meta name="description" content="Review your selected items, apply coupons, and proceed to a secure checkout. Manage your Devid Aura shopping experience." />

      <AutoOfferModal isOpen={showOffers} onClose={() => setShowOffers(false)} instructions={autoOfferInstructions} />
      
      <CouponSelectionModal
        isOpen={isCouponModalOpen} onClose={() => setIsCouponModalOpen(false)}
        coupons={filteredCoupons} search={couponSearch} onSearchChange={(e) => setCouponSearch(e.target.value)}
        onApply={(coupon) => { handleApplyCoupon(coupon); setIsCouponModalOpen(false); setCouponSearch(""); }}
        cartSubtotal={cartSubtotal}
        cartItemCount={cartItemCount}
      />

      {isLoading ? (
        <main className="max-w-6xl mx-auto my-4 sm:my-8 px-4 w-full flex flex-col gap-8">
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)] pt-[50px]">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3"><FaShoppingCart /> {isBuyNowActive ? "Buy Now" : "Shopping Cart"}</h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] lg:items-start gap-8">
            <div className="flex flex-col gap-4">
              <CartItemSkeleton />
              <CartItemSkeleton />
            </div>
            <div className="bg-[var(--surface)] rounded-[2.5rem] p-5 shadow-[var(--shadow)] relative">
                <div className="h-8 w-40 bg-[var(--surface-muted)] rounded mb-8 animate-pulse"></div>
                <div className="space-y-6 animate-pulse px-2">
                    <div className="flex justify-between"><div className="h-4 bg-[var(--surface-muted)] rounded-full w-1/3"></div><div className="h-4 bg-[var(--surface-muted)] rounded-full w-1/4"></div></div>
                    <div className="flex justify-between"><div className="h-4 bg-[var(--surface-muted)] rounded-full w-1/2"></div><div className="h-4 bg-[var(--surface-muted)] rounded-full w-1/5"></div></div>
                    <div className="h-16 bg-[var(--surface-muted)] rounded-3xl w-full mt-6"></div>
                </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-6xl mx-auto my-4 sm:my-8 px-4 w-full flex flex-col gap-8">
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)] pt-[50px]">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3"><FaShoppingCart /> {isBuyNowActive ? "Buy Now" : "Shopping Cart"}</h1>
            <div className="flex items-center gap-4">
              {autoOfferInstructions.length > 0 && !isBuyNowActive && (
                <motion.button onClick={() => setShowOffers(true)} className="relative text-[var(--muted)] hover:text-[var(--text)]" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <FiGift size={22} />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--brand)] text-[var(--brand-contrast)] text-[10px] font-bold rounded-full flex items-center justify-center">{autoOfferInstructions.length}</span>
                </motion.button>
              )}
              {!isBuyNowActive && cart.length > 0 && (
                <motion.button onClick={clearCart} className="bg-transparent border border-[var(--border)] text-[var(--muted)] py-2 px-4 rounded-xl cursor-pointer flex items-center gap-2 font-medium transition-colors duration-200 ease-in-out hover:bg-red-50 hover:text-red-600 hover:border-red-600" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <FaTrashAlt /> <span className="hidden sm:inline">Clear Cart</span>
                </motion.button>
              )}
              {isBuyNowActive && (
                <motion.button onClick={handleExitBuyNow} className="bg-transparent border border-[var(--border)] text-[var(--muted)] py-2 px-4 rounded-xl cursor-pointer flex items-center gap-2 font-medium transition-colors duration-200 ease-in-out hover:bg-[var(--surface-muted)] hover:text-[var(--text)]" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <FiX /> <span className="hidden sm:inline">Exit Buy Now</span>
                </motion.button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] lg:items-start gap-8">
            <motion.div layout className="flex flex-col gap-4 relative">
              <AnimatePresence mode="popLayout">
                {itemsToRender.length > 0 ? (
                  itemsToRender.map((item) => (
                    <CartItemCard
                      key={item.variant.id} item={item} breakdown={breakdown} isBuyNowActive={isBuyNowActive}
                      onQuantityChange={handleQuantityChange} onRemove={handleRemove} onSaveForLater={handleSaveForLater}
                    />
                  ))
                ) : (
                  <motion.div key="empty-cart-message" layout variants={itemVariants} initial="initial" animate="animate" exit="exit" transition={rigidTransition} style={gpuStyle} className="text-center p-8 bg-transparent transition-shadow">
                    <h3 className="text-lg mb-2">Your cart is empty.</h3><p className="text-[var(--muted)]">Looks like you haven't added anything to your cart yet.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <OrderSummary
              breakdown={breakdown} loadingPrices={loadingPrices} appliedCoupon={appliedCoupon} onRemoveCoupon={() => { setAppliedCoupon(null); setCouponMessage(""); }}
              manualCouponCode={manualCouponCode} setManualCouponCode={setManualCouponCode} onManualApply={handleManualApply}
              availableCouponsCount={manualCoupons.length} 
              onOpenCouponModal={() => setIsCouponModalOpen(true)}
              checkoutError={checkoutError} onCheckout={handleCheckout} isBuyNowActive={isBuyNowActive}
              couponMessage={couponMessage}
            />
          </div>

          {!isBuyNowActive && (
            <SavedForLaterSection items={visibleSavedItems} onRemove={handleRemoveSavedItem} onMoveToCart={handleMoveToCart} />
          )}

          {!isBuyNowActive && (
            <CartRecommendations currentCartItems={cart} addToCart={(product) => handleAddToCart(product.variants?.[0] || {}, product)} />
          )}
        </main>
      )}
    </>
  );
};

export default ShoppingCart;