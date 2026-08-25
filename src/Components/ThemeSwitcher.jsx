import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'theme';

/* Breathing room on top of --switch-duration before the forced timeline is
   released. It MUST outlast the fade: section 23 pins transition-property to
   four colour longhands, so an element with no transition utility of its own
   loses its transition-property the moment the attribute goes, and a running
   transition whose property is no longer listed is cancelled outright — it
   would snap to its final colour mid-fade. That snap is the exact artefact
   this whole fix exists to remove. */
const RELEASE_MARGIN_MS = 90;

/* Ceiling, so a typo in the token can never wedge the attribute on. */
const MAX_SWITCH_MS = 2000;

/* The duration lives in CSS, not here. Reading it back means --switch-duration
   in index.css stays the single tuning knob and the two can never drift. */
const readSwitchDuration = () => {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--switch-duration')
    .trim();

  const value = parseFloat(raw);
  if (!Number.isFinite(value) || value <= 0) return 450;

  const ms = raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : 450;
  return Math.min(ms, MAX_SWITCH_MS);
};

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  /* Identifies the switch currently in flight. Without it, a fast double
     toggle lets the first switch's cleanup strip the attribute out from
     under the second one, which drops that switch back onto the ~986
     per-component Tailwind durations. */
  const switchId = useRef(0);
  const releaseTimer = useRef(null);

  useEffect(() => {
    /* Mount does NOT write the theme class. The inline script in index.html
       already applied it before first paint; writing it again here was a
       redundant DOM mutation that also woke the three dashboard chart
       MutationObservers on every mount. */
    setMounted(true);
    return () => {
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
    };
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next = theme === 'light' ? 'dark' : 'light';

    const commit = () => {
      root.classList.toggle('dark', next === 'dark');
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        /* private mode / quota — the switch itself must still happen */
      }
      setTheme(next);
    };

    if (releaseTimer.current) {
      clearTimeout(releaseTimer.current);
      releaseTimer.current = null;
    }

    /* Honour the OS setting: no cross-fade, no forced timeline, just switch.
       Section 22 of index.css already clamps every transition to 0.01ms. */
    if (prefersReducedMotion()) {
      root.removeAttribute('data-theme-switching');
      commit();
      return;
    }

    const id = ++switchId.current;
    const release = () => {
      if (switchId.current !== id) return;
      root.removeAttribute('data-theme-switching');
      releaseTimer.current = null;
    };

    /* ---------------------------------------------------------------
       Preferred path — one compositor cross-fade of the whole page.
       The browser snapshots the old frame, the theme is applied
       instantly with every element transition suppressed, then old and
       new are cross-faded on the GPU. That means the 71 backdrop-blur
       surfaces re-blur twice for the whole switch instead of once per
       frame, and shadows, filters and mix-blend-mode surfaces resolve
       once instead of once per frame.

       This is why the fade can afford to be 450ms here: the cost of
       the path does not grow with its duration. No timer is needed
       either — transition.finished resolves when the cross-fade ends,
       however long --switch-duration makes that.
       --------------------------------------------------------------- */
    if (typeof document.startViewTransition === 'function') {
      root.setAttribute('data-theme-switching', 'snapshot');
      const transition = document.startViewTransition(commit);
      transition.finished.then(release, release);
      return;
    }

    /* ---------------------------------------------------------------
       Fallback path — force every element onto the single timeline
       defined in section 23 of index.css for the length of the switch,
       then hand control back so components keep their own hover
       durations.

       Read the duration BEFORE mutating the class. getComputedStyle
       flushes pending style, so doing it after would mean a forced
       recalc on the frame the fade is trying to start on.
       --------------------------------------------------------------- */
    const releaseAfter = readSwitchDuration() + RELEASE_MARGIN_MS;

    root.setAttribute('data-theme-switching', 'fade');
    commit();
    releaseTimer.current = window.setTimeout(release, releaseAfter);
  };

  if (!mounted) return null;

  return createPortal(
    <button
      onClick={toggleTheme}
      type="button"
      style={{ zIndex: 999999 }}
      /* transition-transform, not transition-all: the button's own colours
         are theme tokens, so they are already carried by the switch
         timeline. transition-all here meant this button animated its
         background on a third clock (300ms) during every switch. */
      className="fixed bottom-8 right-8 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--text)] text-[var(--bg)] shadow-2xl hover:scale-110 active:scale-95 focus-visible:ring-4 focus-visible:ring-blue-500 transition-transform duration-300 outline-none"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-pressed={theme === 'dark'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Sun className="w-5 h-5" aria-hidden="true" />
      )}
    </button>,
    document.body
  );
};

export default ThemeSwitcher;