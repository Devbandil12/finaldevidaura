import React from 'react';
import { Search, Filter } from 'lucide-react';

const AuditFilters = ({ filters, setFilters }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
      <div className="relative group w-full sm:w-auto">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--brand)] transition-colors" size={18} strokeWidth={1.5} />
        <input 
          type="text" 
          placeholder="Search logs (email, name, resource ID)..." 
          className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--brand)] rounded-lg outline-none transition-all text-sm font-bold text-[var(--text)] placeholder-[var(--muted)] focus:ring-1 focus:ring-[var(--brand)]"
          value={filters.search || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
      </div>
      
      <div className="relative w-full sm:w-auto flex items-center">
        <Filter className="absolute left-3.5 text-[var(--muted)] pointer-events-none" size={16} strokeWidth={1.5} />
        <select 
          value={filters.category || 'ALL'}
          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          className="w-full sm:w-auto pl-10 pr-10 py-2.5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-lg text-sm font-bold text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all appearance-none cursor-pointer"
        >
          <option value="ALL">All Categories</option>
          <option value="AUTH">Authentication</option>
          <option value="USER_MANAGEMENT">User Management</option>
          <option value="RBAC">RBAC</option>
          <option value="ORDER_MANAGEMENT">Order Management</option>
          <option value="CATALOG">Catalog</option>
          <option value="SYSTEM">System</option>
        </select>
        <div className="absolute right-3.5 pointer-events-none text-[var(--muted)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>

      <div className="relative w-full sm:w-auto flex items-center">
        <Filter className="absolute left-3.5 text-[var(--muted)] pointer-events-none" size={16} strokeWidth={1.5} />
        <select 
          value={filters.severity || 'ALL'}
          onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
          className="w-full sm:w-auto pl-10 pr-10 py-2.5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-lg text-sm font-bold text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all appearance-none cursor-pointer"
        >
          <option value="ALL">All Severities</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <div className="absolute right-3.5 pointer-events-none text-[var(--muted)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    </div>
  );
};

export default AuditFilters;
