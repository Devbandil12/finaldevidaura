import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";
import { IndianRupee, CreditCard, Truck, ChevronUp, ChevronDown } from "lucide-react";

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
          cartItems: selectedItems.map(item => ({
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

              // ✅ pass extra fields for DB insertion during verification
              user: {
                id: userdetails.id,
                fullName: userdetails.name,
                email: userdetails.email,
              },
              phone: selectedAddress.phone,
              cartItems: selectedItems.map(item => ({
                id: item.product.id,
                quantity: item.quantity,
              })),
              couponCode: appliedCoupon?.code,
              orderId: orderData.orderId,
              userAddressId: selectedAddress.id,
            }),
          });

          setLoading(false); // ✅ reset loading before checking result

          if (!verifyRes.ok) {
            toast.error("Verification failed. Try again.");
            return;
          }

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setTransactionId(razorpay_payment_id);
            onPaymentVerified(true);
            toast.success("Payment successful!");
            onRazorpaySuccess();
          } else {
            toast.error("Invalid payment. Please contact support.");
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false); // ✅ reset if Razorpay modal is closed
            toast.error("Payment cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Payment failed. Please try again.");
      setLoading(false);
    }
  };

  return (
  <div className="w-full max-w-3xl mx-auto space-y-6">
    {/* Price Summary Card */}
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setSummaryExpanded(!summaryExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-black" />
          <span className="text-lg font-semibold text-black">
            Total: ₹{breakdown.total}
          </span>
        </div>
        {summaryExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          summaryExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="px-4 pb-4">
          {loadingPrices ? (
            <p className="text-gray-500">Loading breakdown...</p>
          ) : (
            <ul className="divide-y divide-gray-200 text-sm">
              <li className="flex justify-between py-2">
                <span>Original</span>
                <span>₹{breakdown.originalTotal}</span>
              </li>
              <li className="flex justify-between py-2">
                <span>Discount</span>
                <span>-₹{breakdown.originalTotal - breakdown.productTotal}</span>
              </li>
              {appliedCoupon && (
                <li className="flex justify-between py-2 text-green-600 font-semibold">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>-₹{breakdown.discountAmount}</span>
                </li>
              )}
              <li className="flex justify-between py-2">
                <span>Delivery</span>
                <span>₹{breakdown.deliveryCharge}</span>
              </li>
              <li className="flex justify-between py-3 font-semibold text-black text-base">
                <span>Total</span>
                <span>₹{breakdown.total}</span>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>

    {/* Payment Methods */}
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-black">
        <CreditCard className="w-5 h-5" /> Choose Payment Method
      </h3>

      <div className="flex flex-col gap-3">
        {availablePaymentMethods.map((method) => (
          <label
            key={method}
            className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
              paymentMethod === method
                ? "border-black bg-gray-50"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method}
              checked={paymentMethod === method}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-4 h-4 accent-black"
            />
            <span className="font-medium text-black">{method}</span>
          </label>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="pt-2">
        {paymentMethod === "Razorpay" && (
          <button
            onClick={handleRazorpayPayment}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-black text-white font-semibold transition hover:bg-gray-900 disabled:bg-gray-300"
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        )}

        {paymentMethod === "Cash on Delivery" && (
          <div className="space-y-3">
            <p className="flex items-center text-sm text-gray-600">
              <Truck className="w-4 h-4 mr-2" />
              Cash on Delivery selected. Please have exact change ready.
            </p>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white border border-black text-black font-semibold transition hover:bg-gray-100 disabled:bg-gray-300"
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);
