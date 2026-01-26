import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { ProductContext } from "../contexts/productContext";
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext";
import { CouponContext } from "../contexts/CouponContext";

import Loader from "../Components/Loader";
import HeroButton from "../Components/HeroButton";
import CartRecommendations from "./CartRecommendations"; 
import { FaShoppingCart, FaTrashAlt } from "react-icons/fa";
import { FiGift, FiCheckCircle, FiX, FiBell, FiChevronRight, FiSearch, FiTag, FiClock, FiHeart } from "react-icons/fi";

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
          className="flex flex-col justify-center px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
        >
          <p className="font-bold text-gray-800 text-[11px] truncate w-full">
            {subItem.product?.name || subItem.name}
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
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
    <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${minimalist ? "py-3 px-3 text-sm" : ""}`}>
      <div className="flex items-start gap-3">
        <FiTag className={`mt-1 text-black ${minimalist ? "w-3 h-3" : ""}`} />
        <div>
          {!minimalist && <p className="font-bold text-gray-900">{offer.code}</p>}
          <p className={`${minimalist ? "text-gray-700" : "text-sm text-gray-600 mt-1"}`}>{generateInstruction()}</p>
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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants} initial="hidden" animate="visible" exit="exit"
          style={gpuStyle} onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="bg-black p-5 flex justify-between items-center text-white sticky top-0 z-10">
            <h3 className="text-lg font-bold flex items-center gap-2"><FiGift className="text-white" /> Automatic Offers & Help</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><FiX size={24} /></button>
          </div>
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900 border-b pb-2">How Automatic Coupons Work</h4>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Add Items to Cart</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Simply browse our collection and add the products you love to your cart.</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100"></div>
            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Current Active Offers</h4>
              <div className="space-y-3">
                {instructions.length > 0 ? (
                  instructions.map((offer) => <OfferInstructionCard key={offer.id} offer={offer} />)
                ) : (
                  <p className="text-sm text-gray-500 italic">No automatic offers are currently active.</p>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
            <button onClick={onClose} className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-100 transition-colors">Got it</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const CouponSelectionModal = ({ isOpen, onClose, coupons, search, onSearchChange, onApply }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }} style={{ willChange: "opacity" }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      >
        <motion.div
          variants={modalVariants} initial="hidden" animate="visible" exit="exit"
          style={gpuStyle} onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
              <h3 className="text-xl font-bold text-black tracking-tight">Select Coupon</h3>
              <p className="text-xs text-gray-500 mt-1">Find the best deal for your order</p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-black hover:text-white transition-all duration-200"><FiX size={20} /></button>
          </div>
          <div className="px-5 pt-4 pb-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search coupons..." value={search} onChange={onSearchChange}
                className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>
          </div>
          <div className="p-5 overflow-y-auto space-y-4 bg-white flex-grow">
            {coupons.length > 0 ? (
              coupons.map((coupon) => (
                <motion.div
                  key={coupon.id} layout whileHover={{ scale: 1.01, borderColor: "#000000" }}
                  transition={{ duration: 0.2, ease: "easeInOut" }} style={{ willChange: "transform" }}
                  className="group relative flex w-full bg-white border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-default min-h-[80px] transition-colors duration-300"
                >
                  <div className="flex-1 p-4 flex flex-col justify-center border-r-2 border-dashed border-gray-200 group-hover:border-gray-900 transition-colors duration-300">
                    <div className="flex items-center gap-2 mb-1">
                      <FiTag className="text-gray-400 group-hover:text-black transition-colors" size={16} />
                      <span className="font-bold text-black text-lg tracking-wide uppercase">{coupon.code}</span>
                    </div>
                    <span className="text-xs text-gray-500 leading-relaxed">{coupon.description}</span>
                  </div>
                  <div className="w-[28%] flex items-center justify-center p-3 bg-gray-50/30">
                    <button onClick={() => onApply(coupon)} className="text-xs font-bold text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-all shadow-sm w-full">APPLY</button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center text-gray-400">
                <FiSearch size={40} className="mb-3 opacity-20" />
                <p className="font-medium text-gray-900">No coupons found</p>
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
      <div className="flex flex-row gap-5 bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 border border-transparent hover:border-gray-50">
        
        {/* Image Section - Floating Bubble Style */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-50 rounded-[1.5rem] overflow-hidden p-2">
          <img 
            src={itemImageUrl} 
            alt={item.product.name} 
            className={`w-full h-full object-cover rounded-[1rem] transition-opacity duration-300 ${isOutOfStock ? "opacity-50 grayscale" : "opacity-100"}`} 
            loading="eager" 
          />
          
          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white/90 backdrop-blur text-[10px] font-bold text-red-600 px-3 py-1 rounded-full shadow-sm border border-red-50">OUT OF STOCK</span>
            </div>
          )}

          {/* Discount Overlay (Bottom Center) */}
          {Number(item.variant.discount) > 0 && !isFree && (
            <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
              <span className="bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm mb-1">
                {item.variant.discount}% OFF
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          
          {/* Top: Info & Price */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="font-bold text-gray-900 text-lg leading-snug truncate pr-2">{item.product.name}</h3>
              
              {item.isBundle ? (
                <div className="opacity-70 origin-left scale-95 -ml-1"><BundleItemsList items={item.contents} isCompact /></div>
              ) : (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.variant.size} ml</p>
              )}
            </div>

            <div className="text-right flex flex-col items-end">
              {isFree ? (
                <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full tracking-wide">FREE GIFT</span>
              ) : (
                <span className="text-lg font-bold text-gray-900">₹{sellingPrice}</span>
              )}
              {showLineThrough && <span className="text-xs text-gray-400 line-through mt-0.5">₹{item.variant.oprice}</span>}
            </div>
          </div>

          {/* Bottom: Controls */}
          <div className="flex items-end justify-between mt-4">
            
            {/* Soft Capsule Quantity Control */}
            <div className={`flex items-center bg-gray-50 rounded-full p-1.5 ${isOutOfStock ? "opacity-50 pointer-events-none" : ""}`}>
              <button 
                onClick={() => onQuantityChange(item, -1)} 
                disabled={item.quantity <= 1} 
                className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-500 hover:text-black disabled:opacity-30 disabled:shadow-none transition-all active:scale-90"
              >
                –
              </button>
              <span className="w-10 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
              <button 
                onClick={() => onQuantityChange(item, 1)} 
                className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-500 hover:text-black transition-all active:scale-90"
              >
                +
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {!isBuyNowActive && (
                <button 
                  onClick={() => onSaveForLater(item)} 
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all" 
                  title="Save for later"
                >
                  <FiClock size={20} />
                </button>
              )}
              <button 
                onClick={() => onRemove(item)} 
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all" 
                title="Remove item"
              >
                <FaTrashAlt size={18} />
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SavedForLaterSection = ({ items, onRemove, onMoveToCart }) => {
  // Empty State
  if (items.length === 0) {
    return (
      <motion.div layout="position" transition={rigidTransition} className="mt-16 pt-8">
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-[2rem] bg-gray-50/80">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6 text-gray-300">
            <FiHeart size={28} />
          </div>
          <h3 className="text-gray-900 font-bold text-xl tracking-tight">Your wishlist is quiet</h3>
          <p className="text-gray-500 text-sm mt-2 max-w-xs leading-relaxed">
            Items you want to save for later will appear here, ready when you are.
          </p>
        </div>
      </motion.div>
    );
  }

  // Populated State
  return (
    <motion.div layout="position" transition={rigidTransition} className="mt-16 pt-8">
      {/* Soft Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-900">
             <FiHeart size={18} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Saved for Later</h2>
        </div>
        <span className="px-4 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
          {items.length} ITEMS
        </span>
      </div>

      {/* Grid */}
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
                className="group relative bg-white p-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300"
              >
                {/* Soft Remove Button */}
                <button
                  onClick={() => onRemove(variant.id)}
                  className="absolute z-10 top-5 right-5 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors duration-200 shadow-sm"
                >
                  <FiX size={14} />
                </button>

                <div className="flex items-center gap-5">
                  {/* Image Bubble with Overlay */}
                  <div className="relative w-24 h-24 flex-shrink-0 bg-gray-50 rounded-[1.5rem] overflow-hidden p-2">
                    <img 
                      src={itemImageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover rounded-[1rem] group-hover:scale-105 transition-transform duration-500" 
                    />
                    
                    {/* Discount Overlay */}
                    {discount > 0 && (
                      <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
                        <span className="bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm mb-1">
                          {discount}% OFF
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-bold text-base text-gray-900 leading-snug truncate">{product.name}</h3>
                    
                    {(item.isBundle || (item.contents && item.contents.length > 0)) ? (
                      <div className="mt-1 opacity-60 scale-90 origin-left"><BundleItemsList items={item.contents} isCompact={true} /></div>
                    ) : (
                      <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wide">{variant.size} ml</p>
                    )}

                    {/* Price Section */}
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-gray-900 font-bold">₹{price}</span>
                      {showLineThrough && (
                        <span className="text-xs text-gray-400 line-through decoration-gray-300">
                          ₹{originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full Width Soft Button */}
                <div className="mt-5">
                  <button
                    onClick={() => onMoveToCart(item)}
                    className="w-full py-3.5 text-xs font-bold uppercase tracking-widest text-white bg-black rounded-full hover:bg-gray-800 active:scale-95 transition-all duration-300"
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

const OrderSummary = ({ breakdown, loadingPrices, appliedCoupon, onRemoveCoupon, manualCouponCode, setManualCouponCode, onManualApply, availableCouponsCount, onOpenCouponModal, checkoutError, onCheckout, isBuyNowActive }) => {
  const productDiscount = Number(breakdown.originalTotal || 0) - Number(breakdown.productTotal || 0);
  const finalPrice = typeof breakdown.totalExcludingDelivery !== "undefined" ? breakdown.totalExcludingDelivery : breakdown.total;

  return (
    <div className="sticky top-8">
      <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        {/* Subtle Background Blob */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <h2 className="text-2xl font-bold text-gray-900 mb-8 relative z-10">Order Summary</h2>

        {loadingPrices ? (
          <div className="space-y-6 animate-pulse px-2">
            <div className="flex justify-between"><div className="h-4 bg-gray-100 rounded-full w-1/3"></div><div className="h-4 bg-gray-100 rounded-full w-1/4"></div></div>
            <div className="flex justify-between"><div className="h-4 bg-gray-100 rounded-full w-1/2"></div><div className="h-4 bg-gray-100 rounded-full w-1/5"></div></div>
            <div className="h-16 bg-gray-50 rounded-3xl w-full mt-6"></div>
          </div>
        ) : (
          <>
            {/* Price Details */}
            <div className="space-y-4 px-1">
              <div className="flex justify-between text-gray-500 text-sm font-medium">
                <span>Subtotal</span>
                <span className="text-gray-900">₹{Number(breakdown.originalTotal || 0).toFixed(2)}</span>
              </div>

              {productDiscount > 0 && (
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-400">Discount</span>
                  <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md">-₹{productDiscount.toFixed(2)}</span>
                </div>
              )}

              {breakdown.appliedOffers && Array.isArray(breakdown.appliedOffers) && breakdown.appliedOffers.map((offer, index) => (
                <div key={index} className="flex justify-between text-sm font-medium">
                  <span className="text-green-600 truncate pr-4">{offer.title}</span>
                  <span className="text-green-600">-₹{Number(offer.amount || 0).toFixed(2)}</span>
                </div>
              ))}
              
              {/* Divider */}
              <div className="h-px w-full bg-gray-100 my-6"></div>

              {/* Coupon Section - Floating Style */}
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
                        <div className="bg-white p-2 rounded-full text-green-600 shadow-sm"><FiTag size={16} /></div>
                        <div>
                          <p className="font-bold text-green-800 text-sm">{appliedCoupon.code}</p>
                          <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Applied</p>
                        </div>
                      </div>
                      <button onClick={onRemoveCoupon} className="w-8 h-8 flex items-center justify-center bg-white text-gray-400 rounded-full shadow-sm hover:text-red-500 transition-colors">
                        <FiX size={14} />
                      </button>
                    </motion.div>
                  ) : (
                    <div className="bg-gray-50 p-1.5 rounded-[1.5rem] flex relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                         <FiTag className="text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Promo Code" 
                        value={manualCouponCode} 
                        onChange={(e) => setManualCouponCode(e.target.value.toUpperCase())} 
                        onKeyDown={(e) => e.key === "Enter" && onManualApply()}
                        className="bg-transparent border-none text-gray-900 text-sm font-medium w-full pl-10 pr-20 py-3 focus:ring-0 placeholder:text-gray-400" 
                      />
                      <button 
                        onClick={onManualApply} 
                        className="absolute right-1.5 top-1.5 bottom-1.5 bg-white shadow-sm text-black text-xs font-bold px-4 rounded-[1.2rem] hover:bg-black hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
                        disabled={!manualCouponCode}
                      >
                        APPLY
                      </button>
                    </div>
                  )}
                </AnimatePresence>
                
                {availableCouponsCount > 0 && !appliedCoupon && (
                   <button onClick={onOpenCouponModal} className="mt-3 ml-2 text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1 transition-colors">
                     See {availableCouponsCount} available offers <FiChevronRight />
                   </button>
                )}
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center pb-2">
                <span className="text-lg  text-gray-900">Total</span>
                <span className="text-2xl  text-gray-900 tracking-tighter">₹{Number(finalPrice || 0).toFixed(2)}</span>
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

        {/* Big Soft Checkout Button */}
        <div className="mt-8">
          <HeroButton 
            className="w-full py-5 text-sm uppercase tracking-[0.15em] font-bold bg-black text-white rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-black/10 transition-all duration-300 ease-out" 
            onClick={onCheckout}
          >
            {isBuyNowActive ? "Pay Now" : "Checkout"}
          </HeroButton>
        </div>
        
        <div className="mt-6 flex justify-center gap-2">
           <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
           <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
           <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
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
  const { cart, buyNow, changeCartQuantity, removeFromCart, clearCart, isCartLoading, startBuyNow, clearBuyNow, addToCart, savedItems, saveForLater, moveSavedToCart, removeSavedItem } = useContext(CartContext);
  const { availableCoupons, isCouponValid, loadAvailableCoupons, validateCoupon, autoOfferInstructions } = useContext(CouponContext);

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [manualCouponCode, setManualCouponCode] = useState("");
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

  // --- STEP 1: ISOLATE MANUAL COUPONS (For the Count) ---
  const manualCoupons = useMemo(() => {
    const activeAutoCodes = new Set(autoOfferInstructions.map((o) => o.code));
    
    return availableCoupons.filter((c) => {
      // 1. Exclude if it's currently an active automatic offer
      if (activeAutoCodes.has(c.code)) return false;
      
      // 2. Exclude if explicitly marked as auto
      if (c.type === "auto" || c.isAutomatic) return false;

      // 3. Exclude based on naming convention (fallback)
      if (c.code.toUpperCase().startsWith("AUTO")) return false;

      return true;
    });
  }, [availableCoupons, autoOfferInstructions]);

  // --- STEP 2: FILTER FOR SEARCH (For the Modal List) ---
  const filteredCoupons = useMemo(() => {
    if (!couponSearch) return manualCoupons;
    
    const lowerSearch = couponSearch.toLowerCase();
    return manualCoupons.filter(c => 
      c.code.toLowerCase().includes(lowerSearch) || 
      (c.description && c.description.toLowerCase().includes(lowerSearch))
    );
  }, [manualCoupons, couponSearch]);

  // --- DATA NORMALIZATION ---
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

  const [breakdown, setBreakdown] = useState({ productTotal: 0, deliveryCharge: 0, discountAmount: 0, total: 0, originalTotal: 0, codAvailable: false, offerDiscount: 0, appliedOffers: [] });
  const [loadingPrices, setLoadingPrices] = useState(true);
  const lastRequestRef = useRef("");

  // --- PRICE FETCHING ---
  useEffect(() => {
    if (isCartLoading || itemsToRender.length === 0) {
      setLoadingPrices(false);
      if (itemsToRender.length === 0) {
        setBreakdown({ productTotal: 0, deliveryCharge: 0, discountAmount: 0, total: 0, originalTotal: 0, codAvailable: false, offerDiscount: 0, appliedOffers: [] });
        lastRequestRef.current = "";
      }
      return;
    }

    const fetchBreakdown = async () => {
      const requestBody = {
        cartItems: itemsToRender.map((i) => ({ variantId: i.variant?.id ?? i.variantId, quantity: i.quantity, productId: i.product?.id ?? i.productId })),
        couponCode: appliedCoupon?.code || null,
        isCart: true,
        pincode: null,
      };
      const requestString = JSON.stringify(requestBody);
      if (lastRequestRef.current === requestString) return;

      setLoadingPrices(true);
      try {
        const res = await fetch(`${API_BASE}/api/payments/breakdown`, { method: "POST", headers: { "Content-Type": "application/json" }, body: requestString });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).msg || "Failed to fetch price details.");
        const data = await res.json();
        setBreakdown(data.breakdown ?? data);
        lastRequestRef.current = requestString;
      } catch (error) {
        console.error("Price breakdown error:", error);
      } finally {
        setLoadingPrices(false);
      }
    };
    const timer = setTimeout(() => fetchBreakdown(), 300);
    return () => clearTimeout(timer);
  }, [itemsToRender, appliedCoupon?.code, isCartLoading, API_BASE]);

  useEffect(() => { if (userdetails?.id) loadAvailableCoupons(userdetails.id); }, [userdetails?.id, loadAvailableCoupons]);

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
    isBuyNowActive ? callStartBuyNow({ ...item, quantity: nextQty }) : changeCartQuantity(item.variant, nextQty);
  };
  const handleRemove = (item) => isBuyNowActive ? clearBuyNow() : removeFromCart(item.variant);
  const handleSaveForLater = (item) => !isBuyNowActive && saveForLater(item);
  const handleMoveToCart = (item) => moveSavedToCart(item);
  const handleRemoveSavedItem = (variantId) => removeSavedItem(variantId);
  
  const handleApplyCoupon = useCallback(async (coupon) => {
    const validated = await validateCoupon(coupon.code, userdetails?.id);
    if (validated && isCouponValid(validated, itemsToRender, Number(breakdown.productTotal || 0) - Number(breakdown.offerDiscount || 0))) {
      setAppliedCoupon(validated); window.toast.success(`Coupon ${validated.code} applied!`);
    } else { setAppliedCoupon(null); }
  }, [itemsToRender, userdetails?.id, isCouponValid, validateCoupon, breakdown]);

  const handleManualApply = async () => {
    if (!manualCouponCode) return window.toast.error("Please enter a coupon code");
    await handleApplyCoupon({ code: manualCouponCode });
  };

  const handleAddToCart = (variant, product) => {
    if (addingProductId) return;
    setAddingProductId(variant.id); addToCart(product, variant, 1);
    setTimeout(() => setAddingProductId(null), 1500);
  };

  const handleExitBuyNow = () => { clearBuyNow(); navigate("/cart", { replace: true, state: {} }); };
  useEffect(() => {
    if (appliedCoupon && !isCouponValid(appliedCoupon, itemsToRender, Number(breakdown.productTotal || 0) - Number(breakdown.offerDiscount || 0))) setAppliedCoupon(null);
  }, [itemsToRender, appliedCoupon, isCouponValid, breakdown]);

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
      />

      {isLoading ? <Loader text="Loading cart..." /> : (
        <main className="max-w-6xl mx-auto my-4 sm:my-8 px-4 w-full flex flex-col gap-8">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 pt-[50px]">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3"><FaShoppingCart /> {isBuyNowActive ? "Buy Now" : "Shopping Cart"}</h1>
            <div className="flex items-center gap-4">
              {autoOfferInstructions.length > 0 && !isBuyNowActive && (
                <motion.button onClick={() => setShowOffers(true)} className="relative text-gray-500 hover:text-black" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <FiBell className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">{autoOfferInstructions.length}</span>
                </motion.button>
              )}
              {!isBuyNowActive && cart.length > 0 && (
                <motion.button onClick={clearCart} className="bg-transparent border border-gray-200 text-gray-500 py-2 px-4 rounded-xl cursor-pointer flex items-center gap-2 font-medium transition-colors duration-200 ease-in-out hover:bg-red-50 hover:text-red-600 hover:border-red-600" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <FaTrashAlt /> <span className="hidden sm:inline">Clear Cart</span>
                </motion.button>
              )}
              {isBuyNowActive && (
                <motion.button onClick={handleExitBuyNow} className="bg-transparent border border-gray-200 text-gray-500 py-2 px-4 rounded-xl cursor-pointer flex items-center gap-2 font-medium transition-colors duration-200 ease-in-out hover:bg-gray-100 hover:text-gray-800" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                  <motion.div key="empty-cart-message" layout variants={itemVariants} initial="initial" animate="animate" exit="exit" transition={rigidTransition} style={gpuStyle} className="text-center p-8 bg-white transition-shadow">
                    <h3 className="text-lg mb-2">Your cart is empty.</h3><p className="text-gray-500">Looks like you haven't added anything to your cart yet.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <OrderSummary
              breakdown={breakdown} loadingPrices={loadingPrices} appliedCoupon={appliedCoupon} onRemoveCoupon={() => setAppliedCoupon(null)}
              manualCouponCode={manualCouponCode} setManualCouponCode={setManualCouponCode} onManualApply={handleManualApply}
              // CHANGE HERE: Use manualCoupons.length instead of availableCoupons.length
              availableCouponsCount={manualCoupons.length} 
              onOpenCouponModal={() => setIsCouponModalOpen(true)}
              checkoutError={checkoutError} onCheckout={handleCheckout} isBuyNowActive={isBuyNowActive}
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