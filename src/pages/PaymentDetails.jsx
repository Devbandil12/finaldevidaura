import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { CreditCard, Truck, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

export default function PaymentDetails({
    onRazorpaySuccess,
    handlePlaceOrder,
    breakdown,
    selectedAddress,
    userdetails,
    selectedItems,
    appliedCoupon,
    loadingPrices,
    isSubmitting,
    onPaymentVerified,
    paymentVerified,
    setTransactionId,
}) {
    const [paymentMethod, setPaymentMethod] = useState("Razorpay");
    const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
    const { user } = useUser();

    useEffect(() => {
        if (paymentMethod === "Cash on Delivery") {
            onPaymentVerified(false);
        }
    }, [paymentMethod, onPaymentVerified]);

    useEffect(() => {
        if (!breakdown.codAvailable && paymentMethod === "Cash on Delivery") {
            setPaymentMethod("Razorpay");
            window.toast.info("Cash on Delivery is not available for this address. Switched to online payment.");
        }
    }, [breakdown.codAvailable, paymentMethod]);


    const handleRazorpayPayment = async () => {
        try {
            const cartItemsPayload = selectedItems.map(item => ({
                variant: { id: item.variant.id },
                product: { id: item.product.id },
                quantity: item.quantity
            }));

            const orderResponse = await fetch(`${BACKEND}/api/payments/createOrder`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user: { id: userdetails.id, fullName: userdetails.name, email: userdetails.email },
                    phone: selectedAddress.phone,
                    couponCode: appliedCoupon?.code,
                    paymentMode: "Razorpay",
                    cartItems: cartItemsPayload,
                    userAddressId: selectedAddress.id,
                }),
            });

            const orderData = await orderResponse.json();

            // 🟢 PRE-CHECK: Stock Unavailable? Stop here.
            // This prevents opening the Razorpay window if stock is 0.
            if (!orderResponse.ok) {
                throw new Error(orderData.msg || "Could not create order.");
            }

            if (!orderData.razorpayOrderId) throw new Error("Missing Razorpay order ID.");

            const options = {
                key: orderData.keyId,
                amount: breakdown.total * 100,
                currency: "INR",
                name: "Devid Aura",
                description: "Order Payment",
                order_id: orderData.razorpayOrderId,
                prefill: {
                    name: userdetails?.name || "",
                    email: userdetails?.email || "",
                    contact: selectedAddress?.phone || "",
                },
                handler: async function (response) {
                    setIsVerifyingPayment(true);

                    try {
                        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;

                        const verifyRes = await fetch(`${BACKEND}/api/payments/verify-payment`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id,
                                razorpay_payment_id,
                                razorpay_signature,
                                orderId: orderData.orderId,
                                userAddressId: selectedAddress.id,
                                user: { id: userdetails.id, fullName: userdetails.name },
                                phone: selectedAddress.phone,
                                cartItems: cartItemsPayload,
                                couponCode: appliedCoupon?.code,
                            }),
                        });

                        const verifyData = await verifyRes.json();

                        // 🟢 CHECK FOR SUCCESS (Or Race Condition Error)
                        if (verifyData.success) {
                            setTransactionId(razorpay_payment_id);
                            onPaymentVerified(true);
                            window.toast.success("Payment successful!");
                            onRazorpaySuccess(razorpay_payment_id);
                        } else {
                            setIsVerifyingPayment(false);
                            // Show the specific error (e.g., "Item went out of stock... Refund initiated")
                            window.toast.error(verifyData.error || "Payment verification failed.");
                        }
                    } catch (error) {
                        console.error("Verification error", error);
                        setIsVerifyingPayment(false);
                        window.toast.error("Payment verification failed due to network error.");
                    }
                },
                modal: {
                    ondismiss: function () {
                        window.toast.info("Payment was cancelled.");
                    },
                },
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Payment error:", err);
            // This catches the Pre-Check stock error and shows it to the user.
            window.toast.error(err.message);
        }
    };

    const isBusy = isSubmitting || loadingPrices || isVerifyingPayment;

    return (
        <div className="relative">

            <AnimatePresence>
                {isVerifyingPayment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center text-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, rotate: 360 }}
                            transition={{
                                scale: { duration: 0.3 },
                                opacity: { duration: 0.3 },
                                rotate: { repeat: Infinity, duration: 1.5, ease: "linear" }
                            }}
                            className="bg-white p-4 rounded-full shadow-xl mb-5"
                        >
                            <Loader2 className="w-8 h-8 text-black" />
                        </motion.div>
                        <h3 className="text-xl font-bold text-white tracking-wide">Processing Payment</h3>
                        <div className="flex items-center gap-2 mt-3 px-4 py-1.5 bg-white/10 rounded-full border border-white/20">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-medium text-slate-200">Secure Verification in Progress</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-6 absolute bottom-6">Please do not close this window.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Responsive padding: p-4 sm:p-8 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-8 space-y-6">
                <h3 className="flex items-center gap-3 text-lg font-bold text-slate-800">
                    <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-700">
                        <CreditCard className="w-4 h-4" />
                    </div>
                    Payment Method
                </h3>

                <div className="flex flex-col gap-4">
                    {/* Razorpay Option */}
                    <label
                        className={`group relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-300 border ${paymentMethod === "Razorpay"
                                ? "bg-slate-50 border-slate-800 shadow-sm"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                            } ${isBusy ? "opacity-50 pointer-events-none" : ""}`}
                    >
                        <div className={`w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center transition-colors duration-300 ${paymentMethod === 'Razorpay' ? 'border-black' : 'border-slate-300 group-hover:border-slate-400'}`}>
                            {paymentMethod === "Razorpay" && (
                                <motion.div layoutId="radio-dot" className="w-2.5 h-2.5 rounded-full bg-black" />
                            )}
                        </div>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="Razorpay"
                            checked={paymentMethod === "Razorpay"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            disabled={isBusy}
                            className="hidden"
                        />
                        {/* min-w-0 for text truncation */}
                        <div className="flex-1 min-w-0">
                            <span className={`block font-semibold transition-colors ${paymentMethod === 'Razorpay' ? 'text-black' : 'text-slate-700'}`}>Razorpay Secure</span>
                            <span className="text-xs text-slate-500 mt-0.5 block truncate">UPI, Cards, NetBanking, Wallets</span>
                        </div>
                        {paymentMethod === "Razorpay" && <ShieldCheck className="w-5 h-5 text-emerald-500 opacity-80 flex-shrink-0" />}
                    </label>

                    {/* COD Option */}
                    <label
                        className={`group relative flex flex-col items-start p-4 sm:p-5 rounded-2xl transition-all duration-300 border ${paymentMethod === "Cash on Delivery" && breakdown.codAvailable
                                ? "bg-slate-50 border-slate-800 shadow-sm"
                                : "bg-white border-slate-200"
                            } ${!breakdown.codAvailable
                                ? "bg-slate-50/50 border-slate-100 cursor-not-allowed"
                                : "cursor-pointer hover:border-slate-300 hover:shadow-sm"
                            } ${isBusy ? "opacity-50 pointer-events-none" : ""}`}
                    >
                        <div className="flex items-center w-full gap-3 sm:gap-4">
                            <div className={`w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center transition-colors duration-300 ${!breakdown.codAvailable ? 'border-slate-200 bg-slate-100' :
                                    paymentMethod === 'Cash on Delivery' ? 'border-black' : 'border-slate-300 group-hover:border-slate-400'
                                }`}>
                                {paymentMethod === "Cash on Delivery" && breakdown.codAvailable && (
                                    <motion.div layoutId="radio-dot" className="w-2.5 h-2.5 rounded-full bg-black" />
                                )}
                            </div>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="Cash on Delivery"
                                checked={paymentMethod === "Cash on Delivery"}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                disabled={!breakdown.codAvailable || isBusy}
                                className="hidden"
                            />
                            {/* min-w-0 for text truncation */}
                            <div className="flex-1 min-w-0">
                                <span className={`block font-semibold transition-colors ${!breakdown.codAvailable ? 'text-slate-400' : paymentMethod === 'Cash on Delivery' ? 'text-black' : 'text-slate-700'}`}>
                                    Cash on Delivery
                                </span>
                                <span className={`text-xs mt-0.5 block truncate ${!breakdown.codAvailable ? 'text-slate-400' : 'text-slate-500'}`}>Pay with cash when order arrives</span>
                            </div>
                            <Truck className={`w-5 h-5 flex-shrink-0 transition-colors ${!breakdown.codAvailable ? 'text-slate-300' : 'text-slate-400'}`} />
                        </div>
                        {!breakdown.codAvailable && (
                            <div className="mt-3 ml-8 sm:ml-9 text-xs font-medium text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 inline-block">
                                Not available for this pincode.
                            </div>
                        )}
                    </label>
                </div>

                <div className="pt-4">
                    {paymentMethod === "Razorpay" && (
                        <motion.button
                            onClick={handleRazorpayPayment}
                            disabled={isBusy}
                            whileHover={!isBusy ? { scale: 1.01 } : {}}
                            whileTap={!isBusy ? { scale: 0.98 } : {}}
                            className="w-full py-4 rounded-xl bg-black text-white font-bold text-sm shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {isVerifyingPayment ? "Processing..." : isSubmitting ? "Processing..." : loadingPrices ? "Loading Prices..." : `Pay ₹${breakdown.total}`}
                        </motion.button>
                    )}

                    {paymentMethod === "Cash on Delivery" && (
                        <motion.button
                            onClick={handlePlaceOrder}
                            disabled={isBusy}
                            whileHover={!isBusy ? { scale: 1.01 } : {}}
                            whileTap={!isBusy ? { scale: 0.98 } : {}}
                            className="w-full py-4 rounded-xl bg-black text-white font-bold text-sm shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Placing Order..." : (loadingPrices ? "Loading Prices..." : "Place Order (COD)")}
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
}