import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { Lock } from "lucide-react"; // Using lucide-react for the lock icon
import { OrderContext } from "../contexts/OrderContext";
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext";
import AddressSelection from "./AddressSelection";
import OrderSummary from "./OrderSummary";
import PaymentDetails from "./PaymentDetails";
import Confirmation from "./Confirmation";
import "../style/checkout.css"; // The new CSS will be linked here

const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');

// The submitOrderCOD function remains the same
async function submitOrderCOD(selectedItems, selectedAddress, userdetails, appliedCoupon) {
  // ... (no changes to this function)
}

export default function Checkout() {
  const navigate = useNavigate();
  const { orders, setOrders, getorders } = useContext(OrderContext);
  const { setCart } = useContext(CartContext);
  const { userdetails } = useContext(UserContext);

  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [breakdown, setBreakdown] = useState({ productTotal: 0, deliveryCharge: 0, discountAmount: 0, total: 0 });
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  
  // All state and useEffect hooks remain the same...
  // ...

  const handleNext = () => {
    if (step === 1 && !selectedAddress) {
      toast.warn("Please select a delivery address.");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    if (step === 1) navigate("/cart");
    else setStep((prev) => Math.max(prev - 1, 1));
  };

  // Other handler functions (handlePlaceOrder, etc.) remain the same...
  // ...

  return (
    <div className="checkout-page-wrapper">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
      
      {/* --- REDESIGNED HEADER --- */}
      <div className="checkout-header">
        <div className="header-title">
          <Lock size={28} className="lock-icon" />
          <h1>Secure Checkout</h1>
        </div>
        <div className="progress-stepper">
          {["Address", "Payment", "Confirmation"].map((label, idx) => {
            const stepNumber = idx + 1;
            let stepClass = "progress-step";
            if (step === stepNumber) stepClass += " active";
            if (step > stepNumber) stepClass += " completed";

            return (
              <div key={idx} className={stepClass}>
                <div className="step-circle">{step > stepNumber ? '✔' : stepNumber}</div>
                <p className="step-label">{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="checkout-body">
        <main className="checkout-main">
          {/* Each step is now wrapped in a panel for consistent styling */}
          <div className="checkout-step-panel">
            {step === 1 && (
              <AddressSelection
                userId={userdetails?.id}
                onSelect={setSelectedAddress}
              />
            )}
            {step === 2 && (
              <PaymentDetails
                // ... all props remain the same
              />
            )}
            {step === 3 && <Confirmation resetCheckout={() => setStep(1)} />}
          </div>
          
          <div className="checkout-nav-buttons">
            <button onClick={handlePrev} className="btn btn-secondary">
              {step === 1 ? "Back to Cart" : "Back"}
            </button>
            {step < 3 && (
              <button onClick={handleNext} className="btn btn-primary">
                {step === 1 ? "Proceed to Payment" : "Confirm Order"}
              </button>
            )}
          </div>
        </main>

        <aside className="checkout-summary-container">
          <div className="summary-card">
            <OrderSummary
              selectedAddress={selectedAddress}
              selectedItems={selectedItems}
              appliedCoupon={appliedCoupon}
              breakdown={breakdown}
              loadingPrices={loadingPrices}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
