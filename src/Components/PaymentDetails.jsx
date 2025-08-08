import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";
import { CreditCard, IndianRupee, Truck } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
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
        return;
      }

      const responseText = await orderResponse.text();
      if (!responseText) {
        toast.error("Empty order response");
        return;
      }

      let orderData;
      try {
        orderData = JSON.parse(responseText);
      } catch (err) {
        console.error("Error parsing order JSON:", err);
        toast.error("Invalid server response.");
        return;
      }

      if (!orderData.orderId) {
        toast.error("Order not created. Missing order ID.");
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: breakdown.total * 100,
        currency: "INR",
        name: "DevidAura",
        description: "Order Payment",
        order_id: orderData.orderId,
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
            }),
          });

          if (!verifyRes.ok) {
            setLoading(false);
            toast.error("Verification failed. Try again.");
            return;
          }

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setTransactionId(razorpay_payment_id);
            onPaymentVerified(true);
            toast.success("Payment successful!");
            onRazorpaySuccess();
            setLoading(false);
          } else {
            setLoading(false);
            toast.error("Invalid payment. Please contact support.");
          }
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Payment failed. Please try again.");
    }
  };

  return (
    <div className="payment-details payment-section">
      <div className="section-card">
        <div className="summary-header" onClick={() => setSummaryExpanded(!summaryExpanded)}>
          <IndianRupee size={18} />
          <span className="payment-total-price">Total: ₹{breakdown.total}</span>
          <span className="toggle-icon">{summaryExpanded ? "▲" : "▼"}</span>
        </div>

        {summaryExpanded && (
          <div className="summary-details">
            {loadingPrices ? (
              <p>Loading breakdown...</p>
            ) : (
              <ul className="price-list">
                <li><strong>Original:</strong> ₹{breakdown.originalTotal}</li>
                <li><strong>Discount:</strong> -₹{breakdown.originalTotal - breakdown.productTotal}</li>
                {appliedCoupon && (
                  <li style={{ color: "green", fontWeight: 600 }}>
                    <strong>Coupon ({appliedCoupon.code}):</strong> -₹{breakdown.discountAmount}
                  </li>
                )}
                <li><strong>Delivery:</strong> ₹{breakdown.deliveryCharge}</li>
                <li className="total-line">
                  <strong>Total:</strong> ₹{breakdown.total}
                </li>
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="section-card payment-methods">
        <h3><CreditCard size={18} /> Choose Payment Method</h3>
        <div className="payment-method-selection">
          {availablePaymentMethods.map((method) => (
            <label key={method} className="payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={paymentMethod === method}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              {method}
            </label>
          ))}
        </div>

        <div className="payment-action">
          {paymentMethod === "Razorpay" && (
            <button
              onClick={handleRazorpayPayment}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
          )}

          {paymentMethod === "Cash on Delivery" && (
            <div className="cod-content">
              <p>
                <Truck size={16} style={{ marginRight: "6px" }} />
                Cash on Delivery selected. Please have exact change ready.
              </p>
              <button
                onClick={handlePlaceOrder}
                className="btn btn-success"
              >
                Place Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
