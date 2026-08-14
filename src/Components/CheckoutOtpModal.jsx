// src/Components/CheckoutOtpModal.jsx
//
// Shown only for the subset of COD orders the risk engine actually flags
// (see helpers/codRiskEngine.js on the backend) — most customers never see
// this screen at all. Masked phone number, six-digit boxes (reusing the
// same OtpInput used on the login screen), a resend timer, and a short
// note explaining *why* it's showing up, since an unexplained extra step
// at checkout reads as friction but an explained one reads as a safeguard.

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, Loader2, MessageCircle } from "lucide-react";
import OtpInput from "./OtpInput";

const luxuryEase = [0.25, 0.1, 0.25, 1];

export default function CheckoutOtpModal({
  open,
  maskedPhone,
  channel = "whatsapp",
  expiresInSeconds = 300,
  onVerify,       // async (code) => { success, msg? }
  onResend,       // async () => { success, expiresInSeconds, channel, msg? }
  onClose,
}) {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(expiresInSeconds);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOtp(Array(6).fill(""));
    setError("");
    setSecondsLeft(expiresInSeconds);
    setResendCooldown(30);
  }, [open, expiresInSeconds]);

  useEffect(() => {
    if (!open || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, secondsLeft]);

  useEffect(() => {
    if (!open || resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, resendCooldown]);

  const handleComplete = useCallback(async (code) => {
    setVerifying(true);
    setError("");
    try {
      const res = await onVerify(code);
      if (!res?.success) {
        setError(res?.msg || "Incorrect code. Please try again.");
        setOtp(Array(6).fill(""));
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setOtp(Array(6).fill(""));
    } finally {
      setVerifying(false);
    }
  }, [onVerify]);

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      const res = await onResend();
      if (res?.success) {
        setSecondsLeft(res.expiresInSeconds || expiresInSeconds);
        setResendCooldown(30);
        setOtp(Array(6).fill(""));
        window.toast?.success("A new code has been sent.");
      } else {
        setError(res?.msg || "Couldn't resend the code. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Couldn't resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const mm = String(Math.floor(Math.max(secondsLeft, 0) / 60)).padStart(1, "0");
  const ss = String(Math.max(secondsLeft, 0) % 60).padStart(2, "0");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.4, ease: luxuryEase }}
            className="relative w-full max-w-md bg-white rounded-[1.75rem] shadow-2xl overflow-hidden border border-slate-100"
          >
            <button
              onClick={onClose}
              disabled={verifying}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-black hover:bg-slate-100 transition-colors disabled:opacity-40"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-8 pt-10 pb-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                {channel === "whatsapp" ? (
                  <MessageCircle className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Verify it's you
              </h3>
              <p className="mt-2 text-sm text-slate-500 max-w-xs">
                We sent a 6-digit code via {channel === "whatsapp" ? "WhatsApp" : "SMS"} to{" "}
                <span className="font-semibold text-slate-700">{maskedPhone}</span>
              </p>

              <div className="mt-7">
                <OtpInput
                  otp={otp}
                  setOtp={setOtp}
                  length={6}
                  onComplete={handleComplete}
                  isSuccess={false}
                />
              </div>

              <div className="mt-4 h-5">
                {verifying && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Verifying...
                  </div>
                )}
                {!verifying && error && (
                  <p className="text-xs font-medium text-rose-500">{error}</p>
                )}
              </div>

              <div className="mt-4 text-xs text-slate-400">
                {secondsLeft > 0 ? (
                  <span>Code expires in {mm}:{ss}</span>
                ) : (
                  <span className="text-rose-500 font-medium">Code expired</span>
                )}
              </div>

              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className="mt-2 text-xs font-semibold text-slate-700 hover:text-black underline decoration-slate-300 underline-offset-4 disabled:opacity-40 disabled:no-underline transition-colors"
              >
                {resending ? "Sending..." : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
              </button>

              <div className="mt-7 pt-5 border-t border-slate-100 w-full">
                <p className="text-[11px] leading-relaxed text-slate-400">
                  This quick check helps us make sure your order reaches you —
                  it only shows up occasionally, for orders that benefit from
                  it. Your saved number will be trusted going forward.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
