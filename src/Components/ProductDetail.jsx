// src/pages/ProductDetail.jsx
import React, { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ProductContext } from "../contexts/productContext";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";
import ReviewComponent from "./ReviewComponent";
import { Heart, ShoppingCart, Share2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- A mock Button component (Unchanged) ---
const Button = ({ onClick, variant = 'primary', size = 'default', className = '', children, disabled }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  const sizeStyles = { default: "h-10 py-2 px-4", sm: "h-7 px-3 rounded-md", lg: "h-11 px-8 rounded-md", icon: "h-10 w-10" };
  const variantStyles = {
    primary: "bg-gray-900 text-gray-50 hover:bg-gray-900/90",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-100/80",
    destructive: "bg-red-600 text-gray-50 hover:bg-red-600/90",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
const buttonVariants = {
  hover: { scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 15 } },
  tap: { scale: 0.97 }
};
const iconVariants = {
  tap: { scale: 1.2, rotate: -10, transition: { type: "spring", stiffness: 300, damping: 10 } }
};
// --- End of Button ---


const ProductDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userdetails } = useContext(UserContext);
  const { products, loading: productsLoading } = useContext(ProductContext);
  const { cart, wishlist, addToCart, removeFromCart, toggleWishlist, startBuyNow } = useContext(CartContext);

  const { productId } = useParams();
  const [product, setProduct] = useState(null);

  // 🟢 NEW: State for selected variant
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [isFindingProduct, setIsFindingProduct] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentImg, setCurrentImg] = useState(0);
  const editReviewId = location.state?.editReviewId || null;
  // 🟢 MODIFIED: Effect to find product and set default variant
  useEffect(() => {
    if (!productsLoading) {
      // This now gets the product *with* its 'variants' array
      const foundProduct = products.find((p) => p.id === productId);
      setProduct(foundProduct);

      // 🟢 NEW: Set the first variant as the default
      if (foundProduct && foundProduct.variants && foundProduct.variants.length > 0) {
        setSelectedVariant(foundProduct.variants[0]);
      } else {
        setSelectedVariant(null); // No variants found
      }
      setIsFindingProduct(false);
    }
  }, [productId, products, productsLoading]);

useEffect(() => {
    // MODIFIED: Only scroll to top if we are NOT navigating here to edit a review.
    if (product && !editReviewId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [product, editReviewId]);

  // 🟢 MODIFIED: Loading/Error states
  if (productsLoading || isFindingProduct) {
    return (
      <>
        <title>Loading Fragrance... | Devid Aura</title>
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full animate-spin" />
            <p className="text-lg text-gray-800 font-medium">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  // 🟢 MODIFIED: Check for product OR variant
  if (!product || !selectedVariant) {
    return (
      <>
        <title>Product Not Found | Devid Aura</title>
        <meta name="description" content="The fragrance you are looking for could not be found. Please return to our home page to explore our collection." />
        <div className="flex items-center justify-center min-h-screen bg-white px-4">
          <div className="text-center p-8 bg-gray-50 rounded-xl shadow-lg max-w-md">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Product Not Found</h2>
            <p className="text-gray-500 mb-6">The fragrance you're looking for doesn't exist or has no variants.</p>
            <Button onClick={() => navigate("/")}>Return Home</Button>
          </div>
        </div>
      </>
    );
  }

  // All images from main product
  const allImages = product.imageurl || [];

  // 🟢 MODIFIED: Cart/Wishlist checks now use variantId
  const isInCart = cart?.some((i) => i.variant?.id === selectedVariant.id);
  const isInWishlist = wishlist?.some((w) => (w.variantId ?? w.variant?.id) === selectedVariant.id);

  // 🟢 MODIFIED: Price is now read from the *selected variant*
  const basePrice = Math.floor(Number(selectedVariant.oprice) || 0);
  const discount = Math.floor(Number(selectedVariant.discount) || 0);
  const discountedPrice = Math.floor(basePrice * (1 - discount / 100));

  const changeImage = (newIndex) => setCurrentImg(newIndex);

  // 🟢 MODIFIED: Handlers now pass the correct (product, variant) order
  const handleAddToCart = async () => {
    if (selectedVariant.stock <= 0) {
      window.toast.error("This item is currently out of stock.");
      return;
    }
    isInCart
      ? await removeFromCart(selectedVariant) // Pass variant object
      : await addToCart(product, selectedVariant, quantity); // Pass (product, variant, qty)
  };

  const handleBuyNow = async () => {
    if (selectedVariant.stock <= 0) {
      window.toast.error("This item is currently out of stock.");
      return;
    }
    startBuyNow(product, selectedVariant, quantity); // 🟢 FIXED: Pass (product, variant, qty)
    navigate("/cart", {
      replace: true,
      state: { isBuyNow: true }
    });
  };

  const handleToggleWishlist = () => toggleWishlist(product, selectedVariant); // 🟢 FIXED: Pass (product, variant)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `Discover ${product.name}`, url: window.location.href });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      window.toast.success("Link copied to clipboard!");
    }
  };

  // 🟢 MODIFIED: Get stock status from the variant
  const stockStatus = selectedVariant.stock === 0
    ? "Out of Stock"
    : selectedVariant.stock <= 10
      ? `Only ${selectedVariant.stock} left!`
      : "In Stock";

  return (
    <>
      <title>{`${product.name} | Devid Aura`}</title>
      <meta name="description" content={`Discover ${product.name}, a captivating fragrance by Devid Aura. ${product.description || 'Experience a scent that defines you.'}`} />

      <div className="min-h-screen bg-white text-gray-800 font-sans">
        <div className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
          <main className="relative max-w-7xl mx-auto px-4 lg:px-8 py-8 md:py-16">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16"
            >
              {/* --- Image Carousel --- */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:sticky lg:top-24 h-fit"
              >
                <div className="flex flex-col-reverse lg:flex-row gap-4">
                  {allImages.length > 1 && (
                    <div className="hidden lg:flex flex-col gap-3">
                      {allImages.slice(0, 5).map((img, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => changeImage(idx)}
                          className={`w-20 h-20 rounded-lg cursor-pointer bg-gray-100 overflow-hidden transition-all duration-300 ${currentImg === idx ? 'ring-2 ring-teal-500 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                        >
                          <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                  <div className="relative w-full aspect-square rounded-2xl bg-gray-100 overflow-hidden shadow-lg shadow-gray-200/50 flex-1">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImg}
                        src={allImages.length > 0 ? allImages[currentImg] : "/placeholder.svg"}
                        alt={product.name}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </AnimatePresence>
                    {allImages.length > 1 && (
                      <>
                        <Button onClick={() => changeImage((currentImg - 1 + allImages.length) % allImages.length)} variant="secondary" size="icon" className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md">
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button onClick={() => changeImage((currentImg + 1) % allImages.length)} variant="secondary" size="icon" className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md">
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-800">
                          {currentImg + 1} / {allImages.length}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {allImages.length > 1 && (
                  <div className="mt-4 flex lg:hidden gap-3 overflow-x-auto pb-2">
                    {allImages.slice(0, 5).map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => changeImage(idx)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg cursor-pointer bg-gray-100 overflow-hidden transition-all duration-300 ${currentImg === idx ? 'ring-2 ring-teal-500' : 'opacity-60'}`}
                      >
                        <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* --- Product Info Column --- */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col px-4 "
              >
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4 mt-8">
                    <div className="flex-1">
                      <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2" style={{ textWrap: 'balance' }}>
                        {product.name}
                      </h1>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${selectedVariant.stock > 0 ? 'bg-teal-500/10 text-teal-600' : 'bg-red-500/10 text-red-600'}`}>
                        <Sparkles className="h-3 w-3" />
                        {stockStatus}
                      </span>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button onClick={handleToggleWishlist} variant="secondary" size="icon" className="rounded-full">
                        <Heart className={`h-5 w-5 transition-colors ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                      </Button>
                      <Button onClick={handleShare} variant="secondary" size="icon" className="rounded-full">
                        <Share2 className="h-5 w-5 text-gray-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-3 flex-wrap mb-6">
                    <span className="text-4xl font-bold text-teal-600">
                      ₹{discountedPrice.toLocaleString("en-IN")}
                    </span>
                    {discount > 0 && (
                      <>
                        <span className="text-xl text-gray-400 line-through">
                          ₹{basePrice.toLocaleString("en-IN")}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-600 text-white">
                          {discount}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mb-6">
                    <span className="text-sm font-semibold text-gray-900 mb-2 block">
                      Size: {selectedVariant.name}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <Button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          variant={selectedVariant.id === variant.id ? 'primary' : 'secondary'}
                          className={`rounded-full ${selectedVariant.id === variant.id ? 'ring-2 ring-offset-2 ring-gray-900' : ''} ${variant.stock === 0 ? 'relative opacity-50' : ''}`}
                          disabled={variant.stock === 0}
                        >
                          {variant.name}
                          {variant.stock === 0 && <span className="absolute -top-1.5 -right-1.5 text-xs bg-red-600 text-white px-1 rounded-full leading-none"></span>}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row  items-start sm:items-center ">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Quantity:</span>
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <Button onClick={() => setQuantity(Math.max(1, quantity - 1))} variant="ghost" size="sm" className="rounded-none h-3 w-8 text-lg">－</Button>
                        <span className="px-2 font-600 text-gray-900">{quantity}</span>
                        <Button onClick={() => setQuantity(quantity + 1)} variant="ghost" size="sm" className="rounded-none h-3 w-8 text-lg">＋</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- Description & Fragrance Profile (Unchanged) --- */}
                <div className="space-y-8 mb-8">
                  <div>
                    <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-3">About This Fragrance</h2>
                    <p className="text-gray-600 leading-relaxed">{product.description}</p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-serif font-semibold text-gray-900">Fragrance Profile</h3>
                    <div className="grid gap-4">
                      <div className="flex gap-4 p-4 rounded-lg bg-gray-100/70">
                        <div className="flex-shrink-0 w-24 text-sm font-semibold text-teal-600">Top Notes</div>
                        <div className="text-sm text-gray-600">{product.composition}</div>
                      </div>
                      <div className="flex gap-4 p-4 rounded-lg bg-gray-100/70">
                        <div className="flex-shrink-0 w-24 text-sm font-semibold text-teal-600">Base Notes</div>
                        <div className="text-sm text-gray-600">{product.fragranceNotes}</div>
                      </div>
                      <div className="flex gap-4 p-4 rounded-lg bg-gray-100/70">
                        <div className="flex-shrink-0 w-24 text-sm font-semibold text-teal-600">Heart Notes</div>
                        <div className="text-sm text-gray-600">{product.fragrance}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- Action Buttons --- */}
                <div className="mt-auto space-y-3 ">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      onClick={handleAddToCart}
                      disabled={selectedVariant.stock === 0}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      className={`flex-1 px-4 py-2 lg:px-6 lg:py-3 text-base font-semibold inline-flex items-center justify-center rounded-md transition-colors ${isInCart ? "bg-red-600 text-white hover:bg-red-600/90" : "bg-gray-100 text-gray-900 hover:bg-gray-100/80"} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <motion.div variants={iconVariants} className="mr-2">
                        <ShoppingCart className="h-5 w-5" />
                      </motion.div>
                      {isInCart ? "Remove from Cart" : (selectedVariant.stock === 0 ? "Out of Stock" : "Add to Cart")}
                    </motion.button>
                    <motion.button
                      onClick={handleBuyNow}
                      disabled={selectedVariant.stock === 0}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      className="flex-1 px-4 py-2 lg:px-6 lg:py-3 text-base font-semibold inline-flex items-center justify-center rounded-md bg-gray-900 text-gray-50 hover:bg-gray-900/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedVariant.stock === 0 ? "Out of Stock" : "Buy Now"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* --- Review Component (Unchanged) --- */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-20 lg:mt-24 "
            >
              <h2 className="text-3xl px-4 lg:text-4xl font-serif font-bold text-gray-900 mb-8">Customer Reviews</h2>
              <div className="bg-gray-50 rounded-2xl shadow-lg shadow-gray-200/50  md:p-10">
                <ReviewComponent productId={product.id} userdetails={userdetails} editReviewId={editReviewId} />
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;