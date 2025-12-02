import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, Search, ListFilter, Package, Truck, CheckCircle, 
  ChevronDown, ChevronUp, User, MapPin, CreditCard, Phone, Mail,
  Box, Loader2, Check, RotateCw 
} from 'lucide-react';

// --- CUSTOM STATUS DROPDOWN ---
const StatusDropdown = ({ currentStatus, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const statuses = ["Order Placed", "Processing", "Shipped", "Delivered"];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (status) => {
    onUpdate(status);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between min-w-[130px] px-3 py-1.5 bg-white border rounded-md shadow-sm text-xs font-bold transition-all ${isOpen ? 'border-black ring-1 ring-black' : 'border-gray-300 hover:border-gray-400 text-gray-700'}`}
      >
        <span className="truncate">{currentStatus}</span>
        <ChevronDown size={14} className={`ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-75">
          <div className="p-1">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => handleSelect(status)}
                className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between rounded-md transition-colors ${currentStatus === status ? 'bg-gray-100 text-black font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {status}
                {currentStatus === status && <Check size={12} className="text-black" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
const OrdersTab = ({ 
  orders, orderSearchQuery, setOrderSearchQuery, orderStatusTab, setOrderStatusTab, 
  handleUpdateOrderStatus, handleCancelOrder, getSingleOrderDetails, downloadCSV 
}) => {
  
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetailsData, setOrderDetailsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // --- Helper: Status Timeline Steps ---
  const getProgressStep = (status) => {
    const steps = ["Order Placed", "Processing", "Shipped", "Delivered"];
    const index = steps.indexOf(status);
    return index === -1 ? 0 : index + 1;
  };

  const toggleOrderDetails = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setOrderDetailsData(null);
      return;
    }

    setExpandedOrderId(orderId);
    setLoadingDetails(true);
    
    try {
      const details = await getSingleOrderDetails(orderId);
      setOrderDetailsData(details || null);
    } catch (error) {
      console.error("Failed to fetch order details", error);
      setOrderDetailsData(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      "Delivered": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "Shipped": "bg-blue-50 text-blue-700 border-blue-200",
      "Processing": "bg-amber-50 text-amber-700 border-amber-200",
      "Order Cancelled": "bg-red-50 text-red-700 border-red-200",
      "Order Placed": "bg-gray-50 text-gray-700 border-gray-200",
    };
    return (
      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wide ${styles[status] || styles["Order Placed"]}`}>
        {status}
      </span>
    );
  };

  const filteredOrders = orders?.filter((o) => {
    if (orderStatusTab === "All") return true;
    if (orderStatusTab === "Cancelled") return o.status === "Order Cancelled";
    return o.status === orderStatusTab;
  }).filter((o) => o.id.toString().includes(orderSearchQuery.trim()));

  return (
    <div className="space-y-6 p-4 sm:p-8 bg-gray-50 min-h-screen text-gray-900 font-sans">
      
      {/* --- Header --- */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 flex items-center">
            <Package className="w-6 h-6 mr-3 text-black" /> Orders
          </h2>
        </div>
        <button onClick={() => downloadCSV(orders, 'orders.csv')} className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-black hover:text-white hover:border-black transition text-sm font-semibold shadow-sm">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </button>
      </header>

      {/* --- Filters --- */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
            {["All", "Order Placed", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
              <button 
                key={status} 
                onClick={() => setOrderStatusTab(status)} 
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${orderStatusTab === status ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"}`}
              >
                {status === "Cancelled" ? "Cancelled" : status}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Search Order ID..." 
              value={orderSearchQuery} 
              onChange={(e) => setOrderSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm" 
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* --- Orders List --- */}
      <div className="space-y-4">
        {filteredOrders?.map((order, idx) => {
          
          const isEditable = order.status !== "Order Cancelled" && order.status !== "Delivered";
          const isExpanded = expandedOrderId === order.id;
          const progressStep = getProgressStep(order.status);

          // Payment Status Logic
          const pMode = (order.paymentMode || "").toUpperCase();
          const isCOD = pMode.includes("COD") || pMode.includes("CASH");
          let finalPaymentStatus = "Pending";
          if (isCOD && order.status === "Delivered") {
             finalPaymentStatus = "PAID";
          } else if (orderDetailsData && isExpanded && orderDetailsData.id === order.id) {
             finalPaymentStatus = orderDetailsData.paymentStatus;
          } else if (order.paymentStatus) {
             finalPaymentStatus = order.paymentStatus;
          }
          const isPaid = (finalPaymentStatus || "").toUpperCase() === "PAID" || (finalPaymentStatus || "").toLowerCase() === "refunded";

          return (
            // FIX: Added 'style={{ zIndex: 1000 - idx }}' to ensure upper rows stack on top of lower rows for dropdown visibility
            <div 
              key={order.id} 
              style={{ position: 'relative' }}
              className={`bg-white rounded-lg border transition-all duration-200 ${isExpanded ? 'border-gray-400 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
            >
              
              {/* Main Summary Row */}
              <div 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => toggleOrderDetails(order.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-500">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">#{order.id}</h3>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 font-medium">
                        ₹{order.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 flex-1">
                  {getStatusBadge(order.status)}

                  <div className="flex items-center gap-3">
                    {/* CUSTOM DROPDOWN */}
                    {isEditable && (
                        <StatusDropdown 
                            currentStatus={order.status} 
                            onUpdate={(newStatus) => handleUpdateOrderStatus(order.id, newStatus)} 
                        />
                    )}
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleOrderDetails(order.id); }}
                        className={`p-1.5 rounded-md transition-colors ${isExpanded ? "bg-black text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                    >
                        {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    </button>
                  </div>
                </div>
              </div>

              {/* --- DROPDOWN DETAILS --- */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/30 animate-in fade-in zoom-in-95 duration-200 cursor-default">
                  
                  {loadingDetails ? (
                    <div className="py-10 flex justify-center text-gray-500 text-sm gap-2 items-center">
                      <RotateCw className="w-4 h-4 animate-spin" /> Loading details...
                    </div>
                  ) : orderDetailsData ? (
                    <div className="p-6">
                        
                        {/* 1. TIMELINE STEPPER (BLACK THEME) */}
                        {order.status !== "Order Cancelled" && (
                            <div className="mb-8 pb-8 border-b border-gray-200">
                                <div className="relative flex justify-between w-full max-w-3xl mx-auto">
                                    {/* Line Background */}
                                    <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-0 rounded-full"></div>
                                    {/* Active Line (Black) */}
                                    <div 
                                        className="absolute top-5 left-0 h-0.5 bg-black -z-0 transition-all duration-500 rounded-full" 
                                        style={{ width: `${((progressStep - 1) / 3) * 100}%` }}
                                    ></div>

                                    {/* Steps */}
                                    {[
                                      { label: "Placed", icon: Box }, 
                                      { label: "Processing", icon: Loader2 }, 
                                      { label: "Shipped", icon: Truck }, 
                                      { label: "Delivered", icon: CheckCircle }
                                    ].map((step, idx) => {
                                        const isCompleted = idx + 1 <= progressStep;
                                        const isCurrent = idx + 1 === progressStep;
                                        const Icon = step.icon;
                                        
                                        return (
                                            <div key={step.label} className="relative z-10 flex flex-col items-center">
                                                <div 
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                                                        isCompleted 
                                                            ? "bg-black border-white text-white shadow-lg" 
                                                            : "bg-white border-gray-200 text-gray-300"
                                                    }`}
                                                >
                                                    <Icon size={16} strokeWidth={isCompleted ? 2.5 : 2} className={isCurrent ? "animate-pulse" : ""} />
                                                </div>
                                                <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${isCompleted ? "text-black" : "text-gray-400"}`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col lg:flex-row gap-8">
                            
                            {/* LEFT: PRODUCTS */}
                            <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Items Ordered</h4>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {(orderDetailsData.orderItems || []).map((item, idx) => (
                                        <div key={idx} className="p-4 flex items-center gap-4 hover:bg-gray-50/50">
                                            <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                                <img src={item.img || "/fallback.png"} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-gray-900 text-sm truncate">{item.productName}</div>
                                                <div className="text-xs text-gray-500">{item.variantName}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-400 mb-0.5">₹{item.price} x {item.quantity}</div>
                                                <div className="font-bold text-gray-900 text-sm">₹{item.price * item.quantity}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Total Amount</span>
                                    <span className="text-xl font-bold text-gray-900">₹{orderDetailsData.totalAmount}</span>
                                </div>
                            </div>

                            {/* RIGHT: INFO SIDEBAR */}
                            <div className="w-full lg:w-80 space-y-6">
                                
                                {/* Customer */}
                                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm text-sm">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><User size={14}/> Customer</h4>
                                    <div className="font-bold text-gray-900 mb-1">{orderDetailsData.userName}</div>
                                    <div className="text-gray-500 flex items-center gap-2 mb-1"><Phone size={14} className="text-gray-400"/> {orderDetailsData.phone || "N/A"}</div>
                                    <div className="text-gray-500 flex items-center gap-2 truncate"><Mail size={14} className="text-gray-400"/> {order.userEmail || "No Email"}</div>
                                </div>

                                {/* Shipping */}
                                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm text-sm">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><MapPin size={14}/> Delivery To</h4>
                                    <div className="text-gray-600 leading-relaxed">
                                        <p>{orderDetailsData.shippingAddress?.address}</p>
                                        <p>{orderDetailsData.shippingAddress?.city}, {orderDetailsData.shippingAddress?.state}</p>
                                        <p className="font-medium text-gray-900 mt-1">{orderDetailsData.shippingAddress?.postalCode}</p>
                                    </div>
                                </div>

                                {/* Payment */}
                                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm text-sm">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><CreditCard size={14}/> Payment</h4>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-500">Method</span>
                                        <span className="font-bold uppercase text-gray-900">{orderDetailsData.paymentMode}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Status</span>
                                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isPaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                            {finalPaymentStatus}
                                        </span>
                                    </div>
                                    {isEditable && (
                                        <button 
                                            onClick={() => handleCancelOrder(order)} 
                                            className="w-full mt-4 py-2 text-xs font-bold text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 hover:border-red-300 transition"
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                </div>

                            </div>
                        </div>

                    </div>
                  ) : (
                    <div className="p-8 text-center text-red-500 text-sm">
                        Failed to retrieve order details.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersTab;