import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import MiniLoader from "./MiniLoader";
import "../style/CustomAuthModal.css";
import SignUpImage from "../assets/New folder/Adobe Express - file.png";
import SignInImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";

export default function CustomAuthModal({ open, onClose }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const { signUp, setActive: activateSignUp } = useSignUp();
  const { signIn, setActive: activateSignIn } = useSignIn();
  const navigate = useNavigate();

  const containerRef = useRef();
  const fieldsRef = useRef();
  const imageRef = useRef();

  const isMobile = () => window.innerWidth <= 768;

  useEffect(() => {
    if (!open) return;
    if (isMobile()) {
      gsap.set(fieldsRef.current, { y: "0%" });
      gsap.set(imageRef.current, { y: "0%" });
    } else {
      gsap.set(fieldsRef.current, { x: isSignUp ? "0%" : "100%" });
      gsap.set(imageRef.current, { x: isSignUp ? "0%" : "-100%" });
    }
  }, [open, isSignUp]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setOtpCode("");
      setFirstName("");
      setLastName("");
      setError("");
      setOtpSent(false);
    }
  }, [open]);

  const handleToggle = () => {
    const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "power2.inOut" } });
    if (isMobile()) {
      tl.to(imageRef.current, { y: "-130%" }, 0);
      tl.to(fieldsRef.current, { y: "130%" }, 0);
      tl.add(() => {
        setIsSignUp((prev) => !prev);
        setOtpSent(false);
        setError("");
      }, 0.3);
      tl.to(fieldsRef.current, { y: "0%" }, 0.5);
      tl.to(imageRef.current, { y: "0%" }, 0.5);
    } else {
      tl.to(fieldsRef.current, { x: isSignUp ? "100%" : "0%" }, 0);
      tl.to(imageRef.current, { x: isSignUp ? "-100%" : "0%" }, 0);
      tl.add(() => {
        setIsSignUp((prev) => !prev);
        setOtpSent(false);
        setError("");
      }, 0.3);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);

    try {
      if (isSignUp) {
        await signUp.create({ emailAddress: email, firstName, lastName });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setOtpSent(true);
      } else {
        await signIn.create({ identifier: email, strategy: "email_code" });
        setOtpSent(true);
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Something went wrong");
      setFormLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp.attemptEmailAddressVerification({ code: otpCode });
        if (result.status === "complete") {
          await activateSignUp({ session: result.createdSessionId });
          onClose();
          navigate("/");
        }
      } else {
        const result = await signIn.attemptFirstFactor({ code: otpCode });
        if (result.status === "complete") {
          await activateSignIn({ session: result.createdSessionId });
          onClose();
          navigate("/");
        }
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Invalid or expired code");
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const strategy = "oauth_google";
      const action = isSignUp ? signUp : signIn;
      await action.authenticateWithRedirect({ strategy });
    } catch (err) {
      setError(err.errors?.[0]?.message || "Google auth failed");
      setGoogleLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-container" ref={containerRef} onClick={(e) => e.stopPropagation()}>
        <div className="auth-fields" ref={fieldsRef}>
          <h2>{isSignUp ? "Create account" : "Welcome back"}</h2>

          <button className="google-btn" onClick={handleGoogle} disabled={googleLoading}>
            {googleLoading ? <MiniLoader text="Processing..." /> : isSignUp ? "Sign up with Google" : "Sign in with Google"}
          </button>

          <div className="divider"><span>OR</span></div>

          <form onSubmit={otpSent ? handleVerifyCode : handleAuth} className="form-scroll-area">
            {isSignUp && !otpSent && (
              <div className="name-row">
                <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                <input type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            )}

            {!otpSent && (
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}

            {otpSent && (
              <input type="text" placeholder="Enter 6-digit code" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required />
            )}

            {error && <div className="error">{error}</div>}

            <button type="submit" className="action-btn" disabled={formLoading}>
              {formLoading ? <MiniLoader text="Processing..." /> : otpSent ? "Verify Code" : isSignUp ? "Sign up" : "Log in"}
            </button>
          </form>

          <p className="toggle-text">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <span onClick={handleToggle}>{isSignUp ? "Log in" : "Sign up"}</span>
          </p>
        </div>

        <div className="auth-image" ref={imageRef}>
          <img src={isSignUp ? SignUpImage : SignInImage} alt="Creative background" className="cutout-img" />
          <div className="image-overlay-text">
            {isSignUp ? "Join the fragrance revolution." : "Welcome back! Great to see you again."}
          </div>
        </div>
      </div>
      <button className="close-modal" onClick={onClose}>✕</button>
    </div>,
    document.body
  );
}
