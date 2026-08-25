import React, { useState, useMemo } from 'react';
import { useReplyToTicket, useUpdateTicketStatus } from '../../features/contact/hooks/useContact';
import TicketList from '../../features/admin/components/queries/TicketList';
import TicketChat from '../../features/admin/components/queries/TicketChat';

const QueriesTab = ({ queries: tickets, querySearch, setQuerySearch }) => {
  const { mutateAsync: replyToTicketMutation } = useReplyToTicket();
  const { mutateAsync: updateTicketStatusMutation } = useUpdateTicketStatus();
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("open"); // 'open' | 'closed'
  
  // Local override map to fix "stale list" issues immediately
  const [localStatusUpdates, setLocalStatusUpdates] = useState({}); 

  // MERGE PROPS WITH LOCAL UPDATES
  const liveTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.map(ticket => {
        if (localStatusUpdates[ticket.id]) {
            return { ...ticket, status: localStatusUpdates[ticket.id] };
        }
        return ticket;
    });
  }, [tickets, localStatusUpdates]);

  // Sort: Newest first
  const sortedTickets = [...liveTickets].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  // Filter: Apply tabs and search
  const filteredTickets = sortedTickets.filter(t => {
    const matchesStatus = t.status === statusFilter;
    const matchesSearch = 
      (t.guestEmail || "").toLowerCase().includes(querySearch.toLowerCase()) || 
      t.subject.toLowerCase().includes(querySearch.toLowerCase()) ||
      t.id.toLowerCase().includes(querySearch.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleSendReply = async (e) => {
    e.preventDefault();
    if(!replyMessage.trim() || !selectedTicket) return;
    
    setSending(true);
    try {
        await replyToTicketMutation({ ticketId: selectedTicket.id, message: replyMessage, senderRole: 'admin' });
        
        // Optimistic update
        const updatedTicket = { 
            ...selectedTicket, 
            messages: [...selectedTicket.messages, { senderRole: 'admin', message: replyMessage, createdAt: new Date() }] 
        };
        setSelectedTicket(updatedTicket);
        setReplyMessage("");
    } catch (error) {
        // Error handling handled by context
    }
    setSending(false);
  };

  const handleCloseTicket = async () => {
    if(!selectedTicket) return;
    if(window.confirm("Are you sure? This ticket will be permanently closed.")) {
        try {
            const newStatus = 'closed';
            setLocalStatusUpdates(prev => ({ ...prev, [selectedTicket.id]: newStatus }));
            setSelectedTicket(prev => ({ ...prev, status: newStatus }));

            const result = await updateTicketStatusMutation({ ticketId: selectedTicket.id, status: newStatus });
            
            if (!result || result.error) throw new Error("Failed to update status");
            // Optional: window.toast.success("Ticket closed");
        } catch (err) {
            console.error("Close failed:", err);
            // Revert on fail
            setLocalStatusUpdates(prev => {
                const newState = { ...prev };
                delete newState[selectedTicket.id];
                return newState;
            });
            setSelectedTicket(prev => ({ ...prev, status: 'open' }));
        }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--bg)] min-h-screen font-body animate-fadeIn transition-colors duration-300 pb-20">
      <div className="flex h-[calc(100vh-180px)] bg-[var(--surface)] rounded-2xl overflow-hidden shadow-[var(--shadow)] border border-[var(--border)]">
        <TicketList 
          filteredTickets={filteredTickets} 
          selectedTicket={selectedTicket} 
          setSelectedTicket={setSelectedTicket} 
          statusFilter={statusFilter} 
          setStatusFilter={setStatusFilter} 
          querySearch={querySearch} 
          setQuerySearch={setQuerySearch} 
        />
        <TicketChat 
          selectedTicket={selectedTicket} 
          setSelectedTicket={setSelectedTicket} 
          handleCloseTicket={handleCloseTicket} 
          handleSendReply={handleSendReply} 
          replyMessage={replyMessage} 
          setReplyMessage={setReplyMessage} 
          sending={sending} 
        />
      </div>
    </div>
  );
};

export default QueriesTab;