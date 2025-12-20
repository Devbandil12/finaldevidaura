import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { ProductContext } from "../contexts/productContext";
import { UserContext } from "../contexts/UserContext";
import { CartContext } from "../contexts/CartContext";
import { CouponContext } from "../contexts/CouponContext";

import Loader from "./Loader";
import MiniLoader from "./MiniLoader";
import HeroButton from "./HeroButton";
import { FaShoppingCart, FaTrashAlt } from "react-icons/fa";
import { FiGift, FiCheckCircle, FiX, FiBell, FiChevronRight, FiSearch, FiTag, FiInfo, FiClock, FiHeart } from "react-icons/fi";

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

const itemVariants = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: rigidTransition 
  },
  exit: { 
    opacity: 0, 
    scale: 0.98, 
    transition: { duration: 0.2, ease: "easeIn" } 
  }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: rigidTransition
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.15, ease: "easeIn" } 
  }
};

// --- NEW HELPER: Bundle Items List (Responsive) ---
const BundleItemsList = ({ items, isCompact = false }) => {
  if (!items || !Array.isArray(items) || items.length === 0) return null;

  return (
    <div className={`mt-2 grid gap-2 ${isCompact ? "grid-cols-1" : "grid-cols-2 md:grid-cols-2 lg:grid-cols-4"}`}>
      {items.map((subItem, index) => (
        <div 
          key={index} 
          className="relative overflow-hidden rounded-lg border border-gray-100 bg-gray-50 p-2 flex items-center gap-2"
        >
           {/* Small Dot Indicator */}
           <div className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />
           <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate text-[10px] sm:text-xs">
                  {subItem.product?.name || subItem.name}
              </p>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider">
                  {subItem.variant?.size || subItem.variantName || "30ml"}
              </p>
           </div>
        </div>
      ))}
    </div>
  );
};

// --- HELPER COMPONENT: Offer Instructions ---
const OfferInstructionCard = ({ offer, minimalist = false }) => {
  const generateInstruction = () => {
    const {
      discountType,
      discountValue,
      minOrderValue,
      cond_requiredCategory,
      cond_requiredSize,
      action_targetSize,
      action_targetMaxPrice,
      action_buyX,
      action_getY,
    } = offer;

    if (discountType === "free_item" && cond_requiredCategory && action_targetSize && !action_buyX) {
      let text = `Add any item from the "${cond_requiredCategory}" category and a ${action_targetSize}ml perfume`;
      if (action_targetMaxPrice) text += ` (up to ₹${action_targetMaxPrice})`;
      text += " to your cart to get the perfume for free!";
      return text;
    }
    if (
      discountType === "free_item" &&
      action_buyX &&
      action_getY &&
      cond_requiredSize &&
      action_targetSize
    ) {
      let text = `Buy ${action_buyX} perfume(s) of ${cond_requiredSize}ml, and get ${action_getY} perfume(s) of ${action_targetSize}ml for free`;
      if (action_targetMaxPrice) text += ` (up to ₹${action_targetMaxPrice} value)`;
      text += ". Add all items to your cart to apply.";
      return text;
    }
    if (discountType === "free_item" && action_buyX && action_getY && action_targetSize && !cond_requiredSize) {
      return `Buy ${action_buyX} ${action_targetSize}ml perfume(s), get ${action_getY} free! Add all ${action_buyX + action_getY} items to your cart to apply.`;
    }
    if (discountType === "percent") {
      let text = `Get ${discountValue}% off your order`;
      if (minOrderValue > 0) text += ` when you spend ₹${minOrderValue} or more`;
      text += ". Applied automatically at checkout.";
      return text;
    }
    if (discountType === "flat") {
      let text = `Get ₹${discountValue} off your order`;
      if (minOrderValue > 0) text += ` when you spend ₹${minOrderValue} or more`;
      text += ". Applied automatically at checkout.";
      return text;
    }
    return offer.description || "Special offer available.";
  };

  return (
    <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${minimalist ? "py-3 px-3 text-sm" : ""}`}>
      <div className="flex items-start gap-3">
        <FiTag className={`mt-1 text-black ${minimalist ? "w-3 h-3" : ""}`} />
        <div>
            {!minimalist && <p className="font-bold text-gray-900">{offer.code}</p>}
            <p className={`${minimalist ? "text-gray-700" : "text-sm text-gray-600 mt-1"}`}>{generateInstruction()}</p>
        </div>
      </div>
    </div>
  );
};

const ShoppingCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useUser();
  const [checkoutError, setCheckoutError] = useState("");
  const [pincode, setPincode] = useState("");
  const [pincodeDetails, setPincodeDetails] = useState(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);

  const { products } = useContext(ProductContext);
  const { userdetails } = useContext(UserContext);
  const {
    cart,
    buyNow,
    changeCartQuantity,
    removeFromCart,
    clearCart,
    isCartLoading,
    startBuyNow,
    clearBuyNow,
    addToCart,
    savedItems,
    saveForLater,
    moveSavedToCart,
    removeSavedItem,
  } = useContext(CartContext);

  const { availableCoupons, isCouponValid, loadAvailableCoupons, validateCoupon, autoOfferInstructions } =
    useContext(CouponContext);

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [manualCouponCode, setManualCouponCode] = useState("");
  const [showOffers, setShowOffers] = useState(false); 
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponSearch, setCouponSearch] = useState(""); 

  const isBuyNowFromNavigation = location.state?.isBuyNow;
  const isBuyNowActive = isBuyNowFromNavigation || !!buyNow;

  // --- SCROLL LOCK ---
  useEffect(() => {
    if (isCouponModalOpen || showOffers) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const styles = { overflow: "hidden", height: "100vh", touchAction: "none", paddingRight: `${scrollbarWidth}px` };
      Object.assign(document.body.style, styles);
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.touchAction = "";
      document.body.style.paddingRight = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.touchAction = "";
      document.body.style.paddingRight = "";
      document.documentElement.style.overflow = "";
    };
  }, [isCouponModalOpen, showOffers]);

  // --- FILTER COUPONS ---
  const filteredCoupons = useMemo(() => {
    if (!couponSearch) return availableCoupons;
    const lowerSearch = couponSearch.toLowerCase();
    return availableCoupons.filter(
        (c) => 
            c.code.toLowerCase().includes(lowerSearch) || 
            (c.description && c.description.toLowerCase().includes(lowerSearch))
    );
  }, [availableCoupons, couponSearch]);

  // --- DATA NORMALIZATION ---
  const normalizeBuyNow = useCallback(
    (bn) => {
      if (!bn) return null;
      const normalized = {
        product: bn.product ?? (bn.productId ? { id: bn.productId, name: bn.productName, imageurl: bn.productImageUrl } : undefined),
        variant: bn.variant ?? (bn.variantId ? { id: bn.variantId, oprice: bn.oprice ?? bn.listPrice, discount: bn.discount ?? 0, name: bn.variantName, size: bn.size, stock: bn.stock ?? 999 } : undefined),
        quantity: typeof bn.quantity === "number" ? bn.quantity : 1,
        isBundle: bn.isBundle ?? false,
        contents: bn.contents ?? [],
      };
      return normalized;
    },
    []
  );

  const buyNowItemArray = useMemo(() => {
    if (!buyNow) return [];
    const n = normalizeBuyNow(buyNow);
    return [n];
  }, [buyNow, normalizeBuyNow]);

  // --- ITEM RENDERING LOGIC (PURE STATE - NO HIDING) ---
  const itemsToRender = isBuyNowActive && buyNow ? buyNowItemArray : cart;
  const visibleSavedItems = savedItems;

  const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  const [breakdown, setBreakdown] = useState({
    productTotal: 0,
    deliveryCharge: 0,
    discountAmount: 0,
    total: 0,
    originalTotal: 0,
    codAvailable: false,
    offerDiscount: 0,
    appliedOffers: [],
  });
  const [loadingPrices, setLoadingPrices] = useState(true);

  const lastRequestRef = useRef("");

  // --- PRICE FETCHING ---
  useEffect(() => {
    if (isCartLoading || itemsToRender.length === 0) {
      setLoadingPrices(false);
      if (itemsToRender.length === 0) {
        setBreakdown({
          productTotal: 0,
          deliveryCharge: 0,
          discountAmount: 0,
          total: 0,
          originalTotal: 0,
          codAvailable: false,
          offerDiscount: 0,
          appliedOffers: [],
        });
        lastRequestRef.current = "";
      }
      return;
    }

    const fetchBreakdown = async () => {
      const requestBody = {
        cartItems: itemsToRender.map((i) => ({
          variantId: i.variant?.id ?? i.variantId,
          quantity: i.quantity,
          productId: i.product?.id ?? i.productId,
        })),
        couponCode: appliedCoupon?.code || null,
        isCart: true,
        pincode: null,
      };

      const requestString = JSON.stringify(requestBody);
      if (lastRequestRef.current === requestString) {
        return;
      }

      setLoadingPrices(true);
      try {
        const res = await fetch(`${API_BASE}/api/payments/breakdown`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestString,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.msg || "Failed to fetch price details.");
        }
        const data = await res.json();
        const returned = data.breakdown ?? data;

        setBreakdown(returned);
        lastRequestRef.current = requestString;
      } catch (error) {
        console.error("Price breakdown error:", error);
      } finally {
        setLoadingPrices(false);
      }
    };

    const timer = setTimeout(() => fetchBreakdown(), 300);
    return () => clearTimeout(timer);

  }, [itemsToRender, appliedCoupon?.code, isCartLoading, API_BASE]);

  useEffect(() => {
    if (userdetails?.id) {
      loadAvailableCoupons(userdetails.id);
    }
  }, [userdetails?.id, loadAvailableCoupons]);

  useEffect(() => {
    if (isBuyNowActive && !buyNow) {
      navigate("/cart", { replace: true, state: {} });
      return;
    }
    const isAnyItemOutOfStock = itemsToRender.some((item) => item.variant && item.variant.stock <= 0);
    if (!isAnyItemOutOfStock) {
      setCheckoutError("");
    }
  }, [itemsToRender, isBuyNowActive, buyNow, navigate, setCheckoutError]);

  const handlePincodeChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setPincode(value);
      if (pincodeDetails) {
        setPincodeDetails(null);
      }
    }
  };

  async function checkDeliveryAvailability() {
    if (!/^\d{6}$/.test(pincode)) {
      return window.toast.error("Please enter a valid 6-digit pincode.");
    }
    setPincodeLoading(true);
    setPincodeDetails(null);
    try {
      const res = await fetch(`${API_BASE}/api/address/pincode/${pincode}`);
      const data = await res.json();
      if (data.success) {
        setPincodeDetails(data.data);
      } else {
        window.toast.error(data.msg || "Failed to check pincode");
      }
    } catch (err) {
      console.error("checkDeliveryAvailability error:", err);
      window.toast.error("Network error while checking pincode");
    } finally {
      setPincodeLoading(false);
    }
  }

  const handleCheckout = () => {
    setCheckoutError("");
    if (!itemsToRender.length) {
      window.toast.error("Your cart is empty.");
      return;
    }
    const outOfStockItem = itemsToRender.find((item) => item.variant.stock <= 0);
    if (outOfStockItem) {
      setCheckoutError(
        `Sorry, "${outOfStockItem.product.name} (${outOfStockItem.variant.name})" is out of stock. Please remove it.`
      );
      return;
    }

    const fullCartItems = itemsToRender.map((item) => {
      const price = Math.floor(item.variant.oprice * (1 - item.variant.discount / 100));
      const imageUrl =
        Array.isArray(item.product.imageurl) && item.product.imageurl.length > 0 ? item.product.imageurl[0] : null;
      return {
        product: {
          id: item.product.id,
          name: item.product.name,
          imageurl: imageUrl,
        },
        variant: {
          id: item.variant.id,
          name: item.variant.name,
          size: item.variant.size,
          oprice: item.variant.oprice,
          discount: item.variant.discount,
          price: price,
        },
        quantity: item.quantity || 1,
        totalPrice: price * (item.quantity || 1),
        isBundle: item.isBundle || false,
        contents: item.contents || [],
      };
    });
    localStorage.setItem("selectedItems", JSON.stringify(fullCartItems));
    localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));

    if (!isSignedIn) {
      sessionStorage.setItem("post_login_redirect", "/checkout");
      navigate("/login", { replace: true });
      return;
    }
    sessionStorage.setItem("checkout_intent", JSON.stringify({ ts: Date.now() }));
    navigate("/checkout");
  };

  const callStartBuyNow = useCallback(
    (itemLike) => {
      const normalized = normalizeBuyNow(itemLike);
      startBuyNow(normalized);
    },
    [normalizeBuyNow, startBuyNow]
  );

  const handleQuantityChange = (item, delta) => {
    const nextQty = Math.max(1, (item.quantity || 1) + delta);
    if (isBuyNowActive) {
      callStartBuyNow({ ...item, quantity: nextQty });
    } else {
      changeCartQuantity(item.variant, nextQty);
    }
  };

  const handleRemove = (item) => {
    if (isBuyNowActive) {
      clearBuyNow();
    } else {
      removeFromCart(item.variant);
    }
  };

  const handleSaveForLater = (item) => {
    if (isBuyNowActive) return; 
    saveForLater(item);
  };

  const handleMoveToCart = (item) => {
    moveSavedToCart(item);
  };

  const handleRemoveSavedItem = (variantId) => {
    removeSavedItem(variantId);
  }

  const handleApplyCoupon = useCallback(
    async (coupon) => {
      const validated = await validateCoupon(coupon.code, userdetails?.id);
      if (validated) {
        const postOfferTotal = Number(breakdown.productTotal || 0) - Number(breakdown.offerDiscount || 0);
        if (isCouponValid(validated, itemsToRender, postOfferTotal)) {
          setAppliedCoupon(validated);
          window.toast.success(`Coupon ${validated.code} applied!`);
        } else {
          setAppliedCoupon(null);
        }
      } else {
        setAppliedCoupon(null);
      }
    },
    [itemsToRender, userdetails?.id, isCouponValid, validateCoupon, breakdown]
  );

  const handleManualApply = async () => {
    if (!manualCouponCode) {
      return window.toast.error("Please enter a coupon code");
    }
    const validated = await validateCoupon(manualCouponCode, userdetails?.id);
    if (validated) {
      const postOfferTotal = Number(breakdown.productTotal || 0) - Number(breakdown.offerDiscount || 0);
      if (isCouponValid(validated, itemsToRender, postOfferTotal)) {
        setAppliedCoupon(validated);
        window.toast.success(`Coupon ${validated.code} applied!`);
      } else {
        setAppliedCoupon(null);
      }
    } else {
      setAppliedCoupon(null);
    }
  };

  const handleAddToCart = (variant, product) => {
    if (addingProductId) return;
    setAddingProductId(variant.id);
    addToCart(product, variant, 1);
    setTimeout(() => {
      setAddingProductId(null);
    }, 1500);
  };

  const handleExitBuyNow = () => {
    clearBuyNow();
    navigate("/cart", { replace: true, state: {} });
  };

  const suggestedProducts = useMemo(() => {
    if (isBuyNowActive) return [];

    return products
      .filter((p) => p.variants && p.variants.length > 0 && p.category !== "Template")
      .map((product) => {
        const cheapestVariant = product.variants.reduce(
          (cheapest, current) => (current.oprice < cheapest.oprice ? current : cheapest),
          product.variants[0]
        );
        
        const inSaved = savedItems.some((s) => s.variant?.id === cheapestVariant.id);
        if (inSaved) return null;

        const inCart = cart.some((c) => c.variant?.id === cheapestVariant.id);
        if (inCart) return null;
        
        return { product, cheapestVariant };
      })
      .filter(Boolean);
  }, [products, cart, savedItems, isBuyNowActive]);

  const productDiscount = Number(breakdown.originalTotal || 0) - Number(breakdown.productTotal || 0);
  const finalPrice =
    typeof breakdown.totalExcludingDelivery !== "undefined" ? breakdown.totalExcludingDelivery : breakdown.total;

  useEffect(() => {
    if (appliedCoupon && !isCouponValid(appliedCoupon, itemsToRender, Number(breakdown.productTotal || 0) - Number(breakdown.offerDiscount || 0))) {
      setAppliedCoupon(null);
    }
  }, [itemsToRender, appliedCoupon, isCouponValid, breakdown]);

  const isLoading = !isBuyNowActive && isCartLoading;

  return (
    <>
      <title>{isLoading ? "Loading Cart... | Devid Aura" : isBuyNowActive ? "Buy Now | Devid Aura" : "Shopping Cart | Devid Aura"}</title>
      <meta name="description" content="Review your selected items, apply coupons, and proceed to a secure checkout. Manage your Devid Aura shopping experience." />

      {/* Auto Offer Modal */}
      <AnimatePresence>
        {showOffers && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.2 }}
            style={{ willChange: "opacity" }} 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
            onClick={() => setShowOffers(false)}
          >
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={gpuStyle} 
              onClick={(e) => e.stopPropagation()} 
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="bg-black p-5 flex justify-between items-center text-white sticky top-0 z-10">
                <h3 className="text-lg font-bold flex items-center gap-2">
                   <FiGift className="text-white" />
                   Automatic Offers & Help
                </h3>
                <button onClick={() => setShowOffers(false)} className="text-white/70 hover:text-white transition-colors">
                  <FiX size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 border-b pb-2">How Automatic Coupons Work</h4>
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                        <div>
                        <h4 className="font-bold text-gray-900 mb-1">Add Items to Cart</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">Simply browse our collection and add the products you love to your cart.</p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-100"></div>
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Current Active Offers</h4>
                  <div className="space-y-3">
                    {autoOfferInstructions.length > 0 ? (
                      autoOfferInstructions.map((offer) => <OfferInstructionCard key={offer.id} offer={offer} />)
                    ) : (
                      <p className="text-sm text-gray-500 italic">No automatic offers are currently active.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                <button 
                  onClick={() => setShowOffers(false)}
                  className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coupon Modal */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ willChange: "opacity" }}
            onClick={() => setIsCouponModalOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={gpuStyle}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-bold text-black tracking-tight">Select Coupon</h3>
                  <p className="text-xs text-gray-500 mt-1">Find the best deal for your order</p>
                </div>
                <button
                  onClick={() => setIsCouponModalOpen(false)}
                  className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-black hover:text-white transition-all duration-200"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="px-5 pt-4 pb-2">
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search coupons..." 
                        value={couponSearch}
                        onChange={(e) => setCouponSearch(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    />
                </div>
              </div>
              <div className="p-5 overflow-y-auto space-y-4 bg-white flex-grow">
                {filteredCoupons.length > 0 ? (
                  filteredCoupons.map((coupon) => (
                    <motion.div
                      layout
                      whileHover={{ scale: 1.01, borderColor: "#000000" }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      key={coupon.id}
                      style={{ willChange: "transform" }}
                      className="group relative flex w-full bg-white border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-default min-h-[80px] transition-colors duration-300"
                    >
                      {/* Ticket Body (White) */}
                      <div className="flex-1 p-4 flex flex-col justify-center border-r-2 border-dashed border-gray-200 group-hover:border-gray-900 transition-colors duration-300">
                          <div className="flex items-center gap-2 mb-1">
                             <FiTag className="text-gray-400 group-hover:text-black transition-colors" size={16} />
                             <span className="font-bold text-black text-lg tracking-wide uppercase">
                                {coupon.code}
                             </span>
                          </div>
                          <span className="text-xs text-gray-500 leading-relaxed">
                           {coupon.description}
                          </span>
                      </div>

                      {/* Ticket Stub (Action Area - White) */}
                      <div className="w-[28%] flex items-center justify-center p-3 bg-gray-50/30">
                        <button
                            onClick={() => {
                              handleApplyCoupon(coupon);
                              setIsCouponModalOpen(false);
                              setCouponSearch("");
                            }}
                            className="text-xs font-bold text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-all shadow-sm w-full"
                        >
                            APPLY
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 flex flex-col items-center justify-center text-gray-400">
                    <FiSearch size={40} className="mb-3 opacity-20" />
                    <p className="font-medium text-gray-900">No coupons found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <Loader text="Loading cart..." />
      ) : (
        <main className="max-w-6xl mx-auto my-4 sm:my-8 px-4 w-full flex flex-col gap-8">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 pt-[50px]">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <FaShoppingCart />
              {isBuyNowActive ? "Buy Now" : "Shopping Cart"}
            </h1>

            <div className="flex items-center gap-4">
              {autoOfferInstructions.length > 0 && !isBuyNowActive && (
                <motion.button onClick={() => setShowOffers(true)} className="relative text-gray-500 hover:text-black" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <FiBell className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">{autoOfferInstructions.length}</span>
                </motion.button>
              )}

              {!isBuyNowActive && cart.length > 0 && (
                <motion.button onClick={clearCart} className="bg-transparent border border-gray-200 text-gray-500 py-2 px-4 rounded-xl cursor-pointer flex items-center gap-2 font-medium transition-colors duration-200 ease-in-out hover:bg-red-50 hover:text-red-600 hover:border-red-600" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <FaTrashAlt /> <span className="hidden sm:inline">Clear Cart</span>
                </motion.button>
              )}

              {isBuyNowActive && (
                <motion.button onClick={handleExitBuyNow} className="bg-transparent border border-gray-200 text-gray-500 py-2 px-4 rounded-xl cursor-pointer flex items-center gap-2 font-medium transition-colors duration-200 ease-in-out hover:bg-gray-100 hover:text-gray-800" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <FiX /> <span className="hidden sm:inline">Exit Buy Now</span>
                </motion.button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] lg:items-start gap-8">
            <motion.div layout className="flex flex-col gap-4 relative">
              <AnimatePresence mode="popLayout">
                {itemsToRender.length > 0 ? (
                  itemsToRender.map((item) => {
                    if (!item || !item.product || !item.variant) return null;

                    const itemImageUrl = Array.isArray(item.product.imageurl) && item.product.imageurl.length > 0 ? item.product.imageurl[0] : "/placeholder.png";
                    const isFree = (breakdown.appliedOffers || []).some((offer) => offer.appliesToVariantId === item.variant.id);
                    const isOutOfStock = Number(item.variant.stock || 0) <= 0;
                    const sellingPrice = Math.floor(Number(item.variant.oprice || 0) * (1 - (Number(item.variant.discount || 0) / 100)));
                    const showLineThrough = Number(item.variant.oprice || 0) > Number(sellingPrice) && Number(item.variant.discount || 0) > 0;

                    return (
                      <motion.div 
                        key={item.variant.id} 
                        layout 
                        transition={rigidTransition} // <--- STRICT NO BOUNCE
                        variants={itemVariants} 
                        initial="initial" 
                        animate="animate" 
                        exit="exit"
                        style={gpuStyle}
                        className="relative"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 bg-white p-4 rounded-xl shadow-lg shadow-gray-100/50 border border-gray-50 transition duration-300 ease-in-out">
                          
                          {/* Top Section on Mobile (Image + Details) */}
                          <div className="flex flex-row gap-4 w-full sm:w-auto">
                              <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                                <img 
                                    src={itemImageUrl} 
                                    alt={item.product.name} 
                                    className="w-full h-full object-cover rounded-lg"
                                    loading="eager"
                                />
                                {isOutOfStock && (
                                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] rounded-lg flex flex-col items-center justify-center z-10">
                                    <span className="text-[10px] font-bold text-red-900  px-1.5 py-0.5 text-center leading-tight">OUT OF STOCK</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex-grow w-full text-left">
                                <h2 className={`text-base sm:text-lg font-semibold mb-1 ${isOutOfStock ? "text-gray-500" : ""}`}>{item.product.name}</h2>
                                {item.isBundle ? (
                                  <BundleItemsList items={item.contents} />
                                ) : (
                                  <p className="text-xs sm:text-sm text-gray-500">{item.variant.size} ml</p>
                                )}

                                <div className="flex items-baseline gap-2 mt-2 justify-start">
                                  {isFree ? (
                                    <span className="text-sm sm:text-base font-bold text-green-600">Free</span>
                                  ) : (
                                    <span className={`text-sm sm:text-base font-bold ${isOutOfStock ? "text-gray-400" : ""}`}>₹{sellingPrice}</span>
                                  )}

                                  {showLineThrough && <span className="text-xs sm:text-sm text-gray-500 line-through">₹{item.variant.oprice}</span>}
                                </div>
                              </div>
                          </div>

                          {/* Controls Section */}
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 gap-3 sm:gap-4 flex-shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                            <div className={`flex items-center gap-1 sm:gap-2 border border-gray-200 rounded-xl overflow-hidden ${isOutOfStock ? "opacity-50 pointer-events-none" : ""}`}>
                              <button onClick={() => handleQuantityChange(item, -1)} disabled={item.quantity <= 1} className="bg-transparent border-none w-7 h-7 sm:w-9 sm:h-9 text-lg sm:text-xl cursor-pointer text-gray-800 transition-colors hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed">–</button>
                              <span className="font-semibold min-w-[20px] text-center text-sm sm:text-base">{item.quantity}</span>
                              <button onClick={() => handleQuantityChange(item, 1)} className="bg-transparent border-none w-7 h-7 sm:w-9 sm:h-9 text-lg sm:text-xl cursor-pointer text-gray-800 transition-colors hover:bg-gray-100">+</button>
                            </div>
                            <div className="flex gap-4 sm:gap-6">
                              <button onClick={() => handleRemove(item)} className="bg-transparent border-none text-gray-500 cursor-pointer text-xs sm:text-sm font-medium  hover:text-gray-800">Remove</button>
                              {!isBuyNowActive && (
                                <button onClick={() => handleSaveForLater(item)} className="bg-transparent border-none text-gray-500 cursor-pointer text-xs sm:text-sm font-medium  hover:text-gray-800">Save for Later</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div 
                    key="empty-cart-message"
                    layout 
                    variants={itemVariants} 
                    initial="initial" 
                    animate="animate" 
                    exit="exit"
                    transition={rigidTransition} // <--- STRICT NO BOUNCE
                    style={gpuStyle}
                    className="text-center p-8 bg-white  transition-shadow"
                  >
                    <h3 className="text-lg mb-2">Your cart is empty.</h3>
                    <p className="text-gray-500">Looks like you haven't added anything to your cart yet.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Sidebar (Order Summary) */}
            <div className="sticky top-6">
              <div className="bg-white p-6 rounded-xl shadow-lg shadow-gray-100/50 border border-gray-50">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

                {loadingPrices ? (
                  <div className="py-2 space-y-4 animate-pulse">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                    </div>
                    <hr className="border-t border-gray-200 my-4" />
                    <div className="flex justify-between">
                      <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                      <div className="h-6 bg-gray-300 rounded w-1/4"></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between mb-4 text-base">
                      <span className="text-gray-500">Original Price</span>
                      <span className={`font-semibold ${productDiscount > 0 ? "line-through" : ""}`}>
                        ₹{Number(breakdown.originalTotal || 0).toFixed(2)}
                      </span>
                    </div>

                    {productDiscount > 0 && (
                      <div className="flex justify-between mb-4 text-base">
                        <span className="text-gray-500">Product Discount</span>
                        <span className="font-semibold text-green-600">- ₹{productDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {breakdown.appliedOffers &&
                      Array.isArray(breakdown.appliedOffers) &&
                      breakdown.appliedOffers.map((offer, index) => (
                        <div key={index} className="flex justify-between mb-4 text-base">
                          <span className="font-semibold text-green-600">{offer.title}</span>
                          <span className="font-semibold text-green-600">- ₹{Number(offer.amount || 0).toFixed(2)}</span>
                        </div>
                      ))}

                    {appliedCoupon && (
                      <div className="flex justify-between mb-4 text-base">
                        <span className="text-gray-500">Coupon Discount</span>
                        <span className="font-semibold text-green-600">- ₹{Number(breakdown.discountAmount || 0).toFixed(2)}</span>
                      </div>
                    )}

                    <hr className="border-t border-gray-200 my-4" />
                    <div className="flex justify-between mb-4 text-lg font-bold">
                      <span>
                        Final Amount
                      </span>
                      <span>₹{Number(finalPrice || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}

                {/* --- SIDEBAR COUPON SECTION --- */}
                <div className="mt-6">
                  <h3 className="flex items-center gap-2 font-semibold mb-4 text-gray-800">
                    <FiGift className="text-black" /> Apply Coupon
                  </h3>

                  <div className="flex mb-3 relative">
                    <input
                      type="text"
                      placeholder="Enter Coupon Code"
                      value={manualCouponCode}
                      onChange={(e) => setManualCouponCode(e.target.value.toUpperCase())}
                      className="flex-grow min-w-0 border border-gray-300 bg-gray-50 px-4 rounded-xl h-12 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleManualApply}
                      className="absolute right-1 top-1 bottom-1 bg-black text-white text-xs font-bold px-4 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      APPLY
                    </motion.button>
                  </div>

                  <AnimatePresence mode="wait">
                    {appliedCoupon ? (
                      <motion.div
                        key="applied"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between bg-green-50 border border-green-200 border-dashed rounded-xl p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-2 rounded-full text-green-600">
                            <FiCheckCircle size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-green-800 text-sm">{appliedCoupon.code}</p>
                            <p className="text-[10px] text-green-700">Applied successfully</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setAppliedCoupon(null)}
                          className="text-gray-400 hover:text-red-500 p-2"
                        >
                          <FiX size={18} />
                        </button>
                      </motion.div>
                    ) : availableCoupons.length > 0 ? (
                      <motion.button
                        key="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        onClick={() => setIsCouponModalOpen(true)}
                        className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-black hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 p-2 rounded-full text-black group-hover:bg-black group-hover:text-white transition-colors">
                            <FiGift size={18} />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900 text-sm">
                              Available Offers
                            </p>
                            <p className="text-xs text-gray-500">
                              {availableCoupons.length} Coupons for you
                            </p>
                          </div>
                        </div>
                        <div className="text-gray-400 group-hover:text-black">
                           <FiChevronRight size={20} />
                        </div>
                      </motion.button>
                    ) : null}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {checkoutError && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-red-50 text-red-600 rounded-xl p-4 my-4 text-center text-sm font-semibold">
                      {checkoutError}
                    </motion.div>
                  )}
                </AnimatePresence>
                <HeroButton className="w-full py-3 mt-4 text-base font-semibold bg-gray-200 text-gray-900 hover:bg-gray-300" onClick={handleCheckout}>
                  {isBuyNowActive ? "Buy Now" : "Proceed to Checkout"}
                </HeroButton>
              </div>
            </div>
          </div>

          {/* === SAVED FOR LATER (REDESIGNED) === */}
          {!isBuyNowActive && (
            <motion.div 
              layout="position" 
              transition={rigidTransition}
              className="mt-8 border-t border-gray-100 pt-8"
            >
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gray-100 rounded-full text-gray-700">
                    <FiHeart size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">
                      Saved for Later
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      {visibleSavedItems.length} items to reconsider
                    </p>
                  </div>
              </div>

              {visibleSavedItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {visibleSavedItems.map((item) => {
                        const variant = item.variant;
                        const product = item.product || item.variant.product; 
                        const itemImageUrl = Array.isArray(product.imageurl) && product.imageurl.length > 0 ? product.imageurl[0] : "/placeholder.png";
                        const price = Math.floor(variant.oprice * (1 - variant.discount / 100));
                        const showLineThrough = Number(variant.oprice) > Number(price) && Number(variant.discount) > 0;

                        return (
                          <motion.div
                            key={item.variant.id}
                            layout
                            transition={{
                              ...rigidTransition,
                              layout: rigidTransition
                            }} 
                            variants={itemVariants} 
                            initial="initial" 
                            animate="animate" 
                            exit="exit"
                            className="bg-white p-4 rounded-xl shadow-lg shadow-gray-100/50 border border-gray-50 transition duration-300 ease-in-out flex gap-4 items-center sm:items-start relative group"
                          >
                            {/* Cross Button */}
                            <button
                                onClick={() => handleRemoveSavedItem(variant.id)}
                                className="absolute top-2 right-2 p-1.5 bg-gray-100 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                title="Remove Item"
                            >
                              <FiX size={14} />
                            </button>

                            {/* Image */}
                            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                <img 
                                  src={itemImageUrl} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover" 
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                                <div>
                                  <h3 className="font-semibold text-sm text-gray-900 truncate pr-6">{product.name}</h3>
                                  
                                  {/* NEW: Check if this is a bundle and render contents */}
                                  {(item.isBundle || (item.contents && item.contents.length > 0)) ? (
                                    <BundleItemsList items={item.contents} isCompact={true} />
                                  ) : (
                                    <p className="text-xs text-gray-500 mb-1">{variant.size} ml</p>
                                  )}

                                  <div className="flex items-center gap-2 mt-2">
                                      <span className="text-sm font-bold text-gray-900">₹{price}</span>
                                      {showLineThrough && <span className="text-xs text-gray-400 line-through">₹{variant.oprice}</span>}
                                  </div>
                                </div>
                                
                                <div className="mt-3">
                                  <button 
                                    onClick={() => handleMoveToCart(item)}
                                    className="w-full bg-black text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-gray-800 transition-colors"
                                  >
                                    Move to Cart
                                  </button>
                                </div>
                            </div>
                          </motion.div>
                        );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500">You haven't saved any items for later yet.</p>
                </div>
              )}
            </motion.div>
          )}

          <div className="bg-white p-6 text-center  ">
            <h3 className="text-lg font-semibold mb-1">🚚 Check Delivery Availability</h3>
            <p className="text-gray-500 mb-4 text-sm">Enter your pincode to see if we can reach your doorstep.</p>
            <div className="flex max-w-sm mx-auto">
              <input
                type="text"
                value={pincode}
                onChange={handlePincodeChange}
                placeholder="Enter 6-digit Pincode"
                onKeyDown={(e) => e.key === "Enter" && checkDeliveryAvailability()}
                maxLength="6"
                className="flex-grow min-w-0 border border-gray-200 px-4 rounded-l-xl h-11 text-center text-base focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20"
              />
              <motion.button whileTap={{ scale: 0.95 }} onClick={checkDeliveryAvailability} disabled={pincodeLoading || pincode.length !== 6} className="bg-black text-white border-none px-6 rounded-r-xl cursor-pointer font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center h-11">
                {pincodeLoading ? <MiniLoader text="Checking..." /> : "CHECK"}
              </motion.button>
            </div>
            <AnimatePresence>
              {pincodeDetails && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ ...rigidTransition, duration: 0.3 }} className={`mt-4 rounded-xl text-sm overflow-hidden`}>
                  <div className={`p-4 ${pincodeDetails.isServiceable ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                    {pincodeDetails.isServiceable ? (
                      <>
                        <p>
                          🎉 Great news! We deliver to <strong>{pincode}</strong>.
                        </p>
                        <p className="text-xs mt-1">
                          Delivery Charge: <strong>₹{pincodeDetails.deliveryCharge}</strong> | Payment: <strong>{pincodeDetails.codAvailable ? "COD & Online" : "Online Only"}</strong>
                        </p>
                      </>
                    ) : (
                      <p>😔 Sorry! We don’t deliver to <strong>{pincode}</strong> yet.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!isBuyNowActive && suggestedProducts.length > 0 && (
            <div className="pt-8 mt-8 border-t border-gray-100">
              <h2 className="text-3xl font-bold text-center mb-8">Explore More Products</h2>
              
              <motion.div 
                layout
                className="grid grid-cols-1 w-[80%] mx-auto min-[400px]:w-full min-[400px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {suggestedProducts.map(({ product, cheapestVariant }) => {
                    const price = Math.trunc(cheapestVariant.oprice * (1 - (cheapestVariant.discount || 0) / 100));
                    const isAdding = addingProductId === cheapestVariant.id;
                    const imageUrl = Array.isArray(product.imageurl) && product.imageurl.length > 0 ? product.imageurl[0] : "/placeholder.png";
                    const showLineThrough = Number(cheapestVariant.oprice) > Number(price) && Number(cheapestVariant.discount) > 0;

                    return (
                      <motion.div
                        layout
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        style={gpuStyle}
                        transition={{ 
                            ...rigidTransition,
                            layout: rigidTransition
                        }}
                        className="bg-white rounded-xl overflow-hidden flex flex-col shadow-lg shadow-gray-100/50 border border-gray-100 hover:shadow-gray-200/50 transition-shadow duration-300 ease-in-out group h-full"
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-40 object-cover block cursor-pointer transition-transform duration-300 group-hover:scale-105"
                            onClick={() => navigate(`/product/${product.id}`)}
                          />
                          <div
                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                            onClick={() => navigate(`/product/${product.id}`)}
                          >
                            <span className="text-sm font-semibold">Quick View</span>
                          </div>
                        </div>
                        <div className="p-4 flex-grow flex flex-col justify-between text-left">
                          <div>
                            <div className="mb-2 flex justify-between items-baseline">
                              <h3
                                className="font-semibold text-sm leading-tight inline cursor-pointer hover:underline"
                                onClick={() => navigate(`/product/${product.id}`)}
                              >
                                {product.name}
                              </h3>
                              <span className="text-xs text-gray-500">{cheapestVariant.size} ml</span>
                            </div>

                            <div className="flex justify-between items-baseline mb-4">
                              <div className="flex items-baseline gap-2">
                                <p className="font-bold text-base">₹{price}</p>
                                {showLineThrough ? (
                                  <p className="text-sm text-gray-500 line-through">₹{cheapestVariant.oprice}</p>
                                ) : (
                                  <p className="text-sm text-gray-500">₹{cheapestVariant.oprice}</p>
                                )}
                              </div>
                              <span className="text-green-600 text-sm font-semibold">{cheapestVariant.discount}% OFF</span>
                            </div>
                          </div>
                          <HeroButton
                            onClick={() => handleAddToCart(cheapestVariant, product)}
                            disabled={isAdding}
                            className={`w-full text-sm font-semibold flex justify-center py-2 items-center gap-2 transition-colors duration-300 ${isAdding ? "!bg-green-600 !text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
                          >
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={isAdding ? "adding" : "add"}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={rigidTransition}
                                className="flex items-center gap-2"
                              >
                                {isAdding ? (
                                  <>
                                    Added <FiCheckCircle />
                                  </>
                                ) : (
                                  <>
                                    Add to Cart <FaShoppingCart />
                                  </>
                                )}
                              </motion.span>
                            </AnimatePresence>
                          </HeroButton>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </main>
      )}
    </>
  );
};

export default ShoppingCart;