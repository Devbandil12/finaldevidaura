// src/components/Checkout.jsx

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
// No need to import a separate CSS file anymore, as we're using Tailwind
// import "../style/checkout.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

async function submitOrderCOD(
  selectedItems,
  selectedAddress,
  userdetails,
  appliedCoupon
) {
  const res = await fetch(`${BACKEND}/api/payments/createOrder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: { id: userdetails.id, fullName: userdetails.name },
      phone: selectedAddress.phone,
      paymentMode: "cod",
      couponCode: appliedCoupon?.code || null,
      cartItems: selectedItems.map((i) => ({
        id: i.product.id,
        quantity: i.quantity,
      })),
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

  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [verifiedUpi, setVerifiedUpi] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState(null);

  useEffect(() => {
    async function fetchBreakdown() {
      if (!selectedItems.length) return;
      setLoadingPrices(true);
      const res = await fetch(`${BACKEND}/api/payments/breakdown`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: selectedItems.map((i) => ({
            id: i.product.id,
            quantity: i.quantity,
          })),
          couponCode: appliedCoupon?.code,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBreakdown(data);
      } else {
        console.error("Failed to fetch breakdown:", data.msg);
        toast.error("Failed to fetch price details.");
      }
      setLoadingPrices(false);
    }
    fetchBreakdown();
  }, [selectedItems, appliedCoupon]);

  const handleNext = () => {
    if (step === 1 && !selectedAddress) {
      toast.error("Please select an address to proceed.");
      return;
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    if (step === 1) {
      navigate(-1);
    } else {
      setStep(step - 1);
    }
  };

  const resetCheckout = () => {
    setStep(1);
    setSelectedAddress(null);
    setSelectedItems([]);
    setAppliedCoupon(null);
    setBreakdown({
      productTotal: 0,
      deliveryCharge: 0,
      discountAmount: 0,
      total: 0,
    });
    setPaymentMethod("");
    setPaymentVerified(false);
    setUpiId("");
    setVerifiedUpi(false);
    setSelectedUpiApp(null);
    localStorage.removeItem("selectedItems");
    localStorage.removeItem("appliedCoupon");
    setCart([]);
  };

  const handlePlaceOrder = async () => {
    try {
      if (
        paymentMethod === "Cash on Delivery" &&
        selectedAddress.city.toLowerCase() !== "gwalior"
      ) {
        toast.error("Cash on Delivery is only available in Gwalior.");
        return;
      }
      toast.info("Placing your order...", { autoClose: false });
      await submitOrderCOD(
        selectedItems,
        selectedAddress,
        userdetails,
        appliedCoupon
      );
      toast.dismiss();
      toast.success("Order placed successfully!");
      setOrders([...orders, { status: "pending" }]);
      resetCheckout();
      setStep(3);
    } catch (err) {
      toast.dismiss();
      toast.error("Order placement failed: " + err.message);
    }
  };

  const handleRazorpaySuccess = async (response) => {
    toast.dismiss();
    toast.success("Payment successful! Redirecting...");
    setOrders([...orders, { status: "pending" }]);
    resetCheckout();
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <ToastContainer position="top-center" />
      <div className="w-full max-w-5xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
          Checkout
        </h1>
        <div className="relative flex justify-between items-center after:absolute after:top-1/2 after:left-0 after:right-0 after:h-0.5 after:bg-gray-300 after:-translate-y-1/2">
          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300 font-semibold ${
                step >= 1
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              1
            </div>
            <span
              className={`mt-2 text-sm text-center transition-colors duration-300 ${
                step >= 1 ? "text-blue-600 font-medium" : "text-gray-600"
              }`}
            >
              Address
            </span>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300 font-semibold ${
                step >= 2
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              2
            </div>
            <span
              className={`mt-2 text-sm text-center transition-colors duration-300 ${
                step >= 2 ? "text-blue-600 font-medium" : "text-gray-600"
              }`}
            >
              Payment
            </span>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300 font-semibold ${
                step >= 3
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              3
            </div>
            <span
              className={`mt-2 text-sm text-center transition-colors duration-300 ${
                step >= 3 ? "text-blue-600 font-medium" : "text-gray-600"
              }`}
            >
              Confirmation
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse md:flex-row w-full max-w-5xl mx-auto gap-8">
        <div className="flex-1 space-y-6">
          {step === 1 && (
            <AddressSelection
              userId={userdetails?.id}
              onSelect={setSelectedAddress}
              selectedAddress={selectedAddress}
            />
          )}

          {step === 2 && (
            <PaymentDetails
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

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={handlePrev}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200 shadow-sm"
            >
              {step === 1 ? "Back to Cart" : "Back"}
            </button>
            {step < 3 && (
              <button
                onClick={handleNext}
                disabled={step === 1 && !selectedAddress}
                className={`px-6 py-2 rounded-md font-semibold transition-colors duration-200 shadow-md ${
                  step === 1 && !selectedAddress
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {step === 1 ? "Next: Payment" : "Next"}
              </button>
            )}
          </div>
        </div>

        <aside className="w-full md:w-96 flex-shrink-0">
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
