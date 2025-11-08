import React, { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";

import WishlistImage from "../assets/wishlist-svgrepo-com.svg";
import WishlistFilledImage from "../assets/wishlist-svgrepo-com copy.svg";
import CartImage from "../assets/cart-svgrepo-com copy.svg";

import HeroButton from "./HeroButton";
import { ArrowRight } from "lucide-react";

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
  const { wishlist, toggleWishlist } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }, [location.pathname]);

  const handleSlideClick = (product) => navigate(`/product/${product.id}`);
  const handleSelectOptions = (product) => navigate(`/product/${product.id}`);

  const handleToggleWishlist = (e, product) => {
    e.stopPropagation();
    if (product.variants && product.variants.length > 0) {
      const cheapestVariant = product.variants.sort((a, b) => a.oprice - b.oprice)[0];
      toggleWishlist(product, cheapestVariant);
    } else {
      window.toast?.error?.("This product has no variants to wishlist.");
    }
  };

  const isProductInWishlist = (product) => {
    if (!product.variants || product.variants.length === 0) return false;
    const variantIds = product.variants.map((v) => v.id);
    return wishlist?.some((item) => variantIds.includes(item.variantId ?? item.variant?.id));
  };

  const getDisplayVariant = (product) => {
    if (!product.variants || product.variants.length === 0) return null;
    return product.variants.sort((a, b) => a.oprice - b.oprice)[0];
  };

  return (
    <>
      <section className="px-1 py-8">
        <div className="text-center mb-16 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 tracking-tight drop-shadow-md">
            Discover Our Collection
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-600">
            Quality products curated just for you.
          </p>
        </div>

        {/* GRID LAYOUT: centers rows, last row left-aligned */}
        <div
          className="grid gap-6 justify-center"
          style={{
            gridTemplateColumns: "repeat(auto-fit, 250px)",
          }}
        >
          {products
            .filter((p) => p.category !== "Template")
            .map((product) => {
              const displayVariant = getDisplayVariant(product);
              if (!displayVariant) return null;

              const inWishlist = isProductInWishlist(product);
              const discountedPrice = Math.floor(
                displayVariant.oprice * (1 - displayVariant.discount / 100)
              );
              const stockStatus =
                displayVariant.stock === 0
                  ? "Out of Stock"
                  : displayVariant.stock <= 10
                    ? `Only ${displayVariant.stock} left!`
                    : null;

              const imageUrl = Array.isArray(product.imageurl) && product.imageurl.length > 0
                ? product.imageurl[0]
                : "/placeholder.png";

              return (
                <motion.div
                  key={product.id}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_8px_12px_rgba(230,229,229,0.3)] border border-gray-100 cursor-default"
                >
                  <div
                    className="relative overflow-hidden h-48 cursor-pointer"
                    onClick={() => handleSlideClick(product)}
                  >
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      data-product-id={product.id}
                    />
                    <div className="absolute inset-0 bg-black/50 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white font-semibold border-2 border-gray-100 rounded-xl px-4 py-2">
                        Quick View
                      </span>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col gap-1 flex-grow">
                    <div className="flex justify-between items-start">
                      <h3
                        className="text-lg font-semibold cursor-pointer"
                        onClick={() => handleSlideClick(product)}
                      >
                        {product.name}
                      </h3>
                      <div onClick={(e) => handleToggleWishlist(e, product)}>
                        <img
                          src={inWishlist ? WishlistFilledImage : WishlistImage}
                          alt="Wishlist"
                          className="w-6 h-6 cursor-pointer flex-shrink-0"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-gray-500 mr-1">From</span>
                        <p className="font-bold text-gray-800">₹{discountedPrice}</p>
                        <p className=" line-through text-gray-400">₹{displayVariant.oprice}</p>
                      </div>
                      <span className="text-md text-green-600 ">{displayVariant.discount}% off</span>
                    </div>

                    {stockStatus && (
                      <p className="text-xs text-red-700 lowercase font-bolder">{stockStatus}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2 mb-2 line-clamp-2">{product.description}</p>
                  </div>

                  <div className="p-3 pt-0">
                    <HeroButton
                      onClick={() => handleSelectOptions(product)}
                      className="w-full py-2 text-lg font-semibold flex items-center justify-center gap-2 bg-black text-white"
                    >
                      Shop Now <ArrowRight className="w-5 h-5" />
                    </HeroButton>
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