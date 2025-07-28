import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../style/cart.css";
import { ProductContext } from "../contexts/productContext";
import { UserContext } from "../contexts/UserContext";
import { db } from "../../configs";
import { addToCartTable, wishlistTable } from "../../configs/schema";
import { and, eq } from "drizzle-orm";
import { CartContext } from "../contexts/CartContext";
import { CouponContext } from "../contexts/CouponContext";  // <--- Added CouponContext
import { toast, ToastContainer } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import Loader from "./Loader"; // Adjust path if needed



const ShoppingCart = () => {




  const navigate = useNavigate();
  
  const [selectedCoupon, setSelectedCoupon] = useState(null);  // <--- Added coupon selection
  const { products } = useContext(ProductContext);
  const { userdetails } = useContext(UserContext);
  const { cart, setCart, wishlist, setWishlist, getCartitems, } =
    useContext(CartContext);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
const [searchParams] = useSearchParams();
const isBuyNow = searchParams.get("buyNow") === "true";
const buyNowItem = JSON.parse(localStorage.getItem("buyNowItem"));

const [buyNowCart, setBuyNowCart] = useState([]);
const [isBuyNowActive, setIsBuyNowActive] = useState(false);






  const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  const { coupons, isCouponValid, loadAvailableCoupons } = useContext(CouponContext);  // <--- Get coupons from context





useEffect(() => {
  const loadCart = async () => {
    if (isBuyNow) {
      const stored = localStorage.getItem("buyNowItem");
      try {
        setBuyNowCart(stored ? [JSON.parse(stored)] : []);
      } catch {
        console.error("Failed to parse buyNowItem");
        setBuyNowCart([]);
      }
      

    } else {
      await getCartitems();
      
    }
  };
  loadCart();
}, [isBuyNow]);



useEffect(() => {
  const storedItem = localStorage.getItem("buyNowItem");

  if (isBuyNow && storedItem) {
    try {
      const parsedItem = JSON.parse(storedItem);
      setBuyNowCart([parsedItem]);
      setIsBuyNowActive(true);
    } catch (error) {
      console.error("Error parsing buyNowItem:", error);
    }
  } else {
    // 🧹 Clear buyNowItem if not in buyNow mode
    localStorage.removeItem("buyNowItem");
    setIsBuyNowActive(false);
  }
}, [isBuyNow]);




  



const itemsToRender = isBuyNowActive ? buyNowCart : cart;


  // Checkout Handler
  const handleCheckout = () => {
    const activeCart = isBuyNow ? buyNowCart : cart;

if (!activeCart?.length) {
  alert("Your cart is empty. Please add at least one item before checking out.");
  return;
}


    const fullCartItems = activeCart.map((item) => {

      const discountedPrice = Math.floor(
        item.product.oprice - (item.product.discount / 100) * item.product.oprice
      );
      return {
        product: {
          id: item.product.id,
          name: item.product.name,
          imageurl: item.product.imageurl,
          size: item.product.size,
          oprice: item.product.oprice,
          discount: item.product.discount,
          price: discountedPrice,
        },
        quantity: item.quantity || 1,
        totalPrice: discountedPrice * (item.quantity || 1),
      };
    });

    localStorage.setItem("selectedItems", JSON.stringify(fullCartItems));
    localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
if (isBuyNow) localStorage.removeItem("buyNowItem");

    navigate("/checkout");
  };


  let count = 1;
  const addToCart = async (product) => {
    const tempCartItem = {
      product,
      cartId: `temp-${product.id + count++}`,
      userId: userdetails?.id,
      quantity: 1,
    };
    setCart((prev) => [...prev, tempCartItem]);
    try {
      const res1 = await db
        .insert(addToCartTable)
        .values({ productId: product.id, userId: userdetails?.id })
        .returning({
          cartId: addToCartTable.id,
          userId: addToCartTable.userId,
        });
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === product.id && item.userId === userdetails?.id
            ? { ...item, cartId: res1.cartId }
            : item
        )
      );
    } catch {
      setCart((prev) => prev.filter((item) => item.cartId !== tempCartItem.cartId));
    }
  };



  const moveToWishlist = async (prod) => {
    const product = prod?.product || {};
    if (!product.id) {
      toast.error("Invalid product");
      return;
    }
    if (wishlist.find((item) => item.productId === product.id)) {
      toast.info("Already Wishlisted");
      return;
    }
    const tempWishlistItem = {
      productId: product.id,
      wishlistId: `temp-${product.id + count++}`,
      userId: userdetails?.id,
    };
    setWishlist((prev) => [...prev, tempWishlistItem]);
    try {
      const res = await db
        .insert(wishlistTable)
        .values({ userId: userdetails?.id, productId: product.id })
        .returning({
          wishlistId: wishlistTable.id,
          productId: wishlistTable.productId,
          userId: wishlistTable.userId,
        });
      await db
        .delete(addToCartTable)
        .where(
          and(
            eq(addToCartTable.productId, product.id),
            eq(addToCartTable.userId, prod.userId)
          )
        );
      if (res.length > 0) {
        toast.success("Moved to wishlist");
        setCart((prev) => prev.filter((item) => item.product.id !== product.id));
        setWishlist((prev) =>
          prev.map((item) =>
            item.productId === product.id && item.userId === userdetails?.id
              ? { ...res[0] }
              : item
          )
        );
      }
    } catch {
      toast.error("Failed to move to wishlist");
      setWishlist((prev) =>
        prev.filter((item) => item.productId !== tempWishlistItem.productId)
      );
    }
  };

  const updateQuantity = (index, change) => {
    setCart((prevCart) =>
      prevCart.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeFromCart = async (item, index) => {
    try {
      await db
        .delete(addToCartTable)
        .where(
          and(
            eq(addToCartTable.userId, userdetails?.id),
            eq(addToCartTable.productId, item?.product?.id)
          )
        );
      setCart((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error(err);
    }
  };

  const clearCart = async () => {
    try {
      await db.delete(addToCartTable).where(eq(userdetails?.id, addToCartTable.userId));
      setCart([]);
    } catch { }
  };

  const activeCart = isBuyNowActive ? buyNowCart : cart;

const totalOriginal = activeCart?.reduce(
  (acc, item) => acc + (item?.product?.oprice || 0) * (item?.quantity || 0),
  0
);

const totalDiscounted = activeCart?.reduce(
  (acc, item) =>
    acc +
    Math.floor(
      (item?.product?.oprice || 0) -
        ((item?.product?.discount || 0) / 100) * (item?.product?.oprice || 0)
    ) *
      (item?.quantity || 0),
  0
);


  let finalPrice = totalDiscounted;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percent") {
      finalPrice = Math.floor(finalPrice * (1 - appliedCoupon.discountValue / 100));
    } else if (appliedCoupon.discountType === "flat") {
      finalPrice = Math.max(0, finalPrice - appliedCoupon.discountValue);
    }
  }



  useEffect(() => {
    if (userdetails?.id) {
      loadAvailableCoupons(userdetails.id, BASE);
    }
  }, [userdetails?.id]);


  useEffect(() => {
  if (appliedCoupon) {
    const activeCart = isBuyNow ? buyNowCart : cart;
    if (!isCouponValid(appliedCoupon, activeCart)) {
      setAppliedCoupon(null);
      toast.info("Applied coupon no longer valid due to cart changes");
    }
  }
}, [cart, buyNowCart, isBuyNow]);


  const validateCouponServer = async (couponCode, userId) => {
    try {
      const res = await fetch(`${BASE}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          userId: userId
        })
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Invalid coupon");
        return null;
      }

      const data = await res.json();
      return data.coupon;
    } catch (err) {
      console.error("Coupon validation failed", err);
      toast.error("Server validation failed");
      return null;
    }
  };




  const renderRemainingProducts = () =>
    products
      ?.filter((p) => !cart?.some((c) => c.product.id === p.id))
      .map((product) => {
        const discounted = Math.trunc(
          product.oprice - (product.oprice * product.discount) / 100
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
                  ₹{discounted}
                </span>
                <span
                  className="old-price"
                  style={{
                    color: "lightgray",
                    textDecoration: "line-through",
                  }}
                >
                  (₹{product.oprice})
                </span>
              </div>
              <span className="discount" style={{ color: "blue" }}>
                {product.discount}% Off
              </span>
            </div>
            <button className="add-to-cart" onClick={() => addToCart(product)}>
              Add to Cart
            </button>
          </div>
        );
      });


if (!isBuyNowActive && (!cart || cart.length === 0)) {
  return <Loader text="Loading cart..." />;
}



  return (
    <>
      
      <main className="main-container" style={{ position: "relative" }}>
      
<div className="cart-item-summary-container">
          
<div className="cart-items-box">
       
  {itemsToRender && itemsToRender.length > 0 ? (
  itemsToRender.map((item, idx) => (

                <div key={idx} className="cart-item">
                  <div className="product-content">
                    <img src={item.product.imageurl} alt={item.product.name} />
                    <div className="title-quantity-price">
                      <div className="title-quantity">
                        <div className="product-title">
                          <h3>{item.product.name}</h3>
                          <span>{item.product.size} ml</span>
                        </div>
                        <div className="quantity-controls">
                          <button onClick={() => updateQuantity(idx, -1)}>-</button>
                          <span className="item-quantity">{item.quantity}</span>
                          <button onClick={() => updateQuantity(idx, 1)}>+</button>
                        </div>
                      </div>
                      <div className="item-price">
                        <span>
                          ₹
                          {Math.floor(
                            item.product.oprice -
                            (item.product.discount / 100) * item.product.oprice
                          )}
                        </span>
                        <span
                          style={{
                            color: "lightgray",
                            textDecoration: "line-through",
                          }}
                        >
                          ₹{item.product.oprice}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="procduct-shifting-buttons">
                    <button className="remove" onClick={() => removeFromCart(item, idx)}>
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

          <div className="cart-summary">
            <div className="cart-summary-price">
              <h3><span>Total:</span> <span>₹{totalOriginal}</span></h3>
              <h3 className={`discounted-total ${appliedCoupon ? "with-coupon" : ""}`}>
                <span>Discounted Total:</span> <span> ₹{finalPrice}</span>
              </h3>
              <div className="coupon-applied-container">
                {appliedCoupon && (
                  <small style={{ color: "green", fontSize: "1rem" }}>
                    {appliedCoupon.code} applied
                  </small>
                )}
              </div>



            </div>
            <div className="cart-coupons">
              <h4>Available Coupons</h4>
              {coupons.length > 0 ? (
                <div className="coupon-list">
                  {coupons.map((coupon) => {
                    const isSelected = appliedCoupon?.id === coupon.id;
                    return (
                      <div
                        key={coupon.id}
                        className={`coupon-item ${isSelected ? "applied" : ""}`}
                        onClick={async () => {
                          if (isSelected) {
                            setAppliedCoupon(null);
                          } else {
                            const validated = await validateCouponServer(coupon.code, userdetails.id);
                            if (validated && isCouponValid(validated, cart)) {
                              setAppliedCoupon(validated);
                            }
                          }
                        }}

                      >
                        <strong>{coupon.code}</strong> -{" "}
                        {coupon.discountType === "percent"
                          ? `${coupon.discountValue}% off`
                          : `₹${coupon.discountValue} off`}
                        <br />
                        <small>{coupon.description}</small>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <small>No coupons available right now</small>
              )}

            </div>


            <div className="cart-summary-button">
                {!isBuyNow && (
    <button id="clear-cart" onClick={clearCart}>
      Clear Cart
    </button>
  )}
             <button
  id="checkout-button"
  disabled={!itemsToRender?.length}
  onClick={handleCheckout}
>

  {isBuyNow ? "Buy Now" : "Checkout"}
</button>

            </div>
          </div>
        </div>
      </main>

      {!isBuyNow && (
  <div id="remaining-products-container">
    <h3>Explore more</h3>
    <div id="remaining-products">{renderRemainingProducts()}</div>
  </div>
)}

    </>
  );
};

export default ShoppingCart;
