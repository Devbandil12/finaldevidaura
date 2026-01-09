import React, { useEffect, useContext } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Check, Truck, Package, Copy, ArrowRight, MapPin, CreditCard, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { CartContext } from "../contexts/CartContext";

const smoothTransition = {
  type: "tween",
  ease: [0.25, 0.1, 0.25, 1],
  duration: 0.6
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: smoothTransition }
};

export default function Confirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { getCartitems, clearBuyNow } = useContext(CartContext);
  
  // 🟢 PRIORITY: Check URL param first (for refreshes), then fallback to location state
  const transactionId = searchParams.get("orderId") || location.state?.transactionId;

  // --- Logic: Safe Cleanup ---
  useEffect(() => {
    if (!transactionId) {
      navigate("/", { replace: true });
      return;
    }

    // Clear cart locally
    localStorage.removeItem("selectedItems");
    localStorage.removeItem("appliedCoupon");

    if (clearBuyNow) clearBuyNow();

    // Update global state safely
    const timer = setTimeout(() => {
      if (getCartitems) getCartitems();
    }, 100);

    return () => clearTimeout(timer);
  }, [transactionId, navigate, getCartitems, clearBuyNow]);

  const copyToClipboard = () => {
    if (transactionId) {
      navigator.clipboard.writeText(transactionId);
      window.toast.success("Order ID copied");
    }
  };

  if (!transactionId) return null;

  // --- Visuals: Hardcoded Steps for the Header ---
  const steps = [
    { name: "Address", icon: MapPin },
    { name: "Payment", icon: CreditCard },
    { name: "Confirm", icon: Check },
  ];

  // We are visually on Step 3
  const currentStepIndex = 3;

  return (
    <div className="min-h-screen bg-white  py-20 sm:py-24 px-4 sm:px-6 flex items-start justify-center">
      <div className="w-full max-w-8xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm overflow-hidden border border-white/50">

        {/* ----------------- 1. THE HEADER (Copied from Checkout) ----------------- */}
        <div className="
            relative overflow-hidden transition-colors duration-300
            bg-black text-white 
            md:bg-white md:text-slate-900 md:border-b md:border-slate-100
            px-4 pb-10 pt-4 sm:px-12 sm:pb-12
        ">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 md:hidden" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Secure Badge */}
            <div className="flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border transition-colors bg-white/10 border-white/10 md:bg-emerald-50 md:border-emerald-100">
              <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 md:text-emerald-600" />
              <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap text-white md:text-emerald-800">
                Secure Encrypted Checkout
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full max-w-4xl">
              <div className="absolute top-1/2 left-6 right-6 h-[1px] -translate-y-1/2 bg-white/20 md:bg-slate-200" />

              {/* Solid Bar (Full Width because we are done) */}
              <div className="absolute top-1/2 left-6 right-6 h-[1px] flex -translate-y-1/2 pointer-events-none">
                <div className="h-full shadow-[0_0_15px_rgba(255,255,255,0.8)] md:shadow-none bg-white md:bg-black w-full" />
              </div>

              <div className="flex justify-between w-full relative">
                {steps.map((s, i) => {
                  // Logic: All steps are "completed" or "active" visually
                  const isActive = i === 2; // Index 2 is Confirm
                  const isCompleted = true; // All steps are effectively done/reachable

                  return (
                    <div key={i} className="relative flex flex-col items-center w-12 group">
                      <div className={`
                        relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all duration-500 z-10
                        ${isActive || isCompleted
                          ? "bg-white text-black border-white md:bg-black md:text-white md:border-black md:shadow-md"
                          : "bg-black text-slate-500 border-slate-700 md:bg-white md:text-slate-300 md:border-slate-200"
                        }
                      `}>
                        <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 stroke-2`} />
                      </div>

                      <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 w-32 text-center">
                        <span className={`
                          text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-300
                          ${isActive
                            ? "text-white md:text-black"
                            : "text-slate-600 md:text-slate-400"
                          }
                        `}>
                          {s.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ----------------- 2. THE CONFIRMATION CONTENT ----------------- */}
        <div className="bg-white p-3 sm:p-2 lg:p-6 lg:px-8 flex justify-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="w-full max-w-3xl"
          >
            <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden relative mt-6">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

              <div className="p-6 sm:p-10 text-center">

                {/* Icon */}
                <motion.div variants={fadeInUp} className="flex justify-center mb-5 relative">
                  <div className="absolute inset-0 bg-emerald-100/30 blur-xl rounded-full scale-125 animate-pulse" />
                  <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center relative shadow-sm z-10">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
                        d="M20 6L9 17l-5-5"
                      />
                    </svg>
                  </div>
                </motion.div>

                <motion.h2 variants={fadeInUp} className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-2">
                  Order Confirmed!
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
                  We've received your order and will begin processing it right away.
                </motion.p>

                {/* Timeline Steps */}
                <motion.div variants={fadeInUp} className="mt-6 mb-6 py-3 border-y border-dashed border-slate-100">
                  <div className="flex items-center justify-between max-w-md mx-auto relative px-2">
                    <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-100 -z-10" />
                    <div className="flex flex-col items-center gap-2 bg-white px-2">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-black">Placed</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-white px-2">
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Processing</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-white px-2">
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shipped</span>
                    </div>
                  </div>
                </motion.div>

                {/* Footer Buttons */}
                <motion.div variants={fadeInUp} className="flex flex-col items-center gap-6">
                  {transactionId && (
                    <div onClick={copyToClipboard} className="group flex flex-col sm:flex-row items-center gap-3 bg-slate-50/80 hover:bg-slate-100 border border-slate-100 px-5 py-2.5 rounded-xl cursor-pointer transition-colors max-w-full">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Order ID</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-sm font-semibold text-slate-700 break-all">{transactionId}</span>
                        <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                    <motion.button
                      onClick={() => navigate("/", { replace: true })}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 hover:text-black hover:border-slate-300 transition-all min-w-[180px]"
                    >
                      Continue Shopping
                    </motion.button>

                    <motion.button
                      onClick={() => navigate("/myorder", { replace: true })}
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 rounded-xl bg-black text-white font-semibold text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 min-w-[180px]"
                    >
                      Track Order <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>

              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}