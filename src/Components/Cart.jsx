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
    cart, // The single source of truth for the main cart
    buyNow, // The single source of truth for the temporary buy now item
    getCartitems,
    changeCartQuantity,
    removeFromCart,
    clearCart,
    addToWishlist,
    wishlist,
    isCartLoading,
    startBuyNow,
    clearBuyNow,
  } = useContext(CartContext);
  const { coupons, isCouponValid, loadAvailableCoupons } =
    useContext(CouponContext);

  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Determine which cart to render based on the 'buyNow' state
  const isBuyNowActive = !!buyNow;
  const itemsToRender = isBuyNowActive ? [buyNow] : cart;

  // Rehydrate main cart & coupons when NOT in Buy Now mode
  useEffect(() => {
    if (!isBuyNowActive && userdetails?.id) {
      getCartitems();
    }
    if (userdetails?.id) {
      loadAvailableCoupons(userdetails.id, import.meta.env.VITE_BACKEND_URL);
    }
  }, [isBuyNowActive, userdetails?.id, getCartitems, loadAvailableCoupons]);

  // Cleanup temp buy-now on route leave
  useEffect(() => {
    return () => {
      if (location.pathname !== "/cart" && isBuyNowActive) {
        clearBuyNow();
      }
    };
  }, [location.pathname, isBuyNowActive, clearBuyNow]);

  const handleCheckout = () => {
    if (!itemsToRender.length) {
      alert("Your cart is empty.");
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
      clearBuyNow();
    }

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
            <button className="add-to-cart" onClick={() => handleQuantityChange({product, quantity: 0}, 1)}>
              Add to Cart
            </button>
          </div>
        );
      });

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
                    <img src={item.product.imageurl} alt={item.product.name} />
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
            <div className="cart-summary-price">
              <h3>
                <span>Total:</span> <span>₹{totalOriginal}</span>
              </h3>
              <h3 className={`discounted-total ${appliedCoupon ? "with-coupon" : ""}`}>
                <span>Discounted Total:</span> <span>₹{finalPrice}</span>
              </h3>
              {appliedCoupon && (
                <small className="coupon-applied">
                  {appliedCoupon.code} applied
                </small>
              )}
            </div>

            <div className="cart-coupons">
              <h4>Available Coupons</h4>
              {coupons.length > 0 ? (
                coupons.map((coupon) => {
                  const isSelected = appliedCoupon?.id === coupon.id;
                  return (
                    <div
                      key={coupon.id}
                      className={`coupon-item ${isSelected ? "applied" : ""}`}
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

                          if (validated && isCouponValid(validated, activeCart)) {
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
