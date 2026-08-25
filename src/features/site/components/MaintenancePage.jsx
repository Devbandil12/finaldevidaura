import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

const MaintenancePage = ({ status }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!status?.scheduledEnd || !status?.serverTime || !status.showCountdown) return;
    
    // serverTime is the time we got the response. Let's compute offset.
    const serverDate = new Date(status.serverTime);
    const localDate = new Date();
    const offset = localDate.getTime() - serverDate.getTime();

    const interval = setInterval(() => {
      const now = new Date();
      const adjustedNow = new Date(now.getTime() - offset);
      const end = new Date(status.scheduledEnd);
      const diff = end - adjustedNow;

      if (diff <= 0) {
        setTimeLeft('00 : 00 : 00');
        clearInterval(interval);
        // Page might reload when status goes back to LIVE, handled by React Query
        return;
      }

      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${h.toString().padStart(2, '0')} : ${m.toString().padStart(2, '0')} : ${s.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <ShieldAlert className="w-16 h-16 text-amber-500 mb-6" />
      <h1 className="text-3xl md:text-5xl font-bold font-sans tracking-tight mb-4 text-center">
        {status?.title || 'Devid Aura'}
      </h1>
      
      <p className="text-zinc-400 text-lg md:text-xl max-w-lg text-center mb-10">
        {status?.message || 'We are currently down for scheduled maintenance. We will be back shortly.'}
      </p>

      {status?.showCountdown && status?.scheduledEnd && timeLeft && (
        <div className="flex flex-col items-center p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 backdrop-blur-xl">
          <span className="text-sm text-zinc-500 uppercase tracking-widest mb-2 font-medium">Estimated Time Remaining</span>
          <div className="text-4xl md:text-6xl font-light tracking-wider font-mono text-amber-500">
            {timeLeft}
          </div>
        </div>
      )}
      
      <div className="mt-16 flex items-center gap-2 text-zinc-600 text-sm">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        System engineers are at work
      </div>
    </div>
  );
};

export default MaintenancePage;
