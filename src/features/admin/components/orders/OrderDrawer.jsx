import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, MapPin, Package, CreditCard, Truck, Clock, ShieldAlert, StickyNote, Send, Undo2, Banknote } from 'lucide-react';
import moment from 'moment';
import { useAddOrderNote, useAdminInitiateReturn, useAdminInitiateRefund } from '../../hooks/useAdmin';

const OrderDrawer = ({ isOpen, onClose, orderId, orderDetailsData, loadingDetails, handleStatusChangeRequest, handleCancelOrder, handleReturnOrder }) => {
  const [newNote, ReactSetNewNote] = React.useState('');
  const { mutateAsync: addNote, isPending: addingNote } = useAddOrderNote();
  const { mutateAsync: initiateReturn, isPending: returning } = useAdminInitiateReturn();
  const { mutateAsync: initiateRefund, isPending: refunding } = useAdminInitiateRefund();

  const [returnItems, setReturnItems] = React.useState({});
  const [returnReason, setReturnReason] = React.useState('');
  const [showReturnUI, setShowReturnUI] = React.useState(false);

  const [refundAmount, setRefundAmount] = React.useState('');
  const [refundReasonPreset, setRefundReasonPreset] = React.useState('Item returned');
  const [refundReasonNotes, setRefundReasonNotes] = React.useState('');
  const [refundSelectedItems, setRefundSelectedItems] = React.useState({});
  const [showRefundUI, setShowRefundUI] = React.useState(false);
  const [refundActionError, setRefundActionError] = React.useState('');

  const orderTotal = Number(orderDetailsData?.financialSummary?.orderTotal ?? ((orderDetailsData?.totalAmount || 0) + (orderDetailsData?.walletAmountUsed || 0)));
  const alreadyRefunded = Number(orderDetailsData?.financialSummary?.alreadyRefunded ?? (
    (orderDetailsData?.refunds || [])
      .filter(r => r.refundStatus === 'processed' || r.refundStatus === 'in_progress')
      .reduce((sum, r) => sum + (Number(r.displayAmount) || (Number(r.amount) / 100) || 0), 0)
  ));
  const remainingRefundable = Number(orderDetailsData?.financialSummary?.remainingRefundable ?? Math.max(0, orderTotal - alreadyRefunded));
  const canRefund = remainingRefundable > 0;

  // Lock background scroll when drawer is open.
  //
  // This admin layout does NOT scroll <body> — the real scroll container is
  // the <main> content pane in Adminpanel.jsx, marked with
  // `data-lenis-prevent` (that attribute means a global Lenis smooth-scroll
  // instance is deliberately excluded from it so it scrolls natively).
  // Freezing <body> therefore does nothing to it, and manually messing with
  // <body>'s position also risks fighting Lenis's own scroll bookkeeping —
  // which is what caused scrolling to behave oddly / stop partway.
  //
  // Instead, find that actual scroll container and lock IT directly.
  React.useEffect(() => {
    const scrollContainer = document.querySelector('[data-lenis-prevent]');

    if (isOpen) {
      if (scrollContainer) {
        scrollContainer.dataset.prevOverflow = scrollContainer.style.overflow || '';
        scrollContainer.style.overflow = 'hidden';
      } else {
        // Fallback, in case this component is ever reused outside this layout.
        document.body.style.overflow = 'hidden';
      }

      setShowReturnUI(false);
      setShowRefundUI(false);
      setReturnItems({});
      setReturnReason('');
      setRefundAmount('');
      setRefundReasonPreset('Item returned');
      setRefundReasonNotes('');
      setRefundSelectedItems({});
      setRefundActionError('');
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.style.overflow = scrollContainer.dataset.prevOverflow || '';
        delete scrollContainer.dataset.prevOverflow;
      } else {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, orderId]);

  const handleToggleRefundItem = (itemId, itemPrice) => {
    const nextSelected = { ...refundSelectedItems, [itemId]: !refundSelectedItems[itemId] };
    setRefundSelectedItems(nextSelected);

    const selectedSum = (orderDetailsData?.orderItems || [])
      .filter(item => nextSelected[item.id || item.orderItemId])
      .reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);

    if (selectedSum > 0) {
      const capped = Math.min(selectedSum, remainingRefundable);
      setRefundAmount(String(capped));
    }
  };

  const handleInitiateReturn = async () => {
    const items = Object.keys(returnItems).filter(k => returnItems[k]).map(id => ({
      orderItemId: id,
      quantity: 1, 
      condition: 'Unknown'
    }));
    if (items.length === 0 || !returnReason) return alert("Select items and reason");
    
    await initiateReturn({ orderId, payload: { reason: returnReason, adminNotes: '', items, version: orderDetailsData?.version } });
    setShowReturnUI(false);
  };

  const handleInitiateRefund = async () => {
    setRefundActionError('');
    const parsedAmt = Number(refundAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setRefundActionError("Please enter a valid refund amount greater than ₹0.");
      return;
    }
    if (parsedAmt > remainingRefundable) {
      setRefundActionError(`Maximum refundable amount is ₹${remainingRefundable.toFixed(2)}.`);
      return;
    }

    const fullReason = `${refundReasonPreset}${refundReasonNotes.trim() ? `: ${refundReasonNotes.trim()}` : ''}`;

    try {
      await initiateRefund({
        orderId,
        payload: {
          amount: parsedAmt,
          reason: fullReason,
          version: orderDetailsData?.version
        }
      });
      setShowRefundUI(false);
      setRefundAmount('');
      setRefundReasonNotes('');
      setRefundSelectedItems({});
    } catch (err) {
      setRefundActionError(err.response?.data?.error || err.message || "Failed to process refund");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addNote({ orderId, note: newNote });
      ReactSetNewNote('');
    } catch (e) {
      console.error(e);
    }
  };
  
  // Rendered via a portal straight into document.body.
  //
  // Adminpanel.jsx wraps each tab's content in a motion.div that animates
  // `filter` (blur) on tab change. Framer Motion leaves that `filter` as an
  // inline style even at rest (blur(0px)), and ANY ancestor with `filter` set
  // creates a new containing block for `position: fixed` descendants — it
  // makes them behave like `position: absolute` relative to that ancestor
  // instead of the real viewport. Since OrderDrawer lives inside that
  // filtered wrapper, its "fixed" panel wasn't actually escaping to the
  // viewport, which is why it rendered starting from the top of that content
  // pane (behind/under the sticky navbar) instead of cleanly below it.
  // Portaling to document.body sidesteps the filtered ancestor entirely.
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={onClose}
            className="fixed left-0 right-0 bottom-0 top-20 bg-[var(--overlay-light)] backdrop-blur-md z-[9999]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 bottom-0 top-20 w-full max-w-2xl bg-[var(--surface)] shadow-[0_24px_80px_rgba(0,0,0,0.15)] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 z-[10000] flex flex-col overflow-hidden font-body"
          >
            {/* Header — matches Adminpanel.jsx's top navbar styling */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-6 bg-[var(--surface)] border-b border-[var(--border)]/30 z-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
              <div>
                <h2 className="font-display text-2xl font-medium text-[var(--text)] tracking-tight">Order Profile</h2>
                <div className="text-xs text-[var(--muted)] mt-1.5 tracking-wide flex items-center gap-2">
                  {orderDetailsData ? (
                    <>
                      <span className="font-body font-medium text-[var(--text)]">#{orderId}</span>
                      <span className="w-1 h-1 rounded-full bg-[var(--border)]/60"></span>
                      <span className="font-body font-medium text-[var(--sub)]">{moment(orderDetailsData.createdAt).format("MMM D, YYYY • h:mm A")}</span>
                    </>
                  ) : 'Retrieving Data...'}
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 bg-[var(--surface-muted)]/50 hover:bg-[var(--surface-muted)] rounded-xl transition-all duration-300 text-[var(--text)] ring-1 ring-[var(--border)]/40 hover:ring-[var(--border)]/80 shadow-sm"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Scrollable Content with Invisible Scrollbar.
                data-lenis-prevent stops a global Lenis smooth-scroll instance
                (see Adminpanel.jsx) from hijacking scroll events that occur
                inside this fixed-position panel, which otherwise causes
                scrolling here to stall or redirect to the page behind it. */}
            <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overscroll-contain">
              {loadingDetails || !orderDetailsData ? (
                <div className="flex justify-center items-center h-48 text-[var(--sub)] font-body text-[10px] uppercase tracking-widest font-bold animate-pulse">Loading Architecture...</div>
              ) : (
                <>
                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2.5">
                    <span className="px-3 py-1 bg-[var(--surface)] text-[var(--text)] ring-1 ring-[var(--brand)]/40 text-[10px] uppercase tracking-widest font-bold rounded-lg shadow-sm">{orderDetailsData.status}</span>
                    <span className="px-3 py-1 bg-[var(--surface)] text-[var(--warning)] ring-1 ring-[var(--warning)]/40 text-[10px] uppercase tracking-widest font-bold rounded-lg shadow-sm">Pay: {orderDetailsData.paymentStatus}</span>
                    <span className="px-3 py-1 bg-[var(--surface)] text-[var(--accent)] ring-1 ring-[var(--accent)]/40 text-[10px] uppercase tracking-widest font-bold rounded-lg shadow-sm">Fulf: {orderDetailsData.fulfillmentStatus}</span>
                  </div>

                  {/* Customer & Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    <div className="p-5 sm:p-6 bg-[var(--surface)] rounded-[1.5rem] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition-shadow">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--sub)] mb-4 flex items-center gap-2"><User size={14}/> Customer Intelligence</h3>
                      <p className="font-body font-medium text-base text-[var(--text)] truncate tracking-tight">{orderDetailsData.userName || orderDetailsData.user?.name || "Guest Checkout"}</p>
                      <p className="font-body text-xs text-[var(--muted)] font-medium mt-1 truncate">{orderDetailsData.user?.email || "No email"}</p>
                      <p className="font-body text-xs text-[var(--muted)] font-medium mt-1 truncate">{orderDetailsData.address?.phone || orderDetailsData.userPhone}</p>
                      
                      {orderDetailsData.customerStats && (
                        <div className="mt-5 pt-5 border-t border-[var(--border)]/30 dark:border-[var(--border)]/50 grid grid-cols-2 gap-y-4 gap-x-3 text-xs">
                           <div>
                              <p className="text-[var(--muted)] uppercase tracking-widest text-[9px] font-bold mb-1">LTV</p>
                              <p className="font-body font-medium text-[var(--text)]">₹{orderDetailsData.customerStats.ltv}</p>
                           </div>
                           <div>
                              <p className="text-[var(--muted)] uppercase tracking-widest text-[9px] font-bold mb-1">Orders</p>
                              <p className="font-body font-medium text-[var(--text)]">{orderDetailsData.customerStats.totalOrders}</p>
                           </div>
                           <div>
                              <p className="text-[var(--muted)] uppercase tracking-widest text-[9px] font-bold mb-1">Returns</p>
                              <p className="font-body font-medium text-[var(--text)]">{orderDetailsData.customerStats.returns}</p>
                           </div>
                           <div>
                              <p className="text-[var(--muted)] uppercase tracking-widest text-[9px] font-bold mb-1">Risk</p>
                              <p className={`font-body font-medium ${orderDetailsData.customerStats.codRisk === 'HIGH' ? 'text-[var(--error)]' : 'text-[var(--success)]'}`}>{orderDetailsData.customerStats.codRisk}</p>
                           </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 sm:p-6 bg-[var(--surface)] rounded-[1.5rem] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition-shadow">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--sub)] mb-4 flex items-center gap-2"><MapPin size={14}/> Routing Destination</h3>
                      {orderDetailsData.address ? (
                        <p className="text-sm font-body text-[var(--text)] font-medium leading-relaxed">
                          {orderDetailsData.address.addressLine1}<br/>
                          {orderDetailsData.address.addressLine2 && <>{orderDetailsData.address.addressLine2}<br/></>}
                          {orderDetailsData.address.city}, {orderDetailsData.address.state} <br/>
                          <span className="block mt-3 text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest">
                            {orderDetailsData.address.postalCode}
                          </span>
                        </p>
                      ) : <p className="text-xs font-body font-medium text-[var(--sub)]">No routing data available.</p>}
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--sub)] mb-4 flex items-center gap-2"><Package size={14}/> Consignment Items</h3>
                    <div className="space-y-3">
                      {(orderDetailsData.orderItems || orderDetailsData.items || []).length > 0 ? (
                        (orderDetailsData.orderItems || orderDetailsData.items || []).map((item, idx) => (
                          <div key={item.id || idx} className="flex items-center justify-between p-4 ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 rounded-[1.25rem] bg-[var(--surface)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-[var(--surface-muted)]/30 rounded-xl flex-shrink-0 overflow-hidden ring-1 ring-[var(--border)]/40">
                                  <img src={item.img || "/fallback.png"} alt={item.productName || "Product"} className="w-full h-full object-cover"/>
                              </div>
                              <div>
                                <p className="font-body font-medium text-sm text-[var(--text)] tracking-tight truncate max-w-[200px] sm:max-w-[280px]">{item.productName || item.product?.name || "Product"}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="font-body text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Qty: {item.quantity || 1}</p>
                                  <span className="w-1 h-1 rounded-full bg-[var(--border)]/60"></span>
                                  <p className="font-body text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{item.size || item.variantName || 'Standard'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="font-body font-medium text-base text-[var(--text)] tracking-tight">₹{(Number(item.price) || 0).toLocaleString()}</div>
                          </div>
                        ))
                      ) : (
                        <p className="font-body text-xs font-medium text-[var(--sub)] py-2">No consignment items recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Center & Financials */}
                  <div className="p-5 sm:p-6 bg-[var(--surface)] rounded-[1.5rem] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition-all">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--sub)] flex items-center gap-2"><CreditCard size={14}/> Financials</h3>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ring-1 ${
                          orderDetailsData.paymentMode?.toLowerCase() === 'cod' ? 'bg-orange-50 text-orange-800 ring-orange-200' : 
                          orderDetailsData.paymentMode?.toLowerCase() === 'wallet' ? 'bg-purple-50 text-purple-800 ring-purple-200' : 
                          'bg-[var(--success)]/10 text-[var(--success)] ring-[var(--success)]/30'
                      }`}>
                          {orderDetailsData.paymentMode}
                      </span>
                    </div>

                    <div className="space-y-3 font-body text-xs font-medium">
                      <div className="flex justify-between text-[var(--sub)]"><span>Subtotal</span> <span className="text-[var(--text)]">₹{Number(orderDetailsData.totalAmount || 0).toLocaleString()}</span></div>
                      {orderDetailsData.walletAmountUsed > 0 && (
                          <div className="flex justify-between text-[var(--sub)]"><span>Wallet Allocation</span> <span className="text-[var(--error)]">-₹{Number(orderDetailsData.walletAmountUsed).toLocaleString()}</span></div>
                      )}
                      {orderDetailsData.discount > 0 && (
                          <div className="flex justify-between text-[var(--sub)]"><span>Applied Discount</span> <span className="text-[var(--error)]">-₹{Number(orderDetailsData.discount).toLocaleString()}</span></div>
                      )}
                      <div className="flex justify-between font-body font-medium text-[var(--text)] text-base pt-4 mt-2 border-t border-[var(--border)]/30 dark:border-[var(--border)]/60">
                        <span>Net Collected</span> 
                        <span className="tracking-tight">₹{(Number(orderDetailsData.totalAmount) - (Number(orderDetailsData.walletAmountUsed) || 0) - (Number(orderDetailsData.discount) || 0)).toLocaleString()}</span>
                      </div>
                      {orderDetailsData.paymentId && orderDetailsData.paymentMode !== 'cod' && (
                         <div className="pt-2 text-[10px] text-[var(--muted)] font-mono uppercase tracking-widest">Ref: {orderDetailsData.paymentId}</div>
                      )}
                    </div>

                    {/* Financial Actions (Refunds) */}
                    <div className="mt-8 pt-6 border-t border-[var(--border)]/30 dark:border-[var(--border)]/60">
                        <div className="flex justify-between items-center mb-5">
                           <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--sub)] flex items-center gap-2"><Banknote size={14}/> Adjustments</h4>
                           {!showRefundUI && (
                             <button 
                               onClick={() => setShowRefundUI(true)} 
                               disabled={!canRefund}
                               className="text-[10px] uppercase tracking-widest font-bold bg-[var(--surface)] ring-1 ring-[var(--border)]/50 px-3 py-1.5 rounded-lg text-[var(--text)] hover:text-[var(--brand)] hover:ring-[var(--brand)]/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                             >
                               {canRefund ? "Issue Refund" : "Fully Refunded"}
                             </button>
                           )}
                        </div>

                        {/* Refund Calculation Summary Card */}
                        <div className="p-4 bg-[var(--surface-muted)]/20 ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/50 rounded-xl mb-5 font-body text-xs font-medium space-y-2.5">
                          <div className="flex justify-between text-[var(--sub)]">
                            <span>Gross Value</span>
                            <span className="text-[var(--text)]">₹{orderTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[var(--sub)]">
                            <span>Disbursed</span>
                            <span className={`${alreadyRefunded > 0 ? 'text-[var(--warning)]' : 'text-[var(--text)]'}`}>
                              ₹{alreadyRefunded.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between font-body font-medium pt-3 mt-1 border-t border-[var(--border)]/30 dark:border-[var(--border)]/60">
                            <span className="text-[var(--text)]">Eligible Balance</span>
                            <span className={remainingRefundable > 0 ? "text-[var(--success)] tracking-tight text-sm" : "text-[var(--muted)]"}>
                              ₹{remainingRefundable.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Refund Initiation Form */}
                        <AnimatePresence>
                          {showRefundUI && (
                             <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-5 bg-[var(--surface)] ring-1 ring-[var(--brand)]/30 rounded-[1.5rem] mb-6 space-y-5 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
                                <div className="flex justify-between items-center">
                                  <span className="font-body text-[10px] font-bold text-[var(--text)] uppercase tracking-widest">Refund Parameters</span>
                                  <button 
                                    onClick={() => {
                                      setRefundAmount(String(remainingRefundable));
                                      setRefundActionError('');
                                    }}
                                    className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--brand)] hover:underline"
                                  >
                                    Set Max (₹{remainingRefundable.toFixed(2)})
                                  </button>
                                </div>

                                {/* Item-level refund context selector */}
                                {orderDetailsData.orderItems?.length > 0 && (
                                  <div className="space-y-3 bg-[var(--surface-muted)]/20 p-4 rounded-[1.25rem] ring-1 ring-[var(--border)]/30">
                                    <p className="font-body text-[10px] font-bold uppercase tracking-widest text-[var(--sub)]">Link Assets (Optional)</p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                      {orderDetailsData.orderItems.map(item => {
                                        const itemId = item.id || item.orderItemId;
                                        const isChecked = !!refundSelectedItems[itemId];
                                        return (
                                          <label key={itemId} className="flex items-center justify-between p-3 bg-[var(--surface)] ring-1 ring-[var(--border)]/40 rounded-xl cursor-pointer hover:ring-[var(--brand)]/50 transition-colors shadow-sm">
                                            <div className="flex items-center gap-3">
                                              <input 
                                                type="checkbox" 
                                                checked={isChecked} 
                                                onChange={() => handleToggleRefundItem(itemId, item.price)} 
                                                className="accent-[var(--brand)] rounded w-4 h-4"
                                              />
                                              <span className="font-body text-xs font-medium text-[var(--text)] line-clamp-1">{item.productName} <span className="text-[10px] text-[var(--muted)]">({item.size})</span></span>
                                            </div>
                                            <span className="font-body text-[11px] font-medium text-[var(--brand)] flex-shrink-0 ml-3">₹{Number(item.price * (item.quantity || 1)).toLocaleString()}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Amount Input */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block font-body text-[10px] font-bold uppercase tracking-widest text-[var(--sub)] mb-2">Value (₹)</label>
                                    <input 
                                      type="number" step="0.01" min="1" max={remainingRefundable} placeholder={`Max: ${remainingRefundable}`}
                                      value={refundAmount} 
                                      onChange={e => { setRefundAmount(e.target.value); setRefundActionError(''); }} 
                                      className={`w-full px-4 py-2.5 font-body text-sm font-medium bg-[var(--surface)] rounded-xl outline-none ring-1 transition-all shadow-sm ${Number(refundAmount) > remainingRefundable ? 'ring-[var(--error)] text-[var(--error)]' : 'ring-[var(--border)]/40 dark:ring-[var(--border)]/60 focus:ring-[var(--brand)]/50 text-[var(--text)]'}`}
                                    />
                                  </div>

                                  {/* Preset Reason Selector */}
                                  <div>
                                    <label className="block font-body text-[10px] font-bold uppercase tracking-widest text-[var(--sub)] mb-2">Category <span className="text-[var(--error)]">*</span></label>
                                    <select 
                                      value={refundReasonPreset} 
                                      onChange={e => setRefundReasonPreset(e.target.value)}
                                      className="w-full px-4 py-2.5 font-body text-xs font-medium bg-[var(--surface)] ring-1 ring-[var(--border)]/40 dark:ring-[var(--border)]/60 rounded-xl outline-none focus:ring-[var(--brand)]/50 text-[var(--text)] shadow-sm appearance-none cursor-pointer"
                                    >
                                      <option value="Item returned">Returned</option>
                                      <option value="Item unavailable">Unavailable</option>
                                      <option value="Partial cancellation">Partial Cancel</option>
                                      <option value="Damaged product">Damaged</option>
                                      <option value="Incorrect product">Incorrect</option>
                                      <option value="Customer compensation">Compensation</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Notes / Additional Details */}
                                <div>
                                  <label className="block font-body text-[10px] font-bold uppercase tracking-widest text-[var(--sub)] mb-2">Context</label>
                                  <input 
                                    type="text" 
                                    placeholder="Internal memo..."
                                    value={refundReasonNotes} 
                                    onChange={e => setRefundReasonNotes(e.target.value)} 
                                    className="w-full px-4 py-2.5 font-body text-xs font-medium bg-[var(--surface)] ring-1 ring-[var(--border)]/40 dark:ring-[var(--border)]/60 rounded-xl outline-none focus:ring-[var(--brand)]/50 text-[var(--text)] shadow-sm placeholder-[var(--muted)]"
                                  />
                                </div>

                                {/* Action Error Banner */}
                                {refundActionError && (
                                  <div className="p-3 bg-[var(--error)]/10 ring-1 ring-[var(--error)]/30 rounded-xl text-[var(--error)] font-body text-[10px] font-bold uppercase tracking-widest">
                                    ⚠️ {refundActionError}
                                  </div>
                                )}

                                {/* Form Buttons */}
                                <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-[var(--border)]/20">
                                  <button 
                                    onClick={() => { setShowRefundUI(false); setRefundActionError(''); }} 
                                    className="font-body text-[10px] font-bold uppercase tracking-widest px-4 py-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                                  >
                                    Abort
                                  </button>
                                  <button 
                                    onClick={handleInitiateRefund} 
                                    disabled={refunding || !refundAmount || Number(refundAmount) <= 0 || Number(refundAmount) > remainingRefundable} 
                                    className="font-body text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 bg-[var(--text)] hover:bg-[var(--brand)] text-[var(--surface)] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                  >
                                    {refunding ? "Authorizing..." : `Commit ₹${Number(refundAmount || 0).toFixed(2)}`}
                                  </button>
                                </div>
                             </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Refund History List */}
                        <div className="space-y-3 mt-5">
                           <p className="font-body text-[10px] font-bold text-[var(--sub)] uppercase tracking-widest">Ledger</p>
                           {orderDetailsData.refunds?.length > 0 ? (
                              <div className="space-y-3">
                                  {orderDetailsData.refunds.map(r => (
                                    <div key={r.id} className="p-4 ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 rounded-[1.25rem] bg-[var(--surface)] flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                                      <div>
                                        <div className="flex items-center gap-3 mb-1.5">
                                          <span className="font-body font-medium text-[var(--text)] text-sm tracking-tight">
                                            ₹{Number(r.displayAmount || (Number(r.amount) >= 100 ? (Number(r.amount) / 100).toFixed(2) : r.amount)).toLocaleString()}
                                          </span>
                                          <span className={`px-2 py-0.5 font-body text-[9px] rounded-md uppercase tracking-widest font-bold ring-1 ${
                                            String(r.refundStatus).toLowerCase() === 'processed' ? 'bg-[var(--success)]/10 text-[var(--success)] ring-[var(--success)]/30' : 
                                            String(r.refundStatus).toLowerCase() === 'failed' ? 'bg-[var(--error)]/10 text-[var(--error)] ring-[var(--error)]/30' : 
                                            'bg-[var(--warning)]/10 text-[var(--warning)] ring-[var(--warning)]/30'
                                          }`}>
                                            {r.refundStatus}
                                          </span>
                                        </div>
                                        {r.reason && <div className="font-body text-xs font-medium text-[var(--sub)]">{r.reason}</div>}
                                        {r.createdAt && <div className="font-body text-[10px] font-medium text-[var(--muted)] mt-1">{moment(r.createdAt).format('DD MMM YYYY, hh:mm A')}</div>}
                                      </div>
                                      {r.gatewayRefundId && (
                                        <div className="font-body text-[9px] text-[var(--sub)] font-medium bg-[var(--surface-muted)]/50 px-2.5 py-1.5 rounded-lg ring-1 ring-[var(--border)]/40 uppercase tracking-widest">
                                          Ref: {r.gatewayRefundId.slice(-8)}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                           ) : (
                              <p className="font-body text-[11px] font-medium text-[var(--muted)] px-4 py-3 bg-[var(--surface)] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 rounded-xl shadow-sm">
                                No ledger entries.
                              </p>
                           )}
                        </div>
                    </div>
                  </div>

                  {/* Returns Center */}
                  <div className="p-5 sm:p-6 bg-[var(--surface)] rounded-[1.5rem] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition-all">
                     <div className="flex justify-between items-center mb-5">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--sub)] flex items-center gap-2"><Undo2 size={14}/> Reverse Logistics</h3>
                        {!showReturnUI && <button onClick={() => setShowReturnUI(true)} className="font-body text-[10px] font-bold uppercase tracking-widest bg-[var(--surface)] ring-1 ring-[var(--border)]/50 px-3 py-1.5 rounded-lg text-[var(--text)] hover:bg-[var(--surface-muted)]/50 transition-colors shadow-sm">Initiate RMA</button>}
                     </div>

                     <AnimatePresence>
                     {showReturnUI && (
                         <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-5 bg-[var(--surface)] ring-1 ring-[var(--brand)]/40 rounded-[1.5rem] space-y-5 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
                             <div>
                                 <p className="font-body text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-3">Select Target Assets</p>
                                 <div data-lenis-prevent className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                     {(orderDetailsData.orderItems || orderDetailsData.items || []).map(item => (
                                         <label key={item.id} className="flex items-center gap-4 p-3.5 ring-1 ring-[var(--border)]/40 dark:ring-[var(--border)]/60 rounded-xl cursor-pointer hover:bg-[var(--surface-muted)]/30 transition-colors bg-[var(--surface)] shadow-sm">
                                             <input type="checkbox" checked={!!returnItems[item.id]} onChange={e => setReturnItems({...returnItems, [item.id]: e.target.checked})} className="accent-[var(--brand)] w-4 h-4" />
                                             <div className="flex-1 font-body text-xs font-medium text-[var(--text)] truncate">{item.productName || item.product?.name} <span className="text-[10px] text-[var(--muted)] ml-1">(Qty: {item.quantity})</span></div>
                                             <div className="font-body text-sm font-medium text-[var(--text)] tracking-tight shrink-0">₹{Number(item.price).toLocaleString()}</div>
                                         </label>
                                     ))}
                                 </div>
                             </div>
                             <div>
                                 <input type="text" placeholder="RMA Reason..." value={returnReason} onChange={e => setReturnReason(e.target.value)} className="w-full px-4 py-2.5 font-body text-sm font-medium bg-[var(--surface)] ring-1 ring-[var(--border)]/40 dark:ring-[var(--border)]/60 rounded-xl focus:ring-[var(--brand)]/50 outline-none shadow-sm placeholder-[var(--muted)] text-[var(--text)] transition-all" />
                             </div>
                             <div className="flex justify-end gap-3 pt-3">
                                  <button onClick={() => setShowReturnUI(false)} className="font-body text-[10px] uppercase tracking-widest px-4 py-2 text-[var(--muted)] hover:text-[var(--text)] font-bold transition-colors">Abort</button>
                                  <button onClick={handleInitiateReturn} disabled={returning} className="font-body text-[10px] uppercase tracking-widest px-5 py-2.5 bg-[var(--brand)] text-[var(--surface)] rounded-xl font-bold disabled:opacity-50 shadow-sm hover:brightness-110 transition-all">Submit RMA</button>
                             </div>
                         </motion.div>
                     )}
                     </AnimatePresence>

                     {!showReturnUI && (
                         <p className="font-body text-[11px] font-medium text-[var(--muted)]">Manage reverse logistics securely through ops schema.</p>
                     )}
                  </div>

                  {/* Timeline */}
                  <div>
                    <h3 className="font-body text-[10px] font-bold uppercase tracking-widest text-[var(--sub)] mb-6 flex items-center gap-2"><Clock size={14}/> Event Log</h3>
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[7px] before:-translate-x-px before:h-full before:w-px before:bg-gradient-to-b before:from-[var(--border)]/50 before:via-[var(--border)]/30 before:to-transparent">
                        {orderDetailsData.timeline?.map((event, index) => (
                            <div key={index} className="relative flex items-start gap-5 group">
                                <div className="w-3.5 h-3.5 rounded-full ring-[3px] ring-[var(--surface)] bg-[var(--brand)] shadow-sm shrink-0 mt-1.5 z-10"></div>
                                <div className="flex-1 min-w-0 bg-[var(--surface)] p-4 sm:p-5 rounded-[1.25rem] ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                        <div className="font-body font-bold text-[var(--text)] text-sm tracking-tight">{event.status}</div>
                                        <time className="font-body text-[10px] font-medium text-[var(--muted)] uppercase tracking-widest">{moment(event.timestamp).format('MMM D, h:mm A')}</time>
                                    </div>
                                    <div className="font-body text-xs font-medium text-[var(--sub)] leading-relaxed">{event.message}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <div>
                    <h3 className="font-body text-[10px] font-bold uppercase tracking-widest text-[var(--sub)] mb-4 flex items-center gap-2"><StickyNote size={14}/> Internal Telemetry</h3>
                    <div className="p-5 sm:p-6 bg-yellow-50/50 dark:bg-yellow-900/10 ring-1 ring-yellow-200/50 dark:ring-yellow-900/30 rounded-[1.5rem] space-y-5 shadow-inner">
                        <div data-lenis-prevent className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                           {orderDetailsData.notes?.length > 0 ? orderDetailsData.notes.map(note => (
                               <div key={note.id} className="bg-[var(--surface)] p-4 rounded-xl ring-1 ring-[var(--border)]/30 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="font-body font-bold text-[11px] uppercase tracking-widest text-[var(--text)]">{note.admin?.name || 'System Admin'}</span>
                                      <span className="font-body text-[10px] font-medium text-[var(--muted)]">{moment(note.createdAt).fromNow()}</span>
                                  </div>
                                  <p className="font-body text-xs font-medium text-[var(--sub)] leading-relaxed">{note.note}</p>
                               </div>
                           )) : (
                               <p className="font-body text-[11px] font-medium text-[var(--muted)]">No internal telemetry recorded.</p>
                           )}
                        </div>
                        <div className="flex gap-3 relative pt-3">
                            <input 
                               type="text" 
                               value={newNote}
                               onChange={e => ReactSetNewNote(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                               placeholder="Append telemetry..."
                               className="flex-1 font-body text-sm font-medium px-5 py-3 bg-[var(--surface)] ring-1 ring-[var(--border)]/40 dark:ring-[var(--border)]/60 rounded-xl outline-none focus:ring-[var(--brand)]/50 text-[var(--text)] shadow-sm placeholder-[var(--muted)] transition-all"
                            />
                            <button 
                               onClick={handleAddNote}
                               disabled={addingNote || !newNote.trim()}
                               className="px-5 py-3 bg-[var(--text)] text-[var(--surface)] rounded-xl hover:bg-[var(--brand)] disabled:opacity-50 transition-all flex items-center justify-center shadow-sm"
                            >
                               <Send size={16} />
                            </button>
                        </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default OrderDrawer;