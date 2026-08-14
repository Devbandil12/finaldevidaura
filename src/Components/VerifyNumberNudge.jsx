// src/Components/VerifyNumberNudge.jsx
//
// Appears once, a couple seconds after the home page settles, bottom-right,
// dismissible. Convenience framing ("skip OTP at checkout"), not a reward —
// no wallet money attached to verification anywhere in this app.

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle } from "lucide-react";

export default function VerifyNumberNudge({ onVerifyClick }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-6 right-6 z-[500] w-72 bg-white rounded-2xl shadow-2xl border border-zinc-100 p-4"
        >
          <div className="flex items-start justify-between mb-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <button onClick={() => setVisible(false)} aria-label="Dismiss" className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-black">
              <X size={14} />
            </button>
          </div>
          <p className="text-sm font-semibold text-zinc-900 mb-1">Verify your number</p>
          <p className="text-xs text-zinc-500 leading-relaxed mb-3">
            Do it once now, skip the OTP step at checkout from here on.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setVisible(false)} className="flex-1 text-xs font-semibold text-zinc-500 py-2 rounded-full hover:bg-zinc-50">Not now</button>
            <button
              onClick={() => { setVisible(false); onVerifyClick?.(); }}
              className="flex-1 text-xs font-bold text-emerald-700 border border-emerald-200 py-2 rounded-full hover:bg-emerald-50"
            >
              Verify now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
