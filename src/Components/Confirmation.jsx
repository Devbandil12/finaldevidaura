import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Home, Package } from "lucide-react";
import { motion } from "framer-motion";

export default function Confirmation({ resetCheckout }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-100 text-center flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <CheckCircle size={64} className="text-green-500" strokeWidth={1.5} />
      </motion.div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-4">Order Confirmed!</h2>
      <p className="text-slate-600 mt-2 max-w-sm">Thank you for your purchase. Your order is being processed and you will receive a confirmation email shortly.</p>
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
        <motion.button onClick={() => navigate("/")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors">
          <Home className="w-4 h-4" /> Back to Home
        </motion.button>
        <motion.button onClick={() => navigate("/myorder")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg bg-black text-white font-semibold hover:bg-slate-800 transition-colors">
          <Package className="w-4 h-4" /> View My Orders
        </motion.button>
      </div>
    </div>
  );
}