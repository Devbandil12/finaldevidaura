import React from "react";
import { useNavigate } from "react-router-dom";
import { Check, Truck, Package, Copy, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const smoothTransition = {
  type: "tween",
  ease: [0.25, 0.1, 0.25, 1],
  duration: 0.6
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: smoothTransition }
};

export default function Confirmation({ resetCheckout, transactionId }) {
  const navigate = useNavigate();

  const copyToClipboard = () => {
    if (transactionId) {
      navigator.clipboard.writeText(transactionId);
      window.toast.success("Order ID copied");
    }
  };

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 w-full max-w-3xl overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

        {/* Responsive padding: p-6 on mobile, p-10 on desktop */}
        <div className="p-6 sm:p-10 text-center">
            
            {/* 1. Animated Icon */}
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

            {/* 2. Main Heading & Text */}
            <motion.h2 variants={fadeInUp} className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-2">
                Order Confirmed!
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
                We've received your order and will begin processing it right away.
            </motion.p>

            {/* 3. Timeline */}
            <motion.div variants={fadeInUp} className="mt-6 mb-6 py-3 border-y border-dashed border-slate-100">
                <div className="flex items-center justify-between max-w-md mx-auto relative px-2">
                    <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-100 -z-10" />
                    
                    {/* Steps */}
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

            {/* 4. Footer */}
            <motion.div variants={fadeInUp} className="flex flex-col items-center gap-6">
                {transactionId && (
                    <div 
                        onClick={copyToClipboard}
                        className="group flex flex-col sm:flex-row items-center gap-3 bg-slate-50/80 hover:bg-slate-100 border border-slate-100 px-5 py-2.5 rounded-xl cursor-pointer transition-colors max-w-full"
                    >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Order ID</span>
                        <div className="flex items-center gap-2 min-w-0">
                            {/* break-all ensures long IDs don't overflow */}
                            <span className="font-mono text-sm font-semibold text-slate-700 break-all">{transactionId}</span>
                            <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                    <motion.button 
                        onClick={() => navigate("/")} 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 hover:text-black hover:border-slate-300 transition-all min-w-[180px]"
                    >
                        Continue Shopping
                    </motion.button>
                    
                    <motion.button 
                        onClick={() => navigate("/myorder")} 
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.1)" }} 
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 rounded-xl bg-black text-white font-semibold text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 min-w-[180px]"
                    >
                        Track Order <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </div>
            </motion.div>
        </div>
      </motion.div>
    </div>
  );
}