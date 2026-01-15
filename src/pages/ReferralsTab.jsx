// file: src/pages/ReferralsTab.jsx
import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, Clock, Coins, Search, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

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

  useEffect(() => {
    fetch(`${BASE}/api/referrals/admin/all`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, []);

  const filtered = data.referrals.filter(r => 
    r.referrer?.name?.toLowerCase().includes(search.toLowerCase()) || 
    r.referee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.referrer?.referralCode?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center text-gray-400">Loading referrals...</div>;

  return (
    <div className="p-6 space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Referrals" value={data.stats?.total || 0} color="bg-blue-50 text-blue-600" />
        <StatCard icon={CheckCircle} label="Completed" value={data.stats?.completed || 0} color="bg-green-50 text-green-600" />
        <StatCard icon={Clock} label="Pending" value={data.stats?.pending || 0} color="bg-amber-50 text-amber-600" />
        <StatCard icon={Coins} label="Total Payout" value={`₹${data.stats?.totalPayout || 0}`} color="bg-purple-50 text-purple-600" />
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
                <th className="px-6 py-4">Reward</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400">No referrals found.</td></tr>
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
                    <td className="px-6 py-4 font-medium text-gray-900">
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