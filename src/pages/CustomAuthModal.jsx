import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, Loader2 } from "lucide-react";
import { useSignIn, useSignUp } from "@clerk/clerk-react";

// --- Assets ---
import SignUpImage from "../assets/images/founder-img.jpg";
import SignInImage from "../assets/images/vigor.webp";

// Inline function component for the Google SVG icon
const GoogleIcon = (props) => (
  <svg viewBox="0 0 48  48" className={props.className}>
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.158,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,19.033-8.136,19.611-19.917V20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.09,3.513C12.015,17.485,12,17.747,12,18v8c0,0.253,0.015,0.515,0.396,0.871l-6.09,3.513C5.552,28.629,5.08,27.379,5.08,26V18C5.08,16.621,5.552,15.371,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192L31.842,32.22C30.438,33.518,28.271,34.218,26,34.218c-5.22,0-9.622-3.874-10.473-9h-11c2.206,6.969,9.15,12,19.473,12C36.464,44,24.004,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.19-4.303,5.55V28h-5.064c-0.291-1.39-0.537-2.885-0.72-4.43H24c-2.455,0-4.707-0.992-6.306-2.691l-6.09-3.513C11.536,10.158,17.402,4,24,4c4.707,0,9.12,1.815,12.437,4.869l-5.657,5.657C32.067,12.203,28.232,10.617,24,10.617C18.627,10.617,14.288,14.779,13.84,20H43.611z" />
  </svg>
);

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signUp, setActive: setSignUpActive } = useSignUp();
  const { signIn, setActive: setSignInActive } = useSignIn();
  const navigate = useNavigate();

  const otpRefs = useRef([]);
  const modalContentRef = useRef(null);


  const navigateAndClose = useCallback((path) => {
    navigate(path);
    if (onClose && typeof onClose === "function") {
      onClose();
    }
  }, [navigate, onClose]);

  // 🟢 PERMANENT FIX: Handle closing logic for both Modal and Route modes
  const handleClose = useCallback(() => {
    if (onClose && typeof onClose === "function") {
      // Mode 1: We are a modal (e.g., opened from Navbar)
      onClose();
    } else {
      // Mode 2: We are a full page (e.g., /login route)
      // "Closing" means going back to Home
      navigate("/");
    }
  }, [onClose, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleToggle = () => {
    setIsSignUp(prev => !prev);
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
    setIsGoogleLoading(false);
  };

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

      // 🟢 FIX 1: Capture the redirect URL *before* the timeout starts
      const redirectUrl = sessionStorage.getItem("post_login_redirect") || "/";

      if (isSignUp) {
        result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
          setVerified(true);
          window.toast.success("Account created successfully!");

          // 🟢 FIX 2: Clear storage immediately, but use the captured variable
          sessionStorage.removeItem("post_login_redirect");

          setTimeout(() => navigateAndClose(redirectUrl), 1200);
        }
      } else {
        result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          setVerified(true);
          window.toast.success("Welcome back!");

          // 🟢 FIX 3: Clear storage immediately, but use the captured variable
          sessionStorage.removeItem("post_login_redirect");

          setTimeout(() => navigateAndClose(redirectUrl), 1200);
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
    if (isGoogleLoading || sendingOtp || otpSent) return;
    setIsGoogleLoading(true);
    setError("");

    // This part is correct: Read URL before we leave the page
    const redirectUrl = sessionStorage.getItem("post_login_redirect") || "/";

    const redirectSettings = {
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: redirectUrl, // Clerk handles this redirect automatically
    };

    try {
      if (isSignUp) {
        await signUp.authenticateWithRedirect(redirectSettings);
      } else {
        await signIn.authenticateWithRedirect(redirectSettings);
      }
    } catch (err) {
      console.log("Primary Google attempt failed, attempting fallback logic...", err);
      try {
        if (isSignUp) {
          await signIn.authenticateWithRedirect(redirectSettings);
        } else {
          await signUp.authenticateWithRedirect(redirectSettings);
        }
      } catch (finalErr) {
        console.error("Google Auth Final Error:", finalErr);
        setError(finalErr.errors?.[0]?.message || "Google authentication failed.");
        setIsGoogleLoading(false);
      }
    }
  };

  // --- Animations ---
  const slideAnimationVariants = {
    initial: (isSignUp) => ({ x: isSignUp ? "100%" : "-100%", opacity: 0 }),
    animate: { x: "0%", opacity: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
    exit: (isSignUp) => ({ x: isSignUp ? "-100%" : "100%", opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }),
  };

  const modalScaleVariants = {
    initial: { scale: 0.1, y: 20, transition: { duration: 0 } },
    animate: { scale: 1, y: 0, transition: { duration: 0.6 } },
    exit: { scale: 1, y: 10, transition: { duration: 0.5 } }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) { handleClose(); } }}
    >
      <title>{isSignUp ? "Create Account" : "Log In"} | Devid Aura</title>
      <AnimatePresence>
        <motion.div
          key="auth-modal-content"
          variants={modalScaleVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          ref={modalContentRef}
          className="w-full max-w-4xl min-h-[650px] bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-50"
        >
          <button onClick={handleClose} className="absolute top-4 right-4 z-50 p-2 text-gray-500 hover:text-gray-900 transition-colors bg-white rounded-full shadow-lg">
            <X size={24} />
          </button>

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
              <div className={`w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12 ${isSignUp ? 'md:order-1' : 'md:order-2'}`}>
                <h2 className="text-3xl font-bold text-zinc-900 mb-6">{isSignUp ? "Create Account" : "Welcome Back"}</h2>

                <button
                  onClick={handleGoogle}
                  disabled={isGoogleLoading || sendingOtp || otpSent}
                  className={`flex items-center justify-center gap-3 w-full py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
                >
                  {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-600" /> : <><GoogleIcon className="w-5 h-5" /> Sign in with Google</>}
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
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={isGoogleLoading} className="peer w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-transparent" placeholder="First Name" required />
                        <label className="absolute left-4 -top-2 text-xs text-gray-500 bg-white px-1 transition-all pointer-events-none peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-indigo-600">First Name</label>
                      </div>
                      <div className="relative">
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} disabled={isGoogleLoading} className="peer w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-transparent" placeholder="Last Name" required />
                        <label className="absolute left-4 -top-2 text-xs text-gray-500 bg-white px-1 transition-all pointer-events-none peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-indigo-600">Last Name</label>
                      </div>
                    </div>
                  )}
                  <div className="relative mb-4">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isGoogleLoading} className="peer w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-transparent" placeholder="Email Address" required />
                    <label className="absolute left-4 -top-2 text-xs text-gray-500 bg-white px-1 transition-all pointer-events-none peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-indigo-600">Email Address</label>
                  </div>
                  {!otpSent ? (
                    <button type="submit" disabled={sendingOtp || isGoogleLoading} className="w-full bg-black text-white py-3 rounded-lg font-semibold text-sm hover:bg-zinc-800 transition-colors disabled:bg-gray-300">
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
                            disabled={verifying || verified || isGoogleLoading}
                            value={digit}
                            onChange={e => handleOtpChange(e, i)}
                            onKeyDown={e => handleKeyDown(e, i)}
                            className={`w-12 h-14 text-center text-2xl font-semibold border-2 rounded-lg transition-all duration-300 ${verified ? 'border-green-500 bg-green-50' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500'}`}
                          />
                        ))}
                      </div>
                      {verified ? (
                        <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                          <CheckCircle size={20} /> Verified! Redirecting...
                        </div>
                      ) : (
                        <button type="button" onClick={handleSendOtp} disabled={sendingOtp || cooldown > 0 || isGoogleLoading} className="text-sm text-indigo-600 hover:underline disabled:text-gray-400 disabled:no-underline">
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
      <style>{` .text-shadow { text-shadow: 0 1px 3px rgba(0,0,0,0.5); } `}</style>
    </div>
  );
}