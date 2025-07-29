import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../style/cart.css";
import { ProductContext } from "../contexts/productContext";
import { UserContext } from "../contexts/UserContext";
import { db } from "../../configs";
import { addToCartTable, wishlistTable } from "../../configs/schema";
import { and, eq } from "drizzle-orm";
import { CartContext } from "../contexts/CartContext";
import { CouponContext } from "../contexts/CouponContext";
import { toast, ToastContainer } from "react-toastify";
import Loader from "./Loader";

import { useLocation } from "react-router-dom";




const ShoppingCart = () => {
  const navigate = useNavigate();
  const { products } = useContext(ProductContext);
  const { userdetails } = useContext(UserContext);
  const { cart, setCart, wishlist, setWishlist, getCartitems } =
    useContext(CartContext);
  const { coupons, isCouponValid, loadAvailableCoupons } =
    useContext(CouponContext);

const location = useLocation();


// Initialize state *once* from that stored value:
const [buyNowCart, setBuyNowCart] = useState([]);
const [isBuyNowActive, setIsBuyNowActive] = useState(false);

const [cartFetched, setCartFetched] = useState(false);

  // === Coupon state ===
  const [appliedCoupon, setAppliedCoupon] = useState(null);


  // Decide temp-cart from URL: /cart?mode=buynow => temp cart; /cart => main cart
useEffect(() => {
  const isBuyNowURL = new URLSearchParams(location.search).get("mode") === "buynow";

  if (isBuyNowURL) {
    const raw = sessionStorage.getItem("buyNowItem");
    if (raw) {
      try {
        const item = JSON.parse(raw);
        setBuyNowCart([item]);
        setIsBuyNowActive(true);
      } catch {
        sessionStorage.removeItem("buyNowItem");
        setIsBuyNowActive(false);
      }
    } else {
      // No payload -> fallback to main cart
      setIsBuyNowActive(false);
    }
  } else {
    // Visiting /cart WITHOUT buynow flag => always show main cart
    sessionStorage.removeItem("buyNowItem");
    setIsBuyNowActive(false);
  }
}, [location.search]);



  // Clear temp cart when leaving both /cart and /checkout
useEffect(() => {
  if (!["/cart", "/checkout"].includes(location.pathname)) {
    sessionStorage.removeItem("buyNowItem");
    setIsBuyNowActive(false);
  }
}, [location.pathname]);


  // Seed a safe back target after a hard refresh (robust across devices)
useEffect(() => {
  const nav = performance.getEntriesByType("navigation")[0];
  const reloaded = nav && nav.type === "reload";

  // If this tab has no meaningful back entry, create one.
  if ((reloaded || document.referrer === "") && window.history.length <= 1) {
    // 1) replace current entry with a safe route
    window.history.replaceState({ __seed__: true }, "", "/products");
    // 2) push the current cart route back on top
    window.history.pushState({ __cart__: true }, "", "/cart");
  }
}, []);


// Fallback: intercept back to avoid tab-close when history is thin
useEffect(() => {
  const onPop = (e) => {
    // If history is too short and we’re still on /cart, send user to a safe page
    if (window.history.length <= 1 && window.location.pathname === "/cart") {
      e.preventDefault?.();
      navigate("/products", { replace: true });
    }
  };
  window.addEventListener("popstate", onPop);
  return () => window.removeEventListener("popstate", onPop);
}, [navigate]);



  useEffect(() => {
  let cancelled = false;

  const run = async () => {
    // Always try to load coupons for the user
    if (userdetails?.id) {
      loadAvailableCoupons(userdetails.id, import.meta.env.VITE_BACKEND_URL);
    }

    // Fetch main cart only when NOT in Buy Now mode
    if (!isBuyNowActive && userdetails?.id) {
      try {
        await getCartitems();
      } finally {
        if (!cancelled) setCartFetched(true);
      }
    } else {
      // In Buy Now mode (or no user), we consider the cart "fetched"
      if (!cancelled) setCartFetched(true);
    }
  };

  // reset fetched while dependencies change
  setCartFetched(false);
  run();

  return () => { cancelled = true; };
}, [isBuyNowActive, userdetails?.id]);









  // Choose which array and setter to use
  const itemsToRender = isBuyNowActive ? buyNowCart : cart;
  const setItems = isBuyNowActive ? setBuyNowCart : setCart;

  // === Handlers ===

  // Checkout
  const handleCheckout = () => {
    if (!itemsToRender.length) {
      alert("Your cart is empty.");
      return;
    }

    // Build minimal payload
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
    
    navigate(isBuyNowActive ? "/checkout?mode=buynow" : "/checkout");

  };

  // Update quantity
  const updateQuantity = (idx, delta) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  // Remove from cart (DB only in main‐cart mode)
  const removeFromCart = async (item, idx) => {
    if (!isBuyNowActive) {
      try {
        await db
          .delete(addToCartTable)
          .where(
            and(
              eq(addToCartTable.userId, userdetails.id),
              eq(addToCartTable.productId, item.product.id)
            )
          );
      } catch (err) {
        console.error(err);
      }
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Move to wishlist
  let count = 1;
  const moveToWishlist = async (entry) => {
    const product = entry.product;
    if (wishlist.find((w) => w.productId === product.id)) {
      toast.info("Already in wishlist");
      return;
    }
    const tempWish = {
      productId: product.id,
      wishlistId: `temp-${product.id}-${count++}`,
      userId: userdetails.id,
    };
    setWishlist((prev) => [...prev, tempWish]);

    try {
      const [res] = await db
        .insert(wishlistTable)
        .values({ userId: userdetails.id, productId: product.id })
        .returning({
          wishlistId: wishlistTable.id,
          productId: wishlistTable.productId,
          userId: wishlistTable.userId,
        });
      // remove from cart DB if main mode
      if (!isBuyNowActive) {
        await db
          .delete(addToCartTable)
          .where(
            and(
              eq(addToCartTable.userId, userdetails.id),
              eq(addToCartTable.productId, product.id)
            )
          );
      }
      toast.success("Moved to wishlist");
      setItems((prev) => prev.filter((i) => i.product.id !== product.id));
      setWishlist((prev) =>
        prev.map((w) =>
          w.productId === product.id && w.wishlistId.startsWith("temp-")
            ? res
            : w
        )
      );
    } catch {
      toast.error("Failed to move to wishlist");
      setWishlist((prev) =>
        prev.filter((w) => w.wishlistId !== tempWish.wishlistId)
      );
    }
  };

  // Render remaining products (only in main cart)
  const renderRemainingProducts = () =>
    !isBuyNowActive &&
    products
      .filter((p) => !cart.some((c) => c.product.id === p.id))
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
                <span className="old-price">
                  ₹{product.oprice}
                </span>
              </div>
              <span className="discount">{product.discount}% Off</span>
            </div>
            <button onClick={() => setCart((prev) => [
                ...prev,
                { product, quantity: 1, cartId: `temp-${product.id}-${count++}`, userId: userdetails.id }
              ])}>
              Add to Cart
            </button>
          </div>
        );
      });

  // Totals & coupon logic
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

  // Invalidate coupon if cart changes
  useEffect(() => {
    if (appliedCoupon && !isCouponValid(appliedCoupon, activeCart)) {
      setAppliedCoupon(null);
      toast.info("Coupon no longer valid");
    }
  }, [activeCart, appliedCoupon, isCouponValid]);

  // Show loader if main cart is loading
 if (!isBuyNowActive && !cartFetched) {
  return <Loader text="Loading cart..." />;
}



  return (
    <>
      <main className="main-container">
        <div className="cart-item-summary-container">
          <div className="cart-items-box">
            {activeCart.length > 0 ? (
              activeCart.map((item, idx) => (
                <div key={idx} className="cart-item">
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
                          <button onClick={() => updateQuantity(idx, -1)}>
                            –
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(idx, 1)}>
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
                    <button className="remove" onClick={() => removeFromCart(item, idx)}>
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

          {/* Summary & Checkout */}
          <div className="cart-summary">
            <div className="cart-summary-price">
              <h3>
                <span>Total:</span> <span>₹{totalOriginal}</span>
              </h3>
              <h3 className={`discounted-total ${appliedCoupon ? "with-coupon" : ""}`}>
                <span>Discounted Total:</span>{" "}
                <span>₹{finalPrice}</span>
              </h3>
              {appliedCoupon && (
                <small className="coupon-applied">
                  {appliedCoupon.code} applied
                </small>
              )}
            </div>

            {/* Coupons (only main cart) */}
            
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
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  code: coupon.code,
                                  userId: userdetails.id,
                                }),
                              }
                            ).then((r) => r.json());
                            if (validated && isCouponValid(validated, cart)) {
                              setAppliedCoupon(validated);
                            }
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
            

            {/* Buttons */}
            <div className="cart-summary-button">
              {!isBuyNowActive && (
                <button onClick={async () => {
                    await db.delete(addToCartTable)
                      .where(eq(addToCartTable.userId, userdetails.id));
                    setCart([]);
                  }}>
                  Clear Cart
                </button>
              )}
              <button
                id="checkout-button" className="checkout" 
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