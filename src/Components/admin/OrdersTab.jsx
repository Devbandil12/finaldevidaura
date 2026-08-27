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

  const computedFilters = { ...orderFilters };
  if (computedFilters.status === 'Requires Attention') {
     computedFilters.requiresAttention = 'true';
     computedFilters.status = 'All'; 
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

  const isSelectionEnabled = true;

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
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 bg-[var(--bg)] min-h-screen font-body w-full overflow-hidden relative pb-28 animate-fadeIn transition-colors duration-500">

      {/* --- HEADER --- */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 bg-[var(--surface)] py-5 px-6 sm:px-8 rounded-[1.5rem] sm:rounded-[2rem] border border-[var(--border)]/30 dark:border-[var(--border)]/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-500"
      >
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-medium text-[var(--text)] tracking-tight flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--surface-muted)]/50 border border-[var(--border)]/40 dark:border-[var(--border)]/60 text-[var(--brand)] shadow-sm">
              <Package size={18} className="sm:w-5 sm:h-5" strokeWidth={1.5} />
            </div>
            Order Operations
          </h2>
          <p className="font-body text-[10px] sm:text-[11px] text-[var(--muted)] mt-1.5 sm:mt-2 tracking-wide">Monitor fulfillment, payments, and shipments.</p>
        </div>
        <button
          onClick={() => downloadCSV(orders, 'orders.csv')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--surface)] text-[var(--text)] rounded-xl border border-[var(--border)]/50 dark:border-[var(--border)]/60 hover:bg-[var(--surface-muted)]/50 hover:text-[var(--brand)] transition-all font-body font-bold text-[10px] sm:text-[11px] uppercase tracking-widest shadow-sm whitespace-nowrap shrink-0"
        >
          <Download size={14} strokeWidth={2} /> Export CSV
        </button>
      </motion.div>

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
        <div className="flex justify-between items-center px-3 py-1 mb-2">
          <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2.5 font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
              {isAllSelected ? (
                  <CheckSquare size={16} strokeWidth={2.5} className="text-[var(--brand)]" />
              ) : (
                  <Square size={16} strokeWidth={2.5} className="text-[var(--muted)]" />
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 sm:py-32 bg-[var(--surface)] rounded-[2rem] border border-[var(--border)]/30 dark:border-[var(--border)]/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] text-center"
          >
            <div className="p-4 bg-[var(--surface-muted)]/50 rounded-2xl mb-4 border border-[var(--border)]/40 text-[var(--muted)] shadow-sm">
              <Search size={28} strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-lg sm:text-xl font-medium text-[var(--text)] tracking-tight">No orders match criteria</h3>
            <p className="font-body text-[11px] text-[var(--sub)] mt-1.5 tracking-wide">Adjust filters or search query to find records.</p>
          </motion.div>
        )}
      </div>

      {/* Pagination Controls */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 mt-10 font-body">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-5 py-2.5 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]/40 dark:border-[var(--border)]/60 rounded-xl disabled:opacity-40 hover:bg-[var(--surface-muted)]/50 transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm"
          >
            Prev
          </button>
          <span className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)]">Page {meta.currentPage} of {meta.totalPages}</span>
          <button 
            disabled={page >= meta.totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="px-5 py-2.5 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]/40 dark:border-[var(--border)]/60 rounded-xl disabled:opacity-40 hover:bg-[var(--surface-muted)]/50 transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* FLOATING BULK ACTIONS BAR */}
      <AnimatePresence>
        {selectedOrders.size > 0 && (
            <motion.div
                initial={{ y: 100, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 100, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border)]/50 dark:border-[var(--border)]/70 shadow-[0_16px_40px_rgba(0,0,0,0.12)] rounded-[1.5rem] p-2.5 flex items-center gap-3 z-[99999]"
            >
                <div className="px-4 font-body font-bold text-[var(--text)] text-[10px] uppercase tracking-widest whitespace-nowrap">
                  {selectedOrders.size} Selected
                </div>
                <div className="h-6 w-px bg-[var(--border)]/50"></div>
                
                <div className="flex gap-2 items-center overflow-x-auto smooth-scrollbar px-2">
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
                                className={`px-4 py-2 rounded-xl font-body text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                                    shippableCount === 0
                                        ? 'bg-[var(--surface-muted)]/50 text-[var(--muted)] cursor-not-allowed'
                                        : 'bg-[var(--text)] text-[var(--surface)] hover:bg-[var(--brand)] shadow-sm'
                                }`}
                            >
                                <Truck size={14} strokeWidth={2.5} /> Ship Now {shippableCount > 0 ? `(${shippableCount})` : ''}
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
                                className={`px-4 py-2 rounded-xl font-body text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${
                                    isBulkActionDisabled 
                                    ? 'bg-transparent text-[var(--muted)]/50 cursor-not-allowed' 
                                    : 'bg-[var(--surface)] text-[var(--sub)] hover:bg-[var(--surface-muted)] border border-[var(--border)]/50 shadow-sm'
                                }`}
                            >
                                Mark {status}
                            </button>
                        );
                    })}
                </div>

                <button 
                    onClick={() => setSelectedOrders(new Set())}
                    className="p-2 ml-1 rounded-xl bg-[var(--surface-muted)]/50 hover:bg-[var(--error)]/10 text-[var(--muted)] hover:text-[var(--error)] transition-colors shrink-0"
                >
                    <X size={16} strokeWidth={2.5} />
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