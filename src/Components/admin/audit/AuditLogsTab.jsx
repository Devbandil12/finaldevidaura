import React, { useState } from 'react';
import { History, ShieldAlert } from 'lucide-react';
import { useAuditLogs } from '../../../features/admin/hooks/useAuditLogs';
import AuditFilters from './AuditFilters';
import AuditTable from './AuditTable';
import AuditDetailDrawer from './AuditDetailDrawer';

const AuditLogsTab = () => {
  const [filters, setFilters] = useState({
    search: '',
    category: 'ALL',
    severity: 'ALL'
  });
  
  const [selectedLog, setSelectedLog] = useState(null);

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useAuditLogs(filters);

  // Flatten the pages from useInfiniteQuery
  const logs = data?.pages.flatMap(page => page.data) || [];

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 sm:p-6 space-y-6 font-body transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
        <div>
          <h1 className="font-display text-3xl font-medium text-[var(--text)] flex items-center gap-3">
            <ShieldAlert className="text-[var(--accent)]" strokeWidth={1.5} size={28} /> 
            Security & Audit Logs
          </h1>
          <p className="text-base text-[var(--sub)] mt-2 font-display italic tracking-wide">
            Track administrative actions, security events, and system changes.
          </p>
        </div>
        
        {/* FILTERS */}
        <AuditFilters filters={filters} setFilters={setFilters} />
      </div>

      {/* LOGS LIST */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--brand)] border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <AuditTable 
          logs={logs} 
          onRowClick={setSelectedLog}
          hasMore={hasNextPage}
          loadMore={() => fetchNextPage()}
          isFetchingNextPage={isFetchingNextPage}
        />
      )}

      {/* DETAIL DRAWER */}
      <AuditDetailDrawer 
        log={selectedLog} 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
      />

    </div>
  );
};

export default AuditLogsTab;
