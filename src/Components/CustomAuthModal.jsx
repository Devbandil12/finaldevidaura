import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import MiniLoader from "./MiniLoader";
import "../style/CustomAuthModal.css";

export default function CustomAuthModal({ open, onClose }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signUp, setActive: activateSignUp } = useSignUp();
  const { signIn, setActive: activateSignIn } = useSignIn();
  const navigate = useNavigate();

  const containerRef = useRef();
  const fieldsRef = useRef();
  const imageRef = useRef();

  // Set initial positions
  useEffect(() => {
    if (!open) return;
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      gsap.set(imageRef.current, { y: isSignUp ? "0%" : "-100%" });
      gsap.set(fieldsRef.current, { y: isSignUp ? "0%" : "100%" });
    } else {
      gsap.set(fieldsRef.current, { x: isSignUp ? "0%" : "100%" });
      gsap.set(imageRef.current, { x: isSignUp ? "0%" : "-100%" });
    }
  }, [open]);

  // Animate transitions
  useEffect(() => {
    if (!open) return;
    const isMobile = window.innerWidth < 768;

    const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "power2.inOut" } });

    if (isMobile) {
      tl.to(imageRef.current, { y: isSignUp ? "0%" : "-100%" }, 0);
      tl.to(fieldsRef.current, { y: isSignUp ? "0%" : "100%" }, 0);
    } else {
      tl.to(fieldsRef.current, { x: isSignUp ? "0%" : "100%" }, 0);
      tl.to(imageRef.current, { x: isSignUp ? "0%" : "-100%" }, 0);
    }

    return () => tl.kill();
  }, [isSignUp, open]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);

    try {
      if (isSignUp) {
        await signUp.create({ emailAddress: email, password });
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
      setFormLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      if (isSignUp) {
        await signUp.authenticateWithRedirect({ strategy: "oauth_google" });
      } else {
        await signIn.authenticateWithRedirect({ strategy: "oauth_google" });
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Google auth failed");
      setGoogleLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div
        className="auth-modal-container"
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auth-fields" ref={fieldsRef}>
          <h2>{isSignUp ? "Create account" : "Welcome back"}</h2>

          <button className="google-btn" onClick={handleGoogle} disabled={googleLoading}>
            {googleLoading
              ? <MiniLoader text={isSignUp ? "Signing up..." : "Signing in..."} />
              : isSignUp
              ? "Sign up with Google"
              : "Sign in with Google"}
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
            <button type="submit" className="action-btn" disabled={formLoading}>
              {formLoading
                ? <MiniLoader text="Processing..." />
                : isSignUp
                ? "Sign up"
                : "Log in"}
            </button>
          </form>

          <p className="toggle-text">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <span onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? "Log in" : "Sign up"}
            </span>
          </p>
        </div>

        <div className="auth-image" ref={imageRef}>
          <img
            src="/auth-cutout.png"
            alt="Creative background"
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
