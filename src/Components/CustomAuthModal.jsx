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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [awaitingOTP, setAwaitingOTP] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    } else {
      tl.to(fieldsRef.current, { x: isSignUp ? "100%" : "0%" }, 0);
      tl.to(imageRef.current, { x: isSignUp ? "-100%" : "0%" }, 0);
    }

    tl.add(() => {
      setIsSignUp((prev) => !prev);
      setEmail("");
      setOtpCode("");
      setFirstName("");
      setLastName("");
      setAwaitingOTP(false);
      setError("");
    }, 0.3);
  };

  const sendOTP = async () => {
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp.create({
          emailAddress: email,
          firstName,
          lastName,
        });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      } else {
        await signIn.create({
          identifier: email,
          strategy: "email_code",
        });
      }

      setAwaitingOTP(true);
    } catch (err) {
      setError(err.errors?.[0]?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp.attemptEmailAddressVerification({
          code: otpCode,
        });
        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
          navigate("/");
        } else {
          setError("Verification failed.");
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
          setError("Incorrect OTP.");
        }
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-main-container">
      <div className="auth-modal-container">
        <div className="auth-fields" ref={fieldsRef}>
          <h2>{isSignUp ? "Create Account" : "Welcome Back"}</h2>

          <form onSubmit={verifyOTP} className="form-scroll-area">
            {isSignUp && (
              <div className="name-row">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            )}

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="otp-row">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />
              <button
                type="button"
                onClick={sendOTP}
                className="send-otp-btn"
                disabled={loading || !email}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" className="action-btn" disabled={loading || !otpCode}>
              {loading ? <MiniLoader text="Verifying..." /> : "Verify & Continue"}
            </button>
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
