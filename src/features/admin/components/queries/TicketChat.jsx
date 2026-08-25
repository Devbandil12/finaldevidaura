import React from 'react';
import { X, Mail, Phone, Send, ShieldAlert, CheckCircle, User as UserIcon, Inbox } from 'lucide-react';

const TicketChat = ({ 
  selectedTicket, setSelectedTicket, handleCloseTicket, 
  handleSendReply, replyMessage, setReplyMessage, sending 
}) => {
  if (!selectedTicket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--muted)] bg-[var(--bg)] font-body p-8">
        <div className="w-20 h-20 bg-[var(--surface)] border border-[var(--border)] rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Inbox className="w-10 h-10 text-[var(--muted)]" strokeWidth={1.5} />
        </div>
        <h3 className="font-display text-3xl font-medium text-[var(--text)] tracking-tight mb-2">Select a ticket</h3>
        <p className="font-display italic text-[var(--sub)] text-lg tracking-wide">Choose a conversation from the list to view details.</p>
      </div>
    );
  }

  return (
    <div className={`${!selectedTicket ? 'hidden md:flex' : 'flex'} flex-col w-full bg-[var(--bg)] h-full font-body`}>
      {/* Chat Header */}
      <div className="h-20 px-6 md:px-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)] shadow-sm">
        <div className="flex items-center gap-5 overflow-hidden">
           <button onClick={() => setSelectedTicket(null)} className="md:hidden p-2 -ml-2 text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface)] rounded-lg transition-colors"><X size={20} strokeWidth={2} /></button>
           
           <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--brand)] shrink-0 shadow-sm">
              <UserIcon size={22} strokeWidth={1.5} />
           </div>

           <div className="overflow-hidden min-w-0">
              <h3 className="font-body font-bold text-[var(--text)] text-base tracking-wide truncate">{selectedTicket.subject}</h3>
              <div className="flex items-center gap-4 font-body text-xs font-bold text-[var(--sub)] mt-1 flex-wrap">
                  <span className="flex items-center gap-1.5"><Mail size={12} strokeWidth={2} className="text-[var(--muted)]" /> {selectedTicket.guestEmail}</span>
                  {selectedTicket.guestPhone && <span className="flex items-center gap-1.5 border-l border-[var(--border)] pl-4"><Phone size={12} strokeWidth={2} className="text-[var(--muted)]" /> {selectedTicket.guestPhone}</span>}
                  <span className="hidden sm:flex items-center gap-1.5 border-l border-[var(--border)] pl-4 font-mono text-[var(--muted)] text-[11px]">#{selectedTicket.id.slice(0,8)}</span>
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-3 pl-4">
          {selectedTicket.status === 'open' && (
              <button onClick={handleCloseTicket} className="p-2.5 text-[var(--muted)] hover:text-[var(--error)] hover:bg-[var(--surface)] rounded-xl border border-transparent hover:border-[var(--border)] transition-all shadow-sm" title="Close Ticket">
                  <CheckCircle size={18} strokeWidth={2} />
              </button>
          )}
          <div className="h-5 w-[1px] bg-[var(--border)] mx-1 hidden md:block"></div>
          <button 
            onClick={() => setSelectedTicket(null)} 
            className="hidden md:flex p-2.5 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] rounded-xl border border-transparent hover:border-[var(--border)] transition-all shadow-sm"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[var(--surface)] custom-scrollbar">
          {/* Date separator */}
          <div className="flex justify-center my-2">
              <span className="font-body text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] bg-[var(--surface)] px-4 py-1.5 rounded-md border border-[var(--border)] shadow-sm">
                  Ticket Created: {new Date(selectedTicket.createdAt || selectedTicket.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
          </div>

          {selectedTicket.messages.map((msg, idx) => {
              const isAdmin = msg.senderRole === 'admin';
              return (
                <div key={idx} className={`flex w-full ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[85%] sm:max-w-[70%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
                        {/* Avatar Bubble */}
                        <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center font-body font-bold text-xs shadow-sm border ${isAdmin ? 'bg-[var(--brand)] text-[var(--bg)] border-[var(--brand)]' : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]'}`}>
                            {isAdmin ? 'A' : (selectedTicket.guestEmail?.[0] || 'U').toUpperCase()}
                        </div>

                        <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                            <div className={`px-5 py-3 font-body text-sm leading-relaxed shadow-sm border ${
                                isAdmin 
                                ? 'bg-[var(--brand)] text-[var(--bg)] rounded-2xl rounded-br-xs border-[var(--brand)]' 
                                : 'bg-[var(--surface)] text-[var(--text)] rounded-2xl rounded-bl-xs border-[var(--border)]'
                            }`}>
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                            </div>
                            <span className="font-body text-[10px] font-bold text-[var(--muted)] mt-1 px-1 tracking-widest uppercase">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>
              );
          })}
      </div>

      {/* Reply / Footer */}
      <div className="p-4 md:p-6 bg-[var(--surface)] border-t border-[var(--border)]">
      {selectedTicket.status === 'open' ? (
          <form onSubmit={handleSendReply} className="relative flex items-end gap-3 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-2xl p-2.5 focus-within:border-[var(--brand)] focus-within:ring-1 focus-within:ring-[var(--brand)] transition-all shadow-sm">
              <input 
                  type="text" 
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Write a reply..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 font-body font-bold text-sm text-[var(--text)] px-3 py-2 min-h-[44px] outline-none placeholder-[var(--muted)]"
              />
              <button 
                  type="submit" 
                  disabled={sending || !replyMessage.trim()}
                  className="p-3 bg-[var(--brand)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-[var(--bg)] rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center button-hero"
              >
                  {sending ? <div className="w-4 h-4 border-2 border-[#F5F1E8]/30 border-t-[#F5F1E8] rounded-full animate-spin" /> : <Send size={16} strokeWidth={2.5} />}
              </button>
          </form>
      ) : (
          <div className="py-3 px-4 flex items-center justify-center gap-2.5 text-[var(--sub)] bg-[var(--surface)] rounded-xl border border-dashed border-[var(--border)] font-body">
              <ShieldAlert size={16} strokeWidth={2} className="text-[var(--accent)]" /> 
              <span className="font-body text-xs font-bold uppercase tracking-widest">This ticket is closed. Re-open via admin panel to reply.</span>
          </div>
      )}
      </div>
    </div>
  );
};

export default TicketChat;