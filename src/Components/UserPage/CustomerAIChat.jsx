import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

export default function CustomerAIChat({ onClose }) {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'model', content: 'Hello! I am the Devid Aura AI Assistant. I can help you with your orders, our policies, or connect you to a human agent. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newHistory = [...messages, { role: 'user', content: userMsg }];
    setMessages(newHistory);
    setIsLoading(true);

    // Add empty model message for streaming
    setMessages(prev => [...prev, { role: 'model', content: '' }]);

    try {
      const token = await getToken();
      
      const response = await fetch('http://localhost:3000/api/support/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ history: newHistory })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        
        // chunkValue might contain multiple "data: {...}\n\n"
        const events = chunkValue.split('\n\n');
        for (const event of events) {
          if (event.startsWith('data: ')) {
            const dataStr = event.slice(6);
            if (dataStr === '[DONE]') {
              done = true;
              break;
            }
            
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  last.content += data.text;
                  return updated;
                });
              }
            } catch (err) {
              console.error("Error parsing SSE data", err);
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        last.content = "I'm sorry, I am currently experiencing technical difficulties. Please try again later.";
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full sm:w-[400px] bg-white rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[var(--brand)] text-[var(--bg)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <h3 className="font-bold font-body">Devid Aura AI</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[var(--surface)]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md'}`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-[var(--brand)] text-[var(--bg)] rounded-tr-sm' 
                : 'bg-white border border-[var(--border)] shadow-sm text-[var(--text)] rounded-tl-sm'
            }`}>
              {msg.content || (msg.role === 'model' && isLoading && <Loader2 size={14} className="animate-spin text-[var(--muted)] my-1" />)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-[var(--border)] flex items-end gap-2">
        <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] focus-within:border-[var(--brand)] rounded-xl transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask a question..."
            className="w-full bg-transparent px-4 py-3 text-sm text-[var(--text)] outline-none resize-none max-h-32 min-h-[44px] custom-scrollbar"
            rows={1}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-3 bg-[var(--brand)] text-[var(--bg)] rounded-xl disabled:opacity-40 shadow-sm transition-all hover:brightness-110 shrink-0 h-[44px]"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
