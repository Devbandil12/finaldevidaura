// src/components/ProductDetail.jsx
import React, { useState, useContext } from 'react';
import { CartContext } from '../contexts/CartContext';

const ProductDetail = ({ product, onClose, onToggleWishlist, inWishlist }) => {
  const { cart, setCart } = useContext(CartContext);
  const [currentImg, setCurrentImg] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.imageurl];

  const discountedPrice = Math.round(
    product.basePrice * (1 - product.discountPercent / 100)
  );

  const inCart = cart.some(item => item.product.id === product.id);

  const changeImage = delta =>
    setCurrentImg(idx => (idx + delta + images.length) % images.length);

  const addToCart = () => {
    setCart(prev => [...prev, { product, size: product.size, qty: quantity }]);
  };

  const removeFromCart = () => {
    setCart(prev => prev.filter(item => item.product.id !== product.id));
  };

  const handleShare = () => {
    const shareData = {
      title: product.name,
      text: `${product.name} - ₹${discountedPrice}. ${product.description || ''}`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(err =>
        console.error('Error sharing:', err)
      );
    } else {
      alert('Sharing is not supported on this browser.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white max-w-4xl w-full rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden">

        {/* Left: Image Gallery */}
        <div className="w-full md:w-1/2 bg-gray-100 p-4 relative flex flex-col items-center">
          <button
            onClick={() => changeImage(-1)}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-200"
          >
            &lt;
          </button>
          <img
            src={images[currentImg]}
            alt={`${product.name} ${currentImg + 1}`}
            className="object-cover w-full h-96 rounded-lg"
          />
          <button
            onClick={() => changeImage(1)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-200"
          >
            &gt;
          </button>

          {/* Thumbnails */}
          <div className="flex space-x-2 mt-4 overflow-x-auto">
            {images.slice(0, 5).map((img, idx) => (
              <img
                key={idx}
                src={img}
                onClick={() => setCurrentImg(idx)}
                className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                  idx === currentImg ? 'border-indigo-500' : 'border-transparent'
                }`}
                alt={`thumb-${idx}`}
              />
            ))}
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
          >
            ×
          </button>

          <div>
            {/* Name */}
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
              {product.name}
            </h2>

            {/* Price & Size */}
            <div className="flex items-baseline mt-2 flex-wrap gap-2">
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                ₹{discountedPrice}
              </span>
              {product.discountPercent > 0 && (
                <span className="text-sm line-through text-gray-500">
                  ₹{Math.round(product.basePrice)}
                </span>
              )}
              <span className="ml-auto text-sm text-gray-700">
                {product.size} ml
              </span>
            </div>

            {/* Quantity */}
            <div className="mt-4 flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Qty:</span>
              <div className="flex items-center border rounded">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-1"
                >
                  –
                </button>
                <span className="px-4">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-3 py-1"
                >
                  +
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 text-gray-700 space-y-2">
              <h3 className="font-medium">Description</h3>
              <p>{product.description}</p>
            </div>

            {/* Notes */}
            <div className="mt-6 text-gray-700 space-y-4">
              {product.topNotes && (
                <div>
                  <h3 className="font-medium">Top Notes</h3>
                  <hr className="border-t border-gray-300 my-1" />
                  <p>{product.topNotes}</p>
                </div>
              )}
              {product.baseNotes && (
                <div>
                  <h3 className="font-medium">Base Notes</h3>
                  <hr className="border-t border-gray-300 my-1" />
                  <p>{product.baseNotes}</p>
                </div>
              )}
              {product.heartNotes && (
                <div>
                  <h3 className="font-medium">Heart Notes</h3>
                  <hr className="border-t border-gray-300 my-1" />
                  <p>{product.heartNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4 flex-wrap">
            <button
              onClick={onToggleWishlist}
              className={`w-full sm:w-auto py-3 px-6 font-semibold rounded-lg border ${
                inWishlist
                  ? 'bg-white text-pink-600 border-pink-500 hover:bg-pink-50'
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {inWishlist ? '♥ Wishlisted' : '♡ Add to Wishlist'}
            </button>

            <button
              onClick={handleShare}
              className="w-full sm:w-auto py-3 px-6 font-semibold rounded-lg bg-white text-blue-700 border border-blue-500 hover:bg-blue-50"
            >
              📤 Share
            </button>

            {inCart ? (
              <button
                onClick={removeFromCart}
                className="w-full sm:w-auto py-3 px-6 font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Remove from Cart
              </button>
            ) : (
              <button
                onClick={addToCart}
                className="w-full sm:w-auto py-3 px-6 font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
