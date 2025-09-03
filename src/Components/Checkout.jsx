import React, { useState, useEffect, useContext, useCallback } from "react";
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

// Centralized backend URL from environment variables
const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');

// --- Main Checkout Component ---
export default function Checkout() {
  const navigate = useNavigate();

  // --- Contexts ---
  const { getorders } = useContext(OrderContext);
  const { setCart } = useContext(CartContext); // Used to clear cart state on success
  const { userdetails } = useContext(UserContext);

  // --- Component State ---
  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  // State for pricing and API call status
  const [breakdown, setBreakdown] = useState({
    productTotal: 0,
    deliveryCharge: 0,
    discountAmount: 0,
    total: 0,
  });
  const [loadingPrices, setLoadingPrices] = useState(true); // Start as true
  const [isSubmitting, setIsSubmitting] = useState(false); // For order placement loading state

  // State for payment details (passed down to PaymentDetails component)
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [upiId, setUpiId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  // Note: These states are kept for prop compatibility with your PaymentDetails component
  const [verifiedUpi] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState("PhonePe");
  const [paymentVerified, setPaymentVerified] = useState(false);

  // --- Effects ---

  // Effect to load checkout state from localStorage on initial render
  useEffect(() => {
    try {
      const items = localStorage.getItem("selectedItems");
      const parsedItems = items ? JSON.parse(items) : [];

      if (Array.isArray(parsedItems) && parsedItems.length > 0) {
        setSelectedItems(parsedItems);
      } else {
        // If cart is empty, there's nothing to check out. Redirect back.
        toast.warn("Your cart is empty. Redirecting...");
        navigate("/cart");
        return;
      }

      const storedCoupon = localStorage.getItem("appliedCoupon");
      if (storedCoupon) {
        setAppliedCoupon(JSON.parse(storedCoupon));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      toast.error("There was an issue loading your cart.");
      navigate("/cart");
    }
  }, [navigate]);

  // Effect to fetch price breakdown whenever items or coupon change
  useEffect(() => {
    const fetchBreakdown = async () => {
      if (selectedItems.length === 0) return;

      setLoadingPrices(true);
      try {
        const res = await fetch(`${BACKEND}/api/payments/breakdown`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartItems: selectedItems.map(i => ({ id: i.product.id, quantity: i.quantity })),
            couponCode: appliedCoupon?.code || null,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.msg || "Failed to fetch price details.");
        }

        const data = await res.json();
        if (data.success) {
          setBreakdown(data.breakdown);
        } else {
          throw new Error(data.msg || 'Price breakdown error.');
        }
      } catch (error) {
        console.error('Price breakdown error:', error);
        toast.error(`Could not load price details: ${error.message}`);
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchBreakdown();
  }, [selectedItems, appliedCoupon]);

  // --- Helper Functions ---

  /**
   * Clears cart-related data from state and localStorage after a successful order.
   */
  const cleanupAfterOrder = useCallback(async () => {
    localStorage.removeItem("selectedItems");
    localStorage.removeItem("appliedCoupon");
    setCart([]); // Clear cart from global context
    await getorders(); // Refresh the user's orders list
  }, [getorders, setCart]);

  // --- Event Handlers ---

  /**
   * Handles successful payment via Razorpay.
   */
  const handleRazorpaySuccess = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await cleanupAfterOrder();
      setStep(3); // Move to confirmation screen
    } catch (error) {
      console.error("Error after Razorpay success:", error);
      toast.error("Order processed, but failed to update your session. Please check your orders.");
    } finally {
      setIsSubmitting(false);
    }
  }, [cleanupAfterOrder]);

  /**
   * Handles placing an order with Cash on Delivery (COD).
   */
  const handlePlaceOrderCOD = useCallback(async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    if (!selectedAddress) {
      toast.error("Please select a delivery address.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND}/api/payments/createOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: { id: userdetails.id, fullName: userdetails.name },
          phone: selectedAddress.phone,
          paymentMode: "cod",
          couponCode: appliedCoupon?.code || null,
          cartItems: selectedItems.map(i => ({ id: i.product.id, quantity: i.quantity })),
          userAddressId: selectedAddress.id,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Server error while placing order.");
      }

      await cleanupAfterOrder();
      toast.success("Order placed successfully!");
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error(`Could not place order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedItems, selectedAddress, userdetails, appliedCoupon, cleanupAfterOrder, isSubmitting]);

  /**
   * Moves to the next step in the checkout process.
   */
  const handleNext = useCallback(() => {
    if (step === 1 && !selectedAddress) {
      toast.warn("Please select a delivery address before proceeding.");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  }, [step, selectedAddress]);

  /**
   * Moves to the previous step or navigates back to the cart.
   */
  const handlePrev = useCallback(() => {
    if (step === 1) {
      navigate("/cart");
    } else {
      setStep((prev) => Math.max(prev - 1, 1));
    }
  }, [step, navigate]);

  /**
   * Resets the checkout flow to the first step.
   */
  const resetCheckout = useCallback(() => setStep(1), []);

  // --- Render Logic ---
  return (
    <div className="checkout-wrapper">
      <div className="checkout-header">
        <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
        <div className="progress-indicator">
          {["Address", "Payment", "Confirmation"].map((label, idx) => (
            <div
              key={idx}
              className={`progress-step ${step >= idx + 1 ? "active" : ""}`} // Mark completed steps as active
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
              selectedAddressId={selectedAddress?.id}
              onSelect={setSelectedAddress}
            />
          )}

          {step === 2 && (
            <PaymentDetails
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              transactionId={transactionId}
              setTransactionId={setTransactionId}
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
              appliedCoupon={appliedCoupon}
              breakdown={breakdown}
              loadingPrices={loadingPrices}
              isSubmitting={isSubmitting} // Pass submitting state to disable buttons
              onRazorpaySuccess={handleRazorpaySuccess}
              handlePlaceOrder={handlePlaceOrderCOD}
            />
          )}

          {step === 3 && <Confirmation resetCheckout={resetCheckout} />}

          <div className="checkout-nav-buttons">
            <button 
              onClick={handlePrev} 
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              {step === 1 ? "Back to Cart" : "Back"}
            </button>
            
            {step === 1 && (
              <button 
                onClick={handleNext} 
                className="btn btn-primary"
                disabled={!selectedAddress || isSubmitting} // Disable if no address is selected
              >
                Proceed to Payment
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
