import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import MiniLoader from "./MiniLoader";
import "../style/CustomAuthModal.css";
import SignUpImage from "../assets/New folder/Adobe Express - file.png";
import SignInImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function CustomAuthModal({ open, onClose }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
      setPassword("");
      setFirstName("");
      setLastName("");
      setUsername("");
      setError("");
    }
  }, [open]);

  const passwordChecks = [
    {
      label: "Minimum 8 characters",
      passed: password.length >= 8,
    },
    {
      label: "First letter capital",
      passed: /^[A-Z]/.test(password),
    },
    {
      label: "One special character",
      passed: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
    {
      label: "At least one number",
      passed: /\d/.test(password),
    },
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
          username,
          firstName,
          lastName,
        });
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

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  if (!open) return null;

  return createPortal(
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-container" ref={containerRef} onClick={(e) => e.stopPropagation()}>
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
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {isSignUp && (
              <>
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                <input type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </>
            )}
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span onClick={togglePasswordVisibility} className="eye-icon">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {isSignUp && (
              <ul className="password-checks">
                {passwordChecks.map((check, idx) => (
                  <li key={idx} className={check.passed ? "passed" : "failed"}>
                    {check.passed ? "✔" : "❌"} {check.label}
                  </li>
                ))}
              </ul>
            )}

            {!isSignUp && (
              <div className="forgot-password">
                <a href="/forgot-password">Forgot password?</a>
              </div>
            )}

            {error && <div className="error">{error}</div>}
            <button type="submit" className="action-btn" disabled={formLoading}>
              {formLoading ? <MiniLoader text="Processing..." /> : isSignUp ? "Sign up" : "Log in"}
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
