import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, Search, Package, Truck, CheckCircle, 
  ChevronDown, ChevronUp, User, MapPin, CreditCard, Phone, Mail,
  Box, Loader2, Check, RotateCw, Calendar, AlertCircle
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
        className={`flex items-center justify-between min-w-[140px] px-3 py-2 bg-white border rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] text-xs font-bold transition-all ${isOpen ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
      >
        <span className="truncate">{currentStatus}</span>
        <ChevronDown size={14} className={`ml-2 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white  rounded-xl shadow-xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-75">
          <div className="p-1">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => handleSelect(status)}
                className={`w-full text-left px-3 py-2.5 text-xs font-medium flex items-center justify-between rounded-lg transition-colors ${currentStatus === status ? 'bg-gray-100 text-black font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {status}
                {currentStatus === status && <Check size={14} className="text-black" />}
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
      "Delivered": "bg-emerald-50 text-emerald-700 border-emerald-100",
      "Shipped": "bg-blue-50 text-blue-700 border-blue-100",
      "Processing": "bg-amber-50 text-amber-700 border-amber-100",
      "Order Cancelled": "bg-red-50 text-red-700 border-red-100",
      "Order Placed": "bg-gray-50 text-gray-700 border-gray-100",
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
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 flex items-center">
            <Package className="w-6 h-6 mr-3 text-indigo-600" /> Order Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">Track and manage customer orders.</p>
        </div>
        <button 
          onClick={() => downloadCSV(orders, 'orders.csv')} 
          className="flex items-center px-4 py-2 bg-white  text-gray-700 rounded-xl hover:bg-black hover:text-white hover:border-black transition text-sm font-semibold shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] whitespace-nowrap"
        >
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </button>
      </div>

      {/* --- Filters --- */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
            {["All", "Order Placed", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
              <button 
                key={status} 
                onClick={() => setOrderStatusTab(status)} 
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${orderStatusTab === status ? "bg-black text-white border-black shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"}`}
              >
                {status === "Cancelled" ? "Cancelled" : status}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <input 
              type="text" 
              placeholder="Search by Order ID..." 
              value={orderSearchQuery} 
              onChange={(e) => setOrderSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 bg-white  rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] text-sm transition-all" 
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
      </div>

      {/* --- Orders List --- */}
      <div className="space-y-4">
        {filteredOrders?.length > 0 ? filteredOrders.map((order, idx) => {
          
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
            <div 
              key={order.id} 
              style={{ zIndex: 1000 - idx, position: 'relative' }}
              className={`bg-white rounded-2xl border transition-all duration-300 group ${isExpanded ? 'border-gray-400 shadow-xl ring-1 ring-gray-100' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
            >
              
              {/* Main Summary Row */}
              <div 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => toggleOrderDetails(order.id)}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border ${isExpanded ? 'bg-black border-black text-white' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                    <Package size={20} strokeWidth={1.5} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-gray-900">#{order.id}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 ">
                            {order.orderItems?.length || 1} Items
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Calendar size={12} />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="text-gray-300">•</span>
                        <span className="font-medium text-gray-900">₹{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 flex-1 pl-16 md:pl-0">
                  {getStatusBadge(order.status)}

                  <div className="flex items-center gap-3">
                    {/* CUSTOM DROPDOWN */}
                    {isEditable && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <StatusDropdown 
                                currentStatus={order.status} 
                                onUpdate={(newStatus) => handleUpdateOrderStatus(order.id, newStatus)} 
                            />
                        </div>
                    )}
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleOrderDetails(order.id); }}
                        className={`p-2 rounded-lg transition-colors ${isExpanded ? "bg-black text-white shadow-md" : "text-gray-400 hover:bg-gray-50 hover:text-black"}`}
                    >
                        {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    </button>
                  </div>
                </div>
              </div>

              {/* --- DROPDOWN DETAILS --- */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/30 animate-in slide-in-from-top-2 duration-300 cursor-default rounded-b-2xl pb-6 px-6 md:px-8">
                  
                  {loadingDetails ? (
                    <div className="py-12 flex flex-col justify-center items-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mb-2 text-black" />
                      <span className="text-xs font-medium">Retrieving details...</span>
                    </div>
                  ) : orderDetailsData ? (
                    <div className="pt-8">
                        
                        {/* 1. REDESIGNED BLACK TIMELINE STEPPER */}
                        {order.status !== "Order Cancelled" && (
                            <div className="mb-10 pb-8 border-b border-gray-200">
                                <div className="relative flex justify-between w-full max-w-3xl mx-auto">
                                    {/* Line Background */}
                                    <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-0 rounded-full"></div>
                                    {/* Active Line (Black) */}
                                    <div 
                                        className="absolute top-5 left-0 h-0.5 bg-black -z-0 transition-all duration-700 rounded-full" 
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
                                            <div key={step.label} className="relative z-10 flex flex-col items-center group">
                                                <div 
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] ${
                                                        isCompleted 
                                                            ? "bg-black border-black text-white" 
                                                            : "bg-white border-gray-200 text-gray-300"
                                                    }`}
                                                >
                                                    <Icon size={18} strokeWidth={isCompleted ? 2.5 : 2} className={isCurrent ? "animate-pulse" : ""} />
                                                </div>
                                                <span className={`text-[10px] mt-3 font-bold uppercase tracking-wider transition-colors ${isCompleted ? "text-black" : "text-gray-400"}`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col xl:flex-row gap-8">
                            
                            {/* LEFT: PRODUCTS TABLE */}
                            <div className="flex-1">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Items Ordered</h4>
                                <div className="bg-gray-50 rounded-2xl overflow-hidden /50">
                                    <div className="divide-y divide-gray-200/50">
                                        {(orderDetailsData.orderItems || []).map((item, idx) => (
                                            <div key={idx} className="p-5 flex items-center gap-4 hover:bg-white transition-colors group">
                                                <div className="w-14 h-14 rounded-lg bg-white  overflow-hidden flex-shrink-0 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
                                                    <img src={item.img || "/fallback.png"} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-gray-900 text-sm truncate">{item.productName}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                                        <span className="bg-white  px-2 py-0.5 rounded text-[10px] font-medium">{item.variantName}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-400 mb-1">₹{item.price} x {item.quantity}</div>
                                                    <div className="font-bold text-gray-900 text-sm">₹{item.price * item.quantity}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-5 bg-gray-100/50 border-t border-gray-200/50 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Grand Total</span>
                                        <span className="text-xl font-extrabold text-black">₹{orderDetailsData.totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: INFO SIDEBAR */}
                            <div className="w-full xl:w-80 space-y-5">
                                
                                {/* Customer Card */}
                                <div className="bg-gray-50 p-5 rounded-2xl /50">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><User size={14}/> Customer Details</h4>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm  shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
                                            {orderDetailsData.userName?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">{orderDetailsData.userName}</div>
                                            <div className="text-xs text-gray-500">Registered User</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-3 border-t border-gray-200/50">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Phone size={12} className="text-gray-400"/> {orderDetailsData.phone || "N/A"}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 truncate" title={order.userEmail}>
                                            <Mail size={12} className="text-gray-400"/> {order.userEmail || "No Email"}
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Card */}
                                <div className="bg-gray-50 p-5 rounded-2xl /50">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><MapPin size={14}/> Shipping Address</h4>
                                    <div className="text-sm text-gray-600 leading-relaxed pl-1">
                                        <p className="text-gray-900 font-medium mb-1">{orderDetailsData.shippingAddress?.address}</p>
                                        <p>{orderDetailsData.shippingAddress?.city}, {orderDetailsData.shippingAddress?.state}</p>
                                        <p className="text-xs text-gray-400 mt-1 font-mono">{orderDetailsData.shippingAddress?.postalCode}</p>
                                    </div>
                                </div>

                                {/* Payment Card */}
                                <div className="bg-gray-50 p-5 rounded-2xl /50">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><CreditCard size={14}/> Payment Info</h4>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-2.5 bg-white rounded-xl  shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
                                            <span className="text-xs font-medium text-gray-500">Method</span>
                                            <span className="text-xs font-bold text-gray-900 uppercase">{orderDetailsData.paymentMode}</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Payment Status</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                {finalPaymentStatus}
                                            </span>
                                        </div>
                                    </div>

                                    {isEditable && (
                                        <button 
                                            onClick={() => handleCancelOrder(order)} 
                                            className="w-full mt-5 py-2 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                </div>

                            </div>
                        </div>

                    </div>
                  ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
                        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm font-medium">Failed to load details</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 text-center">
                <div className="p-4 bg-gray-50 rounded-full mb-3"><Search className="w-6 h-6 text-gray-400" /></div>
                <h3 className="text-lg font-bold text-gray-900">No orders found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTab;