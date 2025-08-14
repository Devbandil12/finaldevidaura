import React, { useState, useContext, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProductContext } from "../contexts/ProductContext";
import { CartContext } from "../contexts/CartContext";
import { UserContext } from "../contexts/UserContext";
import ReviewComponent from "./ReviewComponent";
import { useUser } from "@clerk/clerk-react";
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Truck } from "lucide-react";

const ProductDetail = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { userdetails } = useContext(UserContext);
  const { products, loading } = useContext(ProductContext);
  const { cart, wishlist, addToCart, removeFromCart, toggleWishlist, startBuyNow } = useContext(CartContext);
  const { productId } = useParams();

  // --- Check for loading state first ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading product details...</p>
      </div>
    );
  }

  // Find the product after loading is complete
  const product = useMemo(() => {
    return products.find((p) => p.id === productId);
  }, [products, productId]);

  // --- Check if product was found ---
  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Product not found.</p>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.imageurl];

  const isInCart = useMemo(() => cart?.some((i) => i.product?.id === product.id), [cart, product.id]);
  const isInWishlist = useMemo(() => wishlist?.some((w) => (w.productId ?? w.product?.id) === product.id), [wishlist, product.id]);

  const [quantity, setQuantity] = useState(1);
  const [currentImg, setCurrentImg] = useState(0);

  const basePrice = Math.floor(Number(product.oprice) || 0);
  const discount = Math.floor(Number(product.discount) || 0);
  const discountedPrice = Math.floor(basePrice * (1 - discount / 100));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  const changeImage = (delta) =>
    setCurrentImg((idx) => (idx + delta + images.length) % images.length);

  const handleAddToCart = async () => {
    if (isInCart) {
      await removeFromCart(product.id);
    } else {
      await addToCart(product, quantity);
    }
  };

  const handleBuyNow = async () => {
    const ok = startBuyNow(product, quantity);
    if (ok) navigate("/checkout");
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
  };
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden lg:flex lg:p-8 p-4">
          {/* Image Gallery */}
          <div className="lg:w-1/2 flex flex-col items-center">
            <div className="relative w-full aspect-square mb-4">
              <img
                src={images[currentImg]}
                alt={product.name}
                className="w-full h-full object-contain rounded-lg shadow-md"
              />
              {images.length > 1 && (
                <>
                  <button className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/70 p-2 rounded-full shadow-md z-10 hover:bg-white transition-colors" onClick={() => changeImage(-1)}>
                    <ChevronLeft size={24} />
                  </button>
                  <button className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/70 p-2 rounded-full shadow-md z-10 hover:bg-white transition-colors" onClick={() => changeImage(1)}>
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto w-full justify-center p-2">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 transition-all ${currentImg === idx ? "border-black scale-105" : "border-gray-300 opacity-70"}`}
                  onClick={() => setCurrentImg(idx)}
                />
              ))}
            </div>
          </div>

          {/* Product Info & Actions */}
          <div className="lg:w-1/2 mt-8 lg:mt-0 lg:pl-12 flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-lg text-gray-500 mb-4">{product.composition}</p>

              {/* Price & Discount */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-extrabold text-green-600">₹{discountedPrice}</span>
                {discount > 0 && (
                  <>
                    <span className="text-lg text-gray-500 line-through">₹{basePrice}</span>
                    <span className="text-md font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">{discount}% OFF</span>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Description</h2>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {/* Delivery Info */}
              <div className="flex items-center gap-4 text-gray-700 p-4 border rounded-lg bg-gray-50 mb-6">
                <Truck size={24} className="text-green-600" />
                <div>
                  <h3 className="font-semibold">Expected Delivery</h3>
                  <p className="text-sm">Within 5-7 business days across India.</p>
                </div>
              </div>
              
              <div className="space-y-4 text-gray-800">
                {product.fragranceNotes && (
                  <div>
                    <h3 className="font-bold text-lg">Fragrance Notes</h3>
                    <hr className="border-t border-gray-200 my-1" />
                    <p>{product.fragranceNotes}</p>
                  </div>
                )}
                {product.fragrance && (
                  <div>
                    <h3 className="font-bold text-lg">Heart Notes</h3>
                    <hr className="border-t border-gray-200 my-1" />
                    <p>{product.fragrance}</p>
                  </div>
                )}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-full p-2">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-1 font-semibold text-lg hover:bg-gray-100 rounded-full">-</button>
                <span className="px-4 text-lg font-semibold">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} className="px-3 py-1 font-semibold text-lg hover:bg-gray-100 rounded-full">+</button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-6 font-semibold rounded-full transition-colors duration-200 flex items-center justify-center gap-2 ${
                  isInCart
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                <ShoppingCart size={20} />
                {isInCart ? "Remove from Cart" : "Add to Cart"}
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 py-3 px-6 font-semibold rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
              >
                Buy Now
              </button>
              <button
                onClick={handleToggleWishlist}
                className="p-3 rounded-full border border-gray-300 transition-colors duration-200 hover:bg-gray-200"
              >
                <Heart size={24} fill={isInWishlist ? 'red' : 'none'} stroke={isInWishlist ? 'red' : 'gray'} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Review Section */}
      <div className="container mx-auto max-w-7xl px-4 mt-8">
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-8">
          <ReviewComponent productId={product.id} user={user} userdetails={userdetails} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
