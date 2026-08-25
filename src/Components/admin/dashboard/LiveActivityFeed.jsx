import React from 'react';
import { Activity, ShoppingCart, UserPlus, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const LiveActivityFeed = ({ activities = [], setActiveTab }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="bg-gradient-to-b from-[var(--surface)] to-[var(--surface-muted)]/30 ring-1 ring-[var(--border)]/30 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden h-full flex flex-col relative"
    >
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('/noise.png')] opacity-[var(--grain-opacity)]" />
      
      <div className="px-8 py-6 border-b border-[var(--border)]/30 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-[var(--surface)] ring-1 ring-[var(--border)]/40 flex items-center justify-center shadow-sm">
            <Activity size={20} strokeWidth={1.5} className="text-[var(--brand)]" />
          </div>
          <h3 className="font-display font-medium text-xl text-[var(--text)] tracking-tight">Recent Activity</h3>
        </div>
        <button onClick={() => setActiveTab('logs')} className="flex items-center gap-2 text-xs font-bold font-body text-[var(--sub)] hover:text-[var(--brand)] transition-all duration-500 px-4 py-2 rounded-full ring-1 ring-[var(--border)]/40 bg-[var(--surface)] hover:shadow-md">
          View All <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 smooth-scrollbar relative z-10">
        {(!activities || activities.length === 0) ? (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--sub)] text-xl font-display tracking-tight">
            No recent activity.
          </div>
        ) : (
          <div className="space-y-6 relative">
            {/* Elegant glowing timeline rule */}
            <div className="absolute left-[1.95rem] top-6 bottom-4 w-[1px] bg-gradient-to-b from-[var(--border)] via-[var(--border)]/50 to-transparent z-0 hidden sm:block"></div>

            {activities.map((activity, idx) => {
              const isOrder = activity.type === 'ORDER';

              return (
                <motion.div
                  key={`${activity.id || idx}-${idx}`}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="relative z-10 flex items-start gap-6 p-5 bg-[var(--surface)] rounded-[1.75rem] ring-1 ring-[var(--border)]/40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm hover:shadow-lg hover:ring-[var(--brand)]/30 group"
                >
                  <div className={`mt-0.5 p-3 rounded-[1.25rem] ring-1 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:-rotate-3 ${isOrder
                      ? 'bg-[var(--text)] ring-[var(--text)] text-[var(--surface)] shadow-[0_4px_20px_rgba(0,0,0,0.1)]'
                      : 'bg-[var(--surface-muted)] ring-[var(--border)]/50 text-[var(--sub)] group-hover:text-[var(--brand)]'
                    }`}>
                    {isOrder ? <ShoppingCart size={18} strokeWidth={1.5} /> : <UserPlus size={18} strokeWidth={1.5} />}
                  </div>

                  <div className="flex-1 min-w-0 pt-1.5">
                    <p className="text-base font-body font-medium text-[var(--text)] leading-relaxed group-hover:text-[var(--brand)] transition-colors duration-500">
                      {activity.message}
                    </p>
                    <span className="text-[11px] text-[var(--muted)] uppercase tracking-widest font-bold mt-2.5 block">
                      {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiveActivityFeed;