import React, { useState, useEffect } from 'react';
import { Camera, Heart, Star, Ticket, Loader2, Upload, CheckCircle, Clock, AlertCircle, ChevronRight, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

// 🌟 Luxury Card Component
const LuxuryTaskCard = ({ icon: Icon, title, reward, description, buttonText, onClick, loading, status, colorClass }) => {
  const isCompleted = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';
  
  // Disable if pending or completed (allow retry if rejected or null)
  const isDisabled = loading || isCompleted || isPending;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: isDisabled ? 0 : -5 }}
      className={`relative overflow-hidden rounded-[2rem] p-6 border transition-all duration-300 flex flex-col h-full
        ${isCompleted ? 'bg-zinc-50 border-zinc-200 opacity-90' : 'bg-white border-zinc-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] hover:shadow-2xl hover:border-amber-100'}
      `}
    >
      {/* Decorative Gradient Blob */}
      <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${colorClass} opacity-[0.08] rounded-bl-[100%] pointer-events-none`} />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-zinc-900 text-amber-400'}`}>
          {isCompleted ? <CheckCircle size={24} strokeWidth={2} /> : <Icon size={24} strokeWidth={1.5} />}
        </div>
        <div className="flex flex-col items-end">
             <span className="text-2xl font-serif font-bold text-zinc-900">₹{reward}</span>
             {isRejected && <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full mt-1 border border-red-100">Rejected</span>}
             {isPending && <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full mt-1 border border-amber-100">In Review</span>}
        </div>
      </div>

      <h3 className="text-lg font-bold text-zinc-900 mb-2 relative z-10">{title}</h3>
      <p className="text-sm text-zinc-500 mb-8 flex-1 leading-relaxed font-light relative z-10">{description}</p>

      <button 
        onClick={onClick}
        disabled={isDisabled}
        className={`w-full py-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all relative z-10
          ${isCompleted 
            ? 'bg-green-500 text-white cursor-default shadow-lg shadow-green-200' 
            : isPending 
              ? 'bg-amber-100 text-amber-700 cursor-wait'
              : 'bg-zinc-900 text-white hover:bg-black active:scale-95 shadow-xl shadow-zinc-900/20'
          }
        `}
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : 
         isCompleted ? <><CheckCircle size={18} /> Reward Claimed</> :
         isPending ? <><Clock size={18} /> Verifying...</> :
         isRejected ? "Retry Upload" :
         <>{buttonText} <ChevronRight size={14} /></>
        }
      </button>
    </motion.div>
  );
};

export default function EarnCashTab({ userId }) {
  const [uploading, setUploading] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // 🟢 Dynamic Reward Values
  const [rewards, setRewards] = useState({
    paparazzi: 100,
    loyal_follower: 50,
    reviewer: 50,
    monthly_lottery: 500
  });

  // 🟢 Load Config & History
  const loadData = async () => {
    try {
      const [configRes, historyRes] = await Promise.all([
        fetch(`${BASE}/api/rewards/config`),
        fetch(`${BASE}/api/rewards/my-history/${userId}`)
      ]);

      const configData = await configRes.json();
      const historyData = await historyRes.json();

      if(configData) setRewards(configData);
      if(historyData.success) setHistory(historyData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if(userId) loadData();
  }, [userId]);

  // 🟢 Status Checker
  const getStatus = (type) => {
    // Lottery special check (only disable if entry within 30 days)
    if (type === 'monthly_lottery') {
      const recent = history.find(h => h.taskType === type && new Date(h.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      return recent ? 'pending' : null;
    }
    // Find most recent non-rejected claim
    const claim = history.find(h => h.taskType === type && h.status !== 'rejected');
    return claim ? claim.status : history.find(h => h.taskType === type)?.status; // fallback to rejected status if exists
  };

  // 🟢 Handlers
  const handleFileUpload = async (e, taskType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(taskType);
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('taskType', taskType);
    formData.append('proofImage', file);

    try {
      const res = await fetch(`${BASE}/api/rewards/claim`, { method: 'POST', body: formData });
      const data = await res.json();
      
      if (res.ok) {
        window.toast.success(data.message);
        loadData(); // Refresh UI immediately
      } else {
        window.toast.error(data.error || "Upload failed");
      }
    } catch (err) {
      window.toast.error("Network Error");
    } finally {
      setUploading(null);
      e.target.value = null; // Clear input
    }
  };

  const handleSimpleClaim = async (taskType) => {
    setUploading(taskType);
    try {
      const res = await fetch(`${BASE}/api/rewards/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, taskType })
      });
      const data = await res.json();
      
      if (res.ok) {
        window.toast.success(data.message);
        loadData();
      } else {
        window.toast.error(data.error);
      }
    } catch (err) {
      window.toast.error("Failed to claim");
    } finally {
      setUploading(null);
    }
  };

  if (loadingData) return <div className="p-20 text-center"><Loader2 className="animate-spin inline text-zinc-300" /></div>;

  return (
    <div className="space-y-12 pb-10">
      
      {/* 1. Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 p-8 md:p-12 text-center text-white shadow-2xl">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-[100px]" />
             <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/5 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-6 shadow-lg">
               <Star size={10} className="fill-amber-400" /> 
               <span>Aura Circle Rewards</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif tracking-tight mb-4">
              Turn Your Loyalty into <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Luxury.</span>
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto font-light text-sm md:text-base leading-relaxed">
              Complete exclusive tasks to earn instant cash credits. 100% usable on your next Devid Aura purchase.
            </p>
        </div>
      </div>

      {/* 2. Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Paparazzi */}
        <div>
           <input type="file" id="paparazzi-upload" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'paparazzi')} />
           <LuxuryTaskCard 
             icon={Camera}
             title="The Paparazzi"
             reward={rewards.paparazzi}
             colorClass="from-purple-500 to-indigo-500"
             description="Post a Story with your bottle. Tag @devidaura.official  . Upload a screenshot showing views."
             buttonText="Upload Story Proof"
             loading={uploading === 'paparazzi'}
             status={getStatus('paparazzi')}
             onClick={() => document.getElementById('paparazzi-upload').click()}
           />
        </div>

        {/* Loyal Follower */}
        <div>
           <input type="file" id="follower-upload" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'loyal_follower')} />
           <LuxuryTaskCard 
             icon={Heart}
             title="Inner Circle"
             reward={rewards.loyal_follower}
             colorClass="from-rose-500 to-pink-500"
             description="Follow us on Instagram. Upload a screenshot showing the 'Following' button."
             buttonText="Upload Follow Proof"
             loading={uploading === 'loyal_follower'}
             status={getStatus('loyal_follower')}
             onClick={() => document.getElementById('follower-upload').click()}
           />
        </div>

        {/* Reviewer */}
        <LuxuryTaskCard 
          icon={Star}
          title="The Critic"
          reward={rewards.reviewer}
          colorClass="from-amber-500 to-yellow-500"
          description="Leave a photo review on your recent purchase. Our system verifies this instantly."
          buttonText="Verify Review"
          loading={uploading === 'reviewer'}
          status={getStatus('reviewer')}
          onClick={() => handleSimpleClaim('reviewer')}
        />

        {/* Lottery */}
        <LuxuryTaskCard 
          icon={Ticket}
          title="Golden Ticket"
          reward={rewards.monthly_lottery}
          colorClass="from-teal-500 to-emerald-500"
          description={`Enter the monthly draw. One lucky member wins ₹${rewards.monthly_lottery} cash credit.`}
          buttonText="Enter Draw"
          loading={uploading === 'monthly_lottery'}
          status={getStatus('monthly_lottery')}
          onClick={() => handleSimpleClaim('monthly_lottery')}
        />
      </div>

      {/* 3. History Section */}
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
             <div>
                <h3 className="font-serif text-xl text-zinc-900">Transaction History</h3>
                <p className="text-xs text-zinc-500 mt-1 font-light">Track your submissions and rewards.</p>
             </div>
             <button onClick={loadData} className="p-3 bg-zinc-50 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-900 transition-colors">
                <RefreshCw size={16} className={loadingData ? "animate-spin" : ""} />
             </button>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50/50 text-[10px] uppercase font-bold text-zinc-400 tracking-widest">
                    <tr>
                        <th className="px-8 py-5">Task Name</th>
                        <th className="px-8 py-5">Reward</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5 text-right">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                    {history.length === 0 ? (
                        <tr><td colSpan="4" className="p-12 text-center text-zinc-400 font-light italic">No activity recorded yet. Start earning above!</td></tr>
                    ) : history.map((item) => (
                        <tr key={item.id} className="group hover:bg-zinc-50/50 transition-colors">
                            <td className="px-8 py-5">
                                <span className="font-medium text-zinc-900 capitalize text-sm">{item.taskType.replace(/_/g, ' ')}</span>
                            </td>
                            <td className="px-8 py-5 font-mono text-zinc-500">
                                ₹{item.rewardAmount}
                            </td>
                            <td className="px-8 py-5">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                    ${item.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-100' : 
                                      item.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-100' : 
                                      'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                    {item.status === 'approved' ? <CheckCircle size={10} /> : item.status === 'rejected' ? <AlertCircle size={10} /> : <Clock size={10} />}
                                    {item.status}
                                </span>
                            </td>
                            <td className="px-8 py-5 text-right text-zinc-400 text-xs font-light">
                                {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}