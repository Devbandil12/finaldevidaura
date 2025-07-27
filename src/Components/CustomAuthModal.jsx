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
  const [awaitingOTP, setAwaitingOTP] = useState(false);
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signUp, setActive: setSignUpActive } = useSignUp();
  const { signIn, setActive: setSignInActive } = useSignIn();
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
      setPassword("");
      setFirstName("");
      setLastName("");
      setOtpCode("");
      setError("");
      setAwaitingOTP(false);
    }
  }, [open]);

  const passwordChecks = [
    { label: "Minimum 8 characters", passed: password.length >= 8 },
    { label: "First letter capital", passed: /^[A-Z]/.test(password) },
    { label: "One special character", passed: /[!@#$%^&*(),.?\":{}|<>]/.test(password) },
    { label: "At least one number", passed: /\d/.test(password) },
  ];

  const handleToggle = () => {
    const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "power2.inOut" } });
    if (isMobile()) {
      tl.to(imageRef.current, { y: "-130%" }, 0);
      tl.to(fieldsRef.current, { y: "130%" }, 0);
      tl.add(() => setIsSignUp((prev) => !prev), 0.3);
      tl.to(fieldsRef.current, { y: "0%" }, 0.5);
      tl.to(imageRef.current, { y: "0%" }, 0.5);
    } else {
      tl.to(fieldsRef.current, { x: isSignUp ? "100%" : "0%" }, 0);
      tl.to(imageRef.current, { x: isSignUp ? "-100%" : "0%" }, 0);
      tl.add(() => setIsSignUp((prev) => !prev), 0.3);
    }
    setAwaitingOTP(false);
    setOtpCode("");
    setError("");
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);

    try {
      if (isSignUp) {
        await signUp.create({
          emailAddress: email,
          password,
          firstName,
          lastName,
        });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        alert("Check your email for verification code.");
      } else {
        if (!awaitingOTP) {
          const res = await signIn.create({
            identifier: email,
            strategy: "email_code",
          });
          if (res.status === "needs_first_factor") {
            setAwaitingOTP(true);
          }
        } else {
          const result = await signIn.attemptFirstFactor({
            strategy: "email_code",
            code: otpCode,
          });
          if (result.status === "complete") {
            await setSignInActive({ session: result.createdSessionId });
            onClose();
            navigate("/");
          } else {
            setError("Invalid code or session issue.");
          }
        }
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Something went wrong.");
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
    } finally {
      setGoogleLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-container" ref={containerRef} onClick={(e) => e.stopPropagation()}>
        <div className="auth-fields" ref={fieldsRef}>
          <h2>{isSignUp ? "Create account" : awaitingOTP ? "Enter OTP" : "Welcome back"}</h2>

          {!awaitingOTP && (
            <button className="google-btn" onClick={handleGoogle} disabled={googleLoading}>
              {googleLoading ? <MiniLoader text="Processing..." /> : isSignUp ? "Sign up with Google" : "Sign in with Google"}
            </button>
          )}

          {!awaitingOTP && (
            <div className="divider"><span>OR</span></div>
          )}

          <form onSubmit={handleAuth} className="form-scroll-area">
            {isSignUp && (
              <div className="name-row">
                <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                <input type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            )}

            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />

            {isSignUp && (
              <>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="#666" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.944 10.944 0 0112 20C5 20 1 12 1 12a17.26 17.26 0 013.94-5.94M9.9 4.24A10.944 10.944 0 0112 4c7 0 11 8 11 8a17.222 17.222 0 01-2.31 3.43M1 1l22 22" stroke="#666" strokeWidth="2"/>
                      </svg>
                    )}
                  </span>
                </div>

                <ul className="password-checks">
                  {passwordChecks.map((check, idx) => (
                    <li key={idx} className={check.passed ? "passed" : "failed"}>
                      • {check.label}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {!isSignUp && awaitingOTP && (
              <input
                type="text"
                placeholder="Enter OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            )}

            {error && <div className="error">{error}</div>}

            <button type="submit" className="action-btn" disabled={formLoading}>
              {formLoading ? <MiniLoader text="Processing..." /> : isSignUp ? "Sign up" : awaitingOTP ? "Verify OTP" : "Send OTP"}
            </button>
          </form>

          {!awaitingOTP && (
            <p className="toggle-text">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <span onClick={handleToggle}>{isSignUp ? "Log in" : "Sign up"}</span>
            </p>
          )}
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
