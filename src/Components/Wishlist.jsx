import React, { useContext } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { CartContext } from "../contexts/CartContext";
import Loader from "./Loader";
import { motion, AnimatePresence } from "framer-motion"; // Added for animations

const Wishlist = () => {
  const {
    wishlist,
    isWishlistLoading,
    addToCart,
    removeFromWishlist,
    clearWishlist,
  } = useContext(CartContext);

  const handleMoveToCart = async (wishlistItem) => {
    await addToCart(wishlistItem.product);
    await removeFromWishlist(wishlistItem.product);
  };

  const handleRemoveItem = async (wishlistItem) => {
    await removeFromWishlist(wishlistItem.product);
  };

  const handleClearWishlist = () => {
    if (clearWishlist) {
      clearWishlist();
    } else {
      console.error("clearWishlist function is not provided by CartContext");
    }
  };

  if (isWishlistLoading) {
    return <Loader text="Loading wishlist..." />;
  }

  return (
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
                const item = wishlistItem.product || {};
                const discountedPrice = Math.trunc(
                  item.oprice - (item.oprice * item.discount) / 100
                );

                return (
                  <motion.article
                    key={item?.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                    className="bg-white rounded-lg p-4 flex items-start gap-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                    aria-labelledby={`wl-${item?.id}-name`}
                  >
                    {/* Left: Image */}
                    <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center">
                      <img
                        src={Array.isArray(item.imageurl) ? item.imageurl[0] : item.imageurl}
                        alt={item.name}
                        className="h-20 w-20 object-contain"
                        loading="lazy"
                      />
                    </div>

                    {/* Right: All Content */}
                    <div className="flex-grow flex flex-col min-[570px]:flex-row min-[570px]:items-center min-[570px]:gap-4">
                      {/* Text Section */}
                      <div className="flex-grow">
                        <h3
                          id={`wl-${item?.id}-name`}
                          className="text-lg font-semibold text-zinc-800"
                          title={item.name}
                        >
                          {item.name}
                        </h3>
                        
                        {item.size && (
                          <p className="text-sm text-gray-500 mt-1">
                            {item.size}ml
                          </p>
                        )}

                        <p className="mt-1 text-sm font-medium text-red-600">
                          {item.stockStatus}
                        </p>
                        
                        <div className="mt-2 flex items-baseline justify-between min-[570px]:justify-start min-[570px]:gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-zinc-900">
                              ₹{discountedPrice}
                            </span>
                            <span className="text-sm line-through text-gray-400">
                              ₹{item.oprice}
                            </span>
                          </div>
                          {item.discount > 0 && (
                            <span className="text-sm font-semibold text-green-600">
                              ({item.discount}% OFF)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Buttons Section */}
                      <div className="w-full min-[570px]:w-auto flex items-center gap-3 mt-4 min-[570px]:mt-0">
                        <button
                          onClick={() => handleMoveToCart(wishlistItem)}
                          aria-label="Move to Bag"
                          className="flex-1 min-[570px]:flex-initial w-full flex items-center justify-center gap-2 bg-black text-white text-sm font-medium py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Move to Bag
                        </button>
                        <button
                          onClick={() => handleRemoveItem(wishlistItem)}
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
  );
};

export default Wishlist;