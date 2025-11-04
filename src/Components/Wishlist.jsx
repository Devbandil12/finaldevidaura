// src/pages/Wishlist.jsx

import React, { useContext } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { CartContext } from "../contexts/CartContext";
import Loader from "./Loader";
import { motion, AnimatePresence } from "framer-motion";

const Wishlist = () => {
  const {
    wishlist,
    isWishlistLoading,
    removeFromWishlist,
    clearWishlist,
    moveFromWishlistToCart, 
  } = useContext(CartContext);

  // 🟢 FIXED: Pass product and variant objects
  const handleMoveToCart = (wishlistItem) => {
    // moveFromWishlistToCart expects (product, variant)
    moveFromWishlistToCart(wishlistItem.product, wishlistItem.variant);
  };

  // 🟢 FIXED: Pass variant object
  const handleRemoveItem = (wishlistItem) => {
    // removeFromWishlist expects (variant)
    removeFromWishlist(wishlistItem.variant);
  };

  const handleClearWishlist = () => {
    clearWishlist();
  };

  if (isWishlistLoading) {
    return (
      <>
        <title>Loading Wishlist... | Devid Aura</title>
        <Loader text="Loading wishlist..." />
      </>
    );
  }

  return (
    <>
      <title>My Wishlist | Devid Aura</title>
      <meta name="description" content="View and manage your saved items. Keep track of all your favorite fragrances from Devid Aura." />

      <main className="max-w-6xl mx-auto my-4 sm:my-8 px-4 w-full flex flex-col gap-8 pt-[50px]">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            My Wishlist
          </h1>
          {wishlist.length > 0 && (
            <motion.button 
              onClick={handleClearWishlist} 
              className="bg-transparent border border-gray-200 text-gray-500 py-2 px-4 rounded-xl cursor-pointer flex items-center gap-2 font-medium transition-colors duration-200 ease-in-out hover:bg-red-50 hover:text-red-600 hover:border-red-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Clear Wishlist</span>
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {wishlist.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center border-2 border-dashed border-gray-300 rounded-xl p-12"
            >
              <Heart
                className="mx-auto h-12 w-12 text-gray-400"
                strokeWidth={1}
              />
              <h2 className="mt-4 text-xl font-semibold text-zinc-800">
                Your Wishlist is a Blank Canvas
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Find something you love and add it here to save for later.
              </p>
              <a
                href="/"
                className="mt-6 inline-block bg-black text-white text-sm font-medium px-6 py-2.5 rounded-md shadow-sm hover:opacity-90 transition-opacity"
              >
                Discover Products
              </a>
            </motion.div>
          ) : (
            <motion.div layout className="space-y-4">
              <AnimatePresence>
                {wishlist.map((wishlistItem) => {
                  // Destructuring is correct
                  const { product, variant, wishlistId } = wishlistItem;

                  if (!product || !variant) {
                    console.error("Invalid wishlist item found:", wishlistItem);
                    return null;
                  }
                  
                  // Price/stock logic is correct
                  const discountedPrice = Math.floor(
                    variant.oprice * (1 - variant.discount / 100)
                  );
                  
                  const stockStatus = variant.stock === 0
                    ? "Out of Stock"
                    : variant.stock <= 10
                    ? `Only ${variant.stock} left!`
                    : "In Stock"; 

                  return (
                    <motion.article
                      key={wishlistId} // Use unique wishlistId
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                      className="bg-white rounded-lg p-4 flex items-start gap-4 shadow-lg shadow-gray-100/50 border border-gray-100 hover:shadow-gray-200/50 transition-shadow"
                      aria-labelledby={`wl-${product.id}-name`}
                    >
                      {/* Left: Image */}
                      <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center">
                        <img
                          src={Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl}
                          alt={product.name}
                          className="h-20 w-20 object-contain"
                          loading="lazy"
                        />
                      </div>

                      {/* Right: All Content */}
                      <div className="flex-grow flex flex-col min-[570px]:flex-row min-[570px]:items-center min-[570px]:gap-4">
                        {/* Text Section */}
                        <div className="flex-grow">
                          <h3
                            id={`wl-${product.id}-name`}
                            className="text-lg font-semibold text-zinc-800"
                            title={product.name}
                          >
                            {product.name}
                          </h3>
                          
                          <p className="text-sm text-gray-500 mt-1">
                           {variant.size}ml
                          </p>

                          <p className={`mt-1 text-sm font-medium ${variant.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stockStatus}
                          </p>
                          
                          <div className="mt-2 flex items-baseline justify-between min-[570px]:justify-start min-[570px]:gap-2">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-zinc-900">
                                ₹{discountedPrice}
                              </span>
                              <span className="text-sm line-through text-gray-400">
                                ₹{variant.oprice}
                              </span>
                            </div>
                            {variant.discount > 0 && (
                              <span className="text-sm font-semibold text-green-600">
                                ({variant.discount}% OFF)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Buttons Section */}
                        <div className="w-full min-[570px]:w-auto flex items-center gap-3 mt-4 min-[570px]:mt-0">
                          <button
                            onClick={() => handleMoveToCart(wishlistItem)} // 🟢 Pass full item
                            aria-label="Move to Bag"
                            disabled={variant.stock === 0} 
                            className="flex-1 min-[570px]:flex-initial w-full flex items-center justify-center gap-2 bg-black text-white text-sm font-medium py-2 px-4 rounded-md hover:opacity-90 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            <ShoppingBag className="h-4 w-4" />
                            {variant.stock === 0 ? "Out of Stock" : "Move to Bag"}
                          </button>
                          <button
                            onClick={() => handleRemoveItem(wishlistItem)} // 🟢 Pass full item
                            aria-label="Remove from Wishlist"
                            className="p-2 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-100 hover:text-zinc-800 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
};

export default Wishlist;