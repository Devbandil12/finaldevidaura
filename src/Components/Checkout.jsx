// src/pages/Checkout.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../style/checkout.css";
import "../style/cart.css";
import { OrderContext } from "../contexts/OrderContext";
import { db } from "../../configs";
import {
  addressTable,
  addToCartTable,
  orderItemsTable,
  ordersTable,
  UserAddressTable,
} from "../../configs/schema";
import { UserContext } from "../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import { CartContext } from "../contexts/CartContext";
import { eq } from "drizzle-orm";
import { useUser } from "@clerk/clerk-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');


// -------------------------------------------------------------------
// Helper Function: formatAddress
// Formats an address object into a display string.
// -------------------------------------------------------------------
const formatAddress = (address) => {
  if (!address) return "";
  return `${address.name} - ${address.address}, ${address.city}, ${address.state
    }, ${address.country} (${address.postalCode})${address.phone ? " - Phone: " + address.phone : ""
    }`;
};

// -------------------------------------------------------------------
// Component: AddressSelection
// Renders a list of saved addresses and a form to add or edit an address.
// -------------------------------------------------------------------

function AddressSelection({
  addresses,
  selectedAddress,
  setSelectedAddress,
  selectedAddressIndex,
  setSelectedAddressIndex,
  newAddress,
  setNewAddress,
  handleSaveAddress,
  handlePincodeBlur,
  handleEditAddress,
  handleDeleteAddress,
  addressFieldsOrder,
  editingIndex,
  setEditingIndex,
  emptyAddress,
}) {
  const [showForm, setShowForm] = useState(false);

  const onSelectAddress = (addr, idx) => {
    setSelectedAddressIndex(idx);
    setSelectedAddress(addr);
    setEditingIndex(null);
    setNewAddress(emptyAddress);
    setShowForm(false);
  };

  const onAddNewClick = () => {
    setEditingIndex(null);
    setNewAddress(emptyAddress);
    setSelectedAddress(null);
    setSelectedAddressIndex(null);
    setShowForm(true);
  };

  const onEditClick = (idx) => {
    handleEditAddress(idx);
    setEditingIndex(idx);
    setNewAddress(addresses[idx]);
    setShowForm(true);
  };

  return (
    <div className="address-selection">
      <h2>Select or Add Delivery Address</h2>

      <button className="add-new-btn" onClick={onAddNewClick}>
        + Add New Address
      </button>

      <div className="address-selection__content">
        {/* Saved-address list (always visible) */}
        <div className="address-selection__list">
          {addresses.map((addr, i) => (
            <div
              key={i}
              className={`address-card ${selectedAddressIndex === i ? "address-card--active" : ""
                }`}
              onClick={() => onSelectAddress(addr, i)}
            >
              <div className="address-card__header">
                <strong>{addr.name}</strong>
                <div className="address-card__actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(i);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(i);
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
              <p>
                {addr.address}, {addr.city}, {addr.state} – {addr.postalCode}
              </p>
              <p>{addr.country}</p>
              {addr.phone && <p>📞 {addr.phone}</p>}
            </div>
          ))}
        </div>

        {/* Conditionally render form */}
        {showForm && (
          <div className="address-selection__form">
            <h3>
              {editingIndex !== null ? "Edit Address" : "Add New Address"}
            </h3>
            <div className="address-form__fields">
              {addressFieldsOrder.map((field) => (
                <label key={field}>
                  <span>{field[0].toUpperCase() + field.slice(1)}</span>
                  <input
                    name={field}
                    value={newAddress[field] || ""}
                    onFocus={() => {
                      setSelectedAddress(null);
                      setSelectedAddressIndex(null);
                    }}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, [field]: e.target.value })
                    }
                    onKeyDown={
                      field === "postalCode"
                        ? (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handlePincodeBlur();
                          }
                        }
                        : undefined
                    }
                  />
                </label>
              ))}
            </div>
            <div className="address-form__actions">
              <button
                onClick={() => {
                  handleSaveAddress();
                  setShowForm(false);
                }}
              >
                {editingIndex !== null ? "Update Address" : "Save Address"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Component: OrderSummary
// Displays the selected delivery address, products, and pricing breakdown.
// -------------------------------------------------------------------
function OrderSummary({ selectedAddress, selectedItems, breakdown, loadingPrices, appliedCoupon }) {
  const itemCount = selectedItems.reduce(
    (acc, i) => acc + (i.quantity || 1),
    0
  );

  const productDiscount = breakdown.originalTotal - breakdown.productTotal;

  return (
    <div className="order-summary-card">
      <div className="order-summary-card__header">
        <h2>Order Summary</h2>
        <span>
          {itemCount} item{itemCount > 1 ? "s" : ""}
        </span>
      </div>

      <div className="order-summary-card__address">
        <strong>Deliver to:</strong>
        <p>
          {selectedAddress
            ? formatAddress(selectedAddress)
            : "No address selected"}
        </p>
      </div>

      <details className="order-summary-card__items" open>
        <summary>Items</summary>
        <ul>
          {selectedItems.map((item, idx) => (
            <li key={idx} className="order-summary-item-details">
              <img src={item.product.imageurl} alt={item.product.name} />
              <div className="item-info">
                <p className="item-name">{item.product.name}</p>
                <p className="item-qty">×{item.quantity || 1}</p>
              </div>
              <p className="item-price">
                ₹
                {Math.floor(
                  item.product.oprice * (1 - item.product.discount / 100)
                )}
              </p>
            </li>
          ))}
        </ul>
      </details>

      <div className="order-summary-card__breakdown">
        {loadingPrices ? (
          <p>Loading price details…</p>
        ) : (
          <>
            <div><span>Subtotal</span><span>₹{breakdown.productTotal}</span></div>
            <div><span>Product Discount</span><span className="text-danger">-₹{productDiscount}</span></div>
            {appliedCoupon && (
              <div style={{ color: "green", fontWeight: 600 }}>
                <span>Coupon ({appliedCoupon.code})</span>
                <span>-₹{breakdown.discountAmount}</span>
              </div>
            )}
            <div><span>Delivery Charge </span><span>₹{breakdown.deliveryCharge}</span></div>
            <div className="order-summary-card__total">
              <span>Total</span><span>₹{breakdown.total}</span>
            </div>
          </>
        )}
      </div>


    </div>
  );
}


// -------------------------------------------------------------------
// Component: PaymentDetails
// Handles payment method selection and displays relevant input fields.
// Includes Razorpay integration with automatic order placement after payment verification.
// -------------------------------------------------------------------
function PaymentDetails({
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
  loadingPrices
}) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  // Automatically verify payment for Cash on Delivery
  useEffect(() => {
    if (paymentMethod === "Cash on Delivery") {
      onPaymentVerified(false);
    }
  }, [paymentMethod, onPaymentVerified]);

  const isCODAllowed =
    selectedAddress &&
    selectedAddress.city &&
    selectedAddress.city.toLowerCase() === "gwalior";

  // Payment methods available: Razorpay always; Cash on Delivery conditionally.
  const availablePaymentMethods = ["Razorpay"].concat(
    isCODAllowed ? ["Cash on Delivery"] : []
  );

  // Razorpay payment handler with auto-order placement on verification
  const handleRazorpayPayment = async () => {
    try {
      setLoading(true);
      // Step 1: Create an order on the backend
      const orderResponse = await fetch(
        `${BACKEND}/api/payments/createOrder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
              // do NOT send name, price, etc. — the backend fetches these securely
            })),
          }),

        }
      );

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error("Order creation failed:", errorText);
        toast.error("Could not create order. Try again.");
        return;
      }

      const responseText = await orderResponse.text();
      console.log(responseText);
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

      // Step 2: Configure Razorpay options
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
          console.log("Razorpay response:", response);
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            response;

          // Step 3: Verify payment with backend
          const verifyRes = await fetch(
            `${BACKEND}/api/payments/verify-payment`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
              }),
            }
          );

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

            // Construct order details and trigger automatic order placement.
            const newOrder = {
              id: Date.now(),
              date: new Date().toISOString().split("T")[0],
              amount: breakdown.total,
              status: "Order Placed",
              progressStep: 1,
              verified: true,
              items: selectedItems,
              transactionId: razorpay_payment_id,
            };
            // Call callback from Checkout to create the order immediately.
            onRazorpaySuccess(newOrder);
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

      // Open Razorpay Checkout
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Payment failed. Please try again.");
    }
  };

  return (
    <div className="payment-details">
      <div className="payment-summary">
        <div
          className="summary-header"
          onClick={() => setSummaryExpanded(!summaryExpanded)}
        >
          <span className="payment-total-price">
            Total Price: ₹{breakdown.total}
          </span>
          <span className="toggle-icon">{summaryExpanded ? "▲" : "▼"}</span>
        </div>
        {summaryExpanded && (
          <div className="summary-details">
            <p>Please review your price details below:</p>
            {loadingPrices ? (
              <p>Loading breakdown...</p>
            ) : (
              <>
                <p>
                  <strong>Original Price:</strong> ₹{breakdown.originalTotal}
                </p>
                <p>
                  <strong>Product Discount:</strong> -₹
                  {breakdown.originalTotal - breakdown.productTotal}
                </p>
                {appliedCoupon && (
                  <p style={{ color: "green", fontWeight: 600 }}>
                    <strong>Coupon ({appliedCoupon.code}):</strong> -₹
                    {breakdown.discountAmount}
                  </p>
                )}
                <p>
                  <strong>Delivery Charge:</strong> ₹{breakdown.deliveryCharge}
                </p>
                <p className="total-price-display">
                  <strong>Total Price:</strong> ₹{breakdown.total}
                </p>
              </>
            )}
          </div>
        )}


      </div>
      <h2>Payment Options</h2>
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
      <div className="payment-method-content">
        {paymentMethod === "Razorpay" && (
          <div className="razorpay-payment-content">
            {/* If payment is not yet verified, show "Pay Now" */}
            <button
              onClick={handleRazorpayPayment}
              className="razorpay-pay-btn btn btn-outline-primary"
              disabled={false}
            >
              {loading ? "Loading" : "Pay Now"}
            </button>
          </div>
        )}
        {paymentMethod === "Cash on Delivery" && (
          <div className="cod-payment-content">
            <p>
              You have selected Cash on Delivery. No online payment is required.
              Please prepare the exact amount for the delivery agent.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Component: Confirmation
// Displays order confirmation and navigation options after order placement.
// -------------------------------------------------------------------
function Confirmation({ resetCheckout }) {
  const navigate = useNavigate();
  return (
    <div className="confirmation">
      <h2>Order Confirmed!</h2>
      <p>Thank you for your purchase. Your order is being processed.</p>
      <button onClick={() => navigate("/")} className="btn btn-secondary">
        Back to Home
      </button>
      <button onClick={() => navigate("/myorder")} className="btn btn-primary">
        View My Orders
      </button>
    </div>
  );
}

// -------------------------------------------------------------------
// Main Component: Checkout
// Orchestrates the checkout process: address selection, order summary,
// payment, and confirmation.
// -------------------------------------------------------------------
export default function Checkout() {
  const navigate = useNavigate();
  const { orders, setOrders, getorders } = useContext(OrderContext);
  const { setCart } = useContext(CartContext);
  const { userdetails, address } = useContext(UserContext);
  // Steps: 1 = Address, 2 = Order Summary, 3 = Payment, 4 = Confirmation
  const [step, setStep] = useState(1);
  // Address-related state
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    state: "",
    country: "",
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const addressFieldsOrder = [
    "name",
    "phone",
    "address",
    "postalCode",
    "city",
    "state",
    "country",
  ];
  // Retrieve selected items from localStorage
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

  // server‑computed totals
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


  const deliveryCharge = 0;
  const originalTotal = selectedItems.reduce(
    (acc, item) =>
      acc + Math.floor(item?.product?.oprice) * (item?.quantity || 1),
    0
  );
  const productTotal = selectedItems.reduce(
    (acc, item) =>
      acc +
      Math.floor(
        item?.product?.oprice -
        (item?.product?.discount / 100) * item?.product?.oprice
      ) *
      item?.quantity,
    0
  );
  const couponDiscountAmount = appliedCoupon
    ? appliedCoupon.discountType === "percent"
      ? Math.floor((appliedCoupon.discountValue / 100) * productTotal)
      : appliedCoupon.discountValue
    : 0;

  const discountCalculated = originalTotal - productTotal;
  const totalPrice = Math.max(
    Math.floor(productTotal + deliveryCharge - couponDiscountAmount),
    0
  );

  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [upiId, setUpiId] = useState("");
  const [verifiedUpi] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState("PhonePe");
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // -------------------------------------------------------------------
  // Handler: Validate postalCode and auto-fill address fields
  // -------------------------------------------------------------------
  const handlePincodeBlur = async () => {
    const { postalCode } = newAddress;
    if (postalCode.length !== 6) {
      alert("Pincode must be 6 digits.");
      return;
    }
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${postalCode}`
      );
      const data = await response.json();
      if (data[0].Status === "Success" && data[0].PostOffice.length > 0) {
        const location = data[0].PostOffice[0];
        setNewAddress((prev) => ({
          ...prev,
          city: location.District,
          state: location.State,
          country: location.Country,
        }));
      } else {
        alert("Invalid Pincode or no location data found.");
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      alert("Failed to fetch location from pincode.");
    }
  };

  // -------------------------------------------------------------------
  // Handler: Save new address or update existing address in database
  // -------------------------------------------------------------------
  const saveAddressInDb = async (address) => {
    try {
      await db
        .insert(UserAddressTable)
        .values({ ...address, userId: userdetails.id });
    } catch (error) {
      console.log(error);
    }
  };

  const updatedAddressesInDb = async (address) => {
    try {
      await db
        .update(UserAddressTable)
        .set({ ...address })
        .where(eq(UserAddressTable.id, address.id));
    } catch (error) {
      console.log(error);
    }
  };

  // -------------------------------------------------------------------
  // Handler: Save or update address locally and in the database
  // -------------------------------------------------------------------
  const handleSaveAddress = () => {
    const requiredFields = [
      "name",
      "phone",
      "address",
      "city",
      "postalCode",
      "state",
      "country",
    ];
    const isEmptyField = requiredFields.some(
      (field) => !newAddress[field] || newAddress[field].trim() === ""
    );

    if (isEmptyField) {
      alert(
        "Please fill in all the required fields before saving the address."
      );
      return;
    }

    if (editingIndex !== null) {
      const updatedAddresses = [...addresses];
      updatedAddresses[editingIndex] = newAddress;
      setAddresses(updatedAddresses);
      setSelectedAddress(newAddress);
      updatedAddressesInDb(newAddress);
      setEditingIndex(null);
    } else if (selectedAddress) {
      const index = addresses.findIndex(
        (addr) => addr.postalCode === selectedAddress.postalCode
      );
      if (index !== -1) {
        const updatedAddresses = [...addresses];
        updatedAddresses[index] = newAddress;
        setAddresses(updatedAddresses);
        updatedAddressesInDb(newAddress);
        setSelectedAddress(newAddress);
      } else {
        setAddresses([...addresses, newAddress]);
        saveAddressInDb(newAddress);
        setSelectedAddress(newAddress);
      }
    } else {
      setAddresses([...addresses, newAddress]);
      saveAddressInDb(newAddress);
      setSelectedAddress(newAddress);
    }
    setNewAddress({
      name: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      state: "",
      country: "",
    });
  };

  // -------------------------------------------------------------------
  // Handler: Edit an existing address
  // -------------------------------------------------------------------
  const handleEditAddress = (index) => {
    setNewAddress(addresses[index]);
    setEditingIndex(index);
  };

  // -------------------------------------------------------------------
  // Handler: Delete an address and clear selection if needed
  // -------------------------------------------------------------------
  const handleDeleteAddress = async (index) => {
    const addressToDelete = addresses[index];
    try {
      await db
        .delete(UserAddressTable)
        .where(eq(UserAddressTable.postalCode, addressToDelete.postalCode));

      const updatedAddresses = addresses.filter((_, i) => i !== index);
      setAddresses(updatedAddresses);

      if (
        selectedAddress &&
        addressToDelete.postalCode === selectedAddress.postalCode
      ) {
        setSelectedAddress(null);
      }
      toast.success("Address deleted successfully.");
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address. Please try again.");
    }
  };

  // -------------------------------------------------------------------
  // Function: createorder
  // Creates the order in the database, stores address, order items, and clears cart.
  // -------------------------------------------------------------------
  const createorder = async (newOrder, selectedAddress) => {
    if (paymentMethod === "UPI" && transactionId.length < 12) {
      toast.error("Please Fill the TransactionId");
      return;
    }
    try {
      setLoading(true);
      const now = new Date();
      const res = await db
        .insert(ordersTable)
        .values({
          phone: selectedAddress?.phone,
          totalAmount: newOrder?.amount,
          userId: userdetails?.id,
          createdAt: now.toString(),
          paymentMode: paymentMethod,
          transactionId: newOrder?.transactionId,
          paymentStatus:
            paymentMethod === "Cash on Delivery"
              ? "pending"
              : newOrder.verified
                ? "paid"
                : "failed",
        })
        .returning({
          id: ordersTable.id,
          totalAmount: ordersTable.totalAmount,
          createdAt: ordersTable.createdAt,
        });
      await db
        .insert(addressTable)
        .values({
          userId: userdetails.id,
          city: selectedAddress.city,
          country: selectedAddress.country,
          postalCode: selectedAddress?.postalCode,
          state: selectedAddress.state,
          street: selectedAddress.address,
        })
        .returning(addressTable);

      const orderItemsData = selectedItems.map((item) => ({
        orderId: res[0].id,
        productId: item.product.id,
        productName: item.product.name,
        img: item.product.imageurl,
        size: item.product.size,
        quantity: item.quantity,
        price: Math.floor(
          item.product.oprice -
          (item.product.discount / 100) * item.product.oprice
        ),
        totalPrice: Math.floor(
          item.product.oprice -
          (item.product.discount / 100) * item.product.oprice
        ) * item.quantity,
      }));

      console.log("🧾 Order items to insert:", orderItemsData);

      await db.insert(orderItemsTable).values(orderItemsData);
      await db
        .delete(addToCartTable)
        .where(eq(addToCartTable.userId, userdetails.id));
      toast.success("Order Placed");
      setCart([]);
      await getorders(); // ✅ refresh order context
      setLoading(false);
      setStep(3);
    } catch (error) {
      console.log(error);
    }
  };

  // -------------------------------------------------------------------
  // Handler: Automatic order placement after Razorpay payment success.
  // This function is passed to PaymentDetails.
  // -------------------------------------------------------------------
  const handleRazorpaySuccess = (newOrder) => {
    // Add order to context and create in DB.
    createorder(newOrder, selectedAddress);
    setOrders((prevOrders) => [...prevOrders, newOrder]);
    localStorage.removeItem("selectedItems");
  };

  // -------------------------------------------------------------------
  // Handler: Place Order for Cash on Delivery.
  // -------------------------------------------------------------------
  const handlePlaceOrder = () => {
    if (selectedItems.length === 0) {
      alert("No items selected for the order.");
      return;
    }
    const newOrder = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      amount: totalPrice,
      status: "Order Placed",
      progressStep: 1,
      items: selectedItems,
    };
    createorder(newOrder, selectedAddress);
    setOrders((prevOrders) => [...prevOrders, newOrder]);
    localStorage.removeItem("selectedItems");
  };

  // -------------------------------------------------------------------
  // Navigation handlers: Next and Previous steps in checkout
  // -------------------------------------------------------------------
  const handleNext = () => {
    if (step === 1 && !selectedAddress) {
      if (newAddress.name && newAddress.address && newAddress.postalCode) {
        setSelectedAddress(newAddress);
        setNewAddress({
          name: "",
          phone: "",
          address: "",
          city: "",
          postalCode: "",
          state: "",
          country: "",
        });
      } else {
        alert("Please select or enter a valid address.");
        return;
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

  useEffect(() => {
    setAddresses(address);
  }, [address]);

  return (
    <div className="checkout-wrapper">
      {/* HEADER */}
      <div className="checkout-header">
        <div className="absolute top-2">
          <ToastContainer />
        </div>
        <h1>Checkout</h1>
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

      {/* BODY */}
      <div className="checkout-body">
        {/* LEFT COLUMN: step-specific content + nav */}
        <div className="checkout-main">
          {step === 1 && (
            <AddressSelection
              addresses={addresses}
              selectedAddress={selectedAddress}
              setSelectedAddress={setSelectedAddress}
              selectedAddressIndex={selectedAddressIndex}
              setSelectedAddressIndex={setSelectedAddressIndex}
              newAddress={newAddress}
              setNewAddress={setNewAddress}
              handleSaveAddress={handleSaveAddress}
              handlePincodeBlur={handlePincodeBlur}
              handleEditAddress={handleEditAddress}
              handleDeleteAddress={handleDeleteAddress}
              addressFieldsOrder={addressFieldsOrder}
              editingIndex={editingIndex}
              setEditingIndex={setEditingIndex} // ← add this
              emptyAddress={{
                name: "",
                phone: "",
                address: "",
                city: "",
                postalCode: "",
                state: "",
                country: "",
              }} // ← and this
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
              productTotal={productTotal}
              discountCalculated={discountCalculated}
              deliveryCharge={deliveryCharge}
              totalPrice={totalPrice}
              selectedAddress={selectedAddress}
              userdetails={userdetails}
              selectedItems={selectedItems}
              onRazorpaySuccess={handleRazorpaySuccess}
              appliedCoupon={appliedCoupon}
              couponDiscountAmount={couponDiscountAmount}
              breakdown={breakdown}
              loadingPrices={loadingPrices}
            />

          )}

          {step === 3 && <Confirmation resetCheckout={resetCheckout} />}

          {/* NAV BUTTONS */}
          <div className="checkout-nav-buttons">
            {/* “Back” or “Back to Cart” */}
            <button onClick={handlePrev} className="btn btn-outline">
              {step === 1 ? "Back to Cart" : "Back"}
            </button>

            {/* “Next” only on step 1 */}
            {step === 1 && (
              <button onClick={handleNext} className="btn btn-primary">
                Next
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: order summary */}
        <aside className="checkout-summary">
          <OrderSummary
            selectedAddress={selectedAddress}
            selectedItems={selectedItems}
            deliveryCharge={deliveryCharge}
            appliedCoupon={appliedCoupon}
            couponDiscountAmount={couponDiscountAmount}
            breakdown={breakdown}
            loadingPrices={loadingPrices}
          />
        </aside>
      </div>
    </div>
  );
}
