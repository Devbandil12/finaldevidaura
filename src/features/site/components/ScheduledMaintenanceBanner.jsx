import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ScheduledMaintenanceBanner = ({ status }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  // Live countdown to maintenance start
  useEffect(() => {
    if (!status?.scheduledStart) return;

    const computeTime = () => {
      const now = new Date();
      const start = new Date(status.scheduledStart);
      const diff = start.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('');
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      if (h > 0) {
        setTimeLeft(`${h}h ${m.toString().padStart(2, '0')}m`);
      } else {
        setTimeLeft(`${m}m ${s.toString().padStart(2, '0')}s`);
      }
    };

    computeTime();
    const interval = setInterval(computeTime, 1000);
    return () => clearInterval(interval);
  }, [status?.scheduledStart]);

  if (isDismissed || !status?.scheduledStart) return null;

  const now = new Date();
  const start = new Date(status.scheduledStart);
  if (start <= now) return null; // Already started, will transition to MaintenancePage

  const formattedStart = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(start);

  const formattedEnd = status?.scheduledEnd
    ? new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(status.scheduledEnd))
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-50 bg-gradient-to-r from-amber-950/90 via-amber-900/90 to-amber-950/90 border-b border-amber-500/30 text-amber-200 backdrop-blur-xl shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex-1 flex items-center justify-center gap-2.5 text-center flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase border border-amber-500/30 shrink-0">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Notice
            </span>

            <span className="text-white font-medium">
              Scheduled Maintenance starting{' '}
              <strong className="text-amber-300 font-semibold">{formattedStart}</strong>
              {formattedEnd && (
                <>
                  {' '}until <strong className="text-amber-300 font-semibold">{formattedEnd}</strong>
                </>
              )}
            </span>

            {timeLeft && (
              <span className="inline-flex items-center gap-1 text-amber-300/90 bg-black/40 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold tracking-wide border border-amber-500/20 shrink-0">
                <Clock className="w-3 h-3" />
                Starts in {timeLeft}
              </span>
            )}
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-amber-300/70 hover:text-amber-100 hover:bg-white/10 rounded-full transition-colors shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScheduledMaintenanceBanner;
