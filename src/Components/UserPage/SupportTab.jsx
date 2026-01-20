import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { RefreshCw, Plus, X, Lock, MessageSquare, Send, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportTab({ tickets, getUserTickets, replyToTicket, userEmail }) {
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [ticketRefreshing, setTicketRefreshing] = useState(false);

  const refreshTickets = async () => {
    setTicketRefreshing(true);
    await getUserTickets(userEmail);
    setTimeout(() => setTicketRefreshing(false), 500);
  };

  const handleTicketReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      await replyToTicket(selectedTicket.id, replyText, 'user');
      setReplyText("");
      setSelectedTicket(prev => ({ 
          ...prev, 
          messages: [...prev.messages, { message: replyText, senderRole: 'user', createdAt: new Date().toISOString() }] 
      }));
      await getUserTickets(userEmail);
    } catch (e) { 
        if(window.toast) window.toast.error("Message failed to send"); 
    }
  };

  return (
    <div className="h-[700px] bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] flex animate-fadeIn">
        
      {/* Sidebar List */}
      <div className={`w-full md:w-96 border-r border-zinc-100 flex flex-col bg-white z-10 transition-all ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/30">
          <h3 className="font-serif text-xl font-medium text-zinc-900">Inbox</h3>
          <div className="flex gap-2">
            <button onClick={refreshTickets} className={`p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 transition-colors ${ticketRefreshing ? 'animate-spin text-zinc-900' : ''}`}>
                <RefreshCw size={18} />
            </button>
            <button onClick={() => navigate('/contact')} className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-black transition-colors shadow-lg">
                <Plus size={18} />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
          {tickets.length === 0 && (
             <div className="text-center py-20 px-6">
                 <MessageSquare className="mx-auto text-zinc-200 mb-3" size={32} />
                 <p className="text-xs text-zinc-400 font-light">No support tickets found.</p>
             </div>
          )}
          
          {tickets.map(t => (
            <div 
                key={t.id} 
                onClick={() => setSelectedTicket(t)} 
                className={`p-5 rounded-2xl cursor-pointer transition-all border group ${selectedTicket?.id === t.id ? 'bg-zinc-50 border-zinc-200 shadow-inner' : 'bg-white border-transparent hover:bg-zinc-50 hover:border-zinc-100'}`}
            >
              <div className="flex justify-between mb-1.5">
                  <span className={`font-bold text-sm truncate ${selectedTicket?.id === t.id ? 'text-zinc-900' : 'text-zinc-700'}`}>{t.subject}</span>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex-shrink-0">
                      {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
              </div>
              <p className="text-xs text-zinc-500 truncate font-light opacity-80 font-serif">
                  {t.messages[t.messages.length - 1]?.message}
              </p>
              {t.status === 'closed' && <span className="inline-block mt-2 text-[9px] px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-md font-bold uppercase">Closed</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#FAFAFA] relative ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
        {selectedTicket ? (
          <>
            <div className="h-20 px-6 border-b border-zinc-100 bg-white flex justify-between items-center z-10 shadow-sm">
              <div className="flex items-center gap-3">
                 <button onClick={() => setSelectedTicket(null)} className="md:hidden p-2 -ml-2 text-zinc-500"><ChevronLeft/></button>
                 <div>
                    <h3 className="font-bold text-zinc-900 text-base truncate max-w-[200px]">{selectedTicket.subject}</h3>
                    <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">ID: {selectedTicket.id.slice(-8)}</p>
                 </div>
              </div>
              {selectedTicket.status === 'closed' && <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-zinc-400"><Lock size={12}/> Closed</span>}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/50">
              {selectedTicket.messages.map((m, i) => (
                <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} key={i} className={`flex ${m.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-6 py-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.senderRole === 'user' ? 'bg-zinc-900 text-white rounded-br-none' : 'bg-white border border-zinc-100 text-zinc-700 rounded-bl-none'}`}>
                    {m.message}
                  </div>
                </motion.div>
              ))}
            </div>

            {selectedTicket.status === 'open' ? (
              <div className="p-4 bg-white border-t border-zinc-100 flex gap-3 items-center">
                <input 
                    value={replyText} 
                    onChange={e => setReplyText(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleTicketReply()} 
                    placeholder="Type your reply..." 
                    className="flex-1 bg-zinc-50 border-0 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all placeholder:text-zinc-400" 
                />
                <button 
                    onClick={handleTicketReply} 
                    disabled={!replyText.trim()} 
                    className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg"
                >
                    <Send size={20} />
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-300">
            <MessageSquare className="w-16 h-16 mb-4 opacity-10" strokeWidth={1} />
            <p className="text-sm font-medium">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}