// src/components/CustomAuthPage.jsx

import React, { useState, useRef, useEffect } from "react";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import MiniLoader from "./MiniLoader";
import "../style/CustomAuthModal.css";
import SignUpImage from "../assets/New folder/Adobe Express - file.png";
import SignInImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";
import GoogleIcon from "../assets/images/google.png";



export default function CustomAuthPage() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const { signUp, setActive: setSignUpActive } = useSignUp();
  const { signIn, setActive: setSignInActive } = useSignIn();
  const navigate = useNavigate();

  const fieldsRef = useRef();
  const imageRef = useRef();

  const isMobile = () => window.innerWidth <= 768;

  useEffect(() => {
    if (isMobile()) {
      gsap.set(fieldsRef.current, { y: "0%" });
      gsap.set(imageRef.current, { y: "0%" });
    } else {
      gsap.set(fieldsRef.current, { x: isSignUp ? "0%" : "100%" });
      gsap.set(imageRef.current, { x: isSignUp ? "0%" : "-100%" });
    }
  }, [isSignUp]);

  const handleToggle = () => {
    const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "power2.inOut" } });
    if (isMobile()) {
      tl.to(imageRef.current, { y: "-130%" }, 0);
      tl.to(fieldsRef.current, { y: "130%" }, 0);
      tl.add(() => setIsSignUp(prev => !prev), 0.3);
      tl.to(fieldsRef.current, { y: "0%" }, 0.5);
      tl.to(imageRef.current, { y: "0%" }, 0.5);
    } else {
      tl.to(fieldsRef.current, { x: isSignUp ? "100%" : "0%" }, 0);
      tl.to(imageRef.current, { x: isSignUp ? "-100%" : "0%" }, 0);
      tl.add(() => setIsSignUp(prev => !prev), 0.3);
    }
    setOtpCode("");
    setOtpSent(false);
    setError("");
    setSendingOtp(false);
    setFormLoading(false);
  };

  const handleSendOtp = async () => {
    if (!email) return;
    setError("");
    setSendingOtp(true);
    try {
      if (isSignUp) {
        await signUp.create({ emailAddress: email, firstName, lastName });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      } else {
        await signIn.create({ identifier: email, strategy: "email_code" });
      }
      setOtpSent(true);
    } catch (err) {
      setError(err.errors?.[0]?.message || "Failed to send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    setError("");
    if (!otpSent) {
      setError("Please send OTP first.");
      return;
    }
    if (!otpCode) {
      setError("Please enter the OTP.");
      return;
    }
    setFormLoading(true);
    try {
      if (isSignUp) {
        const result = await signUp.attemptEmailAddressVerification({ code: otpCode });
        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
          navigate("/");
        } else {
          throw new Error("Verification incomplete.");
        }
      } else {
        const result = await signIn.attemptFirstFactor({ strategy: "email_code", code: otpCode });
        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          navigate("/");
        } else {
          throw new Error("Verification incomplete.");
        }
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "OTP verification failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      const strategy = "oauth_google";
      const action = isSignUp ? signUp : signIn;
      await action.authenticateWithRedirect({ strategy });
    } catch (err) {
      setError(err.errors?.[0]?.message || "Google auth failed");
    }
  };

  return (
    <div className="auth-modal-main-container">
      <div className="auth-modal-container">
        <div className="auth-fields" ref={fieldsRef}>
          <h2>{isSignUp ? "Create Account" : "Welcome Back"}</h2>

         <button className="google-btn" onClick={handleGoogle}>
  <img src={GoogleIcon} alt="Google" className="google-icon" />
  {isSignUp ? "Sign up with Google" : "Sign in with Google"}
</button>


          <div className="divider"><span>OR</span></div>

          <form onSubmit={handleContinue}>
            {isSignUp && (
              <div className="name-row">
                <div className="floating-group">
                  <input
                    id="firstName"
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                  />
                  <label htmlFor="firstName">First Name</label>
                </div>
                <div className="floating-group">
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                  />
                  <label htmlFor="lastName">Last Name</label>
                </div>
              </div>
            )}

            <div className="floating-group">
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <label htmlFor="email">Email Address</label>
            </div>

            <div className="otp-row">
              <div className="floating-group" style={{ flex: 1 }}>
                <input
                  id="otp"
                  type="text"
                  placeholder="OTP"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                />
                <label htmlFor="otp">OTP Code</label>
              </div>
              <button
                type="button"
                className="send-otp-btn"
                onClick={handleSendOtp}
                disabled={sendingOtp}
              >
                {sendingOtp
                  ? "Sending..."
                  : otpSent
                  ? "Resend OTP"
                  : "Send OTP"}
              </button>
            </div>

            {error && <div className="error">{error}</div>}

            <button
              type="submit"
              className="action-btn"
              disabled={formLoading}
            >
              {formLoading
                ? isSignUp
                  ? "Signing Up..."
                  : "Signing In..."
                : isSignUp
                ? "Sign Up"
                : "Sign In"}
            </button>
          </form>

          <p className="toggle-text">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <span onClick={handleToggle}>
              {isSignUp ? "Log in" : "Sign up"}
            </span>
          </p>
        </div>

        <div className="auth-image" ref={imageRef}>
          <img
            src={isSignUp ? SignUpImage : SignInImage}
            alt="Auth Visual"
            className="cutout-img"
          />
          <div className="image-overlay-text">
            {isSignUp
              ? "Join the fragrance revolution."
              : "Welcome back! Great to see you again."}
          </div>
        </div>
      </div>
    </div>
  );
}
