import React, { useEffect, useState, useCallback } from 'react';
import { Users, CheckCircle, Clock, Coins, Search, ArrowRight, Settings, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@clerk/clerk-react"; // 🟢 Import Auth

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

// --- StatCard Component ---
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

export default function ReferralsTab() {
  const [data, setData] = useState({ referrals: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({ REFEREE_BONUS: 100, REFERRER_BONUS: 150 });
  const [savingConfig, setSavingConfig] = useState(false);

  // 🟢 Get Token Helper
  const { getToken } = useAuth(); 

  // --- Fetch Data (Secured) ---
  const fetchAll = useCallback(async () => {
    try {
      // 🟢 SECURE: Get Token
      const token = await getToken();
      const headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔒 Attach Token
      };

      // Fetch Data
      const resData = await fetch(`${BASE}/api/referrals/admin/all`, { headers });
      if (resData.ok) {
          const d = await resData.json();
          setData(d);
      }

      // Fetch Config
      const resConfig = await fetch(`${BASE}/api/referrals/config`, { headers });
      if (resConfig.ok) {
          const c = await resConfig.json();
          setConfig(c);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- Save Config (Secured) ---
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      // 🟢 SECURE: Get Token
      const token = await getToken();
      
      const res = await fetch(`${BASE}/api/referrals/config`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // 🔒 Attach Token
        },
        body: JSON.stringify({
          refereeBonus: config.REFEREE_BONUS,
          referrerBonus: config.REFERRER_BONUS
        })
      });

      if (res.ok) {
        if(window.toast) window.toast.success("Offers updated successfully!");
        else alert("Offers updated!");
        setShowSettings(false);
      } else {
        throw new Error("Failed to update");
      }
    } catch (err) {
      console.error(err);
      if(window.toast) window.toast.error("Failed to save settings");
    } finally {
      setSavingConfig(false);
    }
  };

  const filtered = data.referrals.filter(r => 
    r.referrer?.name?.toLowerCase().includes(search.toLowerCase()) || 
    r.referee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.referrer?.referralCode?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center text-gray-400">Loading referrals...</div>;

  return (
    <div className="p-6 space-y-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Referral Program</h2>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showSettings ? 'bg-zinc-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          <Settings size={16} /> Manage Offers
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm mb-6 flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Friend Gets (Welcome Bonus)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                  <input 
                    type="number" 
                    value={config.REFEREE_BONUS}
                    onChange={(e) => setConfig({...config, REFEREE_BONUS: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Amount given immediately to the new user.</p>
              </div>

              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">You Get (Referral Reward)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                  <input 
                    type="number" 
                    value={config.REFERRER_BONUS}
                    onChange={(e) => setConfig({...config, REFERRER_BONUS: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Amount given to referrer after purchase.</p>
              </div>

              <button 
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="w-full md:w-auto h-[46px] px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {savingConfig ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Changes</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Referrals" value={data.stats?.total || 0} color="bg-blue-50 text-blue-600" />
        <StatCard icon={CheckCircle} label="Completed" value={data.stats?.completed || 0} color="bg-green-50 text-green-600" />
        <StatCard icon={Clock} label="Pending" value={data.stats?.pending || 0} color="bg-amber-50 text-amber-600" />
        <StatCard icon={Coins} label="Total Payout (Everyone)" value={`₹${data.stats?.totalPayout || 0}`} color="bg-purple-50 text-purple-600" />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-lg text-gray-900">Referral History</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4">Referrer (From)</th>
                <th className="px-6 py-4">Referee (To)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Friend Got</th>
                <th className="px-6 py-4 text-right">Referrer Gets</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">No referrals found.</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{item.referrer?.name || "Unknown"}</p>
                      <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{item.referrer?.referralCode}</span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <ArrowRight size={14} className="text-gray-300" />
                      <div>
                        <p className="font-medium text-gray-900">{item.referee?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-400">{item.referee?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${item.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                        {item.status}
                      </span>
                    </td>
                    {/* Referee Bonus Column */}
                    <td className="px-6 py-4 text-center font-medium text-teal-600">
                      ₹{item.refereeBonus || 0}
                    </td>
                    {/* Referrer Reward */}
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      ₹{item.rewardAmount}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
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