import React, { useState } from 'react';
import { Trophy, Check, X, RefreshCw, Loader2, Copy, ExternalLink, Instagram } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { usePickLotteryWinner, useDecideRewardClaim, useAdminLotteryHistory } from "../../features/admin/hooks/useAdmin";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
};

export default function AdminLotteryTab() {
  const [winner, setWinner] = useState(null);
  
  const { mutateAsync: pickWinnerMutation, isPending: loading } = usePickLotteryWinner();
  const { mutateAsync: decideClaim, isPending: actionLoading } = useDecideRewardClaim();

  const pickWinner = async () => {
    setWinner(null);
    try {
      const data = await pickWinnerMutation();
      if (data) {
        setWinner(data);
      }
    } catch (err) { 
        // Error handled by hook
    }
  };

  const handleDecision = async (decision) => {
    if (!winner) return;
    try {
      await decideClaim({ claimId: winner.claimId, decision });
      setWinner(null);
    } catch (err) { 
      // Error handled by hook
    }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[70vh] text-center font-body animate-fadeIn pb-20">
      
      {/* HEADER ICON */}
      <div className="w-24 h-24 bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)] rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Trophy size={42} strokeWidth={1.5} />
      </div>
      
      {/* HEADER TEXT */}
      <h2 className="font-display text-4xl font-medium text-[var(--text)] mb-3 tracking-tight">Monthly Lottery Draw</h2>
      <p className="font-display italic text-[var(--sub)] text-lg mb-10 max-w-lg leading-relaxed tracking-wide">
        Pick a random user from this month's entries. Verify their Instagram follow status manually before approving the reward.
      </p>

      {/* DRAW BUTTON */}
      {!winner && (
        <button 
          onClick={pickWinner} 
          disabled={loading} 
          className="px-10 py-4 bg-[var(--brand)] text-[var(--surface)] rounded-xl font-bold text-sm tracking-wide hover:bg-[var(--brand-hover)] transition-all flex items-center gap-3 shadow-[var(--shadow-strong)] button-hero disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <><RefreshCw size={20} strokeWidth={2} className="text-[var(--surface)] opacity-90" /> Pick Random Winner</>
          )}
          {!loading && <div className="pulse border-[var(--surface)]"></div>}
        </button>
      )}

      {/* WINNER CARD */}
      <AnimatePresence mode="wait">
        {winner && (
          <motion.div 
            variants={cardVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bg-[var(--surface)] p-8 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-strong)] max-w-md w-full mt-6 relative overflow-hidden"
          >
            {/* Decorative Top Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--accent)]" />

            <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-6">Potential Winner Selected</h3>
            
            {/* User Profile */}
            <div className="flex items-center gap-4 mb-6 text-left bg-[var(--surface)] border border-[var(--border)] p-4 rounded-xl">
               <div className="w-14 h-14 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--brand)] font-body font-bold text-xl shadow-sm">
                 {winner.user.name.charAt(0).toUpperCase()}
               </div>
               <div className="min-w-0">
                 <h4 className="font-body font-bold text-base text-[var(--text)] tracking-wide truncate">{winner.user.name}</h4>
                 <p className="font-body font-bold text-[var(--sub)] text-[11px] truncate mt-1">{winner.user.email}</p>
               </div>
            </div>

            {/* Verification Proof (Instagram Handle) */}
            <div className="text-left bg-[var(--surface)] p-5 rounded-xl border border-[var(--border)] mb-8 relative">
              <div className="absolute top-4 right-4 text-[var(--border)]">
                <Instagram size={40} strokeWidth={1} />
              </div>
              <p className="font-body text-[var(--sub)] text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10">
                 Instagram Handle
              </p>
              <div className="flex items-center justify-between relative z-10 mb-2">
                {/* Changed to font-body: Data and UI elements must use Manrope */}
                <p className="font-body text-xl font-bold text-[var(--text)] truncate mr-2 tracking-tight">{winner.proof}</p>
                <button 
                  onClick={() => { navigator.clipboard.writeText(winner.proof); window.toast?.success("Handle copied!"); }}
                  className="p-2.5 bg-[var(--surface)] hover:bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg transition-colors text-[var(--muted)] hover:text-[var(--brand)] shadow-sm shrink-0"
                  title="Copy Handle"
                >
                  <Copy size={18} strokeWidth={1.5} />
                </button>
              </div>
              <a 
                href={`https://instagram.com/${winner.proof.replace('@','')}`} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-body text-[12px] font-bold text-[var(--text)] hover:text-[var(--brand)] underline underline-offset-4 decoration-[var(--border)] hover:decoration-[var(--brand)] transition-colors relative z-10"
              >
                Open Instagram Profile <ExternalLink size={14} strokeWidth={2}/>
              </a>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleDecision('reject')} 
                disabled={actionLoading} 
                className="py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] hover:border-[var(--border)] text-[var(--error)] font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
              >
                 <X size={18} strokeWidth={2} /> Not Following
              </button>
              <button 
                onClick={() => handleDecision('approve')} 
                disabled={actionLoading} 
                className="py-3.5 rounded-xl bg-[var(--success)] text-[var(--surface)] font-bold text-sm hover:brightness-110 flex items-center justify-center gap-2 shadow-[var(--shadow-strong)] transition-all disabled:opacity-70"
              >
                 {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} strokeWidth={2.5} /> Verified & Pay</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HISTORICAL WINNERS SECTION */}
      <div className="w-full max-w-4xl mt-24 text-left">
        <h3 className="font-display text-3xl font-medium text-[var(--text)] mb-8 flex items-center gap-3 pb-4 border-b border-[var(--border)]">
           Historical Winners <span className="text-lg text-[var(--sub)] font-display italic font-normal tracking-wide">(Audit Trail)</span>
        </h3>
        <HistoricalWinnersList />
      </div>
    </div>
  );
}

function HistoricalWinnersList() {
  const { data: history, isLoading } = useAdminLotteryHistory();

  if (isLoading) {
    return (
      <div className="p-16 text-center text-[var(--muted)] flex flex-col items-center justify-center bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow)]">
        <Loader2 className="animate-spin mb-4 text-[var(--accent)]" size={32} strokeWidth={1.5} />
        <p className="font-display italic text-xl tracking-wide">Loading audit trail...</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-16 text-center text-[var(--sub)] shadow-[var(--shadow)]">
        <p className="font-display italic text-xl tracking-wide">No lottery winners have been recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow)]">
      <div className="overflow-x-auto smooth-scrollbar">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-[var(--surface)] border-b border-[var(--border)] font-body text-[11px] text-[var(--muted)] uppercase tracking-widest font-bold">
              <th className="p-4 pl-6">Date Drawn</th>
              <th className="p-4">Winner</th>
              <th className="p-4 pr-6 text-right">Reward Amount</th>
            </tr>
          </thead>
          
          <motion.tbody 
            className="divide-y divide-[var(--border)]"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {history.map((log) => (
              <motion.tr key={log.id} variants={rowVariants} className="hover:bg-[var(--surface)] transition-colors duration-300 group">
                <td className="p-4 pl-6 font-body text-[12px] font-bold text-[var(--sub)]">
                  {new Date(log.drawnAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                
                <td className="p-4">
                  <div className="flex items-center gap-4">
                      {log.winner?.profileImage ? (
                        <img src={log.winner.profileImage} alt="Avatar" className="w-10 h-10 rounded-lg object-cover border border-[var(--border)] shadow-sm transition-transform duration-500 ease-out group-hover:scale-105 group-hover:border-[var(--brand)]" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[var(--surface)] text-[var(--brand)] border border-[var(--border)] flex items-center justify-center font-body text-lg font-bold shadow-sm transition-transform duration-500 ease-out group-hover:scale-105 group-hover:border-[var(--brand)]">
                          {log.winner?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-body font-bold text-sm text-[var(--text)] tracking-wide group-hover:text-[var(--brand)] transition-colors">
                          {log.winner ? log.winner.name : 'Unknown User'}
                        </div>
                      <div className="font-body font-bold text-[11px] text-[var(--sub)] mt-1">{log.winner?.email}</div>
                    </div>
                  </div>
                </td>
                
                <td className="p-4 pr-6 text-right">
                  {/* Changed to font-body: Numbers must use Manrope */}
                  <span className="font-body text-base font-bold text-[var(--success)] tracking-tight">
                    ₹{log.rewardAmount?.toLocaleString()}
                  </span>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}