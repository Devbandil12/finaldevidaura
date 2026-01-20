import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- ANIMATION VARIANTS ---
export const smoothTransition = { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] };
export const fadeInUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: smoothTransition } };
export const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };

// --- UTILS ---
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// --- COMPONENTS ---
export const Button = ({ onClick, variant = 'primary', size = 'default', className = '', children, disabled, type = "button" }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50 disabled:pointer-events-none active:scale-95";

  const sizeStyles = {
    default: "h-11 py-2 px-6",
    sm: "h-9 px-4 text-xs",
    icon: "h-10 w-10"
  };

  const variantStyles = {
    primary: "bg-zinc-900 text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_25px_-5px_rgba(0,0,0,0.2)] hover:bg-black",
    secondary: "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 shadow-sm",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
    ghost: "bg-transparent text-zinc-400 hover:text-zinc-900 px-0 h-auto"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const FloatingInput = React.forwardRef(({ label, error, className = "", ...props }, ref) => (
  <div className={`relative w-full ${className}`}>
    <input
      ref={ref} placeholder=" "
      className={`peer w-full rounded-2xl border bg-white px-5 py-4 text-sm font-medium text-zinc-900 outline-none transition-all duration-300 placeholder-transparent
        ${error ? "border-red-300 focus:border-red-500 bg-red-50/10" : "border-zinc-200 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-50"}`}
      {...props}
    />
    <label className="absolute left-5 -top-2.5 bg-white px-2 text-xs font-bold text-zinc-400 transition-all duration-300 pointer-events-none rounded-md
      peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal
      peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-zinc-900 peer-focus:font-bold">
      {label}
    </label>
    {error && <p className="text-xs text-red-500 mt-1.5 ml-2 font-medium">{error}</p>}
  </div>
));

export const FloatingDropdown = ({ label, value, onChange, options = [] }) => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative w-full" ref={boxRef}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="peer w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm text-left cursor-pointer outline-none transition-all duration-300 focus:border-zinc-900 flex justify-between items-center">
        <span className={`font-medium ${!value ? "text-zinc-400" : "text-zinc-900"}`}>{value || "Select..."}</span>
        <ChevronDown size={16} className={`text-zinc-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <label className="absolute left-5 -top-2.5 bg-white px-2 text-xs font-bold text-zinc-400 pointer-events-none rounded-md">{label}</label>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-30 mt-2 w-full bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden py-1 max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <li key={opt} onClick={() => { onChange(opt); setOpen(false); }} className={`px-5 py-3 text-sm font-medium cursor-pointer transition-colors ${value === opt ? "bg-zinc-50 text-black font-bold" : "hover:bg-zinc-50 text-zinc-600"}`}>
                {opt}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};