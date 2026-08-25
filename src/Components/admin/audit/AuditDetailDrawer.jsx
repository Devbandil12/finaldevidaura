import React from 'react';
import { X, Clock, ShieldAlert, User, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuditChanges from './AuditChanges';

const AuditDetailDrawer = ({ log, isOpen, onClose }) => {
  if (!log) return null;

  const date = new Date(log.createdAt);
  const statusColor = log.status === 'SUCCESS' ? 'text-[var(--success)] bg-[var(--success-soft)]' 
                    : log.status === 'DENIED' ? 'text-[var(--error)] bg-[var(--error-soft)]' 
                    : 'text-[var(--warning)] bg-[var(--warning-soft)]';
                    
  const severityColor = log.severity === 'CRITICAL' ? 'text-[var(--error)] bg-[var(--error-soft)] border-[var(--error)]'
                      : log.severity === 'HIGH' ? 'text-[var(--warning)] bg-[var(--warning-soft)] border-[var(--warning)]'
                      : log.severity === 'WARNING' ? 'text-[var(--brand)] bg-[var(--accent-soft)] border-[var(--brand)]'
                      : 'text-[var(--text)] bg-[var(--surface)] border-[var(--border)]';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl z-50 overflow-y-auto flex flex-col font-body"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--surface)]">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-display font-bold text-[var(--text)]">Audit Log Details</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${severityColor}`}>
                    {log.severity}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${statusColor}`}>
                    {log.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--sub)]">ID: {log.id}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8 flex-1">
              
              {/* Top Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Action</p>
                  <p className="font-bold text-[var(--text)]">{log.action}</p>
                  <p className="text-xs text-[var(--sub)] mt-1">{log.category}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Timestamp</p>
                  <div className="flex items-center gap-1.5 font-bold text-[var(--text)]">
                    <Clock size={14} className="text-[var(--sub)]" />
                    {date.toLocaleDateString()} {date.toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Description</h3>
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <p className="text-sm font-medium text-[var(--text)]">{log.description}</p>
                </div>
              </div>

              {/* Actor & Resource */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Actor</h3>
                  <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--surface-muted)] flex items-center justify-center border border-[var(--border)]">
                        <User size={18} className="text-[var(--sub)]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text)]">{log.actorName || 'Unknown Actor'}</p>
                        <p className="text-xs text-[var(--sub)]">{log.actorEmail || 'System / Unauthenticated'}</p>
                        {log.actorRole && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[var(--accent-soft)] text-[var(--brand)]">
                            {log.actorRole}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[var(--muted)] block mb-0.5">Actor Type</span>
                        <span className="font-bold text-[var(--text)]">{log.actorType}</span>
                      </div>
                      <div>
                        <span className="text-[var(--muted)] block mb-0.5">IP Address</span>
                        <span className="font-bold text-[var(--text)]">{log.ipAddress || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Target Resource</h3>
                  <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] h-full flex flex-col justify-center">
                    {log.resourceType ? (
                      <div className="space-y-3">
                        {log.resourceDisplayName ? (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">{log.resourceType}</span>
                              {log.resourceId && (
                                <span className="font-mono text-[10px] text-[var(--sub)] truncate max-w-[150px]">{log.resourceId}</span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-[var(--text)]">{log.resourceDisplayName}</p>
                            {log.resourceDisplaySubtitle && (
                              <p className="text-xs text-[var(--sub)] mt-0.5">{log.resourceDisplaySubtitle}</p>
                            )}
                            
                            {/* Contextual Link */}
                            {log.resourceType === 'ORDER' && (
                              <a href={`/admin/orders/${log.resourceId}`} className="text-xs text-[var(--brand)] hover:underline mt-2 inline-block" target="_blank" rel="noopener noreferrer">View Order &rarr;</a>
                            )}
                            {log.resourceType === 'PRODUCT' && (
                              <a href={`/admin/catalog/${log.resourceId}`} className="text-xs text-[var(--brand)] hover:underline mt-2 inline-block" target="_blank" rel="noopener noreferrer">View Product &rarr;</a>
                            )}
                            {log.resourceType === 'USER' && (
                              <a href={`/admin/customers/${log.resourceId}`} className="text-xs text-[var(--brand)] hover:underline mt-2 inline-block" target="_blank" rel="noopener noreferrer">View Customer &rarr;</a>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div>
                              <span className="text-[var(--muted)] text-xs block mb-0.5">Type</span>
                              <span className="font-bold text-[var(--text)]">{log.resourceType}</span>
                            </div>
                            <div>
                              <span className="text-[var(--muted)] text-xs block mb-0.5">ID</span>
                              <span className="font-mono text-xs text-[var(--brand)] bg-[var(--accent-soft)] px-2 py-1 rounded">{log.resourceId}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-[var(--muted)] text-sm">
                        No resource associated
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Changes Display Component */}
              <AuditChanges log={log} />

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuditDetailDrawer;
