import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, Wrench, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

const MaintenancePage = ({ status }) => {
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' });
  const [isFinished, setIsFinished] = useState(false);
  const queryClient = useQueryClient();

  // Enforce dark mode on <html> and <body> while Maintenance page is active
  useEffect(() => {
    const root = document.documentElement;
    const prevClass = root.classList.contains('dark');
    const prevTheme = root.getAttribute('data-theme');
    const prevColorScheme = root.style.colorScheme;
    const prevBg = document.body.style.backgroundColor;

    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
    document.body.style.backgroundColor = '#050505';

    return () => {
      if (!prevClass) {
        root.classList.remove('dark');
      }
      if (prevTheme) {
        root.setAttribute('data-theme', prevTheme);
      } else {
        root.removeAttribute('data-theme');
      }
      root.style.colorScheme = prevColorScheme || '';
      document.body.style.backgroundColor = prevBg || '';
    };
  }, []);

  // Compute live countdown and auto-reactivate when finished
  useEffect(() => {
    if (!status?.scheduledEnd) return;

    const serverDate = status.serverTime ? new Date(status.serverTime) : new Date();
    const localDate = new Date();
    const offset = localDate.getTime() - serverDate.getTime();

    const interval = setInterval(() => {
      const now = new Date();
      const adjustedNow = new Date(now.getTime() - offset);
      const end = new Date(status.scheduledEnd);
      const diff = end - adjustedNow;

      if (diff <= 0) {
        setTimeLeft({ d: '00', h: '00', m: '00', s: '00' });
        setIsFinished(true);
        clearInterval(interval);
        // Instantly trigger status refetch and auto-reload to restore storefront cleanly
        queryClient.invalidateQueries({ queryKey: ['siteStatus'] });
        setTimeout(() => {
          window.location.reload();
        }, 600);
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

  // Format the expected completion date & time
  const formattedEndTime = React.useMemo(() => {
    if (!status?.scheduledEnd) return null;
    try {
      const date = new Date(status.scheduledEnd);
      return new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return null;
    }
  }, [status?.scheduledEnd]);

  // Staggered motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25, filter: 'blur(8px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-white/20 selection:text-white font-body">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-500/10 blur-[140px] rounded-[100%] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-amber-600/5 blur-[160px] rounded-full pointer-events-none" />

      {/* Main Content Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center w-full max-w-3xl mx-auto text-center"
      >
        {/* Brand & Status Badge */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="inline-flex items-center gap-2.5 bg-amber-500/10 ring-1 ring-amber-500/20 px-4 py-1.5 rounded-full backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.08)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-amber-300 uppercase mt-px">
              Devid Aura • Scheduled Maintenance
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-7xl font-display font-medium tracking-tight mb-6 bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent leading-[1.15]"
        >
          {status?.title || 'We Will Be Back Soon.'}
        </motion.h1>

        {/* Message / Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-white/60 text-base md:text-xl max-w-xl text-center mb-12 font-medium leading-relaxed tracking-wide"
        >
          {status?.message ||
            'We are currently performing scheduled maintenance to upgrade our systems and elevate your experience.'}
        </motion.p>

        {/* Expected Completion Banner */}
        {formattedEndTime && (
          <motion.div variants={itemVariants} className="mb-10 w-full max-w-md">
            <div className="flex items-center justify-center gap-3 bg-white/[0.03] ring-1 ring-white/10 px-5 py-3 rounded-2xl backdrop-blur-xl">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs sm:text-sm text-white/80 font-medium tracking-wide">
                Expected Back By:{' '}
                <strong className="text-white font-semibold">{formattedEndTime}</strong>
              </span>
            </div>
          </motion.div>
        )}

        {/* Live Countdown Clock */}
        {status?.scheduledEnd && (
          <motion.div variants={itemVariants} className="mb-12 w-full max-w-xl">
            <div className="flex items-center justify-between sm:justify-center w-full bg-white/[0.02] ring-1 ring-white/10 backdrop-blur-2xl rounded-3xl sm:rounded-full p-2 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

              {[
                { label: 'Days', value: timeLeft.d },
                { label: 'Hours', value: timeLeft.h },
                { label: 'Minutes', value: timeLeft.m },
                { label: 'Seconds', value: timeLeft.s },
              ].map((unit, i, arr) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center justify-center w-20 sm:w-28 py-3 relative z-10">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-white mb-1 tracking-tight tabular-nums">
                      {unit.value}
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">
                      {unit.label}
                    </span>
                  </div>

                  {i !== arr.length - 1 && (
                    <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-white/15 to-transparent relative z-10" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}

        {/* System Status Footer */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2.5 text-xs text-white/40 font-medium tracking-wide"
        >
          <Wrench className="w-3.5 h-3.5 text-amber-400/80" />
          <span>Our engineering team is actively at work</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MaintenancePage;

