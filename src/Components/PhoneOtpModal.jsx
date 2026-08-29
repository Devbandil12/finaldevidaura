// src/Components/PhoneOtpModal.jsx
//
// Generic verification modal for user-initiated flows (Profile page,
// address form "add a new number").

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, MessageCircle, ShieldCheck, Check } from "lucide-react";
import OtpInput from "./OtpInput";

export default function PhoneOtpModal({
  open,
  maskedPhone,
  channel = "whatsapp",
  expiresInSeconds = 300,
  onVerify,   // async (code) => { success, msg? }
  onResend,   // async () => { success, expiresInSeconds, channel, msg? }
  onClose,
}) {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(expiresInSeconds);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resending, setResending] = useState(false);
  
  // New UI Orchestration States
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      setOtp(Array(6).fill(""));
      setError("");
      setIsSuccess(false);
      setShowCheckmark(false);
      setResendSuccess(false);
      return;
    }
    setSecondsLeft(expiresInSeconds);
    setResendCooldown(30);
  }, [open, expiresInSeconds]);

  useEffect(() => {
    if (!open || secondsLeft <= 0 || isSuccess) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, secondsLeft, isSuccess]);

  useEffect(() => {
    if (!open || resendCooldown <= 0 || isSuccess) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, resendCooldown, isSuccess]);

  const handleComplete = useCallback(async (code) => {
    setVerifying(true);
    setError("");
    try {
      const res = await onVerify(code);
      if (!res?.success) {
        setError(res?.msg || "Incorrect code. Please try again.");
        setOtp(Array(6).fill(""));
        setVerifying(false);
      } else {
        // 1. Trigger input green glow
        setIsSuccess(true);
        setVerifying(false);

        // 2. Crossfade to Success Checkmark after 400ms
        setTimeout(() => {
          setShowCheckmark(true);

          // 3. Close the modal after letting the user see the success screen
          setTimeout(() => {
            onClose();
          }, 1500);

        }, 400);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setOtp(Array(6).fill(""));
      setVerifying(false);
    }
  }, [onVerify, onClose]);

  const handleResend = async () => {
    if (resendCooldown > 0 || resending || isSuccess) return;
    setResending(true);
    setError("");
    try {
      const res = await onResend();
      if (res?.success) {
        setSecondsLeft(res.expiresInSeconds || expiresInSeconds);
        setResendCooldown(30);
        setOtp(Array(6).fill(""));
        
        // Smooth inline resend success animation
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 2000);
      } else {
        setError(res?.msg || "Couldn't resend the code.");
      }
    } catch (err) {
      setError(err.message || "Couldn't resend the code.");
    } finally {
      setResending(false);
    }
  };

  const mm = String(Math.floor(Math.max(secondsLeft, 0) / 60));
  const ss = String(Math.max(secondsLeft, 0) % 60).padStart(2, "0");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-[var(--bg)]/80 backdrop-blur-md px-4 font-body"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-md bg-[var(--surface)] rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.12)] overflow-hidden ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 min-h-[400px] flex flex-col"
          >
            {/* Soft Close Button (Hidden during success animation) */}
            {!showCheckmark && (
              <button 
                onClick={onClose} 
                disabled={verifying || isSuccess} 
                className="absolute top-5 right-5 p-2 flex items-center justify-center rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50 transition-all disabled:opacity-0 ring-1 ring-transparent hover:ring-[var(--border)]/40 z-20" 
                aria-label="Close"
              >
                <X size={18} strokeWidth={2} />
              </button>
            )}

            <AnimatePresence mode="wait">
              {showCheckmark ? (
                // --- SUCCESS VIEW ---
                <motion.div
                  key="success-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="px-6 sm:px-10 py-16 flex flex-col items-center justify-center text-center flex-1"
                >
                  <motion.div 
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-[1.5rem] bg-[var(--success)]/10 ring-1 ring-[var(--success)]/30 flex items-center justify-center mb-6 relative shadow-[0_0_40px_rgba(var(--success-rgb),0.2)]"
                  >
                    <div className="absolute inset-0 rounded-[1.5rem] bg-[var(--success)]/20 animate-ping opacity-50"></div>
                    <Check size={36} strokeWidth={2.5} className="text-[var(--success)] relative z-10" />
                  </motion.div>
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="font-display text-2xl font-medium text-[var(--text)] tracking-tight"
                  >
                    Verified Successfully
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="font-body text-xs font-medium text-[var(--sub)] mt-2"
                  >
                    Your identity has been securely authenticated.
                  </motion.p>
                </motion.div>
              ) : (
                // --- OTP FORM VIEW ---
                <motion.div
                  key="form-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="px-6 sm:px-10 pt-10 pb-8 flex flex-col items-center text-center flex-1"
                >
                  {/* Floating Animated Icon */}
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 rounded-2xl bg-[var(--brand)]/10 ring-1 ring-[var(--brand)]/20 flex items-center justify-center mb-6 shadow-sm relative"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-[var(--brand)]/5 animate-ping opacity-50"></div>
                    {channel === "whatsapp" ? (
                      <MessageCircle className="w-7 h-7 text-[var(--brand)] relative z-10" strokeWidth={1.5} />
                    ) : (
                      <ShieldCheck className="w-7 h-7 text-[var(--brand)] relative z-10" strokeWidth={1.5} />
                    )}
                  </motion.div>
                  
                  <h3 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Identity Verification</h3>
                  <p className="mt-2.5 text-xs font-medium text-[var(--sub)] max-w-[260px] leading-relaxed">
                    A 6-digit secure code has been sent via <span className="font-bold text-[var(--text)]">{channel === "whatsapp" ? "WhatsApp" : "SMS"}</span> to <br />
                    <span className="font-body font-medium text-[var(--text)] tracking-wide">{maskedPhone}</span>
                  </p>

                  {/* OTP Input Component */}
                  <div className="mt-8 w-full">
                    <OtpInput 
                      otp={otp} 
                      setOtp={setOtp} 
                      length={6} 
                      onComplete={handleComplete} 
                      isSuccess={isSuccess} 
                      isError={!!error} // Triggers elegant shake
                    />
                  </div>

                  {/* Smooth Verification / Error State Messaging */}
                  <div className="mt-6 h-6 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {verifying ? (
                        <motion.div 
                          key="verifying"
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--brand)]"
                        >
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Authorizing...
                        </motion.div>
                      ) : error ? (
                        <motion.div 
                          key="error"
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                          className="text-[10px] font-bold uppercase tracking-widest text-[var(--error)] bg-[var(--error)]/10 px-3 py-1.5 rounded-md ring-1 ring-[var(--error)]/20"
                        >
                          {error}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <div className="w-full h-px bg-[var(--border)]/30 dark:bg-[var(--border)]/60 my-6"></div>

                  {/* Footer: Countdown & Resend */}
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                      {secondsLeft > 0 ? (
                        <span>Valid For <span className="font-body font-medium text-[var(--text)] ml-1">{mm}:{ss}</span></span>
                      ) : (
                        <span className="text-[var(--error)]">Code Expired</span>
                      )}
                    </div>

                    <AnimatePresence mode="wait">
                      {resendSuccess ? (
                        <motion.div
                          key="resend-success"
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                          className="flex items-center justify-center h-10 w-full rounded-xl bg-[var(--success)]/10 ring-1 ring-[var(--success)]/30 text-[var(--success)] shadow-inner"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Check size={14} strokeWidth={2.5}/> New Code Transmitted
                          </span>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="resend-button"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          onClick={handleResend}
                          disabled={resendCooldown > 0 || resending || verifying || isSuccess}
                          className="group flex items-center justify-center h-10 w-full rounded-xl bg-[var(--surface-muted)]/30 ring-1 ring-[var(--border)]/40 hover:ring-[var(--border)]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text)] group-hover:text-[var(--brand)] transition-colors">
                            {resending ? "Transmitting..." : resendCooldown > 0 ? `Resend Available In ${resendCooldown}s` : "Request New Code"}
                          </span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                  
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}