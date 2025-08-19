
// src/components/OrderSummary.jsx

import React from "react";
// No need to import a separate CSS file anymore
// import "../style/orderSummary.css";

// Helper: formatAddress
const formatAddress = (address) => {
  if (!address) return "";
  return `${address.name} - ${address.address}, ${address.city}, ${address.state}, ${address.country} (${address.postalCode})${
    address.phone ? " - Phone: " + address.phone : ""
  }`;
};
export default function OrderSummary({
  selectedAddress,
  selectedItems,
  breakdown,
  loadingPrices,
  appliedCoupon,
}) {
  const itemCount = selectedItems.reduce(
    (acc, i) => acc + (i.quantity || 1),
    0
  );

  const productDiscount = breakdown.originalTotal - breakdown.productTotal;

  return (
    <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Order Summary</h2>
        <span className="text-sm text-gray-500">
          {itemCount} item{itemCount > 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm text-gray-700">
        <strong className="block mb-1">Deliver to:</strong>
        <p>
          {selectedAddress
            ? formatAddress(selectedAddress)
            : "No address selected"}
        </p>
      </div>

      <details className="mt-4" open>
        <summary className="text-lg font-semibold cursor-pointer py-2">
          Items
        </summary>
        <ul className="divide-y divide-gray-100">
          {selectedItems.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-4">
                <img
                  src={item.product.imageurl}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    ×{item.quantity || 1}
                  </p>
                </div>
              </div>
              <p className="text-base font-semibold text-gray-800">
                ₹
                {Math.floor(
                  item.product.oprice * (1 - item.product.discount / 100)
                )}
              </p>
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-700">
        {loadingPrices ? (
          <p>Loading price details…</p>
        ) : (
          <>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{breakdown.productTotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Product Discount</span>
              <span className="text-red-500">-₹{productDiscount}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>-₹{breakdown.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span>₹{breakdown.deliveryCharge}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t border-gray-300 text-gray-900">
              <span>Total</span>
              <span>₹{breakdown.total}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
