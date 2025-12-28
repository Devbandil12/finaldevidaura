import React, { useState, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";

import { FaTimes, FaCheck, FaLock, FaShoppingBag } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi";
import { BsStars } from "react-icons/bs"; 
import PageTransition from "./PageTransition";

// --- UI HELPERS ---

const HeroButton = ({ children, className, variant = "primary", ...props }) => {
    const baseStyle = "flex items-center justify-center px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-[#C5A059] text-black hover:bg-white hover:text-black shadow-lg shadow-[#C5A059]/20",
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
};

const MiniLoader = () => (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
);

const Loader = ({ text = "Loading..." }) => (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#121212] border-t-[#C5A059] rounded-full animate-spin mb-4"></div>
        <span className="text-gray-400 font-serif italic tracking-wider text-sm">{text}</span>
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
    hidden: { opacity: 0, y: 20 },
    show: { 
        opacity: 1, 
        y: 0, 
        transition: { duration: 0.5, ease: "easeOut" } 
    }
};

// --- PERFUME CARD COMPONENT ---
const PerfumeCard = ({ variant, product, isSelected, isDisabled, onSelect }) => {
    const imageUrl = Array.isArray(product.imageurl) && product.imageurl.length > 0
        ? product.imageurl[0]
        : "/placeholder.png";

    const oprice = variant.oprice || product.oprice || 0;
    const discount = variant.discount || product.discount || 0;
    const discountedPrice = Math.floor(oprice * (1 - discount / 100));

    return (
        <motion.div
            variants={cardVariants}
            onClick={!isDisabled ? onSelect : undefined}
            className={`relative flex flex-col rounded-[2rem] overflow-hidden transition-all duration-300 group cursor-pointer
            ${isSelected 
                ? "ring-2 ring-[#C5A059] shadow-2xl shadow-[#C5A059]/10 bg-[#121212]" 
                : "bg-[#121212] shadow-xl hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1"
            }
            ${isDisabled && !isSelected ? "opacity-40 grayscale cursor-not-allowed" : ""}
            `}
        >
            {/* IMAGE */}
            <div className="relative w-full h-48 overflow-hidden bg-[#0a0a0a]">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-all duration-700 ease-out
                    ${isSelected ? "scale-105 opacity-100" : "opacity-80 group-hover:opacity-100 group-hover:scale-105"}
                    `}
                />

                <AnimatePresence>
                    {isSelected && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute top-3 right-3 w-6 h-6 bg-[#C5A059] text-black rounded-full flex items-center justify-center shadow-lg z-10"
                        >
                            <FaCheck size={10} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Details */}
            <div className="p-4 flex flex-col gap-1">
                <div className="flex justify-between items-start">
                    <p className="text-[#C5A059] text-[10px] font-serif italic tracking-wider opacity-90 pt-1">
                        {variant.size} ml
                    </p>
                    
                    {/* Price Display */}
                    <div className="flex flex-col items-end leading-none">
                        <span className={`text-sm font-medium ${isSelected ? "text-[#C5A059]" : "text-white"}`}>
                            ₹{discountedPrice}
                        </span>
                        {discount > 0 && (
                            <span className="text-[10px] text-gray-500 line-through mt-0.5">
                                ₹{oprice}
                            </span>
                        )}
                    </div>
                </div>

                <h4 className={`text-sm font-medium leading-tight transition-colors line-clamp-1 ${isSelected ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
                    {product.name}
                </h4>
            </div>
        </motion.div>
    );
};


// --- MAIN COMPONENT ---
const CustomComboBuilder = () => {
    const navigate = useNavigate();
    const { products, loading: productsLoading } = useContext(ProductContext);
    const { addCustomBundle, startBuyNow } = useContext(CartContext);
    const { userdetails } = useContext(UserContext);

    const [selectedPerfumes, setSelectedPerfumes] = useState([]);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isBuyingNow, setIsBuyingNow] = useState(false);

    // Consolidated processing state to lock UI
    const isProcessing = isAddingToCart || isBuyingNow;

    // --- Data Logic ---
    const { templateVariant, comboOriginalPrice, comboFinalPrice, comboDiscount, comboSavings } = useMemo(() => {
        const templateProduct = products.find((p) => p.category === "Template");
        if (templateProduct && templateProduct.variants.length > 0) {
            const tv = templateProduct.variants[0];
            
            const oprice = tv.oprice || 0;
            const discount = tv.discount || 0; 
            
            let finalPrice = tv.price || 0;
            if (!finalPrice && discount) {
                 finalPrice = Math.floor(oprice * (1 - discount / 100));
            }
            if (!finalPrice) finalPrice = oprice;

            const savings = Math.max(0, oprice - finalPrice);

            return { 
                templateVariant: tv, 
                comboOriginalPrice: oprice, 
                comboFinalPrice: finalPrice, 
                comboDiscount: discount,
                comboSavings: savings 
            };
        }
        return { templateVariant: null, comboOriginalPrice: 0, comboFinalPrice: 0, comboDiscount: 0, comboSavings: 0 };
    }, [products]);

    const availablePerfumes = useMemo(() => {
        return products
            .filter((p) => !p.isArchived && p.category !== "Template")
            .flatMap((product) =>
                product.variants
                    .filter((v) => !v.isArchived && v.size === 30 && v.stock > 0)
                    .map((variant) => ({ product, variant }))
            );
    }, [products]);

    const handleSelectPerfume = useCallback((variant) => {
        if (isProcessing) return; // Guard clause

        setSelectedPerfumes((prev) => {
            const exists = prev.some((v) => v.id === variant.id);
            if (exists) return prev.filter((v) => v.id !== variant.id);
            if (prev.length >= 4) {
                window.toast?.error("Box full. Remove one to add another.") || alert("Box full");
                return prev;
            }
            return [...prev, variant];
        });
    }, [isProcessing]);

    const handleRemoveFromSlot = (id) => {
        if (isProcessing) return; // Guard clause
        setSelectedPerfumes((prev) => prev.filter((v) => v.id !== id));
    };

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

    const isFull = selectedPerfumes.length === 4;

    if (productsLoading) return <Loader text="Curating Library..." />;

    if (!templateVariant) return (
        <div className="p-12 text-center text-gray-500 bg-gray-100 rounded-3xl m-4">
            <FiAlertTriangle className="mx-auto text-4xl mb-4 opacity-20" />
            <p>Combo Builder is currently unavailable.</p>
        </div>
    );

    return (
        <PageTransition>
            <section className="min-h-screen py-22 px-6 md:px-12">

                {/* HEADER */}
                <div className="max-w-4xl mx-auto mb-20 text-center">
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* 🟢 HEADER SPAN: Bespoke Signature Set */}
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-xs font-bold tracking-widest uppercase mb-6">
                            <BsStars size={12} className="text-yellow-600" />
                            Bespoke Signature Set
                        </span>
                        <h1 className="text-5xl md:text-6xl font-serif font-medium mb-6 text-[#1a1a1a]">
                            Build Your Collection
                        </h1>
                        <p className="text-gray-500 text-lg font-light max-w-2xl mx-auto">
                            Select 4 signature scents to unlock the exclusive bundle price.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start max-w-[1600px] mx-auto">

                    {/* LEFT: SELECTION GRID */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <div className="flex items-center gap-3">
                                <HiOutlineSparkles className="text-[#C5A059]" />
                                <span className="text-gray-400 font-medium uppercase tracking-widest text-xs">Available Library</span>
                            </div>
                            <span className="text-xs font-bold text-[#1a1a1a] bg-gray-100 px-3 py-1 rounded-full">
                                {4 - selectedPerfumes.length} SLOTS REMAINING
                            </span>
                        </div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        >
                            {availablePerfumes.map(({ product, variant }) => (
                                <PerfumeCard
                                    key={variant.id}
                                    variant={variant}
                                    product={product}
                                    isSelected={selectedPerfumes.some((v) => v.id === variant.id)}
                                    // Disable interactions if processing, OR if box full and not selected
                                    isDisabled={isProcessing || (isFull && !selectedPerfumes.some((v) => v.id === variant.id))}
                                    onSelect={() => !isProcessing && handleSelectPerfume(variant)}
                                />
                            ))}
                        </motion.div>
                    </div>

                    {/* RIGHT: FLOATING SUMMARY BOX */}
                    <div className="lg:col-span-4 lg:sticky lg:top-32">
                        <div className="bg-[#121212] text-white rounded-[2rem] shadow-2xl shadow-black/20 p-8 relative overflow-hidden border border-white/10">

                            {/* Header */}
                            <div className="relative z-10 mb-8">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="text-2xl font-serif text-white">Your Personal Set</h3>
                                    <FaShoppingBag className="text-[#C5A059]" />
                                </div>
                                
                                <p className="text-[#C5A059] text-xs font-serif italic mb-3">
                                    The Devid Aura Signature Edit — Curated just for you.
                                </p>
                                
                                {/* Progress Bar */}
                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
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
                                                        className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl group"
                                                    >
                                                        <img
                                                            src={productInfo.product.imageurl?.[0] || "/placeholder.png"}
                                                            className="w-12 h-12 rounded-xl object-cover opacity-90"
                                                            alt=""
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="text-sm font-medium text-white truncate">{productInfo.product.name}</h5>
                                                            <p className="text-[10px] uppercase tracking-wider text-[#C5A059]">{variant.size} ml</p>
                                                        </div>
                                                        <button
                                                            onClick={() => !isProcessing && handleRemoveFromSlot(variant.id)}
                                                            disabled={isProcessing}
                                                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors 
                                                            ${isProcessing 
                                                                ? "opacity-30 cursor-not-allowed text-gray-600" 
                                                                : "hover:bg-red-500/20 hover:text-red-400 text-gray-500"
                                                            }`}
                                                        >
                                                            <FaTimes size={12} />
                                                        </button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="flex items-center gap-4 p-2 rounded-2xl border border-dashed border-white/10"
                                                    >
                                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20 text-sm font-bold font-serif">
                                                            {i + 1}
                                                        </div>
                                                        <span className="text-xs text-white/30 uppercase tracking-widest">Empty Slot</span>
                                                    </motion.div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            {/* Pricing & Actions */}
                            <div className="mt-10 pt-6 border-t border-white/10 relative z-10">

                                {isFull ? (
                                    <div className="mb-8">
                                        <div className="mb-6 bg-white/5 p-5 rounded-2xl border border-white/10">
                                            
                                            {/* 1. Original Price Row (Value) */}
                                            {comboDiscount > 0 && (
                                                <div className="flex justify-between items-center mb-1 opacity-60">
                                                    <span className="text-xs text-gray-400 uppercase tracking-widest">Total Value</span>
                                                    <span className="text-sm text-gray-400 line-through decoration-white/30">₹{comboOriginalPrice}</span>
                                                </div>
                                            )}

                                            {/* 2. Final Price Row */}
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-sm text-white font-medium">Final Combo Price</span>
                                                <span className="text-3xl font-serif text-[#C5A059]">₹{comboFinalPrice}</span>
                                            </div>

                                            {/* 3. Savings Divider Section */}
                                            {comboDiscount > 0 && (
                                                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                                    {/* Discount Percentage */}
                                                    <div className="flex items-center gap-2 text-green-400">
                                                         <HiOutlineSparkles size={14} />
                                                         <span className="text-xs font-bold tracking-wider uppercase">
                                                             {comboDiscount}% OFF
                                                         </span>
                                                    </div>
                                                    
                                                    {/* Savings Value */}
                                                    <span className="text-xs text-white/70">
                                                        You save <span className="text-white font-bold">₹{comboSavings}</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-8 flex items-center justify-center gap-2 text-white/40 bg-white/5 py-4 rounded-xl border border-white/5">
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
                                        className="w-full"
                                    >
                                        {isBuyingNow ? <MiniLoader /> : "Buy Bundle Now"}
                                    </HeroButton>
                                    
                                    <HeroButton
                                        variant="outline"
                                        onClick={handleAddToCart}
                                        disabled={!isFull || isProcessing}
                                        className="w-full"
                                    >
                                        {isAddingToCart ? <MiniLoader /> : "Add to Cart"}
                                    </HeroButton>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PageTransition>
    );
};

export default CustomComboBuilder;