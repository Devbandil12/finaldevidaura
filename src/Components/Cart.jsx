import React, { useState, useEffect, useContext, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";

// Assume these contexts are available from your project
import { ProductContext } from "../contexts/productContext";
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext";
import { CouponContext } from "../contexts/CouponContext";

import { toast } from "react-toastify";
import Loader from "./Loader"; // Assuming Loader component is present

const ShoppingCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useUser();

  const { products } = useContext(ProductContext);
  const { userdetails } = useContext(UserContext);
  const {
    cart,
    buyNow,
    changeCartQuantity,
    removeFromCart,
    clearCart,
    addToWishlist,
    isCartLoading,
    startBuyNow,
    clearBuyNow,
    addToCart,
  } = useContext(CartContext);
  const { availableCoupons, isCouponValid, loadAvailableCoupons, validateCoupon } =
    useContext(CouponContext);

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [manualCouponCode, setManualCouponCode] = useState("");

  const isBuyNowActive = !!buyNow;
  const itemsToRender = isBuyNowActive ? [buyNow] : cart;

  // Load coupons when user details are available.
  useEffect(() => {
    if (userdetails?.id) {
      loadAvailableCoupons(userdetails.id);
    }
  }, [userdetails?.id, loadAvailableCoupons]);

  // Cleanup temporary buy-now state when leaving the page.
  useEffect(() => {
    return () => {
      if (isBuyNowActive) {
        clearBuyNow();
      }
    };
  }, [isBuyNowActive, clearBuyNow]);

  const handleCheckout = () => {
    if (!itemsToRender.length) {
      toast.error("Your cart is empty.");
      return;
    }

    const fullCartItems = itemsToRender.map((item) => {
      const price = Math.floor(
        item.product.oprice * (1 - item.product.discount / 100)
      );
      return {
        product: {
          id: item.product.id,
          name: item.product.name,
          imageurl: item.product.imageurl[0],
          size: item.product.size,
          oprice: item.product.oprice,
          discount: item.product.discount,
          price,
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

  const handleQuantityChange = (item, delta) => {
    const nextQty = Math.max(1, (item.quantity || 1) + delta);
    if (isBuyNowActive) {
      startBuyNow(item.product, nextQty);
    } else {
      changeCartQuantity(item.product, nextQty);
    }
  };

  const handleRemove = (item) => {
    if (isBuyNowActive) {
      clearBuyNow();
    } else {
      removeFromCart(item.product);
    }
  };

  const moveToWishlist = async (entry) => {
    const product = entry.product;
    const ok = await addToWishlist(product);

    if (ok) {
      if (isBuyNowActive) {
        clearBuyNow();
      } else {
        await removeFromCart(product);
      }
      toast.success("Moved to wishlist");
    } else {
       toast.info("Already in wishlist");
    }
  };

  const handleApplyCoupon = useCallback(async (coupon) => {
    const validated = await validateCoupon(coupon.code, userdetails?.id);
    if (validated) {
      if (isCouponValid(validated, itemsToRender)) {
        setAppliedCoupon(validated);
        toast.success(`Coupon ${validated.code} applied!`);
      } else {
        setAppliedCoupon(null);
      }
    } else {
      setAppliedCoupon(null);
    }
  }, [itemsToRender, userdetails?.id, isCouponValid, validateCoupon]);

  const handleManualApply = async () => {
    if (!manualCouponCode) {
      return toast.error("Please enter a coupon code");
    }
    const validated = await validateCoupon(manualCouponCode, userdetails?.id);
    if (validated) {
      if (isCouponValid(validated, itemsToRender)) {
        setAppliedCoupon(validated);
        toast.success(`Coupon ${validated.code} applied!`);
      } else {
        setAppliedCoupon(null);
      }
    } else {
      setAppliedCoupon(null);
    }
  };

  const renderRemainingProducts = () =>
    !isBuyNowActive &&
    products
      .filter((p) => !cart.some((c) => c.product?.id === p.id))
      .map((product) => {
        const price = Math.trunc(
          product.oprice * (1 - product.discount / 100)
        );
        return (
          <div key={product.id} className="flex flex-col items-center p-4 border border-gray-200 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md">
            <img src={product.imageurl[0]} alt={product.name} className="w-full h-32 object-contain rounded-md mb-3" />
            <div className="text-center mb-2">
              <h3 className="text-base font-semibold text-gray-800">{product.name}</h3>
              <span className="text-sm text-gray-500">{product.size} ml</span>
            </div>
            <div className="flex flex-col items-center mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-green-600">
                  ₹{price}
                </span>
                <span className="text-sm text-gray-400 line-through">₹{product.oprice}</span>
              </div>
              <span className="text-xs font-medium text-green-600 mt-1">{product.discount}% Off</span>
            </div>
            <button
              className="w-full py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200 text-sm font-medium"
              onClick={() => addToCart(product, 1)}
            >
              Add to Cart
            </button>
          </div>
        );
      });

  const activeCart = itemsToRender;
  const totalOriginal = activeCart.reduce(
    (sum, i) => sum + (i.product?.oprice ?? 0) * (i.quantity || 1),
    0
  );
  const totalDiscounted = activeCart.reduce((sum, i) => {
    const price = Math.floor(
      (i.product?.oprice ?? 0) * (1 - (i.product?.discount ?? 0) / 100)
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
      toast.info("Coupon no longer valid");
    }
  }, [activeCart, appliedCoupon, isCouponValid]);

  if (!isBuyNowActive && isCartLoading) {
    return <Loader text="Loading cart..." />;
  }

  return (
    <div className="font-sans min-h-screen bg-gray-50 text-gray-900">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          {isBuyNowActive ? "Buy Now" : "Your Shopping Cart"}
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-grow lg:w-2/3 space-y-6">
            {activeCart.length > 0 ? (
              activeCart.map((item) => (
                <div key={item.product.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm bg-white transition-all duration-300 hover:shadow-md">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={item.product.imageurl[0]}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-md border border-gray-100"
                    />
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-800">{item.product.name}</h3>
                      <span className="text-sm text-gray-500">{item.product.size} ml</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        onClick={() => handleQuantityChange(item, -1)}
                        className="p-2 text-gray-700 hover:bg-gray-100 rounded-l-md transition-colors duration-200 text-lg"
                        aria-label="Decrease quantity"
                      >
                        –
                      </button>
                      <span className="px-4 text-base font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item, 1)}
                        className="p-2 text-gray-700 hover:bg-gray-100 rounded-r-md transition-colors duration-200 text-lg"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right flex flex-col items-center sm:items-end">
                      <span className="text-lg font-bold text-gray-800">
                        ₹
                        {Math.floor(
                          item.product.oprice * (1 - item.product.discount / 100)
                        )}
                      </span>
                      <span className="text-sm text-gray-400 line-through">₹{item.product.oprice}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-4 sm:mt-0 w-full sm:w-auto justify-center sm:justify-end">
                    <button
                      className="text-sm text-gray-600 hover:text-red-600 transition-colors duration-200 p-2 rounded-md hover:bg-gray-100"
                      onClick={() => handleRemove(item)}
                    >
                      Remove
                    </button>
                    <button
                      className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200 p-2 rounded-md hover:bg-gray-100"
                      onClick={() => moveToWishlist(item)}
                    >
                      Wishlist
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500 text-lg border border-gray-200 rounded-lg bg-white shadow-sm">
                Your cart is empty.
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3 p-6 bg-white border border-gray-200 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="border-b border-gray-200 pb-4 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Total:</span>
                <span>₹{totalOriginal}</span>
              </div>
              <div className="flex justify-between text-gray-700 font-semibold">
                <span>Discounted Total:</span>
                <span className={appliedCoupon ? "text-green-600" : ""}>₹{finalPrice}</span>
              </div>
            </div>

            {/* Coupon Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Apply Coupon</h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                  <span className="text-green-700 font-medium">
                    Coupon <strong className="text-green-800">{appliedCoupon.code}</strong> applied!
                  </span>
                  <button
                    onClick={() => setAppliedCoupon(null)}
                    className="text-sm text-red-600 hover:text-red-800 transition-colors duration-200 font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={manualCouponCode}
                    onChange={(e) => setManualCouponCode(e.target.value.toUpperCase())}
                    className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none transition-all duration-200"
                  />
                  <button
                    onClick={handleManualApply}
                    className="px-5 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200 font-medium"
                  >
                    Apply
                  </button>
                </div>
              )}

              <div className="available-coupons-section mt-4">
                <h4 className="text-md font-semibold mb-2">Available Coupons</h4>
                {availableCoupons.length > 0 ? (
                  <div className="space-y-2">
                    {availableCoupons.map((coupon) => {
                      const isSelected = appliedCoupon?.id === coupon.id;
                      return (
                        <div
                          key={coupon.id}
                          className={`p-3 border rounded-md cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "bg-green-50 border-green-300 text-green-700"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800"
                          }`}
                          onClick={async () => {
                            if (isSelected) {
                              setAppliedCoupon(null);
                              toast.info("Coupon removed.");
                            } else {
                              await handleApplyCoupon(coupon);
                            }
                          }}
                        >
                          <strong className={isSelected ? "text-green-800" : "text-gray-900"}>{coupon.code}</strong>{" "}
                          –{" "}
                          <span className="font-semibold text-green-600">
                            {coupon.discountType === "percent"
                              ? `${coupon.discountValue}% off`
                              : `₹${coupon.discountValue} off`}
                          </span>
                          <br />
                          <small className="text-gray-500">{coupon.description}</small>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <small className="text-gray-500">No coupons available right now</small>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
              {!isBuyNowActive && (
                <button
                  onClick={clearCart}
                  className="w-full py-3 border border-gray-400 text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium"
                >
                  Clear Cart
                </button>
              )}
              <button
                id="checkout-button"
                className="w-full py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200 font-semibold"
                disabled={!itemsToRender.length}
                onClick={handleCheckout}
              >
                {isBuyNowActive ? "Buy Now" : "Checkout"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Explore More Section */}
      {!isBuyNowActive && (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 mt-8 border-t border-gray-200">
          <h3 className="text-2xl font-bold text-center mb-6">Explore more</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {renderRemainingProducts()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;

