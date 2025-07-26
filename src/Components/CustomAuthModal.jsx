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

  const formRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!open || !formRef.current) return;

    const isMobile = window.innerWidth < 768;
    const tl = gsap.timeline();

    if (isSignUp) {
      tl.fromTo(
        formRef.current,
        isMobile ? { y: "100%", opacity: 0 } : { x: "100%", opacity: 0 },
        { x: 0, y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }
      );
    } else {
      tl.fromTo(
        formRef.current,
        isMobile ? { y: "-100%", opacity: 0 } : { x: "-100%", opacity: 0 },
        { x: 0, y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }
      );
    }

    return () => tl.kill();
  }, [isSignUp, open]);

  if (!open) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);

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

  return createPortal(
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div
        className="auth-modal-container"
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auth-image">
          <img
            src="/auth-cutout.png"
            alt="Auth Art"
          />
          <div className="image-overlay-text">
            {isSignUp
              ? "Join the fragrance revolution."
              : "Welcome back! Great to see you again."}
          </div>
        </div>

        <div className="auth-fields" ref={formRef}>
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
            <span onClick={() => setIsSignUp(prev => !prev)}>
              {isSignUp ? "Log in" : "Sign up"}
            </span>
          </p>
        </div>
      </div>
      <button className="close-modal" onClick={onClose}>✕</button>
    </div>,
    document.body
  );
}
