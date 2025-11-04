import React, { useState, useEffect, useContext, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { ProductContext } from "../contexts/productContext";
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext";
import { CouponContext } from "../contexts/CouponContext";

import Loader from "./Loader";
import MiniLoader from "./MiniLoader";
import HeroButton from "./HeroButton";
import { FaShoppingCart, FaTrashAlt } from "react-icons/fa";
import { FiGift, FiCheckCircle, FiX } from "react-icons/fi";

const ShoppingCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useUser();
  const [checkoutError, setCheckoutError] = useState("");
  const [pincode, setPincode] = useState("");
  const [pincodeDetails, setPincodeDetails] = useState(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null); 

  const { products } = useContext(ProductContext); 
  const { userdetails } = useContext(UserContext);
  const {
    cart,
    buyNow,
    changeCartQuantity,
    removeFromCart,
    clearCart,
    isCartLoading,
    startBuyNow,
    clearBuyNow,
    addToCart,
    moveToWishlist,
  } = useContext(CartContext);
  const { availableCoupons, isCouponValid, loadAvailableCoupons, validateCoupon } =
    useContext(CouponContext);

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [manualCouponCode, setManualCouponCode] = useState("");

  const isBuyNowFromNavigation = location.state?.isBuyNow;
  const isBuyNowActive = isBuyNowFromNavigation || !!buyNow;
  const itemsToRender = isBuyNowActive && buyNow ? [buyNow] : cart;

  const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");


 useEffect(() => {
    if (userdetails?.id) {
      loadAvailableCoupons(userdetails.id);
    }
  }, [userdetails?.id, loadAvailableCoupons]);
  useEffect(() => {
    // Check for valid items. If buyNow is active but item is null, redirect.
    if (isBuyNowActive && !buyNow) {
      navigate("/cart", { replace: true, state: {} });
      return;
    }
    
    const isAnyItemOutOfStock = itemsToRender.some(
      (item) => item.variant && item.variant.stock <= 0
    );
    if (!isAnyItemOutOfStock) {
      setCheckoutError("");
    }
  }, [itemsToRender, isBuyNowActive, buyNow, navigate, setCheckoutError]);

  const handlePincodeChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setPincode(value);
      if (pincodeDetails) {
        setPincodeDetails(null);
      }
    }
  };

  async function checkDeliveryAvailability() {
    if (!/^\d{6}$/.test(pincode)) {
      return window.toast.error("Please enter a valid 6-digit pincode.");
    }
    setPincodeLoading(true);
    setPincodeDetails(null);
    try {
      const res = await fetch(`${API_BASE}/api/address/pincode/${pincode}`);
      const data = await res.json();
      if (data.success) {
        setPincodeDetails(data.data);
      } else {
        window.toast.error(data.msg || "Failed to check pincode");
      }
    } catch (err) {
      console.error("checkDeliveryAvailability error:", err);
      window.toast.error("Network error while checking pincode");
    } finally {
      setPincodeLoading(false);
    }
  }

  const handleCheckout = () => {
    setCheckoutError("");
    if (!itemsToRender.length) {
      window.toast.error("Your cart is empty.");
      return;
    }
    const outOfStockItem = itemsToRender.find(
      (item) => item.variant.stock <= 0
    );
    if (outOfStockItem) {
      setCheckoutError(
        `Sorry, "${outOfStockItem.product.name} (${outOfStockItem.variant.name})" is out of stock. Please remove it.`
      );
      return;
    }

    const fullCartItems = itemsToRender.map((item) => {
      const price = Math.floor(
        item.variant.oprice * (1 - item.variant.discount / 100)
      );
      const imageUrl = (Array.isArray(item.product.imageurl) && item.product.imageurl.length > 0) 
                       ? item.product.imageurl[0] 
                       : null;
      return {
        product: { 
          id: item.product.id,
          name: item.product.name,
          imageurl: imageUrl, 
        },
        variant: { 
          id: item.variant.id,
          name: item.variant.name,
          size: item.variant.size,
          oprice: item.variant.oprice,
          discount: item.variant.discount,
          price: price, 
        },
        quantity: item.quantity || 1,
        totalPrice: price * (item.quantity || 1),
      };
    });
    localStorage.setItem("selectedItems", JSON.stringify(fullCartItems));
    localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
    
    if (!isSignedIn) {
      sessionStorage.setItem("post_login_redirect", "/checkout");
      navigate("/login", { replace: true });
      return;
    }
    sessionStorage.setItem("checkout_intent", JSON.stringify({ ts: Date.now() }));
    navigate("/checkout");
  };

  // 🟢 FIXED: Swapped item.product and item.variant
  const handleQuantityChange = (item, delta) => {
    const nextQty = Math.max(1, (item.quantity || 1) + delta);
    if (isBuyNowActive) {
      // startBuyNow expects (product, variant, qty)
      startBuyNow(item.product, item.variant, nextQty);
    } else {
      // changeCartQuantity expects (variant, qty)
      changeCartQuantity(item.variant, nextQty);
    }
  };

  const handleRemove = (item) => {
    if (isBuyNowActive) {
      clearBuyNow();
    } else {
      removeFromCart(item.variant);
    }
  };

  const handleMoveToWishlist = async (entry) => {
    const ok = await moveToWishlist(entry.product, entry.variant); 
    if (ok && isBuyNowActive) {
      clearBuyNow();
    }
  };

  const handleApplyCoupon = useCallback(async (coupon) => {
    const validated = await validateCoupon(coupon.code, userdetails?.id);
    if (validated) {
      if (isCouponValid(validated, itemsToRender)) {
        setAppliedCoupon(validated);
        window.toast.success(`Coupon ${validated.code} applied!`);
      } else {
        setAppliedCoupon(null);
      }
    } else {
      setAppliedCoupon(null);
    }
  }, [itemsToRender, userdetails?.id, isCouponValid, validateCoupon]);

  const handleManualApply = async () => {
    if (!manualCouponCode) {
      return window.toast.error("Please enter a coupon code");
    }
    const validated = await validateCoupon(manualCouponCode, userdetails?.id);
    if (validated) {
      if (isCouponValid(validated, itemsToRender)) {
        setAppliedCoupon(validated);
        window.toast.success(`Coupon ${validated.code} applied!`);
      } else {
        setAppliedCoupon(null);
      }
    } else {
      setAppliedCoupon(null);
    }
  };

  const handleAddToCart = (variant, product) => {
    if (addingProductId) return;
    setAddingProductId(variant.id); 
    addToCart(product, variant, 1); 
    setTimeout(() => {
      setAddingProductId(null);
    }, 1500);
  };

  const handleExitBuyNow = () => {
    clearBuyNow();
    navigate('/cart', { replace: true, state: {} });
  };

  const renderRemainingProducts = () =>
    !isBuyNowActive &&
    products
      .filter((p) => p.variants && p.variants.length > 0) 
      .map((product) => {
        const cheapestVariant = product.variants.reduce(
          (cheapest, current) => (current.oprice < cheapest.oprice ? current : cheapest),
          product.variants[0]
        );
        
        const inCart = cart.some((c) => c.variant?.id === cheapestVariant.id);
        if (inCart) return null; 
        
        const price = Math.trunc(
          cheapestVariant.oprice * (1 - cheapestVariant.discount / 100)
        );
        const isAdding = addingProductId === cheapestVariant.id;

        // Add fallback for product image here
        const imageUrl = (Array.isArray(product.imageurl) && product.imageurl.length > 0)
                         ? product.imageurl[0]
                         : "/placeholder.png"; 

        return (
          <motion.div
            key={product.id} 
            className="bg-white rounded-xl overflow-hidden flex flex-col transition-shadow shadow-lg border border-gray-100 shadow-gray-200/50 transition-shadow duration-300 group"
            layout
          >
            <div className="relative overflow-hidden">
              <img
                src={imageUrl} // Use the safe imageUrl
                alt={product.name}
                className="w-full h-40 object-cover block cursor-pointer transition-transform duration-300 group-hover:scale-105"
                onClick={() => navigate(`/product/${product.id}`)}
              />
              <div
                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <span className="text-sm font-semibold">Quick View</span>
              </div>
            </div>
            <div className="p-4 flex-grow flex flex-col justify-between text-left">
              <div>
                <div className="mb-2 flex justify-between items-baseline">
                  <h3
                    className="font-semibold text-sm leading-tight inline cursor-pointer hover:underline"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {product.name}
                  </h3>
                  <span className="text-xs text-gray-500">{cheapestVariant.size} ml</span>
                </div>

                <div className="flex justify-between items-baseline mb-4">
                  <div className="flex items-baseline gap-2">
                    <p className="font-bold text-base">₹{price}</p>
                    <p className="text-sm text-gray-500 line-through">₹{cheapestVariant.oprice}</p>
                  </div>
                  <span className="text-green-600 text-sm font-semibold">
                    {cheapestVariant.discount}% OFF
                  </span>
                </div>
              </div>
              <HeroButton
                onClick={() => handleAddToCart(cheapestVariant, product)} 
                disabled={isAdding}
                className={`w-full text-sm font-semibold flex justify-center py-2 items-center gap-2 transition-colors duration-300 ${isAdding ? '!bg-green-600 !text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={isAdding ? "adding" : "add"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    {isAdding ? (
                      <>Added <FiCheckCircle /></>
                    ) : (
                      <>Add to Cart <FaShoppingCart /></>
                    )}
                  </motion.span>
                </AnimatePresence>
              </HeroButton>
            </div>
          </motion.div>
        );
      });

  const activeCart = itemsToRender;
  const totalOriginal = activeCart.reduce(
    (sum, i) => sum + (i.variant?.oprice ?? 0) * (i.quantity || 1),
    0
  );
  const totalDiscounted = activeCart.reduce((sum, i) => {
    const price = Math.floor(
      (i.variant?.oprice ?? 0) * (1 - (i.variant?.discount ?? 0) / 100)
    );
    return sum + price * (i.quantity || 1);
  }, 0);

  let finalPrice = totalDiscounted;
  if (appliedCoupon) {
    const discountValue = appliedCoupon.discountValue ?? 0;
    finalPrice =
      appliedCoupon.discountType === "percent"
        ? Math.floor(finalPrice * (1 - discountValue / 100))
        : Math.max(0, finalPrice - discountValue);
  }

  useEffect(() => {
    if (appliedCoupon && !isCouponValid(appliedCoupon, activeCart)) {
      setAppliedCoupon(null);
      window.toast.info("Coupon no longer valid");
    }
  }, [activeCart, appliedCoupon, isCouponValid]);

  const isLoading = !isBuyNowActive && isCartLoading;

  return (
    <>
      <title>
        {isLoading
          ? "Loading Cart... | Devid Aura"
          : isBuyNowActive
          ? "Buy Now | Devid Aura"
          : "Shopping Cart | Devid Aura"}
      </title>
      <meta name="description" content="Review your selected items, apply coupons, and proceed to a secure checkout. Manage your Devid Aura shopping experience." />

      {isLoading ? (
        <Loader text="Loading cart..." />
      ) : (
        <main className="max-w-6xl mx-auto my-4 sm:my-8 px-4 w-full flex flex-col gap-8">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 pt-[50px]">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <FaShoppingCart />
              {isBuyNowActive ? "Buy Now" : "Shopping Cart"}
            </h1>

            {!isBuyNowActive && cart.length > 0 && (
              <motion.button
                onClick={clearCart}
                className="bg-transparent border border-gray-200 text-gray-500 py-2 px-4 rounded-xl cursor-pointer flex items-center gap-2 font-medium transition-colors duration-200 ease-in-out hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTrashAlt /> <span className="hidden sm:inline">Clear Cart</span>
              </motion.button>
            )}

            {isBuyNowActive && (
              <motion.button
                onClick={handleExitBuyNow}
                className="bg-transparent border border-gray-200 text-gray-500 py-2 px-4 rounded-xl cursor-pointer flex items-center gap-2 font-medium transition-colors duration-200 ease-in-out hover:bg-gray-100 hover:text-gray-800"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiX /> <span className="hidden sm:inline">Exit Buy Now</span>
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] lg:items-start gap-8">
            <motion.div layout className="flex flex-col gap-6">
              <AnimatePresence>
                {activeCart.length > 0 ? (
                  activeCart.map((item) => {
                    // This check prevents crash if item is null or malformed
                    if (!item || !item.product || !item.variant) {
                      return null;
                    }

                    // Add fallback for cart item image
                    const itemImageUrl = (Array.isArray(item.product.imageurl) && item.product.imageurl.length > 0)
                                         ? item.product.imageurl[0]
                                         : "/placeholder.png"; 

                    return (
                      <motion.div
                        key={item.variant.id} // Use variant.id as key
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="flex flex-row items-center gap-2 sm:gap-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100 shadow-gray-200/50 transition-shadow">
                          <img
                            src={itemImageUrl} // Use the safe itemImageUrl
                            alt={item.product.name}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-grow w-full text-left">
                            <h2 className="text-base sm:text-lg font-semibold mb-1">{item.product.name}</h2>
                            <p className="text-xs sm:text-sm text-gray-500">{item.variant.size} ml</p>
                            <div className="flex items-baseline gap-2 mt-2 justify-start">
                              <span className="text-sm sm:text-base font-bold">
                                ₹{Math.floor(item.variant.oprice * (1 - item.variant.discount / 100))}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-500 line-through">₹{item.variant.oprice}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 sm:gap-4 flex-shrink-0">
                            <div className="flex items-center gap-1 sm:gap-2 border border-gray-200 rounded-xl overflow-hidden">
                              <button onClick={() => handleQuantityChange(item, -1)} disabled={item.quantity <= 1} className="bg-transparent border-none w-7 h-7 sm:w-9 sm:h-9 text-lg sm:text-xl cursor-pointer text-gray-800 transition-colors hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed">–</button>
                              <span className="font-semibold min-w-[20px] text-center text-sm sm:text-base">{item.quantity}</span>
                              <button onClick={() => handleQuantityChange(item, 1)} className="bg-transparent border-none w-7 h-7 sm:w-9 sm:h-9 text-lg sm:text-xl cursor-pointer text-gray-800 transition-colors hover:bg-gray-100">+</button>
                            </div>
                            <div className="flex gap-4 sm:gap-6 pt-3">
                              <button onClick={() => handleRemove(item)} className="bg-transparent border-none text-gray-500 cursor-pointer text-xs sm:text-sm font-medium  hover:text-gray-800">Remove</button>
                              <button onClick={() => handleMoveToWishlist(item)} className="bg-transparent border-none text-gray-500 cursor-pointer text-xs sm:text-sm font-medium  hover:text-gray-800">Wishlist</button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 bg-white rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50 transition-shadow">
                    <h3 className="text-lg mb-2">Your cart is empty.</h3>
                    <p className="text-gray-500">Looks like you haven't added anything to your cart yet.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="sticky top-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 shadow-gray-200/50 transition-shadow">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                <div className="flex justify-between mb-4 text-base"><span className="text-gray-500">Total MRP</span> <span className="font-semibold">₹{totalOriginal}</span></div>
                <div className="flex justify-between mb-4 text-base"><span className="text-gray-500">Discount</span> <span className="font-semibold text-green-600">- ₹{totalOriginal - totalDiscounted}</span></div>
                {appliedCoupon && (<div className="flex justify-between mb-4 text-base"><span className="text-gray-500">Coupon Discount</span> <span className="font-semibold text-green-600">- ₹{totalDiscounted - finalPrice}</span></div>)}
                <hr className="border-t border-gray-200 my-4" />
                <div className="flex justify-between mb-4 text-lg font-bold"><span >Final Amount</span> <span>₹{finalPrice}</span></div>

                <div className="mt-6">
                  <h3 className="flex items-center gap-2 font-semibold mb-4"><FiGift /> Apply Coupon</h3>
                  <div className="flex mb-4">
                    <input type="text" placeholder="Enter Coupon Code" value={manualCouponCode} onChange={(e) => setManualCouponCode(e.target.value.toUpperCase())} className="flex-grow min-w-0 border border-gray-200 px-4 rounded-l-xl h-11 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20" />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleManualApply} className="bg-black text-white border-none px-4 sm:px-6 rounded-r-xl cursor-pointer font-semibold flex-shrink-0">APPLY</motion.button>
                  </div>

                  {appliedCoupon && (
                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-full py-1 px-4 text-sm mb-4">
                      <span>APPLIED: <strong>{appliedCoupon.code}</strong></span>
                      <button onClick={() => setAppliedCoupon(null)} className="bg-transparent border-none cursor-pointer text-xl text-red-500 leading-none">✕</button>
                    </div>
                  )}

                  {availableCoupons.length > 0 && (
                    <div className="max-h-40 overflow-y-auto pr-2">
                      {availableCoupons.map((coupon) => {
                        const isSelected = appliedCoupon?.id === coupon.id;
                        return (
                          <motion.div
                            key={coupon.id}
                            onClick={async () => isSelected ? setAppliedCoupon(null) : await handleApplyCoupon(coupon)}
                            className={`border p-4 rounded-xl mb-2 cursor-pointer transition-colors duration-200 ease-in-out ${isSelected ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-black'}`}
                            whileTap={{ scale: 0.98 }}
                          >
                            <strong className="block mb-1">{coupon.code}</strong>
                            <small className="text-gray-500">{coupon.description}</small>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {checkoutError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-red-50 text-red-600 rounded-xl p-4 my-4 text-center text-sm font-semibold"
                    >
                      {checkoutError}
                    </motion.div>
                  )}
                </AnimatePresence>
                <HeroButton
                  className="w-full py-3 mt-4 text-base font-semibold bg-gray-200 text-gray-900 hover:bg-gray-300"
                  onClick={handleCheckout}
                >
                  {isBuyNowActive ? "Buy Now" : "Proceed to Checkout"}
                </HeroButton>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg border border-gray-100 shadow-gray-200/50 transition-shadow p-6 rounded-xl text-center">
            <h3 className="text-lg font-semibold mb-1">🚚 Check Delivery Availability</h3>
            <p className="text-gray-500 mb-4 text-sm">Enter your pincode to see if we can reach your doorstep.</p>
            <div className="flex max-w-sm mx-auto">
              <input type="text" value={pincode} onChange={handlePincodeChange} placeholder="Enter 6-digit Pincode" onKeyDown={(e) => e.key === 'Enter' && checkDeliveryAvailability()} maxLength="6" className="flex-grow min-w-0 border border-gray-200 px-4 rounded-l-xl h-11 text-center text-base focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20" />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={checkDeliveryAvailability}
                disabled={pincodeLoading || pincode.length !== 6}
                className="bg-black text-white border-none px-6 rounded-r-xl cursor-pointer font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center h-11"
              >
                {pincodeLoading ? <MiniLoader text="Checking..." /> : "CHECK"}
              </motion.button>
            </div>
            <AnimatePresence>
              {pincodeDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className={`mt-4 rounded-xl text-sm overflow-hidden`}
                >
                  <div className={`p-4 ${pincodeDetails.isServiceable ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                    {pincodeDetails.isServiceable ? (
                      <>
                        <p>🎉 Great news! We deliver to <strong>{pincode}</strong>.</p>
                        <p className="text-xs mt-1">Delivery Charge: <strong>₹{pincodeDetails.deliveryCharge}</strong> | Payment: <strong>{pincodeDetails.codAvailable ? 'COD & Online' : 'Online Only'}</strong></p>
                      </>
                    ) : (
                      <p>😔 Sorry! We don’t deliver to <strong>{pincode}</strong> yet.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!isBuyNowActive && products.length > cart.length && (
            <div className="pt-8 mt-8 border-t border-gray-200">
              <h2 className="text-3xl font-bold text-center mb-8">Explore More Products</h2>
              <div className="grid grid-cols-1 w-[80%] mx-auto min-[400px]:w-full min-[400px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 ">
                {renderRemainingProducts()}
              </div>
            </div>
          )}
        </main>
      )}
    </>
  );
};

export default ShoppingCart;