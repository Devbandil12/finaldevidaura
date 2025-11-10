import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// --- Constants for animation ---
const MAX_VISIBLE_TOASTS = 3;
const TOAST_OFFSET = 10;
const TOAST_SCALE_FACTOR = 0.05;

// ====================================================================================
// DEDICATED TOAST SUB-COMPONENT
// ====================================================================================
const Toast = ({ toast, index, removeToast }) => {
  const controls = useAnimationControls();

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      controls.start({
        scaleX: 0,
        transition: {
          duration: toast.duration / 1000,
          ease: "linear",
        },
      });
    }
  }, [controls, toast.duration]);

  const y = index * TOAST_OFFSET;
  const scale = 1 - index * TOAST_SCALE_FACTOR;
  const opacity = index === 0 ? 1 : 1 - (index / MAX_VISIBLE_TOASTS) * 0.8;

  const iconMap = {
    success: <FiCheckCircle className="text-green-500" size={20} />,
    error: <FiAlertCircle className="text-red-500" size={20} />,
    info: <FiInfo className="text-blue-500" size={20} />,
  };

  return (
    <motion.div
      key={toast.id}
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity, y, scale, transition: { type: "spring", stiffness: 400, damping: 40 } }}
      exit={{ opacity: 0, scale: 0.5, y: -20, rotateX: 45, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
      style={{
        position: 'absolute',
        zIndex: MAX_VISIBLE_TOASTS - index,
        transformOrigin: 'bottom center',
      }}
      className="pointer-events-auto w-full max-w-sm flex flex-col overflow-hidden rounded-2xl shadow-xl bg-white ring-1 ring-neutral-200"
    >
      <div className="flex items-center gap-4 p-4">
        <div>{iconMap[toast.type]}</div>
        <p className="flex-1 text-sm font-medium text-neutral-800 break-words">{toast.message}</p>
        <button
          onClick={() => removeToast(toast.id)}
          className="p-1 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500"
          aria-label="Close"
        >
          <FiX size={16} />
        </button>
      </div>

      {/* PROGRESS BAR */}
      {toast.duration > 0 && (
          <motion.div
            className="h-px bg-teal-500"
            style={{ transformOrigin: 'left' }}
            initial={{ scaleX: 1 }}
            animate={controls}
        />
      )}
    </motion.div>
  );
};

// ====================================================================================
// UPDATED TOAST PROVIDER
// ====================================================================================
export function ToastProvider({ children, position = "bottom-right" }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [{ id, message, type, duration }, ...prev]);

    if (duration) {
        setTimeout(() => removeToast(id), duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    window.toast = {
      success: (msg, opts) => addToast(msg, "success", opts?.duration),
      error: (msg, opts) => addToast(msg, "error", opts?.duration),
      info: (msg, opts) => addToast(msg, "info", opts?.duration),
    };
  }, [addToast]);
  
  // ✅ UPDATED: Classes are now mobile-first (no 'sm:' prefix)
  // This makes them apply to all screen sizes.
  const positionClasses = {
    "top-left": "items-start justify-start",
    "top-center": "items-center justify-start",
    "top-right": "items-end justify-start",
    "bottom-left": "items-start justify-end",
    "bottom-center": "items-center justify-end",
    
    // ✅ UPDATED: This specific class is now responsive:
    // Mobile (default): items-end (right) + justify-start (top)   = TOP-RIGHT
    // Desktop (sm:):    items-end (right) + sm:justify-end (bottom) = BOTTOM-RIGHT
    "bottom-right": "items-end justify-start sm:justify-end",
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      <div
        aria-live="assertive"
        // ✅ UPDATED: Added z-[99999] for visibility
        className={`fixed inset-0 flex flex-col gap-3 p-4 sm:p-4 pointer-events-none ${positionClasses[position]} z-[99999]`}
        style={{ perspective: "1000px" }}
      >
        <AnimatePresence>
          {toasts.map((toast, index) => {
            if (index >= MAX_VISIBLE_TOASTS) return null;
            
            return (
              <Toast
                key={toast.id}
                toast={toast}
                index={index}
                removeToast={removeToast}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}