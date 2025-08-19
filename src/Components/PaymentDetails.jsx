
// src/components/PaymentDetails.jsx

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";
import { CreditCard, IndianRupee, Truck } from "lucide-react";
// No need to import a separate CSS file anymore
// import "../style/paymentDetails.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

export default function PaymentDetails({
  paymentMethod,
  setPaymentMethod,
  onPaymentVerified,
  breakdown,
  setTransactionId,
  selectedAddress,
  userdetails,
  selectedItems,
  onRazorpaySuccess,
  appliedCoupon,
  loadingPrices,
  handlePlaceOrder,
}) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [loading, setLoading] = useState(false); // shared loading for both buttons
  const { user } = useUser();

  useEffect(() => {
    if (paymentMethod === "Cash on Delivery") {
      onPaymentVerified(false);
    }
  }, [paymentMethod, onPaymentVerified]);

  const isCODAllowed =
    selectedAddress &&
    selectedAddress.city &&
    selectedAddress.city.toLowerCase() === "gwalior";

  const availablePaymentMethods = ["Razorpay"].concat(
    isCODAllowed ? ["Cash on Delivery"] : []
  );

  const handleRazorpayPayment = async () => {
    try {
      setLoading(true); // ✅ disable double-tap

      const orderResponse = await fetch(`${BACKEND}/api/payments/createOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            id: userdetails.id,
            fullName: userdetails.name,
            primaryEmailAddress: { emailAddress: userdetails.email },
          },
          phone: selectedAddress.phone,
          couponCode: appliedCoupon?.code,
          paymentMode: paymentMethod,
          cartItems: selectedItems.map((item) => ({
            id: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error("Order creation failed:", errorText);
        toast.error("Could not create order. Try again.");
        setLoading(false);
        return;
      }

      const responseText = await orderResponse.text();
      if (!responseText) {
        toast.error("Empty order response");
        setLoading(false);
        return;
      }
      let orderData;
      try {
        orderData = JSON.parse(responseText);
      } catch (err) {
        console.error("Error parsing order JSON:", err);
        toast.error("Invalid server response.");
        setLoading(false);
        return;
      }
      if (!orderData.razorpayOrderId) {
        toast.error("Order not created. Missing Razorpay order ID.");
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: breakdown.total * 100,
        currency: "INR",
        name: "Eco Banao",
        description: `Payment for Order #${orderData.orderId}`,
        order_id: orderData.razorpayOrderId,
        handler: function (response) {
          if (response.razorpay_payment_id) {
            setTransactionId(response.razorpay_payment_id);
            onPaymentVerified(true);
            onRazorpaySuccess(response);
          } else {
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: userdetails.name,
          email: userdetails.email,
          contact: selectedAddress.phone,
        },
        theme: {
          color: "#000",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response) {
        console.error(response.error);
        toast.error("Payment failed. Please try again.");
      });

      rzp1.open();
    } catch (err) {
      console.error("Razorpay payment error:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Payment Details
      </h2>
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Choose Payment Method
          </h3>
          <div className="flex flex-col gap-2">
            {availablePaymentMethods.map((method) => (
              <label
                key={method}
                className={`flex items-center gap-4 p-4 border rounded-md cursor-pointer transition-colors duration-200
                  ${
                    paymentMethod === method
                      ? "bg-blue-50 border-blue-600 shadow-md"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-800">{method}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          {paymentMethod === "Razorpay" && (
            <button
              onClick={handleRazorpayPayment}
              className="w-full px-6 py-3 rounded-md font-semibold transition-colors duration-200 shadow-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
              disabled={loading} // ✅ disable on loading
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
          )}

          {paymentMethod === "Cash on Delivery" && (
            <div className="space-y-4">
              <p className="flex items-center text-sm text-gray-700">
                <Truck size={16} className="mr-2 text-gray-500" />
                Cash on Delivery selected. Please have exact change ready.
              </p>
              <button
                onClick={handlePlaceOrder}
                className="w-full px-6 py-3 rounded-md font-semibold transition-colors duration-200 shadow-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                disabled={loading} // ✅ disable COD button too
              >
                {loading ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
