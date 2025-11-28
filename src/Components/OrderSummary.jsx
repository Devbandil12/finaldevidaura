import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Tag, Package } from "lucide-react";

// 🟢 Luxury Transition Settings
const smoothTransition = {
  type: "tween",
  ease: [0.25, 0.1, 0.25, 1],
  duration: 0.4
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: smoothTransition
  }
};

export default function OrderSummary({
  selectedAddress,
  selectedItems = [],
  appliedCoupon,
  breakdown,
  loadingPrices
}) {
  const productDiscount = breakdown.originalTotal - breakdown.productTotal;

  return (
    <div className="bg-white rounded-3xl  border border-slate-200 overflow-hidden sticky top-24">
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-slate-50 bg-white">
        <h3 className="flex items-center gap-3 text-lg font-bold text-slate-800">
          <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-700">
            <ShoppingBag className="w-4 h-4" />
          </div>
          Order Summary
          <span className="ml-auto text-xs font-semibold bg-black text-white px-2.5 py-1 rounded-full">
            {selectedItems.length} {selectedItems.length === 1 ? 'Item' : 'Items'}
          </span>
        </h3>
      </div>

      {/* Product List - Scrollable */}
      <div className="max-h-[400px] overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {selectedItems.map((item, idx) => {
             // Logic to check for free items from your original code
             const isFree = breakdown.appliedOffers?.some(offer => 
                offer.appliesToVariantId === item.variant.id
             );

             return (
                <motion.div 
                  key={`${item.product.id}-${item.variant.id}-${idx}`}
                  variants={itemVariants}
                  className="flex gap-4 group"
                >
                  {/* Image */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative">
                    <img 
                      // 🟢 FIXED: Using exactly 'item.product.imageurl' as requested
                      src={item.product.imageurl || "/fallback.png"} 
                      alt={item.product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { e.target.src = "/fallback.png"; }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-sm font-semibold text-slate-800 truncate pr-4">
                      {item.product.name}
                    </h4>
                    
                    {item.isBundle ? (
                        <div className="mt-1">
                            <ul className="text-xs text-slate-500 space-y-0.5">
                                {item.contents?.map((content, i) => (
                                    <li key={i} className="truncate flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        {content.name} <span className="text-slate-400">({content.variantName})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 mt-1">
                          {item.variant.name && <span className="mr-2">{item.variant.name}</span>}
                          <span className="text-slate-300">|</span>
                          <span className="ml-2">Qty: {item.quantity}</span>
                        </p>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                       {isFree ? (
                           <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                               Free
                           </span>
                       ) : (
                           <>
                               <span className="text-sm font-bold text-black">
                                 ₹{item.variant.price * item.quantity}
                               </span>
                               {item.product.mrp > item.variant.price && (
                                 <span className="text-xs text-slate-400 line-through">
                                   ₹{item.product.mrp * item.quantity}
                                 </span>
                               )}
                           </>
                       )}
                    </div>
                  </div>
                </motion.div>
             );
          })}
        </motion.div>
      </div>

      {/* Price Breakdown */}
      <div className="p-6 sm:p-8 bg-slate-50/50 border-t border-slate-100">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Original Price</span>
            <span className="text-slate-800 font-semibold">₹{breakdown.originalTotal}</span>
          </div>
          
          <AnimatePresence>
            {productDiscount > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="flex justify-between text-sm"
              >
                <span className="text-slate-500 font-medium">Product Discount</span>
                <span className="text-emerald-600 font-semibold">-₹{productDiscount.toFixed(2)}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Applied Offers Logic from original code */}
          {breakdown.appliedOffers && breakdown.appliedOffers.map((offer, index) => (
             <div key={index} className="flex justify-between text-sm font-semibold text-emerald-600">
                <span>{offer.title}</span>
                <span>-₹{offer.amount}</span>
             </div>
          ))}

          <AnimatePresence>
            {appliedCoupon && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between text-sm bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50"
              >
                <span className="text-emerald-700 font-medium flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="uppercase">{appliedCoupon.code}</span>
                </span>
                <span className="text-emerald-700 font-bold">-₹{breakdown.discountAmount}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Delivery Charge</span>
            <span className={`font-semibold ${breakdown.deliveryCharge === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
              {breakdown.deliveryCharge === 0 ? 'Free' : `₹${breakdown.deliveryCharge}`}
            </span>
          </div>
        </div>

        {/* Total Separator */}
        <div className="my-6 border-t border-dashed border-slate-200" />

        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-sm text-slate-500 font-medium">Total Amount</span>
            <span className="text-xs text-slate-400 font-medium mt-0.5">Incl. of all taxes</span>
          </div>
          <div className="text-right">
             {loadingPrices ? (
               <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
             ) : (
               <motion.span 
                 key={breakdown.total}
                 initial={{ scale: 0.95, opacity: 0.5 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="text-2xl font-extrabold text-black"
               >
                 ₹{breakdown.total}
               </motion.span>
             )}
          </div>
        </div>

        {/* Delivery Note */}
        {selectedAddress && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-6 flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 "
          >
            <div className="mt-0.5 text-slate-400">
               <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Delivering to {selectedAddress.name || "..."}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {selectedAddress.address}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postalCode}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}