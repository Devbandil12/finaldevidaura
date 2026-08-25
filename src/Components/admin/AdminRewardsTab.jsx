import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Settings, Save, Loader2, Image as ImageIcon, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  usePendingRewardClaims, 
  useRewardsConfig, 
  useUpdateRewardsConfig, 
  useDecideRewardClaim 
} from "../../features/admin/hooks/useAdmin";

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

// --- ANIMATION VARIANTS ---
const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function AdminRewardsTab() {
  const [processing, setProcessing] = useState(null);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState({ paparazzi: 100, loyal_follower: 50, reviewer: 50, monthly_lottery: 500 });

  // 🟢 TanStack Hooks
  const { data: claimsData = [], isLoading: loadingClaims } = usePendingRewardClaims();
  const { data: configData, isLoading: loadingConfig } = useRewardsConfig();
  const { mutateAsync: updateConfig, isPending: savingConfig } = useUpdateRewardsConfig();
  const { mutateAsync: decideClaim } = useDecideRewardClaim();

  // Filter out lottery entries (handled in separate tab)
  const claims = claimsData.filter(c => !c.taskType.includes('lottery'));
  const loading = loadingClaims || loadingConfig;

  useEffect(() => {
    if (configData) {
      setLocalConfig(configData);
    }
  }, [configData]);

  const handleSaveConfig = async () => {
    await updateConfig(localConfig);
    setShowSettings(false);
  };

  const handleDecide = async (claimId, decision) => {
    setProcessing(claimId);
    try {
      await decideClaim({ claimId, decision });
    } finally {
      setProcessing(null);
    }
  };

  // Helper to check if proof is an image file
  const isImage = (proof) => {
    return !proof.includes(" ") && proof.length > 20 && !proof.startsWith("@");
  };

  if (loading) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center gap-4 min-h-[50vh] animate-fadeIn">
        <Loader2 className="animate-spin text-[var(--accent)]" size={32} strokeWidth={1.5} /> 
        <p className="font-display italic text-xl text-[var(--sub)] tracking-wide">Loading claims...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto font-body animate-fadeIn">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
        <div>
           <h2 className="font-display text-3xl font-medium text-[var(--text)]">Task Verifications</h2>
           <p className="text-[var(--sub)] text-base mt-2 font-display italic tracking-wide">Review and approve user reward claims.</p>
        </div>
        
        <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-body font-bold text-sm transition-all duration-300 shadow-sm ${
              showSettings 
                ? 'bg-[var(--brand)] text-[var(--surface)] shadow-[var(--shadow-strong)]' 
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-muted)] hover:border-[var(--border)] hover:text-[var(--brand)]'
            }`}
        >
            <Settings size={18} strokeWidth={1.5} className={showSettings ? 'animate-spin-slow' : ''} /> 
            {showSettings ? 'Close Settings' : 'Edit Reward Values'}
        </button>
      </div>

      {/* SETTINGS PANEL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0, scale: 0.98 }} 
            animate={{ height: 'auto', opacity: 1, scale: 1 }} 
            exit={{ height: 0, opacity: 0, scale: 0.98 }} 
            className="overflow-hidden mb-8"
          >
            <div className="bg-[var(--surface)] p-6 md:p-8 rounded-xl border border-[var(--border)] shadow-[var(--shadow-strong)] relative">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--accent)] rounded-t-xl" />
                <h3 className="font-body text-[11px] uppercase tracking-widest font-bold text-[var(--muted)] mb-6">Global Reward Pricing</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
                  {[
                      { label: "Story Task (₹)", key: "paparazzi" },
                      { label: "Follow Task (₹)", key: "loyal_follower" },
                      { label: "Review Bonus (₹)", key: "reviewer" },
                      { label: "Monthly Lottery (₹)", key: "monthly_lottery" }
                  ].map((field) => (
                      <div key={field.key} className="group">
                          <label className="block font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2.5 transition-colors group-focus-within:text-[var(--brand)]">
                            {field.label}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] font-body font-bold text-sm">₹</span>
                            <input 
                              type="number" 
                              value={localConfig[field.key]} 
                              onChange={(e) => setLocalConfig({...localConfig, [field.key]: e.target.value})} 
                              className="w-full pl-8 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-lg font-body font-bold text-sm text-[var(--text)] transition-all outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]" 
                            />
                          </div>
                      </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-end">
                  <button 
                    onClick={handleSaveConfig} 
                    disabled={savingConfig} 
                    className="px-8 py-3 bg-[var(--brand)] hover:brightness-110 text-[var(--surface)] rounded-lg font-body font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] disabled:opacity-50 button-hero"
                  >
                    {savingConfig ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} strokeWidth={2} /> Update Values</>}
                    {!savingConfig && <div className="pulse border-[var(--surface)]"></div>}
                  </button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* CLAIMS LIST */}
      <div className="grid gap-4">
        {claims.length === 0 ? (
          <div className="bg-[var(--surface)] p-16 rounded-xl border border-[var(--border)] shadow-[var(--shadow)] flex flex-col items-center justify-center text-[var(--muted)]">
             <Check size={48} strokeWidth={1.5} className="mb-4 text-[var(--accent)]" />
             <p className="font-display italic text-xl text-[var(--sub)] tracking-wide">All caught up! No pending claims to review.</p>
          </div>
        ) : (
          <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-4">
            {claims.map(claim => (
              <motion.div key={claim.id} variants={itemVariants} className="bg-[var(--surface)] p-4 md:p-6 rounded-xl border border-[var(--border)] hover:border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between shadow-[var(--shadow)] transition-colors duration-300 gap-5 group">
                
                <div className="flex flex-row items-center gap-5">
                  {/* PROOF THUMBNAIL */}
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-[var(--surface)] rounded-lg overflow-hidden flex flex-col items-center justify-center relative border border-[var(--border)] shrink-0 group-hover:border-[var(--brand)] transition-colors">
                    {isImage(claim.proof) ? (
                        <>
                          <img 
                            src={`${BASE}/uploads/${claim.proof}`} 
                            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
                            onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.png"; }} 
                            alt="Proof"
                          />
                          <a 
                            href={`${BASE}/uploads/${claim.proof}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="absolute inset-0 bg-[var(--overlay-light)] backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <Eye className="text-[var(--text)] drop-shadow-md" size={24} strokeWidth={2} />
                          </a>
                        </>
                     ) : (
                        <div className="text-center p-2 w-full flex flex-col items-center justify-center h-full transition-colors">
                          <AtSign size={18} className="text-[var(--muted)] mb-1 transition-colors group-hover:text-[var(--brand)]" />
                          <span className="font-body text-[9px] text-[var(--muted)] uppercase font-bold tracking-widest block mb-1">Handle</span>
                          <span className="font-body text-[12px] font-bold text-[var(--text)] break-all px-1 leading-tight group-hover:text-[var(--brand)] transition-colors">{claim.proof}</span>
                        </div>
                     )}
                  </div>

                  {/* CLAIM INFO */}
                  <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h4 className="font-body font-bold text-base text-[var(--text)] capitalize tracking-wide group-hover:text-[var(--brand)] transition-colors">
                          {claim.taskType.replace(/_/g, ' ')}
                        </h4>
                        <span className="font-body font-bold text-base text-[var(--success)] tracking-tight bg-[var(--surface)] px-2.5 py-0.5 rounded-md border border-[var(--border)]">
                          ₹{claim.rewardAmount}
                        </span>
                      </div>
                      
                      <p className="font-body text-sm text-[var(--sub)] truncate">
                        <span className="font-bold text-[var(--text)]">{claim.user?.name}</span> <span className="text-[11px] font-bold opacity-80">({claim.user?.email})</span>
                      </p>
                      
                      {claim.adminNote && (
                        <div className="mt-3 bg-[var(--accent-soft)] border border-transparent text-[var(--brand)] px-3 py-1.5 rounded-md w-fit shadow-sm">
                          <p className="font-body font-bold text-xs">{claim.adminNote}</p>
                        </div>
                      )}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-3 md:ml-auto w-full md:w-auto justify-end pt-4 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                    <button 
                      onClick={() => handleDecide(claim.id, 'reject')} 
                      disabled={processing === claim.id} 
                      className="px-5 py-2.5 text-[var(--error)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] border border-[var(--border)] hover:border-[var(--border)] rounded-lg transition-all font-body font-bold text-sm flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                      <X size={18} strokeWidth={2} /> <span className="md:hidden">Reject</span>
                    </button>
                    <button 
                      onClick={() => handleDecide(claim.id, 'approve')} 
                      disabled={processing === claim.id} 
                      className="px-6 py-2.5 bg-[var(--success)] text-[var(--surface)] rounded-lg font-body font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2 shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] disabled:opacity-70"
                    >
                      {processing === claim.id ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} strokeWidth={2.5} /> Approve</>}
                    </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}