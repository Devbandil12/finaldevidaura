import React, { useState, useRef, useEffect } from "react";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import MiniLoader from "./MiniLoader";
import "../style/CustomAuthModal.css";
import SignUpImage from "../assets/New folder/Adobe Express - file.png";
import SignInImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";

export default function CustomAuthModal() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [awaitingOTP, setAwaitingOTP] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    setIsSignUp((prev) => !prev);
    setAwaitingOTP(false);
    setOtpCode("");
    setError("");
    setSendingOtp(false);
    setSubmitting(false);
  };

  const handleSendOTP = async () => {
    setError("");
    setSendingOtp(true);
    try {
      if (isSignUp) {
        await signUp.create({
          emailAddress: email,
          firstName,
          lastName,
        });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      } else {
        const res = await signIn.create({
          identifier: email,
          strategy: "email_code",
        });
        if (res.status === "needs_first_factor") {
          // continue
        }
      }
      setAwaitingOTP(true);
    } catch (err) {
      setError(err.errors?.[0]?.message || "Failed to send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmitOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isSignUp) {
        const result = await signUp.attemptEmailAddressVerification({
          code: otpCode,
        });
        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
          navigate("/");
        } else {
          throw new Error("Verification not complete.");
        }
      } else {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: otpCode,
        });
        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          navigate("/");
        } else {
          throw new Error("Verification not complete.");
        }
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "OTP verification failed.");
    } finally {
      setSubmitting(false);
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
            {isSignUp ? "Sign up with Google" : "Sign in with Google"}
          </button>

          <div className="divider"><span>OR</span></div>

          <form onSubmit={handleSubmitOTP} className="form-scroll-area">
            {isSignUp && (
              <div className="name-row">
                <div className="input-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="otp">OTP</label>
              <input
                id="otp"
                type="text"
                placeholder="Enter OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            </div>

            {error && <div className="error">{error}</div>}

            <div className="otp-button-group">
              <button
                type="button"
                className="action-btn"
                onClick={handleSendOTP}
                disabled={sendingOtp}
              >
                {sendingOtp
                  ? "Sending OTP..."
                  : awaitingOTP
                  ? "Resend OTP"
                  : "Send OTP"}
              </button>

              {awaitingOTP && (
                <button
                  type="submit"
                  className="action-btn"
                  disabled={submitting}
                >
                  {submitting
                    ? isSignUp
                      ? "Signing Up..."
                      : "Signing In..."
                    : isSignUp
                    ? "Sign Up"
                    : "Sign In"}
                </button>
              )}
            </div>
          </form>

          <p className="toggle-text">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <span onClick={handleToggle}>{isSignUp ? "Log in" : "Sign up"}</span>
          </p>
        </div>

        <div className="auth-image" ref={imageRef}>
          <img
            src={isSignUp ? SignUpImage : SignInImage}
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
    </div>
  );
}
