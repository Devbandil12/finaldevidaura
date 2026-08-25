// src/Components/AddressPhoneField.jsx
//
// Part A3 — the shared piece both address forms (account page and
// checkout) now use instead of a plain phone `<input>`. Two things:
//
// 1. A quick-picker of the user's already-verified numbers, so picking a
//    number you've used before costs zero taps and never asks for an OTP
//    again. This is the highest-leverage piece of the whole phone
//    verification feature — most of the friction-reduction comes from here.
// 2. When typing a genuinely new number, a "Verify" action — always
//    available, never forced here. (The one place verification actually
//    gets required is at COD checkout, via the risk engine already built
//    in Phase 1 — this component doesn't duplicate that gate, since at
//    address-entry time the payment method isn't chosen yet.)
//
// Controlled component: `value` / `onChange(phone)` work with both plain
// useState (AddressSelection.jsx) and react-hook-form's <Controller>
// (AddressesTab.jsx).

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ShieldCheck, ChevronDown } from "lucide-react";
import PhoneOtpModal from "./PhoneOtpModal";
import usePhoneVerification from "../features/verification/hooks/usePhoneVerification";

const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, '');

export default function AddressPhoneField({ value, onChange, className = "", inputClassName = "", label = null }) {
  const { getToken } = useAuth();
  const [verifiedPhones, setVerifiedPhones] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND}/api/phone-verification/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled && data.success) setVerifiedPhones(data.phones || []);
      } catch (_) {
        // Quietly degrade to a plain phone input — this is a convenience layer, not critical path.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [getToken]);

  const isCurrentValueVerified = verifiedPhones.some(p => p.phone === value);

  const { modal: otpModal, startVerification, verifyCode, resendCode, closeModal } = usePhoneVerification({
    onVerified: (phone) => {
      setVerifiedPhones(prev => prev.some(p => p.phone === phone) ? prev : [...prev, { phone, verifiedAt: new Date().toISOString() }]);
      window.toast?.success("Number verified!");
    },
  });

  const handleVerifyClick = useCallback(async () => {
    if (!value || !/^[6-9]\d{9}$/.test(value)) {
      return window.toast?.error("Enter a valid 10-digit number first.");
    }
    await startVerification(value);
  }, [value, startVerification]);

  return (
    <div className={className}>
      <input
        id="phone"
        type="tel"
        maxLength="10"
        value={value || ""}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        onFocus={() => verifiedPhones.length > 0 && setShowPicker(true)}
        className={inputClassName}
        placeholder=" "
        required
      />
      {label}

      {/* Quick-picker — only shown once we know there's something to pick from */}
      {loaded && verifiedPhones.length > 0 && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => setShowPicker(p => !p)}
            className="text-xs font-semibold text-zinc-500 hover:text-black flex items-center gap-1"
          >
            Use a saved number <ChevronDown size={12} className={`transition-transform ${showPicker ? 'rotate-180' : ''}`} />
          </button>
          {showPicker && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {verifiedPhones.map(p => (
                <button
                  type="button"
                  key={p.phone}
                  onClick={() => { onChange(p.phone); setShowPicker(false); }}
                  className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 transition-colors ${
                    value === p.phone ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                  }`}
                >
                  <ShieldCheck size={11} /> {p.phone}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verified badge / optional verify action for the current value */}
      <div className="mt-1.5">
        {isCurrentValueVerified ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <ShieldCheck size={12} /> Verified
          </span>
        ) : value && /^[6-9]\d{9}$/.test(value) ? (
          <button type="button" onClick={handleVerifyClick} className="text-xs font-semibold text-zinc-500 hover:text-black underline decoration-zinc-300 underline-offset-4">
            Verify this number
          </button>
        ) : null}
      </div>

      <PhoneOtpModal
        open={otpModal.open}
        maskedPhone={otpModal.maskedPhone}
        channel={otpModal.channel}
        expiresInSeconds={otpModal.expiresInSeconds}
        onVerify={verifyCode}
        onResend={resendCode}
        onClose={closeModal}
      />
    </div>
  );
}
