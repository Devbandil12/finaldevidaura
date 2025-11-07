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
import { MapPin, CreditCard, CheckCircle, ArrowLeft } from "lucide-react";

const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, '');

export default function Checkout() {
  const navigate = useNavigate();
  const { getCartitems } = useContext(CartContext); 
  const { getorders } = useContext(OrderContext); 
  const { userdetails } = useContext(UserContext);

  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  // 🟢 NEW: Updated the default state to include the new 'appliedOffers' array
  const [breakdown, setBreakdown] = useState({ productTotal: 0, deliveryCharge: 0, discountAmount: 0, total: 0, originalTotal: 0, codAvailable: false, offerDiscount: 0, appliedOffers: [] });
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem("selectedItems") || "[]");
      if (items.length > 0) {
        setSelectedItems(items);
      } else {
        window.toast.warn("Your cart is empty. Redirecting...");
        navigate("/cart");
        return;
      }
      const coupon = localStorage.getItem("appliedCoupon");
      if (coupon) setAppliedCoupon(JSON.parse(coupon));
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      window.toast.error("There was an issue loading your cart.");
      navigate("/cart");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchBreakdown = async () => {
      if (selectedItems.length === 0 || !selectedAddress) {
        // 🟢 Reset breakdown if conditions aren't met
        if (selectedItems.length > 0) {
            setBreakdown(prev => ({ ...prev, deliveryCharge: 0, total: prev.productTotal - prev.offerDiscount - prev.discountAmount }));
        }
        setLoadingPrices(false);
        return;
      }
      setLoadingPrices(true);
      try {
        const res = await fetch(`${BACKEND}/api/payments/breakdown`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartItems: selectedItems.map(i => ({ 
              variantId: i.variant.id, 
              quantity: i.quantity,
              productId: i.product.id
            })),
            couponCode: appliedCoupon?.code || null,
            pincode: selectedAddress.postalCode,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.msg || "Failed to fetch price details.");
        }
        const data = await res.json();
        if (data.success) {
          setBreakdown(data.breakdown);
        } else {
          throw new Error(data.msg || 'Price breakdown error.');
        }
      } catch (error) {
        console.error('Price breakdown error:', error);
        window.toast.error(`Could not load price details: ${error.message}`);
      } finally {
        setLoadingPrices(false);
      }
    };
    fetchBreakdown();
  }, [selectedItems, appliedCoupon, selectedAddress]); // This is correct

  const cleanupAfterOrder = useCallback(async () => {
    localStorage.removeItem("selectedItems");
    localStorage.removeItem("appliedCoupon");
    await getCartitems(); // Re-syncs the cart
    if (getorders) await getorders(); 
  }, [getorders, getCartitems]);

  const handleRazorpaySuccess = useCallback(async () => {
    // This is called by PaymentDetails component after Razorpay's *handler*
    setIsSubmitting(true);
    try {
      await cleanupAfterOrder();
      setStep(3);
    } catch (error) {
      console.error("Error after Razorpay success:", error);
      window.toast.error("Order processed, but failed to update your session.");
    } finally {
      setIsSubmitting(false);
    }
  }, [cleanupAfterOrder]);

  const handlePlaceOrderCOD = useCallback(async () => {
    if (isSubmitting) return;
    if (!selectedAddress) {
      window.toast.error("Please select a delivery address.");
      return;
    }
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
          // 🟢 Pass the full cart items
          cartItems: selectedItems.map(i => ({ 
            ...i, // Pass the full item so backend can get price, etc.
            variantId: i.variant.id, 
            quantity: i.quantity,
            productId: i.product.id
          })),
          userAddressId: selectedAddress.id,
          // 🟢 Pass the breakdown so the backend can VERIFY it
          breakdown: breakdown
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.msg || "Server error while placing order.");
      }
      await cleanupAfterOrder();
      window.toast.success("Order placed successfully!");
      setStep(3);
    } catch (err) {
      console.error(err);
      window.toast.error(`Could not place order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedItems, selectedAddress, userdetails, appliedCoupon, breakdown, cleanupAfterOrder, isSubmitting]); // 🟢 Add breakdown

  const handleNext = useCallback(() => {
    if (step === 1 && !selectedAddress) {
      window.toast.warn("Please select a delivery address.");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  }, [step, selectedAddress]);

  const handlePrev = useCallback(() => {
    if (step === 1) navigate("/cart");
    else setStep((prev) => Math.max(prev - 1, 1));
  }, [step, navigate]);

  const resetCheckout = useCallback(() => setStep(1), []);

  const steps = [
    { name: "Address", icon: MapPin },
    { name: "Payment", icon: CreditCard },
    { name: "Confirmation", icon: CheckCircle },
  ];
  
  const dynamicTitle = () => {
    switch (step) {
        case 1: return "Select Address | Checkout";
        case 2: return "Payment | Checkout";
        case 3: return "Order Confirmed!";
        default: return "Checkout";
    }
  };

  return (
    <>
        <title>{`${dynamicTitle()} | Devid Aura`}</title>
        <meta name="description" content="Complete your order securely. Select your address, choose a payment method, and confirm your purchase with Devid Aura." />

        <div className="min-h-screen bg-slate-50 pt-16 sm:pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
            <div className="relative">
                <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200" />
                <motion.div
                className="absolute top-5 left-0 h-0.5 bg-black"
                initial={{ width: '0%' }}
                animate={{ width: `${step > 1 ? ((step - 1) / (steps.length - 1)) * 100 : 0}%` }}
                transition={{ ease: "easeInOut", duration: 0.5 }}
                />
                <div className="relative flex items-center justify-between">
                {steps.map((s, index) => {
                    const status = step > index + 1 ? "completed" : step === index + 1 ? "active" : "upcoming";
                    return (
                    <div key={s.name} className="flex flex-col items-center gap-2">
                        <motion.div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${status === 'completed' ? 'bg-black border-black' :
                            status === 'active' ? 'bg-white border-black' : 'bg-white border-slate-300'
                            }`}
                        animate={{ scale: status === 'active' ? 1.1 : 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                        <s.icon className={`w-5 h-5 ${status === 'completed' ? 'text-white' :
                            status === 'active' ? 'text-black' : 'text-slate-400'
                            }`} />
                        </motion.div>
                        <p className={`text-xs sm:text-sm font-semibold transition-colors duration-300 ${status === 'active' || status === 'completed' ? 'text-black' : 'text-slate-400'
                        }`}>
                        {s.name}
                        </p>
                    </div>
                    );
                })}
                </div>
            </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
            <main className="lg:col-span-2">
                <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ ease: "easeInOut", duration: 0.4 }}
                >
                    {step === 1 && <AddressSelection userId={userdetails?.id} onSelect={setSelectedAddress} />}
                    {step === 2 && (
                    <PaymentDetails
                        selectedAddress={selectedAddress} userdetails={userdetails} selectedItems={selectedItems}
                        appliedCoupon={appliedCoupon} breakdown={breakdown} loadingPrices={loadingPrices}
                        isSubmitting={isSubmitting} onRazorpaySuccess={handleRazorpaySuccess} handlePlaceOrder={handlePlaceOrderCOD}
                        onPaymentVerified={setPaymentVerified} paymentVerified={paymentVerified} setTransactionId={setTransactionId}
                    />
                    )}
                    {step === 3 && <Confirmation resetCheckout={resetCheckout} transactionId={transactionId} />}
                </motion.div>
                </AnimatePresence>

                {step < 3 && (
                <div className="mt-6 flex items-center justify-between">
                    <motion.button
                    onClick={handlePrev} disabled={isSubmitting}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-black transition-colors"
                    >
                    <ArrowLeft className="w-4 h-4" />
                    {step === 1 ? "Back to Cart" : "Back"}
                    </motion.button>
                    {step === 1 && (
                    <motion.button
                        onClick={handleNext} disabled={!selectedAddress || isSubmitting}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 bg-black text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        Proceed to Payment
                    </motion.button>
                    )}
                </div>
                )}
            </main>

            <aside className="lg:col-span-1 mt-8 lg:mt-0">
                <OrderSummary
                selectedAddress={selectedAddress} selectedItems={selectedItems} appliedCoupon={appliedCoupon}
                breakdown={breakdown} loadingPrices={loadingPrices}
                />
            </aside>
            </div>
        </div>
        </div>
    </>
  );
}