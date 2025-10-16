import React, { useContext } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { CartContext } from "../contexts/CartContext";
import Loader from "./Loader";

const Wishlist = () => {
  const {
    wishlist,
    isWishlistLoading,
    addToCart,
    removeFromWishlist,
  } = useContext(CartContext);

  const handleMoveToCart = async (wishlistItem) => {
    await addToCart(wishlistItem.product);
    await removeFromWishlist(wishlistItem.product);
  };

  const handleRemoveItem = async (wishlistItem) => {
    await removeFromWishlist(wishlistItem.product);
  };

  if (isWishlistLoading) {
    return <Loader text="Loading wishlist..." />;
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-[65px] ">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-4  rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] ">
        
        {/* === Centered Row Header (Text First) === */}
        <div className="flex justify-center items-center  mb-8">
          <h1 className="text-4xl font-bold tracking-tighter text-zinc-900">
            My Wishlist
          </h1>
   
        </div>
        {/* === END HEADER SECTION === */}

        {wishlist.length === 0 ? (
          <div className="text-center border-2 border-dashed border-gray-300 rounded-xl p-12">
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
          </div>
        ) : (
          <div className="space-y-4">
            {wishlist.map((wishlistItem) => {
              const item = wishlistItem.product || {};
              const discountedPrice = Math.trunc(
                item.oprice - (item.oprice * item.discount) / 100
              );

              return (
                <article
                  key={item?.id}
                  className="bg-white rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-shadow shadow-[0_4px_30px_rgba(0,0,0,0.03)] hover:shadow-sm"
                  aria-labelledby={`wl-${item?.id}-name`}
                >
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center">
                    <img
                      src={Array.isArray(item.imageurl) ? item.imageurl[0] : item.imageurl}
                      alt={item.name}
                      className="h-20 w-20 object-contain"
                      loading="lazy"
                    />
                  </div>

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
                        Size: {item.size}ml
                      </p>
                    )}

                    <p className="mt-1 text-sm font-medium text-red-600">
                      {item.stockStatus}
                    </p>
                    
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-xl font-bold text-zinc-900">
                        ₹{discountedPrice}
                      </span>
                      <span className="text-sm line-through text-gray-400">
                        ₹{item.oprice}
                      </span>
                      {item.discount > 0 && (
                        <span className="text-sm font-semibold text-green-600">
                          ({item.discount}% OFF)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex items-center gap-3 mt-4 sm:mt-0">
                    <button
                      onClick={() => handleMoveToCart(wishlistItem)}
                      aria-label="Move to Bag"
                      className="flex-1 sm:flex-initial w-full flex items-center justify-center gap-2 bg-black text-white text-sm font-medium py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
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
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;