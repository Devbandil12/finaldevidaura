import React, { useState, useContext } from 'react';
import { CartContext } from '../contexts/CartContext';
import { ProductContext } from '../contexts/productContext';
import { useNavigate } from "react-router-dom";

const ProductDetail = ({
  product,
  onClose,
  onToggleWishlist,
  inWishlist,
  onAddToCart,
  inCart
}) => {
  const { products } = useContext(ProductContext);
  const fullProduct = products.find(p => p.id === product.id) || product;



const navigate = useNavigate();

const handleBuyNow = () => {
  const buyNowItem = {
    product,
    quantity, // If you already have quantity state passed in
  };
  localStorage.setItem("buyNowItem", JSON.stringify(buyNowItem));
  navigate("/cart?buyNow=true");
};



  const [quantity, setQuantity] = useState(1);
  const [currentImg, setCurrentImg] = useState(0);

  const images = Array.isArray(fullProduct.images) && fullProduct.images.length > 0
    ? fullProduct.images
    : [fullProduct.imageurl];

  const basePrice = Math.floor(Number(fullProduct.oprice) || 0);
  const discount = Math.floor(Number(fullProduct.discount) || 0);
  const discountedPrice = Math.floor(basePrice - (basePrice * discount / 100));

  const changeImage = delta =>
    setCurrentImg(idx => (idx + delta + images.length) % images.length);

  const addToCartHandler = () => {
    onAddToCart(fullProduct, quantity);
  };

  const handleShare = async () => {
    const shareData = {
      title: fullProduct.name,
      text: `${fullProduct.name} – ₹${discountedPrice}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard');
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white max-w-4xl w-full rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Image Gallery */}
        <div className="w-full md:w-1/2 bg-gray-100 p-4 relative flex flex-col items-center">
          <button onClick={() => changeImage(-1)} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-200">&lt;</button>
          <img src={images[currentImg]} alt={`${fullProduct.name} ${currentImg + 1}`} className="object-cover w-full h-96 rounded-lg" />
          <button onClick={() => changeImage(1)} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-200">&gt;</button>

          {/* Thumbnails */}
          <div className="flex space-x-2 mt-4 overflow-x-auto">
            {images.slice(0, 5).map((img, idx) => (
              <img
                key={idx}
                src={img}
                onClick={() => setCurrentImg(idx)}
                className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${idx === currentImg ? 'border-indigo-500' : 'border-transparent'}`}
                alt={`thumb-${idx}`}
              />
            ))}
          </div>
        </div>

        {/* Right Product Details */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-2xl text-gray-500 hover:text-gray-800 font-bold">×</button>

          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">{fullProduct.name}</h2>
            <div className="flex items-baseline mt-2 flex-wrap gap-2">
              <span className="text-xl md:text-2xl font-bold text-gray-900">₹{discountedPrice}</span>
              {discount > 0 && (
                <span className="text-sm line-through text-gray-500">₹{basePrice}</span>
              )}
              <span className="ml-auto text-sm text-gray-700">{fullProduct.size} ml</span>
            </div>

            {/* Quantity */}
            <div className="mt-4 flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Qty:</span>
              <div className="flex items-center border rounded">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-1">–</button>
                <span className="px-4">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="px-3 py-1">+</button>
              </div>
            </div>

            {/* Description */}
            {fullProduct.description && (
              <div className="mt-6 text-gray-700 space-y-2">
                <h3 className="font-medium">Description</h3>
                <p>{fullProduct.description}</p>
              </div>
            )}

            {/* Notes — YOUR ORIGINAL LOGIC PRESERVED */}
            <div className="mt-6 text-gray-700 space-y-4">
              {fullProduct.composition && (
                <div>
                  <h3 className="font-medium">Top Notes</h3>
                  <hr className="border-t border-gray-300 my-1" />
                  <p>{fullProduct.composition}</p>
                </div>
              )}
              {fullProduct.fragranceNotes && (
                <div>
                  <h3 className="font-medium">Base Notes</h3>
                  <hr className="border-t border-gray-300 my-1" />
                  <p>{fullProduct.fragranceNotes}</p>
                </div>
              )}
              {fullProduct.fragrance && (
                <div>
                  <h3 className="font-medium">Heart Notes</h3>
                  <hr className="border-t border-gray-300 my-1" />
                  <p>{fullProduct.fragrance}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={onToggleWishlist}
              className={`w-full sm:w-auto py-3 px-6 font-semibold rounded-lg border ${inWishlist ? 'bg-white text-pink-600 border-pink-500 hover:bg-pink-50' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
            >
              {inWishlist ? '♥ Wishlisted' : '♡ Add to Wishlist'}
            </button>

            <button onClick={handleShare} className="w-full sm:w-auto py-3 px-6 font-semibold rounded-lg border border-blue-500 text-blue-600 bg-white hover:bg-blue-50">
              Share
            </button>

            <button
              onClick={addToCartHandler}
              className={`w-full sm:w-auto py-3 px-6 font-semibold rounded-lg ${inCart ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              {inCart ? 'Remove from Cart' : `Add to Cart (${quantity})`}
            </button>
<button
  onClick={handleBuyNow}
  className="bg-blue-600 text-white px-4 py-2 rounded-md w-full mt-2"
>
  Buy Now
</button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
