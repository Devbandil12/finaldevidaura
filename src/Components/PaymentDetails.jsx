import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";
import { CreditCard, IndianRupee, Truck } from "lucide-react";
import "../style/paymentDetails.css";

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
    <div className="bg-white text-black w-full max-w-md mx-auto p-4 sm:p-6 space-y-6">
      {/* Price Summary Section */}
      <div className="border border-black rounded-lg">
        <div
          className="flex justify-between items-center p-4 cursor-pointer"
          onClick={() => setSummaryExpanded(!summaryExpanded)}
        >
          <div className="flex items-center gap-3">
            <IndianRupee size={20} />
            <span className="font-bold text-lg">Total: ₹{breakdown.total}</span>
          </div>
          {summaryExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {summaryExpanded && (
          <div className="px-4 pb-4 border-t border-black">
            {loadingPrices ? (
              <p className="pt-4 text-center">Loading breakdown...</p>
            ) : (
              <ul className="space-y-2 pt-4 text-sm">
                <li className="flex justify-between">
                  <span>Original Price:</span>
                  <span className="font-semibold">₹{breakdown.originalTotal}</span>
                </li>
                <li className="flex justify-between">
                  <span>Product Discount:</span>
                  <span className="font-semibold">-₹{breakdown.originalTotal - breakdown.productTotal}</span>
                </li>
                {appliedCoupon && (
                  <li className="flex justify-between font-bold">
                    <span>Coupon ({appliedCoupon.code}):</span>
                    <span>-₹{breakdown.discountAmount}</span>
                  </li>
                )}
                <li className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span className="font-semibold">₹{breakdown.deliveryCharge}</span>
                </li>
                <li className="flex justify-between text-base font-bold border-t border-black pt-2 mt-2">
                  <span>Total Payable:</span>
                  <span>₹{breakdown.total}</span>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Payment Method Section */}
      <div className="border border-black rounded-lg p-4">
        <h3 className="flex items-center gap-3 font-bold text-lg mb-4">
          <CreditCard size={20} />
          Choose Payment Method
        </h3>
        <div className="space-y-3">
          {availablePaymentMethods.map((method, index) => (
            <div key={method}>
              <input
                type="radio"
                id={`paymentMethod-${index}`}
                name="paymentMethod"
                value={method}
                checked={paymentMethod === method}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="sr-only peer" // Hide the default radio button
              />
              <label
                htmlFor={`paymentMethod-${index}`}
                className="flex items-center p-3 border-2 border-black rounded-lg cursor-pointer transition-colors
                           peer-checked:bg-black peer-checked:text-white"
              >
                {method}
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6">
          {paymentMethod === "Razorpay" && (
            <button
              onClick={handleRazorpayPayment}
              className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Processing..." : `Pay ₹${breakdown.total}`}
            </button>
          )}

          {paymentMethod === "Cash on Delivery" && (
            <div className="space-y-4">
              <p className="text-sm flex items-center justify-center text-center gap-2 p-2 bg-gray-100 rounded-md border border-black">
                <Truck size={18} />
                You will pay on delivery.
              </p>
              <button
                onClick={handlePlaceOrder}
                className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
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