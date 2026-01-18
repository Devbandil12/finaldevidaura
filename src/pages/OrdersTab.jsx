import React, { useState, useRef, useEffect } from 'react';
import {
  Download, Search, Package, Truck, CheckCircle,
  ChevronDown, ChevronUp, User, MapPin, CreditCard, Phone, Mail,
  Box, Loader2, Check, Calendar, AlertCircle, CheckSquare, Square, X
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from '../contexts/AdminContext';

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
  
  // State for bulk selection
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const { updateBulkOrderStatus } = useAdmin(); 

  // --- Helper: Check if order is selectable ---
  const isOrderSelectable = (order) => {
    const s = (order.status || "").toLowerCase();
    return s !== "delivered" && s !== "order cancelled";
  };

  // --- Helper: Status Timeline Steps ---
  const getProgressStep = (status) => {
    if (status === 'pending_payment') return 0;
    const steps = ["Order Placed", "Processing", "Shipped", "Delivered"];
    const index = steps.indexOf(status);
    return index === -1 ? 0 : index + 1;
  };

  // --- Helper: Calculate Price Breakdown ---
  const calculateBreakdown = (orderData) => {
    if (!orderData) return null;
    
    const subtotal = (orderData.orderItems || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = (orderData.discountAmount || 0) + (orderData.offerDiscount || 0);
    const wallet = orderData.walletAmountUsed || 0;
    const total = orderData.totalAmount || 0;
    
    // Reverse calculate delivery to match Grand Total exactly
    // Formula: Total = Sub - Disc - Wallet + Delivery
    // So: Delivery = Total - Sub + Disc + Wallet
    const delivery = Math.max(0, total - subtotal + discount + wallet);

    return { subtotal, discount, wallet, delivery, total };
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
    const normalizedStatus = (status || "").toLowerCase();

    const styles = {
      "delivered": "bg-emerald-50/50 text-emerald-600 border-emerald-100/50",
      "shipped": "bg-blue-50/50 text-blue-600 border-blue-100/50",
      "processing": "bg-amber-50/50 text-amber-600 border-amber-100/50",
      "order cancelled": "bg-red-50/50 text-red-600 border-red-100/50",
      "order placed": "bg-gray-50/50 text-gray-600 border-gray-100/50",
      "pending_payment": "bg-orange-50 text-orange-600 border-orange-100",
      "payment_pending": "bg-orange-50 text-orange-600 border-orange-100",
    };

    let styleClass = styles["order placed"];
    if (styles[normalizedStatus]) {
      styleClass = styles[normalizedStatus];
    } else if (normalizedStatus.includes('pending')) {
       styleClass = styles["pending_payment"];
    }

    return (
      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wide whitespace-nowrap ${styleClass}`}>
        {status?.replace(/_/g, " ")}
      </span>
    );
  };

  const filteredOrders = orders?.filter((o) => {
    // 1. All Filter
    if (orderStatusTab === "All") return true;
    // 2. Cancelled Filter
    if (orderStatusTab === "Cancelled") return o.status === "Order Cancelled";
    // 3. Payment Pending Filter
    if (orderStatusTab === "Payment Pending") {
      const status = (o.status || "").toLowerCase();
      const pMode = (o.paymentMode || "").toLowerCase();
      const pStatus = (o.paymentStatus || "").toLowerCase();
      const matchesStatus = status.includes("pending") && status.includes("payment"); 
      const isOnline = !pMode.includes("cod") && !pMode.includes("cash");
      const isNotPaid = !pStatus.includes("paid") && !pStatus.includes("success") && !pStatus.includes("captured");
      return matchesStatus && isOnline && isNotPaid;
    }
    // 4. Standard Status Filter
    return o.status === orderStatusTab;
  }).filter((o) => o.id.toString().includes(orderSearchQuery.trim()));

  const selectableFilteredOrders = filteredOrders?.filter(isOrderSelectable) || [];

  // Bulk Selection Logic
  const toggleSelectOrder = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleSelectAll = () => {
    const allSelected = selectableFilteredOrders.length > 0 && selectableFilteredOrders.every(o => selectedOrders.has(o.id));
    if (allSelected) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(selectableFilteredOrders.map(o => o.id)));
    }
  };

  const executeBulkUpdate = async (status) => {
    if (!window.confirm(`Update ${selectedOrders.size} orders to "${status}"?`)) return;
    const success = await updateBulkOrderStatus(Array.from(selectedOrders), status);
    if (success) {
      setSelectedOrders(new Set());
    }
  };

  const isAllSelected = selectableFilteredOrders.length > 0 && selectableFilteredOrders.every(o => selectedOrders.has(o.id));

  return (
    <div className="space-y-6 p-4 sm:p-8 bg-[#F9FAFB] min-h-screen text-gray-900 w-full overflow-hidden relative pb-24">

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
              onClick={() => { setOrderStatusTab(status); setSelectedOrders(new Set()); }}
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

      {/* Selection Info Bar */}
      {selectableFilteredOrders.length > 0 && (
        <div className="flex justify-between items-center px-1">
          <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
          >
              {isAllSelected ? (
                  <CheckSquare size={18} className="text-indigo-600" />
              ) : (
                  <Square size={18} />
              )}
              {selectedOrders.size > 0 ? `${selectedOrders.size} Selected` : "Select All"}
          </button>
        </div>
      )}

      {/* --- Orders List --- */}
      <div className="space-y-4">
        {filteredOrders?.length > 0 ? filteredOrders.map((order, idx) => {

          const isEditable = order.status !== "Order Cancelled" && order.status !== "Delivered";
          const isExpanded = expandedOrderId === order.id;
          const progressStep = getProgressStep(order.status);
          const isSelected = selectedOrders.has(order.id);
          const canSelect = isOrderSelectable(order);

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

          // Calculate Breakdown if expanded
          const breakdown = orderDetailsData && isExpanded ? calculateBreakdown(orderDetailsData) : null;

          return (
            <div
              key={order.id}
              style={{ zIndex: 1000 - idx, position: 'relative' }}
              className={`bg-white rounded-2xl transition-all duration-300 group overflow-hidden border
              ${isSelected 
                  ? 'border-indigo-500 shadow-md bg-indigo-50/10' 
                  : isExpanded
                    ? 'shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] ring-0 border-gray-100'
                    : 'border-gray-100/50 hover:border-gray-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.04)]'
              }`}
            >

              {/* Main Summary Row */}
              <div
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => toggleOrderDetails(order.id)}
              >
                <div className="flex items-center gap-5">
                  {/* Selection Checkbox */}
                  {canSelect ? (
                    <div 
                      onClick={(e) => { e.stopPropagation(); toggleSelectOrder(order.id); }} 
                      className="cursor-pointer text-gray-300 hover:text-indigo-600 transition-colors"
                    >
                        {isSelected ? <CheckSquare size={24} className="text-indigo-600" /> : <Square size={24} />}
                    </div>
                  ) : (
                    <div className="w-6" /> 
                  )}

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
                      {order.status !== "Order Cancelled" && order.status !== "pending_payment" && (
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
                      
                      {/* Warning for Pending Payment */}
                      {order.status === "pending_payment" && (
                          <div className="mb-8 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-3 text-orange-700 text-sm">
                              <AlertCircle size={20} />
                              <span className="font-semibold">This order is awaiting payment. Do not process until status changes to "Order Placed".</span>
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

                            {/* PRICE BREAKDOWN SECTION */}
                            <div className="p-5 bg-gray-50/30 space-y-2 border-t border-gray-50">
                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Subtotal</span>
                                <span>₹{breakdown.subtotal.toLocaleString()}</span>
                              </div>
                              
                              {breakdown.discount > 0 && (
                                <div className="flex justify-between items-center text-xs text-emerald-600">
                                  <span>Discount {orderDetailsData.couponCode && `(${orderDetailsData.couponCode})`}</span>
                                  <span>-₹{breakdown.discount.toLocaleString()}</span>
                                </div>
                              )}

                              {breakdown.wallet > 0 && (
                                <div className="flex justify-between items-center text-xs text-indigo-600">
                                  <span>Wallet Used</span>
                                  <span>-₹{breakdown.wallet.toLocaleString()}</span>
                                </div>
                              )}

                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Delivery</span>
                                <span>{breakdown.delivery === 0 ? "Free" : `₹${breakdown.delivery}`}</span>
                              </div>
                            </div>

                            {/* Grand Total */}
                            <div className="p-5 bg-gray-100/50 flex justify-between items-center border-t border-gray-100">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grand Total</span>
                              <span className="text-xl font-extrabold text-gray-900">₹{breakdown.total.toLocaleString()}</span>
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

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedOrders.size > 0 && (
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-[99999]"
            >
                <span className="font-bold text-gray-800 text-sm">{selectedOrders.size} Orders Selected</span>
                <div className="h-6 w-px bg-gray-200"></div>
                
                <div className="flex gap-2">
                    {["Processing", "Shipped", "Delivered"].map(status => (
                        <button
                            key={status}
                            onClick={() => executeBulkUpdate(status)}
                            className="px-4 py-2 rounded-full text-xs font-bold bg-gray-100 hover:bg-black hover:text-white transition-all"
                        >
                            Mark {status}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => setSelectedOrders(new Set())}
                    className="ml-2 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500"
                >
                    <X size={16} />
                </button>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default OrdersTab;