// file: src/pages/EarnCashTab.jsx
import React, { useState, useEffect } from 'react';
import { Camera, Heart, Star, Ticket, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

// Reusable Card Component
const TaskCard = ({ icon: Icon, title, reward, description, buttonText, onClick, loading, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} mb-4`}>
      <Icon size={24} />
    </div>
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-bold text-gray-900">{title}</h3>
      <span className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">₹{reward}</span>
    </div>
    <p className="text-sm text-gray-500 mb-6 flex-1 leading-relaxed">{description}</p>
    
    <button 
      onClick={onClick}
      disabled={loading}
      className="w-full py-3 rounded-xl bg-zinc-900 text-white font-medium text-sm hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : buttonText}
    </button>
  </motion.div>
);

export default function EarnCashTab({ userId }) {
  const [uploading, setUploading] = useState(null); // 'paparazzi' | 'loyal_follower' etc.
  
  // 🟢 State for Dynamic Rewards (Default values provided in case fetch fails)
  const [rewards, setRewards] = useState({
    paparazzi: 100,
    loyal_follower: 50,
    reviewer: 50,
    monthly_lottery: 500
  });

  // 🟢 Fetch Reward Config on Mount
  useEffect(() => {
    fetch(`${BASE}/api/rewards/config`)
      .then(res => res.json())
      .then(data => {
        if(data && !data.error) {
            setRewards(data);
        }
      })
      .catch(console.error);
  }, []);

  // Handlers
  const handleFileUpload = async (e, taskType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(taskType);
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('taskType', taskType);
    formData.append('proofImage', file);

    try {
      const res = await fetch(`${BASE}/api/rewards/claim`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        window.toast.success(data.message);
      } else {
        window.toast.error(data.error || "Failed to upload");
      }
    } catch (err) {
      console.error(err);
      window.toast.error("Something went wrong");
    } finally {
      setUploading(null);
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
      } else {
        window.toast.error(data.error);
      }
    } catch (err) {
      window.toast.error("Failed to claim");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-8 p-4">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Tasks, Earn Real Cash</h2>
        <p className="text-gray-500">Rewards are added directly to your wallet for your next purchase.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        
        {/* 1. Paparazzi */}
        <div className="relative">
           <input 
             type="file" 
             id="paparazzi-upload" 
             className="hidden" 
             accept="image/*"
             onChange={(e) => handleFileUpload(e, 'paparazzi')}
           />
           <TaskCard 
             icon={Camera}
             title="The Paparazzi"
             reward={rewards.paparazzi} // 🟢 Dynamic Price
             color="bg-purple-50 text-purple-600"
             description="Post a Story with your Devid Aura bottle and tag @devidaura. Upload screenshot of views."
             buttonText="Upload Story Screenshot"
             loading={uploading === 'paparazzi'}
             onClick={() => document.getElementById('paparazzi-upload').click()}
           />
        </div>

        {/* 2. Loyal Follower */}
        <div className="relative">
           <input 
             type="file" 
             id="follower-upload" 
             className="hidden" 
             accept="image/*"
             onChange={(e) => handleFileUpload(e, 'loyal_follower')}
           />
           <TaskCard 
             icon={Heart}
             title="Loyal Follower"
             reward={rewards.loyal_follower} // 🟢 Dynamic Price
             color="bg-rose-50 text-rose-600"
             description="Follow us on Instagram. Upload a screenshot showing the 'Following' button."
             buttonText="Upload Follow Proof"
             loading={uploading === 'loyal_follower'}
             onClick={() => document.getElementById('follower-upload').click()}
           />
        </div>

        {/* 3. Reviewer */}
        <TaskCard 
          icon={Star}
          title="The Reviewer"
          reward={rewards.reviewer} // 🟢 Dynamic Price
          color="bg-amber-50 text-amber-600"
          description="Leave a photo review on your recent purchase. System checks automatically."
          buttonText="Verify Review"
          loading={uploading === 'reviewer'}
          onClick={() => handleSimpleClaim('reviewer')}
        />

        {/* 4. Monthly Lottery */}
        <TaskCard 
          icon={Ticket}
          title="Monthly Lottery" // 🟢 Updated Title
          reward={rewards.monthly_lottery} // 🟢 Dynamic Price
          color="bg-blue-50 text-blue-600"
          description={`One lucky follower wins ₹${rewards.monthly_lottery} every month. Must be following us to win.`} // 🟢 Updated Desc
          buttonText="Enter Draw Free"
          loading={uploading === 'monthly_lottery'} // 🟢 Updated Key
          onClick={() => handleSimpleClaim('monthly_lottery')} // 🟢 Updated Key
        />

      </div>
    </div>
  );
}