// src/pages/Checkout.jsx

import React, { useState, useEffect, useContext, useCallback, useMemo } from "react"; 
import { useNavigate, useSearchParams } from "react-router-dom"; 
import { useAuth } from "@clerk/clerk-react"; 
import { UserContext } from "../contexts/UserContext";
import AddressSelection from "./AddressSelection";
import OrderSummary from "./OrderSummary";
import PaymentDetails from "./PaymentDetails";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CreditCard, Check, ArrowLeft, Loader2, ChevronRight, ShieldCheck } from "lucide-react";
import { generateIdempotencyKey } from "../utils/idempotency";
import PhoneOtpModal from "../Components/PhoneOtpModal";
import usePhoneVerification from "../features/verification/hooks/usePhoneVerification";

const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, '');

// Luxury Easing
const luxuryEase = [0.25, 0.1, 0.25, 1];

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  

  const { userdetails } = useContext(UserContext);
  const { getToken } = useAuth(); 

  const stepParam = searchParams.get("step");
  const step = stepParam === "payment" ? 2 : 1;

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [breakdown, setBreakdown] = useState({ productTotal: 0, deliveryCharge: 0, discountAmount: 0, total: 0, originalTotal: 0, codAvailable: false, offerDiscount: 0, appliedOffers: [] });
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const [useWallet, setUseWallet] = useState(false);

  const { modal: otpModal, startVerification, verifyCode, resendCode, closeModal } = usePhoneVerification({
    onVerified: () => {
      window.toast?.success("Number verified! You can now place your order.");
    }
  });

  const finalBreakdown = useMemo(() => {
    const walletBalance = userdetails?.walletBalance || 0;
    const currentTotal = breakdown.total; 
    
    let walletUsed = 0;
    let finalPayable = currentTotal;

    if (useWallet && walletBalance > 0) {
      walletUsed = Math.min(currentTotal, walletBalance);
      finalPayable = currentTotal - walletUsed;
    }

    return {
      ...breakdown,
      total: finalPayable, 
      walletUsed: walletUsed, 
      originalTotalBeforeWallet: breakdown.total 
    };
  }, [breakdown, useWallet, userdetails]);


  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem("selectedItems") || "[]");
      if (items.length > 0) setSelectedItems(items);
      else { window.toast.error("Your cart is empty."); navigate("/cart"); }
      const coupon = localStorage.getItem("appliedCoupon");
      if (coupon) setAppliedCoupon(JSON.parse(coupon));
    } catch (error) { navigate("/cart"); }

    if (!stepParam) {
      setSearchParams({ step: "address" }, { replace: true });
    }
    
    if (step === 2 && !selectedAddress) {
       setSearchParams({ step: "address" }, { replace: true });
       window.toast.info("Please select a delivery address first.");
    }

    document.title = step === 1 ? "Secure Checkout | Delivery" : "Secure Checkout | Payment";
    window.scrollTo({ top: 0, behavior: 'smooth' });

  }, [navigate, stepParam, setSearchParams, step, selectedAddress]);

  // --- Logic: Price Breakdown (Secured & Updated Endpoint) ---
  useEffect(() => {
    const fetchBreakdown = async () => {
      if (selectedItems.length === 0 || !selectedAddress) {
        if (selectedItems.length > 0) setBreakdown(prev => ({ ...prev, deliveryCharge: 0, total: prev.productTotal - prev.offerDiscount - prev.discountAmount }));
        setLoadingPrices(false);
        return;
      }
      setLoadingPrices(true);
      try {
        const token = await getToken();
        
        // 1. Check Shiprocket Serviceability FIRST (so Redis has it cached for the Price Engine)
        let isServiceable = true;
        if (selectedAddress?.postalCode) {
            try {
              const svcRes = await fetch(`${BACKEND}/api/cart/check-serviceability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ pincode: selectedAddress.postalCode })
              });
              const svcData = await svcRes.json();
              if (svcData.success === false) {
                 window.toast.error("Delivery is not available at this pincode.");
                 isServiceable = false;
              }
            } catch(e) { console.error("Serviceability check failed:", e); }
        }

        // 2. Call the newly secured Price Preview Engine endpoint
        const res = await fetch(`${BACKEND}/api/cart/price-preview`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            cartItems: selectedItems.map(i => ({ variantId: i.variant.id, quantity: i.quantity, productId: i.product.id })),
            couponCode: appliedCoupon?.code || null,
            pincode: selectedAddress.postalCode,
            userId: userdetails?.id // Send user info for accurate history limits
          }),
        });
        const data = await res.json();
        
        if (data.success) {
            setBreakdown(data.breakdown);
        } else if (data.error) {
            // Surface the backend validation failure (e.g. usage limit reached)
            window.toast.error(data.message);
            setAppliedCoupon(null);
        }
      } catch (error) { console.error(error); } finally { setLoadingPrices(false); }
    };
    fetchBreakdown();
  }, [selectedItems, appliedCoupon, selectedAddress, getToken, userdetails?.id]);

  const refreshOrdersOnly = useCallback(() => {
    // Orders will be fetched freshly when navigating to My Orders or Confirmation
  }, []);

  const handleRazorpaySuccess = useCallback(async (paymentId) => {
    setIsSubmitting(true);
    try { 
      navigate(`/order-confirmation?orderId=${paymentId || transactionId || "ONLINE-PAYMENT"}`, { 
        replace: true 
      });
      refreshOrdersOnly();
    }
    catch (error) { 
        window.toast.error("Order processed, but navigation failed."); 
    }
    finally { setIsSubmitting(false); }
  }, [refreshOrdersOnly, navigate, transactionId]);

  // COD Success handler
  // 🟢 UPDATED: now token-aware. otpVerificationToken is null for the vast
  // majority of orders (the risk engine didn't flag them) and only set
  // after the customer clears the WhatsApp OTP modal below.
  const submitCodOrder = useCallback(async (otpVerificationToken = null) => {
    const freshIdempotencyKey = generateIdempotencyKey();
    try {
      const token = await getToken();

      const res = await fetch(`${BACKEND}/api/payments/createOrder`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "x-idempotency-key": freshIdempotencyKey 
        },
        body: JSON.stringify({
          phone: selectedAddress.phone,
          paymentMode: "cod",
          couponCode: appliedCoupon?.code || null,
          cartItems: selectedItems.map(i => ({ ...i, variantId: i.variant.id, quantity: i.quantity, productId: i.product.id })),
          userAddressId: selectedAddress.id,
          useWallet: useWallet,
          otpVerificationToken, // 🟢 NEW: COD WhatsApp OTP
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        if (res.status === 403 && data.code === "PHONE_VERIFICATION_REQUIRED") {
          startVerification(selectedAddress.phone, 'CHECKOUT');
          return; // modal is now open, user will retry via it
        }
        throw new Error(data.msg || "Order failed.");
      }
      
      navigate(`/order-confirmation?orderId=${data.orderId}`, { 
        replace: true 
      });

      window.toast.success("Order placed successfully!");
      refreshOrdersOnly();

    } catch (err) { 
      window.toast.error(err.message); 
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedItems, selectedAddress, appliedCoupon, refreshOrdersOnly, navigate, useWallet, getToken, startVerification]);

  const handlePlaceOrderCOD = useCallback(async () => {
    if (isSubmitting) return;
    if (!selectedAddress) return window.toast.error("Please select a delivery address.");
    setIsSubmitting(true);
    await submitCodOrder(null);
  }, [isSubmitting, selectedAddress, submitCodOrder]);

  const handleNext = () => {
    if (loadingPrices) return;
    if (step === 1 && !selectedAddress) return window.toast.error("Please select a delivery address.");
    if (step === 1 && selectedAddress && !selectedAddress.isVerified) {
      return window.toast.error("Please verify the phone number on this address to proceed.");
    }
    setSearchParams({ step: "payment" });
  };

  const handlePrev = () => {
    if (step === 1) navigate("/cart");
    else setSearchParams({ step: "address" });
  };

  const steps = [
    { name: "Address", icon: MapPin },
    { name: "Payment", icon: CreditCard },
    { name: "Confirm", icon: Check },
  ];

  return (
    <>
      <div className="min-h-screen bg-[var(--bg)] py-20 sm:py-24 px-4 sm:px-6 flex items-start justify-center">

        <div className="w-full max-w-8xl bg-[var(--surface)] rounded-[2rem] sm:rounded-[2.5rem] shadow-[var(--shadow-strong)] overflow-hidden border border-[var(--border)]">

          <div className="
            relative overflow-hidden transition-colors duration-300
            bg-[var(--surface)] text-[var(--text)] border-b border-[var(--border)]
            px-4 pb-10 pt-4 sm:px-12 sm:pb-12
          ">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--brand)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 md:hidden" />

            <div className="relative z-10 flex flex-col items-center">
              <div className={`
                  flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border transition-colors
                  bg-[var(--success)]/10 border-[var(--success)]/20
                `}>
                <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--success)]" />
                <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap text-[var(--success)]">
                  Secure Encrypted Checkout
                </span>
              </div>

              <div className="relative w-full max-w-4xl">
                <div className="absolute top-1/2 left-6 right-6 h-[1px] -translate-y-1/2 bg-[var(--border)]" />
                <div className="absolute top-1/2 left-6 right-6 h-[1px] flex -translate-y-1/2 pointer-events-none">
                  <motion.div
                    className="h-full bg-[var(--text)]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.8, ease: luxuryEase }}
                  />
                </div>

                <div className="flex justify-between w-full relative">
                  {steps.map((s, i) => {
                    const isActive = step === i + 1;
                    const isCompleted = step > i + 1;
                    return (
                      <div key={i} className="relative flex flex-col items-center w-12 group">
                        <motion.div
                          className={`
                            relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all duration-500 z-10
                            ${isActive || isCompleted
                              ? "bg-[var(--text)] text-[var(--bg)] border-transparent shadow-[var(--shadow)]"
                              : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]"
                            }
                          `}
                          animate={{ scale: isActive ? 1.15 : 1 }}
                        >
                          <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive || isCompleted ? "stroke-2" : "stroke-1"}`} />
                        </motion.div>
                        <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 w-32 text-center">
                          <span className={`
                            text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-300
                            ${isActive ? "text-[var(--text)]" : "text-[var(--sub)]"}
                          `}>
                            {s.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-transparent p-3 sm:p-2 lg:p-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">

              <motion.main
                layout
                className="lg:col-span-7 xl:col-span-8"
                transition={{ duration: 0.6, ease: luxuryEase }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: luxuryEase }}
                  >
                    {step === 1 && (
                      <AddressSelection userId={userdetails?.id} onSelect={setSelectedAddress} />
                    )}
                    {step === 2 && (
                      <PaymentDetails
                        selectedAddress={selectedAddress}
                        userdetails={userdetails}
                        selectedItems={selectedItems}
                        appliedCoupon={appliedCoupon}
                        breakdown={finalBreakdown} 
                        loadingPrices={loadingPrices}
                        isSubmitting={isSubmitting}
                        onRazorpaySuccess={handleRazorpaySuccess}
                        handlePlaceOrder={handlePlaceOrderCOD}
                        onPaymentVerified={setPaymentVerified}
                        paymentVerified={paymentVerified}
                        setTransactionId={setTransactionId}
                        useWallet={useWallet} 
                        setUseWallet={setUseWallet}
                        startVerification={startVerification}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="mt-12 flex items-center justify-between border-t border-slate-100 pt-5 px-1 sm:px-5"
                  >
                    <button
                      onClick={handlePrev}
                      disabled={isSubmitting}
                      className="group flex items-center gap-2 text-sm font-medium text-[var(--sub)] hover:text-[var(--text)] transition-colors px-6 py-3 rounded-xl hover:bg-[var(--surface-muted)]"                    >
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      <span>{step === 1 ? "Cart" : "Go Back"}</span>
                    </button>

                    {step === 1 && (
                      <motion.button
                        onClick={handleNext}
                        disabled={!selectedAddress || isSubmitting || loadingPrices}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 bg-[var(--brand)] text-[var(--brand-contrast)] px-8 sm:px-10 py-4 rounded-2xl text-sm font-bold shadow-[var(--shadow)] hover:bg-[var(--brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {loadingPrices && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span className="whitespace-nowrap">{loadingPrices ? "Calculating..." : "Payment"}</span>
                        {!loadingPrices && <ChevronRight className="w-4 h-4" />}
                      </motion.button>
                    )}
                  </motion.div>
              </motion.main>

              <AnimatePresence>
                <motion.aside
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, transition: { duration: 0.3 } }}
                    className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8"
                  >
                    <OrderSummary
                      selectedAddress={selectedAddress}
                      selectedItems={selectedItems}
                      appliedCoupon={appliedCoupon}
                      breakdown={finalBreakdown} 
                      loadingPrices={loadingPrices}
                    />

                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="font-medium">100% Secure Payment Processing</span>
                    </div>
                  </motion.aside>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <PhoneOtpModal
        open={otpModal.open}
        maskedPhone={otpModal.maskedPhone}
        channel={otpModal.channel}
        expiresInSeconds={otpModal.expiresInSeconds}
        onVerify={verifyCode}
        onResend={resendCode}
        onClose={closeModal}
      />
    </>
  );
}