import React, { useState, useRef, useEffect } from "react";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import MiniLoader from "./MiniLoader";
import "../style/CustomAuthModal.css";
import SignUpImage from "../assets/New folder/Adobe Express - file.png";
import SignInImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";

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

  const containerRef = useRef();
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
      tl.add(() => setIsSignUp((prev) => !prev), 0.3);
      tl.to(fieldsRef.current, { y: "0%" }, 0.5);
      tl.to(imageRef.current, { y: "0%" }, 0.5);
    } else {
      tl.to(fieldsRef.current, { x: isSignUp ? "100%" : "0%" }, 0);
      tl.to(imageRef.current, { x: isSignUp ? "-100%" : "0%" }, 0);
      tl.add(() => setIsSignUp((prev) => !prev), 0.3);
    }

    // Reset form state
    setOtpCode("");
    setError("");
    setOtpSent(false);
  };

  const handleSendOtp = async () => {
    if (!email) return;

    try {
      setSendingOtp(true);
      setError("");

      if (isSignUp) {
        await signUp.create({ emailAddress: email, firstName, lastName });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      } else {
        await signIn.create({ identifier: email, strategy: "email_code" });
      }

      setOtpSent(true);
    } catch (err) {
      setError(err.errors?.[0]?.message || "OTP error.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      if (!otpSent || !otpCode) {
        setError("Please send and enter the OTP.");
        setFormLoading(false);
        return;
      }

      if (isSignUp) {
        const result = await signUp.attemptEmailAddressVerification({ code: otpCode });
        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
          navigate("/");
        } else {
          throw new Error("OTP verification failed");
        }
      } else {
        const result = await signIn.attemptFirstFactor({ strategy: "email_code", code: otpCode });
        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          navigate("/");
        } else {
          throw new Error("Invalid code or session");
        }
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Verification failed.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="auth-modal-main-container">
      <div className="auth-modal-container" ref={containerRef}>
        <div className="auth-fields" ref={fieldsRef}>
          <h2>{isSignUp ? "Create account" : "Welcome back"}</h2>

          <form onSubmit={handleContinue} className="form-scroll-area">
            {isSignUp && (
              <div className="name-row">
                <label>
                  First Name
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </label>
                <label>
                  Last Name
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </label>
              </div>
            )}

            <label>
              Email Address
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <div className="otp-row">
              <label className="otp-label">
                OTP Code
                <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
              </label>
              <button type="button" onClick={handleSendOtp} disabled={sendingOtp}>
                {sendingOtp ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
              </button>
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" className="action-btn" disabled={formLoading}>
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
    </div>
  );
}
