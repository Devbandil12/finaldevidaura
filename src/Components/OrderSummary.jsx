import React from "react";
import { MapPin } from "lucide-react";

const formatAddress = (address) => {
    if (!address) return "No address selected";
    return `${address.address}, ${address.city}, ${address.state} - ${address.postalCode}`;
};

export default function OrderSummary({ selectedAddress, selectedItems, breakdown, loadingPrices, appliedCoupon }) {
    const itemCount = selectedItems.reduce((acc, i) => acc + (i.quantity || 1), 0);
    
    const productDiscount = breakdown.originalTotal - breakdown.productTotal;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 space-y-4 lg:sticky lg:top-24">
            <div className="flex justify-between items-baseline">
                <h2 className="text-xl font-bold text-slate-800">Order Summary</h2>
                <span className="text-sm font-medium text-slate-500">{itemCount} item{itemCount !== 1 && 's'}</span>
            </div>

            <div className="text-sm border-t border-b border-slate-100 py-4">
                <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <strong className="text-slate-700">Deliver to: {selectedAddress?.name || "..."}</strong>
                        <p className="text-slate-500 mt-1">{formatAddress(selectedAddress)}</p>
                    </div>
                </div>
            </div>
            
            <div className="space-y-3">
                {selectedItems.map((item) => {
                    // 🟢 --- START FIX ---
                    // Check if the backend specifically marked THIS variantId as free
                    const isFree = breakdown.appliedOffers?.some(offer => 
                      offer.appliesToVariantId === item.variant.id
                    );
                    // 🟢 --- END FIX ---

                    return (
                        <div key={item.variant.id} className="flex items-center gap-4">
                            <img 
                              src={item.product.imageurl || "/fallback.png"}
                              alt={item.product.name} 
                              className="w-14 h-14 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-slate-800 leading-tight truncate">{item.product.name}</p>
                                
                                {item.isBundle ? (
                                  <div className="pl-4 mt-1">
                                    <ul className="list-disc list-inside text-xs text-slate-500">
                                      {item.contents?.map((content, idx) => (
                                        <li key={idx} className="truncate">
                                          {content.name} ({content.variantName})
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500">{item.variant.name} (Qty: {item.quantity || 1})</p>
                                )}
                            </div>
                            
                            {/* This check is now correct and specific */}
                            {isFree ? (
                                <span className="font-semibold text-sm text-green-600">Free</span>
                            ) : (
                                <p className="font-semibold text-sm text-slate-800 ml-auto">₹{item.variant.price}</p>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="text-sm space-y-2 border-t border-slate-100 pt-4">
                {loadingPrices ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="w-6 h-6 border-2 border-slate-100 border-t-black rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between text-slate-600"><span>Original Price</span><span>₹{breakdown.originalTotal}</span></div>
                        
                        {productDiscount > 0 && (
                            <div className="flex justify-between text-slate-600"><span>Product Discount</span><span className="text-green-600">-₹{productDiscount.toFixed(2)}</span></div>
                        )}
                        
                        {/* This part was already correct and will show the list of offers */}
                        {breakdown.appliedOffers && breakdown.appliedOffers.map((offer, index) => (
                            <div key={index} className="flex justify-between font-semibold text-green-600">
                                <span>{offer.title}</span>
                                <span>-₹{offer.amount}</span>
                            </div>
                        ))}

                        {appliedCoupon && (
                            <div className="flex justify-between font-semibold text-green-600">
                                <span>Coupon ({appliedCoupon.code})</span>
                                <span>-₹{breakdown.discountAmount}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between text-slate-600"><span>Delivery Charge</span><span>₹{breakdown.deliveryCharge}</span></div>
                        
                        <div className="flex justify-between font-bold text-lg text-black border-t border-slate-100 pt-3 mt-3">
                            <span>Total Amount</span>
                            <span>₹{breakdown.total}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}