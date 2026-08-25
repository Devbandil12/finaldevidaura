import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, MapPin, Package, CreditCard, Truck, Clock, ShieldAlert, StickyNote, Send, Undo2, Banknote } from 'lucide-react';
import moment from 'moment';
import { useAddOrderNote, useAdminInitiateReturn, useAdminInitiateRefund } from '../../hooks/useAdmin';

const OrderDrawer = ({ isOpen, onClose, orderId, orderDetailsData, loadingDetails, handleStatusChangeRequest, handleCancelOrder, handleReturnOrder }) => {
  const [newNote, setNewNote] = React.useState('');
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

  // Financial values from order and refunds
  const orderTotal = Number(orderDetailsData?.financialSummary?.orderTotal ?? ((orderDetailsData?.totalAmount || 0) + (orderDetailsData?.walletAmountUsed || 0)));
  const alreadyRefunded = Number(orderDetailsData?.financialSummary?.alreadyRefunded ?? (
    (orderDetailsData?.refunds || [])
      .filter(r => r.refundStatus === 'processed' || r.refundStatus === 'in_progress')
      .reduce((sum, r) => sum + (Number(r.displayAmount) || (Number(r.amount) / 100) || 0), 0)
  ));
  const remainingRefundable = Number(orderDetailsData?.financialSummary?.remainingRefundable ?? Math.max(0, orderTotal - alreadyRefunded));
  const canRefund = remainingRefundable > 0;

  // Reset UI when a new order is opened
  React.useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, orderId]);

  // Sync selected items sum to refundAmount
  const handleToggleRefundItem = (itemId, itemPrice) => {
    const nextSelected = { ...refundSelectedItems, [itemId]: !refundSelectedItems[itemId] };
    setRefundSelectedItems(nextSelected);

    // Sum selected items
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
      quantity: 1, // simplified for now, assuming 1 unit returns
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
      setNewNote('');
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[9999]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[var(--surface)] shadow-2xl z-[10000] flex flex-col overflow-hidden font-body"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[var(--text)]">Order #{orderId}</h2>
                <div className="text-sm text-[var(--sub)] mt-1">
                  {orderDetailsData ? moment(orderDetailsData.createdAt).format("MMMM D, YYYY h:mm A") : 'Loading...'}
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-[var(--surface-muted)] hover:bg-[var(--border)] rounded-full transition-colors text-[var(--text)]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {loadingDetails || !orderDetailsData ? (
                <div className="flex justify-center items-center h-48 text-[var(--sub)]">Loading order details...</div>
              ) : (
                <>
                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-[var(--brand)] text-[var(--surface)] text-xs font-bold rounded-full">{orderDetailsData.status}</span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">Payment: {orderDetailsData.paymentStatus}</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">Fulfillment: {orderDetailsData.fulfillmentStatus}</span>
                  </div>

                  {/* Customer & Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)] relative overflow-hidden">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--sub)] mb-3 flex items-center gap-2"><User size={14}/> Customer Intelligence</h3>
                      <p className="font-medium text-[var(--text)]">{orderDetailsData.userName || orderDetailsData.user?.name || "Guest"}</p>
                      <p className="text-sm text-[var(--sub)]">{orderDetailsData.user?.email || "No email"}</p>
                      <p className="text-sm text-[var(--sub)]">{orderDetailsData.address?.phone || orderDetailsData.userPhone}</p>
                      
                      {orderDetailsData.customerStats && (
                        <div className="mt-4 pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-2 text-xs">
                           <div>
                              <p className="text-[var(--muted)]">LTV</p>
                              <p className="font-bold text-[var(--text)]">₹{orderDetailsData.customerStats.ltv}</p>
                           </div>
                           <div>
                              <p className="text-[var(--muted)]">Orders</p>
                              <p className="font-bold text-[var(--text)]">{orderDetailsData.customerStats.totalOrders}</p>
                           </div>
                           <div>
                              <p className="text-[var(--muted)]">Returns</p>
                              <p className="font-bold text-[var(--text)]">{orderDetailsData.customerStats.returns}</p>
                           </div>
                           <div>
                              <p className="text-[var(--muted)]">COD Risk</p>
                              <p className={`font-bold ${orderDetailsData.customerStats.codRisk === 'HIGH' ? 'text-red-500' : 'text-green-500'}`}>{orderDetailsData.customerStats.codRisk}</p>
                           </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)]">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--sub)] mb-3 flex items-center gap-2"><MapPin size={14}/> Shipping Address</h3>
                      {orderDetailsData.address ? (
                        <p className="text-sm text-[var(--text)] leading-relaxed">
                          {orderDetailsData.address.addressLine1}<br/>
                          {orderDetailsData.address.addressLine2 && <>{orderDetailsData.address.addressLine2}<br/></>}
                          {orderDetailsData.address.city}, {orderDetailsData.address.state} - {orderDetailsData.address.pincode}
                        </p>
                      ) : <p className="text-sm text-[var(--sub)]">No address provided.</p>}
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--sub)] mb-3 flex items-center gap-2"><Package size={14}/> Order Items</h3>
                    <div className="space-y-3">
                      {orderDetailsData.orderItems?.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[var(--surface-muted)] rounded-md flex-shrink-0 overflow-hidden">
                                {item.img ? <img src={item.img} alt={item.productName} className="w-full h-full object-cover"/> : null}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-[var(--text)]">{item.productName}</p>
                              <p className="text-xs text-[var(--sub)]">Qty: {item.quantity} | Size: {item.size}</p>
                            </div>
                          </div>
                          <div className="font-bold text-[var(--brand)]">₹{item.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Center & Financials */}
                  <div className="p-5 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--sub)] flex items-center gap-2"><CreditCard size={14}/> Payment Center</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          orderDetailsData.paymentMode?.toLowerCase() === 'cod' ? 'bg-orange-100 text-orange-800' : 
                          orderDetailsData.paymentMode?.toLowerCase() === 'wallet' ? 'bg-purple-100 text-purple-800' : 
                          'bg-blue-100 text-blue-800'
                      }`}>
                          {orderDetailsData.paymentMode?.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-[var(--sub)]"><span>Subtotal:</span> <span>₹{orderDetailsData.totalAmount}</span></div>
                      {orderDetailsData.walletAmountUsed > 0 && (
                          <div className="flex justify-between text-[var(--sub)]"><span>Wallet Used:</span> <span className="text-[var(--error)]">-₹{orderDetailsData.walletAmountUsed}</span></div>
                      )}
                      {orderDetailsData.discount > 0 && (
                          <div className="flex justify-between text-[var(--sub)]"><span>Discount:</span> <span className="text-[var(--error)]">-₹{orderDetailsData.discount}</span></div>
                      )}
                      <div className="flex justify-between font-bold text-[var(--text)] text-base pt-2 border-t border-[var(--border)]">
                        <span>Customer Paid:</span> 
                        <span>₹{orderDetailsData.totalAmount - (orderDetailsData.walletAmountUsed || 0) - (orderDetailsData.discount || 0)}</span>
                      </div>
                      {orderDetailsData.paymentId && orderDetailsData.paymentMode !== 'cod' && (
                         <div className="pt-1 text-[11px] text-[var(--sub)] font-mono">Txn ID: {orderDetailsData.paymentId}</div>
                      )}
                    </div>

                    {/* Financial Actions (Refunds) */}
                    <div className="mt-5 pt-4 border-t border-[var(--border)]">
                        <div className="flex justify-between items-center mb-3">
                           <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--sub)] flex items-center gap-2"><Banknote size={14}/> Refunds & Adjustments</h4>
                           {!showRefundUI && (
                             <button 
                               onClick={() => setShowRefundUI(true)} 
                               disabled={!canRefund}
                               className="text-[10px] font-bold bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 rounded text-[var(--text)] hover:text-[var(--brand)] hover:border-[var(--brand)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                             >
                               {canRefund ? "Initiate Refund" : "Fully Refunded"}
                             </button>
                           )}
                        </div>

                        {/* Refund Calculation Summary Card */}
                        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg mb-3 text-xs space-y-1.5">
                          <div className="flex justify-between text-[var(--sub)]">
                            <span>Order Total:</span>
                            <span className="font-semibold text-[var(--text)]">₹{orderTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[var(--sub)]">
                            <span>Already Refunded:</span>
                            <span className={`font-semibold ${alreadyRefunded > 0 ? 'text-amber-600' : 'text-[var(--text)]'}`}>
                              ₹{alreadyRefunded.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold pt-1.5 border-t border-[var(--border)]">
                            <span className="text-[var(--text)]">Remaining Refundable:</span>
                            <span className={remainingRefundable > 0 ? "text-emerald-600 font-mono text-sm" : "text-[var(--muted)]"}>
                              ₹{remainingRefundable.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Refund Initiation Form */}
                        {showRefundUI && (
                           <div className="p-4 bg-[var(--surface)] border border-[var(--brand)] rounded-xl mb-4 space-y-4 shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">New Refund Request</span>
                                <button 
                                  onClick={() => {
                                    setRefundAmount(String(remainingRefundable));
                                    setRefundActionError('');
                                  }}
                                  className="text-[10px] font-semibold text-[var(--brand)] hover:underline"
                                >
                                  Max: ₹{remainingRefundable.toFixed(2)}
                                </button>
                              </div>

                              {/* Item-level refund context selector */}
                              {orderDetailsData.orderItems?.length > 0 && (
                                <div className="space-y-1.5 bg-[var(--surface-muted)] p-2.5 rounded-lg border border-[var(--border)]">
                                  <p className="text-[11px] font-bold text-[var(--sub)]">Link Order Item(s) (Optional):</p>
                                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                    {orderDetailsData.orderItems.map(item => {
                                      const itemId = item.id || item.orderItemId;
                                      const isChecked = !!refundSelectedItems[itemId];
                                      return (
                                        <label key={itemId} className="flex items-center justify-between p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded cursor-pointer hover:border-[var(--brand)] transition-colors">
                                          <div className="flex items-center gap-2">
                                            <input 
                                              type="checkbox" 
                                              checked={isChecked} 
                                              onChange={() => handleToggleRefundItem(itemId, item.price)} 
                                              className="accent-[var(--brand)] rounded"
                                            />
                                            <span className="text-xs text-[var(--text)] font-medium line-clamp-1">{item.productName} ({item.size})</span>
                                          </div>
                                          <span className="text-xs font-bold text-[var(--brand)] flex-shrink-0 ml-2">₹{item.price * (item.quantity || 1)}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Amount Input with Inline Validation */}
                              <div>
                                <label className="block text-[11px] font-bold text-[var(--sub)] mb-1">Refund Amount (₹)</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-sm text-[var(--sub)] font-bold">₹</span>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    min="1"
                                    max={remainingRefundable}
                                    placeholder={`1 - ${remainingRefundable}`}
                                    value={refundAmount} 
                                    onChange={e => {
                                      setRefundAmount(e.target.value);
                                      setRefundActionError('');
                                    }} 
                                    className={`w-full pl-7 pr-3 py-1.5 text-sm border rounded focus:outline-none bg-transparent ${
                                      Number(refundAmount) > remainingRefundable ? 'border-red-500 text-red-600' : 'border-[var(--border)] focus:border-[var(--brand)] text-[var(--text)]'
                                    }`}
                                  />
                                </div>
                                <p className="text-[10px] text-[var(--muted)] mt-1 flex justify-between">
                                  <span>Minimum: ₹1.00</span>
                                  <span>Maximum: ₹{remainingRefundable.toFixed(2)}</span>
                                </p>
                              </div>

                              {/* Preset Reason Selector */}
                              <div>
                                <label className="block text-[11px] font-bold text-[var(--sub)] mb-1">Reason for Refund <span className="text-red-500">*</span></label>
                                <select 
                                  value={refundReasonPreset} 
                                  onChange={e => setRefundReasonPreset(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs border border-[var(--border)] rounded focus:border-[var(--brand)] outline-none bg-[var(--surface)] text-[var(--text)]"
                                >
                                  <option value="Item returned">Item returned</option>
                                  <option value="Item unavailable">Item unavailable</option>
                                  <option value="Partial cancellation">Partial cancellation</option>
                                  <option value="Damaged product">Damaged product</option>
                                  <option value="Incorrect product">Incorrect product</option>
                                  <option value="Customer compensation">Customer compensation</option>
                                  <option value="Goodwill adjustment">Goodwill adjustment</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              {/* Notes / Additional Details */}
                              <div>
                                <label className="block text-[11px] font-bold text-[var(--sub)] mb-1">Additional Notes (Optional)</label>
                                <input 
                                  type="text" 
                                  placeholder="E.g., Customer reported defective bottle nozzle"
                                  value={refundReasonNotes} 
                                  onChange={e => setRefundReasonNotes(e.target.value)} 
                                  className="w-full px-3 py-1.5 text-xs border border-[var(--border)] rounded focus:border-[var(--brand)] outline-none bg-transparent text-[var(--text)]"
                                />
                              </div>

                              {/* Action Error Banner */}
                              {refundActionError && (
                                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs font-medium">
                                  ⚠️ {refundActionError}
                                </div>
                              )}

                              {/* Form Buttons */}
                              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                                <button 
                                  onClick={() => {
                                    setShowRefundUI(false);
                                    setRefundActionError('');
                                  }} 
                                  className="text-xs px-3 py-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={handleInitiateRefund} 
                                  disabled={refunding || !refundAmount || Number(refundAmount) <= 0 || Number(refundAmount) > remainingRefundable} 
                                  className="text-xs px-4 py-1.5 bg-[var(--brand)] text-[var(--surface)] rounded font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-sm"
                                >
                                  {refunding ? "Processing..." : `Confirm Refund (₹${Number(refundAmount || 0).toFixed(2)})`}
                                </button>
                              </div>
                           </div>
                        )}

                        {/* Refund History List */}
                        <div className="space-y-2">
                           <p className="text-[11px] font-bold text-[var(--sub)] uppercase tracking-wider">Refund History</p>
                           {orderDetailsData.refunds?.length > 0 ? (
                              <div className="space-y-2">
                                  {orderDetailsData.refunds.map(r => (
                                    <div key={r.id} className="p-2.5 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-xs flex justify-between items-center shadow-xs">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-[var(--text)] text-sm">
                                            ₹{r.displayAmount || (Number(r.amount) >= 100 ? (Number(r.amount) / 100).toFixed(2) : r.amount)}
                                          </span>
                                          <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase ${
                                            String(r.refundStatus).toLowerCase() === 'processed' ? 'bg-green-100 text-green-700 border border-green-200' : 
                                            String(r.refundStatus).toLowerCase() === 'failed' ? 'bg-red-100 text-red-700 border border-red-200' : 
                                            'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                          }`}>
                                            {r.refundStatus}
                                          </span>
                                        </div>
                                        {r.reason && <div className="text-[11px] text-[var(--sub)] mt-0.5">{r.reason}</div>}
                                        {r.createdAt && <div className="text-[10px] text-[var(--muted)] mt-0.5">{moment(r.createdAt).format('DD MMM YYYY, hh:mm A')}</div>}
                                      </div>
                                      {r.gatewayRefundId && (
                                        <div className="text-[10px] text-[var(--sub)] font-mono bg-[var(--surface-muted)] px-2 py-1 rounded border border-[var(--border)]">
                                          {r.gatewayRefundId}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                           ) : (
                              <p className="text-[11px] text-[var(--muted)] italic p-2 bg-[var(--surface)] border border-[var(--border)] rounded-md">
                                No refunds issued for this order.
                              </p>
                           )}
                        </div>
                    </div>
                  </div>

                  {/* Returns Center */}
                  <div className="p-5 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)]">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--sub)] flex items-center gap-2"><Undo2 size={14}/> Returns Center</h3>
                        {!showReturnUI && <button onClick={() => setShowReturnUI(true)} className="text-[10px] font-bold bg-[var(--surface)] border border-[var(--border)] px-2 py-1 rounded text-[var(--text)] hover:text-[var(--brand)]">Initiate Return</button>}
                     </div>

                     {showReturnUI && (
                         <div className="p-4 bg-[var(--surface)] border border-[var(--brand)] rounded-lg space-y-4">
                             <div>
                                 <p className="text-xs font-bold text-[var(--text)] mb-2">Select Items to Return:</p>
                                 <div className="space-y-2">
                                     {orderDetailsData.orderItems?.map(item => (
                                         <label key={item.id} className="flex items-center gap-3 p-2 border border-[var(--border)] rounded cursor-pointer hover:bg-[var(--surface-muted)]">
                                             <input type="checkbox" checked={!!returnItems[item.id]} onChange={e => setReturnItems({...returnItems, [item.id]: e.target.checked})} className="accent-[var(--brand)]" />
                                             <div className="flex-1 text-sm text-[var(--text)]">{item.productName} (Qty: {item.quantity})</div>
                                             <div className="text-sm font-bold text-[var(--sub)]">₹{item.price}</div>
                                         </label>
                                     ))}
                                 </div>
                             </div>
                             <div>
                                 <input type="text" placeholder="Reason for return..." value={returnReason} onChange={e => setReturnReason(e.target.value)} className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded focus:border-[var(--brand)] outline-none bg-transparent" />
                             </div>
                             <div className="flex justify-end gap-2">
                                  <button onClick={() => setShowReturnUI(false)} className="text-xs px-3 py-1.5 text-[var(--muted)] hover:text-[var(--text)] font-bold">Cancel</button>
                                  <button onClick={handleInitiateReturn} disabled={returning} className="text-xs px-4 py-1.5 bg-[var(--brand)] text-[var(--surface)] rounded font-bold disabled:opacity-50 shadow-sm">Submit Return</button>
                             </div>
                         </div>
                     )}

                     {!showReturnUI && (
                         <p className="text-[11px] text-[var(--muted)] italic">Manage returns securely through the new operations schema.</p>
                     )}
                  </div>

                  {/* Timeline */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--sub)] mb-4 flex items-center gap-2"><Clock size={14}/> Timeline</h3>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[var(--border)] before:via-[var(--border)] before:to-transparent">
                        {orderDetailsData.timeline?.map((event, index) => (
                            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-3 h-3 rounded-full border border-white bg-[var(--brand)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="font-bold text-[var(--text)] text-xs">{event.status}</div>
                                        <time className="text-[10px] font-medium text-[var(--sub)]">{moment(event.timestamp).format('MMM D, h:mm A')}</time>
                                    </div>
                                    <div className="text-[11px] text-[var(--sub)]">{event.message}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
                  {/* Internal Notes */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--sub)] mb-4 flex items-center gap-2"><StickyNote size={14}/> Internal Notes (Admin Only)</h3>
                    <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl space-y-4">
                        <div className="space-y-3 max-h-48 overflow-y-auto smooth-scrollbar pr-2">
                           {orderDetailsData.notes?.length > 0 ? orderDetailsData.notes.map(note => (
                               <div key={note.id} className="bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)] text-sm shadow-sm">
                                  <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold text-xs text-[var(--text)]">{note.admin?.name || 'Admin'}</span>
                                      <span className="text-[10px] text-[var(--muted)]">{moment(note.createdAt).fromNow()}</span>
                                  </div>
                                  <p className="text-[var(--sub)]">{note.note}</p>
                               </div>
                           )) : (
                               <p className="text-xs text-[var(--muted)] italic">No internal notes yet.</p>
                           )}
                        </div>
                        <div className="flex gap-2 relative">
                            <input 
                               type="text" 
                               value={newNote}
                               onChange={e => setNewNote(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                               placeholder="Add a note (e.g. Called customer, will ship Monday)..."
                               className="flex-1 text-sm px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--brand)] text-[var(--text)]"
                            />
                            <button 
                               onClick={handleAddNote}
                               disabled={addingNote || !newNote.trim()}
                               className="px-4 py-2.5 bg-[var(--brand)] text-[var(--surface)] rounded-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center"
                            >
                               <Send size={16} />
                            </button>
                        </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Footer Actions */}
            {orderDetailsData && (
              <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-muted)] flex justify-end gap-3">
                 <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-[var(--text)] hover:bg-[var(--surface)] rounded-lg border border-transparent hover:border-[var(--border)] transition-colors">Close</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OrderDrawer;
