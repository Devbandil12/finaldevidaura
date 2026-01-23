// src/components/UserPage/EarnCashTab.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Camera, Heart, Star, Ticket, Loader2, Check, 
  ArrowUpRight, Sparkles, TrendingUp, Clock, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@clerk/clerk-react"; // 🟢 Import Auth

const BASE = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";

// --- Utility ---
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

// --- Components (Unchanged) ---
const MissionCard = ({ icon: Icon, title, reward, description, status, actionLabel, onClick, loading }) => {
  const isPending = status === 'pending';
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={!isPending && !loading ? onClick : undefined}
      className={`group relative flex flex-col justify-between p-8 rounded-[2.5rem] border transition-all duration-500 min-h-[320px] overflow-hidden
        ${isPending 
          ? 'bg-zinc-50 border-zinc-100 cursor-wait' 
          : 'bg-white border-zinc-100 hover:border-zinc-300 hover:shadow-2xl hover:shadow-zinc-900/5 cursor-pointer'
        }
      `}
    >
      {/* Background Decor (Hover) */}
      {!isPending && (
         <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-zinc-50 to-transparent rounded-bl-[100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex justify-between items-start relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${isPending ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-white border-zinc-100 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900'}`}>
           {isPending ? <Clock size={24} /> : <Icon size={24} strokeWidth={1} />}
        </div>
        
        {isPending && (
           <span className="px-3 py-1 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
             <Loader2 size={10} className="animate-spin" /> In Review
           </span>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 mt-8 mb-6">
         <h4 className="font-serif text-3xl text-zinc-900 mb-3 group-hover:translate-x-1 transition-transform duration-300">{title}</h4>
         <p className="text-sm text-zinc-500 font-light leading-relaxed max-w-[90%]">
           {description}
         </p>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-end justify-between border-t border-zinc-50 pt-6 mt-auto">
         <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Reward</p>
            <p className="font-serif text-2xl text-zinc-900">{formatCurrency(reward)}</p>
         </div>

         {!isPending && (
            <button className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-300">
               {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUpRight size={18} />}
            </button>
         )}
      </div>
    </motion.div>
  );
};

const HistoryListItem = ({ item }) => {
    const isApproved = item.status === 'approved';
    const isPending = item.status === 'pending';
    
    return (
        <div className="flex items-center justify-between py-5 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 -mx-4 px-4 rounded-xl transition-colors group cursor-default">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isApproved ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
                    {isApproved ? <Check size={16} /> : isPending ? <Clock size={16} /> : <TrendingUp size={16} />}
                </div>
                <div>
                    <h4 className="font-serif text-lg text-zinc-900 group-hover:text-amber-700 transition-colors capitalize">
                        {item.taskType.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-xs text-zinc-400 font-mono">{formatDate(item.createdAt)}</p>
                </div>
            </div>
            <div className="text-right">
                <span className={`font-serif text-lg ${isApproved ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    {isApproved ? `+${formatCurrency(item.rewardAmount)}` : item.status}
                </span>
            </div>
        </div>
  );
};

export default function EarnCashTab({ userId }) {
  const [uploading, setUploading] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [rewards, setRewards] = useState({ paparazzi: 100, loyal_follower: 50, reviewer: 50, monthly_lottery: 500 });
  
  const { getToken } = useAuth(); // 🟢 Get Token Helper

  // 🟢 SECURE: Load Data with Token
  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = { 'Authorization': `Bearer ${token}` }; // 🔒 Auth Header

      const [configRes, historyRes] = await Promise.all([
        fetch(`${BASE}/api/rewards/config`, { headers }), // Config might be public, but history is protected
        fetch(`${BASE}/api/rewards/my-history/${userId}`, { headers })
      ]);
      
      const configData = await configRes.json();
      const historyData = await historyRes.json();
      
      if(configData && !configData.error) setRewards(configData);
      if(historyData.success) setHistory(historyData.data);
    } catch (e) { console.error(e); } 
    finally { setLoadingData(false); }
  }, [userId, getToken]);

  useEffect(() => { if(userId) loadData(); }, [userId, loadData]);

  const getStatus = (type) => {
    if (type === 'monthly_lottery') {
      const recent = history.find(h => h.taskType === type && new Date(h.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      return recent ? 'pending' : null;
    }
    const claim = history.find(h => h.taskType === type && h.status !== 'rejected');
    return claim ? claim.status : null; 
  };

  const isMissionAvailable = (type) => {
    const status = getStatus(type);
    return status !== 'approved'; 
  };

  // 🟢 SECURE: File Upload
  const handleFileUpload = async (e, taskType) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(taskType);
    
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('taskType', taskType);
    formData.append('proofImage', file);

    try {
      const token = await getToken(); // 🟢 Get Token
      const res = await fetch(`${BASE}/api/rewards/claim`, { 
          method: 'POST', 
          headers: { 'Authorization': `Bearer ${token}` }, // 🔒 Auth Header (No Content-Type for FormData)
          body: formData 
      });
      
      if (res.ok) { loadData(); if(window.toast) window.toast.success("Proof uploaded"); } 
      else { if(window.toast) window.toast.error("Upload failed"); }
    } catch (err) { console.error(err); } 
    finally { setUploading(null); e.target.value = null; }
  };

  // 🟢 SECURE: Simple Claim
  const handleSimpleClaim = async (taskType) => {
    setUploading(taskType);
    try {
      const token = await getToken(); // 🟢 Get Token
      const res = await fetch(`${BASE}/api/rewards/claim`, {
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // 🔒 Auth Header
        },
        body: JSON.stringify({ userId, taskType })
      });
      
      if (res.ok) { loadData(); if(window.toast) window.toast.success("Action verified"); }
      else { if(window.toast) window.toast.error("Verification failed"); }
    } catch (err) { console.error(err); } 
    finally { setUploading(null); }
  };

  if (loadingData) return <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-zinc-300" /></div>;

  return (
    <div className="animate-fadeIn pb-12 space-y-12">
      
      {/* 1. Header & Membership Card */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-end">
        <div className="lg:col-span-3">
            <h1 className="font-serif text-5xl md:text-7xl text-zinc-900 leading-[0.9] tracking-tight mb-6">
              The <br/> <span className="italic text-zinc-400 font-light">Ambassador</span> Club.
            </h1>
            <p className="text-zinc-500 font-light max-w-md text-sm leading-relaxed">
              Complete exclusive missions to unlock wallet credits. 
              Elevate your status and shop with your earnings.
            </p>
        </div>

        {/* Membership Status Card */}
        <div className="lg:col-span-2">
            <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-zinc-900/10 relative overflow-hidden group">
                {/* Abstract Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="relative z-10 flex justify-between items-start mb-12">
                   <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                      <Sparkles size={12} className="text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-200">Total Earned</span>
                   </div>
                   <TrendingUp className="text-zinc-600 group-hover:text-white transition-colors" />
                </div>
                
                <div className="relative z-10">
                   <h2 className="font-serif text-5xl md:text-6xl text-white">
                      {formatCurrency(history.reduce((acc, curr) => curr.status === 'approved' ? acc + curr.rewardAmount : acc, 0))}
                   </h2>
                </div>
            </div>
        </div>
      </div>

      {/* 2. Main Layout: Cards (Left) & List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8">
         
         {/* ACTIVE MISSIONS GRID */}
         <div className="lg:col-span-8">
            <div className="flex items-end justify-between mb-8 border-b border-zinc-100 pb-4">
               <h3 className="font-serif text-3xl text-zinc-900">Available Missions</h3>
            </div>
            
            <AnimatePresence>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Task 1: Paparazzi */}
                   {isMissionAvailable('paparazzi') && (
                       <>
                           <input type="file" id="paparazzi-upload" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'paparazzi')} />
                           <MissionCard 
                               icon={Camera} title="The Paparazzi" reward={rewards.paparazzi}
                               description="Post a Story with your bottle. Tag @devidaura.official. Upload screenshot."
                               loading={uploading === 'paparazzi'} status={getStatus('paparazzi')}
                               onClick={() => document.getElementById('paparazzi-upload').click()}
                           />
                       </>
                   )}

                   {/* Task 2: Follower */}
                   {isMissionAvailable('loyal_follower') && (
                       <>
                           <input type="file" id="follower-upload" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'loyal_follower')} />
                           <MissionCard 
                               icon={Heart} title="Inner Circle" reward={rewards.loyal_follower}
                               description="Follow us on Instagram to join our digital community."
                               loading={uploading === 'loyal_follower'} status={getStatus('loyal_follower')}
                               onClick={() => document.getElementById('follower-upload').click()}
                           />
                       </>
                   )}

                   {/* Task 3: Reviewer */}
                   {isMissionAvailable('reviewer') && (
                       <MissionCard 
                           icon={Star} title="The Critic" reward={rewards.reviewer}
                           description="Leave a photo review on your recent purchase."
                           loading={uploading === 'reviewer'} status={getStatus('reviewer')}
                           onClick={() => handleSimpleClaim('reviewer')}
                       />
                   )}

                   {/* Task 4: Lottery */}
                   {isMissionAvailable('monthly_lottery') && (
                       <MissionCard 
                           icon={Ticket} title="Golden Ticket" reward={rewards.monthly_lottery}
                           description="Enter the monthly draw for a chance to win store credit."
                           loading={uploading === 'monthly_lottery'} status={getStatus('monthly_lottery')}
                           onClick={() => handleSimpleClaim('monthly_lottery')}
                       />
                   )}
               </div>
            </AnimatePresence>

            {/* Empty State if all Done */}
            {!['paparazzi', 'loyal_follower', 'reviewer', 'monthly_lottery'].some(isMissionAvailable) && (
               <div className="py-20 text-center bg-zinc-50 rounded-[2.5rem] border border-dashed border-zinc-200">
                   <Sparkles className="mx-auto text-zinc-300 mb-4" size={48} strokeWidth={1} />
                   <h3 className="font-serif text-2xl text-zinc-900 mb-2">All Missions Complete</h3>
                   <p className="text-zinc-500 font-light">You've earned everything for now. Check back later for new drops.</p>
               </div>
            )}
         </div>

         {/* RECENT HISTORY LIST */}
         <div className="lg:col-span-4 pl-0 lg:pl-8 border-l border-transparent lg:border-zinc-100">
             <div className="mb-8 pt-4">
                <h3 className="font-serif text-2xl text-zinc-900 mb-1">Recent Activity</h3>
                <p className="text-xs text-zinc-400 font-light">Your mission log.</p>
             </div>
             
             <div className="space-y-6">
                {history.length === 0 ? (
                   <div className="text-zinc-400 font-light italic text-sm py-4">No activity recorded yet.</div>
                ) : (
                   history.slice(0, 6).map((item, i) => (
                      <div key={i} className="flex justify-between items-start group cursor-default">
                         <div>
                            <p className="font-medium text-zinc-900 text-sm capitalize group-hover:text-amber-600 transition-colors">
                               {item.taskType.replace(/_/g, ' ')}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{formatDate(item.createdAt)}</p>
                         </div>
                         <div className="text-right">
                            <span className={`text-sm font-bold ${item.status === 'approved' ? 'text-zinc-900' : 'text-zinc-300'}`}>
                               {item.status === 'approved' ? `+${formatCurrency(item.rewardAmount)}` : item.status}
                            </span>
                         </div>
                      </div>
                   ))
                )}
             </div>
         </div>
      </div>
    </div>
  );
}