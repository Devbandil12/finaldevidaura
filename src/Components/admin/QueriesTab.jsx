import React, { useState, useContext, useMemo } from 'react';
import { Search, Mail, Phone, Send, CheckCircle, Inbox, RefreshCw, X, Hash, Clock, MoreVertical, ShieldAlert, User as UserIcon } from 'lucide-react';
import { ContactContext } from '../../contexts/ContactContext';

const QueriesTab = ({ queries: tickets, querySearch, setQuerySearch }) => {
  const { replyToTicket, updateTicketStatus, getAllTickets } = useContext(ContactContext);
  
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
        await replyToTicket(selectedTicket.id, replyMessage, 'admin');
        await getAllTickets(); 
        
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

            const result = await updateTicketStatus(selectedTicket.id, newStatus);
            
            if (!result || result.error) throw new Error("Failed to update status");
            
            await getAllTickets(); 
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
    <div className="flex h-[calc(100vh-100px)] bg-gray-50 rounded-2xl  overflow-hidden shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] ">
      
      {/* LEFT SIDEBAR: Ticket List */}
      <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[380px] border-r border-gray-200 bg-white z-10`}>
        
        {/* Header Section */}
        <div className="px-5 pt-5 pb-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Inbox</h2>
            <button onClick={getAllTickets} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                <RefreshCw size={16} />
            </button>
          </div>

          {/* Custom Tabs */}
          <div className="flex p-1 bg-gray-100/80 rounded-lg">
            {['open', 'closed'].map((status) => (
                <button 
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 capitalize ${statusFilter === status ? 'bg-white text-indigo-600 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    {status === 'open' ? <Inbox size={14} /> : <CheckCircle size={14} />} 
                    {status}
                </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search..." 
              value={querySearch} 
              onChange={(e) => setQuerySearch(e.target.value)} 
              className="w-full pl-9 pr-3 py-2 bg-gray-50  group-hover:border-indigo-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-lg text-sm transition-all outline-none" 
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
          </div>
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
          {filteredTickets?.length > 0 ? (
            filteredTickets.map((ticket) => (
              <div 
                key={ticket.id} 
                onClick={() => setSelectedTicket(ticket)}
                className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedTicket?.id === ticket.id ? 'bg-indigo-50/60 border-indigo-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`font-semibold text-sm truncate pr-2 ${selectedTicket?.id === ticket.id ? 'text-indigo-900' : 'text-gray-800'}`}>{ticket.subject}</h4>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap pt-0.5">
                    {new Date(ticket.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                
                <p className={`text-[12px] truncate mb-2.5 ${selectedTicket?.id === ticket.id ? 'text-indigo-700/70' : 'text-gray-500'}`}>
                    {ticket.messages[ticket.messages.length - 1]?.message}
                </p>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedTicket?.id === ticket.id ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                            {(ticket.guestEmail?.[0] || 'U').toUpperCase()}
                        </div>
                        <span className="text-[11px] text-gray-400 truncate max-w-[120px]">{ticket.guestEmail || ticket.user?.email}</span>
                    </div>
                    {/* Status Dot */}
                    <div className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Inbox size={40} className="mb-3 opacity-20" />
                <p className="text-xs font-medium">No {statusFilter} tickets</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT MAIN: Chat Window */}
      <div className={`${!selectedTicket ? 'hidden md:flex' : 'flex'} flex-col w-full bg-white/50`}>
        {selectedTicket ? (
          <>
            {/* Chat Header */}
            <div className="h-[68px] px-6 border-b border-gray-200 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4 overflow-hidden">
                 <button onClick={() => setSelectedTicket(null)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                 
                 <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 shrink-0">
                    <UserIcon size={20} />
                 </div>

                 <div className="overflow-hidden">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{selectedTicket.subject}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1"><Mail size={10} /> {selectedTicket.guestEmail}</span>
                        {selectedTicket.guestPhone && <span className="flex items-center gap-1 border-l border-gray-300 pl-3"><Phone size={10} /> {selectedTicket.guestPhone}</span>}
                        <span className="hidden sm:flex items-center gap-1 border-l border-gray-300 pl-3 font-mono text-gray-400">#{selectedTicket.id.slice(0,8)}</span>
                    </div>
                 </div>
              </div>
              
              <div className="flex items-center gap-2 pl-2">
                {selectedTicket.status === 'open' && (
                    <button onClick={handleCloseTicket} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Close Ticket">
                        <CheckCircle size={18} />
                    </button>
                )}
                <div className="h-4 w-[1px] bg-gray-200 mx-1 hidden md:block"></div>
                <button 
                  onClick={() => setSelectedTicket(null)} 
                  className="hidden md:flex p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8FAFC]">
                {/* Date separator example - could be dynamic */}
                <div className="flex justify-center my-4">
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full /50">
                        Ticket Created: {new Date(selectedTicket.createdAt || selectedTicket.updatedAt).toLocaleDateString()}
                    </span>
                </div>

                {selectedTicket.messages.map((msg, idx) => {
                    const isAdmin = msg.senderRole === 'admin';
                    return (
                        <div key={idx} className={`flex w-full ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[80%] sm:max-w-[70%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                                {/* Avatar Bubble */}
                                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] text-white ${isAdmin ? 'bg-indigo-600' : 'bg-gray-400'}`}>
                                    {isAdmin ? 'A' : (selectedTicket.guestEmail?.[0] || 'U').toUpperCase()}
                                </div>

                                <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-2 text-[13px] shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] ${
                                        isAdmin 
                                        ? 'bg-indigo-600 text-white rounded-2xl rounded-br-none' 
                                        : 'bg-white text-gray-700 /80 rounded-2xl rounded-bl-none'
                                    }`}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                    </div>
                                    <span className="text-[9px] text-gray-400 mt-1 px-1 opacity-70">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Reply / Footer */}
            <div className="p-4 bg-white border-t border-gray-200">
            {selectedTicket.status === 'open' ? (
                <form onSubmit={handleSendReply} className="relative flex items-end gap-2 bg-gray-50  rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <input 
                        type="text" 
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Write a reply..." 
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 py-2 min-h-[44px]"
                    />
                    <button 
                        type="submit" 
                        disabled={sending || !replyMessage.trim()}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl transition-all shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mb-[1px] mr-[1px]"
                    >
                        {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                    </button>
                </form>
            ) : (
                <div className="py-2 flex items-center justify-center gap-2 text-gray-500 bg-gray-50 rounded-xl  border-dashed">
                    <ShieldAlert size={16} /> 
                    <span className="text-xs font-medium">This ticket is closed. Re-open via admin panel to reply.</span>
                </div>
            )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] ">
                <Inbox className="w-10 h-10 text-indigo-200" />
            </div>
            <h3 className="text-gray-900 font-semibold mb-1">Select a ticket</h3>
            <p className="text-sm text-gray-500">Choose a conversation from the list to view details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueriesTab;