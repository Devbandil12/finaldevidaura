// src/pages/Products.js
import React, { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";
import WishlistImage from "../assets/wishlist-svgrepo-com.svg";
import WishlistFilledImage from "../assets/wishlist-svgrepo-com copy.svg";
import CartImage from "../assets/cart-svgrepo-com copy.svg";

import "../style/products.css";
import { gsap } from "gsap";
import HeroButton from "./HeroButton";

const Products = () => {
  const { products } = useContext(ProductContext);
  const {
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    toggleWishlist,
    startBuyNow,
  } = useContext(CartContext);
  const { userdetails } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }, [location.pathname]);

  const handleSlideClick = (product) => {
    // Navigate to the product detail page using the ID of the first variation
    // This assumes the backend returns the first variation as the main product
    navigate(`/product/${product.id}`);
  };

  const handleAdd = async (product, quantity = 1, isBuyNow = false) => {
    if (isBuyNow) {
      const ok = startBuyNow(product, quantity);
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
      if (ok) navigate("/cart", { replace: true });
      return;
    }

    if (quantity === 0) {
      await removeFromCart(product.id);
      return;
    }

    await addToCart(product, quantity);

    try {
      const productImg = document.querySelector(
        `img[data-product-id="${product.id}"]`
      );
      const cartBtn = document.getElementById("cart-icon");
      if (!productImg || !cartBtn) return;

      const imgRect = productImg.getBoundingClientRect();
      const cartRect = cartBtn.getBoundingClientRect();
      const startX = imgRect.left + imgRect.width / 2;
      const startY = imgRect.top + imgRect.height / 2;
      const endX = cartRect.left + cartRect.width / 2;
      const endY = cartRect.top + cartRect.height / 2;

      const flyImg = productImg.cloneNode(true);
      flyImg.style.position = "fixed";
      flyImg.style.top = `${startY}px`;
      flyImg.style.left = `${startX}px`;
      flyImg.style.width = "50px";
      flyImg.style.height = "50px";
      flyImg.style.borderRadius = "50%";
      flyImg.style.objectFit = "cover";
      flyImg.style.zIndex = "1000";
      document.body.appendChild(flyImg);

      gsap.to(flyImg, {
        x: endX - startX,
        y: endY - startY,
        scale: 0.2,
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          flyImg.remove();
        },
      });
    } catch (error) {
      console.error("GSAP animation failed:", error);
    }
  };

  const handleToggleWishlist = (product) => {
    toggleWishlist(product);
  };

  const isProductInCart = (productId) =>
    cart?.some((item) => item.product?.id === productId);
  const isProductInWishlist = (productId) =>
    wishlist?.some((item) => (item.productId ?? item.product?.id) === productId);

  return (
    <>
      <section className="px-5 py-8">
        <div className="flex justify-center items-center">
          <h2 className="text-3xl font-semibold mb-8 text-black">
            Our Products
          </h2>
        </div>

        <div className="flex justify-center items-center flex-wrap gap-8">
          {products.map((product) => {
            const inWishlist = isProductInWishlist(product.id);
            const inCart = isProductInCart(product.id);

            // The main product object now represents the lowest price variation
            const discountedPrice = Math.floor(product.oprice * (1 - product.discount / 100));

            return (
              <div
                className="product-card w-72 rounded-lg bg-white overflow-hidden"
                key={product.id}
              >
                <div className="product-thumb">
                  {/* Display the image from the first variation */}
                  <img
                    src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl}
                    alt={product.name}
                    className="product-img"
                    data-product-id={product.id}
                    onClick={() => handleSlideClick(product)}
                  />

                  <div
                    className="img-overlay"
                    onClick={() => handleSlideClick(product)}
                  >
                    <span className="overlay-text">Quick View</span>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h3
                      className="text-lg font-semibold cursor-pointer hover:underline"
                      onClick={() => handleSlideClick(product)}
                    >
                      {product.name}
                    </h3>
                    <div onClick={() => handleToggleWishlist(product)}>
                      <img
                        src={inWishlist ? WishlistFilledImage : WishlistImage}
                        alt="Wishlist"
                        className="w-6 h-6 cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <p>Rs {discountedPrice}</p>
                    <p className="line-through-price text-gray-400">Rs {product.oprice}</p>
                    <span className="text-xs text-green-600 font-semibold">
                      ({product.discount}% OFF)
                    </span>
                  </div>
                  
                  <p className="text-sm font-normal text-red-700 mt-1">
                    {product.stockStatus}
                  </p>

                  <p className="text-xs text-gray-400">
                    {product.description}
                  </p>
                </div>

                <div className="p-4 pt-0">
                  {inCart ? (
                    <HeroButton
                      onClick={() => navigate("/cart")}
                      className="w-full py-2 text-lg font-semibold flex items-center justify-center gap-2 bg-black text-white"
                    >
                      View Cart
                      <img src={CartImage} alt="Cart" className="w-7 h-7" />
                    </HeroButton>
                  ) : (
                    <HeroButton
                      onClick={() => handleAdd(product, 1, false)}
                      className="w-full py-2 text-lg font-semibold flex items-center justify-center gap-2 bg-black text-white"
                    >
                      Add to Cart
                      <img src={CartImage} alt="Cart" className="w-7 h-7" />
                    </HeroButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default Products;
