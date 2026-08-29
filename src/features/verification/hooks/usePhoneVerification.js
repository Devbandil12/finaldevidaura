// src/hooks/usePhoneVerification.js
import { useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";

const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, '');

export default function usePhoneVerification({ onVerified } = {}) {
  const { getToken } = useAuth();
  const [modal, setModal] = useState({ open: false, otpRequestId: null, maskedPhone: "", channel: "whatsapp", expiresInSeconds: 300 });
  const [pendingPhone, setPendingPhone] = useState(null);

  const startVerification = useCallback(async (phone, purpose = 'ADDRESS') => {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND}/api/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ phone, purpose }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'ALREADY_VERIFIED') {
          onVerified?.(phone);
          return { alreadyVerified: true };
        }
        throw new Error(data.msg || "Couldn't start verification.");
      }

      setPendingPhone(phone);
      setModal({
        open: true, purpose, maskedPhone: data.maskedPhone || maskPhoneLocal(phone),
        channel: data.channel || 'whatsapp', expiresInSeconds: data.expiresIn || 120,
      });
      return { alreadyVerified: false };
    } catch (err) {
      window.toast?.error(err.message || "Couldn't start verification.");
      return null;
    }
  }, [getToken, onVerified]);

  const verifyCode = useCallback(async (code) => {
    const token = await getToken();
    const res = await fetch(`${BACKEND}/api/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ phone: pendingPhone, purpose: modal.purpose, code }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setModal((prev) => ({ ...prev, open: false }));
      onVerified?.(pendingPhone, data.verificationToken);
    }
    return data;
  }, [getToken, modal.purpose, onVerified, pendingPhone]);

  const resendCode = useCallback(async () => {
    if (!pendingPhone) return null;
    return startVerification(pendingPhone, modal.purpose);
  }, [pendingPhone, startVerification, modal.purpose]);

  const closeModal = useCallback(() => setModal((prev) => ({ ...prev, open: false })), []);

  return { modal, startVerification, verifyCode, resendCode, closeModal };
}

function maskPhoneLocal(phone) {
  const digits = String(phone).replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return '••••••••••';
  return `+91 ${digits.slice(0, 2)}••••••${digits.slice(-2)}`;
}
