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
    paymentVerified, // 🟢 Get this prop
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

    // ✨ 1. Handle dynamic COD availability
    useEffect(() => {
        if (!breakdown.codAvailable && paymentMethod === "Cash on Delivery") {
            setPaymentMethod("Razorpay");
            window.toast.info("Cash on Delivery is not available for this address. Switched to online payment.");
        }
    }, [breakdown.codAvailable, paymentMethod]);


    const handleRazorpayPayment = async () => {
        try {
            // 🟢 MODIFIED: Send the payload with the structure the BACKEND expects
            // The backend accesses item.variant.id and item.product.id
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
                    cartItems: cartItemsPayload, // 🟢 Pass the nested payload
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
                    
                    // 🟢 MODIFIED: Send the same payload to verify-payment
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
                            cartItems: cartItemsPayload, // 🟢 Pass the nested payload
                            couponCode: appliedCoupon?.code,
                        }),
                    });

                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        setTransactionId(razorpay_payment_id);
                        onPaymentVerified(true);
                        window.toast.success("Payment successful!");
                        onRazorpaySuccess();
                    } else {
                        window.toast.error(verifyData.error || "Invalid payment. Please contact support.");
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

    const productDiscount = breakdown.originalTotal - breakdown.productTotal;

    return (
        <div className="space-y-6">
            {/* Price Summary Dropdown */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <button 
                    onClick={() => setSummaryExpanded(!summaryExpanded)}
                    className="flex justify-between items-center w-full p-4"
                >
                    <div className="flex items-center gap-3">
                        {summaryExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        <span className="font-semibold text-black">
                            {summaryExpanded ? "Hide Full Summary" : "Show Full Summary"}
                        </span>
                    </div>
                    <span className="text-lg font-bold">₹{breakdown.total}</span>
                </button>

                <AnimatePresence>
                    {summaryExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="text-sm space-y-2 p-4 border-t border-slate-100">
                                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{breakdown.productTotal}</span></div>
                                <div className="flex justify-between text-slate-600"><span>Product Discount</span><span>-₹{productDiscount}</span></div>
                                {appliedCoupon && <div className="flex justify-between font-semibold text-green-600"><span>Coupon ({appliedCoupon.code})</span><span>-₹{breakdown.discountAmount}</span></div>}
                                <div className="flex justify-between text-slate-600"><span>Delivery Charge</span><span>₹{breakdown.deliveryCharge}</span></div>
                                <div className="flex justify-between font-bold text-lg text-black border-t border-slate-100 pt-3 mt-3"><span>Total Amount</span><span>₹{breakdown.total}</span></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Payment Methods Card */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                <h3 className="flex items-center gap-3 text-xl font-bold text-slate-800">
                    <CreditCard className="w-6 h-6" /> Choose Payment Method
                </h3>

                <div className="flex flex-col gap-3">
                    {/* Razorpay Option */}
                    <label
                        key="Razorpay"
                        className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition ${
                            paymentMethod === "Razorpay"
                                ? "border-black bg-slate-50 ring-2 ring-black/20"
                                : "border-slate-100 hover:border-slate-400"
                        }`}
                    >
                        <input type="radio" name="paymentMethod" value="Razorpay" checked={paymentMethod === "Razorpay"} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 accent-black" />
                        <span className="font-medium text-black">Razorpay (Online Payment)</span>
                    </label>

                    {/* ✨ COD Option is now dynamic */}
                    <label
                        key="Cash on Delivery"
                        className={`flex flex-col items-start gap-1 p-4 border rounded-xl transition ${
                            paymentMethod === "Cash on Delivery" && breakdown.codAvailable
                                ? "border-black bg-slate-50 ring-2 ring-black/20"
                                : "border-slate-100"
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
                    {paymentMethod === "Razorpay" && (
                        <motion.button
                            onClick={handleRazorpayPayment}
                            disabled={isSubmitting || loadingPrices}
                            className="w-full py-3 rounded-lg bg-black text-white font-semibold transition-colors hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Processing..." : (loadingPrices ? "Loading Prices..." : `Pay ₹${breakdown.total}`)}
                        </motion.button>
                    )}

                    {paymentMethod === "Cash on Delivery" && (
                        <div className="space-y-3">
                            <p className="flex items-center text-sm text-slate-600"><Truck className="w-4 h-4 mr-2" /> You can pay via cash upon delivery.</p>
                            <motion.button
                                onClick={handlePlaceOrder}
                                disabled={isSubmitting || loadingPrices}
                                className="w-full py-3 rounded-lg bg-black text-white font-semibold transition-colors hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Placing Order..." : (loadingPrices ? "Loading Prices..." : "Place Order (COD)")}
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}