import React, { useState, useEffect } from 'react';
import { 
  Loader2, Copy, Check, ArrowUpRight, ArrowDownLeft, 
  Sparkles, CreditCard, Ticket, History 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

// --- Utils ---
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

export default function WalletTab({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Fetch Logic
  const fetchData = async () => {
    try {
      const res = await fetch(`${BASE}/api/referrals/stats/${userId}`);
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { if(userId) fetchData(); }, [userId]);

  // Actions
  const handleCopy = () => {
    navigator.clipboard.writeText(data?.referralCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!redeemCode) return;
    setIsRedeeming(true);
    try {
      const res = await fetch(`${BASE}/api/referrals/apply`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId, code: redeemCode })
      });
      const d = await res.json();
      if (res.ok) { 
        if(window.toast) window.toast.success(d.message); 
        setRedeemCode(""); fetchData(); 
      } else {
        if(window.toast) window.toast.error(d.error);
      }
    } catch (err) { console.error(err); }
    finally { setIsRedeeming(false); }
  };

  if (loading) return <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-zinc-300" /></div>;

  return (
    <div className="animate-fadeIn space-y-12 pb-10">
      
      {/* 1. Header */}
      <div className="flex flex-col gap-2">
         <h1 className="font-serif text-5xl text-zinc-900">Aura Circle</h1>
         <p className="text-zinc-500 font-light max-w-md">Manage your credits, redeem exclusive codes, and track your rewards history.</p>
      </div>

      {/* 2. The Black Card (Wallet Balance) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7">
           <div className="relative overflow-hidden bg-zinc-900 text-white rounded-[2.5rem] p-10 shadow-2xl shadow-zinc-900/20 min-h-[340px] flex flex-col justify-between group">
              {/* Card Texture */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
              <div className="absolute top-[-50%] right-[-20%] w-[500px] h-[500px] bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

              {/* Top */}
              <div className="relative z-10 flex justify-between items-start">
                 <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-md">
                    <Sparkles size={12} className="text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Premium Member</span>
                 </div>
                 <CreditCard className="text-zinc-600 group-hover:text-zinc-500 transition-colors" />
              </div>

              {/* Center */}
              <div className="relative z-10">
                 <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Total Balance</p>
                 <h2 className="font-serif text-6xl md:text-7xl tracking-tighter">{formatCurrency(data?.walletBalance || 0)}</h2>
              </div>

              {/* Bottom */}
              <div className="relative z-10 flex items-end justify-between border-t border-white/10 pt-6 mt-6">
                 <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Referral Code</p>
                    <div className="flex items-center gap-3 mt-1 cursor-pointer group/copy" onClick={handleCopy}>
                       <span className="font-mono text-xl tracking-wider text-white">{data?.referralCode || "----"}</span>
                       {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-zinc-600 group-hover/copy:text-white transition-colors" />}
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Lifetime Earned</p>
                    <p className="font-mono text-lg text-emerald-400">+ {formatCurrency(data?.stats?.totalEarnings || 0)}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* 3. Redeem Section */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">
           <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 flex-1 flex flex-col justify-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                     <Ticket size={20} />
                  </div>
                  <h3 className="font-serif text-2xl text-zinc-900">Redeem Code</h3>
               </div>
               <form onSubmit={handleRedeem} className="space-y-4">
                  <input 
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    placeholder="Enter promo code" 
                    className="w-full bg-zinc-50 border-0 rounded-xl px-5 py-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900/10 uppercase tracking-wide transition-all"
                  />
                  <button 
                    disabled={isRedeeming || !redeemCode}
                    className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  >
                    {isRedeeming ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Apply to Wallet"}
                  </button>
               </form>
           </div>
        </div>
      </div>

      {/* 4. Transactions List */}
      <div>
         <div className="flex items-baseline justify-between mb-8 px-2 border-b border-zinc-100 pb-4">
            <h3 className="font-serif text-2xl text-zinc-900">Transaction History</h3>
         </div>
         
         <div className="flex flex-col gap-4">
            {(!data?.history || data.history.length === 0) ? (
               <div className="text-center py-20 text-zinc-400 font-light italic">No transactions found</div>
            ) : (
               data.history.map((tx, i) => {
                 const isCredit = tx.amount > 0;
                 return (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group flex items-center justify-between p-6 bg-white border border-zinc-100 rounded-[2rem] hover:border-zinc-300 transition-all duration-300"
                    >
                       <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isCredit ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
                             {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                          </div>
                          <div>
                             <p className="font-serif text-lg text-zinc-900 group-hover:text-amber-600 transition-colors">{tx.description}</p>
                             <p className="text-xs text-zinc-400 mt-0.5 font-mono">{new Date(tx.createdAt).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <span className={`font-mono text-lg font-bold ${isCredit ? 'text-emerald-600' : 'text-zinc-900'}`}>
                          {isCredit ? '+' : ''}{formatCurrency(tx.amount)}
                       </span>
                    </motion.div>
                 )
               })
            )}
         </div>
      </div>

    </div>
  );
}