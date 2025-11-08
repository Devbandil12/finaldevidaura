// File: src/Components/CustomAuthModal.jsx 
import React, { useState, useRef, useEffect, useCallback } from "react"; 
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // Keep this import
import { CheckCircle, X } from "lucide-react";

import SignUpImage from "../assets/New folder/Adobe Express - file.png";
import SignInImage from "../assets/images/bottle-perfume.webp";
import GoogleIcon from "../assets/images/google.png";

export default function CustomAuthModal({ onClose }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { signUp, setActive: setSignUpActive } = useSignUp();
  const { signIn, setActive: setSignInActive } = useSignIn();
  const navigate = useNavigate();

  const otpRefs = useRef([]);
  const modalContentRef = useRef(null); 

  const handleToggle = () => {
    setIsSignUp(prev => !prev);
    // Reset all form fields
    setFirstName("");
    setLastName("");
    setEmail("");
    setOtp(Array(6).fill(""));
    setOtpSent(false);
    setError("");
    setSendingOtp(false);
    setVerifying(false);
    setVerified(false);
    setCooldown(0);
  };

  const navigateAndClose = useCallback((path) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
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
      setCooldown(30);
      window.toast.success("An OTP has been sent to your email.");
    } catch (err) {
      setError(err.errors?.[0]?.message || "Failed to send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpChange = (e, idx) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);

    if (value && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }

    if (newOtp.join("").length === 6) {
      verifyOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const verifyOtp = async (code) => {
    setVerifying(true);
    setError("");
    try {
      let result;
      if (isSignUp) {
        result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
          setVerified(true);
          window.toast.success("Account created successfully!");
          setTimeout(() => navigateAndClose(sessionStorage.getItem("post_login_redirect") || "/"), 1200);
          sessionStorage.removeItem("post_login_redirect");
        }
      } else {
        result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          setVerified(true);
          window.toast.success("Welcome back!");
          setTimeout(() => navigateAndClose(sessionStorage.getItem("post_login_redirect") || "/"), 1200);
          sessionStorage.removeItem("post_login_redirect");
        }
      }
    } catch (err) {
      const msg = err.errors?.[0]?.message;
      setError(msg?.includes("Too many requests") ? "Too many attempts. Please try again later." : (msg || "OTP verification failed."));
      setOtp(Array(6).fill(""));
      otpRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    const redirectUrl = sessionStorage.getItem("post_login_redirect") || "/";
    try {
      if (isSignUp) {
        await signUp.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: redirectUrl,
        });
      } else {
        await signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: redirectUrl,
        });
      }
      sessionStorage.removeItem("post_login_redirect");
    } catch (err) {
      setError(err.errors?.[0]?.message || "Google authentication failed.");
    }
  };

  // --- Animation Variants for inner Form/Image Panel slide (kept separate) ---
  const slideAnimationVariants = {
    initial: (isSignUp) => ({
      x: isSignUp ? "100%" : "-100%",
      opacity: 0,
    }),
    animate: {
      x: "0%",
      opacity: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
    exit: (isSignUp) => ({
      x: isSignUp ? "-100%" : "100%",
      opacity: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  // --- NEW: Animation Variants for Modal Scale/Fade ---
  const modalScaleVariants = {
    initial: { 
      scale: 0.1, 
      y: 20,
      transition: { duration: 0 } 
    },
    animate: { 
      scale: 1, 
      y: 0,
      transition: { duration: 0.6 } 
    },
    exit: { 
      scale: 1, 
      y: 10, 
      transition: { duration: 0.5 } 
    }
  };
  // ---------------------------------------------------


  return (
    // Backdrop Container
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => { 
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <title>{isSignUp ? "Create Account" : "Log In"} | Devid Aura</title>
      <meta name="description" content={isSignUp
        ? "Join the Devid Aura family. Create an account to manage your orders, wishlist, and enjoy a seamless shopping experience."
        : "Log in to your Devid Aura account to access your orders, wishlist, and continue your fragrance journey."}
      />

      {/* --- WRAP THE CONTENT WITH AnimatePresence and motion.div --- */}
      <AnimatePresence>
        {/* We use key={true} here because the backdrop is already conditional in Navbar.jsx */}
        <motion.div
            key="auth-modal-content" 
            variants={modalScaleVariants}
            initial="initial"
            animate="animate"
            exit="exit"

            // Keep the original styling classes here
            ref={modalContentRef}
            className="w-full max-w-4xl min-h-[650px] bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-50"
        >
            {/* === NEW: Close Button (place it inside the motion.div) === */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 text-gray-500 hover:text-gray-900 transition-colors bg-white rounded-full shadow-lg"
              aria-label="Close authentication modal"
            >
              <X size={24} />
            </button>
            {/* ======================= */}

            {/* Content that handles internal slide animation */}
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={isSignUp ? "signup" : "login"}
                custom={isSignUp}
                variants={slideAnimationVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full flex flex-col md:flex-row"
              >
                {/* Form Panel */}
                <div className={`w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12 ${isSignUp ? 'md:order-1' : 'md:order-2'}`}>
                  <h2 id="auth-modal-title" className="text-3xl font-bold text-zinc-900 mb-6">{isSignUp ? "Create Account" : "Welcome Back"}</h2>
                  <button
                    onClick={handleGoogle}
                    className="flex items-center justify-center gap-3 w-full py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <img src={GoogleIcon} alt="Google" className="w-5 h-5" />
                    {isSignUp ? "Sign up with Google" : "Sign in with Google"}
                  </button>
                  <div className="flex items-center my-6">
                    <div className="flex-grow h-px bg-gray-200"></div>
                    <span className="px-2 text-xs text-gray-400 font-medium">OR</span>
                    <div className="flex-grow h-px bg-gray-200"></div>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }}>
                    {isSignUp && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="relative">
                          <input id="fname" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="peer w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-transparent" placeholder="First Name" required />
                          <label htmlFor="fname" className="absolute left-4 -top-2 text-xs text-gray-500 bg-white px-1 transition-all pointer-events-none peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-indigo-600">First Name</label>
                        </div>
                        <div className="relative">
                          <input id="lname" type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="peer w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-transparent" placeholder="Last Name" required />
                          <label htmlFor="lname" className="absolute left-4 -top-2 text-xs text-gray-500 bg-white px-1 transition-all pointer-events-none peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-indigo-600">Last Name</label>
                        </div>
                      </div>
                    )}
                    <div className="relative mb-4">
                      <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="peer w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-transparent" placeholder="Email Address" required />
                      <label htmlFor="email" className="absolute left-4 -top-2 text-xs text-gray-500 bg-white px-1 transition-all pointer-events-none peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-indigo-600">Email Address</label>
                    </div>
                    {!otpSent ? (
                      <button type="submit" disabled={sendingOtp} className="w-full bg-black text-white py-3 rounded-lg font-semibold text-sm hover:bg-zinc-800 transition-colors disabled:bg-gray-300">
                        {sendingOtp ? "Sending..." : "Continue"}
                      </button>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">Enter the code sent to your email.</p>
                        <div className="flex justify-center gap-2 mb-4">
                          {otp.map((digit, i) => (
                            <input
                              key={i}
                              ref={el => (otpRefs.current[i] = el)}
                              type="tel"
                              maxLength={1}
                              value={digit}
                              onChange={e => handleOtpChange(e, i)}
                              onKeyDown={e => handleKeyDown(e, i)}
                              className={`w-12 h-14 text-center text-2xl font-semibold border-2 rounded-lg transition-all duration-300 ${verified ? 'border-green-500 bg-green-50' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500'}`}
                              disabled={verifying || verified}
                            />
                          ))}
                        </div>
                        {verified ? (
                          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                            <CheckCircle size={20} /> Verified! Redirecting...
                          </div>
                        ) : (
                          <button type="button" onClick={handleSendOtp} disabled={sendingOtp || cooldown > 0} className="text-sm text-indigo-600 hover:underline disabled:text-gray-400 disabled:no-underline">
                            {sendingOtp ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                          </button>
                        )}
                      </div>
                    )}
                  </form>
                  {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
                  <p className="text-center text-sm text-gray-600 mt-8">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                    <span onClick={handleToggle} className="font-semibold text-indigo-600 cursor-pointer hover:underline">
                      {isSignUp ? "Log In" : "Sign Up"}
                    </span>
                  </p>
                </div>

                {/* Image Panel */}
                <div className={`relative w-full md:w-1/2 h-64 md:h-full ${isSignUp ? 'md:order-2' : 'md:order-1'}`}>
                  <img src={isSignUp ? SignUpImage : SignInImage} alt="Authentication" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30"></div>
                  <div className="absolute bottom-0 left-0 p-8 md:p-12">
                    <h3 className="text-white text-2xl md:text-3xl font-semibold leading-tight max-w-sm text-shadow">
                      {isSignUp ? "Join the fragrance revolution." : "Welcome back! Great to see you again."}
                    </h3>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
        </motion.div>
      </AnimatePresence>
      {/* ---------------------------------------------------------------- */}
    </div>
  );
}