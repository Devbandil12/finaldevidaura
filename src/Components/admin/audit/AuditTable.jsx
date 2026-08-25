import React from 'react';
import { Clock, ShieldAlert, User, CheckCircle, Trash2, Edit, PlusCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

const getActionStyle = (action) => {
  const upperAction = (action || '').toUpperCase();
  if (upperAction.includes('DELETE')) return { bg: 'bg-[var(--surface)]', text: 'text-[var(--error)]', border: 'border-[var(--border)]', icon: Trash2 };
  if (upperAction.includes('UPDATE') || upperAction.includes('EDIT')) return { bg: 'bg-[var(--accent-soft)]', text: 'text-[var(--brand)]', border: 'border-transparent', icon: Edit };
  if (upperAction.includes('CREATE') || upperAction.includes('ADD')) return { bg: 'bg-[var(--surface)]', text: 'text-[var(--success)]', border: 'border-[var(--border)]', icon: PlusCircle };
  if (upperAction.includes('LOGIN') || upperAction.includes('AUTH')) return { bg: 'bg-[var(--surface-muted)]', text: 'text-[var(--brand)]', border: 'border-[var(--border)]', icon: ShieldAlert };
  return { bg: 'bg-[var(--surface)]', text: 'text-[var(--sub)]', border: 'border-[var(--border)]', icon: CheckCircle };
};

const AuditTable = ({ logs, onRowClick, hasMore, loadMore, isFetchingNextPage }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--muted)]">
        <AlertTriangle size={42} strokeWidth={1.5} className="mb-4 opacity-50 text-[var(--accent)]" />
        <p className="font-display italic text-xl text-[var(--sub)] tracking-wide">No audit logs found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] rounded-xl shadow-[var(--shadow)] border border-[var(--border)] overflow-hidden">
      <motion.div 
        className="divide-y divide-[var(--border)]"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence>
          {logs.map((log) => {
            const style = getActionStyle(log.action);
            const Icon = style.icon;
            const date = new Date(log.createdAt);

            return (
              <motion.div 
                key={log.id} 
                variants={itemVariants}
                onClick={() => onRowClick(log)}
                className="p-5 hover:bg-[var(--surface)] transition-colors duration-300 group flex gap-4 md:gap-5 items-start cursor-pointer"
              >
                {/* ICON AVATAR */}
                <div className={`shrink-0 mt-1 w-11 h-11 rounded-lg flex items-center justify-center border transition-all duration-500 ease-out group-hover:scale-105 shadow-sm ${style.bg} ${style.text} ${style.border}`}>
                  <Icon size={20} strokeWidth={1.5} />
                </div>

                {/* CONTENT */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <p className="font-body text-sm font-bold text-[var(--text)] tracking-wide truncate group-hover:text-[var(--brand)] transition-colors">
                        {log.action}
                      </p>
                      {log.status !== 'SUCCESS' && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${log.status === 'DENIED' ? 'bg-[var(--error-soft)] text-[var(--error)]' : 'bg-[var(--warning-soft)] text-[var(--warning)]'}`}>
                          {log.status}
                        </span>
                      )}
                    </div>
                    
                    {/* TIMESTAMP */}
                    <span className="font-body text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] flex items-center gap-1.5 shrink-0 bg-[var(--surface)] px-3 py-1.5 rounded-md border border-[var(--border)]">
                      <Clock size={12} strokeWidth={2} className="text-[var(--sub)]" />
                      {date.toLocaleDateString()} <span className="opacity-30 mx-0.5">|</span> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium text-[var(--sub)] leading-relaxed font-body line-clamp-1">
                    {log.description}
                  </p>

                  {/* METADATA CHIPS */}
                  <div className="flex flex-wrap items-center gap-2.5 mt-3">
                    {/* Actor Tag */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--surface)] border border-[var(--border)] shadow-sm">
                      <div className="w-4 h-4 rounded-full bg-[var(--surface-muted)] flex items-center justify-center border border-[var(--border)]">
                        <User size={10} className="text-[var(--muted)]" />
                      </div>
                      <span className="font-body text-xs font-bold text-[var(--text)]">
                        {log.actorName || 'System'}
                      </span>
                    </div>

                    {log.resourceType && (
                      <>
                        <span className="text-[var(--muted)] px-1">→</span>
                        {/* Target Tag */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text)]">
                          <span className="font-body text-[10px] font-bold tracking-wide uppercase text-[var(--muted)]">
                            {log.resourceType}
                          </span>
                          <span className="font-body text-xs font-bold tracking-wide truncate max-w-[200px]">
                            {log.resourceDisplayName || log.resourceId}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Load More */}
      {hasMore && (
        <div className="p-4 flex justify-center border-t border-[var(--border)]">
          <button 
            onClick={loadMore}
            disabled={isFetchingNextPage}
            className="px-6 py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-muted)] border border-[var(--border)] text-sm font-bold text-[var(--text)] transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load Older Logs'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditTable;
