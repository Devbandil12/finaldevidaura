import React, { useState, useContext, useMemo, useCallback, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";

import { FaCheck, FaShoppingBag, FaArrowRight, FaArrowDown, FaLock } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi";
import { BsStars } from "react-icons/bs"; 
// 👇 IMPORT OPTIMIZER
import { optimizeImage } from "../utils/imageOptimizer"; 

// --- UI HELPERS ---

const HeroButton = memo(({ children, className, variant = "primary", ...props }) => {
    const baseStyle = "flex items-center justify-center px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-[#C5A059] text-black hover:bg-[#1a1a1a] hover:text-white shadow-lg shadow-[#C5A059]/20",
        outline: "border border-white/20 text-white hover:bg-white hover:text-black hover:border-white"
    };

    return (
        <motion.button
            whileHover={props.disabled ? {} : { scale: 1.02 }}
            whileTap={props.disabled ? {} : { scale: 0.98 }}
            {...props}
            className={`${baseStyle} ${variants[variant]} ${className}`}
        >
            {children}
        </motion.button>
    );
});

const Loader = ({ text = "Loading..." }) => (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-gray-200 border-t-[#C5A059] rounded-full animate-spin mb-4"></div>
        <span className="text-gray-400  italic tracking-wider text-sm">{text}</span>
    </div>
);

// --- ANIMATION VARIANTS ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
        opacity: 1, 
        y: 0, 
        transition: { duration: 0.4, ease: "easeOut" } 
    }
};

// --- PERFUME CARD (OPTIMIZED & MEMOIZED) ---
const PerfumeCard = memo(({ variant, product, count, isOutOfStock, isDisabled, onSelect, priority = false }) => {
    
    const rawUrl = Array.isArray(product.imageurl) && product.imageurl.length > 0
        ? product.imageurl[0]
        : "/placeholder.png";

    // ⚡ OPTIMIZATION: Resize to 200px (Thumbnail size)
    const imageUrl = useMemo(() => optimizeImage(rawUrl, 200), [rawUrl]);

    const oprice = variant.oprice || product.oprice || 0;
    const discount = variant.discount || product.discount || 0;
    const discountedPrice = Math.floor(oprice * (1 - discount / 100));

    const isSelected = count > 0;

    return (
        <motion.div
            variants={cardVariants}
            onClick={!isDisabled ? onSelect : undefined}
            className={`group flex items-start gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer
            ${isSelected 
                ? "bg-white ring-1 ring-[#C5A059]/30" 
                : "" 
            }
            ${isOutOfStock 
                ? "opacity-40 grayscale cursor-not-allowed" 
                : isDisabled 
                    ? "opacity-60 cursor-not-allowed"
                    : ""
            }
            `}
        >
            {/* LEFT: COMPACT IMAGE BOX */}
            <div className="relative w-20 h-28 shrink-0 bg-black rounded-lg overflow-hidden shadow-md">
                <img
                    src={imageUrl}
                    alt={product.name}
                    loading={priority ? "eager" : "lazy"}
                    fetchPriority={priority ? "high" : "auto"}
                    decoding="async"
                    className={`w-full h-full object-cover transition-all duration-500 ease-in-out
                    ${isOutOfStock 
                        ? "grayscale" 
                        : "grayscale-0 opacity-100" 
                    }`}
                />
            </div>

            {/* RIGHT: TEXT CONTENT */}
            <div className="flex flex-col flex-1 min-w-0 h-28 py-0.5 justify-between">
                <div>
                    <h3 className=" text-lg text-[#1a1a1a]  leading-none mb-1.5 truncate capitalize">
                        {product.name}
                    </h3>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">
                        <span>{variant.size}ML</span>
                        <span className="text-gray-300">•</span>
                        <span className={isSelected ? "text-[#C5A059]" : "text-gray-600"}>₹{discountedPrice}</span>
                    </div>

                    <p className=" italic text-gray-400 text-[10px] leading-snug line-clamp-2">
                        {product.description || "Premium fragrance"}
                    </p>
                </div>

                <div>
                    {isOutOfStock ? (
                          <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase">
                              OUT OF STOCK
                          </span>
                    ) : (
                        <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#C5A059] uppercase transition-colors duration-300 group-hover:text-[#8a6d3b]">
                            {count > 0 ? `ADD ANOTHER (${count})` : "ADD TO SET"}
                            <FaArrowRight 
                                size={10} 
                                className="transition-transform duration-300 group-hover:translate-x-1"
                            />
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
});


// --- MAIN COMPONENT ---
const CustomComboBuilder = () => {
    const navigate = useNavigate();
    const { products: contextProducts, loading: contextLoading } = useContext(ProductContext);
    const { addCustomBundle, startBuyNow } = useContext(CartContext);
    const { userdetails } = useContext(UserContext);

    // ⚡ 1. INSTANT STATE: Initialize from LocalStorage
    const [products, setProducts] = useState(() => {
        try {
            const cached = localStorage.getItem("all_products_cache");
            return cached ? JSON.parse(cached) : [];
        } catch (e) {
            return [];
        }
    });

    const [selectedPerfumes, setSelectedPerfumes] = useState([]);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isBuyingNow, setIsBuyingNow] = useState(false);

    // ⚡ 2. SYNC WITH CONTEXT
    useEffect(() => {
        if (contextProducts && contextProducts.length > 0) {
            setProducts(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(contextProducts)) {
                    localStorage.setItem("all_products_cache", JSON.stringify(contextProducts));
                    return contextProducts;
                }
                return prev;
            });
        }
    }, [contextProducts]);

    const isProcessing = isAddingToCart || isBuyingNow;

    // --- Data Logic ---
    const { templateVariant, comboOriginalPrice, comboFinalPrice } = useMemo(() => {
        const templateProduct = products.find((p) => p.category === "Template");
        if (templateProduct && templateProduct.variants.length > 0) {
            const tv = templateProduct.variants[0];
            const oprice = tv.oprice || 0;
            const discount = tv.discount || 0; 
            let finalPrice = tv.price || 0;
            if (!finalPrice && discount) finalPrice = Math.floor(oprice * (1 - discount / 100));
            if (!finalPrice) finalPrice = oprice;
            const savings = Math.max(0, oprice - finalPrice);
            return { templateVariant: tv, comboOriginalPrice: oprice, comboFinalPrice: finalPrice, comboDiscount: discount, comboSavings: savings };
        }
        return { templateVariant: null, comboOriginalPrice: 0, comboFinalPrice: 0, comboDiscount: 0, comboSavings: 0 };
    }, [products]);

    const availablePerfumes = useMemo(() => {
        return products
            .filter((p) => !p.isArchived && p.category !== "Template")
            .flatMap((product) =>
                product.variants
                    .filter((v) => !v.isArchived && v.size === 30) 
                    .map((variant) => ({ product, variant }))
            );
    }, [products]);

    // ⚡ 3. PRELOAD OPTIMIZED IMAGES
    useEffect(() => {
        if (availablePerfumes.length > 0) {
            // Preload first 6 images using the OPTIMIZED url
            availablePerfumes.slice(0, 6).forEach(({ product }) => {
                const src = product.imageurl?.[0];
                if (src) {
                    const img = new Image();
                    img.src = optimizeImage(src, 200); // 👈 Preload 200px version
                }
            });
        }
    }, [availablePerfumes]);

    const isFull = selectedPerfumes.length === 4;

    const handleSelectPerfume = useCallback((variant) => {
        if (isProcessing) return;
        if ((variant.stock || 0) <= 0) return; 

        setSelectedPerfumes((prev) => {
            if (prev.length >= 4) {
                window.toast?.error("Box full.") || alert("Box full");
                return prev;
            }
            return [...prev, variant];
        });
    }, [isProcessing]);

    const handleRemoveFromSlot = useCallback((indexToRemove) => {
        if (isProcessing) return;
        setSelectedPerfumes((prev) => prev.filter((_, index) => index !== indexToRemove));
    }, [isProcessing]);

    const validateAndProceed = () => {
        if (selectedPerfumes.length !== 4) {
            window.toast?.error("Please select 4 perfumes.") || alert("Please select 4 perfumes.");
            return false;
        }
        return true;
    };

    const handleAddToCart = async () => {
        if (!validateAndProceed()) return;
        setIsAddingToCart(true);
        const success = await addCustomBundle(templateVariant.id, selectedPerfumes.map((v) => v.id));
        setIsAddingToCart(false);
        if (success) navigate("/cart");
    };

    const handleBuyNow = async () => {
        if (!validateAndProceed()) return;
        if (!userdetails?.id) {
            window.toast?.error("Please log in.") || alert("Please log in.");
            navigate("/login");
            return;
        }
        setIsBuyingNow(true);
        try {
            const newItem = await addCustomBundle(templateVariant.id, selectedPerfumes.map((v) => v.id));
            if (newItem) {
                if (typeof newItem === "object") startBuyNow(newItem);
                navigate("/cart", { state: { isBuyNow: true } });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsBuyingNow(false);
        }
    };

    // ⚡ 4. LOADER STRATEGY
    if (products.length === 0 && contextLoading) return <Loader text="Curating Library..." />;

    if (products.length === 0 && !contextLoading) return (
        <div className="min-h-screen flex items-center justify-center text-gray-400">
            No products available.
        </div>
    );

    if (!templateVariant) return (
        <div className="p-12 text-center text-gray-500 bg-gray-100 rounded-3xl m-4">
            <FiAlertTriangle className="mx-auto text-4xl mb-4 opacity-20" />
            <p>Combo Builder is currently unavailable.</p>
        </div>
    );

    return (
 <>
            <style>{`
                .smooth-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                    -webkit-overflow-scrolling: touch; 
                    scroll-behavior: smooth;
                }
                .smooth-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <section className="min-h-screen py-22 px-4 md:px-12 ">

                {/* HEADER */}
                <div className="max-w-4xl mx-auto mb-16 text-center">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
                            <BsStars size={12} className="text-[#C5A059]" />
                            Bespoke Signature Set
                        </span>
                        <h1 className="text-4xl md:text-6xl   mb-6 text-[#1a1a1a]">
                            Build Your Collection
                        </h1>
                        <p className="text-gray-500 text-lg font-light max-w-2xl mx-auto">
                            Select 4 signature scents to unlock the exclusive bundle price.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start max-w-[1600px] mx-auto">

                    {/* LEFT: SELECTION GRID */}
                    <div className="lg:col-span-8 relative">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <div className="flex items-center gap-3">
                                <HiOutlineSparkles className="text-[#C5A059]" />
                                <span className="text-gray-400 tracking-widest text-xs">Available Library</span>
                            </div>
                            <span className="text-xs font-bold text-white bg-black px-3 py-1 rounded-full shadow-md">
                                {4 - selectedPerfumes.length} SLOTS REMAINING
                            </span>
                        </div>

                        {/* Scrollable Container */}
                        <div className="max-h-[80vh] overflow-y-auto smooth-scrollbar pb-24 pr-2">
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {availablePerfumes.map(({ product, variant }, index) => {
                                    const count = selectedPerfumes.filter(v => v.id === variant.id).length;
                                    const isOutOfStock = (variant.stock || 0) <= 0;
                                    const isPriority = index < 6;

                                    return (
                                        <PerfumeCard
                                            key={variant.id}
                                            variant={variant}
                                            product={product}
                                            count={count}
                                            isOutOfStock={isOutOfStock}
                                            isDisabled={isProcessing || isOutOfStock || (isFull && count === 0)}
                                            // ⚡ Passing arrow function is okay if child is cheap, but better to memoize handler if possible. 
                                            // For simplicity and readability here, we keep it inline as PerfumeCard is memoized and prop change will be minimal.
                                            onSelect={() => handleSelectPerfume(variant)}
                                            priority={isPriority} 
                                        />
                                    );
                                })}
                            </motion.div>
                        </div>

                        {/* Slide Indicator: Hidden on Desktop */}
                        <div className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-50 pointer-events-none">
                            <span className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Slide</span>
                            <FaArrowDown className="text-gray-400" size={12} />
                        </div>
                    </div>

                    {/* RIGHT: FLOATING SUMMARY BOX (Light Theme) */}
                    <div className="lg:col-span-4 lg:sticky lg:top-32 self-start">
                        <div className="bg-white text-[#1a1a1a] rounded-[2rem] shadow-xl shadow-black/5 p-8 relative overflow-hidden border border-gray-100">

                            {/* Header */}
                            <div className="relative z-10 mb-8">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="text-2xl  text-[#1a1a1a]">Your Personal Set</h3>
                                    <FaShoppingBag className="text-[#C5A059]" />
                                </div>
                                <p className="text-[#C5A059] text-xs  italic mb-3">
                                    The Devid Aura Signature Edit
                                </p>
                                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-[#C5A059]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(selectedPerfumes.length / 4) * 100}%` }}
                                        transition={{ type: "spring", stiffness: 50 }}
                                    />
                                </div>
                            </div>

                            {/* Visual Slots */}
                            <div className="space-y-3 relative z-10">
                                <AnimatePresence mode="popLayout">
                                    {[...Array(4)].map((_, i) => {
                                        const variant = selectedPerfumes[i];
                                        const productInfo = variant ? availablePerfumes.find(p => p.variant.id === variant.id) : null;

                                        return (
                                            <div key={i}>
                                                {variant && productInfo ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        className="flex items-center gap-4 bg-white border border-gray-100 p-2 rounded-2xl group shadow-sm"
                                                    >
                                                        <img
                                                            // ⚡ Optimize thumbnail in slot too
                                                            src={optimizeImage(productInfo.product.imageurl?.[0], 100) || "/placeholder.png"}
                                                            className="w-12 h-12 rounded-xl object-cover opacity-90"
                                                            alt=""
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="text-sm  text-[#1a1a1a] truncate">{productInfo.product.name}</h5>
                                                            <p className="text-[10px] uppercase tracking-wider text-[#C5A059]">{variant.size} ml</p>
                                                        </div>
                                                        <button
                                                            onClick={() => !isProcessing && handleRemoveFromSlot(i)}
                                                            disabled={isProcessing}
                                                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
                                                        >
                                                            <span className="text-xl leading-none">-</span>
                                                        </button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="flex items-center gap-4 p-2 rounded-2xl border border-dashed border-gray-200"
                                                    >
                                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-bold ">
                                                            {i + 1}
                                                        </div>
                                                        <span className="text-xs text-gray-500 uppercase tracking-widest">Empty Slot</span>
                                                    </motion.div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            {/* Pricing & Actions */}
                            <div className="mt-10 pt-6 border-t border-gray-100 relative z-10">
                                {isFull ? (
                                    <div className="mb-6">
                                        <div className="mb-6 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm text-[#1a1a1a] ">Final Price</span>
                                                <span className="text-3xl  text-[#C5A059]">₹{comboFinalPrice}</span>
                                            </div>
                                            <div className="flex justify-between items-center opacity-80">
                                                <span className="text-xs text-gray-500 uppercase tracking-widest">Original Value</span>
                                                <span className="text-sm text-gray-500 line-through decoration-gray-300">₹{comboOriginalPrice}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-8 flex items-center justify-center gap-2 text-gray-500 bg-gray-100 py-4 rounded-xl border border-gray-100 shadow-inner">
                                            <FaLock size={12} />
                                            <span className="text-[10px] uppercase tracking-widest font-bold">
                                                Add {4 - selectedPerfumes.length} more to unlock
                                            </span>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <HeroButton
                                        variant="primary"
                                        onClick={handleBuyNow}
                                        disabled={!isFull || isProcessing}
                                        className="w-full shadow-xl shadow-[#C5A059]/20"
                                    >
                                        {isBuyingNow ? "Processing..." : "Buy Bundle Now"}
                                    </HeroButton>
                                    
                                    <HeroButton
                                        variant="outline"
                                        onClick={handleAddToCart}
                                        disabled={!isFull || isProcessing}
                                        className="w-full !border-[#1a1a1a]/30 !text-[#1a1a1a] hover:!bg-[#1a1a1a] hover:!text-white hover:!border-[#1a1a1a]"
                                    >
                                        {isAddingToCart ? "Adding..." : "Add to Cart"}
                                    </HeroButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
       </>
    );
};

export default CustomComboBuilder;