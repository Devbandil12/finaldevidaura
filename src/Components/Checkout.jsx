import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext";
import { OrderContext } from "../contexts/OrderContext";
import AddressSelection from "./AddressSelection";
import OrderSummary from "./OrderSummary";
import PaymentDetails from "./PaymentDetails";
import Confirmation from "./Confirmation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CreditCard, Check, ArrowLeft, Loader2, ChevronRight, ShieldCheck, Lock } from "lucide-react";

const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, '');

// 🟢 Luxury Easing
const luxuryEase = [0.25, 0.1, 0.25, 1];

export default function Checkout() {
  const navigate = useNavigate();
  const { getCartitems } = useContext(CartContext);
  const { getorders } = useContext(OrderContext);
  const { userdetails } = useContext(UserContext);

  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [breakdown, setBreakdown] = useState({ productTotal: 0, deliveryCharge: 0, discountAmount: 0, total: 0, originalTotal: 0, codAvailable: false, offerDiscount: 0, appliedOffers: [] });
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // --- Logic (Unchanged) ---
  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem("selectedItems") || "[]");
      if (items.length > 0) setSelectedItems(items);
      else { window.toast.warn("Your cart is empty."); navigate("/cart"); }
      const coupon = localStorage.getItem("appliedCoupon");
      if (coupon) setAppliedCoupon(JSON.parse(coupon));
    } catch (error) { navigate("/cart"); }
  }, [navigate]);

  useEffect(() => {
    const fetchBreakdown = async () => {
      if (selectedItems.length === 0 || !selectedAddress) {
        if (selectedItems.length > 0) setBreakdown(prev => ({ ...prev, deliveryCharge: 0, total: prev.productTotal - prev.offerDiscount - prev.discountAmount }));
        setLoadingPrices(false);
        return;
      }
      setLoadingPrices(true);
      try {
        const res = await fetch(`${BACKEND}/api/payments/breakdown`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartItems: selectedItems.map(i => ({ variantId: i.variant.id, quantity: i.quantity, productId: i.product.id })),
            couponCode: appliedCoupon?.code || null,
            pincode: selectedAddress.postalCode,
          }),
        });
        const data = await res.json();
        if (data.success) setBreakdown(data.breakdown);
      } catch (error) { console.error(error); } finally { setLoadingPrices(false); }
    };
    fetchBreakdown();
  }, [selectedItems, appliedCoupon, selectedAddress]);

  const cleanupAfterOrder = useCallback(async () => {
    localStorage.removeItem("selectedItems");
    localStorage.removeItem("appliedCoupon");
    await getCartitems();
    if (getorders) await getorders();
  }, [getorders, getCartitems]);

  const handleRazorpaySuccess = useCallback(async () => {
    setIsSubmitting(true);
    try { await cleanupAfterOrder(); setStep(3); }
    catch (error) { window.toast.error("Order processed, but session update failed."); }
    finally { setIsSubmitting(false); }
  }, [cleanupAfterOrder]);

  const handlePlaceOrderCOD = useCallback(async () => {
    if (isSubmitting) return;
    if (!selectedAddress) return window.toast.error("Please select a delivery address.");
    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND}/api/payments/createOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: { id: userdetails.id, fullName: userdetails.name },
          phone: selectedAddress.phone,
          paymentMode: "cod",
          couponCode: appliedCoupon?.code || null,
          cartItems: selectedItems.map(i => ({ ...i, variantId: i.variant.id, quantity: i.quantity, productId: i.product.id })),
          userAddressId: selectedAddress.id,
          breakdown: breakdown
        }),
      });
      if (!res.ok) throw new Error("Order failed.");
      await cleanupAfterOrder();
      window.toast.success("Order placed successfully!");
      setStep(3);
    } catch (err) { window.toast.error(err.message); } finally { setIsSubmitting(false); }
  }, [selectedItems, selectedAddress, userdetails, appliedCoupon, breakdown, cleanupAfterOrder, isSubmitting]);

  const handleNext = () => {
    if (loadingPrices) return;
    if (step === 1 && !selectedAddress) return window.toast.warn("Please select a delivery address.");
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    if (step === 1) navigate("/cart");
    else setStep(prev => Math.max(prev - 1, 1));
  };
  const resetCheckout = () => setStep(1);

  const steps = [
    { name: "Address", icon: MapPin },
    { name: "Payment", icon: CreditCard },
    { name: "Confirm", icon: Check },
  ];

  return (
    <>
      {/* Reduced padding top for mobile: py-20 */}
      <div className="min-h-screen bg-white font-sans py-20 sm:py-24 px-4 sm:px-6 flex items-start justify-center">

        <div className="w-full max-w-8xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm overflow-hidden border border-white/50">

          {/* Header padding reduced */}
          <div className="bg-black text-white px-4 pb-10 pt-4 sm:px-12 sm:pb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-6 opacity-80 bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
                <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-white whitespace-nowrap">Secure Encrypted Checkout</span>
              </div>
              
              <div className="relative w-full max-w-6xl">
                <div className="absolute top-1/2 left-6 right-6 h-[1px] bg-white/20 -translate-y-1/2" />

                <div className="absolute top-1/2 left-6 right-6 h-[1px] flex -translate-y-1/2 pointer-events-none">
                  <motion.div
                    className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
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
                          className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all duration-500 z-10 ${isActive || isCompleted
                              ? "bg-white text-black border-white shadow-lg shadow-white/20"
                              : "bg-black text-slate-500 border-slate-700"
                            }`}
                          animate={{ scale: isActive ? 1.15 : 1 }}
                        >
                          <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive || isCompleted ? "stroke-2" : "stroke-1"}`} />
                        </motion.div>

                        <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 w-24 sm:w-32 text-center">
                          <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${isActive ? "text-white" : "text-slate-600"}`}>
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

          <div className="bg-white p-3 sm:p-2 lg:p-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">

              <motion.main
                layout
                className={`${step === 3 ? "lg:col-span-12 max-w-3xl mx-auto w-full" : "lg:col-span-7 xl:col-span-8"}`}
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
                        breakdown={breakdown}
                        loadingPrices={loadingPrices}
                        isSubmitting={isSubmitting}
                        onRazorpaySuccess={handleRazorpaySuccess}
                        handlePlaceOrder={handlePlaceOrderCOD}
                        onPaymentVerified={setPaymentVerified}
                        paymentVerified={paymentVerified}
                        setTransactionId={setTransactionId}
                      />
                    )}
                    {step === 3 && (
                      <Confirmation resetCheckout={resetCheckout} transactionId={transactionId} />
                    )}
                  </motion.div>
                </AnimatePresence>

                {step < 3 && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="mt-12 flex items-center justify-between border-t border-slate-100 pt-5 px-1 sm:px-5"
                  >
                    <button
                      onClick={handlePrev}
                      disabled={isSubmitting}
                      className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-black transition-colors px-6 py-3 rounded-xl hover:bg-slate-100"                                    >
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      <span>{step === 1 ? "Cart" : "Go Back"}</span>
                    </button>

                    {step === 1 && (
                      <motion.button
                        onClick={handleNext}
                        disabled={!selectedAddress || isSubmitting || loadingPrices}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 bg-black text-white px-8 sm:px-10 py-4 rounded-2xl text-sm font-bold shadow-sm shadow-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {loadingPrices && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span className="whitespace-nowrap">{loadingPrices ? "Calculating..." : "Payment"}</span>
                        {!loadingPrices && <ChevronRight className="w-4 h-4" />}
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </motion.main>

              <AnimatePresence>
                {step < 3 && (
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
                      breakdown={breakdown}
                      loadingPrices={loadingPrices}
                    />

                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="font-medium">100% Secure Payment Processing</span>
                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}