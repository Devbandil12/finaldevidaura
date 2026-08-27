import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, X, Loader2, AlertCircle } from 'lucide-react';

const ShipModal = ({ shipModal, setShipModal, handleConfirmShip }) => {
  return (
    <AnimatePresence>
      {shipModal.open && (
        <motion.div
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[999999] bg-[var(--overlay-light)] backdrop-blur-md flex items-center justify-center px-4 font-body"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-[var(--surface)] rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.15)] w-full max-w-lg ring-1 ring-[var(--border)]/40 dark:ring-[var(--border)]/60 overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-[var(--border)]/30 dark:border-[var(--border)]/60 flex items-center justify-between bg-[var(--surface)]">
              <h3 className="font-display text-xl sm:text-2xl font-medium text-[var(--text)] flex items-center gap-3 tracking-tight">
                <Truck size={20} strokeWidth={1.5} className="text-[var(--brand)]" /> 
                Dispatch Review
              </h3>
              <button 
                onClick={() => setShipModal({ open: false, loading: false, results: [], totalEstimate: 0, confirming: false })} 
                className="p-1.5 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors ring-1 ring-transparent hover:ring-[var(--border)]/40 shadow-sm"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar bg-[var(--bg)] flex-1">
              {shipModal.loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-[var(--muted)]">
                  <Loader2 className="animate-spin text-[var(--brand)] mb-4" size={28} strokeWidth={1.5} />
                  <span className="font-body text-[10px] font-bold uppercase tracking-widest">Querying Logistics...</span>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {shipModal.results.map(r => (
                    <div key={r.orderId} className="flex items-center justify-between bg-[var(--surface)] p-4 rounded-xl ring-1 ring-[var(--border)]/30 dark:ring-[var(--border)]/60 shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <p className="font-body font-bold text-[var(--text)] text-sm tracking-tight">Identifier #{r.orderId}</p>
                        {r.error ? (
                          <p className="font-body text-[10px] font-bold text-[var(--error)] mt-1 flex items-center gap-1.5">
                            <AlertCircle size={10} strokeWidth={2.5} /> {r.error}
                          </p>
                        ) : (
                          <p className="font-body text-[9px] font-bold text-[var(--sub)] mt-1 uppercase tracking-widest">
                            {r.courierName} <span className="mx-1 text-[var(--border)]/60">•</span> {r.estimatedDays} SLA
                          </p>
                        )}
                      </div>
                      {!r.error && (
                        <p className="font-body font-medium text-base sm:text-lg text-[var(--text)] tracking-tight">
                          ₹{r.estimatedRate}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 sm:px-8 py-5 border-t border-[var(--border)]/30 dark:border-[var(--border)]/60 flex items-center justify-between bg-[var(--surface)]">
              <div>
                <p className="font-body text-[9px] uppercase tracking-widest font-bold text-[var(--muted)] mb-0.5">Est. Expenditure</p>
                <p className="font-body text-xl sm:text-2xl font-medium text-[var(--text)] tracking-tight">₹{shipModal.totalEstimate}</p>
              </div>
              <button
                onClick={handleConfirmShip}
                disabled={shipModal.loading || shipModal.confirming || shipModal.results.every(r => r.error)}
                className="px-6 py-3 rounded-xl bg-[var(--text)] hover:bg-[var(--brand)] text-[var(--surface)] text-[10px] uppercase tracking-widest font-body font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {shipModal.confirming ? <Loader2 className="animate-spin" size={14} strokeWidth={2.5} /> : null}
                {shipModal.confirming ? "Authorizing..." : "Commit Dispatch"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShipModal;