import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { OrderContext } from "../contexts/OrderContext";
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext";
import AddressSelection from "./AddressSelection";
import OrderSummary from "./OrderSummary";
import PaymentDetails from "./PaymentDetails";
import Confirmation from "./Confirmation";
import "../style/checkout.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');

async function submitOrderCOD(selectedItems, selectedAddress, userdetails, appliedCoupon) {
  const res = await fetch(`${BACKEND}/api/payments/createOrder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: { id: userdetails.id, fullName: userdetails.name },
      phone: selectedAddress.phone,
      paymentMode: "cod",
      couponCode: appliedCoupon?.code || null,
      cartItems: selectedItems.map(i => ({ id: i.product.id, quantity: i.quantity })),
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export default function Checkout() {
  const navigate = useNavigate();
  const { orders, setOrders, getorders } = useContext(OrderContext);
  const { setCart } = useContext(CartContext);
  const { userdetails } = useContext(UserContext);

  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(null);
  
  const [selectedItems, setSelectedItems] = useState([]);


  useEffect(() => {
    const items = localStorage.getItem("selectedItems");
    if (items) {
      setSelectedItems(JSON.parse(items));
    }
  }, []);

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  useEffect(() => {
    const storedCoupon = localStorage.getItem("appliedCoupon");
    if (storedCoupon) {
      setAppliedCoupon(JSON.parse(storedCoupon));
    }
  }, []);

  const [breakdown, setBreakdown] = useState({
    productTotal: 0,
    deliveryCharge: 0,
    discountAmount: 0,
    total: 0,
  });
  const [loadingPrices, setLoadingPrices] = useState(false);

  useEffect(() => {
    async function fetchBreakdown() {
      if (!selectedItems.length) return;
      setLoadingPrices(true);

      const res = await fetch(`${BACKEND}/api/payments/breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: selectedItems.map(i => ({ id: i.product.id, quantity: i.quantity })),
          couponCode: appliedCoupon?.code || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBreakdown(data.breakdown);
      } else {
        console.error('Price breakdown error:', data.msg);
      }
      setLoadingPrices(false);
    }
    fetchBreakdown();
  }, [selectedItems, appliedCoupon]);

  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [upiId, setUpiId] = useState("");
  const [verifiedUpi] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState("PhonePe");
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  

  


  const handleRazorpaySuccess = async () => {
    localStorage.removeItem("selectedItems");
    await getorders();
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    if (selectedItems.length === 0) {
      alert("No items selected for the order.");
      return;
    }
    try {
      await submitOrderCOD(selectedItems, selectedAddress, userdetails, appliedCoupon);
      localStorage.removeItem("selectedItems");
      await getorders();
      toast.success("Order placed!");
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error("Could not place order.");
    }
  };

  const handleNext = () => {
  if (step === 1) {
    if (!selectedAddress) {
      alert("Please select a delivery address before proceeding.");
      return; // Prevent going to next step
    }
  }
  setStep((prev) => Math.min(prev + 1, 3));
};


  const handlePrev = () => {
    if (step === 1) {
      navigate("/cart");
    } else {
      setStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const resetCheckout = () => setStep(1);

  

  return (
    <div className="checkout-wrapper">
      <div className="checkout-header">
        <div className="absolute top-2">
          <ToastContainer />
        </div>
        <div className="progress-indicator">
          {["Address", "Payment", "Confirmation"].map((label, idx) => (
            <div
              key={idx}
              className={`progress-step ${step === idx + 1 ? "active" : ""}`}
            >
              <span>{idx + 1}</span>
              <p>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="checkout-body">
        <div className="checkout-main">
          {step === 1 && (
            <AddressSelection
              userId={userdetails?.id}
    onSelect={setSelectedAddress}
            />
          )}

          {step === 2 && (
            <PaymentDetails
              transactionId={transactionId}
              setTransactionId={setTransactionId}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              upiId={upiId}
              setUpiId={setUpiId}
              verifiedUpi={verifiedUpi}
              selectedUpiApp={selectedUpiApp}
              setSelectedUpiApp={setSelectedUpiApp}
              onPaymentVerified={setPaymentVerified}
              paymentVerified={paymentVerified}
              selectedAddress={selectedAddress}
              userdetails={userdetails}
              selectedItems={selectedItems}
              onRazorpaySuccess={handleRazorpaySuccess}
              appliedCoupon={appliedCoupon}
              breakdown={breakdown}
              loadingPrices={loadingPrices}
              handlePlaceOrder={handlePlaceOrder}
            />
          )}

          {step === 3 && <Confirmation resetCheckout={resetCheckout} />}

          <div className="checkout-nav-buttons">
            <button onClick={handlePrev} className="btn btn-outline">
              {step === 1 ? "Back to Cart" : "Back"}
            </button>
            {step === 1 && (
              <button onClick={handleNext} className="btn btn-primary">
                Next
              </button>
            )}
          </div>
        </div>

        <aside className="checkout-summary">
          <OrderSummary
            selectedAddress={selectedAddress}
            selectedItems={selectedItems}
            appliedCoupon={appliedCoupon}
            breakdown={breakdown}
            loadingPrices={loadingPrices}
          />
        </aside>
      </div>
    </div>
  );
}
