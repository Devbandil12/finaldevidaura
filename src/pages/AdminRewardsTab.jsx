// file: src/pages/AdminRewardsTab.jsx
import React, { useEffect, useState } from 'react';
import { Check, X, Eye, Settings, Save, Loader2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

export default function AdminRewardsTab() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({ paparazzi: 100, loyal_follower: 50, reviewer: 50, monthly_lottery: 500 });
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchData = async () => {
    try {
        const claimsRes = await fetch(`${BASE}/api/rewards/admin/pending`);
        const claimsData = await claimsRes.json();
        
        // 🟢 FIX 1: Filter out BOTH Weekly and Monthly lottery entries
        // They belong in the "Lottery Draw" tab, not here.
        setClaims(claimsData.filter(c => !c.taskType.includes('lottery')));

        const configRes = await fetch(`${BASE}/api/rewards/config`);
        const configData = await configRes.json();
        setConfig(configData);

        setLoading(false);
    } catch (e) { console.error(e); setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
        await fetch(`${BASE}/api/rewards/config`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(config)
        });
        if(window.toast) window.toast.success("Reward amounts updated!");
        setShowSettings(false);
    } catch(e) { if(window.toast) window.toast.error("Failed to save"); }
    finally { setSavingConfig(false); }
  };

  const handleDecide = async (claimId, decision) => {
    setProcessing(claimId);
    try {
      const res = await fetch(`${BASE}/api/rewards/admin/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, decision })
      });
      if (res.ok) {
        if(window.toast) window.toast.success(`Claim ${decision}ed`);
        setClaims(prev => prev.filter(c => c.id !== claimId));
      }
    } catch (err) { alert("Error processing"); } 
    finally { setProcessing(null); }
  };

  // 🟢 Helper to check if proof is an image file
  // (Assuming filenames don't have spaces, handles usually start with @ or are short)
  const isImage = (proof) => {
    return !proof.includes(" ") && proof.length > 20 && !proof.startsWith("@");
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Pending Task Verifications</h2>
          <button 
             onClick={() => setShowSettings(!showSettings)}
             className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showSettings ? 'bg-zinc-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
             <Settings size={16} /> Edit Prices
          </button>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                {[
                    { label: "Story Task (₹)", key: "paparazzi" },
                    { label: "Follow Task (₹)", key: "loyal_follower" },
                    { label: "Review Bonus (₹)", key: "reviewer" },
                    { label: "Monthly Lottery (₹)", key: "monthly_lottery" }
                ].map((field) => (
                    <div key={field.key}>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{field.label}</label>
                        <input type="number" value={config[field.key]} onChange={(e) => setConfig({...config, [field.key]: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                ))}
                <button onClick={handleSaveConfig} disabled={savingConfig} className="h-[42px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 col-span-2 md:col-span-4 mt-2">
                  {savingConfig ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Update Amounts</>}
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid gap-4">
        {claims.length === 0 ? (
          <p className="text-gray-400">No pending claims.</p>
        ) : (
          claims.map(claim => (
            <div key={claim.id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                
                {/* 🟢 FIX 2: Better Proof Display (Image vs Handle) */}
                <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center relative group border border-gray-100 shrink-0">
                  {isImage(claim.proof) ? (
                     <>
                       {/* We assume backend saves filename, so we prepend 'uploads/' */}
                       <img src={`${BASE}/uploads/${claim.proof}`} className="w-full h-full object-cover" onError={(e) => e.target.src = "https://via.placeholder.com/150?text=Error"} />
                       <a href={`${BASE}/uploads/${claim.proof}`} target="_blank" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="text-white" size={20} />
                       </a>
                     </>
                  ) : (
                     <div className="text-center p-1">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Handle</span>
                        <span className="text-xs font-bold text-indigo-600 break-all">{claim.proof}</span>
                     </div>
                  )}
                </div>

                <div>
                   <h4 className="font-bold text-gray-900 capitalize">{claim.taskType.replace('_', ' ')} <span className="text-green-600 ml-2">₹{claim.rewardAmount}</span></h4>
                   <p className="text-sm text-gray-500">{claim.user?.name} ({claim.user?.email})</p>
                   {claim.adminNote && <p className="text-xs text-amber-600 mt-1 bg-amber-50 px-2 py-1 rounded w-fit">{claim.adminNote}</p>}
                </div>
              </div>

              <div className="flex gap-2">
                 <button onClick={() => handleDecide(claim.id, 'reject')} disabled={processing === claim.id} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                   <X size={20} />
                 </button>
                 <button onClick={() => handleDecide(claim.id, 'approve')} disabled={processing === claim.id} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
                   {processing === claim.id ? <Loader2 className="animate-spin" size={16} /> : <><Check size={16} /> Approve</>}
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}