import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, Package, CheckCircle2, X, UserCog, Star, 
  ShieldAlert, User as UserIcon, Lock, Clock, Ticket, 
  ChevronRight, Filter, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- STYLES ---
const FILTER_BTN = (active) => `
  px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all
  ${active 
    ? 'bg-zinc-900 text-white shadow-lg' 
    : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
  }
`;

export default function ActivityLogTab({ orders, tickets, reviews, securityLogs, onNavigate }) {
  const [filter, setFilter] = useState("all");

  const activityItems = useMemo(() => {
    let items = [];
    const UPDATE_THRESHOLD = 60 * 60 * 1000;

    // 1. Orders
    (orders || []).forEach(o => {
      items.push({ 
        id: `ord-cr-${o.id}`, type: 'order_created', date: new Date(o.createdAt), 
        title: `Order Placed`, subtitle: `#${o.id.slice(-6).toUpperCase()} • ₹${o.totalAmount}`, 
        data: o, icon: ShoppingBag, color: 'text-zinc-600 bg-zinc-50 border-zinc-100', actionable: true 
      });

      if (new Date(o.updatedAt) > new Date(o.createdAt).getTime() + UPDATE_THRESHOLD) {
        let statusTitle = `Order ${o.status}`;
        let icon = Package;
        let color = 'text-blue-600 bg-blue-50 border-blue-100';
        
        if (o.status.toLowerCase() === 'delivered') { 
            statusTitle = "Delivered"; 
            icon = CheckCircle2; 
            color = 'text-emerald-600 bg-emerald-50 border-emerald-100'; 
        } else if (o.status.toLowerCase().includes('cancel')) { 
            statusTitle = "Cancelled"; 
            icon = X; 
            color = 'text-rose-600 bg-rose-50 border-rose-100'; 
        }
        
        items.push({ 
          id: `ord-up-${o.id}`, type: 'order_updated', date: new Date(o.updatedAt), 
          title: statusTitle, subtitle: `#${o.id.slice(-6).toUpperCase()}`, 
          data: o, icon: icon, color: color, actionable: true 
        });
      }
    });

    // 2. Tickets
    (tickets || []).forEach(t => {
      items.push({ 
        id: `tkt-${t.id}`, type: 'ticket', date: new Date(t.createdAt), 
        title: `Support Ticket ${t.status === 'open' ? 'Opened' : 'Updated'}`, subtitle: t.subject, 
        data: t, icon: Ticket, color: 'text-amber-600 bg-amber-50 border-amber-100', actionable: true 
      });
    });

    // 3. Reviews
    (reviews || []).forEach(r => {
      items.push({ 
        id: `rev-${r.id}`, type: 'review', date: new Date(r.createdAt), 
        title: "Review Added", subtitle: "You rated a product", 
        data: r, icon: Star, color: 'text-purple-600 bg-purple-50 border-purple-100', actionable: true 
      });
    });

    // 4. Security Logs
    (securityLogs || []).forEach(log => {
      let title = "System Event";
      let icon = UserCog;
      let color = 'text-zinc-400 bg-zinc-50 border-zinc-100';
      
      switch (log.action) {
        case 'ADMIN_UPDATE': case 'PROFILE_UPDATE': title = "Profile Updated"; icon = ShieldAlert; break;
        case 'ACCOUNT_CREATED': title = "Welcome to Aura"; icon = Sparkles; color = 'text-amber-500 bg-amber-50 border-amber-100'; break;
        case 'LOGIN': title = "Secure Login"; icon = Lock; break;
        default: title = log.action ? log.action.replace(/_/g, ' ') : "System Log"; break;
      }
      
      items.push({ 
        id: log.id || `sys-${Math.random()}`, type: 'security', date: new Date(log.createdAt), 
        title: title, subtitle: log.description || "Account activity detected", 
        data: log, icon: icon, color: color, actionable: false 
      });
    });

    return items.sort((a, b) => b.date - a.date);
  }, [orders, tickets, reviews, securityLogs]);

  const filteredItems = filter === 'all' 
    ? activityItems 
    : activityItems.filter(i => i.type.includes(filter) || (filter === 'security' && i.type === 'security'));

  const grouped = filteredItems.reduce((acc, item) => {
    const d = item.date;
    const key = d.toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : 
                d.toLocaleDateString() === new Date(Date.now() - 86400000).toLocaleDateString() ? 'Yesterday' : 
                d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-fadeIn h-full flex flex-col">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-100">
         <div>
            <h2 className="font-serif text-3xl font-medium text-zinc-900 tracking-tight flex items-center gap-3">
               <Clock size={28} className="text-zinc-300" strokeWidth={1} /> Activity Log
            </h2>
            <p className="text-zinc-500 font-light text-sm mt-1 font-sans">Track your interactions and account security.</p>
         </div>
         
         <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter('all')} className={FILTER_BTN(filter === 'all')}>All</button>
            <button onClick={() => setFilter('order')} className={FILTER_BTN(filter === 'order')}>Orders</button>
            <button onClick={() => setFilter('ticket')} className={FILTER_BTN(filter === 'ticket')}>Support</button>
            <button onClick={() => setFilter('security')} className={FILTER_BTN(filter === 'security')}>System</button>
         </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-10">
        {Object.keys(grouped).length === 0 && (
           <div className="text-center py-20 opacity-50">
              <Filter className="mx-auto text-zinc-300 mb-3" size={32} />
              <p className="text-zinc-400 font-light">No activity found for this filter.</p>
           </div>
        )}

        {Object.entries(grouped).map(([label, groupItems], groupIdx) => (
          <motion.div 
            key={label} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: groupIdx * 0.1 }}
          >
            <div className="sticky top-0 bg-[#FDFDFD] z-10 py-2 mb-4">
               <span className="inline-block px-3 py-1 bg-zinc-100 rounded-lg text-[10px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-200">
                  {label}
               </span>
            </div>
            
            <div className="space-y-4 relative ml-4 pl-8 border-l border-zinc-100">
              {groupItems.map((item) => (
                <motion.div 
                  layout
                  key={item.id}
                  onClick={() => item.actionable && onNavigate(item)}
                  className={`relative group flex items-start justify-between p-4 rounded-2xl border transition-all
                    ${item.actionable 
                      ? 'bg-white border-zinc-100 hover:border-zinc-300 hover:shadow-md cursor-pointer' 
                      : 'bg-zinc-50/50 border-transparent cursor-default'
                    }
                  `}
                >
                  {/* Timeline Dot */}
                  <div className="absolute -left-[39px] top-6 w-3 h-3 rounded-full bg-white border-2 border-zinc-200 group-hover:border-zinc-900 group-hover:scale-110 transition-all z-20"></div>
                  
                  <div className="flex gap-4 items-start">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 ${item.color}`}>
                        <item.icon size={20} strokeWidth={1.5} />
                      </div>
                      
                      <div className="min-w-0 pt-0.5">
                        <h4 className={`text-base font-medium ${item.actionable ? 'text-zinc-900' : 'text-zinc-600'}`}>{item.title}</h4>
                        <p className="text-sm text-zinc-500 truncate font-light mt-0.5 max-w-[200px] sm:max-w-md">{item.subtitle}</p>
                      </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 pl-4">
                      <span className="text-[10px] text-zinc-400 font-mono font-bold tracking-wide">
                        {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {item.actionable && (
                        <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                            <ChevronRight size={14} />
                        </div>
                      )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}