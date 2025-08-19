import React from "react";

// Helper: formatAddress
const formatAddress = (address) => {
  if (!address) return "";
  return `${address.name} - ${address.address}, ${address.city}, ${address.state}, ${address.country} (${address.postalCode})${address.phone ? " - Phone: " + address.phone : ""}`;
};

export default function OrderSummary({
  selectedAddress,
  selectedItems,
  breakdown,
  loadingPrices,
  appliedCoupon
}) {
  const itemCount = selectedItems.reduce(
    (acc, i) => acc + (i.quantity || 1),
    0
  );

  const productDiscount = (breakdown.originalTotal - breakdown.productTotal).toFixed(2);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Order Summary</h2>
        <span className="text-gray-500 text-sm">{itemCount} item{itemCount > 1 ? "s" : ""}</span>
      </div>

      <div className="mb-4">
        <strong className="text-gray-700">Deliver to:</strong>
        <p className="text-sm text-gray-600 mt-1">
          {selectedAddress
            ? formatAddress(selectedAddress)
            : "No address selected"}
        </p>
      </div>

      <details className="mb-4" open>
        <summary className="font-medium text-gray-800 cursor-pointer list-none flex justify-between items-center">
          <span>Items</span>
          <svg className="w-4 h-4 ml-2 text-gray-500 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <ul className="mt-3 space-y-3">
          {selectedItems.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-4 border-b last:border-b-0 pb-3">
              <img src={item.product.imageurl} alt={item.product.name} className="w-16 h-16 object-cover rounded-md shadow-sm" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.product.name}</p>
                <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity || 1}</p>
              </div>
              <p className="text-sm font-medium text-gray-700">
                ₹{Math.floor(item.product.oprice * (1 - item.product.discount / 100))}
              </p>
            </li>
          ))}
        </ul>
      </details>

      <div className="space-y-2 text-sm text-gray-600">
        {loadingPrices ? (
          <p className="text-center py-4">Loading price details…</p>
        ) : (
          <>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{breakdown.productTotal}</span>
            </div>
            {productDiscount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Product Discount</span>
                <span>-₹{productDiscount}</span>
              </div>
            )}
            {appliedCoupon && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>-₹{breakdown.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span>₹{breakdown.deliveryCharge}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold text-gray-800 border-t pt-4 mt-4">
              <span>Total</span>
              <span>₹{breakdown.total}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
