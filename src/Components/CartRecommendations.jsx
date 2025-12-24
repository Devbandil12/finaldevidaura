import React, { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart, FaMagic } from "react-icons/fa";
import { FiCheckCircle } from "react-icons/fi"; 
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";
import HeroButton from "./HeroButton"; // 🟢 Added HeroButton import

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
  }, [cartIds, userdetails?.id, BACKEND_URL]); // Dependencies ensure refetch on cart change

  // --- HANDLER: Add to Cart ---
  const handleAddToCart = (variant, product) => {
    if (addingProductId) return;
    setAddingProductId(variant.id);
    addToCart(product, variant, 1);
    // setTimeout(() => setAddingProductId(null));
  };

  if (recommendations.length === 0) return null;

  return (
    <div className="pt-8 mt-12 border-t border-gray-100">
      {/* Header Section */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-yellow-50 rounded-full text-[#D4AF37]">
            <FaMagic className="w-5 h-5" /> 
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-none">
            Recommended
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-1">
            Curated based on your taste profile
          </p>
        </div>
      </div>

      {/* Grid Section */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
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

            // Price Calc
            const price = Math.trunc(
              cheapestVariant.oprice * (1 - (cheapestVariant.discount || 0) / 100)
            );
            const showLineThrough =
              Number(cheapestVariant.oprice) > Number(price) &&
              Number(cheapestVariant.discount) > 0;

            const isAdding = addingProductId === cheapestVariant.id;
            
            const imageUrl = Array.isArray(product.imageurl)
              ? product.imageurl[0]
              : product.imageurl?.default || product.image || "/placeholder.png";

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={gpuStyle}
                transition={rigidTransition}
                // 🟢 MATCHED DESIGN: Exact class string from your provided snippet
                className="bg-white rounded-xl overflow-hidden flex flex-col shadow-lg shadow-gray-100/50 border border-gray-50 group h-full"
              >
                {/* Image Section */}
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer" 
                    onClick={() => navigate(`/product/${product.id}`)}
                  />


                  {/* 🟢 MATCHED DESIGN: Quick View Overlay */}
                  <div
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <span className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full">
                      View Details
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-3 flex-grow flex flex-col justify-between text-left">
                  <div>
                    {/* 🟢 MATCHED DESIGN: Title Typography */}
                    <h3
                      className="font-bold text-sm text-gray-900 leading-tight mb-1 cursor-pointer hover:underline truncate"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {product.name}
                    </h3>
                    
                    {/* 🟢 MATCHED DESIGN: Subtitle Typography */}
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">
                        {cheapestVariant.size} ml 
                    </p>

                    {/* 🟢 MATCHED DESIGN: Price Row */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-bold text-sm text-gray-900">
                        ₹{price}
                      </span>
                      {showLineThrough && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{cheapestVariant.oprice}
                        </span>
                      )}
                      {Number(cheapestVariant.discount) > 0 && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1 rounded">
                          -{cheapestVariant.discount}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 🟢 MATCHED DESIGN: HeroButton Implementation */}
              <HeroButton
                    onClick={() => handleAddToCart(cheapestVariant, product)}
                    disabled={isAdding}
                    className="mt-auto w-full py-2 rounded-xl flex justify-center items-center gap-2 transition-all duration-200 bg-black text-white hover:bg-gray-900 shadow-sm"
                  >
                    <span className="flex items-center gap-2 text-xs tracking-wide">
                        Add to Cart <FaShoppingCart size={14} />
                    </span>
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