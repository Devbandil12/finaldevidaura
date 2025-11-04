import React from "react";
import { MapPin } from "lucide-react";

const formatAddress = (address) => {
    if (!address) return "No address selected";
    return `${address.address}, ${address.city}, ${address.state} - ${address.postalCode}`;
};

export default function OrderSummary({ selectedAddress, selectedItems, breakdown, loadingPrices, appliedCoupon }) {
    const itemCount = selectedItems.reduce((acc, i) => acc + (i.quantity || 1), 0);
    
    // 🟢 This calculation is now correct because the breakdown object is correct
    const productDiscount = breakdown.originalTotal - breakdown.productTotal;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 space-y-4 lg:sticky lg:top-24">
            <div className="flex justify-between items-baseline">
                <h2 className="text-xl font-bold text-slate-800">Order Summary</h2>
                <span className="text-sm font-medium text-slate-500">{itemCount} item{itemCount !== 1 && 's'}</span>
            </div>

            <div className="text-sm border-t border-b border-slate-200 py-4">
                <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <strong className="text-slate-700">Deliver to: {selectedAddress?.name || "..."}</strong>
                        <p className="text-slate-500 mt-1">{formatAddress(selectedAddress)}</p>
                    </div>
                </div>
            </div>
            
            {/* 🟢 MODIFIED: Read from the new item structure */}
            <div className="space-y-3">
                {selectedItems.map((item) => (
                    <div key={item.variant.id} className="flex items-center gap-4">
                        <img 
                          src={item.product.imageurl || "/fallback.png"} // Use main product image
                          alt={item.product.name} 
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200" 
                        />
                        <div className="flex-1">
                            <p className="font-semibold text-sm text-slate-800 leading-tight">{item.product.name}</p>
                            <p className="text-xs text-slate-500">{item.variant.name} (Qty: {item.quantity || 1})</p>
                        </div>
                        <p className="font-semibold text-sm">₹{item.variant.price}</p>
                    </div>
                ))}
            </div>
            
            <div className="text-sm space-y-2 border-t border-slate-200 pt-4">
                {loadingPrices ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="w-6 h-6 border-2 border-slate-200 border-t-black rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{breakdown.productTotal}</span></div>
                        <div className="flex justify-between text-slate-600"><span>Product Discount</span><span>-₹{productDiscount.toFixed(2)}</span></div>
                        {appliedCoupon && <div className="flex justify-between font-semibold text-green-600"><span>Coupon ({appliedCoupon.code})</span><span>-₹{breakdown.discountAmount}</span></div>}
                        <div className="flex justify-between text-slate-600"><span>Delivery Charge</span><span>₹{breakdown.deliveryCharge}</span></div>
                        <div className="flex justify-between font-bold text-lg text-black border-t border-slate-200 pt-3 mt-3"><span>Total Amount</span><span>₹{breakdown.total}</span></div>
                    </>
                )}
            </div>
        </div>
    );
}