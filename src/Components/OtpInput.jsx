import React, { useRef, useEffect } from "react";
import "../style/OtpInput.css";

export default function OtpInput({ otp, setOtp, length = 6, onComplete, isSuccess }) {
  const inputsRef = useRef([]);

  useEffect(() => {
    if (otp.length === length && onComplete) {
      onComplete(otp);
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
    <div className={`otp-box-container ${isSuccess ? "success" : ""}`}>
      {[...Array(length)].map((_, i) => (
        <input
          key={i}
          type="text"
          maxLength={1}
          value={otp[i] || ""}
          ref={(el) => (inputsRef.current[i] = el)}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="otp-input-box"
        />
      ))}
    </div>
  );
}
