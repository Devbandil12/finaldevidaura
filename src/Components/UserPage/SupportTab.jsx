import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { RefreshCw, Plus, Lock, MessageSquare, Send, ChevronLeft, Loader2, Inbox, Clock, CheckCircle, AlertTriangle, Paperclip, FileText, Image, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyTickets, useMyTicketMessages, useCustomerReply, useCustomerAttachment, useSubmitCsat, useSupportRealtime, useSendTypingStatus } from '../../features/support/hooks/useSupport';
import CustomerAIChat from './CustomerAIChat';

const STATUS_DISPLAY = {
  new: { label: 'Received', color: '#6366F1', bg: '#EEF2FF' },
  open: { label: 'In Review', color: '#2563EB', bg: '#DBEAFE' },
  in_progress: { label: 'Being Handled', color: '#D97706', bg: '#FEF3C7' },
  waiting_for_customer: { label: 'Needs Your Reply', color: '#9333EA', bg: '#F3E8FF' },
  pending: { label: 'Pending', color: '#6B7280', bg: '#F3F4F6' },
  resolved: { label: 'Resolved', color: '#059669', bg: '#D1FAE5' },
  closed: { label: 'Closed', color: '#374151', bg: '#E5E7EB' },
  reopened: { label: 'Reopened', color: '#DC2626', bg: '#FEE2E2' },
};

const renderMessageAttachments = (attachments) => {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="mt-2 space-y-1.5 shrink-0 w-full max-w-[240px]">
      {attachments.map((att) => {
        const isImage = att.mimeType?.startsWith('image/');
        const formattedSize = att.size > 1024 * 1024 
          ? `${(att.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(att.size / 1024)} KB`;

        return (
          <div key={att.id} className="rounded-xl overflow-hidden border border-[var(--border)] shadow-sm bg-white hover:border-[var(--brand-soft)] transition-all">
            {isImage ? (
              <a href={att.url} target="_blank" rel="noopener noreferrer" className="block group relative">
                <img 
                  src={att.url} 
                  alt={att.originalName} 
                  className="max-h-32 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <div className="p-2 flex items-center justify-between bg-white border-t border-[var(--border)]">
                  <span className="text-[9px] font-bold text-[var(--text)] truncate max-w-[130px]">{att.originalName}</span>
                  <span className="text-[8px] font-mono text-[var(--muted)]">{formattedSize}</span>
                </div>
              </a>
            ) : (
              <a 
                href={att.url} 
                download={att.originalName} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2.5 flex items-center justify-between gap-2 text-[var(--text)] hover:text-[var(--brand)] transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText size={14} className="text-[var(--muted)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold truncate max-w-[140px]">{att.originalName}</p>
                    <p className="text-[8px] text-[var(--muted)] font-mono">{formattedSize}</p>
                  </div>
                </div>
                <Download size={12} className="text-[var(--muted)] hover:text-[var(--brand)] shrink-0 transition-colors" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function SupportTab() {
  const navigate = useNavigate();
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: ticketsData, isLoading: loadingTickets, refetch } = useMyTickets();
  const { data: messagesData, isLoading: loadingMessages } = useMyTicketMessages(selectedTicketId);
  const { mutateAsync: sendReply, isPending: sendingReply } = useCustomerReply();
  const { mutateAsync: uploadAttachment } = useCustomerAttachment();

  // The backend returns { data: [...], total, page, limit }
  const tickets = ticketsData?.data || [];
  const messages = messagesData?.messages || [];

  // Enable Realtime SSE listening
  useSupportRealtime();

  const [csatRating, setCsatRating] = useState(0);
  const [csatHover, setCsatHover] = useState(0);
  const [csatComment, setCsatComment] = useState("");
  const { mutateAsync: submitCsat, isPending: submittingCsat } = useSubmitCsat();

  const { mutateAsync: sendTyping } = useSendTypingStatus();
  const [agentIsTyping, setAgentIsTyping] = useState(false);
  const [typingTimeoutRef, setTypingTimeoutRef] = useState(null);

  // Clear typing timeout when ticket shifts
  useEffect(() => {
    setAgentIsTyping(false);
    if (typingTimeoutRef) {
      clearTimeout(typingTimeoutRef);
      setTypingTimeoutRef(null);
    }
  }, [selectedTicketId]);

  // Listen to SSE typing alerts
  useEffect(() => {
    const handleTypingEvent = (e) => {
      const { ticketId, isTyping } = e.detail;
      if (ticketId === selectedTicketId) {
        setAgentIsTyping(isTyping);
      }
    };

    window.addEventListener('support_typing', handleTypingEvent);
    return () => window.removeEventListener('support_typing', handleTypingEvent);
  }, [selectedTicketId]);

  const handleInputChange = (e) => {
    setReplyText(e.target.value);
    
    if (!selectedTicketId) return;

    if (!typingTimeoutRef) {
      sendTyping({ ticketId: selectedTicketId, isTyping: true }).catch(() => {});
    } else {
      clearTimeout(typingTimeoutRef);
    }

    const timeout = setTimeout(() => {
      sendTyping({ ticketId: selectedTicketId, isTyping: false }).catch(() => {});
      setTypingTimeoutRef(null);
    }, 2500);

    setTypingTimeoutRef(timeout);
  };

  const handleCsatSubmit = async (e) => {
    e.preventDefault();
    if (csatRating < 1 || csatRating > 5) return;
    await submitCsat({ ticketId: selectedTicketId, rating: csatRating, comment: csatComment });
  };

  // Find selected ticket from list for header info
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicketId) return;
    if (typingTimeoutRef) {
      clearTimeout(typingTimeoutRef);
      setTypingTimeoutRef(null);
      sendTyping({ ticketId: selectedTicketId, isTyping: false }).catch(() => {});
    }
    await sendReply({ ticketId: selectedTicketId, message: replyText });
    setReplyText("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTicketId) return;
    await uploadAttachment({ ticketId: selectedTicketId, file });
    e.target.value = '';
  };

  const isOpen = selectedTicket && !['closed', 'spam', 'resolved'].includes(selectedTicket.status);

  return (
    <div className="h-[700px] bg-[var(--surface)] border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-[var(--shadow)] flex animate-fadeIn">
        
      {/* Sidebar List */}
      <div className={`w-full md:w-96 border-r border-[var(--border)] flex flex-col bg-[var(--surface)] z-10 transition-all ${selectedTicketId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)]">
          <h3 className="font-display text-xl font-medium text-[var(--text)] tracking-tight">Support</h3>
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="p-2 hover:bg-[var(--surface-muted)] rounded-xl text-[var(--muted)] transition-colors">
                <RefreshCw size={18} />
            </button>
            <button onClick={() => navigate('/contact')} className="p-2 bg-[var(--brand)] text-[var(--bg)] rounded-xl hover:brightness-110 transition-all shadow-sm" title="New Ticket">
                <Plus size={18} />
            </button>
            <button onClick={() => setIsAiChatOpen(true)} className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:brightness-110 transition-all shadow-sm" title="Chat with AI">
                <MessageSquare size={18} />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
          {loadingTickets ? (
            <div className="flex items-center justify-center h-40 text-[var(--muted)]">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
             <div className="text-center py-20 px-6">
                 <Inbox className="mx-auto text-[var(--muted)] mb-3 opacity-30" size={32} />
                 <p className="text-xs text-[var(--muted)] font-display italic">No support tickets yet.</p>
                 <button onClick={() => navigate('/contact')} className="mt-4 text-xs font-body font-bold text-[var(--brand)] hover:underline">
                   Create your first ticket →
                 </button>
             </div>
          ) : (
            tickets.map(t => {
              const statusConf = STATUS_DISPLAY[t.status] || STATUS_DISPLAY.open;
              const isSelected = selectedTicketId === t.id;
              const needsReply = t.status === 'waiting_for_customer';

              return (
                <div 
                    key={t.id} 
                    onClick={() => setSelectedTicketId(t.id)} 
                    className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 border group ${
                      isSelected 
                        ? 'bg-[var(--accent-soft)] border-[var(--brand)] shadow-sm' 
                        : 'bg-[var(--surface)] border-transparent hover:bg-[var(--surface)] hover:border-[var(--border)]'
                    }`}
                >
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                      <span className={`font-body font-bold text-sm truncate ${isSelected ? 'text-[var(--brand)]' : 'text-[var(--text)]'}`}>
                        {needsReply && <AlertTriangle size={12} className="inline mr-1 text-amber-500" />}
                        {t.subject}
                      </span>
                      <span 
                        className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md shrink-0"
                        style={{ color: statusConf.color, backgroundColor: statusConf.bg }}
                      >
                        {statusConf.label}
                      </span>
                  </div>
                  <p className="text-xs text-[var(--sub)] truncate font-body">
                      {t.messages?.[0]?.message || 'No messages'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
                      {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    {t.category && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--muted)]">
                        {t.category}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-[var(--bg)] relative ${!selectedTicketId ? 'hidden md:flex' : 'flex'}`}>
        {selectedTicketId && selectedTicket ? (
          <>
            {/* Header */}
            <div className="h-[72px] px-6 border-b border-[var(--border)] bg-[var(--surface)] flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                 <button onClick={() => setSelectedTicketId(null)} className="md:hidden p-2 -ml-2 text-[var(--muted)]"><ChevronLeft size={20}/></button>
                 <div className="min-w-0">
                    <h3 className="font-body font-bold text-[var(--text)] text-sm truncate">{selectedTicket.subject}</h3>
                    <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mt-0.5">#{selectedTicket.ticketNumber}</p>
                 </div>
              </div>
              <span 
                className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg shrink-0"
                style={{ color: STATUS_DISPLAY[selectedTicket.status]?.color, backgroundColor: STATUS_DISPLAY[selectedTicket.status]?.bg }}
              >
                {STATUS_DISPLAY[selectedTicket.status]?.label || selectedTicket.status}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-40 text-[var(--muted)]">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : (
                <>
                  {/* Date separator */}
                  <div className="flex justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] bg-[var(--surface)] px-3 py-1 rounded-md border border-[var(--border)]">
                      {new Date(selectedTicket.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {messages.map((m, i) => {
                    if (m.messageType === 'system_event') {
                      return (
                        <div key={i} className="flex justify-center">
                          <span className="text-[10px] font-bold text-[var(--muted)] bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-dashed border-[var(--border)] italic">
                            {m.message}
                          </span>
                        </div>
                      );
                    }

                    const isUser = m.senderRole === 'user';
                    return (
                      <motion.div initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                          <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold border shadow-sm ${
                            isUser
                              ? 'bg-[var(--brand)] text-[var(--bg)] border-[var(--brand)]'
                              : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]'
                          }`}>
                            {isUser ? 'You' : 'DA'}
                          </div>
                          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-3 text-sm leading-relaxed shadow-sm border ${
                              isUser 
                                ? 'bg-[var(--brand)] text-[var(--bg)] rounded-2xl rounded-br-sm border-[var(--brand)]' 
                                : 'bg-[var(--surface)] text-[var(--text)] rounded-2xl rounded-bl-sm border-[var(--border)]'
                            }`}>
                              <p className="whitespace-pre-wrap">{m.message}</p>
                            </div>
                            {renderMessageAttachments(m.attachments)}
                            <span className="text-[9px] font-bold text-[var(--muted)] mt-1 px-1 tracking-widest uppercase">
                              {m.sender?.name || (isUser ? 'You' : 'Support')} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Reply Area */}
            {agentIsTyping && (
              <div className="px-5 py-2 text-xs text-[var(--muted)] bg-zinc-50 border-t border-[var(--border)] flex items-center gap-1.5 font-body font-bold">
                <span className="flex gap-0.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                Support Agent is typing...
              </div>
            )}

            {isOpen ? (
              <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] flex gap-3 items-center">
                <label className="p-3 text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface)] rounded-xl transition-colors cursor-pointer" title="Attach file">
                  <Paperclip size={16} />
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
                </label>
                <input 
                    value={replyText} 
                    onChange={handleInputChange} 
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()} 
                    placeholder="Type your reply..." 
                    className="flex-1 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl px-5 py-3 text-sm outline-none transition-all placeholder-[var(--muted)] font-body font-bold text-[var(--text)]" 
                />
                <button 
                    onClick={handleReply} 
                    disabled={!replyText.trim() || sendingReply} 
                    className="p-3 rounded-xl bg-[var(--brand)] text-[var(--bg)] flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-40 shadow-sm"
                >
                    {sendingReply ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            ) : (
              <div className="p-5 bg-[var(--surface)] border-t border-[var(--border)] space-y-4">
                {selectedTicket.supportCsat ? (
                  <div className="py-3 px-4 flex flex-col items-center justify-center gap-1 text-[var(--sub)] bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < selectedTicket.supportCsat.rating ? 'text-emerald-500' : 'text-zinc-200'}`}>★</span>
                      ))}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                      You rated this support experience {selectedTicket.supportCsat.rating}/5 ★
                    </span>
                    {selectedTicket.supportCsat.comment && (
                      <p className="text-[11px] italic mt-1 font-body text-emerald-700">"{selectedTicket.supportCsat.comment}"</p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleCsatSubmit} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text)]">Rate your support experience</h4>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const starVal = i + 1;
                          const active = starVal <= (csatHover || csatRating);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setCsatRating(starVal)}
                              onMouseEnter={() => setCsatHover(starVal)}
                              onMouseLeave={() => setCsatHover(0)}
                              className={`text-2xl transition-transform hover:scale-110 ${active ? 'text-amber-400' : 'text-zinc-300'}`}
                            >
                              ★
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {csatRating > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                        <input
                          type="text"
                          value={csatComment}
                          onChange={e => setCsatComment(e.target.value)}
                          placeholder="Optional comment: What went well or could be improved?"
                          className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl px-4 py-2.5 text-xs outline-none font-body font-bold text-[var(--text)] placeholder-[var(--muted)]"
                        />
                        <button
                          type="submit"
                          disabled={submittingCsat}
                          className="w-full py-2 bg-[var(--brand)] text-[var(--bg)] rounded-xl text-xs font-bold transition-all hover:brightness-110 disabled:opacity-40"
                        >
                          {submittingCsat ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Submit Feedback'}
                        </button>
                      </motion.div>
                    )}
                  </form>
                )}

                <div className="py-2.5 px-4 flex items-center justify-center gap-2 text-[var(--sub)] bg-[var(--surface)] rounded-xl border border-dashed border-[var(--border)]">
                  <Lock size={12} className="text-[var(--accent)]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    This ticket is {STATUS_DISPLAY[selectedTicket.status]?.label || selectedTicket.status}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--muted)] p-8">
            <div className="w-16 h-16 bg-[var(--surface)] border border-[var(--border)] rounded-full flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-lg font-medium text-[var(--text)] tracking-tight mb-1">Select a conversation</h3>
            <p className="font-display italic text-[var(--sub)] text-sm">Choose a ticket from the list</p>
            <button 
              onClick={() => setIsAiChatOpen(true)}
              className="mt-6 px-4 py-2 bg-[var(--brand)] text-[var(--bg)] rounded-xl text-xs font-bold"
            >
              Ask AI Assistant
            </button>
          </div>
        )}
      </div>
      
      {/* AI Chat Widget */}
      <AnimatePresence>
        {isAiChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 shadow-2xl rounded-2xl"
          >
            <CustomerAIChat onClose={() => setIsAiChatOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}