import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ComingSoonPage = ({ status }) => {
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' });

  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState('idle'); // idle | loading | success | duplicate | error
  const [message, setMessage] = useState('');

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

  // Premium staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitState === 'loading') return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setSubmitState('error');
      setMessage('Please enter your email address.');
      return;
    }

    setSubmitState('loading');
    setMessage('');

    try {
      const backendUrl = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/site/waitlist/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        if (data?.alreadySubscribed || data?.duplicate) {
          setSubmitState('duplicate');
          setMessage(
            data?.message ||
              "You're already on the launch list. We'll notify you when we launch."
          );
        } else {
          setSubmitState('success');
          setMessage(
            data?.message ||
              "You're on the launch list. We'll notify you when we launch."
          );
        }

        setEmail('');
        return;
      }

      setSubmitState('error');
      setMessage(
        data?.message ||
          'Something went wrong. Please try again.'
      );
    } catch (error) {
      console.error('[ComingSoonPage] waitlist subscription failed:', error);

      setSubmitState('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  const isSubmitting = submitState === 'loading';

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-white/20 selection:text-white font-body">

      {/* --- Ambient Cinematic Background --- */}
      {/* Subtle Noise Overlay */}
      <div className="absolute inset-0 mix-blend-overlay opacity-30 pointer-events-none bg-[url('/noise.png')]" />

      {/* Deep Space Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-white/5 blur-[120px] rounded-[100%] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[var(--accent)]/10 blur-[150px] rounded-full pointer-events-none" />

      {/* --- Main Content --- */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center w-full max-w-4xl mx-auto"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center gap-2.5 bg-white/5 ring-1 ring-white/10 px-4 py-1.5 rounded-full backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <Sparkles className="w-3.5 h-3.5 text-white/80" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-white/80 uppercase mt-px">
              Devid Aura
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl sm:text-6xl md:text-8xl font-display font-medium tracking-tighter mb-6 text-center bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent leading-[1.1] pb-2"
        >
          {status?.title || 'Something Beautiful Is Coming.'}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-white/50 text-base md:text-xl max-w-2xl text-center mb-14 font-medium leading-relaxed tracking-wide"
        >
          {status?.message ||
            'We are crafting a revolutionary experience. Be the first to know when we launch.'}
        </motion.p>

        {/* Countdown Timer */}
        {status?.showCountdown && status?.scheduledEnd && (
          <motion.div variants={itemVariants} className="mb-16 w-full max-w-xl">
            <div className="flex items-center justify-between sm:justify-center w-full bg-white/[0.02] ring-1 ring-white/10 backdrop-blur-2xl rounded-3xl sm:rounded-full p-2 shadow-2xl relative overflow-hidden">

              {/* Glass shine reflection */}
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

                  {/* Hairline Separators */}
                  {i !== arr.length - 1 && (
                    <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-white/15 to-transparent relative z-10" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}

        {/* Unified Input Form */}
        <motion.form
          variants={itemVariants}
          className="w-full max-w-md relative group"
          onSubmit={handleSubmit}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0 rounded-full blur opacity-0 group-focus-within:opacity-100 transition duration-700"></div>

          <div className="relative flex items-center bg-white/5 ring-1 ring-white/10 rounded-full p-1.5 backdrop-blur-xl transition-all duration-300 group-focus-within:bg-white/10 group-focus-within:ring-white/20 shadow-2xl">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (submitState !== 'idle') {
                  setSubmitState('idle');
                  setMessage('');
                }
              }}
              placeholder="Enter your email address..."
              className="flex-1 bg-transparent border-none px-5 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-0 font-medium tracking-wide"
              required
              disabled={isSubmitting}
              autoComplete="email"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-white text-black font-bold text-[11px] uppercase tracking-widest rounded-full px-6 py-3 hover:scale-[1.02] hover:bg-zinc-200 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_0_20px_rgba(255,255,255,0.3)] shrink-0 disabled:opacity-60 disabled:hover:scale-100"
            >
              {isSubmitting ? 'Sending...' : 'Notify Me'}
              {!isSubmitting && (
                <ArrowRight size={14} strokeWidth={2.5} className="ml-1" />
              )}
            </button>
          </div>

          {/* Feedback — does not alter the existing form design */}
          {message && (
            <div
              className={`mt-4 text-center text-xs font-medium tracking-wide ${
                submitState === 'success' || submitState === 'duplicate'
                  ? 'text-white/60'
                  : 'text-red-300/80'
              }`}
              aria-live="polite"
            >
              {message}
            </div>
          )}
        </motion.form>
      </motion.div>
    </div>
  );
};

export default ComingSoonPage;