import React from 'react';
import { Search, Inbox, CheckCircle } from 'lucide-react';

const TicketList = ({ 
  filteredTickets, selectedTicket, setSelectedTicket, 
  statusFilter, setStatusFilter, querySearch, setQuerySearch 
}) => {
  return (
    <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[400px] border-r border-[var(--border)] bg-[var(--surface)] z-10 font-body`}>
      
      {/* Header Section */}
      <div className="px-6 pt-6 pb-4 space-y-5 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl font-medium text-[var(--text)] tracking-tight">Inbox</h2>
        </div>

        {/* Custom Tabs */}
        <div className="flex p-1.5 bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm">
          {['open', 'closed'].map((status) => (
              <button 
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 font-body text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 capitalize ${statusFilter === status ? 'bg-[var(--brand)] text-[var(--surface)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-muted)]'}`}
              >
                  {status === 'open' ? <Inbox size={14} strokeWidth={2} /> : <CheckCircle size={14} strokeWidth={2} />} 
                  {status}
              </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search tickets..." 
            value={querySearch} 
            onChange={(e) => setQuerySearch(e.target.value)} 
            className="w-full pl-10 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none transition-all placeholder-[var(--muted)] shadow-sm" 
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] group-hover:text-[var(--brand)] transition-colors" strokeWidth={1.5} />
        </div>
      </div>

      {/* List Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-[var(--surface)]">
        {filteredTickets?.length > 0 ? (
          filteredTickets.map((ticket) => {
            const isSelected = selectedTicket?.id === ticket.id;
            return (
              <div 
                key={ticket.id} 
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border group ${isSelected ? 'bg-[var(--accent-soft)] border-[var(--brand)] shadow-sm' : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--surface)]'}`}
              >
                <div className="flex justify-between items-start mb-1.5 gap-2">
                  <h4 className={`font-body font-bold text-sm truncate tracking-wide ${isSelected ? 'text-[var(--brand)]' : 'text-[var(--text)] group-hover:text-[var(--brand)] transition-colors'}`}>{ticket.subject}</h4>
                  <span className="font-body text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] whitespace-nowrap pt-0.5">
                    {new Date(ticket.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                
                <p className={`font-body text-xs font-bold truncate mb-4 ${isSelected ? 'text-[var(--sub)]' : 'text-[var(--sub)]'}`}>
                    {ticket.messages[ticket.messages.length - 1]?.message}
                </p>
                
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-body font-bold text-[10px] border shadow-sm shrink-0 ${isSelected ? 'bg-[var(--brand)] text-[var(--bg)] border-[var(--brand)]' : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]'}`}>
                            {(ticket.guestEmail?.[0] || 'U').toUpperCase()}
                        </div>
                        <span className="font-body text-[11px] font-bold text-[var(--sub)] truncate max-w-[150px]">{ticket.guestEmail || ticket.user?.email}</span>
                    </div>
                    {/* Status Dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${ticket.status === 'open' ? 'bg-[var(--success)] shadow-sm' : 'bg-[var(--muted)]'}`} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--muted)]">
              <Inbox size={40} strokeWidth={1} className="mb-3 opacity-40" />
              <p className="font-display italic text-lg tracking-wide">No {statusFilter} tickets</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList;