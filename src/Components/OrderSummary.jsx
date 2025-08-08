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

  const productDiscount = breakdown.originalTotal - breakdown.productTotal;

  return (
    <div className="order-summary-card">
      <div className="order-summary-card__header">
        <h2>Order Summary</h2>
        <span>
          {itemCount} item{itemCount > 1 ? "s" : ""}
        </span>
      </div>

      <div className="order-summary-card__address">
        <strong>Deliver to:</strong>
        <p>
          {selectedAddress
            ? formatAddress(selectedAddress)
            : "No address selected"}
        </p>
      </div>

      <details className="order-summary-card__items" open>
        <summary>Items</summary>
        <ul>
          {selectedItems.map((item, idx) => (
            <li key={idx} className="order-summary-item-details">
              <img src={item.product.imageurl} alt={item.product.name} />
              <div className="item-info">
                <p className="item-name">{item.product.name}</p>
                <p className="item-qty">×{item.quantity || 1}</p>
              </div>
              <p className="item-price">
                ₹
                {Math.floor(
                  item.product.oprice * (1 - item.product.discount / 100)
                )}
              </p>
            </li>
          ))}
        </ul>
      </details>

      <div className="order-summary-card__breakdown">
        {loadingPrices ? (
          <p>Loading price details…</p>
        ) : (
          <>
            <div><span>Subtotal</span><span>₹{breakdown.productTotal}</span></div>
            <div><span>Product Discount</span><span className="text-danger">-₹{productDiscount}</span></div>
            {appliedCoupon && (
              <div style={{ color: "green", fontWeight: 600 }}>
                <span>Coupon ({appliedCoupon.code})</span>
                <span>-₹{breakdown.discountAmount}</span>
              </div>
            )}
            <div><span>Delivery Charge </span><span>₹{breakdown.deliveryCharge}</span></div>
            <div className="order-summary-card__total">
              <span>Total</span><span>₹{breakdown.total}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
