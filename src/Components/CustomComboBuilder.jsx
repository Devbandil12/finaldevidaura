import React, { useState, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// 1. CONTEXTS
import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";

// 2. ICONS
import { FaTimes, FaCheckCircle, FaShoppingCart } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";
import { HiOutlineCubeTransparent } from "react-icons/hi";

// 3. COMPONENTS (Unchanged)
const HeroButton = ({ children, ...props }) => (
    <button
        {...props}
        className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed ${props.className}`}
    >
        {children}
    </button>
);

const MiniLoader = ({ text = "" }) => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 border-2 border-dashed border-current rounded-full animate-spin"></div>
        <span>{text}</span>
    </div>
);

const Loader = ({ text = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center p-10">
        <div className="w-12 h-12 border-4 border-dashed border-indigo-600 rounded-full animate-spin"></div>
        <span className="mt-4 text-lg font-semibold text-gray-700">{text}</span>
    </div>
);
// --- End of assumed components ---


/**
 * 4. ⭐️ REDESIGNED: PerfumeSelectItem
 */
const PerfumeSelectItem = ({ variant, product, isSelected, onSelect, isDisabled }) => {
    const imageUrl = (Array.isArray(product.imageurl) && product.imageurl.length > 0)
        ? product.imageurl[0]
        : "/placeholder.png";

    return (
        <motion.div
            layout
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            onClick={onSelect}
            className={`relative p-3 border-2 rounded-xl transition-all duration-200 text-center ${isSelected
                ? "border-indigo-600 bg-indigo-50" // Selected: Blue border, light bg
                : "border-gray-200 bg-white"      // Default: Gray border, white bg
                } ${isDisabled
                    ? 'opacity-50 cursor-not-allowed'   // Disabled: Faded
                    : 'cursor-pointer'                    // Enabled: Pointer
                }`}
        >
            {isDisabled && !isSelected && ( // Show "FULL" only if it's disabled AND not selected
                <div className="absolute inset-0 bg-gray-800 bg-opacity-20 rounded-xl flex items-center justify-center z-10">
                    <span className="text-white text-xs font-bold bg-black bg-opacity-50 px-2 py-0.5 rounded-full">FULL</span>
                </div>
            )}
            <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-20 sm:h-24 object-cover rounded-md mb-2 mx-auto" // Added mx-auto
            />
            <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{product.name}</p>
            <p className="text-xs text-gray-500">{variant.name}</p>
        </motion.div>
    );
};

/**
 * 5. The Main Combo Builder Component
 */
const CustomComboBuilder = () => {
    const navigate = useNavigate();

    // --- Contexts ---
    const { products, loading: productsLoading } = useContext(ProductContext);
    const { addCustomBundle, startBuyNow } = useContext(CartContext);
    const { userdetails } = useContext(UserContext);

    // --- State ---
    const [selectedPerfumes, setSelectedPerfumes] = useState([]);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isBuyingNow, setIsBuyingNow] = useState(false);

    // --- Data Logic ---
    const { templateVariant, comboOriginalPrice, comboFinalPrice, comboDiscount } = useMemo(() => {
        const templateProduct = products.find(p => p.category === "Template");
        if (templateProduct && templateProduct.variants.length > 0) {
            const tv = templateProduct.variants[0];
            const oprice = tv.oprice || 0;
            const discount = tv.discount || 0;
            const finalPrice = Math.floor(oprice * (1 - discount / 100));
            return {
                templateVariant: tv,
                comboOriginalPrice: oprice,
                comboFinalPrice: finalPrice,
                comboDiscount: discount
            };
        }
        return { templateVariant: null, comboOriginalPrice: 0, comboFinalPrice: 0, comboDiscount: 0 };
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

    // --- Selection Logic ---
    const handleSelectPerfume = useCallback((variant) => {
        setSelectedPerfumes((prev) => {
            const isAlreadySelected = prev.some((v) => v.id === variant.id);

            if (isAlreadySelected) {
                return prev.filter((v) => v.id !== variant.id);
            } else {
                if (prev.length >= 4) {
                    window.toast.error("You can only select 4 perfumes.");
                    return prev;
                }
                return [...prev, variant];
            }
        });
    }, []);

    const handleRemoveFromSlot = (variantIdToRemove) => {
        setSelectedPerfumes((prev) => prev.filter((v) => v.id !== variantIdToRemove));
    };

    // --- Action Button Handlers ---
    const handleAddToCart = async () => {
        if (selectedPerfumes.length !== 4) {
            window.toast.error("Please select exactly 4 perfumes.");
            return;
        }

        setIsAddingToCart(true);
        const success = await addCustomBundle(
            templateVariant.id,
            selectedPerfumes.map(v => v.id)
        );
        setIsAddingToCart(false);

        if (success) {
            navigate("/cart");
        }
    };

    const handleBuyNow = async () => {
        if (selectedPerfumes.length !== 4) {
            window.toast.error("Please select exactly 4 perfumes.");
            return;
        }
        if (!userdetails?.id) {
            window.toast.error("Please log in to create a bundle.");
            navigate("/login");
            return;
        }

        setIsBuyingNow(true);
        try {
            const newItem = await addCustomBundle(
                templateVariant.id,
                selectedPerfumes.map(v => v.id)
            );

            if (newItem && typeof newItem === 'object') {
                startBuyNow(newItem);
                navigate('/cart', { state: { isBuyNow: true } });
            } else if (newItem === true) {
                window.toast.info("Bundle added! Proceeding to cart...");
                navigate('/cart');
            }
        } catch (err) {
            console.error(err);
            window.toast.error(err.message || "Failed to create bundle.");
        } finally {
            setIsBuyingNow(false);
        }
    };

    // --- Render ---
    const isSelectionFull = selectedPerfumes.length === 4;

    // ⭐️ We'll put the conditional content into a variable
    let mainContent;

    // Loading state
    if (productsLoading) {
        mainContent = <Loader text="Loading Combo Builder..." />;
    }
    // Error state
    else if (!templateVariant) {
        mainContent = (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200 shadow-gray-200/50 flex flex-col items-center text-center">
                <FiAlertTriangle className="text-5xl text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-600">Error: Combo Template Not Found</h2>
                <p className="text-gray-600 mt-2">
                    Please ask the site administrator to create a "Template" product to enable this feature.
                </p>
            </div>
        );
    }
    // ⭐️ Main successful render
    else {
        mainContent = (
            <div className="bg-white p-4 sm:p-8 rounded-xl ">
                <div className="text-center mb-16 px-4">
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 tracking-tight drop-shadow-md">
                        Design Your Signature Set
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-600">
                        Select four fragrances to compose your personal collection.
                    </p>
                </div>
                {/* --- 2. RESPONSIVE MAIN BUILDER GRID (Unchanged) --- */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">

                    {/* --- COLUMN 1: AVAILABLE PERFUMES ("Palette") --- */}
                    <div className="md:col-span-3">

                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
                            Step 1: Choose Your Perfumes
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {isSelectionFull
                                ? "Your combo is full!"
                                : `Select ${4 - selectedPerfumes.length} more.`
                            }
                        </p>

                        {availablePerfumes.length === 0 ? (
                            <p className="text-gray-500 text-sm">No 30ml perfumes are currently available.</p>
                        ) : (
                            <div className="max-h-[600px] overflow-y-auto pr-2 -mr-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {availablePerfumes.map(({ product, variant }) => {
                                    const isSelected = selectedPerfumes.some(v => v.id === variant.id);
                                    const isDisabled = isSelectionFull && !isSelected;

                                    return (
                                        <PerfumeSelectItem
                                            key={variant.id}
                                            variant={variant}
                                            product={product}
                                            isSelected={isSelected}
                                            isDisabled={isDisabled}
                                            onSelect={() => {
                                                if (isDisabled && !isSelected) {
                                                    window.toast.error("You can only select 4 perfumes. De-select one to choose another.");
                                                    return;
                                                }
                                                handleSelectPerfume(variant)
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* --- COLUMN 2: SELECTIONS & ACTIONS ("Canvas") --- */}
                    <div className="md:col-span-2 relative">
                        <div className="sticky top-24 space-y-6">

                            {/* --- A: REDESIGNED "SLOTS" --- */}
                            <div>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                        Step 2: Review Your Combo
                                    </h3>
                                    {selectedPerfumes.length > 0 && (
                                        <button
                                            onClick={() => setSelectedPerfumes([])}
                                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mb-4">
                                    {selectedPerfumes.length} of 4 items selected.
                                </p>

                                <div className="space-y-3">
                                    {[...Array(4)].map((_, index) => {
                                        const variant = selectedPerfumes[index];
                                        const productInfo = variant ? availablePerfumes.find(p => p.variant.id === variant.id) : null;

                                        if (variant && productInfo) {
                                            // --- FILLED SLOT ---
                                            const imageUrl = (Array.isArray(productInfo.product.imageurl) && productInfo.product.imageurl.length > 0)
                                                ? productInfo.product.imageurl[0]
                                                : "/placeholder.png";

                                            return (
                                                <motion.div
                                                    key={variant.id}
                                                    layout
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    className="flex items-center gap-3 p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm"
                                                >
                                                    <span className="text-sm font-semibold text-gray-500">{index + 1}.</span>
                                                    <img src={imageUrl} alt={productInfo.product.name} className="w-10 h-10 object-cover rounded-md flex-shrink-0" />
                                                    <div className="flex-grow min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{productInfo.product.name}</p>
                                                        <p className="text-xs text-gray-500">{variant.name}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveFromSlot(variant.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                                                        title="Remove item"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </motion.div>
                                            );
                                        } else {
                                            // --- EMPTY SLOT ---
                                            return (
                                                <motion.div
                                                    key={index}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-200 border-dashed rounded-lg"
                                                >
                                                    <span className="text-sm font-semibold text-gray-400">{index + 1}.</span>
                                                    <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                                                        <HiOutlineCubeTransparent className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <p className="text-sm text-gray-400">Empty Slot</p>
                                                    </div>
                                                </motion.div>
                                            );
                                        }
                                    })}
                                </div>
                            </div>

                            {/* --- B: Footer Actions (Price & Buttons) --- */}
                            <div className="pt-6 border-t border-gray-200">

                                {/* Price box (Unchanged) */}
                                {isSelectionFull && (
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600">
                                            <span>Total MRP:</span>
                                            <span className="line-through">₹{comboOriginalPrice}</span>
                                        </div>
                                        {comboDiscount > 0 && (
                                            <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-green-600">
                                                <span>Combo Discount:</span>
                                                <span>{comboDiscount}% OFF</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                                            <span className="text-base sm:text-lg font-bold text-gray-900">Final Price:</span>
                                            <span className="text-xl sm:text-2xl font-bold text-gray-900">₹{comboFinalPrice}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Buttons (Unchanged) */}
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <HeroButton
                                        onClick={handleAddToCart}
                                        disabled={!isSelectionFull || isAddingToCart || isBuyingNow}
                                        className="w-full py-2.5 sm:py-3 text-sm font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        {isAddingToCart ? <MiniLoader /> : <><FaShoppingCart className="mr-2" /> Add to Cart</>}
                                    </HeroButton>
                                    <HeroButton
                                        onClick={handleBuyNow}
                                        disabled={!isSelectionFull || isAddingToCart || isBuyingNow}
                                        className="w-full py-2.5 sm:py-3 text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50"
                                    >
                                        {isBuyingNow ? <MiniLoader /> : "Buy Now"}
                                    </HeroButton>
                                </div>

                                {/* Ready message (Unchanged) */}
                                {isSelectionFull && !isAddingToCart && !isBuyingNow && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center justify-center gap-2 text-green-600 mt-4 text-xs sm:text-sm"
                                    >
                                        <FaCheckCircle />
                                        <span>Ready to add!</span>
                                    </motion.div>
                                )}
                            </div>

                        </div> {/* End sticky wrapper */}
                    </div> {/* End column 2 */}
                </div> {/* End grid */}
            </div>
        );
    }

    // ⭐️ RETURN THE NEW WRAPPER
    return (
        <div className="w-full"> {/* This is the new outer wrapper */}

            {/* Render the conditional content (loading, error, or builder) */}
            {mainContent}

        </div>
    );
};

export default CustomComboBuilder;