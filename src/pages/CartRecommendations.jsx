// src/pages/CartRecommendations.jsx
import React, { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart, FaMagic } from "react-icons/fa";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";
import HeroButton from "../Components/HeroButton"; 
import { optimizeImage } from "../utils/imageOptimizer";

// --- ANIMATION CONFIGURATION ---
const gpuStyle = {
  backfaceVisibility: "hidden",
  perspective: 1000,
  willChange: "transform, opacity",
};

const rigidTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.35,
};

const CartRecommendations = ({ currentCartItems = [] }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);

  const { addToCart } = useContext(CartContext);
  const { userdetails } = useContext(UserContext);

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  // Create a stable ID list to detect cart changes correctly
  const cartIds = useMemo(() => {
    const ids = (currentCartItems || []).map(item => item.product?.id || item.productId || item.id).sort();
    return JSON.stringify(ids);
  }, [currentCartItems]);

  // --- FETCH RECOMMENDATIONS ---
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const excludeIds = (currentCartItems || []).map(
          (item) => item.product?.id || item.productId || item.id
        ).filter(Boolean);

        const res = await fetch(`${BACKEND_URL}/api/products/recommendations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            excludeIds,
            userId: userdetails?.id || null, 
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setRecommendations(data);
          }
        }
      } catch (err) {
        console.error("Failed to load recommendations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [cartIds, userdetails?.id, BACKEND_URL]);

  // --- HANDLER: Add to Cart ---
  const handleAddToCart = (variant, product) => {
    if (addingProductId) return;
    setAddingProductId(variant.id);
    addToCart(product, variant, 1);
    setTimeout(() => setAddingProductId(null), 1000);
  };

  if (recommendations.length === 0) return null;

  return (
    <div className="pt-12 mt-8 border-t border-gray-100">
      
      {/* --- HEADER --- */}
      <div className="flex items-center gap-3 mb-8 px-1">
        <div className="p-2.5 bg-[#FEF9E8] rounded-full text-[#D4AF37] border border-[#FDEECC]">
            <FaMagic className="w-4 h-4" /> 
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-serif text-gray-900 leading-none">
            Recommended for You
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-1.5 tracking-wide">
            Curated based on your taste profile
          </p>
        </div>
      </div>

      {/* --- GRID / SCROLL CONTAINER --- */}
      {/* Mobile: flex overflow-x-auto (Horizontal Scroll) 
          Desktop: grid grid-cols-4 (Standard Grid)
      */}
      <motion.div
        className="flex md:grid md:grid-cols-4 gap-4 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0"
      >
        <AnimatePresence mode="popLayout">
          {recommendations.map((product) => {
            const variants = product.variants || [];
            if (variants.length === 0) return null;

            // Find cheapest variant
            const cheapestVariant = variants.reduce(
              (cheapest, current) =>
                current.oprice < cheapest.oprice ? current : cheapest,
              variants[0]
            );

            const price = Math.trunc(
              cheapestVariant.oprice * (1 - (cheapestVariant.discount || 0) / 100)
            );
            const isAdding = addingProductId === cheapestVariant.id;
            
            const imageUrl = Array.isArray(product.imageurl) && product.imageurl.length > 0
              ? optimizeImage(product.imageurl[0], 'card')
              : "/placeholder.png";

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={gpuStyle}
                transition={rigidTransition}
                // 🟢 MATCHED CARD STYLING (Fixed width on mobile for scroll)
                className="group relative flex flex-col bg-white rounded-2xl min-w-[180px] w-[60vw] md:w-auto flex-shrink-0 snap-center h-full border border-transparent hover:border-gray-100 transition-colors"
              >
                
                {/* --- IMAGE SECTION --- */}
                <div 
                  className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-50 mb-3 cursor-pointer"
                  onClick={() => {
                    window.scrollTo(0,0);
                    navigate(`/product/${product.id}`);
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  
                  {/* Discount Badge */}
                  {cheapestVariant.discount > 0 && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      -{cheapestVariant.discount}%
                    </div>
                  )}

                  {/* Quick View Overlay (Desktop Only) */}
                  <div className="absolute inset-0 bg-black/10 transition-opacity duration-300 opacity-0 group-hover:opacity-100 hidden md:block" />
                </div>

                {/* --- CONTENT SECTION --- */}
                <div className="flex flex-col gap-1 px-1 flex-grow">
                  
                  {/* Title */}
                  <h3 
                    className="font-serif text-lg text-gray-900 group-hover:underline decoration-gray-300 underline-offset-4 decoration-1 truncate cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {product.name}
                  </h3>

                  {/* Price Row */}
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <span className="font-bold text-gray-900">₹{price}</span>
                    {cheapestVariant.discount > 0 && (
                      <span className="text-gray-400 line-through text-xs">
                        ₹{cheapestVariant.oprice}
                      </span>
                    )}
                  </div>

                  {/* Add Button */}
                  <HeroButton
                    onClick={() => handleAddToCart(cheapestVariant, product)}
                    disabled={isAdding}
                    className="mt-auto w-full py-2.5 rounded-xl text-xs font-bold bg-black text-white hover:bg-gray-800 transition-all shadow-none hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {isAdding ? (
                       <span className="animate-pulse">Adding...</span>
                    ) : (
                       <>Add to Bag <FaShoppingCart size={12} /></>
                    )}
                  </HeroButton>

                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default CartRecommendations;