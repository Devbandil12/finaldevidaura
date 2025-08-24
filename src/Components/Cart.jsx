import React, { useState, useEffect, useContext, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import "../style/cart.css";

import { ProductContext } from "../contexts/productContext";
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext";
import { CouponContext } from "../contexts/CouponContext";

import { toast } from "react-toastify";
import Loader from "./Loader";

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


function HeroButton({ children, onClick, className = "", ...props }) {
  const handleClick = (e) => {
    const button = e.currentTarget;
    const circle = document.createElement("span");
    circle.classList.add("pulse");

    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    // Position relative to touch point
    const rect = button.getBoundingClientRect();
    const top = e.clientY - rect.top - radius;
    const left = e.clientX - rect.left - radius;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.top = `${top}px`;
    circle.style.left = `${left}px`;

    // Remove any existing pulse before adding a new one
    const oldPulse = button.querySelector(".pulse");
    if (oldPulse) oldPulse.remove();

    button.appendChild(circle);

    // Remove after animation ends
    circle.addEventListener("animationend", () => {
      circle.remove();
    });

    // Run passed onClick
    if (onClick) onClick(e);
  };

  return (
    <button className={`button-hero ${className}`} onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

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
          <div key={product.id} className="remaining-product-item">
            <img src={product.imageurl[0]} alt={product.name} />
            <div className="r-product-title">
              <h3>{product.name}</h3>
              <span>{product.size} ml</span>
            </div>
            <div className="product-price">
              <div className="price">
                <span style={{ color: "green", fontWeight: "bold" }}>
                  ₹{price}
                </span>
                <span className="old-price">₹{product.oprice}</span>
              </div>
              <span className="discount">{product.discount}% Off</span>
            </div>
            <button className="add-to-cart" onClick={() => addToCart(product, 1)}>
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
    <>
      <main className="main-container">
        <div className="cart-item-summary-container">
          <div className="cart-items-box">
            {activeCart.length > 0 ? (
              activeCart.map((item) => (
                <div key={item.product.id} className="cart-item">
                  <div className="product-content">
                    <img src={item.product.imageurl[0]} alt={item.product.name} />
                    <div className="title-quantity-price">
                      <div className="title-quantity">
                        <div className="product-title">
                          <h3>{item.product.name}</h3>
                          <span>{item.product.size} ml</span>
                        </div>
                        <div className="quantity-controls">
                          <button onClick={() => handleQuantityChange(item, -1)}>
                            –
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(item, 1)}>
                            +
                          </button>
                        </div>
                      </div>
                      <div className="item-price">
                        <span>
                          ₹
                          {Math.floor(
                            item.product.oprice * (1 - item.product.discount / 100)
                          )}
                        </span>
                        <span className="old-price">₹{item.product.oprice}</span>
                      </div>
                    </div>
                  </div>

                  <div className="procduct-shifting-buttons">
                    <button className="remove" onClick={() => handleRemove(item)}>
                      Remove
                    </button>
                    <button className="move-to-wishlist" onClick={() => moveToWishlist(item)}>
                      Move to Wishlist
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">Your cart is empty.</div>
            )}
          </div>

          <div className="cart-summary">
<h2 className="summary-title">Order Summary</h2>
<div className="cart-summary-price">
  <h3 className="row total">
    <span>Total:</span> <span>₹{totalOriginal}</span>
  </h3>
  <h3 className={`row final ${appliedCoupon ? "with-coupon" : ""}`}>
    <span>Final Price:</span> <span>₹{finalPrice}</span>
  </h3>
</div>

            <div className="cart-coupons">
  <h4>Apply Coupon</h4>

  {/* Manual input always visible */}
  <div className="coupon-box manual-input">
    <input
      type="text"
      placeholder="Enter coupon code"
      value={manualCouponCode}
      onChange={(e) => setManualCouponCode(e.target.value.toUpperCase())}
    />
    <button onClick={handleManualApply}>Apply</button>
  </div>

  {/* If coupon is applied, show as a pill/tag */}
  {appliedCoupon && (
    <div className="applied-tag">
      <span>{appliedCoupon.code}</span>
      <button onClick={() => setAppliedCoupon(null)}>×</button>
    </div>
  )}

  {/* Available coupons list */}
  <div className="available-coupons-section">
    <h4>Available Coupons</h4>
    {availableCoupons.length > 0 ? (
      availableCoupons.map((coupon) => {
        const isSelected = appliedCoupon?.id === coupon.id;
        return (
          <div
            key={coupon.id}
            className={`coupon-item ${isSelected ? "selected" : ""}`}
            onClick={async () => {
              if (isSelected) {
                setAppliedCoupon(null);
                toast.info("Coupon removed.");
              } else {
                await handleApplyCoupon(coupon);
              }
            }}
          >
            <strong>{coupon.code}</strong> –{" "}
            {coupon.discountType === "percent"
              ? `${coupon.discountValue}% off`
              : `₹${coupon.discountValue} off`}
            <br />
            <small>{coupon.description}</small>
          </div>
        );
      })
    ) : (
      <small>No coupons available right now</small>
    )}
  </div>
</div>


            <div className="cart-summary-button">
              {!isBuyNowActive && (
                <HeroButton id="clear-cart onClick={clearCart}>Clear Cart</HeroButton>
<HeroButton id="checkout-button"
                className="checkout"  onClick={handleCheckout}>
  {isBuyNowActive ? "Buy Now" : "Checkout"}
</HeroButton>

            </div>
          </div>
        </div>
      </main>

      {!isBuyNowActive && (
        <div id="remaining-products-container">
          <h3>Explore more</h3>
          <div id="remaining-products">{renderRemainingProducts()}</div>
        </div>
      )}
    </>
  );
};

export default ShoppingCart;