import React, { useState } from 'react';
import {
  Download, Search, Package, Truck, 
  CheckSquare, Square, X, Filter
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { useUpdateBulkOrderStatus, usePreviewShipOrders, useShipOrders, useAdminOrders, useAdminOrdersRealtime } from '../../features/admin/hooks/useAdmin';
import { STATUS_SEQUENCE } from '../../features/admin/components/orders/StatusDropdown';
import OrderFilters from '../../features/admin/components/orders/OrderFilters';
import OrderSummaryKPIs from '../../features/admin/components/orders/OrderSummaryKPIs';
import ShipModal from '../../features/admin/components/orders/ShipModal';
import OrdersTable from '../../features/admin/components/orders/OrdersTable';
import OrderDrawer from '../../features/admin/components/orders/OrderDrawer';
import { getSingleOrderDetails } from '../../api/services/admin.api';

// --- MAIN COMPONENT ---
const OrdersTab = ({
  handleUpdateOrderStatus, handleCancelOrder, handleReturnOrder, downloadCSV
}) => {
  useAdminOrdersRealtime(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetailsData, setOrderDetailsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const { mutateAsync: updateBulkOrderStatus } = useUpdateBulkOrderStatus();
  const { mutateAsync: previewShipOrders } = usePreviewShipOrders();
  const { mutateAsync: shipOrders } = useShipOrders();

  const [shipModal, setShipModal] = useState({ open: false, loading: false, results: [], totalEstimate: 0, confirming: false });

  const getFiltersFromUrl = () => ({
    status: searchParams.get('status') || 'All',
    paymentStatus: searchParams.get('paymentStatus') || '',
    fulfillmentStatus: searchParams.get('fulfillmentStatus') || '',
    returnStatus: searchParams.get('returnStatus') || '',
    refundStatus: searchParams.get('refundStatus') || ''
  });

  const orderFilters = getFiltersFromUrl();
  const orderSearchQuery = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;

  const setOrderFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key] && newFilters[key] !== 'All') {
        params.set(key, newFilters[key]);
      } else {
        params.delete(key);
      }
    });
    params.set('page', '1');
    setSearchParams(params);
  };

  const setOrderSearchQuery = (query) => {
    const params = new URLSearchParams(searchParams);
    if (query) params.set('search', query);
    else params.delete('search');
    params.set('page', '1');
    setSearchParams(params);
  };

  const setPage = (updater) => {
    const newPage = typeof updater === 'function' ? updater(page) : updater;
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  // Extract requiresAttention flag if status is 'Requires Attention'
  const computedFilters = { ...orderFilters };
  if (computedFilters.status === 'Requires Attention') {
     computedFilters.requiresAttention = 'true';
     computedFilters.status = 'All'; // Don't filter by a status called 'Requires Attention'
  }

  const { data: ordersResponse, isLoading } = useAdminOrders(page, limit, orderSearchQuery, computedFilters);
  
  const orders = ordersResponse?.data || [];
  const meta = ordersResponse?.meta || { totalPages: 1, currentPage: 1 };
  
  const filteredOrders = orders;

  const handleStatusChangeRequest = (orderId, newStatus) => {
    handleUpdateOrderStatus(orderId, newStatus);
  };

  const handleBulkActionClick = (status) => {
    executeBulkUpdate(status);
  }

  const executeBulkUpdate = async (status) => {
    if (!window.confirm(`Update ${selectedOrders.size} orders to "${status}"?`)) return;
    const success = await updateBulkOrderStatus({ orderIds: Array.from(selectedOrders), status });
    if (success) {
      setSelectedOrders(new Set());
    }
  };

  const handleShipNowClick = async () => {
    setShipModal({ open: true, loading: true, results: [], totalEstimate: 0, confirming: false });
    const data = await previewShipOrders({ orderIds: Array.from(selectedOrders) });
    if (!data) {
      setShipModal({ open: false, loading: false, results: [], totalEstimate: 0, confirming: false });
      return;
    }
    setShipModal({ open: true, loading: false, results: data.results, totalEstimate: data.totalEstimate, confirming: false });
  };

  const handleConfirmShip = async () => {
    const shipRequests = shipModal.results
      .filter(r => !r.error)
      .map(r => ({ orderId: r.orderId, courierId: r.courierId }));
    if (shipRequests.length === 0) {
      setShipModal({ open: false, loading: false, results: [], totalEstimate: 0, confirming: false });
      return;
    }
    setShipModal(prev => ({ ...prev, confirming: true }));
    await shipOrders({ shipRequests });
    setShipModal({ open: false, loading: false, results: [], totalEstimate: 0, confirming: false });
    setSelectedOrders(new Set());
  };

  const isOrderSelectable = (order) => {
    const s = (order.status || "").toLowerCase();
    return s !== "delivered" && s !== "order cancelled" && !s.includes("return") && !s.includes("rto");
  };

  const selectableFilteredOrders = filteredOrders?.filter(isOrderSelectable) || [];

  const toggleSelectOrder = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) newSelected.delete(orderId);
    else newSelected.add(orderId);
    setSelectedOrders(newSelected);
  };

  const toggleSelectAll = () => {
    const allSelected = selectableFilteredOrders.length > 0 && selectableFilteredOrders.every(o => selectedOrders.has(o.id));
    if (allSelected) setSelectedOrders(new Set());
    else setSelectedOrders(new Set(selectableFilteredOrders.map(o => o.id)));
  };

  const isAllSelected = selectableFilteredOrders.length > 0 && selectableFilteredOrders.every(o => selectedOrders.has(o.id));

  const isSelectionEnabled = true; // Always enabled for bulk actions

  const currentTabIndex = STATUS_SEQUENCE.indexOf(orderFilters.status);
  const availableBulkActions = STATUS_SEQUENCE.filter((status, index) => {
      return index > currentTabIndex;
  });

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
      setOrderDetailsData(details);
    } catch (error) {
      console.error("Failed to load details", error);
      setOrderDetailsData(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[var(--bg)] min-h-screen font-body w-full overflow-hidden relative pb-24 animate-fadeIn transition-colors duration-300">

      {/* --- HEADER --- */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-[var(--border)] gap-5 bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)]">
        <div>
          <h2 className="font-display text-3xl font-medium text-[var(--text)] tracking-tight flex items-center">
            <Package className="w-7 h-7 mr-3 text-[var(--accent)]" strokeWidth={1.5} />
            Order Management
          </h2>
          <p className="font-display italic text-lg text-[var(--sub)] mt-2 tracking-wide">Track and manage customer fulfillment.</p>
        </div>
        <button
          onClick={() => downloadCSV(orders, 'orders.csv')}
          className="flex items-center px-6 py-3 bg-[var(--surface)] text-[var(--text)] rounded-lg border border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)] hover:text-[var(--brand)] transition-all font-body font-bold text-sm shadow-sm whitespace-nowrap"
        >
          <Download className="w-4 h-4 mr-2 text-[var(--muted)]" strokeWidth={2} /> Export CSV
        </button>
      </div>

      {/* --- COMMAND CENTER KPIs --- */}
      <OrderSummaryKPIs />

      {/* --- FILTERS --- */}
      <OrderFilters 
        orderFilters={orderFilters}
        setOrderFilters={setOrderFilters}
        orderSearchQuery={orderSearchQuery}
        setOrderSearchQuery={setOrderSearchQuery}
        setSelectedOrders={setSelectedOrders}
      />

      {/* Selection Info Bar */}
      {isSelectionEnabled && selectableFilteredOrders.length > 0 && (
        <div className="flex justify-between items-center px-2 py-1">
          <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 font-body text-[11px] uppercase tracking-widest font-bold text-[var(--sub)] hover:text-[var(--brand)] transition-colors cursor-pointer"
          >
              {isAllSelected ? (
                  <CheckSquare size={16} strokeWidth={2} className="text-[var(--brand)]" />
              ) : (
                  <Square size={16} strokeWidth={2} className="text-[var(--muted)]" />
              )}
              {selectedOrders.size > 0 ? `${selectedOrders.size} Selected` : "Select All"}
          </button>
        </div>
      )}

      {/* --- ORDERS LIST --- */}
      <div className="space-y-5">
        {filteredOrders?.length > 0 ? (
          <OrdersTable 
            orders={filteredOrders}
            selectedOrders={selectedOrders}
            toggleSelectOrder={toggleSelectOrder}
            toggleSelectAll={toggleSelectAll}
            isAllSelected={isAllSelected}
            isSelectionEnabled={isSelectionEnabled}
            toggleOrderDetails={toggleOrderDetails}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-[var(--surface)] rounded-2xl border border-[var(--border)] text-center shadow-[var(--shadow)]">
            <div className="p-5 bg-[var(--surface)] rounded-full mb-4 border border-[var(--border)] text-[var(--accent)]"><Search className="w-8 h-8" strokeWidth={1.5} /></div>
            <h3 className="font-display text-2xl font-medium text-[var(--text)]">No orders found</h3>
            <p className="font-display italic text-[var(--sub)] text-lg mt-2 tracking-wide">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-5 mt-10 font-body">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-5 py-2.5 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg disabled:opacity-40 hover:bg-[var(--surface)] hover:border-[var(--border)] hover:text-[var(--brand)] transition-all font-bold text-sm shadow-sm"
          >
            Previous
          </button>
          <span className="font-body text-[11px] uppercase tracking-widest font-bold text-[var(--muted)]">Page {meta.currentPage} of {meta.totalPages}</span>
          <button 
            disabled={page >= meta.totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="px-5 py-2.5 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg disabled:opacity-40 hover:bg-[var(--surface)] hover:border-[var(--border)] hover:text-[var(--brand)] transition-all font-bold text-sm shadow-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* FLOATING BULK ACTIONS BAR */}
      <AnimatePresence>
        {selectedOrders.size > 0 && (
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-strong)] rounded-full px-6 py-3.5 flex items-center gap-5 z-[99999]"
            >
                <span className="font-body font-bold text-[var(--text)] text-[11px] uppercase tracking-widest">{selectedOrders.size} Selected</span>
                <div className="h-5 w-px bg-[var(--border)]"></div>
                
                <div className="flex gap-2.5">
                    {(() => {
                        const shippableCount = Array.from(selectedOrders).filter(id => {
                            const o = orders.find(ord => ord.id === id);
                            return o?.shiprocketShipmentId && !o?.shiprocketAwb;
                        }).length;
                        return (
                            <button
                                onClick={handleShipNowClick}
                                disabled={shippableCount === 0}
                                title={shippableCount === 0 ? "None of the selected orders are ready to ship" : ""}
                                className={`px-5 py-2 rounded-full font-body text-xs font-bold transition-all flex items-center gap-2 ${
                                    shippableCount === 0
                                        ? 'bg-[var(--surface-muted)] text-[var(--muted)] cursor-not-allowed border border-transparent'
                                        : 'bg-[var(--success)] text-[var(--surface)] hover:brightness-110 shadow-md border border-[var(--success)]'
                                }`}
                            >
                                <Truck size={14} strokeWidth={2} /> Ship Now {shippableCount > 0 ? `(${shippableCount})` : ''}
                            </button>
                        );
                    })()}
                    {availableBulkActions.map(status => {
                        const requiresAwb = ["Shipped", "Out for Delivery", "Delivered"];
                        const isBulkActionDisabled = requiresAwb.includes(status) && !Array.from(selectedOrders).every(id => {
                            const o = orders.find(ord => ord.id === id);
                            return !!o?.shiprocketAwb;
                        });

                        return (
                            <button
                                key={status}
                                onClick={() => !isBulkActionDisabled && handleBulkActionClick(status)}
                                disabled={isBulkActionDisabled}
                                title={isBulkActionDisabled ? "Orders require a Shiprocket AWB" : ""}
                                className={`px-5 py-2 rounded-full font-body text-xs font-bold transition-all ${
                                    isBulkActionDisabled 
                                    ? 'bg-[var(--surface-muted)] text-[var(--muted)] cursor-not-allowed border border-transparent' 
                                    : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--brand)] hover:text-[var(--surface)] border border-[var(--border)] hover:shadow-md'
                                }`}
                            >
                                Mark {status}
                            </button>
                        );
                    })}
                </div>

                <button 
                    onClick={() => setSelectedOrders(new Set())}
                    className="ml-2 p-2 rounded-full hover:bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--error)] transition-colors"
                >
                    <X size={18} strokeWidth={2} />
                </button>
            </motion.div>
        )}
      </AnimatePresence>

      <ShipModal 
        shipModal={shipModal} 
        setShipModal={setShipModal} 
        handleConfirmShip={handleConfirmShip} 
      />

      <OrderDrawer 
        isOpen={expandedOrderId !== null}
        onClose={() => toggleOrderDetails(expandedOrderId)}
        orderId={expandedOrderId}
        orderDetailsData={orderDetailsData}
        loadingDetails={loadingDetails}
        handleStatusChangeRequest={handleStatusChangeRequest}
        handleCancelOrder={handleCancelOrder}
        handleReturnOrder={handleReturnOrder}
      />
    </div>
  );
};

export default OrdersTab;