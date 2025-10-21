import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { IndianRupee, CreditCard, Truck, ChevronUp, ChevronDown } from "lucide-react";
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
    setTransactionId,
}) {
    const [paymentMethod, setPaymentMethod] = useState("Razorpay");
    const [summaryExpanded, setSummaryExpanded] = useState(false);
    const { user } = useUser();

    // Effect to reset payment verification status when switching to COD
    useEffect(() => {
        if (paymentMethod === "Cash on Delivery") {
            onPaymentVerified(false);
        }
    }, [paymentMethod, onPaymentVerified]);

    // ✨ 1. ADD THIS useEffect TO HANDLE DYNAMIC COD AVAILABILITY
    useEffect(() => {
        // If COD becomes unavailable while it was the selected method,
        // automatically switch to Razorpay and notify the user.
        if (!breakdown.codAvailable && paymentMethod === "Cash on Delivery") {
            setPaymentMethod("Razorpay");
            window.toast.info("Cash on Delivery is not available for this address. Switched to online payment.");
        }
    }, [breakdown.codAvailable, paymentMethod]);


    const handleRazorpayPayment = async () => {
        // This function remains unchanged
        try {
            const orderResponse = await fetch(`${BACKEND}/api/payments/createOrder`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user: { id: userdetails.id, fullName: userdetails.name, email: userdetails.email },
                    phone: selectedAddress.phone,
                    couponCode: appliedCoupon?.code,
                    paymentMode: "Razorpay",
                    cartItems: selectedItems.map(item => ({ id: item.product.id, quantity: item.quantity })),
                    userAddressId: selectedAddress.id,
                }),
            });

            if (!orderResponse.ok) {
                const errorData = await orderResponse.json();
                throw new Error(errorData.msg || "Could not create order.");
            }

            const orderData = await orderResponse.json();
            if (!orderData.razorpayOrderId) throw new Error("Missing Razorpay order ID.");

            const options = {
                key: orderData.keyId,
                amount: breakdown.total * 100,
                currency: "INR",
                name: "DevidAura",
                description: "Order Payment",
                order_id: orderData.razorpayOrderId,
                prefill: {
                    name: userdetails?.name || "",
                    email: userdetails?.email || "",
                    contact: selectedAddress?.phone || "",
                },
                handler: async function (response) {
                    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;
                    const verifyRes = await fetch(`${BACKEND}/api/payments/verify-payment`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id,
                            razorpay_payment_id,
                            razorpay_signature,
                            orderId: orderData.orderId,
                            userAddressId: selectedAddress.id, // Pass address ID for verification
                        }),
                    });

                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        setTransactionId(razorpay_payment_id);
                        onPaymentVerified(true);
                        window.toast.success("Payment successful!");
                        onRazorpaySuccess();
                    } else {
                        window.toast.error("Invalid payment. Please contact support.");
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
            window.toast.error(`Payment failed: ${err.message}`);
        }
    };

    // ✨ 2. REMOVE OLD HARDCODED LOGIC
    // const isCODAllowed = selectedAddress?.city?.toLowerCase() === "gwalior";
    // const availablePaymentMethods = ["Razorpay"].concat(isCODAllowed ? ["Cash on Delivery"] : []);
    const productDiscount = breakdown.originalTotal - breakdown.productTotal;

    return (
        <div className="space-y-6">
            {/* Price Summary Dropdown (Unchanged) */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {/* ... existing button and motion.div for summary ... */}
            </div>

            {/* Payment Methods Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <h3 className="flex items-center gap-3 text-xl font-bold text-slate-800">
                    <CreditCard className="w-6 h-6" /> Choose Payment Method
                </h3>

                <div className="flex flex-col gap-3">
                    {/* Razorpay Option (Unchanged) */}
                    <label
                        key="Razorpay"
                        className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition ${
                            paymentMethod === "Razorpay"
                                ? "border-black bg-slate-50 ring-2 ring-black/20"
                                : "border-slate-200 hover:border-slate-400"
                        }`}
                    >
                        <input type="radio" name="paymentMethod" value="Razorpay" checked={paymentMethod === "Razorpay"} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 accent-black" />
                        <span className="font-medium text-black">Razorpay</span>
                    </label>

                    {/* ✨ 3. MODIFY THE COD OPTION TO BE DYNAMIC */}
                    <label
                        key="Cash on Delivery"
                        className={`flex flex-col items-start gap-1 p-4 border rounded-xl transition ${
                            paymentMethod === "Cash on Delivery" && breakdown.codAvailable
                                ? "border-black bg-slate-50 ring-2 ring-black/20"
                                : "border-slate-200"
                        } ${
                            !breakdown.codAvailable
                                ? "bg-slate-50 cursor-not-allowed opacity-60"
                                : "cursor-pointer hover:border-slate-400"
                        }`}
                    >
                        <div className="flex items-center w-full">
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="Cash on Delivery"
                                checked={paymentMethod === "Cash on Delivery"}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                disabled={!breakdown.codAvailable} // Disable the radio button itself
                                className="w-4 h-4 accent-black"
                            />
                            <span className="font-medium text-black ml-3">Cash on Delivery</span>
                        </div>
                        {!breakdown.codAvailable && (
                            <p className="text-xs text-red-600 ml-7 mt-1">
                                Not available for the selected pincode.
                            </p>
                        )}
                    </label>
                </div>

                <div className="pt-2">
                    {/* Razorpay Button (Unchanged) */}
                    {paymentMethod === "Razorpay" && (
                        <motion.button
                            onClick={handleRazorpayPayment}
                            disabled={isSubmitting}
                            className="w-full py-3 rounded-lg bg-black text-white font-semibold transition-colors hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Processing..." : `Pay ₹${breakdown.total}`}
                        </motion.button>
                    )}

                    {/* COD Button (Unchanged, will now only show if COD is selected) */}
                    {paymentMethod === "Cash on Delivery" && (
                        <div className="space-y-3">
                            <p className="flex items-center text-sm text-slate-600"><Truck className="w-4 h-4 mr-2" /> You can pay via cash upon delivery.</p>
                            <motion.button
                                onClick={handlePlaceOrder}
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-lg bg-black text-white font-semibold transition-colors hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Placing Order..." : "Place Order (COD)"}
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}