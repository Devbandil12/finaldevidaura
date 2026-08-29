import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function OtpInput({ otp, setOtp, length = 6, onComplete, isSuccess, isError }) {
  const inputsRef = useRef([]);

  useEffect(() => {
    if (otp.length === length && otp.every(val => val !== "") && onComplete) {
      onComplete(otp.join(''));
    }
  }, [otp, onComplete, length]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/, "");
    if (!value) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (otp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {[...Array(length)].map((_, i) => (
        <motion.input
          key={i}
          type="text"
          maxLength={1}
          value={otp[i] || ""}
          ref={(el) => (inputsRef.current[i] = el)}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          // Smooth focus, fill, success, and error animations
          whileFocus={{ scale: 1.05, y: -2 }}
          animate={
            isSuccess 
              ? { scale: [1, 1.1, 1], transition: { duration: 0.3, ease: "easeOut" } }
              : isError
              ? { x: [-4, 4, -4, 4, 0], transition: { duration: 0.4 } } // Error Shake
              : otp[i] 
              ? { scale: [0.95, 1], transition: { duration: 0.15 } } // Pop on fill
              : { scale: 1, y: 0 }
          }
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center font-body font-medium text-xl sm:text-2xl rounded-[0.85rem] outline-none transition-colors duration-300 shadow-inner
            ${isSuccess 
              ? 'ring-1 ring-[var(--success)] bg-[var(--success)]/10 text-[var(--success)] shadow-[0_0_15px_rgba(var(--success-rgb),0.2)]' 
              : isError 
              ? 'ring-1 ring-[var(--error)] bg-[var(--error)]/5 text-[var(--error)]'
              : otp[i]
              ? 'ring-1 ring-[var(--brand)]/50 bg-[var(--surface)] text-[var(--text)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
              : 'ring-1 ring-[var(--border)]/40 dark:ring-[var(--border)]/60 bg-[var(--surface-muted)]/30 text-[var(--text)] hover:bg-[var(--surface-muted)]/50'
            }
            focus:ring-[1.5px] focus:ring-[var(--brand)] focus:bg-[var(--surface)] focus:shadow-[0_8px_24px_rgba(0,0,0,0.08)]
          `}
        />
      ))}
    </div>
  );
}