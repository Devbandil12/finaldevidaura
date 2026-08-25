import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const ComingSoonPage = ({ status }) => {
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' });

  useEffect(() => {
    if (!status?.scheduledEnd || !status?.serverTime || !status.showCountdown) return;
    
    const serverDate = new Date(status.serverTime);
    const localDate = new Date();
    const offset = localDate.getTime() - serverDate.getTime();

    const interval = setInterval(() => {
      const now = new Date();
      const adjustedNow = new Date(now.getTime() - offset);
      const end = new Date(status.scheduledEnd);
      const diff = end - adjustedNow;

      if (diff <= 0) {
        setTimeLeft({ d: '00', h: '00', m: '00', s: '00' });
        clearInterval(interval);
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        d: d.toString().padStart(2, '0'),
        h: h.toString().padStart(2, '0'),
        m: m.toString().padStart(2, '0'),
        s: s.toString().padStart(2, '0'),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-6 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium tracking-wide text-indigo-100 uppercase">Devid Aura</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold font-sans tracking-tighter mb-6 text-center bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent max-w-3xl leading-tight">
          {status?.title || 'Something Beautiful Is Coming.'}
        </h1>
        
        <p className="text-zinc-400 text-lg md:text-2xl max-w-xl text-center mb-16 font-light">
          {status?.message || 'We are crafting a revolutionary experience. Be the first to know when we launch.'}
        </p>

        {status?.showCountdown && status?.scheduledEnd && (
          <div className="flex gap-4 md:gap-8 mb-16">
            {[
              { label: 'Days', value: timeLeft.d },
              { label: 'Hours', value: timeLeft.h },
              { label: 'Minutes', value: timeLeft.m },
              { label: 'Seconds', value: timeLeft.s }
            ].map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="text-4xl md:text-6xl font-light tracking-wider font-mono text-white mb-2">
                  {unit.value}
                </div>
                <span className="text-xs md:text-sm text-zinc-500 uppercase tracking-widest font-medium">{unit.label}</span>
              </div>
            ))}
          </div>
        )}

        <form className="flex flex-col md:flex-row gap-3 w-full max-w-md" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder="Enter your email address" 
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
          <button className="bg-white text-black font-semibold rounded-xl px-8 py-4 hover:bg-zinc-200 transition-colors">
            Notify Me
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComingSoonPage;
