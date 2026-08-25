import React, { useEffect, useState, useCallback } from 'react';
import { Users, CheckCircle, Clock, Coins, Search, ArrowRight, Settings, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@clerk/clerk-react"; // 🟢 Import Auth
import { useReferralData, useReferralsConfig, useUpdateReferralsConfig } from '../../features/admin/hooks/useAdmin';

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

// --- StatCard Component (Quiet Luxury Version) ---
const StatCard = ({ icon: Icon, label, value, iconBg, iconColor }) => (
  <div className="bg-[var(--surface)] p-6 md:p-8 rounded-xl border border-[var(--border)] shadow-[var(--shadow)] flex items-center gap-5 transition-all duration-300 hover:shadow-[var(--shadow-strong)] hover:border-[var(--border)] group cursor-default">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} border border-[var(--border)] group-hover:scale-105 transition-transform duration-500 ease-out shadow-sm`}>
      <Icon size={24} strokeWidth={1.5} />
    </div>
    <div>
      <p className="text-[var(--sub)] font-body text-[11px] uppercase tracking-widest font-bold mb-1.5">{label}</p>
      {/* Changed to font-body: Data and numbers must use Manrope */}
      <h3 className="font-body text-2xl font-bold text-[var(--text)] tracking-tight">{value}</h3>
    </div>
  </div>
);

export default function ReferralsTab() {
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState({ REFEREE_BONUS: 100, REFERRER_BONUS: 150 });

  // 🟢 Data Hooks
  const { data: referralData, isLoading: loadingData } = useReferralData();
  const { data: configData, isLoading: loadingConfig } = useReferralsConfig();
  const { mutateAsync: updateConfig, isPending: savingConfig } = useUpdateReferralsConfig();

  const loading = loadingData || loadingConfig;

  useEffect(() => {
    if (configData) {
      setLocalConfig(configData);
    }
  }, [configData]);

  // --- Save Config ---
  const handleSaveConfig = async () => {
    try {
      await updateConfig(localConfig);
      if(window.toast) window.toast.success("Offers updated successfully!");
      setShowSettings(false);
    } catch (err) {
      console.error(err);
      if(window.toast) window.toast.error("Failed to save settings");
    }
  };

  const filtered = (referralData?.referrals || []).filter(r => 
    r.referrer?.name?.toLowerCase().includes(search.toLowerCase()) || 
    r.referee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.referrer?.referralCode?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="p-16 text-center flex flex-col items-center justify-center gap-4 min-h-[50vh] animate-fadeIn">
      <Loader2 className="animate-spin text-[var(--accent)]" size={32} strokeWidth={1.5} /> 
      <p className="font-display italic text-xl text-[var(--sub)] tracking-wide">Loading referrals...</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-[var(--bg)] min-h-screen font-body animate-fadeIn transition-colors duration-300 pb-20">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-[var(--text)] tracking-tight">Referral Program</h2>
          <p className="font-display italic text-[var(--sub)] text-lg mt-2 tracking-wide">Manage reward incentives and track network growth.</p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-body font-bold text-sm tracking-wide transition-all duration-300 shadow-sm ${
            showSettings 
              ? 'bg-[var(--brand)] text-[var(--surface)] shadow-[var(--shadow-strong)]' 
              : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-muted)] hover:border-[var(--border)] hover:text-[var(--brand)]'
          }`}
        >
          <Settings size={18} strokeWidth={1.5} className={showSettings ? 'animate-spin-slow' : ''} /> 
          {showSettings ? 'Close Offers' : 'Manage Offers'}
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0, scale: 0.98 }} 
            animate={{ height: 'auto', opacity: 1, scale: 1 }} 
            exit={{ height: 0, opacity: 0, scale: 0.98 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--surface)] p-6 md:p-8 rounded-xl border border-[var(--border)] shadow-[var(--shadow-strong)] mb-6 flex flex-col md:flex-row gap-8 items-end relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--accent)] rounded-t-xl" />
              
              <div className="flex-1 w-full mt-2">
                <label className="block font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2.5 transition-colors focus-within:text-[var(--brand)]">
                  Friend Gets (Welcome Bonus)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] font-body font-bold text-sm">₹</span>
                  <input 
                    type="number" 
                    value={localConfig.REFEREE_BONUS}
                    onChange={(e) => setLocalConfig({...localConfig, REFEREE_BONUS: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-lg font-body font-bold text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all"
                  />
                </div>
                <p className="font-body text-[11px] font-bold text-[var(--sub)] mt-2">Amount given immediately to the new user.</p>
              </div>

              <div className="flex-1 w-full">
                <label className="block font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2.5 transition-colors focus-within:text-[var(--brand)]">
                  You Get (Referral Reward)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] font-body font-bold text-sm">₹</span>
                  <input 
                    type="number" 
                    value={localConfig.REFERRER_BONUS}
                    onChange={(e) => setLocalConfig({...localConfig, REFERRER_BONUS: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-lg font-body font-bold text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all"
                  />
                </div>
                <p className="font-body text-[11px] font-bold text-[var(--sub)] mt-2">Amount given to referrer after purchase.</p>
              </div>

              <button 
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="w-full md:w-auto px-8 py-3 bg-[var(--brand)] hover:brightness-110 text-[var(--bg)] rounded-lg font-body font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] disabled:opacity-50 button-hero"
              >
                {savingConfig ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} strokeWidth={2} /> Save Changes</>}
                {!savingConfig && <div className="pulse border-[#F5F1E8]"></div>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Referrals" value={referralData?.stats?.total || 0} iconBg="bg-[var(--surface-muted)]" iconColor="text-[var(--text)]" />
        <StatCard icon={CheckCircle} label="Completed" value={referralData?.stats?.completed || 0} iconBg="bg-[var(--surface)]" iconColor="text-[var(--success)]" />
        <StatCard icon={Clock} label="Pending" value={referralData?.stats?.pending || 0} iconBg="bg-[var(--surface)]" iconColor="text-[var(--brand)]" />
        <StatCard icon={Coins} label="Total Payout" value={`₹${referralData?.stats?.totalPayout || 0}`} iconBg="bg-[var(--accent-soft)]" iconColor="text-[var(--brand)]" />
      </div>

      {/* Table Section */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-[var(--shadow)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-display text-2xl font-medium text-[var(--text)]">Referral History</h3>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--brand)] transition-colors" size={18} strokeWidth={1.5} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users or codes..."
              className="pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--brand)] rounded-lg text-sm font-bold text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-all w-full sm:w-72"
            />
          </div>
        </div>

        <div className="overflow-x-auto smooth-scrollbar">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead className="bg-[var(--surface)] border-b border-[var(--border)] font-body text-[11px] text-[var(--muted)] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">Referrer (From)</th>
                <th className="px-6 py-4">Referee (To)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Friend Got</th>
                <th className="px-6 py-4 text-right">Referrer Gets</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center text-[var(--sub)] font-display italic text-xl tracking-wide border-t border-[var(--border)]">
                    No referrals found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--surface)] transition-colors duration-300 group cursor-default">
                    <td className="px-6 py-4">
                      <p className="font-body font-bold text-[var(--text)] group-hover:text-[var(--brand)] transition-colors tracking-wide">{item.referrer?.name || "Unknown"}</p>
                      <span className="inline-block mt-1 font-body text-[10px] uppercase font-bold tracking-widest bg-[var(--surface-muted)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--muted)] group-hover:border-[var(--border)] group-hover:text-[var(--text)] transition-colors">
                        {item.referrer?.referralCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ArrowRight size={14} strokeWidth={2} className="text-[var(--muted)] shrink-0 group-hover:text-[var(--brand)] transition-colors" />
                        <div className="min-w-0">
                          <p className="font-body font-bold text-[var(--text)] group-hover:text-[var(--brand)] transition-colors tracking-wide truncate">{item.referee?.name || "Unknown"}</p>
                          <p className="font-body text-[11px] font-bold text-[var(--sub)] truncate mt-0.5">{item.referee?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-md font-body text-[10px] uppercase tracking-widest font-bold border transition-colors ${
                        item.status === 'completed' 
                          ? 'bg-[var(--surface)] text-[var(--success)] border-[var(--border)]' 
                          : 'bg-[var(--surface-muted)] text-[var(--brand)] border-transparent'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    {/* Data/Numbers must be font-body */}
                    <td className="px-6 py-4 text-center font-body text-base font-bold text-[var(--success)] tracking-tight">
                      ₹{item.refereeBonus || 0}
                    </td>
                    <td className="px-6 py-4 text-right font-body text-base font-bold text-[var(--text)] tracking-tight group-hover:text-[var(--brand)] transition-colors">
                      ₹{item.rewardAmount}
                    </td>
                    <td className="px-6 py-4 text-right font-body text-[12px] font-bold text-[var(--sub)]">
                      {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}