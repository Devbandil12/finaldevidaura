import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../style/cart.css";
import { ProductContext } from "../contexts/productContext";
import { UserContext } from "../contexts/UserContext";
import { db } from "../../configs";
import { addToCartTable, wishlistTable } from "../../configs/schema";
import { and, eq } from "drizzle-orm";
import { CartContext } from "../contexts/CartContext";
import { toast, ToastContainer } from "react-toastify";

const ShoppingCart = () => {
  const navigate = useNavigate();
  const [cartitems, setCartitems] = useState([]);
  const { products } = useContext(ProductContext);
  const { userdetails } = useContext(UserContext);
  const { cart, setCart, wishlist, setWishlist, getCartitems } =
    useContext(CartContext);

  // Checkout Handler
  const handleCheckout = () => {
    if (!cart?.length) {
      alert(
        "Your cart is empty. Please add at least one item before checking out."
      );
      return;
    }
    localStorage.setItem("selectedItems", JSON.stringify(cart));
    navigate("/checkout");
  };

  useEffect(() => {
    getCartitems();
  }, []);

  useEffect(() => {
    setCartitems(cart);
  }, [cart]);

  // Add to cart
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
      setCart((prev) =>
        prev.filter((item) => item.cartId !== tempCartItem.cartId)
      );
    }
  };

  // Move to wishlist
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
        setCart((prev) =>
          prev.filter((item) => item.product.id !== product.id)
        );
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

  // Quantity update
  const updateQuantity = (index, change) => {
    setCart((prevCart) =>
      prevCart.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  // Remove from cart
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

  // Clear cart
  const clearCart = async () => {
    try {
      await db
        .delete(addToCartTable)
        .where(eq(userdetails?.id, addToCartTable.userId));
      setCart([]);
    } catch {}
  };

  // Price calculations
  const totalOriginal = cart?.reduce(
    (acc, item) => acc + (item?.product?.oprice || 0) * (item?.quantity || 0),
    0
  );
  const totalDiscounted = cart?.reduce(
    (acc, item) =>
      acc +
      Math.floor(
        (item?.product?.oprice || 0) -
          ((item?.product?.discount || 0) / 100) * (item?.product?.oprice || 0)
      ) *
        (item?.quantity || 0),
    0
  );
  const finalPrice = totalDiscounted;

  // Remaining products
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

  return (
    <>
      <h1 className="cart-title">Cart</h1>
      <main className="main-container" style={{ position: "relative" }}>
        {/* Toasts */}
        <div className="toast-wrapper">
          <ToastContainer />
        </div>

        <div className="cart-item-summary-container">
          {/* Cart Items */}
          <div className="cart-items-box">
            {cartitems && cartitems.length > 0 ? (
              cartitems.map((item, idx) => (
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
                          <button onClick={() => updateQuantity(idx, -1)}>
                            -
                          </button>
                          <span className="item-quantity">{item.quantity}</span>
                          <button onClick={() => updateQuantity(idx, 1)}>
                            +
                          </button>
                        </div>
                      </div>
                      <div className="item-price">
                        <span >
                          ₹
                          {Math.floor(
                            item.product.oprice -
                              (item.product.discount / 100) *
                                item.product.oprice
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
                    <button
                      className="remove"
                      onClick={() => removeFromCart(item, idx)}
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

          {/* Summary */}
          <div className="cart-summary">
            <div className="cart-summary-button">
              <button id="clear-cart" onClick={clearCart}>
                Clear Cart
              </button>
              <button
                id="checkout-button"
                disabled={!cart?.length}
                onClick={handleCheckout}
              >
                Checkout
              </button>
            </div>
            <div className="cart-summary-price">
              <h3>Total: ₹{totalOriginal}</h3>
              <h3>Discounted Total: ₹{finalPrice}</h3>
            </div>
          </div>
        </div>
      </main>

      {/* Remaining Products */}
      <div id="remaining-products-container">
        <h3>Explore more</h3>
        <div id="remaining-products">{renderRemainingProducts()}</div>
      </div>
    </>
  );
};

export default ShoppingCart;
