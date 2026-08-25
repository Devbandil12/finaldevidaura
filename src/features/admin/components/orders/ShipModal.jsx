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
          className="fixed inset-0 z-[999999] bg-[var(--overlay-light)] backdrop-blur-md flex items-center justify-center px-4 font-body"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-[var(--surface)] rounded-3xl shadow-[var(--shadow-strong)] w-full max-w-lg border border-[var(--border)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 md:px-8 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
              <h3 className="font-display text-2xl font-medium text-[var(--text)] flex items-center gap-3 tracking-tight">
                <Truck size={24} strokeWidth={1.5} className="text-[var(--accent)]" /> 
                Ship Now — Review
              </h3>
              <button 
                onClick={() => setShipModal({ open: false, loading: false, results: [], totalEstimate: 0, confirming: false })} 
                className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-muted)] transition-colors"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-6 md:px-8 py-6 custom-scrollbar bg-[var(--bg)] flex-1">
              {shipModal.loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-[var(--muted)]">
                  <Loader2 className="animate-spin text-[var(--brand)] mb-4" size={32} strokeWidth={1.5} />
                  <span className="font-display italic text-lg tracking-wide">Fetching courier rates...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {shipModal.results.map(r => (
                    <div key={r.orderId} className="flex items-center justify-between bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-[var(--shadow)]">
                      <div>
                        <p className="font-body font-bold text-[var(--text)] text-sm tracking-wide">Order #{r.orderId}</p>
                        {r.error ? (
                          <p className="font-body text-[11px] font-bold text-[var(--error)] mt-1 flex items-center gap-1.5">
                            <AlertCircle size={12} strokeWidth={2.5} /> {r.error}
                          </p>
                        ) : (
                          <p className="font-body text-[10px] font-bold text-[var(--sub)] mt-1 uppercase tracking-widest">
                            {r.courierName} <span className="mx-1 text-[var(--border)]">•</span> {r.estimatedDays} day(s)
                          </p>
                        )}
                      </div>
                      {!r.error && (
                        <p className="font-body font-bold text-lg text-[var(--text)] tracking-tight">
                          ₹{r.estimatedRate}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 md:px-8 py-6 border-t border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
              <div>
                <p className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] mb-1">Estimated Total</p>
                <p className="font-body text-3xl font-bold text-[var(--text)] tracking-tight">₹{shipModal.totalEstimate}</p>
              </div>
              <button
                onClick={handleConfirmShip}
                disabled={shipModal.loading || shipModal.confirming || shipModal.results.every(r => r.error)}
                className="px-8 py-3.5 rounded-xl bg-[var(--brand)] hover:brightness-110 text-[var(--bg)] text-sm font-body font-bold transition-all shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] disabled:opacity-50 flex items-center gap-2 button-hero"
              >
                {shipModal.confirming ? <Loader2 className="animate-spin" size={16} strokeWidth={2.5} /> : null}
                {shipModal.confirming ? "Processing..." : "Confirm & Ship"}
                {!shipModal.loading && !shipModal.confirming && !shipModal.results.every(r => r.error) && (
                  <div className="pulse border-[#F5F1E8]"></div>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShipModal;