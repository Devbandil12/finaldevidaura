// src/pages/ShoppingCart.jsx
import React, { useState, useEffect, useContext } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import "../style/cart.css";

import { ProductContext } from "../contexts/productContext";
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext";
import { CouponContext } from "../contexts/CouponContext";

import { toast, ToastContainer } from "react-toastify";
import Loader from "./Loader";

const ShoppingCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
 const { isSignedIn } = useUser();
  const { products } = useContext(ProductContext);
  const { userdetails } = useContext(UserContext);

  const {
    cart,
    addToCart,
    removeFromCart,
    changeCartQuantity,
    clearCart,
    addToWishlist,
    wishlist,
    isCartLoading,
    getCartitems, // rehydrate when NOT in Buy Now
  } = useContext(CartContext);

  const { coupons, isCouponValid, loadAvailableCoupons } =
    useContext(CouponContext);

  // ---- Buy Now temp cart state ----
  const [buyNowCart, setBuyNowCart] = useState([]);
  const [isBuyNowActive, setIsBuyNowActive] = useState(false);

  // ---- Coupon state ----
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Hydrate temp Buy Now cart once
  useEffect(() => {
    const active = localStorage.getItem("buyNowActive") === "true";
    const item = localStorage.getItem("buyNowItem");
    if (active && item) {
      try {
        setBuyNowCart([JSON.parse(item)]);
        setIsBuyNowActive(true);
      } catch {
        localStorage.removeItem("buyNowItem");
        localStorage.removeItem("buyNowActive");
        setIsBuyNowActive(false);
      }
    } else {
      setIsBuyNowActive(false);
    }
  }, []);

  // Rehydrate main cart & coupons when NOT in Buy Now mode
  useEffect(() => {
    if (!isBuyNowActive && userdetails?.id) {
      getCartitems(); // avoid adding getCartitems to deps to prevent flicker loops
    }
    if (userdetails?.id) {
      loadAvailableCoupons(userdetails.id, import.meta.env.VITE_BACKEND_URL);
    }
    // Depend only on primitives to avoid effect loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBuyNowActive, userdetails?.id]);

  // Cleanup temp buy-now on route leave
  useEffect(() => {
    return () => {
      if (location.pathname !== "/cart") {
        localStorage.removeItem("buyNowItem");
        localStorage.removeItem("buyNowActive");
      }
    };
  }, [location.pathname]);

  // When Buy Now turns off, clear flags
  useEffect(() => {
    if (!isBuyNowActive) {
      localStorage.removeItem("buyNowItem");
      localStorage.removeItem("buyNowActive");
    }
  }, [isBuyNowActive]);

  // Choose active array
  const itemsToRender = isBuyNowActive ? buyNowCart : cart;

  // === Handlers ===

  // Checkout
  const handleCheckout = () => {
    if (!itemsToRender.length) {
      alert("Your cart is empty.");
      return;
    }

    // Build minimal payload for checkout page
    const fullCartItems = itemsToRender.map((item) => {
      const price = Math.floor(
        item.product.oprice * (1 - item.product.discount / 100)
      );
      return {
        product: {
          id: item.product.id,
          name: item.product.name,
          imageurl: item.product.imageurl,
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
    if (isBuyNowActive) {
      localStorage.removeItem("buyNowItem");
      localStorage.removeItem("buyNowActive");
    }

  if (!isSignedIn) {
    // Save where we want to go AFTER login (policy: back to /cart)
    sessionStorage.setItem("post_login_redirect", "/cart");
    // Go to login (no need to add ?redirect=..., keep the login page as-is)
    navigate("/login", { replace: true });
    return;
  }
    sessionStorage.setItem("checkout_intent", JSON.stringify({ ts: Date.now() }));
  navigate("/checkout");
  };

  // Update quantity
  const updateQuantity = (item, delta) => {
    if (isBuyNowActive) {
      // Only change local temp array
      setBuyNowCart((prev) =>
        prev.map((i) =>
          i.product.id === item.product.id
            ? { ...i, quantity: Math.max(1, (i.quantity || 1) + delta) }
            : i
        )
      );
    } else {
      // Persisted cart
      changeCartQuantity(item.product.id, delta);
    }
  };

  // Remove from cart
  const handleRemove = async (item) => {
    if (isBuyNowActive) {
      setBuyNowCart((prev) =>
        prev.filter((i) => i.product.id !== item.product.id)
      );
    } else {
      await removeFromCart(item.product.id);
    }
  };

  // Move to wishlist
  const moveToWishlist = async (entry) => {
    const product = entry.product;

    // Already in wishlist?
    if (
      wishlist.find(
        (w) => (w.productId ?? w.product?.id) === product.id
      )
    ) {
      toast.info("Already in wishlist");
      // Optionally remove from cart
      if (isBuyNowActive) {
        setBuyNowCart((prev) =>
          prev.filter((i) => i.product.id !== product.id)
        );
      } else {
        await removeFromCart(product.id);
      }
      return;
    }

    const ok = await addToWishlist(product);
    if (!ok) {
      toast.error("Failed to move to wishlist");
      return;
    }

    // Remove from the cart after adding to wishlist
    if (isBuyNowActive) {
      setBuyNowCart((prev) =>
        prev.filter((i) => i.product.id !== product.id)
      );
    } else {
      await removeFromCart(product.id);
    }

    toast.success("Moved to wishlist");
  };

  // Render remaining products (main cart only)
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
            <img src={product.imageurl} alt={product.name} />
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
            <button onClick={() => addToCart(product, 1)}>
              Add to Cart
            </button>
          </div>
        );
      });

  // Totals & coupon logic (use activeCart!)
  const activeCart = itemsToRender;
  const totalOriginal = activeCart.reduce(
    (sum, i) => sum + i.product.oprice * (i.quantity || 1),
    0
  );
  const totalDiscounted = activeCart.reduce((sum, i) => {
    const price = Math.floor(
      i.product.oprice * (1 - i.product.discount / 100)
    );
    return sum + price * (i.quantity || 1);
  }, 0);

  let finalPrice = totalDiscounted;
  if (appliedCoupon) {
    finalPrice =
      appliedCoupon.discountType === "percent"
        ? Math.floor(finalPrice * (1 - appliedCoupon.discountValue / 100))
        : Math.max(0, finalPrice - appliedCoupon.discountValue);
  }

  // Invalidate coupon if cart changes or becomes ineligible
  useEffect(() => {
    if (appliedCoupon && !isCouponValid(appliedCoupon, activeCart)) {
      setAppliedCoupon(null);
      toast.info("Coupon no longer valid");
    }
  }, [activeCart, appliedCoupon, isCouponValid]);

  // Proper loader (only when main cart is actually loading)
  if (!isBuyNowActive && isCartLoading) {
    return <Loader text="Loading cart..." />;
  }

  return (
    <>
      <main className="main-container">
        <div className="cart-item-summary-container">
          {/* Items */}
          <div className="cart-items-box">
            {activeCart.length > 0 ? (
              activeCart.map((item) => (
                <div key={item.product.id} className="cart-item">
                  <div className="product-content">
                    <img
                      src={item.product.imageurl}
                      alt={item.product.name}
                    />
                    <div className="title-quantity-price">
                      <div className="title-quantity">
                        <div className="product-title">
                          <h3>{item.product.name}</h3>
                          <span>{item.product.size} ml</span>
                        </div>
                        <div className="quantity-controls">
                          <button onClick={() => updateQuantity(item, -1)}>
                            –
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item, +1)}>
                            +
                          </button>
                        </div>
                      </div>
                      <div className="item-price">
                        <span>
                          ₹
                          {Math.floor(
                            item.product.oprice *
                              (1 - item.product.discount / 100)
                          )}
                        </span>
                        <span className="old-price">
                          ₹{item.product.oprice}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="procduct-shifting-buttons">
                    <button
                      className="remove"
                      onClick={() => handleRemove(item)}
                    >
                      Remove
                    </button>
                    <button
                      className="move-to-wishlist"
                      onClick={() => moveToWishlist(item)}
                    >
                      Move to Wishlist
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">Your cart is empty.</div>
            )}
          </div>

          {/* Summary & Checkout */}
          <div className="cart-summary">
            <div className="cart-summary-price">
              <h3>
                <span>Total:</span> <span>₹{totalOriginal}</span>
              </h3>
              <h3
                className={`discounted-total ${
                  appliedCoupon ? "with-coupon" : ""
                }`}
              >
                <span>Discounted Total:</span>{" "}
                <span>₹{finalPrice}</span>
              </h3>
              {appliedCoupon && (
                <small className="coupon-applied">
                  {appliedCoupon.code} applied
                </small>
              )}
            </div>

            {/* Coupons */}
            <div className="cart-coupons">
              <h4>Available Coupons</h4>
              {coupons.length > 0 ? (
                coupons.map((coupon) => {
                  const isSelected = appliedCoupon?.id === coupon.id;
                  return (
                    <div
                      key={coupon.id}
                      className={`coupon-item ${
                        isSelected ? "applied" : ""
                      }`}
                      onClick={async () => {
                        if (isSelected) {
                          setAppliedCoupon(null);
                        } else {
                          const validated = await fetch(
                            `${import.meta.env.VITE_BACKEND_URL}/api/coupons/validate`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                code: coupon.code,
                                userId: userdetails?.id ?? null,
                              }),
                            }
                          ).then((r) => r.json());

                          if (
                            validated &&
                            isCouponValid(validated, activeCart)
                          ) {
                            setAppliedCoupon(validated);
                          }
                        }
                      }}
                    >
                      <strong>{coupon.code}</strong>{" "}
                      –{" "}
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

            {/* Buttons */}
            <div className="cart-summary-button">
              {!isBuyNowActive && (
                <button onClick={clearCart}>Clear Cart</button>
              )}
              <button
                id="checkout-button"
                className="checkout"
                disabled={!itemsToRender.length}
                onClick={handleCheckout}
              >
                {isBuyNowActive ? "Buy Now" : "Checkout"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Explore More (main-cart only) */}
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
