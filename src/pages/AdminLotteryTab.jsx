// file: src/pages/AdminLotteryTab.jsx
import React, { useState } from 'react';
import { Trophy, Check, X, RefreshCw, Loader2, Copy, ExternalLink } from 'lucide-react'; // 🟢 Added Icons
import { motion, AnimatePresence } from 'framer-motion';

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

export default function AdminLotteryTab() {
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const pickWinner = async () => {
    setLoading(true);
    setWinner(null);
    try {
      const res = await fetch(`${BASE}/api/rewards/admin/pick-lottery-winner`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setWinner(data);
      } else {
        if(window.toast) window.toast.error(data.error);
        else alert(data.error || "No entries found");
      }
    } catch (err) { alert("Failed to pick"); } 
    finally { setLoading(false); }
  };

  const handleDecision = async (decision) => {
    if (!winner) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${BASE}/api/rewards/admin/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId: winner.claimId, decision })
      });
      if (res.ok) {
        if(window.toast) window.toast.success(decision === 'approve' ? "Winner Verified & Paid!" : "Rejected. Pick again.");
        setWinner(null);
      }
    } catch (err) { alert("Error"); } 
    finally { setActionLoading(false); }
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
        <Trophy size={40} />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Monthly Lottery Draw</h2>
      <p className="text-gray-500 mb-8 max-w-md">Pick a random user from this month's entries. Verify they follow us on Instagram manually before approving.</p>

      {!winner && (
        <button onClick={pickWinner} disabled={loading} className="px-8 py-4 bg-zinc-900 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-3 shadow-xl shadow-zinc-200">
          {loading ? <Loader2 className="animate-spin" /> : <><RefreshCw /> Pick Random Winner</>}
        </button>
      )}

      <AnimatePresence>
        {winner && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xl max-w-md w-full mt-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Potential Winner Selected</h3>
            
            <div className="flex items-center gap-4 mb-6 text-left bg-gray-50 p-4 rounded-xl">
               <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl">{winner.user.name.charAt(0)}</div>
               <div>
                 <h4 className="font-bold text-lg">{winner.user.name}</h4>
                 <p className="text-gray-500 text-sm">{winner.user.email}</p>
               </div>
            </div>

            {/* 🟢 FIX: Show Instagram Handle Clearly */}
            <div className="text-left bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-100 mb-6">
              <p className="text-pink-800 text-xs font-bold uppercase tracking-wider mb-2">Instagram Handle</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900">{winner.proof}</p>
                <button 
                  onClick={() => { navigator.clipboard.writeText(winner.proof); window.toast.success("Handle copied!"); }}
                  className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-gray-900"
                  title="Copy Handle"
                >
                  <Copy size={20} />
                </button>
              </div>
              <a 
                href={`https://instagram.com/${winner.proof.replace('@','')}`} 
                target="_blank" 
                className="mt-3 text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
              >
                Open Instagram Profile <ExternalLink size={12}/>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleDecision('reject')} disabled={actionLoading} className="py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 flex items-center justify-center gap-2">
                 <X size={18} /> Not Following
              </button>
              <button onClick={() => handleDecision('approve')} disabled={actionLoading} className="py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                 {actionLoading ? <Loader2 className="animate-spin" /> : <><Check size={18} /> Verified & Pay</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}