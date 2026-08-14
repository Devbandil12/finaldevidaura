import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, ArrowRight, Package, Clock, 
  CreditCard, Star, ChevronRight, User, MapPin, Copy, Check, Share2
} from "lucide-react";
import { motion } from "framer-motion";

import { generateReferralCardBlob } from "../../utils/referralCard"; // 🟢 NEW: designed image share

// 🟢 UPDATED: new template — converted to WhatsApp's real formatting syntax
// (*bold*, not markdown's **bold**; ```monospace```, not single backticks)
const buildReferralShareText = (code) =>
  `✨ *I've been using Devid Aura and absolutely loved it!* 🌸\n\n` +
  `💝 *Your first Devid Aura order comes with a little surprise…*\n\n` +
  `Use my referral code and *₹50 gets added to your wallet instantly!* ✨\n\n` +
  `🎁 *Code:* \`\`\`${code}\`\`\`\n\n` +
  `Treat yourself to your favorite fragrance and enjoy your welcome reward. 💖\n\n` +
  `🛍️ *Shop Now:* https://www.devidaura.com\n\n` +
  `Happy shopping! 💖`;

// --- Components ---

const StatItem = ({ label, value, onClick }) => (
  <div onClick={onClick} className="group cursor-pointer flex flex-col justify-between h-32 p-6 bg-zinc-50 hover:bg-zinc-900 transition-colors duration-500 rounded-[2rem]">
    <div className="flex justify-between items-start">
      <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 group-hover:text-zinc-500 transition-colors">
        {label}
      </span>
      <div className="w-6 h-6 rounded-full border border-zinc-200 group-hover:border-zinc-700 flex items-center justify-center">
        <ArrowRight size={10} className="text-zinc-400 group-hover:text-white -rotate-45 group-hover:rotate-0 transition-all duration-500" />
      </div>
    </div>
    <span className="font-serif text-4xl text-zinc-900 group-hover:text-white transition-colors duration-500">
      {value}
    </span>
  </div>
);

const SectionHeader = ({ title, action, onAction }) => (
  <div className="flex items-baseline justify-between mb-8 px-2">
    <h3 className="font-serif text-2xl text-zinc-900">{title}</h3>
    {action && (
      <button onClick={onAction} className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">
        {action}
      </button>
    )}
  </div>
);

const ActivityRow = ({ item, onClick }) => (
  <div onClick={onClick} className="group flex items-center gap-6 py-6 border-b border-zinc-100 cursor-pointer hover:pl-4 transition-all duration-300">
    <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
      <item.icon size={18} strokeWidth={1.5} />
    </div>
    <div className="flex-1">
      <h4 className="font-serif text-lg text-zinc-900 group-hover:text-amber-600 transition-colors">{item.title}</h4>
      <p className="text-xs text-zinc-400 mt-1 font-sans">{item.subtitle}</p>
    </div>
    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest group-hover:text-zinc-500">
      {item.timeAgo}
    </span>
  </div>
);

export default function OverviewTab({ user, orders, cart, wishlist, address, tickets, userReviews, setActiveTab }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false); // 🟢 NEW: referral code copy/share

  const handleCopyReferral = () => {
    if (!user.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareReferral = async () => {
    if (!user.referralCode) return;
    const code = user.referralCode;
    const text = buildReferralShareText(code);
    try {
      const blob = await generateReferralCardBlob(code);
      const file = new File([blob], "devid-aura-referral.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: "Devid Aura" });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "Devid Aura", text });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "devid-aura-referral.png";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      window.toast?.success?.("Referral card downloaded — attach it to your message!");
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("Referral share failed:", err);
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    }
  };

  // Data Logic
  const recentOrder = orders?.[0];
  const activities = useMemo(() => {
    const all = [
      ...(orders || []).map(o => ({ 
        type: 'order', date: new Date(o.createdAt), title: `Order #${o.id.slice(-6).toUpperCase()}`, 
        subtitle: `${o.status} • ₹${o.totalAmount}`, icon: Package, link: 'orders' 
      })),
      ...(tickets || []).map(t => ({ 
        type: 'ticket', date: new Date(t.createdAt), title: `Support Request`, 
        subtitle: t.subject, icon: User, link: 'support' 
      })),
      ...(userReviews || []).map(r => ({ 
        type: 'review', date: new Date(r.createdAt), title: `Product Review`, 
        subtitle: 'You shared your thoughts', icon: Star, link: 'reviews' 
      }))
    ];
    return all.sort((a, b) => b.date - a.date).slice(0, 4).map(i => ({
      ...i, timeAgo: i.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    }));
  }, [orders, tickets, userReviews]);

  return (
    <div className="animate-fadeIn space-y-12 pb-10">
      
      {/* 1. Header: Personal Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-100">
        <div>
           <h1 className="font-serif text-5xl md:text-6xl text-zinc-900 leading-[0.9]">
             Hello, <br/> <span className="text-zinc-400 italic">{(user.name || '').split(' ')[0] || 'there'}.</span>
           </h1>
           <p className="mt-6 text-zinc-500 font-light max-w-md text-sm leading-relaxed">
          Your personal atelier. Track your collection, manage your aura points, and discover your next signature scent.
        </p>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Member Since</p>
              <p className="font-serif text-xl text-zinc-900">{new Date(user.createdAt || Date.now()).getFullYear()}</p>
           </div>
           <div className="w-px h-10 bg-zinc-100"></div>
           <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Aura Status</p>
              <p className="font-serif text-xl text-zinc-900">Gold</p>
           </div>
        </div>
      </div>

      {/* 2. Hero: Active Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: The "Main Event" (Latest Order) */}
        <div className="lg:col-span-2 relative group cursor-pointer" onClick={() => setActiveTab('orders')}>
           <div className="absolute inset-0 bg-zinc-900 rounded-[2.5rem] transform transition-transform duration-500 group-hover:scale-[1.01]"></div>
           <div className="relative h-full bg-zinc-900 rounded-[2.5rem] p-10 flex flex-col justify-between overflow-hidden">
              {/* Abstract Art */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                 <div className="flex items-center gap-3 text-amber-500">
                    <Clock size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Latest Update</span>
                 </div>
                 {recentOrder && <div className="px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-zinc-300 uppercase tracking-wide">{recentOrder.status}</div>}
              </div>

              <div className="relative z-10 mt-12 mb-8">
                 {recentOrder ? (
                   <>
                     <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
                       Order <span className="text-zinc-500">#{recentOrder.id.slice(-6)}</span>
                     </h2>
                     <p className="text-zinc-400 mt-4 max-w-md font-light leading-relaxed">
                        Currently {(recentOrder.status || '').toLowerCase()}. Track your package for real-time updates.
                     </p>
                   </>
                 ) : (
                   <>
                     <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
                       Your Collection <br/> <span className="text-zinc-600 italic">is empty.</span>
                     </h2>
                     <p className="text-zinc-400 mt-4 max-w-md font-light leading-relaxed">
                        Discover our signature fragrances and start building your aura.
                     </p>
                   </>
                 )}
              </div>

              <div className="relative z-10 flex items-center gap-4">
                 <button className="h-12 px-8 rounded-full bg-white text-zinc-900 font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                    {recentOrder ? 'Track Order' : 'Start Shopping'}
                 </button>
              </div>
           </div>
        </div>

        {/* Right: Quick Stats Column */}
        <div className="space-y-4">
           <StatItem label="Shopping Cart" value={cart?.length || 0} onClick={() => navigate('/cart')} />
           <StatItem label="Wishlist" value={wishlist?.length || 0} onClick={() => navigate('/wishlist')} />
           <StatItem label="Addresses" value={address?.length || 0} onClick={() => setActiveTab('addresses')} />
        </div>
      </div>

      {/* 3. The Feed: Minimal List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8">
         <div className="lg:col-span-8">
            <SectionHeader title="Recent Activity" action="View All" onAction={() => setActiveTab('activity_log')} />
            <div className="flex flex-col">
               {activities.length > 0 ? activities.map((item, i) => (
                  <ActivityRow key={i} item={item} onClick={() => setActiveTab(item.link)} />
               )) : (
                  <div className="py-12 text-center border-y border-zinc-100 text-zinc-400 font-light italic">
                     No recent activity found.
                  </div>
               )}
            </div>
         </div>

         <div className="lg:col-span-4">
            <SectionHeader title="Aura Circle" />
            <div className="bg-[#F5F5F0] rounded-[2.5rem] p-8 text-center relative overflow-hidden">
               <div className="relative z-10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Referral Program</p>
                  <h4 className="font-serif text-3xl text-zinc-900 mb-2">Invite & Earn</h4>
                  <p className="text-zinc-500 text-sm font-light mb-6">Share your code. Get instant wallet credits.</p>

                  {/* 🟢 NEW: the actual code, instead of just a generic pitch */}
                  {user.referralCode ? (
                    <>
                      <button
                        onClick={handleCopyReferral}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-white rounded-2xl border border-zinc-200 mb-3 group/copy"
                      >
                        <span className="font-mono text-lg tracking-wider text-zinc-900">{user.referralCode}</span>
                        {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-zinc-400 group-hover/copy:text-zinc-900 transition-colors" />}
                      </button>
                      <button
                        onClick={handleShareReferral}
                        className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                      >
                        <Share2 size={14} /> Share with a friend
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setActiveTab('wallet')} className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all">
                       View Wallet
                    </button>
                  )}
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}