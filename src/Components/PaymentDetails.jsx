import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";
import { CreditCard, IndianRupee, Truck } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/?$/, "");

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
  handlePlaceOrder
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
      setLoading(true);

      const orderResponse = await fetch(`${BACKEND}/api/payments/createOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: breakdown.total,
          currency: "INR",
          receipt: `order_rcptid_${Date.now()}`,
          payment_capture: 1,
          notes: {
            user: { id: userdetails.id, fullName: userdetails.name },
            phone: selectedAddress.phone,
          },
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok || !orderData.order) {
        throw new Error("Failed to create Razorpay order: " + (orderData.msg || "Unknown error"));
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: "INR",
        name: "Your Store Name",
        description: "Payment for your order",
        order_id: orderData.order.id,
        handler: async (response) => {
          try {
            const verificationResponse = await fetch(`${BACKEND}/api/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verificationData = await verificationResponse.json();
            if (verificationData.success) {
              setTransactionId(response.razorpay_payment_id);
              onPaymentVerified(true);
              toast.success("Payment verified successfully!");
              onRazorpaySuccess();
            } else {
              throw new Error("Payment verification failed.");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment failed. Please try again.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: userdetails?.name,
          email: userdetails?.email,
          contact: selectedAddress?.phone,
        },
        theme: {
          color: "#4F46E5",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay payment error:", err);
      toast.error(err.message || "Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Choose Payment Method</h3>
      <div className="space-y-4">
        {availablePaymentMethods.map((method) => (
          <label
            key={method}
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
              paymentMethod === method ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method}
              checked={paymentMethod === method}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-2">
              {method === "Razorpay" && <IndianRupee size={20} className="text-gray-600" />}
              {method === "Cash on Delivery" && <Truck size={20} className="text-gray-600" />}
              <span className="text-base text-gray-800">{method}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-6">
        {paymentMethod === "Razorpay" && (
          <button
            onClick={handleRazorpayPayment}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:bg-blue-400"
            disabled={loading}
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        )}

        {paymentMethod === "Cash on Delivery" && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="flex items-center text-sm text-gray-700">
              <Truck size={16} className="mr-2" />
              Cash on Delivery selected. Please have exact change ready.
            </p>
            <button
              onClick={handlePlaceOrder}
              className="w-full mt-4 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:bg-green-400"
              disabled={loading}
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
