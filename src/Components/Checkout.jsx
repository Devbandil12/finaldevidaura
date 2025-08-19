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

const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/?$/, '');

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
      toast.error("No items selected for the order.");
      return;
    }
    try {
      setLoading(true);
      await submitOrderCOD(selectedItems, selectedAddress, userdetails, appliedCoupon);
      localStorage.removeItem("selectedItems");
      setCart([]);
      toast.success("Order placed successfully!");
      setStep(3);
    } catch (err) {
      console.error("COD order failed:", err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetCheckout = () => {
    setStep(1);
    setSelectedAddress(null);
    setSelectedItems([]);
    setAppliedCoupon(null);
    setPaymentMethod("Razorpay");
    setPaymentVerified(false);
    navigate("/");
  };

  const handleNext = () => {
    if (step === 1 && !selectedAddress) {
      toast.error("Please select a delivery address.");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (step === 1) {
      navigate("/cart");
    } else {
      setStep((prev) => prev - 1);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout</h1>

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step === 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-300 text-gray-600'}`}>1</span>
            <span className={`text-sm md:text-base font-semibold transition-colors ${step === 1 ? 'text-blue-600' : 'text-gray-600'}`}>Address</span>
          </div>
          <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-4 self-center"></div>
          <div className="flex items-center space-x-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step === 2 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-300 text-gray-600'}`}>2</span>
            <span className={`text-sm md:text-base font-semibold transition-colors ${step === 2 ? 'text-blue-600' : 'text-gray-600'}`}>Payment</span>
          </div>
          <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-4 self-center"></div>
          <div className="flex items-center space-x-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step === 3 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-300 text-gray-600'}`}>3</span>
            <span className={`text-sm md:text-base font-semibold transition-colors ${step === 3 ? 'text-blue-600' : 'text-gray-600'}`}>Confirmation</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 1 && <AddressSelection userId={userdetails?.id} onSelect={setSelectedAddress} />}
            {step === 2 && (
              <PaymentDetails
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
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

            <div className="mt-8 flex justify-between items-center p-4 bg-white rounded-lg shadow-md">
              <button
                onClick={handlePrev}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                {step === 1 ? "← Back to Cart" : "← Back"}
              </button>
              {step === 1 && (
                <button
                  onClick={handleNext}
                  className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  Next
                </button>
              )}
            </div>
          </div>

          <aside className="lg:col-span-1">
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
    </div>
  );
}
