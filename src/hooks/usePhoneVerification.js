// src/hooks/usePhoneVerification.js
import { useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";

const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, '');

export default function usePhoneVerification({ onVerified } = {}) {
  const { getToken } = useAuth();
  const [modal, setModal] = useState({ open: false, otpRequestId: null, maskedPhone: "", channel: "whatsapp", expiresInSeconds: 300 });
  const [pendingPhone, setPendingPhone] = useState(null);

  const startVerification = useCallback(async (phone) => {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND}/api/phone-verification/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.msg || "Couldn't start verification.");

      if (data.alreadyVerified) {
        onVerified?.(phone);
        return { alreadyVerified: true };
      }

      setPendingPhone(phone);
      setModal({
        open: true, otpRequestId: data.otpRequestId, maskedPhone: data.maskedPhone,
        channel: data.channel, expiresInSeconds: data.expiresInSeconds || 300,
      });
      return { alreadyVerified: false };
    } catch (err) {
      window.toast?.error(err.message || "Couldn't start verification.");
      return null;
    }
  }, [getToken, onVerified]);

  const verifyCode = useCallback(async (code) => {
    const token = await getToken();
    const res = await fetch(`${BACKEND}/api/phone-verification/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ otpRequestId: modal.otpRequestId, code }),
    });
    const data = await res.json();
    if (data.success) {
      setModal((prev) => ({ ...prev, open: false }));
      onVerified?.(pendingPhone, data.verificationToken);
    }
    return data;
  }, [getToken, modal.otpRequestId, onVerified, pendingPhone]);

  const resendCode = useCallback(async () => {
    if (!pendingPhone) return null;
    return startVerification(pendingPhone);
  }, [pendingPhone, startVerification]);

  const closeModal = useCallback(() => setModal((prev) => ({ ...prev, open: false })), []);

  return { modal, startVerification, verifyCode, resendCode, closeModal };
}
