import React, { useState, useEffect } from 'react';
import { Loader2, Ticket, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

export default function CouponsTab({ userId }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (userId) {
      fetch(`${BASE}/api/coupons/available?userId=${userId}`)
        .then(res => res.json()).then(data => setOffers(Array.isArray(data) ? data : []))
        .catch(err => console.error(err)).finally(() => setLoading(false));
    }
  }, [userId]);

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    if (window.toast) window.toast.success("Code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="text-center py-32"><Loader2 className="animate-spin inline text-zinc-300" /></div>;

  return (
    <div className="space-y-8 animate-fadeIn">
       <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-zinc-100">
        <div>
          <h2 className="font-serif text-3xl font-medium text-zinc-900 tracking-tight">Your Privileges</h2>
          <p className="text-zinc-500 font-light text-sm mt-1 font-sans">Exclusive offers curated for you.</p>
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-zinc-50 rounded-[2rem]">
          <Ticket className="w-12 h-12 text-zinc-300 mb-4" strokeWidth={1} />
          <p className="text-zinc-400 font-light">No coupons available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map((offer, i) => {
                const isCopied = copiedId === offer.id;
                return (
                    <motion.div 
                        key={offer.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="group relative bg-white border border-zinc-100 rounded-[1.5rem] p-0 shadow-sm hover:shadow-lg transition-all overflow-hidden flex"
                    >
                         {/* Left Side: Decor */}
                         <div className="w-3 bg-gradient-to-b from-amber-300 to-amber-600"></div>
                         
                         {/* Content */}
                         <div className="flex-1 p-6 flex justify-between items-center relative">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-mono text-lg font-bold text-zinc-900 tracking-wider uppercase">{offer.code}</span>
                                    {offer.isAutomatic && <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[9px] font-bold uppercase rounded-md border border-teal-100">Auto</span>}
                                </div>
                                <h3 className="font-serif text-3xl font-medium text-amber-600">
                                    {offer.discountValue}{offer.discountType === 'percent' ? '%' : '₹'} OFF
                                </h3>
                                <p className="text-xs text-zinc-500 mt-1 font-light max-w-[200px] leading-relaxed">
                                    {offer.description}
                                </p>
                            </div>

                            {/* Copy Button */}
                            <button 
                                onClick={() => handleCopy(offer.code, offer.id)} 
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all z-10 ${isCopied ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-400 hover:bg-amber-50 hover:text-amber-600'}`}
                            >
                                {isCopied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                         </div>
                         
                         {/* Perforated Edge Effect */}
                         <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-zinc-100 z-20"></div>
                         <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-zinc-100 z-20"></div>
                    </motion.div>
                )
            })}
        </div>
      )}
    </div>
  );
}