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
          firstName,
          lastName,
        });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setAwaitingOTP(true);
      } else {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: otpCode,
        });
        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          navigate("/");
        } else {
          setError("Invalid code or session issue.");
        }
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Something went wrong.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setError("");
    setFormLoading(true);
    try {
      const res = await signIn.create({
        identifier: email,
        strategy: "email_code",
      });
      if (res.status === "needs_first_factor") {
        setAwaitingOTP(true);
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Failed to send OTP.");
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

  return (
    <div className="auth-modal-main-container">
      <div className="auth-modal-container" ref={containerRef}>
        <div className="auth-fields" ref={fieldsRef}>
          <h2>{isSignUp ? "Create account" : "Welcome back"}</h2>

          <button className="google-btn" onClick={handleGoogle} disabled={googleLoading}>
            {googleLoading ? <MiniLoader text="Processing..." /> : isSignUp ? "Sign up with Google" : "Sign in with Google"}
          </button>

          <div className="divider"><span>OR</span></div>

          <form onSubmit={handleAuth} className="form-scroll-area">
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
                placeholder="Email"
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
                disabled={formLoading}
              >
                {formLoading && !awaitingOTP ? <MiniLoader text="Sending..." /> : "Send OTP"}
              </button>

              <button type="submit" className="action-btn" disabled={formLoading}>
                {formLoading ? <MiniLoader text="Signing..." /> : "Continue"}
              </button>
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
            {isSignUp ? "Join the fragrance revolution." : "Welcome back! Great to see you again."}
          </div>
        </div>
      </div>
    </div>
  );
}
