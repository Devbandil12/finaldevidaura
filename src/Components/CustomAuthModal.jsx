// src/components/CustomAuthModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import gsap from "gsap";
import "./CustomAuthModal.css"; // see CSS below

export default function CustomAuthModal({ open, onClose }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");

  const { signUp, setActive: activateSignUp } = useSignUp();
  const { signIn, setActive: activateSignIn } = useSignIn();

  // Refs for GSAP animation
  const containerRef = useRef();
  const fieldsRef    = useRef();
  const imageRef     = useRef();

  // Animate panel swap
  useEffect(() => {
    if (!open) return;
    const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "power2.inOut" } });

    // Slide the fields panel
    tl.to(fieldsRef.current, {
      x: isSignUp ? 0 : containerRef.current.clientWidth / 2,
    }, 0);

    // And opposite for the image
    tl.to(imageRef.current, {
      x: isSignUp ? 0 : -containerRef.current.clientWidth / 2,
    }, 0);

    return () => tl.kill();
  }, [isSignUp, open]);

  if (!open) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignUp) {
        // Email/Password sign-up
        const result = await signUp.create({ emailAddress: email, password });
        // then verify email, skip auto-login…
      } else {
        // Email/Password log-in
        const result = await signIn.create({ identifier: email, password });
        if (result.status === "complete") {
          await activateSignIn({ session: result.createdSessionId });
          onClose();
        }
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Something went wrong");
    }
  };

  const handleGoogle = async () => {
    try {
      if (isSignUp) {
        await signUp.create({ strategy: "oauth_google" });
      } else {
        await signIn.create({ strategy: "oauth_google" });
      }
      // Clerk will redirect you through Google flow
    } catch (err) {
      setError(err.errors?.[0]?.message || "Google auth failed");
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
          <button className="google-btn" onClick={handleGoogle}>
            {isSignUp ? "Sign up with Google" : "Sign in with Google"}
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
            <button type="submit" className="action-btn">
              {isSignUp ? "Sign up" : "Log in"}
            </button>
          </form>
          <p className="toggle-text">
            {isSignUp
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <span onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? "Log in" : "Sign up"}
            </span>
          </p>
        </div>

        {/* ==== IMAGE PANEL ==== */}
        <div className="auth-image" ref={imageRef}>
          {/* Use your cut-out image here */}
          <img src="/path/to/your-cutout.jpg" alt="Creative network" />
          <div className="image-overlay-text">
            {isSignUp
              ? "Join the world's largest network of designers..."
              : "Welcome back! Great to see you again."}
          </div>
        </div>
      </div>
      <button className="close-modal" onClick={onClose}>✕</button>
    </div>,
    document.body
  );
}
