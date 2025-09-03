import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";
import { CreditCard, IndianRupee, Truck, ChevronDown, ChevronUp } from "lucide-react";

// The VITE_BACKEND_URL should be defined in your .env file
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
  const [loading, setLoading] = useState(false); // Shared loading state for both buttons
  const { user } = useUser();

  useEffect(() => {
    // Automatically mark payment as unverified if switching to COD
    if (paymentMethod === "Cash on Delivery") {
      onPaymentVerified(false);
    }
  }, [paymentMethod, onPaymentVerified]);

  // Determine if Cash on Delivery is an available option
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

          setLoading(false);

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
            setLoading(false);
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
    <div className="bg-white text-black w-full max-w-md mx-auto p-6 border-2 border-black rounded-lg">
      {/* Price Summary Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-baseline">
          <h2 className="text-lg font-medium">Total Payable</h2>
          <p className="text-3xl font-extrabold">₹{breakdown.total}</p>
        </div>

        <div
          className="flex items-center text-sm font-semibold cursor-pointer"
          onClick={() => setSummaryExpanded(!summaryExpanded)}
        >
          <span>{summaryExpanded ? "Hide details" : "View details"}</span>
          {summaryExpanded ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
        </div>

        {summaryExpanded && (
           <div className="border-t border-black/50 pt-4">
            {loadingPrices ? (
              <p className="text-center">Loading breakdown...</p>
            ) : (
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span>Original Price</span><span>₹{breakdown.originalTotal}</span></li>
                <li className="flex justify-between"><span>Product Discount</span><span>-₹{breakdown.originalTotal - breakdown.productTotal}</span></li>
                {appliedCoupon && (
                  <li className="flex justify-between font-bold"><span>Coupon ({appliedCoupon.code})</span><span>-₹{breakdown.discountAmount}</span></li>
                )}
                <li className="flex justify-between"><span>Delivery Charge</span><span>₹{breakdown.deliveryCharge}</span></li>
              </ul>
            )}
           </div>
        )}
      </div>

      <hr className="border-black/50 my-6" />

      {/* Payment Method Section */}
      <div className="space-y-5">
        <h3 className="flex items-center gap-3 font-bold text-lg">
          <CreditCard size={20} />
          Select a Payment Method
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
                className="flex justify-between items-center p-4 border border-black rounded-lg cursor-pointer transition-all peer-checked:border-2"
              >
                <span className="font-semibold">{method}</span>
                <div className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">
                    <div className="w-2.5 h-2.5 rounded-full bg-transparent peer-checked:bg-black transition-colors"></div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button Section */}
      <div className="mt-8">
          {paymentMethod === "Razorpay" && (
            <button
              onClick={handleRazorpayPayment}
              className="w-full bg-black text-white font-bold py-4 px-4 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Processing..." : `Pay ₹${breakdown.total}`}
            </button>
          )}

          {paymentMethod === "Cash on Delivery" && (
            <div className="space-y-4 text-center">
              <p className="text-xs flex items-center justify-center gap-2 p-2 rounded-md">
                <Truck size={16} />
                You will pay on delivery.
              </p>
              <button
                onClick={handlePlaceOrder}
                className="w-full bg-black text-white font-bold py-4 px-4 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Placing Order..." : "Confirm Order"}
              </button>
            </div>
          )}
        </div>
    </div>
  );
}
