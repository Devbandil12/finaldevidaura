// src/pages/Products.js
import React, { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; 

import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";

import WishlistImage from "../assets/wishlist-svgrepo-com.svg";
import WishlistFilledImage from "../assets/wishlist-svgrepo-com copy.svg";
import CartImage from "../assets/cart-svgrepo-com copy.svg";

import { gsap } from "gsap";
import HeroButton from "./HeroButton";

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const Products = () => {
  const { products } = useContext(ProductContext);
  const { cart, wishlist, addToCart, toggleWishlist } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }, [location.pathname]);

  const handleSlideClick = (product) => navigate(`/product/${product.id}`);

  const handleAdd = async (product, quantity = 1) => {
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
        onComplete: () => flyImg.remove(),
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
      <section className="px-5 py-8 md:px-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-gray-900 tracking-tight drop-shadow-md">
            Discover Our Collection
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
            Quality products curated just for you.
          </p>
        </div>
        <div className="custom-grid">
          {products.map((product) => {
            const inWishlist = isProductInWishlist(product.id);
            const inCart = isProductInCart(product.id);
            const discountedPrice = Math.floor(product.oprice * (1 - product.discount / 100));

            return (
              <motion.div
                key={product.id}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="group flex flex-col bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="relative overflow-hidden aspect-square cursor-pointer"
                  onClick={() => handleSlideClick(product)}
                >
                  <img
                    src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    data-product-id={product.id}
                  />
                  <div className="absolute inset-0 bg-black/50 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white font-semibold border-2 border-white rounded px-4 py-2">
                      Quick View
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-2 flex-grow">
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
                        className="w-6 h-6 cursor-pointer flex-shrink-0"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <p className="text-base font-bold text-gray-800">₹{discountedPrice}</p>
                    <p className="line-through text-gray-400">₹{product.oprice}</p>
                    <span className="text-xs text-green-600 font-semibold">
                      ({product.discount}% OFF)
                    </span>
                  </div>
                  <p className="text-sm font-normal text-red-700 mt-1">
                    {product.stockStatus}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
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
                      onClick={() => handleAdd(product, 1)}
                      className="w-full py-2 text-lg font-semibold flex items-center justify-center gap-2 bg-black text-white"
                    >
                      Add to Cart
                      <img src={CartImage} alt="Cart" className="w-7 h-7" />
                    </HeroButton>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default Products;