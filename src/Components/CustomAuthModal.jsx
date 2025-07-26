// src/components/CustomAuthModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";
import MiniLoader from "./MiniLoader";
import "../style/CustomAuthModal.css";

export default function CustomAuthModal({ open, onClose }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signUp, setActive: activateSignUp } = useSignUp();
  const { signIn, setActive: activateSignIn } = useSignIn();
  const navigate = useNavigate();

  const containerRef = useRef();
  const fieldsRef = useRef();
  const imageRef = useRef();

  useEffect(() => {
    if (!open) return;
    const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "power2.inOut" } });
    tl.to(fieldsRef.current, {
      x: isSignUp ? 0 : containerRef.current.clientWidth / 2,
    }, 0);
    tl.to(imageRef.current, {
      x: isSignUp ? 0 : -containerRef.current.clientWidth / 2,
    }, 0);
    return () => tl.kill();
  }, [isSignUp, open]);

  if (!open) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp.create({ emailAddress: email, password });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        alert("Check your email for verification link.");
      } else {
        const result = await signIn.create({ identifier: email, password });
        if (result.status === "complete") {
          await activateSignIn({ session: result.createdSessionId });
          onClose();
          navigate("/");
        }
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
  setIsLoading(true);
  try {
    if (isSignUp) {
      await signUp.authenticateWithRedirect({ strategy: "oauth_google" });
    } else {
      await signIn.authenticateWithRedirect({ strategy: "oauth_google" });
    }
    // Clerk will redirect, no further code runs here
  } catch (err) {
    setError(err.errors?.[0]?.message || "Google auth failed");
    setIsLoading(false);
  }
};



  return createPortal(
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div
        className="auth-modal-container"
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==== FIELDS PANEL ==== */}
        <div className="auth-fields" ref={fieldsRef}>
          <h2>{isSignUp ? "Create account" : "Welcome back"}</h2>

          <button className="google-btn" onClick={handleGoogle} disabled={isLoading}>
            {isLoading ? <MiniLoader text={isSignUp ? "Signing up..." : "Signing in..."} /> :
              isSignUp ? "Sign up with Google" : "Sign in with Google"}
          </button>

          <div className="divider"><span>OR</span></div>

          <form onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <div className="error">{error}</div>}
            <button type="submit" className="action-btn" disabled={isLoading}>
              {isLoading ? <MiniLoader text="Processing..." /> : isSignUp ? "Sign up" : "Log in"}
            </button>
          </form>

          <p className="toggle-text">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <span onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? "Log in" : "Sign up"}
            </span>
          </p>
        </div>

        {/* ==== IMAGE PANEL ==== */}
        <div className="auth-image" ref={imageRef}>
          <img
            src="/auth-cutout.png" // ← 🔁 Replace with your path (public folder works best)
            alt="Creative image"
            className="cutout-img"
          />
          <div className="image-overlay-text">
            {isSignUp
              ? "Join the fragrance revolution."
              : "Welcome back! Great to see you again."}
          </div>
        </div>
      </div>
      <button className="close-modal" onClick={onClose}>✕</button>
    </div>,
    document.body
  );
}
