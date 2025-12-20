import React, { useState, useRef, useEffect } from 'react';
import {
  Download, Search, Package, Truck, CheckCircle,
  ChevronDown, ChevronUp, User, MapPin, CreditCard, Phone, Mail,
  Box, Loader2, Check, Calendar, AlertCircle
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
        className={`flex items-center justify-between w-full sm:min-w-[140px] px-2 py-1.5 sm:px-3 sm:py-2 bg-white border rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 
        ${isOpen
            ? 'border-gray-200 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] text-black'
            : 'border-gray-100 hover:border-gray-200 text-gray-600 shadow-sm hover:shadow-md'}`}
      >
        <span className="truncate mr-2">{currentStatus}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-75 border border-gray-50">
          <div className="p-1">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => handleSelect(status)}
                className={`w-full text-left px-3 py-2 text-[10px] sm:text-xs font-medium flex items-center justify-between rounded-lg transition-colors ${currentStatus === status ? 'bg-gray-50 text-black font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
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
    // Using softer backgrounds and lighter text for badges
    const styles = {
      "Delivered": "bg-emerald-50/50 text-emerald-600 border-emerald-100/50",
      "Shipped": "bg-blue-50/50 text-blue-600 border-blue-100/50",
      "Processing": "bg-amber-50/50 text-amber-600 border-amber-100/50",
      "Order Cancelled": "bg-red-50/50 text-red-600 border-red-100/50",
      "Order Placed": "bg-gray-50/50 text-gray-600 border-gray-100/50",
    };
    return (
      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wide whitespace-nowrap ${styles[status] || styles["Order Placed"]}`}>
        {status}
      </span>
    );
  };

  const filteredOrders = orders?.filter((o) => {
    if (orderStatusTab === "All") return true;
    if (orderStatusTab === "Cancelled") return o.status === "Order Cancelled";
    if (orderStatusTab === "Payment Pending") {
      const orderStatus = (o.status || "").toLowerCase().trim();
      const pMode = (o.paymentMode || "").toUpperCase();
      const pStatus = (o.paymentStatus || "").toLowerCase().trim();

      // Condition A: Order Status must be 'payment_pending' or 'payment pending'
      const isOrderPending = orderStatus === "payment_pending" || orderStatus === "payment pending";

      // Condition B: Payment Mode must be Online (Not COD)
      const isOnline = !(pMode.includes("COD") || pMode.includes("CASH"));

      // Condition C: Payment Status must be 'pending'
      const isPaymentPending = pStatus === "pending";

      // RETURN TRUE ONLY IF ALL 3 MATCH
      return isOrderPending && isOnline && isPaymentPending;
    }
    return o.status === orderStatusTab;
  }).filter((o) => o.id.toString().includes(orderSearchQuery.trim()));

  return (
    <div className="space-y-6 p-4 sm:p-8 bg-[#F9FAFB] min-h-screen text-gray-900 font-sans w-full overflow-hidden">

      {/* --- Header --- */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 flex items-center">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-indigo-500" strokeWidth={2} />
            Order Management
          </h2>
          <p className="text-sm text-gray-400 mt-1 font-medium">Track and manage customer orders.</p>
        </div>
        <button
          onClick={() => downloadCSV(orders, 'orders.csv')}
          className="flex items-center px-4 py-2 bg-white text-gray-600 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md whitespace-nowrap"
        >
          <Download className="w-4 h-4 mr-2 text-gray-400" /> Export CSV
        </button>
      </div>

      {/* --- Filters --- */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1 max-w-[100vw]">
          {["All", "Payment Pending", "Order Placed", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setOrderStatusTab(status)}
              className={`px-4 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-300 border 
              ${orderStatusTab === status
                  ? "bg-black text-white border-black shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                  : "bg-white text-gray-500 border-transparent hover:bg-white hover:shadow-sm hover:text-gray-800"}`}
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
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-100 border border-transparent shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] text-sm transition-all placeholder:text-gray-300 text-gray-600"
          />
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
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
              // ULTRA SOFT BORDERS AND SHADOWS APPLIED HERE
              className={`bg-white rounded-2xl transition-all duration-300 group overflow-hidden
              ${isExpanded
                  ? 'shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] ring-0 border border-gray-100'
                  : 'border border-gray-100/50 hover:border-gray-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.04)]'}`}
            >

              {/* Main Summary Row */}
              <div
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => toggleOrderDetails(order.id)}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300
                    ${isExpanded ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                    <Package size={20} strokeWidth={1.5} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-gray-900 truncate">#{order.id}</h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-50 text-gray-400 border border-gray-100 whitespace-nowrap">
                        {order.orderItems?.length || 1} Items
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5 flex-wrap font-medium">
                      <Calendar size={12} className="text-gray-300" />
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span className="text-gray-200">•</span>
                      <span className="text-gray-900">₹{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap w-full md:w-auto mt-1 sm:mt-0">
                  <div className="flex-shrink-0">
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    {/* CUSTOM DROPDOWN */}
                    {isEditable && (
                      <div onClick={(e) => e.stopPropagation()} className="min-w-[120px] sm:min-w-[140px]">
                        <StatusDropdown
                          currentStatus={order.status}
                          onUpdate={(newStatus) => handleUpdateOrderStatus(order.id, newStatus)}
                        />
                      </div>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); toggleOrderDetails(order.id); }}
                      className={`p-2 rounded-xl transition-all duration-200 flex-shrink-0 border border-transparent 
                      ${isExpanded ? "bg-gray-100 text-black" : "text-gray-300 hover:bg-gray-50 hover:text-gray-600"}`}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* --- DROPDOWN DETAILS --- */}
              {isExpanded && (
                <div className="border-t border-gray-50 bg-gray-50/30 animate-in slide-in-from-top-1 duration-300 cursor-default pb-6 px-4 sm:px-8">

                  {loadingDetails ? (
                    <div className="py-12 flex flex-col justify-center items-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mb-3 text-gray-300" />
                      <span className="text-xs font-medium text-gray-400">Retrieving details...</span>
                    </div>
                  ) : orderDetailsData ? (
                    <div className="pt-8">

                      {/* 1. TIMELINE STEPPER */}
                      {order.status !== "Order Cancelled" && (
                        <div className="mb-10 pb-8 border-b border-gray-100 overflow-x-auto">
                          <div className="relative flex justify-between w-full min-w-[300px] max-w-3xl mx-auto px-2">
                            <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-100 -z-0 rounded-full"></div>
                            <div
                              className="absolute top-5 left-0 h-[2px] bg-black -z-0 transition-all duration-1000 ease-out rounded-full"
                              style={{ width: `${((progressStep - 1) / 3) * 100}%` }}
                            ></div>

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
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center border-[3px] transition-all duration-500 shadow-sm ${isCompleted
                                      ? "bg-black border-black text-white shadow-md"
                                      : "bg-white border-white text-gray-200"
                                      }`}
                                  >
                                    <Icon size={18} className={`${isCurrent ? 'animate-pulse' : ''}`} strokeWidth={isCompleted ? 2.5 : 2} />                                      </div>
                                  <span className={`text-[10px] mt-3 font-bold uppercase tracking-widest transition-colors ${isCompleted ? "text-black" : "text-gray-300"}`}>
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
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Items Ordered</h4>
                          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                            <div className="divide-y divide-gray-50">
                              {(orderDetailsData.orderItems || []).map((item, idx) => (
                                <div key={idx} className="p-5 flex items-center gap-4 hover:bg-[#fafafa] transition-colors group">
                                  <div className="w-14 h-14 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                                    <img src={item.img || "/fallback.png"} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-800 text-sm truncate">{item.productName}</div>
                                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                      <span className="bg-gray-50 px-2 py-0.5 rounded text-[10px] font-medium text-gray-500">{item.variantName}</span>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className="text-xs text-gray-300 mb-0.5 font-medium">₹{item.price} x {item.quantity}</div>
                                    <div className="font-bold text-gray-900 text-sm">₹{item.price * item.quantity}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="p-5 bg-gray-50/50 flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grand Total</span>
                              <span className="text-xl font-extrabold text-gray-900">₹{orderDetailsData.totalAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT: INFO SIDEBAR */}
                        <div className="w-full xl:w-80 space-y-5">

                          {/* Customer Card */}
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                            <h4 className="text-xs font-bold text-gray-300 uppercase mb-4 flex items-center gap-2"><User size={14} /> Customer</h4>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center font-bold text-sm">
                                {orderDetailsData.userName?.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-gray-900 text-sm truncate">{orderDetailsData.userName}</div>
                                <div className="text-xs text-gray-400">Registered User</div>
                              </div>
                            </div>
                            <div className="space-y-2 pt-3 border-t border-gray-50">
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <Phone size={12} className="text-gray-300" /> {orderDetailsData.phone || "N/A"}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 truncate" title={order.userEmail}>
                                <Mail size={12} className="text-gray-300" /> {order.userEmail || "No Email"}
                              </div>
                            </div>
                          </div>

                          {/* Shipping Card */}
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                            <h4 className="text-xs font-bold text-gray-300 uppercase mb-4 flex items-center gap-2"><MapPin size={14} /> Shipping</h4>
                            <div className="text-sm text-gray-500 leading-relaxed pl-1">
                              <p className="text-gray-900 font-medium mb-1">{orderDetailsData.shippingAddress?.address}</p>
                              <p className="text-xs">{orderDetailsData.shippingAddress?.city}, {orderDetailsData.shippingAddress?.state}</p>
                              <p className="text-xs text-gray-300 mt-1 font-mono">{orderDetailsData.shippingAddress?.postalCode}</p>
                            </div>
                          </div>

                          {/* Payment Card */}
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                            <h4 className="text-xs font-bold text-gray-300 uppercase mb-4 flex items-center gap-2"><CreditCard size={14} /> Payment</h4>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center p-2.5 bg-gray-50/50 rounded-xl">
                                <span className="text-xs font-medium text-gray-400">Method</span>
                                <span className="text-xs font-bold text-gray-800 uppercase">{orderDetailsData.paymentMode}</span>
                              </div>

                              <div className="flex justify-between items-center px-1">
                                <span className="text-xs text-gray-400">Status</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                  {finalPaymentStatus}
                                </span>
                              </div>
                            </div>

                            {isEditable && (
                              <button
                                onClick={() => handleCancelOrder(order)}
                                className="w-full mt-5 py-2 text-xs font-bold text-red-500 bg-red-50/50 border border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 transition duration-200"
                              >
                                Cancel Order
                              </button>
                            )}
                          </div>

                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-300">
                      <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium">Failed to load details</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center shadow-sm">
            <div className="p-4 bg-gray-50 rounded-full mb-3"><Search className="w-6 h-6 text-gray-300" /></div>
            <h3 className="text-lg font-bold text-gray-900">No orders found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTab;